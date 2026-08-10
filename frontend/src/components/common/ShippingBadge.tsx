import { Plane, Ship, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingMethod } from "@/types";

export function ShippingBadge({ method }: { method: ShippingMethod }) {
  const s: Record<ShippingMethod, string> = {
    AIR: "bg-sky-50 text-sky-700 border-sky-200",
    BOAT: "bg-teal-50 text-teal-700 border-teal-200",
    SPLIT: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const icon = method === "AIR" ? <Plane className="w-3 h-3" /> : method === "BOAT" ? <Ship className="w-3 h-3" /> : <Scissors className="w-3 h-3" />;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", s[method])}>
      {icon}{method}
    </span>
  );
}
