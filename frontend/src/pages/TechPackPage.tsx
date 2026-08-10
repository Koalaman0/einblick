import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";
import type { Status } from "@/types";

interface ProgramDto { id: number; brand: string; styleCode: string; styleName: string | null; season: string | null }
interface TechPackFileDto {
  id: number;
  fileName: string;
  brand: string;
  season: string | null;
  fileType: string;
  fileSize: number;
  status: string;
  updatedAt: string;
  uploaderName: string | null;
}

const STATUS_LABELS: Record<string, Status> = { IN_PROGRESS: "진행중", IN_REVIEW: "검토중", APPROVED: "승인완료" };
const STATUS_KEYS = Object.keys(STATUS_LABELS);
const STATUS_BADGE_CLASS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-50 text-blue-700", IN_REVIEW: "bg-amber-50 text-amber-700", APPROVED: "bg-green-50 text-green-700",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function TechPackPage() {
  const [files, setFiles] = useState<TechPackFileDto[]>([]);
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ programId: "", fileType: "TECH_PACK" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch("/api/techpack-files").then((r) => { if (!r.ok) throw new Error(`파일 목록을 불러오지 못했습니다 (${r.status})`); return r.json(); }),
      apiFetch("/api/programs").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([f, p]) => { setFiles(f); setPrograms(p); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const submitUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!form.programId || !file) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const body = new FormData();
      body.append("programId", form.programId);
      body.append("fileType", form.fileType);
      body.append("file", file);
      const res = await apiFetch("/api/techpack-files", { method: "POST", body });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? `업로드 실패 (${res.status})`);
      }
      setUploading(false);
      setForm({ programId: "", fileType: "TECH_PACK" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (f: TechPackFileDto, status: string) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/techpack-files/${f.id}/status`, {
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

  const download = async (f: TechPackFileDto) => {
    setActionError(null);
    try {
      const res = await apiFetch(`/api/techpack-files/${f.id}/download`);
      if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">TECH PACK / ARTWORK 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">기술 사양서 및 아트워크 파일 관리</p>
        </div>
        <button onClick={() => setUploading((v) => !v)} className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B] flex items-center gap-1.5 hover:bg-[#F8FAFC]">
          <Upload className="w-3.5 h-3.5" />파일 업로드
        </button>
      </div>

      {actionError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>}

      {uploading && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">파일 업로드</h3>
            <button onClick={() => setUploading(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="">스타일 선택</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.styleCode} ({p.brand})</option>)}
            </select>
            <select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              <option value="TECH_PACK">TECH PACK</option>
              <option value="ARTWORK">ARTWORK</option>
            </select>
            <input ref={fileInputRef} type="file"
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 text-[12px] focus:outline-none focus:border-[#2563EB] file:mr-2 file:h-full file:border-0 file:bg-transparent file:text-[12px]" />
          </div>
          <button onClick={submitUpload} disabled={submitting || !form.programId}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}업로드
          </button>
        </div>
      )}

      {loading && <div className="text-center text-[12px] text-[#94A3B8] py-8">불러오는 중...</div>}
      {!loading && error && <div className="text-center text-[12px] text-red-600 py-8">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {["파일명", "브랜드", "시즌", "유형", "크기", "수정일", "담당자", "상태", ""].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#F1F5F9] rounded-lg flex items-center justify-center text-[9px] font-bold text-[#64748B]">{f.fileName.split(".").pop()?.toUpperCase().slice(0, 3)}</div>
                      <span className="text-[12px] text-[#0F172A] font-medium">{f.fileName}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-[12px] text-[#64748B]">{f.brand}</td>
                  <td className="px-3.5 py-3"><span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{f.season ?? "-"}</span></td>
                  <td className="px-3.5 py-3"><span className={cn("text-[11px] px-2 py-0.5 rounded-md font-medium", f.fileType === "TECH_PACK" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{f.fileType === "TECH_PACK" ? "TECH PACK" : "ARTWORK"}</span></td>
                  <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{formatSize(f.fileSize)}</td>
                  <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{f.updatedAt.slice(0, 10)}</td>
                  <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{f.uploaderName ?? "-"}</td>
                  <td className="px-3.5 py-3">
                    <select value={f.status} onChange={(e) => changeStatus(f, e.target.value)}
                      className={cn("text-[11px] font-medium rounded-full px-2 py-0.5 border-0 focus:outline-none cursor-pointer", STATUS_BADGE_CLASS[f.status])}>
                      {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-3.5 py-3">
                    <button onClick={() => download(f)} className="text-[#64748B] hover:text-[#2563EB]" title="다운로드">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={9} className="text-center text-[11px] text-[#94A3B8] py-8">업로드된 파일이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
