import { useEffect, useState } from "react";
import {
  FileText, ArrowLeftRight, Truck, Package2, CreditCard,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { productionChart, shippingChart, recentActivities, notifications } from "@/data/mockData";
import { apiFetch } from "@/lib/apiConfig";
import type { PurchaseOrderSummary } from "@/types";

const BRAND_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0EA5E9", "#DB2777"];

interface ReconciliationStatus {
  status: string;
}

export function DashboardPage() {
  const [pos, setPos] = useState<PurchaseOrderSummary[]>([]);
  const [reconResults, setReconResults] = useState<ReconciliationStatus[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/po").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/reconciliation").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([poData, reconData]) => {
        setPos(poData);
        setReconResults(reconData);
      })
      .finally(() => setLoaded(true));
  }, []);

  const activePoCount = pos.filter((p) => p.status !== "CLOSED").length;
  const pendingReconCount = reconResults.filter((r) => r.status !== "OK").length;

  const brandChart = Object.entries(
    pos.reduce<Record<string, number>>((acc, p) => {
      acc[p.brand] = (acc[p.brand] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value], i) => ({ name, value, color: BRAND_COLORS[i % BRAND_COLORS.length] }));

  const stats = [
    { label: "진행 중 PO", value: loaded ? `${activePoCount}건` : "-", ready: true, bg: "bg-blue-50", fg: "text-blue-600", icon: FileText },
    { label: "자동 대사 대기", value: loaded ? `${pendingReconCount}건` : "-", ready: true, bg: "bg-red-50", fg: "text-red-500", icon: ArrowLeftRight },
    { label: "출고 예정", value: "-", ready: false, bg: "bg-teal-50", fg: "text-teal-600", icon: Truck },
    { label: "샘플 진행", value: "-", ready: false, bg: "bg-violet-50", fg: "text-violet-600", icon: Package2 },
    { label: "결제 대기", value: "-", ready: false, bg: "bg-amber-50", fg: "text-amber-600", icon: CreditCard },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1440px]">
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg, s.fg)}>
                  <Icon className="w-4 h-4" />
                </div>
                {!s.ready && <span className="text-[10px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded-full">준비 중</span>}
              </div>
              <div className="text-[22px] font-bold text-[#0F172A]">{s.value}</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-[#0F172A]">생산 진행률</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">월별 진행 / 완료 / 지연 현황 · 샘플 데이터 (이력 집계 기능 준비 중)</p>
            </div>
            <select className="text-[11px] border border-[#E2E8F0] rounded-lg px-2 py-1.5 bg-white text-[#64748B] focus:outline-none focus:border-[#2563EB]">
              <option>2024년</option><option>2023년</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={productionChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="진행" stroke="#2563EB" strokeWidth={2} fill="url(#gProg)" name="진행중" />
              <Area type="monotone" dataKey="완료" stroke="#16A34A" strokeWidth={2} fill="url(#gComp)" name="완료" />
              <Area type="monotone" dataKey="지연" stroke="#DC2626" strokeWidth={2} fill="none" strokeDasharray="4 2" name="지연" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="mb-3">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">브랜드별 PO 현황</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">등록된 전체 PO 기준</p>
          </div>
          {brandChart.length === 0 ? (
            <div className="h-[140px] flex items-center justify-center text-[11px] text-[#94A3B8]">등록된 PO가 없습니다.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={brandChart} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                    {brandChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}건`} contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {brandChart.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-[#64748B]">{b.name}</span>
                    </div>
                    <span className="font-semibold text-[#0F172A]">{b.value}건</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">최근 작업 내역 · 샘플 데이터 (활동 로그 준비 중)</h3>
            <button className="text-[11px] text-[#2563EB] hover:underline">전체 보기</button>
          </div>
          <div className="space-y-1">
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0", a.color)}>
                  {a.type.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[#0F172A] font-medium">{a.content}</span>
                  <span className="ml-2 text-[11px] text-[#94A3B8]">{a.user}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] rounded px-1.5 py-0.5">{a.type}</span>
                  <span className="text-[11px] text-[#94A3B8]">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">알림 · 샘플 데이터</h3>
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{notifications.length}건</span>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={cn("p-3 rounded-lg border-l-2 cursor-pointer transition-colors", n.type === "danger" ? "border-red-500 bg-red-50 hover:bg-red-100" : n.type === "warning" ? "border-amber-500 bg-amber-50 hover:bg-amber-100" : "border-blue-500 bg-blue-50 hover:bg-blue-100")}>
                <div className="text-[12px] font-semibold text-[#0F172A]">{n.title}</div>
                <div className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{n.desc}</div>
                <div className="text-[10px] text-[#94A3B8] mt-1">{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold text-[#0F172A]">출고 현황</h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">주차별 출고 방식 현황 · 샘플 데이터 (출고 이력 집계 기능 준비 중)</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={shippingChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="AIR" fill="#0EA5E9" name="항공(AIR)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="BOAT" fill="#14B8A6" name="선박(BOAT)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="SPLIT" fill="#8B5CF6" name="분할(SPLIT)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
