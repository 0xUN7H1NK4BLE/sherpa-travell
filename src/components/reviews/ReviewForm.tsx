"use client";

import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import { Star } from "@/components/reviews/StarRating";

const inputStyles =
  "w-full rounded-lg border border-line bg-night px-4 py-3 text-sm text-snow placeholder:text-mist/60 transition-colors focus:border-saffron focus:outline-none";

export default function ReviewForm({
  subjectType,
  subjectSlug,
}: {
  subjectType: "trek" | "expedition";
  subjectSlug: string;
}) {
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType,
          subjectSlug,
          name: name.trim() || undefined,
          photoUrl,
          rating,
          text: text.trim(),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Couldn't submit your review");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-saffron/30 bg-night-raised p-10 text-center">
        <p className="font-display text-2xl font-light">Thanks for sharing!</p>
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Your review is in - it&apos;ll appear here once we&apos;ve given it a quick read.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line bg-night-raised p-6 md:p-8"
    >
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-mist">Your rating *</span>
        <div
          className="flex gap-1 text-saffron"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              aria-label={`Rate ${n} out of 5`}
              className="p-0.5"
            >
              <Star filled={n <= (hoverRating || rating)} size="md" className="pointer-events-none" />
            </button>
          ))}
        </div>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            maxLength={80}
            className={inputStyles}
          />
        </label>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist">Your best trek shot</span>
          <ImageUpload
            endpoint="/api/reviews/upload"
            label={photoUrl ? "Change photo" : "Add a photo (optional)"}
            onUploaded={setPhotoUrl}
          />
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-mist">Your review and experience *</span>
        <textarea
          required
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What stood out about the trek?"
          maxLength={2000}
          className={inputStyles}
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-saffron px-6 py-3.5 font-medium text-night transition-colors hover:bg-snow disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
      <p className="text-center text-xs leading-relaxed text-mist">
        Reviews are read before they go live, so it may take a little while to appear.
      </p>
    </form>
  );
}
