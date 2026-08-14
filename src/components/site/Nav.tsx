"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import SiteLogo from "@/components/site/SiteLogo";
import ThemeToggle from "@/components/site/ThemeToggle";

type NavListItem = { slug: string; name: string };

export default function Nav({
  treks = [],
  expeditions = [],
}: {
  treks?: NavListItem[];
  expeditions?: NavListItem[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  const dropdowns: Record<string, { base: string; items: NavListItem[] }> = {
    "/treks": { base: "/treks", items: treks },
    "/expeditions": { base: "/expeditions", items: expeditions },
  };

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-26 md:px-8">
        <Link
          href="/"
          aria-label="Sherpa Treks Nepal — home"
          className="group flex items-center gap-2 md:gap-2.5"
        >
          <SiteLogo variant="dark" className="h-10 w-10 md:h-24 md:w-24" />
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-xl tracking-tight text-snow transition-colors group-hover:text-saffron">
              Sherpa Treks
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-eyebrow text-saffron sm:inline">
              Nepal
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {site.nav.map((item) => {
            const dropdown = dropdowns[item.href];
            if (!dropdown) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative text-sm tracking-wide transition-colors",
                    isActive(item.href) ? "text-saffron" : "text-snow/80 hover:text-snow",
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
              );
            }

            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "relative text-sm tracking-wide transition-colors",
                    isActive(item.href) ? "text-saffron" : "text-snow/80 hover:text-snow",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px bg-saffron transition-all duration-300",
                      isActive(item.href) ? "w-full" : "w-0 group-hover:w-full",
                    )}
                    aria-hidden
                  />
                </Link>

                {dropdown.items.length > 0 && (
                  <div
                    className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-3 group-hover:opacity-100"
                  >
                    <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-night/95 p-2 shadow-xl backdrop-blur-md">
                      {dropdown.items.map((entry) => (
                        <Link
                          key={entry.slug}
                          href={`${dropdown.base}/${entry.slug}`}
                          className="block truncate rounded-lg px-3 py-2 text-sm text-snow/85 transition-colors hover:bg-night-raised hover:text-saffron"
                        >
                          {entry.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
            <div className="flex flex-col gap-1 px-5 py-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
              {site.nav.map((item) => {
                const dropdown = dropdowns[item.href];
                if (!dropdown || dropdown.items.length === 0) {
                  return (
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
                  );
                }

                const expanded = mobileExpanded === item.href;
                return (
                  <div key={item.href}>
                    <div className="flex items-center justify-between rounded-lg px-3">
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "py-3 font-display text-2xl",
                          isActive(item.href) ? "text-saffron" : "text-snow",
                        )}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileExpanded(expanded ? null : item.href)}
                        aria-expanded={expanded}
                        aria-label={`Toggle ${item.label} list`}
                        className="flex h-10 w-10 items-center justify-center text-snow/70"
                      >
                        <span
                          className={cn(
                            "transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        >
                          ▾
                        </span>
                      </button>
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto py-1 pl-6">
                            {dropdown.items.map((entry) => (
                              <Link
                                key={entry.slug}
                                href={`${dropdown.base}/${entry.slug}`}
                                onClick={() => setOpen(false)}
                                className="truncate rounded-lg px-3 py-2 text-sm text-snow/75"
                              >
                                {entry.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
