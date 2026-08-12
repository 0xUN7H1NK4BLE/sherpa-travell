"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "new" | "contacted" | "closed";

interface Inquiry {
  id: number;
  name: string;
  email: string;
  trek: string | null;
  dates: string | null;
  groupSize: string | null;
  message: string | null;
  status: Status;
  createdAt: string;
}

const statusColor: Record<Status, string> = {
  new: "bg-saffron/15 text-saffron border-saffron/25",
  contacted: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  closed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
};

export default function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [updating, setUpdating] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/inquiries", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setInquiries(data.inquiries);
    else setError(data.error ?? "Failed to load inquiries");
  }, []);

  useEffect(() => {
    fetch("/api/admin/inquiries", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setInquiries(data.inquiries);
        else setError((data && data.error) ?? "Failed to load inquiries");
      })
      .catch(() => setError("Failed to load inquiries"));
  }, []);

  async function setStatus(id: number, status: Status) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

  if (!inquiries) return <p className="mt-6 text-sm text-mist">Loading…</p>;

  const visible = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div className="mt-10">
      {error && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-saffron bg-saffron/15 text-saffron"
                : "border-line-strong text-mist hover:text-snow"
            }`}
          >
            {f} {f !== "all" && `(${inquiries.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-sm text-mist">No inquiries in this view.</p>
        )}
        {visible.map((inquiry) => (
          <div key={inquiry.id} className="rounded-2xl border border-line bg-night/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-snow">{inquiry.name}</p>
                <a href={`mailto:${inquiry.email}`} className="text-sm text-mist hover:text-saffron">
                  {inquiry.email}
                </a>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${statusColor[inquiry.status]}`}
              >
                {inquiry.status}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-mist md:grid-cols-4">
              {inquiry.trek && (
                <div>
                  <dt className="uppercase tracking-wide">Trek</dt>
                  <dd className="text-snow/90">{inquiry.trek}</dd>
                </div>
              )}
              {inquiry.dates && (
                <div>
                  <dt className="uppercase tracking-wide">Dates</dt>
                  <dd className="text-snow/90">{inquiry.dates}</dd>
                </div>
              )}
              {inquiry.groupSize && (
                <div>
                  <dt className="uppercase tracking-wide">Group size</dt>
                  <dd className="text-snow/90">{inquiry.groupSize}</dd>
                </div>
              )}
              <div>
                <dt className="uppercase tracking-wide">Received</dt>
                <dd className="text-snow/90">{new Date(inquiry.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            {inquiry.message && (
              <p className="mt-3 text-sm text-mist">{inquiry.message}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(["new", "contacted", "closed"] as const)
                .filter((s) => s !== inquiry.status)
                .map((s) => (
                  <button
                    key={s}
                    disabled={updating === inquiry.id}
                    onClick={() => setStatus(inquiry.id, s)}
                    className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium capitalize text-snow transition-colors hover:border-saffron hover:text-saffron disabled:opacity-50"
                  >
                    Mark {s}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
