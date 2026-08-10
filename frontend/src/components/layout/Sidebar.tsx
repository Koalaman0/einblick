import {
  LayoutDashboard, FileText, Layers, Package2, ShoppingCart,
  ArrowLeftRight, Tag, Truck, Database, Users, Settings, ChevronDown, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";

export const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "po", label: "PO 관리", icon: FileText, badge: undefined },
  { id: "techpack", label: "TECH PACK / ARTWORK", icon: Layers },
  { id: "sample", label: "샘플 관리", icon: Package2 },
  { id: "material", label: "자재 발주 관리", icon: ShoppingCart },
  { id: "reconciliation", label: "PO 자동 대사", icon: ArrowLeftRight, badge: 12 },
  { id: "sticker", label: "스티커 · 패킹 관리", icon: Tag },
  { id: "shipping", label: "출고 관리", icon: Truck },
  { id: "reference", label: "기준정보 관리", icon: Database },
  { id: "users", label: "사용자 관리", icon: Users },
  { id: "settings", label: "설정", icon: Settings },
];

export function Sidebar({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  return (
    <div className="w-[220px] h-full bg-[#0F172A] flex flex-col shrink-0 select-none">
      <div className="px-4 py-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white text-[13px] font-semibold leading-tight">한림 OUTERSTUFF</div>
            <div className="text-[#475569] text-[11px]">업무관리시스템 v1.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-100 text-left group",
                active ? "bg-[#2563EB] text-white font-medium" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-2.5 py-3 border-t border-[#1E293B]">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition-colors">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">김</div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[#E2E8F0] text-[12px] font-medium truncate">김민준 팀장</div>
            <div className="text-[#475569] text-[11px] truncate">생산관리팀</div>
          </div>
          <ChevronDown className="w-3 h-3 text-[#475569] shrink-0" />
        </button>
      </div>
    </div>
  );
}
