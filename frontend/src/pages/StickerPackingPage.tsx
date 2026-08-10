import { useEffect, useState } from "react";
import { CheckCircle, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";

interface PoDto { id: number; poNumber: string; styleCode: string; brand: string; totalQty: number }
interface StickerRequestDto {
  id: number;
  poNumber: string;
  styleCode: string;
  brand: string;
  stickerType: string;
  qty: number;
  lossRate: string;
  status: string;
}

const TYPE_META: Record<string, { label: string; desc: string; c: string }> = {
  PRN: { label: "PRN", desc: "Prepack Reference Number", c: "blue" },
  UPC: { label: "UPC", desc: "Universal Product Code", c: "teal" },
  LPN: { label: "LPN", desc: "License Plate Number", c: "violet" },
};
const STATUS_LABELS: Record<string, string> = { REQUESTED: "요청됨", SENT_TO_FACTORY: "공장 전달", CONFIRMED: "확정" };
const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-slate-100 text-slate-600", SENT_TO_FACTORY: "bg-blue-50 text-blue-700", CONFIRMED: "bg-green-50 text-green-700",
};

export function StickerPackingPage() {
  const [pos, setPos] = useState<PoDto[]>([]);
  const [requests, setRequests] = useState<StickerRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [poId, setPoId] = useState("");
  const [qty, setQty] = useState("");
  const [inner, setInner] = useState("12");
  const [outer, setOuter] = useState("6");
  const [lossRate, setLossRate] = useState("1.00");
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/po").then((r) => { if (!r.ok) throw new Error(`PO 목록을 불러오지 못했습니다 (${r.status})`); return r.json(); }),
      apiFetch("/api/sticker-requests").then((r) => { if (!r.ok) throw new Error(`스티커 요청 목록을 불러오지 못했습니다 (${r.status})`); return r.json(); }),
    ])
      .then(([p, s]) => { setPos(p); setRequests(s); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const selectedPo = pos.find((p) => String(p.id) === poId);
  const totalQty = parseInt(qty) || 0;
  const innerQty = parseInt(inner) || 1;
  const outerQty = parseInt(outer) || 1;
  const innerCount = Math.ceil(totalQty / innerQty);
  const cartonCount = Math.ceil(innerCount / outerQty);

  const onSelectPo = (id: string) => {
    setPoId(id);
    const po = pos.find((p) => String(p.id) === id);
    if (po) setQty(String(po.totalQty));
  };

  const submitCreate = async () => {
    if (!poId || totalQty <= 0) return;
    setSubmitting(true);
    setActionError(null);
    setJustCreated(false);
    try {
      const payloads = [
        { stickerType: "PRN", qty: innerCount },
        { stickerType: "UPC", qty: totalQty },
        { stickerType: "LPN", qty: cartonCount },
      ];
      for (const p of payloads) {
        const res = await apiFetch("/api/sticker-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poId: Number(poId), lossRate, ...p }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `생성 실패 (${res.status})`);
        }
      }
      setJustCreated(true);
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (req: StickerRequestDto, status: string) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/sticker-requests/${req.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`상태 변경 실패 (${res.status})`);
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">스티커 · 패킹 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">패킹 계산 및 스티커(PRN/UPC/LPN) 요청 생성</p>
        </div>
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>}
      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
              <h3 className="text-[13px] font-semibold text-[#0F172A]">패킹 정보 입력</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">PO 번호</label>
                  <select value={poId} onChange={(e) => onSelectPo(e.target.value)}
                    className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
                    <option value="">PO 선택</option>
                    {pos.map((p) => <option key={p.id} value={p.id}>{p.poNumber} ({p.styleCode})</option>)}
                  </select>
                </div>
                {selectedPo && (
                  <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                    <span className="bg-[#F1F5F9] rounded px-1.5 py-0.5">{selectedPo.brand}</span>
                    <span className="font-mono">{selectedPo.styleCode}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[["총 수량", qty, setQty], ["이너팩 단위", inner, setInner], ["카톤 단위 (이너팩)", outer, setOuter], ["로스율 (%)", lossRate, setLossRate]].map(([label, val, set]) => (
                    <div key={label as string} className={label === "총 수량" ? "col-span-2" : ""}>
                      <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                        className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-[13px] font-semibold text-[#0F172A] mb-4">자동 계산 결과</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[["총 수량", `${totalQty.toLocaleString()}개`, "blue"], ["이너팩 수", `${innerCount}개`, "violet"], ["카톤 수", `${cartonCount}CTN`, "amber"], ["LPN 수량", `${cartonCount}개`, "green"]].map(([l, v, c]) => (
                    <div key={l} className={cn("rounded-xl p-3.5 border", c === "blue" ? "bg-blue-50 border-blue-100" : c === "violet" ? "bg-violet-50 border-violet-100" : c === "amber" ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100")}>
                      <div className={cn("text-xl font-bold", c === "blue" ? "text-blue-700" : c === "violet" ? "text-violet-700" : c === "amber" ? "text-amber-700" : "text-green-700")}>{v}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-[13px] font-semibold text-[#0F172A] mb-3">스티커 유형</h3>
                <div className="space-y-2">
                  {Object.entries(TYPE_META).map(([type, meta]) => {
                    const count = type === "PRN" ? innerCount : type === "UPC" ? totalQty : cartonCount;
                    return (
                      <div key={type} className={cn("flex items-center justify-between p-3 rounded-xl border", meta.c === "blue" ? "border-blue-100 bg-blue-50" : meta.c === "teal" ? "border-teal-100 bg-teal-50" : "border-violet-100 bg-violet-50")}>
                        <div>
                          <div className={cn("text-[12px] font-bold", meta.c === "blue" ? "text-blue-700" : meta.c === "teal" ? "text-teal-700" : "text-violet-700")}>{meta.label}</div>
                          <div className="text-[10px] text-[#64748B]">{meta.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-semibold text-[#0F172A]">{count.toLocaleString()}매</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={submitCreate} disabled={submitting || !poId || totalQty <= 0}
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}스티커 요청 생성
              </button>
              {justCreated && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] text-green-700">PRN/UPC/LPN 스티커 요청이 생성되었습니다.</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-[13px] font-semibold text-[#0F172A]">요청 목록 · 총 {requests.length}건</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {["PO번호", "스타일", "브랜드", "유형", "수량", "로스율", "상태"].map((h) => (
                    <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#2563EB]">{r.poNumber}</td>
                    <td className="px-3.5 py-2.5 text-[11px] font-mono text-[#0F172A]">{r.styleCode}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{r.brand}</td>
                    <td className="px-3.5 py-2.5 text-[11px] font-semibold text-[#0F172A]">{r.stickerType}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{r.qty.toLocaleString()}</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-[#64748B]">{r.lossRate}%</td>
                    <td className="px-3.5 py-2.5">
                      <select value={r.status} onChange={(e) => changeStatus(r, e.target.value)}
                        className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 border-0 focus:outline-none cursor-pointer", STATUS_BADGE[r.status])}>
                        {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-[11px] text-[#94A3B8] py-8">요청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
