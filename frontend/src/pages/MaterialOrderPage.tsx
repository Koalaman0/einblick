import { useEffect, useState } from "react";
import { Calendar, Check, Plus, Truck, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";

interface MaterialOrderDto {
  id: number;
  styleCode: string;
  brand: string;
  vendorName: string;
  item: string | null;
  qty: number | null;
  amount: number | null;
  approvalStatus: string;
  wireStatus: string;
  transportMethod: string | null;
  createdAt: string;
}

interface VendorDto { id: number; name: string; overseas: boolean }
interface ProgramDto { id: number; brand: string; styleCode: string; styleName: string | null; season: string | null }

const APPROVAL_STEPS = ["DRAFT", "MANAGER_REVIEW", "DIRECTOR_REVIEW", "APPROVED"];
const APPROVAL_LABELS: Record<string, string> = {
  DRAFT: "초안", MANAGER_REVIEW: "팀장 검토", DIRECTOR_REVIEW: "이사 검토", APPROVED: "승인 완료", REJECTED: "반려",
};
const WIRE_LABELS: Record<string, string> = { NOT_SENT: "미송금", WIRED: "송금완료", CONFIRMED: "입금확인" };
const TRANSPORT_LABELS: Record<string, string> = { AIR: "항공운송", BOAT: "해상운송", FEDEX: "특송(FEDEX)" };

export function MaterialOrderPage() {
  const [orders, setOrders] = useState<MaterialOrderDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newVendorMode, setNewVendorMode] = useState(false);
  const [form, setForm] = useState({ programId: "", vendorId: "", newVendorName: "", item: "", qty: "", amount: "", transportMethod: "AIR" });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/material-orders").then((r) => { if (!r.ok) throw new Error(`목록을 불러오지 못했습니다 (${r.status})`); return r.json(); }),
      apiFetch("/api/vendors").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/programs").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([o, v, p]) => { setOrders(o); setVendors(v); setPrograms(p); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const submitCreate = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      let vendorId = form.vendorId;
      if (newVendorMode) {
        const res = await apiFetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.newVendorName }),
        });
        if (!res.ok) throw new Error("공급처 생성에 실패했습니다.");
        const vendor = await res.json();
        vendorId = String(vendor.id);
      }
      const res = await apiFetch("/api/material-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: Number(form.programId),
          vendorId: Number(vendorId),
          item: form.item,
          qty: form.qty ? Number(form.qty) : null,
          amount: form.amount ? Number(form.amount) : null,
          transportMethod: form.transportMethod,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `등록 실패 (${res.status})`);
      }
      setCreating(false);
      setForm({ programId: "", vendorId: "", newVendorName: "", item: "", qty: "", amount: "", transportMethod: "AIR" });
      setNewVendorMode(false);
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const doAction = async (id: number, action: "advance-approval" | "reject" | "advance-wire") => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/material-orders/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `처리 실패 (${res.status})`);
      }
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.");
    }
  };

  const counts = APPROVAL_LABELS;
  const stepCounts = Object.keys(counts).map((status) => ({
    status, label: APPROVAL_LABELS[status], count: orders.filter((o) => o.approvalStatus === status).length,
  }));

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">자재 발주 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">결재/송금 단계별 진행 현황</p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />발주 등록
        </button>
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>}

      {creating && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">새 자재 발주 등록</h3>
            <button onClick={() => setCreating(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="">스타일 선택</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.styleCode} ({p.brand})</option>)}
            </select>

            {!newVendorMode ? (
              <select value={form.vendorId} onChange={(e) => e.target.value === "__new__" ? setNewVendorMode(true) : setForm({ ...form, vendorId: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                <option value="">공급처 선택</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                <option value="__new__">＋ 새 공급처 추가</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input placeholder="새 공급처명" value={form.newVendorName} onChange={(e) => setForm({ ...form, newVendorName: e.target.value })}
                  className="flex-1 h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                <button onClick={() => setNewVendorMode(false)} className="h-9 px-2 text-[11px] border border-[#E2E8F0] rounded-lg text-[#64748B]">취소</button>
              </div>
            )}

            <input placeholder="품목" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <input placeholder="수량" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <input placeholder="금액 (원)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <select value={form.transportMethod} onChange={(e) => setForm({ ...form, transportMethod: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              {Object.entries(TRANSPORT_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <button onClick={submitCreate} disabled={submitting || !form.programId || (!newVendorMode && !form.vendorId) || (newVendorMode && !form.newVendorName)}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}등록
          </button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {stepCounts.filter((s) => s.status !== "REJECTED").map((s) => (
          <div key={s.status} className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
            <div className="text-[13px] font-semibold text-[#0F172A]">{s.label}</div>
            <div className="text-xl font-bold text-[#0F172A] mt-0.5">{s.count}건</div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}
      {!loading && !error && orders.length === 0 && <div className="text-center text-[12px] text-[#94A3B8] py-8">등록된 자재 발주가 없습니다.</div>}

      <div className="space-y-3">
        {orders.map((order) => {
          const stepIdx = APPROVAL_STEPS.indexOf(order.approvalStatus);
          const rejected = order.approvalStatus === "REJECTED";
          return (
            <div key={order.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md font-mono">{order.styleCode}</span>
                    <span className="text-[11px] text-[#64748B]">{order.brand}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{order.item ?? "-"} · {order.vendorName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-[#0F172A]">{order.amount != null ? `₩${order.amount.toLocaleString()}` : "-"}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{order.qty != null ? `${order.qty.toLocaleString()}개` : ""}</div>
                </div>
              </div>

              {rejected ? (
                <div className="text-[12px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">반려됨</div>
              ) : (
                <div className="flex items-start gap-0 mb-3">
                  {APPROVAL_STEPS.map((step, i) => {
                    const done = i < stepIdx || (i === stepIdx && order.approvalStatus === "APPROVED");
                    const current = i === stepIdx && order.approvalStatus !== "APPROVED";
                    return (
                      <div key={step} className="flex items-start flex-1">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-all", done ? "bg-green-500" : current ? "bg-[#2563EB] ring-4 ring-[#2563EB]/10" : "bg-[#E2E8F0]", !done && !current && "text-[#94A3B8]")}>
                            {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                          </div>
                          <span className={cn("text-[10px] font-medium", done ? "text-green-600" : current ? "text-[#2563EB]" : "text-[#94A3B8]")}>{APPROVAL_LABELS[step]}</span>
                        </div>
                        {i < APPROVAL_STEPS.length - 1 && <div className={cn("flex-1 h-0.5 mx-1 mt-3.5", done ? "bg-green-400" : "bg-[#E2E8F0]")} />}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#F8FAFC]">
                <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                  {order.transportMethod && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{TRANSPORT_LABELS[order.transportMethod]}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{order.createdAt.slice(0, 10)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9]">{WIRE_LABELS[order.wireStatus]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!rejected && order.approvalStatus !== "APPROVED" && (
                    <button onClick={() => doAction(order.id, "reject")} className="h-7 px-2.5 border border-[#E2E8F0] rounded-lg text-[11px] text-red-500 hover:bg-red-50">반려</button>
                  )}
                  {!rejected && order.approvalStatus !== "APPROVED" && (
                    <button onClick={() => doAction(order.id, "advance-approval")} className="h-7 px-2.5 bg-[#2563EB] text-white rounded-lg text-[11px] hover:bg-[#1D4ED8]">결재 진행</button>
                  )}
                  {order.approvalStatus === "APPROVED" && order.wireStatus !== "CONFIRMED" && (
                    <button onClick={() => doAction(order.id, "advance-wire")} className="h-7 px-2.5 bg-[#2563EB] text-white rounded-lg text-[11px] hover:bg-[#1D4ED8]">송금 진행</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
