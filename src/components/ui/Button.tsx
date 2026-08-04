import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost";
type Size = "md" | "lg";

const variantStyles: Record<Variant, string> = {
  solid:
    "bg-saffron text-night hover:bg-snow focus-visible:outline-saffron before:via-white/45 hover:shadow-[0_18px_40px_-16px_rgba(245,158,11,0.55)]",
  ghost:
    "border border-line-strong text-snow hover:border-saffron hover:text-saffron focus-visible:outline-saffron before:via-white/10",
};

const sizeStyles: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface ButtonProps {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  className?: string;
}

export default function Button({
  children,
  href,
  variant = "solid",
  size = "md",
  external = false,
  className,
}: ButtonProps) {
  const styles = cn(
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium tracking-wide transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 hover:-translate-y-0.5 active:translate-y-0 before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-150%] before:skew-x-12 before:bg-gradient-to-r before:from-transparent before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-[150%]",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}
