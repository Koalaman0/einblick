import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";

export function TechPackPage() {
  const files = [
    { id: 1, name: "NK-JKT-2401 테크팩 v2.pdf", brand: "Nike", season: "2024FW", type: "TECH PACK", size: "4.2MB", updated: "2024-07-08", updater: "김민준", status: "승인완료" as Status },
    { id: 2, name: "NK-JKT-2401 아트워크.ai", brand: "Nike", season: "2024FW", type: "ARTWORK", size: "12.8MB", updated: "2024-07-06", updater: "이서연", status: "검토중" as Status },
    { id: 3, name: "AD-PNT-2403 테크팩 v1.pdf", brand: "Adidas", season: "2024FW", type: "TECH PACK", size: "3.5MB", updated: "2024-07-05", updater: "박지훈", status: "진행중" as Status },
    { id: 4, name: "UA-SET-2401 테크팩 v3.pdf", brand: "Under Armour", season: "2025SS", type: "TECH PACK", size: "5.1MB", updated: "2024-07-03", updater: "최수아", status: "승인완료" as Status },
    { id: 5, name: "NB-JKT-2402 아트워크 최종.psd", brand: "New Balance", season: "2024FW", type: "ARTWORK", size: "28.4MB", updated: "2024-07-01", updater: "김민준", status: "승인완료" as Status },
  ];
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">TECH PACK / ARTWORK 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">기술 사양서 및 아트워크 파일 관리</p>
        </div>
        <button className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B] flex items-center gap-1.5 hover:bg-[#F8FAFC]"><Upload className="w-3.5 h-3.5" />파일 업로드</button>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["파일명", "브랜드", "시즌", "유형", "크기", "수정일", "담당자", "상태"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8FAFC]">
            {files.map((f) => (
              <tr key={f.id} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#F1F5F9] rounded-lg flex items-center justify-center text-[9px] font-bold text-[#64748B]">{f.name.split(".").pop()?.toUpperCase().slice(0, 3)}</div>
                    <span className="text-[12px] text-[#0F172A] font-medium">{f.name}</span>
                  </div>
                </td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748B]">{f.brand}</td>
                <td className="px-3.5 py-3"><span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{f.season}</span></td>
                <td className="px-3.5 py-3"><span className={cn("text-[11px] px-2 py-0.5 rounded-md font-medium", f.type === "TECH PACK" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{f.type}</span></td>
                <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{f.size}</td>
                <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{f.updated}</td>
                <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{f.updater}</td>
                <td className="px-3.5 py-3"><StatusBadge status={f.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── User Management ────────────────────────────────────────
