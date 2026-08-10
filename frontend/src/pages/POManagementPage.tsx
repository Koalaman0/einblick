import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Search, Upload, Download, Plus, ChevronLeft, ChevronRight, X,
  Paperclip, FileText, Eye, Check, XCircle, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseOrderSummary, ShippingMethod } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShippingBadge } from "@/components/common/ShippingBadge";
import { API_BASE_URL } from "@/lib/apiConfig";

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "접수", IN_REVIEW: "검토중", RECONCILED: "대사완료",
  MISMATCH: "불일치", SHIPPED: "출고완료", CLOSED: "완료",
};

const STATUS_PROGRESS: Record<string, number> = {
  RECEIVED: 10, IN_REVIEW: 30, RECONCILED: 60, MISMATCH: 50, SHIPPED: 90, CLOSED: 100,
};

export function POManagementPage() {
  const [pos, setPos] = useState<PurchaseOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [season, setSeason] = useState("전체");
  const [selected, setSelected] = useState<PurchaseOrderSummary | null>(null);
  const [tab, setTab] = useState("info");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPurchaseOrders = () => {
    setLoading(true);
    setLoadError(null);
    fetch(`${API_BASE_URL}/api/po`)
      .then((res) => {
        if (!res.ok) throw new Error(`PO 목록을 불러오지 못했습니다 (${res.status})`);
        return res.json() as Promise<PurchaseOrderSummary[]>;
      })
      .then(setPos)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "PO 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const brands = useMemo(() => ["전체", ...Array.from(new Set(pos.map((p) => p.brand))).sort()], [pos]);
  const seasons = useMemo(() => ["전체", ...Array.from(new Set(pos.map((p) => p.season))).sort()], [pos]);
  const statuses = ["전체", ...Object.keys(STATUS_LABELS)];

  const filtered = pos.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.poNumber.toLowerCase().includes(s) || p.styleCode.toLowerCase().includes(s) || p.customerName.toLowerCase().includes(s)) &&
      (brand === "전체" || p.brand === brand) &&
      (status === "전체" || p.status === status) &&
      (season === "전체" || p.season === season)
    );
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/po/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `업로드 실패 (${res.status})`);
      }
      loadPurchaseOrders();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 space-y-4 flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-44">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="PO번호, 스타일, 고객사 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-3 text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-all"
                />
              </div>
              {([["브랜드", brands, brand, setBrand], ["시즌", seasons, season, setSeason], ["상태", statuses, status, setStatus]] as [string, string[], string, (v: string) => void][]).map(([label, opts, val, set]) => (
                <select key={label} value={val} onChange={(e) => set(e.target.value)}
                  className="h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
                  {opts.map((o) => <option key={o} value={o}>{STATUS_LABELS[o] ?? o}</option>)}
                </select>
              ))}
              <div className="flex-1" />
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="h-8 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B] flex items-center gap-1.5 hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "업로드 중..." : "PDF 업로드"}
              </button>
              <button className="h-8 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B] flex items-center gap-1.5 hover:bg-[#F8FAFC] transition-colors">
                <Download className="w-3.5 h-3.5" />엑셀 내보내기
              </button>
              <button className="h-8 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" />PO 등록
              </button>
            </div>
            {uploadError && (
              <div className="mt-2.5 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">{uploadError}</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {["PO번호", "스타일", "브랜드", "고객사", "시즌", "상태", "납기일", "출고방식", "총수량"].map((col) => (
                      <th key={col} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {loading && (
                    <tr><td colSpan={9} className="px-3.5 py-8 text-center text-[12px] text-[#94A3B8]">불러오는 중...</td></tr>
                  )}
                  {!loading && loadError && (
                    <tr><td colSpan={9} className="px-3.5 py-8 text-center text-[12px] text-red-600">{loadError}</td></tr>
                  )}
                  {!loading && !loadError && filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-3.5 py-8 text-center text-[12px] text-[#94A3B8]">등록된 PO가 없습니다.</td></tr>
                  )}
                  {!loading && !loadError && filtered.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => { setSelected(po); setTab("info"); }}
                      className={cn("hover:bg-[#F8FAFC] cursor-pointer transition-colors", selected?.id === po.id ? "bg-blue-50" : "")}
                    >
                      <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#2563EB]">{po.poNumber}</td>
                      <td className="px-3.5 py-2.5 text-[11px] font-mono text-[#0F172A] bg-[#F8FAFC]/50">{po.styleCode}</td>
                      <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A]">{po.brand}</td>
                      <td className="px-3.5 py-2.5 text-[11px] text-[#64748B]">{po.customerName}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{po.season}</span>
                      </td>
                      <td className="px-3.5 py-2.5"><StatusBadge status={STATUS_LABELS[po.status] ?? po.status} /></td>
                      <td className="px-3.5 py-2.5 text-[11px] text-[#64748B]">{po.dlvyDate ?? "-"}</td>
                      <td className="px-3.5 py-2.5">
                        {po.transportMethod === "UNASSIGNED" ? <span className="text-[11px] text-[#94A3B8]">미정</span> : <ShippingBadge method={po.transportMethod as ShippingMethod} />}
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px] text-[#0F172A] tabular-nums">{po.totalQty.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
              <span className="text-[11px] text-[#64748B]">총 {filtered.length}건</span>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"><ChevronLeft className="w-3 h-3" /></button>
                {[1, 2, 3].map((p) => (
                  <button key={p} className={cn("w-7 h-7 rounded-lg text-[11px] font-medium transition-colors", p === 1 ? "bg-[#2563EB] text-white" : "text-[#64748B] hover:bg-[#F1F5F9]")}>{p}</button>
                ))}
                <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"><ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-[380px] border-l border-[#E2E8F0] bg-white flex flex-col overflow-hidden shrink-0">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
            <div>
              <div className="text-[13px] font-semibold text-[#0F172A]">{selected.poNumber}</div>
              <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
                <span className="font-mono">{selected.styleCode}</span>
                <span>·</span>
                <StatusBadge status={STATUS_LABELS[selected.status] ?? selected.status} />
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex border-b border-[#E2E8F0] px-1 shrink-0 overflow-x-auto">
            {[["info", "PO 정보"], ["files", "첨부파일"], ["history", "이력"], ["comments", "댓글"], ["reconcile", "대사결과"], ["sample", "샘플현황"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn("px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap", tab === id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#64748B] hover:text-[#0F172A]")}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tab === "info" && (
              <>
                <div className="space-y-0">
                  {[["브랜드", selected.brand], ["고객사", selected.customerName], ["시즌", selected.season], ["납기일", selected.dlvyDate ?? "-"], ["출고방식", selected.transportMethod === "UNASSIGNED" ? "미정" : selected.transportMethod], ["총수량", `${selected.totalQty.toLocaleString()}개`]].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#F8FAFC]">
                      <span className="text-[11px] text-[#64748B]">{label}</span>
                      <span className="text-[12px] font-medium text-[#0F172A]">{value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B] mb-1.5">진행률</div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-1.5">
                    <div className="bg-[#2563EB] h-1.5 rounded-full transition-all" style={{ width: `${STATUS_PROGRESS[selected.status] ?? 10}%` }} />
                  </div>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Paperclip className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="text-[11px] font-medium text-[#64748B]">원본 PDF 미리보기</span>
                  </div>
                  <div className="w-full h-28 bg-[#E2E8F0] rounded-lg flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-[#94A3B8]" />
                    <span className="text-[11px] text-[#94A3B8]">{selected.poNumber}.pdf</span>
                    <button className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"><Eye className="w-3 h-3" />미리보기</button>
                  </div>
                </div>
              </>
            )}
            {tab === "comments" && (
              <div className="space-y-3">
                {[{ user: "김민준", time: "2시간 전", text: "FIT 샘플 진행 상황 확인 요청드립니다.", init: "김" }, { user: "이서연", time: "1시간 전", text: "네, 현재 공장에서 제작 중이며 내일 수령 예정입니다.", init: "이" }].map((c, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">{c.init}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-[#0F172A]">{c.user}</span>
                        <span className="text-[11px] text-[#94A3B8]">{c.time}</span>
                      </div>
                      <div className="text-[12px] text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">{c.text}</div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2.5 mt-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">나</div>
                  <div className="flex-1">
                    <textarea placeholder="댓글을 입력하세요..." className="w-full h-16 text-[12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] resize-none" />
                    <div className="flex justify-end mt-1.5">
                      <button className="px-3 py-1.5 bg-[#2563EB] text-white text-[12px] rounded-lg hover:bg-[#1D4ED8]">등록</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tab === "reconcile" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[["일치", "8", "green"], ["불일치", "2", "red"], ["확인필요", "1", "amber"]].map(([l, v, c]) => (
                    <div key={l} className={cn("rounded-xl p-3 text-center border", c === "green" ? "bg-green-50 border-green-200" : c === "red" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                      <div className={cn("text-xl font-bold", c === "green" ? "text-green-600" : c === "red" ? "text-red-600" : "text-amber-600")}>{v}</div>
                      <div className={cn("text-[11px]", c === "green" ? "text-green-600" : c === "red" ? "text-red-600" : "text-amber-600")}>{l}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-[11px]"><span className="font-semibold text-red-700">수량 차이:</span><span className="text-[#64748B] ml-1">PO 1200개 → ASSORT 1000개</span></div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[11px]"><span className="font-semibold text-amber-700">확인필요:</span><span className="text-[#64748B] ml-1">사이즈 XL 배분 검토 필요</span></div>
                  </div>
                </div>
              </div>
            )}
            {tab === "sample" && (
              <div className="space-y-2.5">
                {["SMS", "FIT", "APPROVAL", "TOP", "TEST"].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white", i < 2 ? "bg-green-500" : i === 2 ? "bg-[#2563EB]" : "bg-[#E2E8F0]")}>
                      {i < 2 ? <Check className="w-3.5 h-3.5" /> : <span className={i >= 3 ? "text-[#94A3B8]" : ""}>{i + 1}</span>}
                    </div>
                    <div>
                      <div className={cn("text-[12px] font-semibold", i < 2 ? "text-[#0F172A]" : i === 2 ? "text-[#2563EB]" : "text-[#94A3B8]")}>{stage}</div>
                      <div className="text-[11px] text-[#94A3B8]">{i === 0 ? "완료 · 2024-07-01" : i === 1 ? "완료 · 2024-07-05" : i === 2 ? "진행중" : "대기"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === "history" && (
              <div className="space-y-3">
                {[{ time: "2024-07-10 14:30", user: "김민준", action: "상태 변경", detail: "검토중 → 진행중" }, { time: "2024-07-08 11:20", user: "이서연", action: "수량 수정", detail: "1000개 → 1200개" }, { time: "2024-07-05 09:15", user: "박지훈", action: "PO 등록", detail: "최초 등록" }].map((h, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                    <div className="flex-1 pb-3 border-b border-[#F8FAFC] last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#0F172A]">{h.action}</span>
                        <span className="text-[11px] text-[#94A3B8]">{h.user}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">{h.detail}</div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5">{h.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === "files" && (
              <div className="space-y-2">
                {[`${selected.poNumber}.pdf`, "원단스펙.xlsx", "사이즈스펙.pdf"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="text-[12px] text-[#0F172A] flex-1">{f}</span>
                    <Download className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#2563EB]" />
                  </div>
                ))}
                <button className="w-full h-9 border-2 border-dashed border-[#CBD5E1] rounded-lg text-[11px] text-[#94A3B8] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />파일 업로드
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
