import { useEffect, useRef, useState, type ChangeEvent, type ElementType } from "react";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, AlertCircle, FileDown, FileUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";

interface ReconciliationResultDto {
  id: number;
  styleCode: string;
  brand: string;
  team: string | null;
  player: string | null;
  poNumber: string | null;
  poQty: number | null;
  customerLabel: string | null;
  assortQty: number | null;
  diffQty: number;
  status: string;
  houseMatched: boolean;
  note: string | null;
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
  OK: { label: "일치", badge: "bg-green-100 text-green-700" },
  QTY_MISMATCH: { label: "불일치", badge: "bg-red-100 text-red-700" },
  MISSING_IN_ASSORT: { label: "ASSORT 누락", badge: "bg-slate-100 text-slate-600" },
  MISSING_IN_PO: { label: "PO 누락", badge: "bg-slate-100 text-slate-600" },
  NEEDS_REVIEW: { label: "확인 필요", badge: "bg-amber-100 text-amber-700" },
};

function lineLabel(r: ReconciliationResultDto): string {
  return [r.team, r.player].filter(Boolean).join(" · ") || "-";
}

export function ReconciliationPage() {
  const [results, setResults] = useState<ReconciliationResultDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [uploadingAssort, setUploadingAssort] = useState(false);
  const [assortUploadError, setAssortUploadError] = useState<string | null>(null);
  const [assortUploadNotice, setAssortUploadNotice] = useState<string | null>(null);
  const assortFileInputRef = useRef<HTMLInputElement>(null);

  const loadResults = () => {
    setLoading(true);
    setError(null);
    apiFetch("/api/reconciliation")
      .then((res) => {
        if (!res.ok) throw new Error(`대사 결과를 불러오지 못했습니다 (${res.status})`);
        return res.json() as Promise<ReconciliationResultDto[]>;
      })
      .then((data) => {
        setResults(data);
        if (data.length > 0) setHasRun(true);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "대사 결과를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await apiFetch("/api/reconciliation/run", { method: "POST" });
      if (!res.ok) throw new Error(`대사 실행에 실패했습니다 (${res.status})`);
      const data = (await res.json()) as ReconciliationResultDto[];
      setResults(data);
      setHasRun(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대사 실행 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setReportError(null);
    try {
      const res = await apiFetch("/api/reconciliation/report");
      if (!res.ok) throw new Error(`보고서 생성에 실패했습니다 (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `PO-ASSORT_대사보고서_${today}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "보고서 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleAssortFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAssort(true);
    setAssortUploadError(null);
    setAssortUploadNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/assort/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `업로드 실패 (${res.status})`);
      }
      const result: { rowsRead: number; created: number; skippedRows: number } = await res.json();
      const parts = [`엑셀 ${result.rowsRead}행 읽음, ASSORT ${result.created}건 생성`];
      if (result.skippedRows > 0) parts.push(`${result.skippedRows}행 건너뜀`);
      setAssortUploadNotice(parts.join(" · "));
    } catch (err) {
      setAssortUploadError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingAssort(false);
    }
  };

  const counts = {
    ok: results.filter((r) => r.status === "OK").length,
    mismatch: results.filter((r) => r.status === "QTY_MISMATCH").length,
    review: results.filter((r) => r.status === "NEEDS_REVIEW").length,
    missing: results.filter((r) => r.status === "MISSING_IN_ASSORT" || r.status === "MISSING_IN_PO").length,
  };

  const problems = results.filter((r) => r.status !== "OK");

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">PO 자동 대사</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">PO 데이터와 ASSORT 데이터를 자동으로 비교합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={assortFileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleAssortFileChange} />
          <button onClick={() => assortFileInputRef.current?.click()} disabled={uploadingAssort}
            className="h-9 px-4 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-50 text-[#0F172A] rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
            {uploadingAssort ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            ASSORT 엑셀 업로드
          </button>
          {hasRun && (
            <button onClick={handleDownloadReport} disabled={downloadingReport}
              className="h-9 px-4 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-50 text-[#0F172A] rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
              {downloadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              보고서 다운로드
            </button>
          )}
          <button onClick={handleRun} disabled={running}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
            <RefreshCw className={cn("w-4 h-4", running ? "animate-spin" : "")} />
            {running ? "대사 실행 중..." : "자동 대사 실행"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
      )}
      {reportError && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{reportError}</div>
      )}
      {assortUploadError && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{assortUploadError}</div>
      )}
      {assortUploadNotice && (
        <div className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{assortUploadNotice}</div>
      )}

      {!loading && !error && !hasRun && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[12px] text-[#94A3B8]">
          아직 대사를 실행하지 않았습니다. PO와 ASSORT 데이터가 등록된 후 "자동 대사 실행"을 눌러주세요.
        </div>
      )}

      {hasRun && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {([["일치", counts.ok, "green", CheckCircle], ["불일치", counts.mismatch, "red", XCircle], ["확인 필요", counts.review, "amber", AlertTriangle], ["누락", counts.missing, "slate", AlertCircle]] as [string, number, string, ElementType][]).map(([label, value, c, Icon]) => (
              <div key={label} className={cn("bg-white rounded-xl border p-4 flex items-center gap-3", c === "green" ? "border-green-200" : c === "red" ? "border-red-200" : c === "amber" ? "border-amber-200" : "border-[#E2E8F0]")}>
                <Icon className={cn("w-7 h-7 shrink-0", c === "green" ? "text-green-500" : c === "red" ? "text-red-500" : c === "amber" ? "text-amber-500" : "text-[#94A3B8]")} />
                <div>
                  <div className={cn("text-2xl font-bold", c === "green" ? "text-green-600" : c === "red" ? "text-red-600" : c === "amber" ? "text-amber-600" : "text-[#94A3B8]")}>{value}건</div>
                  <div className="text-[11px] text-[#64748B]">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                    {["스타일", "팀/선수", "PO번호", "PO수량", "고객사라벨", "ASSORT수량", "차이", "상태"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold text-[#64748B] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {results.map((r) => {
                    const meta = STATUS_META[r.status] ?? { label: r.status, badge: "bg-slate-100 text-slate-600" };
                    return (
                      <tr key={r.id} className={cn("text-[11px]", r.status === "QTY_MISMATCH" ? "bg-red-50" : r.status.startsWith("MISSING") ? "bg-amber-50/50" : "")}>
                        <td className="px-3 py-2 font-mono text-[#0F172A]">{r.styleCode}</td>
                        <td className="px-3 py-2 text-[#64748B]">{lineLabel(r)}</td>
                        <td className="px-3 py-2 text-[#2563EB] font-medium">{r.poNumber ?? "-"}</td>
                        <td className="px-3 py-2 text-[#0F172A]">{r.poQty ?? "-"}</td>
                        <td className="px-3 py-2 text-[#64748B]">{r.customerLabel ? r.customerLabel : r.houseMatched ? "(공란 · HOUSE)" : "-"}</td>
                        <td className="px-3 py-2 text-[#0F172A]">{r.assortQty ?? "-"}</td>
                        <td className={cn("px-3 py-2 font-semibold", r.diffQty !== 0 ? "text-red-600" : "text-[#0F172A]")}>{r.diffQty > 0 ? `+${r.diffQty}` : r.diffQty}</td>
                        <td className="px-3 py-2">
                          <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium", meta.badge)}>{meta.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {problems.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-[13px] font-semibold text-[#0F172A] mb-3">불일치 상세 내역</h3>
              <div className="space-y-2">
                {problems.map((r) => (
                  <div key={r.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", r.status === "QTY_MISMATCH" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100")}>
                    {r.status === "QTY_MISMATCH" ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className={cn("text-[12px] font-semibold", r.status === "QTY_MISMATCH" ? "text-red-700" : "text-amber-700")}>
                        {r.status === "QTY_MISMATCH" ? "수량 차이 발견" : r.status === "MISSING_IN_ASSORT" ? "ASSORT 데이터 누락" : r.status === "MISSING_IN_PO" ? "PO 데이터 누락" : "확인 필요"}
                      </div>
                      <div className={cn("text-[11px] mt-0.5", r.status === "QTY_MISMATCH" ? "text-red-600" : "text-amber-600")}>
                        {r.styleCode} · {lineLabel(r)}: PO {r.poQty ?? "-"}개 → ASSORT {r.assortQty ?? "-"}개
                      </div>
                      {r.note && (
                        <div className="text-[11px] mt-1 text-[#64748B] bg-white/60 rounded px-2 py-1 border border-amber-100">
                          {r.note}
                        </div>
                      )}
                    </div>
                    <button className="text-[11px] text-[#2563EB] hover:underline shrink-0">처리</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
