import { useState, type FormEvent } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [brandScope, setBrandScope] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(loginId, password);
      } else {
        await signup(name, loginId, password, brandScope || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-[15px] font-semibold text-[#0F172A]">한림 OUTERSTUFF</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">업무관리시스템 v1.0</div>
        </div>

        <div className="flex mb-5 bg-[#F8FAFC] rounded-lg p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 h-8 rounded-md text-[12px] font-medium transition-colors ${mode === m ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B]"}`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">이름</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">아이디</label>
            <input required value={loginId} onChange={(e) => setLoginId(e.target.value)}
              className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">비밀번호</label>
            <input required type="password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
          </div>
          {mode === "signup" && (
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">담당 브랜드 (선택)</label>
              <input value={brandScope} onChange={(e) => setBrandScope(e.target.value)}
                className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
            </div>
          )}

          {error && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full h-9 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-colors mt-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "로그인" : "가입하고 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
