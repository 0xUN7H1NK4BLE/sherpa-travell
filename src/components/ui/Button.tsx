import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost";
type Size = "md" | "lg";

const variantStyles: Record<Variant, string> = {
  solid:
    "bg-saffron text-night hover:bg-snow focus-visible:outline-saffron",
  ghost:
    "border border-white/25 text-snow hover:border-saffron hover:text-saffron focus-visible:outline-saffron",
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
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4",
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
