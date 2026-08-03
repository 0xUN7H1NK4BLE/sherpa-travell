"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import { site, waLink } from "@/data/site";
import { easeOut } from "@/lib/motion";

const words = ["Walk", "where", "the", "maps", "end."];

export default function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 260]);
  const opacity = useTransform(scrollY, [0, 650], [1, 0.25]);

  return (
    <section className="relative flex h-svh min-h-[640px] items-end overflow-hidden">
      <motion.div
        style={reduce ? undefined : { y, opacity }}
        className="absolute inset-0"
        aria-hidden
      >
        <img
          src="/images/hero.svg"
          alt=""
          className="h-full w-full scale-105 object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-night/80 via-night/20 to-night"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-night/60 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-28 md:px-8 md:pb-32">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron"
        >
          <span className="h-px w-10 bg-saffron" aria-hidden />
          Sherpa-guided treks in Nepal
        </motion.p>

        <h1 className="font-display text-[13vw] leading-[0.95] font-light tracking-tight text-balance sm:text-7xl md:text-8xl lg:text-9xl">
          {words.map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.15 + i * 0.09,
                  ease: easeOut,
                }}
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: easeOut }}
          className="mt-8 flex max-w-xl flex-col gap-8"
        >
          <p className="text-lg leading-relaxed text-snow/80">
            Treks and expeditions into Kanchenjunga, Dolpo, Limi Valley and the
            Everest region — led by {site.contact.name}, a Sherpa guide born in
            these mountains.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/treks" size="lg">
              Explore the treks
            </Button>
            <Button
              href={waLink(
                "Hi Abishek! I found Sherpa Treks Nepal online and I'd love to plan a trek.",
              )}
              variant="ghost"
              size="lg"
              external
            >
              Message Abishek
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        aria-hidden
      >
        <span className="text-[10px] uppercase tracking-eyebrow text-mist">
          Scroll
        </span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block h-8 w-px bg-gradient-to-b from-saffron to-transparent"
        />
      </motion.div>
    </section>
  );
}
