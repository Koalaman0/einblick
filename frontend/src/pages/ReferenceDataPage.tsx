import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiConfig";
import { cn } from "@/lib/utils";

interface ProgramDto { id: number; brand: string; league: string | null; styleCode: string; styleName: string | null; season: string | null }
interface CustomerDto {
  id: number; code: string; name: string; houseAlias: boolean;
  packingMethod: string | null; format: string | null; assortSolid: string | null;
  stdRatio: string | null; stdPolybag: string | null; stdCarton: string | null; stdHanger: string | null;
}
interface VendorDto { id: number; name: string; overseas: boolean; contactName: string | null; contactInfo: string | null }
interface ShippingRuleDto {
  id: number; styleCode: string; brand: string; season: string | null;
  poRangeFrom: string | null; poRangeTo: string | null; transportMethod: string; exFactoryDate: string | null;
}

const TABS = [
  { id: "program", label: "스타일/프로그램" },
  { id: "customer", label: "거래처" },
  { id: "vendor", label: "벤더" },
  { id: "shippingRule", label: "배송 규칙" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ReferenceDataPage() {
  const [tab, setTab] = useState<TabId>("program");
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [shippingRules, setShippingRules] = useState<ShippingRuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [programForm, setProgramForm] = useState({ brand: "", league: "", styleCode: "", styleName: "", season: "" });
  const [customerForm, setCustomerForm] = useState({
    code: "", name: "", houseAlias: false,
    packingMethod: "", format: "", assortSolid: "", stdRatio: "", stdPolybag: "", stdCarton: "", stdHanger: "",
  });
  const [vendorForm, setVendorForm] = useState({ name: "", overseas: false, contactName: "", contactInfo: "" });
  const [ruleForm, setRuleForm] = useState({ programId: "", season: "", poRangeFrom: "", poRangeTo: "", transportMethod: "AIR_ONLY", exFactoryDate: "" });

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/programs").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`프로그램 목록 실패 (${r.status})`)))),
      apiFetch("/api/customers").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`거래처 목록 실패 (${r.status})`)))),
      apiFetch("/api/vendors").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`벤더 목록 실패 (${r.status})`)))),
      apiFetch("/api/shipping-rules").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`배송 규칙 목록 실패 (${r.status})`)))),
    ])
      .then(([p, c, v, s]) => { setPrograms(p); setCustomers(c); setVendors(v); setShippingRules(s); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const resetForms = () => {
    setProgramForm({ brand: "", league: "", styleCode: "", styleName: "", season: "" });
    setCustomerForm({
      code: "", name: "", houseAlias: false,
      packingMethod: "", format: "", assortSolid: "", stdRatio: "", stdPolybag: "", stdCarton: "", stdHanger: "",
    });
    setVendorForm({ name: "", overseas: false, contactName: "", contactInfo: "" });
    setRuleForm({ programId: "", season: "", poRangeFrom: "", poRangeTo: "", transportMethod: "AIR_ONLY", exFactoryDate: "" });
  };

  const submitCreate = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      let res: Response;
      if (tab === "program") {
        res = await apiFetch("/api/programs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...programForm, league: programForm.league || null, styleName: programForm.styleName || null, season: programForm.season || null }),
        });
      } else if (tab === "customer") {
        res = await apiFetch("/api/customers", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...customerForm,
            packingMethod: customerForm.packingMethod || null,
            format: customerForm.format || null,
            assortSolid: customerForm.assortSolid || null,
            stdRatio: customerForm.stdRatio || null,
            stdPolybag: customerForm.stdPolybag || null,
            stdCarton: customerForm.stdCarton || null,
            stdHanger: customerForm.stdHanger || null,
          }),
        });
      } else if (tab === "vendor") {
        res = await apiFetch("/api/vendors", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...vendorForm, contactName: vendorForm.contactName || null, contactInfo: vendorForm.contactInfo || null }),
        });
      } else {
        res = await apiFetch("/api/shipping-rules", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId: Number(ruleForm.programId),
            season: ruleForm.season || null,
            poRangeFrom: ruleForm.poRangeFrom || null,
            poRangeTo: ruleForm.poRangeTo || null,
            transportMethod: ruleForm.transportMethod,
            exFactoryDate: ruleForm.exFactoryDate || null,
          }),
        });
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `등록 실패 (${res.status})`);
      }
      setCreating(false);
      resetForms();
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteShippingRule = async (id: number) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/shipping-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`삭제 실패 (${res.status})`);
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">기준정보 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">스타일, 거래처, 벤더, 배송 규칙 등 기준 데이터를 관리합니다</p>
        </div>
        <button onClick={() => { setCreating((v) => !v); setActionError(null); }} className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />등록
        </button>
      </div>

      <div className="flex bg-[#F1F5F9] rounded-lg p-0.5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setCreating(false); }}
            className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors", tab === t.id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]")}>
            {t.label}
          </button>
        ))}
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>}

      {creating && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          {tab === "program" && (
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="브랜드 *" value={programForm.brand} onChange={(e) => setProgramForm({ ...programForm, brand: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="리그 (선택)" value={programForm.league} onChange={(e) => setProgramForm({ ...programForm, league: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="스타일 코드 *" value={programForm.styleCode} onChange={(e) => setProgramForm({ ...programForm, styleCode: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="스타일명 (선택)" value={programForm.styleName} onChange={(e) => setProgramForm({ ...programForm, styleName: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="시즌 (선택, 예: 2024FW)" value={programForm.season} onChange={(e) => setProgramForm({ ...programForm, season: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            </div>
          )}
          {tab === "customer" && (
            <div className="grid grid-cols-3 gap-3 items-center">
              <input placeholder="코드 * (예: HOUSE)" value={customerForm.code} onChange={(e) => setCustomerForm({ ...customerForm, code: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="거래처명 *" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <label className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <input type="checkbox" checked={customerForm.houseAlias} onChange={(e) => setCustomerForm({ ...customerForm, houseAlias: e.target.checked })} />
                HOUSE 별칭으로 취급
              </label>
              <input placeholder="패킹 METHOD (선택, 예: RFID)" value={customerForm.packingMethod} onChange={(e) => setCustomerForm({ ...customerForm, packingMethod: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="FORMAT (선택)" value={customerForm.format} onChange={(e) => setCustomerForm({ ...customerForm, format: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="ASSORT/SOLID (선택)" value={customerForm.assortSolid} onChange={(e) => setCustomerForm({ ...customerForm, assortSolid: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="표준 RATIO (선택, 예: 1:2:2:1)" value={customerForm.stdRatio} onChange={(e) => setCustomerForm({ ...customerForm, stdRatio: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="표준 POLYBAG (선택)" value={customerForm.stdPolybag} onChange={(e) => setCustomerForm({ ...customerForm, stdPolybag: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="표준 CARTON (선택)" value={customerForm.stdCarton} onChange={(e) => setCustomerForm({ ...customerForm, stdCarton: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="표준 HANGER (선택)" value={customerForm.stdHanger} onChange={(e) => setCustomerForm({ ...customerForm, stdHanger: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            </div>
          )}
          {tab === "vendor" && (
            <div className="grid grid-cols-3 gap-3 items-center">
              <input placeholder="벤더명 *" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="담당자 (선택)" value={vendorForm.contactName} onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="연락처 (선택)" value={vendorForm.contactInfo} onChange={(e) => setVendorForm({ ...vendorForm, contactInfo: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <label className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <input type="checkbox" checked={vendorForm.overseas} onChange={(e) => setVendorForm({ ...vendorForm, overseas: e.target.checked })} />
                해외 벤더
              </label>
            </div>
          )}
          {tab === "shippingRule" && (
            <div className="grid grid-cols-3 gap-3">
              <select value={ruleForm.programId} onChange={(e) => setRuleForm({ ...ruleForm, programId: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                <option value="">스타일 선택 *</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.styleCode} ({p.brand})</option>)}
              </select>
              <input placeholder="시즌 (선택, 범위 미지정시 사용)" value={ruleForm.season} onChange={(e) => setRuleForm({ ...ruleForm, season: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <select value={ruleForm.transportMethod} onChange={(e) => setRuleForm({ ...ruleForm, transportMethod: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                <option value="AIR_ONLY">AIR ONLY</option>
                <option value="BOAT_ONLY">BOAT ONLY</option>
                <option value="SPLIT">SPLIT</option>
              </select>
              <input placeholder="PO 범위 시작 (선택, 예: PO-2024-0820)" value={ruleForm.poRangeFrom} onChange={(e) => setRuleForm({ ...ruleForm, poRangeFrom: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input placeholder="PO 범위 끝 (선택)" value={ruleForm.poRangeTo} onChange={(e) => setRuleForm({ ...ruleForm, poRangeTo: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
              <input type="date" placeholder="공장 출고 예정일" value={ruleForm.exFactoryDate} onChange={(e) => setRuleForm({ ...ruleForm, exFactoryDate: e.target.value })}
                className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            </div>
          )}
          <button onClick={submitCreate} disabled={submitting}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}등록
          </button>
        </div>
      )}

      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}

      {!loading && !error && tab === "program" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["브랜드", "리그", "스타일 코드", "스타일명", "시즌"].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{p.brand}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{p.league ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] font-mono text-[#0F172A]">{p.styleCode}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{p.styleName ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{p.season ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && tab === "program" && programs.length === 0 && (
        <div className="text-center text-[11px] text-[#94A3B8] py-8">등록된 스타일이 없습니다.</div>
      )}

      {!loading && !error && tab === "customer" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["코드", "거래처명", "HOUSE 별칭", "METHOD", "ASSORT/SOLID", "RATIO", "POLYBAG", "CARTON", "HANGER"].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B] whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-3.5 py-2.5 text-[12px] font-mono text-[#0F172A]">{c.code}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.name}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.houseAlias ? "예" : "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B] whitespace-nowrap">{c.packingMethod ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.assortSolid ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.stdRatio ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.stdPolybag ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{c.stdCarton ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B] max-w-[200px] truncate" title={c.stdHanger ?? undefined}>{c.stdHanger ?? "-"}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={9} className="text-center text-[11px] text-[#94A3B8] py-8">등록된 거래처가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === "vendor" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["벤더명", "해외 여부", "담당자", "연락처"].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{v.name}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{v.overseas ? "해외" : "국내"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{v.contactName ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{v.contactInfo ?? "-"}</td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={4} className="text-center text-[11px] text-[#94A3B8] py-8">등록된 벤더가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === "shippingRule" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["스타일", "브랜드", "시즌", "PO 범위", "운송 방식", "공장 출고 예정일", ""].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {shippingRules.map((r) => (
                <tr key={r.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-3.5 py-2.5 text-[12px] font-mono text-[#0F172A]">{r.styleCode}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{r.brand}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{r.season ?? "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{r.poRangeFrom && r.poRangeTo ? `${r.poRangeFrom} ~ ${r.poRangeTo}` : "-"}</td>
                  <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#0F172A]">{r.transportMethod}</td>
                  <td className="px-3.5 py-2.5 text-[12px] text-[#64748B]">{r.exFactoryDate ?? "-"}</td>
                  <td className="px-3.5 py-2.5">
                    <button onClick={() => deleteShippingRule(r.id)} className="text-[#94A3B8] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {shippingRules.length === 0 && <tr><td colSpan={7} className="text-center text-[11px] text-[#94A3B8] py-8">등록된 배송 규칙이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
