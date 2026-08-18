import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Search, Upload, Download, Plus, ChevronLeft, ChevronRight, X,
  Paperclip, FileText, Eye, Check, XCircle, AlertTriangle, Loader2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseOrderSummary, ShippingMethod } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShippingBadge } from "@/components/common/ShippingBadge";
import { apiFetch } from "@/lib/apiConfig";

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "접수", IN_REVIEW: "검토중", RECONCILED: "대사완료",
  MISMATCH: "불일치", SHIPPED: "출고완료", CLOSED: "완료",
};

const STATUS_PROGRESS: Record<string, number> = {
  RECEIVED: 10, IN_REVIEW: 30, RECONCILED: 60, MISMATCH: 50, SHIPPED: 90, CLOSED: 100,
};

interface ProgramOption { id: number; brand: string; styleCode: string; styleName: string | null; season: string | null }
interface CustomerOption { id: number; code: string; name: string }
interface PoLineForm { team: string; player: string; sizesText: string }
interface UnparsedLine { poNumber: string; page: number; text: string }
interface PoDetailSize { sizeCode: string; qty: number }
interface PoDetailLine { id: number; team: string | null; player: string | null; totalQty: number; sizes: PoDetailSize[] }
interface PoDetail {
  id: number; poNumber: string; styleCode: string; brand: string; customerName: string; season: string | null;
  status: string; dlvyDate: string | null; transportMethod: string; totalQty: number; lines: PoDetailLine[];
}

function parseSizesText(text: string): { sizeCode: string; qty: number }[] {
  return text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [sizeCode, qtyRaw] = chunk.split(":").map((s) => s.trim());
      return { sizeCode, qty: Number(qtyRaw) };
    })
    .filter((s) => s.sizeCode && Number.isFinite(s.qty) && s.qty >= 0);
}

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
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [unparsedLines, setUnparsedLines] = useState<UnparsedLine[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detail, setDetail] = useState<PoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addingLine, setAddingLine] = useState(false);
  const [addLineForm, setAddLineForm] = useState<PoLineForm>({ team: "", player: "", sizesText: "" });
  const [addLineSubmitting, setAddLineSubmitting] = useState(false);
  const [addLineError, setAddLineError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ poNumber: "", programId: "", customerId: "", dlvyDate: "", transportMethod: "UNASSIGNED" });
  const [lines, setLines] = useState<PoLineForm[]>([{ team: "", player: "", sizesText: "" }]);

  const loadPurchaseOrders = () => {
    setLoading(true);
    setLoadError(null);
    apiFetch("/api/po")
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
    apiFetch("/api/programs").then((r) => (r.ok ? r.json() : [])).then(setPrograms).catch(() => {});
    apiFetch("/api/customers").then((r) => (r.ok ? r.json() : [])).then(setCustomers).catch(() => {});
  }, []);

  const loadDetail = (poId: number) => {
    setDetailLoading(true);
    apiFetch(`/api/po/${poId}`)
      .then((res) => (res.ok ? (res.json() as Promise<PoDetail>) : Promise.reject(new Error(`PO 상세를 불러오지 못했습니다 (${res.status})`))))
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    setAddingLine(false);
    setAddLineError(null);
    setAddLineForm({ team: "", player: "", sizesText: "" });
    if (selected) loadDetail(selected.id);
    else setDetail(null);
  }, [selected]);

  const handleAddLine = async () => {
    if (!selected) return;
    setAddLineError(null);
    const sizes = parseSizesText(addLineForm.sizesText);
    if (sizes.length === 0) {
      setAddLineError("'사이즈:수량' 형식으로 최소 1개 이상 입력하세요 (예: S:100, M:150).");
      return;
    }
    setAddLineSubmitting(true);
    try {
      const res = await apiFetch(`/api/po/${selected.id}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: addLineForm.team || null, player: addLineForm.player || null, sizes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `라인 추가 실패 (${res.status})`);
      }
      const updated: PoDetail = await res.json();
      setDetail(updated);
      setAddingLine(false);
      setAddLineForm({ team: "", player: "", sizesText: "" });
      loadPurchaseOrders();
    } catch (err) {
      setAddLineError(err instanceof Error ? err.message : "라인 추가 중 오류가 발생했습니다.");
    } finally {
      setAddLineSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({ poNumber: "", programId: "", customerId: "", dlvyDate: "", transportMethod: "UNASSIGNED" });
    setLines([{ team: "", player: "", sizesText: "" }]);
  };

  const submitCreate = async () => {
    setCreateError(null);
    if (!createForm.poNumber.trim() || !createForm.programId) {
      setCreateError("PO 번호와 스타일은 필수입니다.");
      return;
    }
    const linePayloads = lines.map((l) => ({ team: l.team || null, player: l.player || null, sizes: parseSizesText(l.sizesText) }));
    if (linePayloads.some((l) => l.sizes.length === 0)) {
      setCreateError("각 라인마다 '사이즈:수량' 형식으로 최소 1개 이상 입력하세요 (예: S:100, M:150).");
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await apiFetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: createForm.poNumber.trim(),
          programId: Number(createForm.programId),
          customerId: createForm.customerId ? Number(createForm.customerId) : null,
          dlvyDate: createForm.dlvyDate || null,
          transportMethod: createForm.transportMethod,
          lines: linePayloads,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `등록 실패 (${res.status})`);
      }
      setCreating(false);
      resetCreateForm();
      loadPurchaseOrders();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async (po: PurchaseOrderSummary) => {
    if (!window.confirm(`${po.poNumber} PO를 삭제하시겠습니까? 관련 대사결과/스티커 요청도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/po/${po.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `삭제 실패 (${res.status})`);
      }
      setSelected(null);
      loadPurchaseOrders();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 PO ${selectedIds.size}건을 삭제하시겠습니까? 관련 대사결과/스티커 요청도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setBulkDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch("/api/po", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `삭제 실패 (${res.status})`);
      }
      const result: { deleted: number; failed: number; failureMessages: string[] } = await res.json();
      if (result.failed > 0) {
        setDeleteError(`${result.deleted}건 삭제 완료, ${result.failed}건 실패 (${result.failureMessages.join(", ")})`);
      }
      setSelectedIds(new Set());
      setSelected(null);
      loadPurchaseOrders();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) return new Set();
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadNotice(null);
    setUnparsedLines([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/po/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `업로드 실패 (${res.status})`);
      }
      const result: {
        detected: number; succeeded: number; failed: number; failureMessages: string[];
        created: { poNumber: string; unparsedLines: { page: number; text: string }[] }[];
      } = await res.json();
      if (result.detected > 1 || result.failed > 0) {
        const parts = [`PDF에서 PO ${result.detected}건 감지, ${result.succeeded}건 등록 완료`];
        if (result.failed > 0) parts.push(`${result.failed}건 실패 (${result.failureMessages.join(", ")})`);
        setUploadNotice(parts.join(" · "));
      }
      const flagged = result.created.flatMap((po) =>
        po.unparsedLines.map((u) => ({ poNumber: po.poNumber, page: u.page, text: u.text }))
      );
      setUnparsedLines(flagged);
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
              <button onClick={() => { setCreating((v) => !v); setCreateError(null); }}
                className="h-8 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" />PO 등록
              </button>
            </div>
            {uploadError && (
              <div className="mt-2.5 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">{uploadError}</div>
            )}
            {uploadNotice && (
              <div className="mt-2.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">{uploadNotice}</div>
            )}
            {unparsedLines.length > 0 && (
              <div className="mt-2.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 space-y-1.5">
                <div className="font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />PDF에서 인식하지 못한 줄이 있습니다 ({unparsedLines.length}건) - PDF 원본에서 해당 페이지를 확인하고, 아래 PO를 선택해 "라인 추가"로 직접 등록해주세요.</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {unparsedLines.map((u, i) => (
                    <div key={i} className="text-[10px] text-amber-600 font-mono bg-white/60 rounded px-2 py-1">
                      [{u.poNumber} · {u.page}페이지] {u.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {creating && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#0F172A]">PO 수동 등록</h3>
                <button onClick={() => setCreating(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
              </div>
              {createError && <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">{createError}</div>}
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="PO 번호 *" value={createForm.poNumber} onChange={(e) => setCreateForm({ ...createForm, poNumber: e.target.value })}
                  className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                <select value={createForm.programId} onChange={(e) => setCreateForm({ ...createForm, programId: e.target.value })}
                  className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                  <option value="">스타일 선택 *</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.styleCode} ({p.brand})</option>)}
                </select>
                <select value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                  className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                  <option value="">거래처 (미선택 시 HOUSE)</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="date" value={createForm.dlvyDate} onChange={(e) => setCreateForm({ ...createForm, dlvyDate: e.target.value })}
                  className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                <select value={createForm.transportMethod} onChange={(e) => setCreateForm({ ...createForm, transportMethod: e.target.value })}
                  className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
                  <option value="UNASSIGNED">운송방식 미정</option>
                  <option value="AIR">AIR</option>
                  <option value="BOAT">BOAT</option>
                  <option value="SPLIT">SPLIT</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#64748B]">라인 (팀/플레이어 · 사이즈별 수량)</div>
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
                    <input placeholder="팀 (선택)" value={line.team} onChange={(e) => setLines(lines.map((l, li) => (li === i ? { ...l, team: e.target.value } : l)))}
                      className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                    <input placeholder="플레이어 (선택)" value={line.player} onChange={(e) => setLines(lines.map((l, li) => (li === i ? { ...l, player: e.target.value } : l)))}
                      className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                    <input placeholder="사이즈:수량 (예: S:100, M:150, L:80)" value={line.sizesText} onChange={(e) => setLines(lines.map((l, li) => (li === i ? { ...l, sizesText: e.target.value } : l)))}
                      className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] font-mono focus:outline-none focus:border-[#2563EB]" />
                    <button onClick={() => setLines(lines.filter((_, li) => li !== i))} disabled={lines.length === 1}
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:text-red-500 disabled:opacity-30">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setLines([...lines, { team: "", player: "", sizesText: "" }])}
                  className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />라인 추가</button>
              </div>

              <button onClick={submitCreate} disabled={createSubmitting}
                className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
                {createSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}등록
              </button>
            </div>
          )}

          {deleteError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2">{deleteError}</div>
          )}

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2">
              <span className="text-[12px] text-blue-700 font-medium">{selectedIds.size}건 선택됨</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds(new Set())} className="text-[11px] text-[#64748B] hover:text-[#0F172A]">선택 해제</button>
                <button onClick={handleBulkDelete} disabled={bulkDeleting}
                  className="h-7 px-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                  {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}선택 삭제
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-3.5 py-2.5 w-8">
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="cursor-pointer" />
                    </th>
                    {["PO번호", "스타일", "브랜드", "고객사", "시즌", "상태", "납기일", "출고방식", "총수량"].map((col) => (
                      <th key={col} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {loading && (
                    <tr><td colSpan={10} className="px-3.5 py-8 text-center text-[12px] text-[#94A3B8]">불러오는 중...</td></tr>
                  )}
                  {!loading && loadError && (
                    <tr><td colSpan={10} className="px-3.5 py-8 text-center text-[12px] text-red-600">{loadError}</td></tr>
                  )}
                  {!loading && !loadError && filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-3.5 py-8 text-center text-[12px] text-[#94A3B8]">등록된 PO가 없습니다.</td></tr>
                  )}
                  {!loading && !loadError && filtered.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => { setSelected(po); setTab("info"); }}
                      className={cn("hover:bg-[#F8FAFC] cursor-pointer transition-colors", selected?.id === po.id ? "bg-blue-50" : "")}
                    >
                      <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(po.id)} onChange={() => toggleSelectOne(po.id)} className="cursor-pointer" />
                      </td>
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
            <div className="flex items-center gap-1">
              <button onClick={() => handleDelete(selected)} disabled={deleting}
                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#94A3B8] hover:text-red-500 disabled:opacity-50" title="삭제">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
            </div>
          </div>
          {deleteError && (
            <div className="mx-5 mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 shrink-0">{deleteError}</div>
          )}

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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#64748B]">라인 상세 (팀/플레이어 · 사이즈별 수량)</span>
                    <button onClick={() => setAddingLine((v) => !v)} className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />라인 추가
                    </button>
                  </div>
                  {detailLoading && <div className="text-[11px] text-[#94A3B8] py-2">불러오는 중...</div>}
                  {!detailLoading && detail && detail.lines.length === 0 && (
                    <div className="text-[11px] text-[#94A3B8] py-2">등록된 라인이 없습니다.</div>
                  )}
                  {!detailLoading && detail && detail.lines.length > 0 && (
                    <div className="space-y-1.5">
                      {detail.lines.map((line) => (
                        <div key={line.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#0F172A]">{[line.team, line.player].filter(Boolean).join(" · ") || "-"}</span>
                            <span className="text-[11px] text-[#64748B] tabular-nums">{line.totalQty.toLocaleString()}개</span>
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-1 font-mono">
                            {line.sizes.map((s) => `${s.sizeCode}:${s.qty}`).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingLine && (
                    <div className="mt-2 bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
                      {addLineError && <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1">{addLineError}</div>}
                      <input placeholder="팀 (선택)" value={addLineForm.team} onChange={(e) => setAddLineForm({ ...addLineForm, team: e.target.value })}
                        className="w-full h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                      <input placeholder="플레이어 (선택)" value={addLineForm.player} onChange={(e) => setAddLineForm({ ...addLineForm, player: e.target.value })}
                        className="w-full h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] focus:outline-none focus:border-[#2563EB]" />
                      <input placeholder="사이즈:수량 (예: S:100, M:150)" value={addLineForm.sizesText} onChange={(e) => setAddLineForm({ ...addLineForm, sizesText: e.target.value })}
                        className="w-full h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] font-mono focus:outline-none focus:border-[#2563EB]" />
                      <button onClick={handleAddLine} disabled={addLineSubmitting}
                        className="h-8 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                        {addLineSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}추가
                      </button>
                    </div>
                  )}
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
