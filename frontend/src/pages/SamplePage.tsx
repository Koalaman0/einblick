import { useState } from "react";
import { Plus, Flag, Clock, MessageSquare, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SampleStage, SampleCard, KanbanData } from "@/types";
import { initKanban } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";

const kanbanCols: SampleStage[] = ["SMS", "FIT", "APPROVAL", "TOP", "TEST"];
const colMeta: Record<SampleStage, { dot: string; hdr: string }> = {
  SMS: { dot: "bg-blue-500", hdr: "bg-blue-50 border-blue-100" },
  FIT: { dot: "bg-violet-500", hdr: "bg-violet-50 border-violet-100" },
  APPROVAL: { dot: "bg-amber-500", hdr: "bg-amber-50 border-amber-100" },
  TOP: { dot: "bg-green-500", hdr: "bg-green-50 border-green-100" },
  TEST: { dot: "bg-teal-500", hdr: "bg-teal-50 border-teal-100" },
};

export function SamplePage() {
  const [kanban, setKanban] = useState<KanbanData>(initKanban);
  const moveCard = (card: SampleCard, from: SampleStage, to: SampleStage) => {
    if (from === to) return;
    setKanban((prev) => {
      const next = { ...prev };
      next[from] = prev[from].filter((c) => c.id !== card.id);
      next[to] = [...prev[to], card];
      return next;
    });
  };

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">샘플 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">칸반 보드 · 총 {Object.values(kanban).flat().length}건 진행 중</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 bg-white border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] text-[#64748B] focus:outline-none">
            <option>전체 브랜드</option><option>Nike</option><option>Adidas</option>
          </select>
          <button className="h-8 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />샘플 등록
          </button>
        </div>
      </div>

      <div className="flex gap-3.5 flex-1 overflow-x-auto pb-2">
        {kanbanCols.map((col) => {
          const meta = colMeta[col];
          return (
            <div key={col} className="w-[230px] shrink-0 flex flex-col">
              <div className={cn("rounded-t-xl p-3 flex items-center justify-between border", meta.hdr)}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", meta.dot)} />
                  <span className="text-[13px] font-semibold text-[#0F172A]">{col}</span>
                  <span className="text-[10px] bg-white text-[#64748B] rounded-full px-1.5 py-0.5 font-semibold border border-[#E2E8F0]">{kanban[col].length}</span>
                </div>
                <button className="w-5 h-5 rounded flex items-center justify-center text-[#64748B] hover:bg-white/70 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 bg-[#F8FAFC] rounded-b-xl border border-t-0 border-[#E2E8F0] p-2 space-y-2 overflow-y-auto min-h-[120px]">
                {kanban[col].map((card) => (
                  <div key={card.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#0F172A] font-mono leading-tight">{card.style}</span>
                      <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", card.priority === "높음" ? "text-red-500" : card.priority === "보통" ? "text-amber-500" : "text-slate-400")}>
                        <Flag className="w-2.5 h-2.5" />{card.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                      <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] rounded px-1.5 py-0.5">{card.brand}</span>
                      <StatusBadge status={card.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">{card.assignee.charAt(0)}</div>
                        <span>{card.assignee}</span>
                      </div>
                      <span className={cn("flex items-center gap-0.5", new Date(card.deadline) < new Date("2024-07-10") ? "text-red-500" : "")}>
                        <Clock className="w-2.5 h-2.5" />{card.deadline.slice(5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F8FAFC] text-[11px]">
                      <span className="text-[#94A3B8] flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{card.comments}</span>
                      {card.sent
                        ? <span className="text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />발송</span>
                        : <span className="text-[#94A3B8]">미발송</span>}
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-[#F8FAFC] flex-wrap">
                      <span className="text-[10px] text-[#94A3B8]">이동:</span>
                      {kanbanCols.filter((c) => c !== col).map((to) => (
                        <button key={to} onClick={(e) => { e.stopPropagation(); moveCard(card, col, to); }}
                          className={cn("text-[10px] px-1.5 py-0.5 rounded text-white font-medium", colMeta[to].dot)}>
                          {to}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {kanban[col].length === 0 && (
                  <div className="h-14 flex items-center justify-center text-[11px] text-[#CBD5E1] border-2 border-dashed border-[#E2E8F0] rounded-xl">항목 없음</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
