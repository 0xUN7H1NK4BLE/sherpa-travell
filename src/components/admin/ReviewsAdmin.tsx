"use client";

import { useCallback, useEffect, useState } from "react";
import StarRating from "@/components/reviews/StarRating";

interface Review {
  id: number;
  subjectType: "trek" | "expedition";
  subjectSlug: string;
  name: string | null;
  photoUrl: string | null;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
}

type Filter = "all" | "pending" | "approved";

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [updating, setUpdating] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/reviews", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setReviews(data.reviews);
    else setError(data.error ?? "Failed to load reviews");
  }, []);

  useEffect(() => {
    fetch("/api/admin/reviews", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setReviews(data.reviews);
        else setError((data && data.error) ?? "Failed to load reviews");
      })
      .catch(() => setError("Failed to load reviews"));
  }, []);

  async function setApproved(id: number, approved: boolean) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      await refresh();
    } catch {
      setError("Update failed");
    } finally {
      setUpdating(null);
    }
  }

  async function remove(id: number) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      await refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setUpdating(null);
    }
  }

  if (!reviews) return <p className="mt-6 text-sm text-mist">Loading…</p>;

  const visible = reviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  return (
    <div className="mt-10">
      {error && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-saffron bg-saffron/15 text-saffron"
                : "border-line-strong text-mist hover:text-snow"
            }`}
          >
            {f}{" "}
            {f !== "all" &&
              `(${reviews.filter((r) => (f === "pending" ? !r.approved : r.approved)).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.length === 0 && <p className="text-sm text-mist">No reviews in this view.</p>}
        {visible.map((review) => (
          <div key={review.id} className="rounded-2xl border border-line bg-night/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-snow">{review.name || "Verified traveler"}</p>
                <StarRating rating={review.rating} size="sm" className="mt-1" />
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                  review.approved
                    ? "border-emerald-400/25 bg-emerald-400/15 text-emerald-300"
                    : "border-saffron/25 bg-saffron/15 text-saffron"
                }`}
              >
                {review.approved ? "approved" : "pending"}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-mist md:grid-cols-4">
              <div>
                <dt className="uppercase tracking-wide">On</dt>
                <dd className="text-snow/90 capitalize">
                  {review.subjectType} · {review.subjectSlug}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Received</dt>
                <dd className="text-snow/90">{new Date(review.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            <p className="mt-3 text-sm text-mist">{review.text}</p>
            {review.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.photoUrl}
                alt={review.name ?? "Reviewer"}
                className="mt-3 h-16 w-16 rounded-lg object-cover"
              />
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!review.approved && (
                <button
                  disabled={updating === review.id}
                  onClick={() => setApproved(review.id, true)}
                  className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {review.approved && (
                <button
                  disabled={updating === review.id}
                  onClick={() => setApproved(review.id, false)}
                  className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron disabled:opacity-50"
                >
                  Unapprove
                </button>
              )}
              <button
                disabled={updating === review.id}
                onClick={() => remove(review.id)}
                className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-400 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
