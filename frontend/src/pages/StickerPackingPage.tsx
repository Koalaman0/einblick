import { useState } from "react";
import { CheckCircle, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickerPackingPage() {
  const [qty, setQty] = useState("1200");
  const [inner, setInner] = useState("12");
  const [outer, setOuter] = useState("6");
  const [lpnDone, setLpnDone] = useState(false);

  const totalQty = parseInt(qty) || 0;
  const innerQty = parseInt(inner) || 1;
  const outerQty = parseInt(outer) || 1;
  const innerCount = Math.ceil(totalQty / innerQty);
  const cartonCount = Math.ceil(innerCount / outerQty);

  return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">스티커 · 패킹 관리</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">패킹 계산 및 LPN 생성</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">패킹 정보 입력</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">PO 번호</label>
                <select className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
                  <option>PO-2024-0823</option><option>PO-2024-0824</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">스타일</label>
                <select className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
                  <option>NK-JKT-2401</option><option>AD-PNT-2403</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">UPC 코드</label>
                <input defaultValue="0 12345 67890 5" className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["총 수량", qty, setQty], ["이너팩 단위", inner, setInner], ["카톤 단위 (이너팩)", outer, setOuter]].map(([label, val, set]) => (
                    <div key={label as string} className={label === "총 수량" ? "col-span-2" : ""}>
                      <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                             className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]" />
                    </div>
                ))}
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] mb-1.5 block">패킹 방식</label>
                  <select className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
                    <option>혼합 패킹</option><option>단일 패킹</option><option>사이즈별 분리</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-[13px] font-semibold text-[#0F172A] mb-4">자동 계산 결과</h3>
              <div className="grid grid-cols-2 gap-3">
                {[["총 수량", `${totalQty.toLocaleString()}개`, "blue"], ["이너팩 수", `${innerCount}개`, "violet"], ["카톤 수", `${cartonCount}CTN`, "amber"], ["LPN 수량", `${cartonCount}개`, "green"]].map(([l, v, c]) => (
                    <div key={l} className={cn("rounded-xl p-3.5 border", c === "blue" ? "bg-blue-50 border-blue-100" : c === "violet" ? "bg-violet-50 border-violet-100" : c === "amber" ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100")}>
                      <div className={cn("text-xl font-bold", c === "blue" ? "text-blue-700" : c === "violet" ? "text-violet-700" : c === "amber" ? "text-amber-700" : "text-green-700")}>{v}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{l}</div>
                    </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-[13px] font-semibold text-[#0F172A] mb-3">스티커 유형</h3>
              <div className="space-y-2">
                {[["PRN", "Prepack Reference Number", innerCount, "blue"], ["UPC", "Universal Product Code", totalQty, "teal"], ["LPN", "License Plate Number", cartonCount, "violet"]].map(([type, desc, count, c]) => (
                    <div key={type} className={cn("flex items-center justify-between p-3 rounded-xl border", c === "blue" ? "border-blue-100 bg-blue-50" : c === "teal" ? "border-teal-100 bg-teal-50" : "border-violet-100 bg-violet-50")}>
                      <div>
                        <div className={cn("text-[12px] font-bold", c === "blue" ? "text-blue-700" : c === "teal" ? "text-teal-700" : "text-violet-700")}>{type}</div>
                        <div className="text-[10px] text-[#64748B]">{desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold text-[#0F172A]">{(count as number).toLocaleString()}매</div>
                        <button className="text-[11px] text-[#2563EB] hover:underline">출력</button>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <button onClick={() => setLpnDone(true)} className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
              <Hash className="w-4 h-4" />LPN 생성
            </button>
            {lpnDone && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[11px] text-green-700">LPN {cartonCount}개 생성 완료 (LPN-2024-0001 ~ LPN-2024-{cartonCount.toString().padStart(4, "0")})</span>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
