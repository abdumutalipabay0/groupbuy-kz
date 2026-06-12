import type {
  AiBuyerResponse,
  ApiResponse,
  AuthResponse,
  Group,
  GroupDetail,
  JoinGroupResponse,
  Product,
  ProductDetail,
  RegisterRequest,
  SellerProductInput,
  SimRequestResponse,
  User
} from "@/types";
import { useGroupBuyStore } from "@/lib/store";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

// When the backend can't be reached at all (e.g. the Vercel-hosted demo with
// no API), fall back to the bundled in-browser demo API once and stay there.
let demoMode = false;

/** Preview mode forces the in-browser demo API (no backend, no real account). */
export function forceDemoMode(on: boolean): void {
  demoMode = on;
  if (on) window.dispatchEvent(new Event("groupbuy:demo-mode"));
}

async function demoFallback<T>(path: string, init?: RequestInit): Promise<T> {
  if (!demoMode) {
    demoMode = true;
    window.dispatchEvent(new Event("groupbuy:demo-mode"));
    console.info("[groupbuy] backend unreachable — switching to bundled demo data");
  }
  const { demoRequest } = await import("@/lib/demo");
  return demoRequest<T>(path, init);
}

// Pre-auth endpoints must NOT carry a token — a stale token in the header makes
// DRF reject the request (401) before the view even runs, which would otherwise
// make it impossible to log in after the token expires.
const AUTH_FREE_PATHS = ["/auth/login", "/auth/register", "/auth/sim/request"];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (demoMode) return demoFallback<T>(path, init);

  const pathname = path.split("?")[0];
  const token = AUTH_FREE_PATHS.includes(pathname) ? null : useGroupBuyStore.getState().token;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(init?.headers ?? {})
      }
    });
  } catch {
    return demoFallback<T>(path, init);
  }
  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new Error(response.statusText || "Request failed");
    }
    throw new Error("Invalid API response");
  }
  // A stale/invalid token on an authenticated request → self-heal by logging out.
  if (response.status === 401 && token) {
    useGroupBuyStore.getState().clear();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  if (!response.ok || !body.success || body.data === null) {
    throw new Error(body.message || response.statusText || "Request failed");
  }
  return body.data;
}

export const api = {
  // ---- auth + SIM/eSIM
  simRequest(phone: string, purpose: "register" | "login" = "register"): Promise<SimRequestResponse> {
    return request<SimRequestResponse>("/auth/sim/request", {
      method: "POST",
      body: JSON.stringify({ phone, purpose })
    });
  },
  register(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(phone: string, secret: { password?: string; code?: string }): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, ...secret })
    });
  },
  me(): Promise<User> {
    return request<User>("/auth/me");
  },
  myGroups(): Promise<GroupDetail[]> {
    return request<GroupDetail[]>("/me/groups");
  },

  // ---- catalog
  products(params: URLSearchParams): Promise<Product[]> {
    const query = params.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ""}`);
  },
  product(id: string): Promise<ProductDetail> {
    return request<ProductDetail>(`/products/${id}`);
  },
  feed(userId: string, limit = 20): Promise<Product[]> {
    return request<Product[]>(`/feed?user_id=${encodeURIComponent(userId)}&limit=${limit}`);
  },
  groups(): Promise<Group[]> {
    return request<Group[]>("/groups");
  },
  group(id: string): Promise<GroupDetail> {
    return request<GroupDetail>(`/groups/${id}`);
  },
  joinGroup(groupId: string, userId: string): Promise<JoinGroupResponse> {
    return request<JoinGroupResponse>(`/groups/${groupId}/join`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId })
    });
  },
  aiBuyer(query: string, userId: string): Promise<AiBuyerResponse> {
    return request<AiBuyerResponse>("/ai/buyer", {
      method: "POST",
      body: JSON.stringify({ query, user_id: userId })
    });
  },

  // ---- seller cabinet
  sellerProducts(): Promise<Product[]> {
    return request<Product[]>("/seller/products");
  },
  createSellerProduct(payload: SellerProductInput): Promise<Product> {
    return request<Product>("/seller/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  deleteSellerProduct(id: string): Promise<{ id: string }> {
    return request<{ id: string }>(`/seller/products/${id}`, { method: "DELETE" });
  }
};
