import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingMethod, Status } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShippingBadge } from "@/components/common/ShippingBadge";

// ── Shipping ───────────────────────────────────────────────
type CalEvent = { type: ShippingMethod; po: string; label: string; warn?: boolean };
const calEvents: Record<number, CalEvent[]> = {
  5: [{ type: "AIR", po: "PO-0825", label: "UA" }],
  8: [{ type: "BOAT", po: "PO-0824", label: "아디다스" }],
  12: [{ type: "AIR", po: "PO-0828", label: "나이키", warn: true }, { type: "SPLIT", po: "PO-0826", label: "NB", warn: true }],
  15: [{ type: "BOAT", po: "PO-0827", label: "휠라" }],
  20: [{ type: "AIR", po: "PO-0829", label: "아디다스" }],
  25: [{ type: "BOAT", po: "PO-0830", label: "나이키" }],
  28: [{ type: "SPLIT", po: "PO-0831", label: "UA", warn: true }],
};
const shippingList = [
  { po: "PO-2024-0825", style: "UA-SET-2401", brand: "Under Armour", date: "2024-07-05", method: "AIR" as ShippingMethod, qty: 500, status: "완료" as Status, warn: false },
  { po: "PO-2024-0824", style: "AD-PNT-2403", brand: "Adidas", date: "2024-07-08", method: "BOAT" as ShippingMethod, qty: 800, status: "완료" as Status, warn: false },
  { po: "PO-2024-0826", style: "NB-JKT-2402", brand: "New Balance", date: "2024-07-12", method: "SPLIT" as ShippingMethod, qty: 1000, status: "지연" as Status, warn: true },
  { po: "PO-2024-0828", style: "NK-TOP-2405", brand: "Nike", date: "2024-07-12", method: "AIR" as ShippingMethod, qty: 600, status: "대기" as Status, warn: true },
  { po: "PO-2024-0827", style: "FL-PNT-2401", brand: "FILA", date: "2024-07-15", method: "BOAT" as ShippingMethod, qty: 1500, status: "진행중" as Status, warn: false },
];
const eventBg: Record<ShippingMethod, string> = { AIR: "bg-sky-500", BOAT: "bg-teal-500", SPLIT: "bg-violet-500" };
const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export function ShippingPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const firstDay = new Date(2024, 6, 1).getDay();

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">출고 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">2024년 7월 출고 일정</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#F1F5F9] rounded-lg p-0.5">
            {(["calendar", "list"] as const).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors", view === m ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]")}>
                {m === "calendar" ? "캘린더" : "목록"}
              </button>
            ))}
          </div>
          <button className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />출고 등록</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {([["AIR", "항공", "bg-sky-500"], ["BOAT", "선박", "bg-teal-500"], ["SPLIT", "분할", "bg-violet-500"]] as [string, string, string][]).map(([k, l, c]) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <div className={cn("w-2.5 h-2.5 rounded-full", c)} />{k} ({l})
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px] text-red-500">
          <AlertTriangle className="w-3.5 h-3.5" />규칙 위반
        </div>
      </div>

      {view === "calendar" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {dayNames.map((d) => (
              <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-[#64748B]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="h-[90px] border-b border-r border-[#F8FAFC] bg-[#FAFAFA]" />
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const evs = calEvents[day] ?? [];
              const isToday = day === 10;
              return (
                <div key={day} className={cn("h-[90px] border-b border-r border-[#F8FAFC] p-1.5 hover:bg-[#F8FAFC] cursor-pointer transition-colors", isToday ? "bg-blue-50" : "")}>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold mb-1", isToday ? "bg-[#2563EB] text-white" : "text-[#64748B]")}>{day}</div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map((ev, ei) => (
                      <div key={ei} className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] text-white font-medium truncate", eventBg[ev.type], ev.warn ? "ring-1 ring-red-400 ring-inset" : "")}>
                        {ev.warn && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                        <span className="truncate">{ev.po}</span>
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[9px] text-[#94A3B8] pl-1">+{evs.length - 2}건</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {["", "PO번호", "스타일", "브랜드", "출고일", "출고방식", "수량", "상태"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {shippingList.map((s) => (
                <tr key={s.po} className="hover:bg-[#F8FAFC] cursor-pointer">
                  <td className="px-3.5 py-2.5 w-8">{s.warn && <AlertTriangle className="w-4 h-4 text-red-500" />}</td>
                  <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#2563EB]">{s.po}</td>
                  <td className="px-3.5 py-2.5 text-[11px] font-mono text-[#0F172A]">{s.style}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{s.brand}</td>
                  <td className="px-3.5 py-2.5 text-[11px] text-[#64748B]">{s.date}</td>
                  <td className="px-3.5 py-2.5"><ShippingBadge method={s.method} /></td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{s.qty.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── TechPack ──────────────────────────────────────────────
