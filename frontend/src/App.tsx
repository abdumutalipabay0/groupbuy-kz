import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { useGroupBuyStore } from "@/lib/store";
import { AiBuyerPage } from "@/pages/AiBuyerPage";
import { LandingPage } from "@/pages/LandingPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { LoginPage } from "@/pages/LoginPage";
import { FeedPage } from "@/pages/FeedPage";
import { GroupsPage } from "@/pages/GroupsPage";
import { ProductPage } from "@/pages/ProductPage";
import { JoinPage } from "@/pages/JoinPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SellerAdminPage } from "@/pages/SellerAdminPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useGroupBuyStore((s) => s.token);
  const preview = useGroupBuyStore((s) => s.preview);
  return token || preview ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireSeller({ children }: { children: ReactNode }) {
  const token = useGroupBuyStore((s) => s.token);
  const role = useGroupBuyStore((s) => s.userProfile?.role);
  if (!token) return <Navigate to="/login" replace />;
  return role === "seller" ? <>{children}</> : <Navigate to="/feed" replace />;
}

function RootLanding() {
  const token = useGroupBuyStore((s) => s.token);
  const preview = useGroupBuyStore((s) => s.preview);
  return token || preview ? <Navigate to="/feed" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<RootLanding />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/feed" element={<RequireAuth><FeedPage /></RequireAuth>} />
        <Route path="/ai" element={<RequireAuth><AiBuyerPage /></RequireAuth>} />
        <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
        <Route path="/product/:id" element={<RequireAuth><ProductPage /></RequireAuth>} />
        <Route path="/join/:groupId" element={<RequireAuth><JoinPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/seller" element={<RequireSeller><SellerAdminPage /></RequireSeller>} />
        <Route path="*" element={<RootLanding />} />
      </Route>
    </Routes>
  );
}
