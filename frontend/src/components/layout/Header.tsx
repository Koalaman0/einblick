import { ChevronRight, Search, Moon, Sun, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";
import { notifications } from "@/data/mockData";

export const breadcrumbMap: Record<Page, string> = {
  dashboard: "대시보드", po: "PO 관리", techpack: "TECH PACK / ARTWORK 관리",
  sample: "샘플 관리", material: "자재 발주 관리", reconciliation: "PO 자동 대사",
  sticker: "스티커 · 패킹 관리", shipping: "출고 관리", reference: "기준정보 관리",
  users: "사용자 관리", settings: "설정",
};

export function Header({ page, dark, onToggleDark, notifOpen, onToggleNotif }: {
  page: Page; dark: boolean; onToggleDark: () => void;
  notifOpen: boolean; onToggleNotif: () => void;
}) {
  return (
    <header className="h-12 bg-white border-b border-[#E2E8F0] flex items-center px-5 gap-3 shrink-0 z-10">
      <div className="flex items-center gap-1.5 text-[12px] flex-1 min-w-0">
        <span className="text-[#CBD5E1]">한림 OUTERSTUFF</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
        <span className="text-[#0F172A] font-medium truncate">{breadcrumbMap[page]}</span>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          placeholder="전체 검색..."
          className="w-52 h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-8 text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-1 rounded border border-[#E2E8F0]">⌘K</kbd>
      </div>

      <button onClick={onToggleDark} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition-colors">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="relative">
        <button onClick={onToggleNotif} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#0F172A]">알림</span>
                <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">4</span>
              </div>
              <button className="text-[11px] text-[#2563EB] hover:underline">모두 읽음</button>
            </div>
            <div className="divide-y divide-[#F8FAFC] max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", n.type === "danger" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-[#0F172A]">{n.title}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{n.desc}</div>
                      <div className="text-[11px] text-[#94A3B8] mt-1">{n.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
