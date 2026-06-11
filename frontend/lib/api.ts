import type {
  ApiResponse,
  Group,
  GroupDetail,
  JoinGroupResponse,
  Product,
  ProductDetail,
  RegisterPayload,
  RegisterResponse
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === null) {
    throw new Error(body.message || "Request failed");
  }
  return body.data;
}

export const api = {
  register(payload: RegisterPayload): Promise<RegisterResponse> {
    return request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
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
  }
};
