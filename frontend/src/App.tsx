import { useState } from "react";
import { Settings } from "lucide-react";
import type { Page } from "@/types";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardPage } from "@/pages/DashboardPage";
import { POManagementPage } from "@/pages/POManagementPage";
import { TechPackPage } from "@/pages/TechPackPage";
import { SamplePage } from "@/pages/SamplePage";
import { MaterialOrderPage } from "@/pages/MaterialOrderPage";
import { ReconciliationPage } from "@/pages/ReconciliationPage";
import { StickerPackingPage } from "@/pages/StickerPackingPage";
import { ShippingPage } from "@/pages/ShippingPage";
import { UserManagementPage } from "@/pages/UserManagementPage";
import { ReferenceDataPage } from "@/pages/ReferenceDataPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

function MainApp() {
  const [page, setPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Noto Sans KR', -apple-system, sans-serif" }}>
      <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
        <Sidebar current={page} onNavigate={(p) => { setPage(p); setNotifOpen(false); }} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header page={page} dark={dark} onToggleDark={() => setDark(!dark)} notifOpen={notifOpen} onToggleNotif={() => setNotifOpen((v) => !v)} />
          <main className="flex-1 overflow-auto" onClick={() => setNotifOpen(false)}>
            {page === "dashboard" && <DashboardPage />}
            {page === "po" && <POManagementPage />}
            {page === "techpack" && <TechPackPage />}
            {page === "sample" && <SamplePage />}
            {page === "material" && <MaterialOrderPage />}
            {page === "reconciliation" && <ReconciliationPage />}
            {page === "sticker" && <StickerPackingPage />}
            {page === "shipping" && <ShippingPage />}
            {page === "reference" && <ReferenceDataPage />}
            {page === "users" && <UserManagementPage />}
            {page === "settings" && <PlaceholderPage title="설정" desc="시스템 환경설정 및 알림 설정을 관리합니다" icon={Settings} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainApp /> : <LoginPage />;
}

// ── App Root ──────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
