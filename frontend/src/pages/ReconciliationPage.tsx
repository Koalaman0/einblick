import React, { useState } from "react";
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, AlertCircle,
  FileText, Database, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const poRows = [
  { poNo: "PO-2024-0823", style: "NK-JKT-2401", size: "S", qty: 200, color: "Black" },
  { poNo: "PO-2024-0823", style: "NK-JKT-2401", size: "M", qty: 400, color: "Black" },
  { poNo: "PO-2024-0823", style: "NK-JKT-2401", size: "L", qty: 400, color: "Black" },
  { poNo: "PO-2024-0823", style: "NK-JKT-2401", size: "XL", qty: 200, color: "Black" },
  { poNo: "PO-2024-0824", style: "AD-PNT-2403", size: "S", qty: 150, color: "Navy" },
  { poNo: "PO-2024-0824", style: "AD-PNT-2403", size: "M", qty: 300, color: "Navy" },
  { poNo: "PO-2024-0824", style: "AD-PNT-2403", size: "L", qty: 250, color: "Navy" },
  { poNo: "PO-2024-0824", style: "AD-PNT-2403", size: "XL", qty: 100, color: "Navy" },
];
const assortRows = [
  { ...poRows[0], result: "일치" }, { ...poRows[1], result: "일치" },
  { ...poRows[2], qty: 350, result: "불일치" }, { ...poRows[3], qty: 250, result: "불일치" },
  { ...poRows[4], result: "일치" }, { ...poRows[5], result: "일치" },
  { ...poRows[6], result: "일치" }, { ...poRows[7], result: "확인필요" },
];

export function ReconciliationPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(true);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">PO 자동 대사</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">PO 데이터와 ASSORT 데이터를 자동으로 비교합니다</p>
        </div>
        <button onClick={() => { setRunning(true); setTimeout(() => { setRunning(false); setDone(true); }, 1600); }} disabled={running}
          className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
          <RefreshCw className={cn("w-4 h-4", running ? "animate-spin" : "")} />
          {running ? "대사 실행 중..." : "자동 대사 실행"}
        </button>
      </div>

      {done && (
        <div className="grid grid-cols-4 gap-3">
          {[["일치", "6", "green", CheckCircle], ["불일치", "2", "red", XCircle], ["확인 필요", "1", "amber", AlertTriangle], ["누락", "0", "slate", AlertCircle]].map(([l, v, c, Icon]) => {
            const I = Icon as React.ElementType;
            return (
              <div key={l} className={cn("bg-white rounded-xl border p-4 flex items-center gap-3", c === "green" ? "border-green-200" : c === "red" ? "border-red-200" : c === "amber" ? "border-amber-200" : "border-[#E2E8F0]")}>
                <I className={cn("w-7 h-7 shrink-0", c === "green" ? "text-green-500" : c === "red" ? "text-red-500" : c === "amber" ? "text-amber-500" : "text-[#94A3B8]")} />
                <div>
                  <div className={cn("text-2xl font-bold", c === "green" ? "text-green-600" : c === "red" ? "text-red-600" : c === "amber" ? "text-amber-600" : "text-[#94A3B8]")}>{v}건</div>
                  <div className="text-[11px] text-[#64748B]">{l}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[{ title: "PO 데이터", color: "blue", rows: poRows, withResult: false }, { title: "ASSORT 데이터", color: "violet", rows: assortRows, withResult: true }].map(({ title, color, rows, withResult }) => (
          <div key={title} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", color === "blue" ? "bg-blue-50 border-blue-100" : "bg-violet-50 border-violet-100")}>
              {color === "blue" ? <FileText className="w-4 h-4 text-blue-600" /> : <Database className="w-4 h-4 text-violet-600" />}
              <span className={cn("text-[13px] font-semibold", color === "blue" ? "text-blue-700" : "text-violet-700")}>{title}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {["PO번호", "스타일", "사이즈", "수량", withResult ? "결과" : "컬러"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {(rows as typeof assortRows).map((row, i) => {
                  const result = "result" in row ? row.result : null;
                  const isDiff = done && result === "불일치";
                  const isCheck = done && result === "확인필요";
                  return (
                    <tr key={i} className={cn("text-[11px]", isDiff ? "bg-red-50" : isCheck ? "bg-amber-50" : "")}>
                      <td className="px-3 py-2 text-[#2563EB] font-medium">{row.poNo}</td>
                      <td className="px-3 py-2 font-mono text-[#0F172A]">{row.style}</td>
                      <td className="px-3 py-2 text-[#64748B]">{row.size}</td>
                      <td className={cn("px-3 py-2 font-semibold", isDiff ? "text-red-600" : "text-[#0F172A]")}>{row.qty}</td>
                      <td className="px-3 py-2">
                        {withResult && done && result ? (
                          <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium", result === "일치" ? "bg-green-100 text-green-700" : result === "불일치" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                            {result === "일치" ? <Check className="w-2.5 h-2.5" /> : result === "불일치" ? <X className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                            {result}
                          </span>
                        ) : !withResult ? <span className="text-[#64748B]">{row.color}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {done && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h3 className="text-[13px] font-semibold text-[#0F172A] mb-3">불일치 상세 내역</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-red-700">수량 차이 발견</div>
                <div className="text-[11px] text-red-600 mt-0.5">PO-2024-0823 · NK-JKT-2401 · 사이즈 L: PO 400개 → ASSORT 350개 (△50개)</div>
                <div className="text-[11px] text-red-600">PO-2024-0823 · NK-JKT-2401 · 사이즈 XL: PO 200개 → ASSORT 250개 (▽50개)</div>
              </div>
              <button className="text-[11px] text-[#2563EB] hover:underline shrink-0">처리</button>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-amber-700">확인 필요</div>
                <div className="text-[11px] text-amber-600 mt-0.5">PO-2024-0824 · AD-PNT-2403 · 사이즈 XL: 고객사 배분 기준 재확인 필요</div>
              </div>
              <button className="text-[11px] text-[#2563EB] hover:underline shrink-0">확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
