import { cn } from "@/lib/utils";

export default function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron",
        className,
      )}
    >
      <span className="h-px w-8 bg-saffron" aria-hidden />
      {children}
    </p>
  );
}
