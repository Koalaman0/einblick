import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE_URL, setToken, clearToken, getToken } from "@/lib/apiConfig";

interface AuthUser {
  userId: number;
  name: string;
  loginId: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  signup: (name: string, loginId: string, password: string, brandScope?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "einblick_user";

async function parseAuthResponse(res: Response): Promise<AuthUser> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "요청에 실패했습니다.");
  }
  const data = await res.json();
  setToken(data.token);
  const authUser: AuthUser = { userId: data.userId, name: data.name, loginId: data.loginId, role: data.role };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
  return authUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearToken();
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginId: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    setUser(await parseAuthResponse(res));
  };

  const signup = async (name: string, loginId: string, password: string, brandScope?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, loginId, password, brandScope }),
    });
    setUser(await parseAuthResponse(res));
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
