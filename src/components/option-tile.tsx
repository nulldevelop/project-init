"use client";

import { cn } from "@/lib/utils";

interface OptionTileProps {
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function OptionTile({ icon, label, description, selected, disabled, onClick }: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3.5 text-left transition-all",
        "w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        selected
          ? "border-blue-500 bg-blue-500/10 text-zinc-100"
          : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-sm font-medium leading-none">{label}</span>
      <span className="text-xs text-zinc-500 leading-snug">{description}</span>
    </button>
  );
}
