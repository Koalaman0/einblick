import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    진행중: "bg-blue-50 text-blue-700 border-blue-200",
    검토중: "bg-amber-50 text-amber-700 border-amber-200",
    완료: "bg-green-50 text-green-700 border-green-200",
    지연: "bg-red-50 text-red-700 border-red-200",
    취소: "bg-slate-100 text-slate-500 border-slate-200",
    대기: "bg-slate-100 text-slate-600 border-slate-200",
    승인대기: "bg-purple-50 text-purple-700 border-purple-200",
    승인완료: "bg-green-50 text-green-700 border-green-200",
    테스트중: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", s[status] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {status}
    </span>
  );
}
