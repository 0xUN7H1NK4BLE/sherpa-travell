"use client";

import { useEffect, useState, type RefObject } from "react";

export function useThemeColor(
  elementRef: RefObject<HTMLElement | null>,
  cssVar: string,
  fallback: string,
): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const read = () => {
      const value = getComputedStyle(el).getPropertyValue(cssVar).trim();
      if (value) setColor(value);
    };
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [elementRef, cssVar]);

  return color;
}
