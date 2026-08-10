import { Calendar, Check, Plus, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const matOrders = [
  { id: "MO-2024-0312", style: "NK-JKT-2401", item: "원단 (폴리에스터 100%)", supplier: "대한섬유(주)", amount: "₩8,500,000", step: 3, method: "해상운송", eta: "2024-08-20" },
  { id: "MO-2024-0313", style: "AD-PNT-2403", item: "부자재 (지퍼, 단추)", supplier: "(주)유니트레이드", amount: "₩1,200,000", step: 2, method: "항공운송", eta: "2024-08-05" },
  { id: "MO-2024-0314", style: "UA-SET-2401", item: "원단 (나일론 혼방)", supplier: "아세안섬유", amount: "₩6,800,000", step: 4, method: "해상운송", eta: "2024-09-01" },
  { id: "MO-2024-0315", style: "NB-JKT-2402", item: "라벨 (우븐 라벨)", supplier: "한국라벨(주)", amount: "₩350,000", step: 5, method: "육상운송", eta: "2024-07-25" },
];
const matSteps = ["발주", "PI", "결재", "송금", "출고"];
const stepColors = ["bg-slate-400", "bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-green-500"];

export function MaterialOrderPage() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">자재 발주 관리</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">발주 단계별 진행 현황</p>
        </div>
        <button className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />발주 등록</button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {matSteps.map((s, i) => (
          <div key={s} className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
            <div className={cn("w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-[12px] font-bold", stepColors[i])}>{i + 1}</div>
            <div className="text-[13px] font-semibold text-[#0F172A]">{s}</div>
            <div className="text-xl font-bold text-[#0F172A] mt-0.5">{matOrders.filter((o) => o.step === i + 1).length}건</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {matOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#2563EB]">{order.id}</span>
                  <span className="text-[11px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md font-mono">{order.style}</span>
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{order.item} · {order.supplier}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-[#0F172A]">{order.amount}</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">ETA: {order.eta}</div>
              </div>
            </div>
            <div className="flex items-start gap-0">
              {matSteps.map((step, i) => {
                const done = i + 1 < order.step;
                const current = i + 1 === order.step;
                return (
                  <div key={step} className="flex items-start flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-all", done ? "bg-green-500" : current ? "bg-[#2563EB] ring-4 ring-[#2563EB]/10" : "bg-[#E2E8F0]", !done && !current && "text-[#94A3B8]")}>
                        {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className={cn("text-[10px] font-medium", done ? "text-green-600" : current ? "text-[#2563EB]" : "text-[#94A3B8]")}>{step}</span>
                    </div>
                    {i < matSteps.length - 1 && <div className={cn("flex-1 h-0.5 mx-1 mt-3.5", done ? "bg-green-400" : "bg-[#E2E8F0]")} />}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F8FAFC]">
              <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{order.method}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />ETA {order.eta}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-7 px-2.5 border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] hover:bg-[#F8FAFC]">상세</button>
                <button className="h-7 px-2.5 bg-[#2563EB] text-white rounded-lg text-[11px] hover:bg-[#1D4ED8]">다음 단계</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sticker Packing ────────────────────────────────────────
