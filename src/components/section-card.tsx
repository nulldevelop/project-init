import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80", className)}>
      <div className="border-b border-zinc-800/50 px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
        {description && <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

interface SubSectionProps {
  label: string;
  children: React.ReactNode;
}

export function SubSection({ label, children }: SubSectionProps) {
  return (
    <div>
      <p className="mb-0.5 px-3 pt-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">{label}</p>
      {children}
    </div>
  );
}
