import { useEffect, useState } from "react";
import { Plus, AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShippingBadge } from "@/components/common/ShippingBadge";
import type { ShippingMethod, Status } from "@/types";

interface ShippingDto {
  id: number;
  poNumber: string;
  styleCode: string;
  brand: string;
  dlvyDate: string | null;
  transportMethod: string;
  status: string;
  totalQty: number;
  violatesRule: boolean;
}

const STATUS_LABELS: Record<string, Status> = {
  RECEIVED: "대기", IN_REVIEW: "검토중", RECONCILED: "승인완료", MISMATCH: "지연", SHIPPED: "완료", CLOSED: "완료",
};
const eventBg: Record<string, string> = { AIR: "bg-sky-500", BOAT: "bg-teal-500", SPLIT: "bg-violet-500", UNASSIGNED: "bg-slate-400" };
const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export function ShippingPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [rows, setRows] = useState<ShippingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ poId: "", dlvyDate: "", transportMethod: "AIR" });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    apiFetch("/api/shipping")
      .then((r) => { if (!r.ok) throw new Error(`출고 목록을 불러오지 못했습니다 (${r.status})`); return r.json(); })
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay: Record<number, ShippingDto[]> = {};
  rows.forEach((r) => {
    if (!r.dlvyDate) return;
    const d = new Date(r.dlvyDate + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      (eventsByDay[d.getDate()] ??= []).push(r);
    }
  });

  const submitRegister = async () => {
    if (!form.poId || !form.dlvyDate) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/api/shipping/${form.poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dlvyDate: form.dlvyDate, transportMethod: form.transportMethod }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `등록 실패 (${res.status})`);
      }
      setRegistering(false);
      setForm({ poId: "", dlvyDate: "", transportMethod: "AIR" });
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">출고 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">{year}년 {month + 1}월 출고 일정</p>
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
          <button onClick={() => setRegistering((v) => !v)} className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />출고 등록
          </button>
        </div>
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>}

      {registering && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">출고 등록</h3>
            <button onClick={() => setRegistering(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="">PO 선택</option>
              {rows.filter((r) => r.status !== "SHIPPED" && r.status !== "CLOSED").map((r) => (
                <option key={r.id} value={r.id}>{r.poNumber} ({r.styleCode})</option>
              ))}
            </select>
            <input type="date" value={form.dlvyDate} onChange={(e) => setForm({ ...form, dlvyDate: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <select value={form.transportMethod} onChange={(e) => setForm({ ...form, transportMethod: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="AIR">AIR</option><option value="BOAT">BOAT</option><option value="SPLIT">SPLIT</option>
            </select>
          </div>
          <button onClick={submitRegister} disabled={submitting || !form.poId || !form.dlvyDate}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}등록
          </button>
        </div>
      )}

      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}

      {!loading && !error && (
        <>
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
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const evs = eventsByDay[day] ?? [];
                  const isToday = day === today.getDate();
                  return (
                    <div key={day} className={cn("h-[90px] border-b border-r border-[#F8FAFC] p-1.5 hover:bg-[#F8FAFC] cursor-pointer transition-colors", isToday ? "bg-blue-50" : "")}>
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold mb-1", isToday ? "bg-[#2563EB] text-white" : "text-[#64748B]")}>{day}</div>
                      <div className="space-y-0.5">
                        {evs.slice(0, 2).map((ev) => (
                          <div key={ev.id} className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] text-white font-medium truncate", eventBg[ev.transportMethod], ev.violatesRule ? "ring-1 ring-red-400 ring-inset" : "")}>
                            {ev.violatesRule && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate">{ev.poNumber}</span>
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
                  {rows.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-3.5 py-2.5 w-8">{s.violatesRule && <AlertTriangle className="w-4 h-4 text-red-500" />}</td>
                      <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#2563EB]">{s.poNumber}</td>
                      <td className="px-3.5 py-2.5 text-[11px] font-mono text-[#0F172A]">{s.styleCode}</td>
                      <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{s.brand}</td>
                      <td className="px-3.5 py-2.5 text-[11px] text-[#64748B]">{s.dlvyDate ?? "-"}</td>
                      <td className="px-3.5 py-2.5">
                        {s.transportMethod === "UNASSIGNED"
                          ? <span className="text-[11px] text-[#94A3B8]">미지정</span>
                          : <ShippingBadge method={s.transportMethod as ShippingMethod} />}
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{s.totalQty.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5"><StatusBadge status={STATUS_LABELS[s.status] ?? "대기"} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-[11px] text-[#94A3B8] py-8">출고 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
