import { cn } from "@/lib/utils";

type Variant = "default" | "saffron" | "ice";

const variantStyles: Record<Variant, string> = {
  default: "border-line text-mist",
  saffron: "border-saffron/40 text-saffron",
  ice: "border-ice/40 text-ice",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
