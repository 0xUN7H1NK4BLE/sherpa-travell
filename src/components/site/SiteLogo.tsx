"use client";

import { useTheme } from "@/lib/useTheme";

/**
 * Brand logo. "theme" picks the variant for the current theme (dark-mode logo
 * on light surfaces); "light" forces the light-coloured logo for dark
 * surfaces; "dark" forces the dark-coloured logo.
 */
export default function SiteLogo({
  variant = "theme",
  className,
  alt = "Sherpa Treks Nepal",
}: {
  variant?: "theme" | "light" | "dark";
  className?: string;
  alt?: string;
}) {
  const theme = useTheme();
  const src =
    variant === "light"
      ? "/images/whites-mode-logo.png"
      : variant === "dark"
        ? "/images/dark-mode-logo.png"
        : theme === "dark"
          ? "/images/whites-mode-logo.png"
          : "/images/dark-mode-logo.png";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={256} height={256} className={className} />
  );
}
