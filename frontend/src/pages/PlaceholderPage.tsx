import type React from "react";

// ── Reference / Settings Placeholder ──────────────────────
export function PlaceholderPage({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="p-5 h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-[#94A3B8]" />
        </div>
        <h2 className="text-[15px] font-semibold text-[#0F172A]">{title}</h2>
        <p className="text-[13px] text-[#64748B] mt-1">{desc}</p>
      </div>
    </div>
  );
}
