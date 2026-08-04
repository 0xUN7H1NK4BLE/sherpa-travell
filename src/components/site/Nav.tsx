"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import SiteLogo from "@/components/site/SiteLogo";
import ThemeToggle from "@/components/site/ThemeToggle";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 photo-dark",
        scrolled
          ? "border-b border-line bg-night/85 backdrop-blur-md"
          : "bg-night/55 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-26 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          aria-label="Sherpa Treks Nepal — home"
          className="group flex items-center gap-2.5"
        >
          <SiteLogo variant="dark" className="h-24 w-24" />
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-xl tracking-tight text-snow transition-colors group-hover:text-saffron">
              Sherpa Treks
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-saffron">
              Nepal
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm tracking-wide transition-colors",
                isActive(item.href)
                  ? "text-saffron"
                  : "text-snow/80 hover:text-snow",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute -bottom-1.5 left-0 h-px bg-saffron transition-all duration-300",
                  isActive(item.href) ? "w-full" : "w-0",
                )}
                aria-hidden
              />
            </Link>
          ))}
          <ThemeToggle />
          <a
            href={site.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-saffron px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-snow"
          >
            WhatsApp us
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={cn(
              "h-px w-6 bg-snow transition-transform duration-300",
              open && "translate-y-[3.5px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-px w-6 bg-snow transition-transform duration-300",
              open && "-translate-y-[3.5px] -rotate-45",
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="border-b border-line bg-night/95 backdrop-blur-md md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {site.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 font-display text-2xl",
                    isActive(item.href) ? "text-saffron" : "text-snow",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-3 px-3">
                <ThemeToggle />
                <a
                  href={site.contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full bg-saffron px-5 py-3 text-center font-medium text-night"
                >
                  WhatsApp us
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
