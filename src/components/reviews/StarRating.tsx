import { cn } from "@/lib/utils";

export function Star({
  filled,
  size = "md",
  className,
}: {
  filled: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85z"
      />
    </svg>
  );
}

export default function StarRating({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex gap-0.5 text-saffron", className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= rating} size={size} />
      ))}
    </div>
  );
}
