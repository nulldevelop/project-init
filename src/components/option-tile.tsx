"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionTileProps {
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  multi?: boolean;
  onClick: () => void;
}

export function OptionTile({ icon, label, description, selected, disabled, multi, onClick }: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500/60",
        selected ? "bg-orange-500/[0.07] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200",
        disabled && "pointer-events-none opacity-30"
      )}
    >
      {/* Indicator */}
      {multi ? (
        <div
          className={cn(
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            selected ? "border-orange-500 bg-orange-500" : "border-zinc-700"
          )}
        >
          {selected && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
        </div>
      ) : (
        <div
          className={cn(
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-orange-500" : "border-zinc-700"
          )}
        >
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
        </div>
      )}

      {/* Icon */}
      <span className="shrink-0 text-base leading-none">{icon}</span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[12px] font-medium leading-none", selected ? "text-zinc-100" : "text-zinc-300")}>
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-none text-zinc-500">{description}</p>
      </div>
    </button>
  );
}
