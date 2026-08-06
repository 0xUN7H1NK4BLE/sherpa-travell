"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "./ImageUpload";
import type { GalleryContent, GalleryFilm, GalleryScene } from "@/data/galleryContent";
import type { Trek } from "@/data/treks";

type Kind = "scene" | "video";
type Editable = GalleryScene | GalleryFilm;

export default function GalleryAdmin({ treks }: { treks: Trek[] }) {
  const [content, setContent] = useState<GalleryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) {
      setContent(data.content);
      setVersion((v) => v + 1);
    } else setError(data.error ?? "Failed to load gallery");
  }, []);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setContent(data.content);
        else setError((data && data.error) ?? "Failed to load gallery");
      })
      .catch(() => setError("Failed to load gallery"));
  }, []);

  async function save(kind: Kind, item: Editable, isNew: boolean) {
    setBusy(item.id);
    setError(null);
    try {
      const res = await fetch(isNew ? "/api/gallery" : `/api/gallery/${item.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...item }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: Kind, id: string) {
    if (!window.confirm("Delete this item? It will leave the gallery.")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${id}?kind=${kind}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      await refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setBusy(null);
    }
  }

  function add(kind: Kind) {
    const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
    const item: Editable =
      kind === "scene"
        ? { id, src: "", title: "New scene", subtitle: "", alt: "", credit: "" }
        : { id, src: "", title: "New film", subtitle: "Field film", alt: "", credit: "Sherpa Treks Nepal" };
    void save(kind, item, true);
  }

  return (
    <div className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-light">Gallery</h2>
          <p className="mt-2 text-sm text-mist">
            Manage independent scenes and films. Trek heroes and day photos come
            from the trek editor automatically.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => add("scene")}
            className="rounded-full bg-saffron px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-snow"
          >
            + New scene
          </button>
          <button
            onClick={() => add("video")}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
          >
            + New film
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {!content ? (
        <p className="mt-8 text-sm text-mist">Loading…</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-[0.18em] text-mist">
              Scenes ({content.scenes.length})
            </h3>
            <div className="mt-4 flex flex-col gap-4">
              {content.scenes.map((scene) => (
                <SceneRow
                  key={`${scene.id}-${version}`}
                  item={scene}
                  busy={busy === scene.id}
                  onSave={(item, isNew) => void save("scene", item, isNew)}
                  onRemove={() => void remove("scene", scene.id)}
                />
              ))}
              {content.scenes.length === 0 && <Empty>No scenes yet.</Empty>}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.18em] text-mist">
              Films ({content.videos.length})
            </h3>
            <div className="mt-4 flex flex-col gap-4">
              {content.videos.map((video) => (
                <VideoRow
                  key={`${video.id}-${version}`}
                  item={video}
                  treks={treks}
                  busy={busy === video.id}
                  onSave={(item, isNew) => void save("video", item, isNew)}
                  onRemove={() => void remove("video", video.id)}
                />
              ))}
              {content.videos.length === 0 && <Empty>No films yet.</Empty>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-mist">
      {children}
    </p>
  );
}

const field =
  "rounded-lg border border-line-strong bg-night px-3.5 py-2.5 text-sm text-snow outline-none transition-colors focus:border-saffron";

function SceneRow({
  item,
  busy,
  onSave,
  onRemove,
}: {
  item: GalleryScene;
  busy: boolean;
  onSave: (item: GalleryScene, isNew: boolean) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<GalleryScene>(item);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof GalleryScene>(key: K, value: GalleryScene[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-night/40 p-4">
      <div className="flex items-start gap-3">
        <img src={draft.src} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            className={field}
            value={draft.title}
            placeholder="Title"
            onChange={(e) => update("title", e.target.value)}
          />
          <input
            className={field}
            value={draft.subtitle}
            placeholder="Subtitle / caption"
            onChange={(e) => update("subtitle", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ImageUpload onUploaded={(url) => update("src", url)} label="Upload image" />
        {draft.src && (
          <input
            className={field}
            value={draft.src}
            placeholder="Image URL"
            onChange={(e) => update("src", e.target.value)}
          />
        )}
      </div>
      <RowActions
        busy={busy}
        dirty={dirty}
        hasContent={draft.src.length > 0 && draft.title.length > 0}
        onSave={() => onSave(draft, false)}
        onRemove={onRemove}
      />
    </div>
  );
}

function VideoRow({
  item,
  treks,
  busy,
  onSave,
  onRemove,
}: {
  item: GalleryFilm;
  treks: Trek[];
  busy: boolean;
  onSave: (item: GalleryFilm, isNew: boolean) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<GalleryFilm>(item);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof GalleryFilm>(key: K, value: GalleryFilm[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-night/40 p-4">
      <div className="flex items-start gap-3">
        {draft.poster ? (
          <img src={draft.poster} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-line text-xs text-mist">
            Film
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            className={field}
            value={draft.title}
            placeholder="Title"
            onChange={(e) => update("title", e.target.value)}
          />
          <input
            className={field}
            value={draft.subtitle ?? ""}
            placeholder="Subtitle"
            onChange={(e) => update("subtitle", e.target.value)}
          />
        </div>
      </div>
      <input
        className={field}
        value={draft.src}
        placeholder="Video URL (.mp4)"
        onChange={(e) => update("src", e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <ImageUpload onUploaded={(url) => update("poster", url)} label="Upload poster" />
        <select
          className={field}
          value={draft.trekSlug ?? ""}
          onChange={(e) => {
            const trek = treks.find((t) => t.slug === e.target.value);
            update("trekSlug", e.target.value);
            update("trekName", trek?.name ?? "");
          }}
        >
          <option value="">No linked trek</option>
          {treks.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <RowActions
        busy={busy}
        dirty={dirty}
        hasContent={draft.src.length > 0 && draft.title.length > 0}
        onSave={() => onSave(draft, false)}
        onRemove={onRemove}
      />
    </div>
  );
}

function RowActions({
  busy,
  dirty,
  hasContent,
  onSave,
  onRemove,
}: {
  busy: boolean;
  dirty: boolean;
  hasContent: boolean;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onSave}
        disabled={busy || !dirty || !hasContent}
        className="rounded-full bg-saffron px-4 py-2 text-xs font-medium text-night transition-colors hover:bg-snow disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      <button
        onClick={onRemove}
        disabled={busy}
        className="text-xs text-red-400 underline underline-offset-4 hover:text-red-300 disabled:opacity-40"
      >
        Delete
      </button>
      <span className="ml-auto text-[11px] text-mist/70">
        {dirty ? "Unsaved changes" : "Saved"}
      </span>
    </div>
  );
}
