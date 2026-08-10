import { Plus, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserManagementPage() {
  const users = [
    { id: 1, name: "정우성", email: "woosung.jung@hallim.co.kr", role: "관리자", team: "전체", active: true, login: "2시간 전", init: "정" },
    { id: 2, name: "김민준", email: "minjun.kim@hallim.co.kr", role: "팀장", team: "생산관리팀", active: true, login: "방금 전", init: "김" },
    { id: 3, name: "이서연", email: "seoyeon.lee@hallim.co.kr", role: "담당자", team: "생산1팀", active: true, login: "1시간 전", init: "이" },
    { id: 4, name: "박지훈", email: "jihoon.park@hallim.co.kr", role: "담당자", team: "생산2팀", active: true, login: "3시간 전", init: "박" },
    { id: 5, name: "최수아", email: "sua.choi@hallim.co.kr", role: "담당자", team: "생산3팀", active: true, login: "어제", init: "최" },
    { id: 6, name: "한지민", email: "jimin.han@hallim.co.kr", role: "담당자", team: "생산1팀", active: false, login: "5일 전", init: "한" },
  ];
  const roleStyle: Record<string, string> = {
    관리자: "bg-red-50 text-red-700 border-red-200",
    팀장: "bg-violet-50 text-violet-700 border-violet-200",
    담당자: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const permMatrix = [
    { feature: "PO 관리", admin: true, lead: true, staff: true },
    { feature: "샘플 관리", admin: true, lead: true, staff: true },
    { feature: "자재 발주", admin: true, lead: true, staff: false },
    { feature: "자동 대사", admin: true, lead: true, staff: false },
    { feature: "출고 관리", admin: true, lead: true, staff: true },
    { feature: "기준정보", admin: true, lead: false, staff: false },
    { feature: "사용자 관리", admin: true, lead: false, staff: false },
  ];
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">사용자 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">총 {users.length}명</p>
        </div>
        <button className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />사용자 초대</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["전체 사용자", users.length, "text-blue-600"], ["활성", users.filter(u => u.active).length, "text-green-600"], ["비활성", users.filter(u => !u.active).length, "text-[#94A3B8]"]].map(([l, v, c]) => (
          <div key={l as string} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className={cn("text-2xl font-bold", c)}>{v}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["사용자", "이메일", "역할", "팀", "상태", "마지막 로그인", "관리"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8FAFC]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">{u.init}</div>
                    <span className="text-[13px] font-medium text-[#0F172A]">{u.name}</span>
                  </div>
                </td>
                <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{u.email}</td>
                <td className="px-3.5 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", roleStyle[u.role])}>{u.role}</span></td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748B]">{u.team}</td>
                <td className="px-3.5 py-3">
                  <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", u.active ? "text-green-600" : "text-[#94A3B8]")}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", u.active ? "bg-green-500" : "bg-[#CBD5E1]")} />
                    {u.active ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-3.5 py-3 text-[11px] text-[#94A3B8]">{u.login}</td>
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-1">
                    <button className="h-7 px-2.5 text-[11px] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC]">수정</button>
                    <button className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="text-[13px] font-semibold text-[#0F172A] mb-4">권한 설정</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr>
              <th className="text-left pb-2 text-[#64748B] font-semibold w-44">기능</th>
              {["관리자", "팀장", "담당자"].map((r) => <th key={r} className="text-center pb-2 text-[#64748B] font-semibold w-24">{r}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8FAFC]">
            {permMatrix.map((row) => (
              <tr key={row.feature}>
                <td className="py-2.5 text-[#0F172A] font-medium">{row.feature}</td>
                {[row.admin, row.lead, row.staff].map((ok, i) => (
                  <td key={i} className="py-2.5 text-center">
                    {ok ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-[#E2E8F0] mx-auto" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
