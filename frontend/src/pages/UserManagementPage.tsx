import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiConfig";
import { useAuth } from "@/contexts/AuthContext";

interface UserDto {
  id: number;
  name: string;
  loginId: string;
  role: string;
  brandScope: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자", DIRECTOR: "이사", MANAGER: "팀장", STAFF: "담당자",
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700 border-red-200",
  DIRECTOR: "bg-amber-50 text-amber-700 border-amber-200",
  MANAGER: "bg-violet-50 text-violet-700 border-violet-200",
  STAFF: "bg-blue-50 text-blue-700 border-blue-200",
};

const ROLES = ["STAFF", "MANAGER", "DIRECTOR", "ADMIN"];

interface EditForm {
  name: string;
  role: string;
  brandScope: string;
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", role: "STAFF", brandScope: "" });

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", loginId: "", password: "", role: "STAFF", brandScope: "" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    apiFetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error(`사용자 목록을 불러오지 못했습니다 (${res.status})`);
        return res.json() as Promise<UserDto[]>;
      })
      .then(setUsers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "사용자 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const startEdit = (u: UserDto) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, role: u.role, brandScope: u.brandScope ?? "" });
    setActionError(null);
  };

  const saveEdit = async (id: number) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, role: editForm.role, brandScope: editForm.brandScope || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `수정 실패 (${res.status})`);
      }
      setEditingId(null);
      loadUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (u: UserDto) => {
    if (!confirm(`${u.name} 계정을 삭제하시겠습니까?`)) return;
    setActionError(null);
    try {
      const res = await apiFetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `삭제 실패 (${res.status})`);
      }
      loadUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  const submitCreate = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `생성 실패 (${res.status})`);
      }
      setCreating(false);
      setCreateForm({ name: "", loginId: "", password: "", role: "STAFF", brandScope: "" });
      loadUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">사용자 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">총 {users.length}명</p>
        </div>
        <button onClick={() => { setCreating((v) => !v); setActionError(null); }}
          className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />사용자 추가
        </button>
      </div>

      {actionError && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</div>
      )}

      {creating && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">새 사용자 추가</h3>
            <button onClick={() => setCreating(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="이름" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <input placeholder="아이디" value={createForm.loginId} onChange={(e) => setCreateForm({ ...createForm, loginId: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <input placeholder="초기 비밀번호" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]" />
            <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB]">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <input placeholder="담당 브랜드 (선택)" value={createForm.brandScope} onChange={(e) => setCreateForm({ ...createForm, brandScope: e.target.value })}
              className="h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] col-span-2 focus:outline-none focus:border-[#2563EB]" />
          </div>
          <button onClick={submitCreate} disabled={submitting || !createForm.name || !createForm.loginId || !createForm.password}
            className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}추가
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["사용자", "아이디", "역할", "담당 브랜드", "가입일", "관리"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8FAFC]">
            {loading && (
              <tr><td colSpan={6} className="px-3.5 py-8 text-center text-[12px] text-[#94A3B8]">불러오는 중...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6} className="px-3.5 py-8 text-center text-[12px] text-red-600">{error}</td></tr>
            )}
            {!loading && !error && users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                {editingId === u.id ? (
                  <>
                    <td className="px-3.5 py-3">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 text-[12px] w-28" />
                    </td>
                    <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{u.loginId}</td>
                    <td className="px-3.5 py-3">
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 text-[12px]">
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td className="px-3.5 py-3">
                      <input value={editForm.brandScope} onChange={(e) => setEditForm({ ...editForm, brandScope: e.target.value })}
                        className="h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 text-[12px] w-28" />
                    </td>
                    <td className="px-3.5 py-3 text-[11px] text-[#94A3B8]">{u.createdAt.slice(0, 10)}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => saveEdit(u.id)} disabled={submitting} className="h-7 px-2.5 text-[11px] bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8]">저장</button>
                        <button onClick={() => setEditingId(null)} className="h-7 px-2.5 text-[11px] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC]">취소</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">{u.name.charAt(0)}</div>
                        <span className="text-[13px] font-medium text-[#0F172A]">{u.name}</span>
                        {currentUser?.userId === u.id && <span className="text-[10px] text-[#94A3B8]">(나)</span>}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-[11px] text-[#64748B]">{u.loginId}</td>
                    <td className="px-3.5 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", ROLE_STYLE[u.role])}>{ROLE_LABELS[u.role] ?? u.role}</span></td>
                    <td className="px-3.5 py-3 text-[12px] text-[#64748B]">{u.brandScope || "-"}</td>
                    <td className="px-3.5 py-3 text-[11px] text-[#94A3B8]">{u.createdAt.slice(0, 10)}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(u)} className="h-7 px-2.5 text-[11px] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC]">수정</button>
                        <button onClick={() => deleteUser(u)} className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
