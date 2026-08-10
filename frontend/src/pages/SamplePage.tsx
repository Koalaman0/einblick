import { useEffect, useState } from "react";
import { Plus, Clock, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";

interface SampleDto {
  id: number;
  styleCode: string;
  brand: string;
  type: string;
  status: string;
  commentSource: string | null;
  dueDate: string | null;
  createdAt: string;
}

interface ProgramDto { id: number; brand: string; styleCode: string; styleName: string | null; season: string | null }

const TYPES = ["SMS", "FIT", "APPROVAL", "TOP", "GB_TEST", "WALMART_TEST", "CNS_TEST"];
const TYPE_LABELS: Record<string, string> = {
  SMS: "SMS", FIT: "FIT", APPROVAL: "APPROVAL", TOP: "TOP",
  GB_TEST: "GB TEST", WALMART_TEST: "WALMART TEST", CNS_TEST: "CNS TEST",
};
const TYPE_META: Record<string, { dot: string; hdr: string }> = {
  SMS: { dot: "bg-blue-500", hdr: "bg-blue-50 border-blue-100" },
  FIT: { dot: "bg-violet-500", hdr: "bg-violet-50 border-violet-100" },
  APPROVAL: { dot: "bg-amber-500", hdr: "bg-amber-50 border-amber-100" },
  TOP: { dot: "bg-green-500", hdr: "bg-green-50 border-green-100" },
  GB_TEST: { dot: "bg-teal-500", hdr: "bg-teal-50 border-teal-100" },
  WALMART_TEST: { dot: "bg-cyan-500", hdr: "bg-cyan-50 border-cyan-100" },
  CNS_TEST: { dot: "bg-rose-500", hdr: "bg-rose-50 border-rose-100" },
};
const STATUS_LABELS: Record<string, string> = {
  PREPARING: "준비중", SENT: "발송됨", COMMENT_WAIT: "코멘트 대기", APPROVED: "승인완료", FAIL: "불합격",
};
const STATUS_BADGE: Record<string, string> = {
  PREPARING: "bg-slate-100 text-slate-600", SENT: "bg-blue-50 text-blue-700",
  COMMENT_WAIT: "bg-amber-50 text-amber-700", APPROVED: "bg-green-50 text-green-700", FAIL: "bg-red-50 text-red-700",
};

export function SamplePage() {
  const [samples, setSamples] = useState<SampleDto[]>([]);
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ programId: "", type: "SMS", dueDate: "", commentSource: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/samples").then((r) => { if (!r.ok) throw new Error(`목록을 불러오지 못했습니다 (${r.status})`); return r.json(); }),
      apiFetch("/api/programs").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, p]) => { setSamples(s); setPrograms(p); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const moveSample = async (sample: SampleDto, toType: string) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/samples/${sample.id}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: toType }),
      });
      if (!res.ok) throw new Error(`이동 실패 (${res.status})`);
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "이동 중 오류가 발생했습니다.");
    }
  };

  const changeStatus = async (sample: SampleDto, status: string) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/samples/${sample.id}/status`, {
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

  const submitCreate = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: Number(form.programId),
          type: form.type,
          dueDate: form.dueDate || null,
          commentSource: form.commentSource || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `등록 실패 (${res.status})`);
      }
      setCreating(false);
      setForm({ programId: "", type: "SMS", dueDate: "", commentSource: "" });
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">샘플 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">칸반 보드 · 총 {samples.length}건</p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="h-8 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />샘플 등록
        </button>
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 shrink-0">{actionError}</div>}

      {creating && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3 mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">새 샘플 등록</h3>
            <button onClick={() => setCreating(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="">스타일 선택</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.styleCode} ({p.brand})</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <input placeholder="코멘트 출처 (선택, 예: 바이어)" value={form.commentSource} onChange={(e) => setForm({ ...form, commentSource: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
          </div>
          <button onClick={submitCreate} disabled={submitting || !form.programId}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}등록
          </button>
        </div>
      )}

      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}

      {!loading && !error && (
        <div className="flex gap-3.5 flex-1 overflow-x-auto pb-2">
          {TYPES.map((col) => {
            const meta = TYPE_META[col];
            const cards = samples.filter((s) => s.type === col);
            return (
              <div key={col} className="w-[230px] shrink-0 flex flex-col">
                <div className={cn("rounded-t-xl p-3 flex items-center gap-2 border", meta.hdr)}>
                  <div className={cn("w-2.5 h-2.5 rounded-full", meta.dot)} />
                  <span className="text-[13px] font-semibold text-[#0F172A]">{TYPE_LABELS[col]}</span>
                  <span className="text-[10px] bg-white text-[#64748B] rounded-full px-1.5 py-0.5 font-semibold border border-[#E2E8F0]">{cards.length}</span>
                </div>
                <div className="flex-1 bg-[#F8FAFC] rounded-b-xl border border-t-0 border-[#E2E8F0] p-2 space-y-2 overflow-y-auto min-h-[120px]">
                  {cards.map((card) => (
                    <div key={card.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#0F172A] font-mono leading-tight">{card.styleCode}</span>
                        <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] rounded px-1.5 py-0.5">{card.brand}</span>
                      </div>
                      <select value={card.status} onChange={(e) => changeStatus(card, e.target.value)}
                        className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 border-0 focus:outline-none cursor-pointer mb-2", STATUS_BADGE[card.status])}>
                        {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>{card.commentSource ?? "-"}</span>
                        {card.dueDate && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{card.dueDate.slice(5)}</span>}
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-[#F8FAFC] flex-wrap">
                        <span className="text-[10px] text-[#94A3B8]">이동:</span>
                        {TYPES.filter((t) => t !== col).map((to) => (
                          <button key={to} onClick={() => moveSample(card, to)}
                            className={cn("text-[10px] px-1.5 py-0.5 rounded text-white font-medium", TYPE_META[to].dot)}>
                            {TYPE_LABELS[to]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="h-14 flex items-center justify-center text-[11px] text-[#CBD5E1] border-2 border-dashed border-[#E2E8F0] rounded-xl">항목 없음</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
