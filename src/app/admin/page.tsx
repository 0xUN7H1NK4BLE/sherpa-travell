"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminOverview from "@/components/admin/AdminOverview";
import TrekManager from "@/components/admin/TrekManager";
import ExpeditionManager from "@/components/admin/ExpeditionManager";
import GalleryAdmin from "@/components/admin/GalleryAdmin";
import InquiryInbox from "@/components/admin/InquiryInbox";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Trek } from "@/data/treks";
import type { Expedition } from "@/data/expeditions";

type Tab = "overview" | "treks" | "expeditions" | "gallery" | "inquiries";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "treks", label: "Treks" },
  { id: "expeditions", label: "Expeditions" },
  { id: "gallery", label: "Gallery" },
  { id: "inquiries", label: "Inquiries" },
];

export default function AdminPage() {
  const router = useRouter();
  const [treks, setTreks] = useState<Trek[] | null>(null);
  const [newInquiryCount, setNewInquiryCount] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmTrek, setConfirmTrek] = useState<Trek | null>(null);
  const [expeditions, setExpeditions] = useState<Expedition[] | null>(null);
  const [deletingExpedition, setDeletingExpedition] = useState<string | null>(null);
  const [confirmExpedition, setConfirmExpedition] = useState<Expedition | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/treks", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setTreks(data.treks);
    else setError(data.error ?? "Failed to load treks");
  }, []);

  const refreshExpeditions = useCallback(async () => {
    const res = await fetch("/api/expeditions", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setExpeditions(data.expeditions);
    else setError(data.error ?? "Failed to load expeditions");
  }, []);

  useEffect(() => {
    fetch("/api/treks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setTreks(data.treks);
        else setError((data && data.error) ?? "Failed to load treks");
      })
      .catch(() => setError("Failed to load treks"));
    fetch("/api/expeditions", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setExpeditions(data.expeditions);
        else setError((data && data.error) ?? "Failed to load expeditions");
      })
      .catch(() => setError("Failed to load expeditions"));
    fetch("/api/admin/inquiries", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) {
          setNewInquiryCount(data.inquiries.filter((i: { status: string }) => i.status === "new").length);
        }
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function onDeleteConfirmed() {
    const trek = confirmTrek;
    if (!trek) return;
    setDeleting(trek.slug);
    setError(null);
    try {
      const res = await fetch(`/api/treks/${trek.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      setConfirmTrek(null);
      await refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function onDeleteExpeditionConfirmed() {
    const expedition = confirmExpedition;
    if (!expedition) return;
    setDeletingExpedition(expedition.slug);
    setError(null);
    try {
      const res = await fetch(`/api/expeditions/${expedition.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      setConfirmExpedition(null);
      await refreshExpeditions();
    } catch {
      setError("Delete failed");
    } finally {
      setDeletingExpedition(null);
    }
  }

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              Sherpa Treks Nepal
            </p>
            <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">
              Dashboard
            </h1>
            <p className="mt-3 text-sm text-mist">
              {treks ? `${treks.length} treks live on the site` : "Loading…"}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-red-400/50 hover:text-red-300"
          >
            Sign out
          </button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div
          className="mt-10 flex gap-1.5 overflow-x-auto rounded-full border border-line bg-night/40 p-1.5"
          role="tablist"
          aria-label="Admin sections"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex-1 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-saffron text-night"
                    : "text-mist hover:text-snow"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <AdminOverview
            treks={treks}
            newInquiryCount={newInquiryCount}
            expeditionCount={expeditions?.length}
            onNewTrek={() => setTab("treks")}
            onGallery={() => setTab("gallery")}
          />
        )}

        {tab === "treks" && (
          <TrekManager
            treks={treks}
            onDelete={(trek) => setConfirmTrek(trek)}
            deleting={deleting}
            onSaved={refresh}
          />
        )}

        {tab === "expeditions" && (
          <ExpeditionManager
            expeditions={expeditions}
            onDelete={(expedition) => setConfirmExpedition(expedition)}
            deleting={deletingExpedition}
            onSaved={refreshExpeditions}
          />
        )}

        {tab === "gallery" && treks && (
          <div className="mt-10">
            <GalleryAdmin treks={treks} />
          </div>
        )}

        {tab === "inquiries" && <InquiryInbox />}
      </div>

      {confirmTrek && (
        <ConfirmDialog
          title={`Delete "${confirmTrek.name}"?`}
          message="This removes the trek from the site and cannot be undone. The itinerary, gallery and route data for it will be lost."
          busy={deleting === confirmTrek.slug}
          onConfirm={() => void onDeleteConfirmed()}
          onCancel={() => setConfirmTrek(null)}
        />
      )}

      {confirmExpedition && (
        <ConfirmDialog
          title={`Delete "${confirmExpedition.name}"?`}
          message="This removes the expedition from the site and cannot be undone. The itinerary, gallery and route data for it will be lost."
          busy={deletingExpedition === confirmExpedition.slug}
          onConfirm={() => void onDeleteExpeditionConfirmed()}
          onCancel={() => setConfirmExpedition(null)}
        />
      )}
    </section>
  );
}
