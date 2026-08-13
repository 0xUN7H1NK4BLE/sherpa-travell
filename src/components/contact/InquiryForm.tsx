"use client";

import { useState } from "react";
import { site, waLink } from "@/data/site";
import { treks } from "@/data/treks";

const inputStyles =
  "w-full rounded-lg border border-line bg-night px-4 py-3 text-sm text-snow placeholder:text-mist/60 transition-colors focus:border-saffron focus:outline-none";

export default function InquiryForm({
  initialTrek,
}: {
  initialTrek?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [trek, setTrek] = useState(initialTrek ?? "not-sure");
  const [dates, setDates] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const trekName =
    trek === "not-sure"
      ? "Not sure yet — help me choose"
      : (treks.find((t) => t.slug === trek)?.name ?? trek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `Hi Abishek! I'm ${name}.`,
      `Trek: ${trekName}`,
      dates && `Preferred dates: ${dates}`,
      groupSize && `Group size: ${groupSize}`,
      message && message,
      `(From ${email})`,
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-saffron/30 bg-night-raised p-10 text-center">
        <p className="font-display text-3xl font-light">WhatsApp is opening…</p>
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Your message to {site.contact.name} is ready to send. If nothing
          happened, call or message directly on{" "}
          <a
            href={site.contact.phoneHref}
            className="text-saffron underline underline-offset-4"
          >
            {site.contact.phoneDisplay}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-xs text-mist underline underline-offset-4 hover:text-snow"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line bg-night-raised p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">
            Your name *
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tenzing Norgay"
            className={inputStyles}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">
            Email *
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputStyles}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-mist">
          Trek
        </span>
        <select
          value={trek}
          onChange={(e) => setTrek(e.target.value)}
          className={inputStyles}
        >
          <option value="not-sure">Not sure yet — help me choose</option>
          {treks.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} · {t.durationDays} days
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">
            Preferred dates
          </span>
          <input
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="e.g. mid-October 2026"
            className={inputStyles}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">
            Group size
          </span>
          <input
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            placeholder="e.g. 2 people"
            className={inputStyles}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-mist">
          Anything else
        </span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Fitness level, past trekking experience, what you're dreaming of…"
          className={inputStyles}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-full bg-saffron px-6 py-3.5 font-medium text-night transition-colors hover:bg-snow"
      >
        Send Inquiry
      </button>
      <p className="text-center text-xs leading-relaxed text-mist">
        Submitting opens WhatsApp with your message pre-filled — the fastest way
        to reach {site.contact.name}.
      </p>
    </form>
  );
}
