"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { toSlug } from "@/lib/slug";
import type { Trek } from "@/data/treks";

type FormState = Trek;

const emptyTrek: FormState = {
  slug: "",
  name: "",
  region: "",
  durationDays: 1,
  maxAltitudeM: 0,
  difficulty: "Moderate",
  bestSeason: [""],
  groupSize: "2–10",
  summary: "",
  highlights: [],
  itinerary: [{ day: 1, title: "", kind: "trek", altitudeM: 0, description: "" }],
  coordinates: [0, 0],
  path: [[0, 0]],
  image: "",
  gallery: [],
  tags: [],
};

const allTags: Trek["tags"] = ["remote", "classic", "lakes", "restricted", "cultural"];
const allDifficulties: Trek["difficulty"][] = ["Moderate", "Challenging", "Strenuous"];
const allKinds: Trek["itinerary"][number]["kind"][] = ["trek", "acclimatization", "travel", "summit"];

const field = "rounded-lg border border-line-strong bg-night px-3.5 py-2.5 text-sm text-snow outline-none transition-colors focus:border-saffron";
const label = "text-xs uppercase tracking-[0.18em] text-mist";
const inputRow = "flex flex-col gap-1.5";

export default function TrekForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Trek | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ?? emptyTrek);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setListString(
    key: "bestSeason" | "highlights" | "gallery" | "tags",
    value: string[],
  ) {
    set(key, value);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Trek = {
      ...form,
      bestSeason: form.bestSeason.filter(Boolean),
      highlights: form.highlights.filter(Boolean),
      gallery: form.gallery.filter(Boolean),
      itinerary: form.itinerary.map((d, i) => ({ ...d, day: i + 1 })),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/treks/${initial?.slug}` : "/api/treks",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const issues = data.issues as Record<string, unknown> | undefined;
        if (issues && Object.keys(issues).length > 0) {
          const lines = Object.entries(issues)
            .map(([field, val]) => `${field}: ${Array.isArray(val) ? val.join(", ") : String(val)}`);
          setError(lines.join("\n"));
        } else {
          setError(typeof data.error === "string" ? data.error : "Save failed");
        }
        setSaving(false);
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-2xl border border-line bg-night/40 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-light">
          {isEdit ? `Edit ${initial?.name}` : "New trek"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-mist underline underline-offset-4 hover:text-snow"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className={inputRow}>
          <label className={label}>Name</label>
          <input
            className={field}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              set("name", name);
              if (!isEdit) set("slug", toSlug(name));
            }}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Slug</label>
          <input
            className={field}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Region</label>
          <input
            className={field}
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Group size</label>
          <input
            className={field}
            value={form.groupSize}
            onChange={(e) => set("groupSize", e.target.value)}
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Duration (days)</label>
          <input
            type="number"
            className={field}
            value={form.durationDays}
            onChange={(e) => set("durationDays", Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Max altitude (m)</label>
          <input
            type="number"
            className={field}
            value={form.maxAltitudeM}
            onChange={(e) => set("maxAltitudeM", Number(e.target.value))}
            min={0}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Difficulty</label>
          <select
            className={field}
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value as Trek["difficulty"])}
          >
            {allDifficulties.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className={inputRow}>
          <label className={label}>Tags</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {allTags.map((tag) => {
              const active = form.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setListString(
                      "tags",
                      active
                        ? form.tags.filter((t) => t !== tag)
                        : [...form.tags, tag],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide ${
                    active
                      ? "border-saffron bg-saffron text-night"
                      : "border-line-strong text-mist hover:text-snow"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={inputRow}>
        <label className={label}>Summary</label>
        <textarea
          className={field}
          rows={3}
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          required
        />
      </div>

      <div className={inputRow}>
        <label className={label}>Best season (comma separated)</label>
        <input
          className={field}
          value={form.bestSeason.join(", ")}
          onChange={(e) =>
            setListString(
              "bestSeason",
              e.target.value.split(",").map((s) => s.trim()),
            )
          }
        />
      </div>

      <ListEditor
        title="Highlights"
        items={form.highlights}
        onChange={(items) => setListString("highlights", items)}
        placeholder="One highlight per line"
        textarea
      />

      <div className="flex flex-col gap-5 border-t border-line pt-5 md:flex-row">
        <div className="flex-1">
          <label className={label}>Hero image</label>
          <div className="mt-2 flex flex-col gap-2">
            <ImageUpload onUploaded={(url) => set("image", url)} label="Upload hero image" />
            {form.image && (
              <div className="flex items-center gap-3">
                <img
                  src={form.image}
                  alt="Hero preview"
                  className="h-16 w-24 rounded-lg object-cover"
                />
                <input
                  className={field}
                  value={form.image}
                  onChange={(e) => set("image", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <label className={label}>Gallery images</label>
          <div className="mt-2 flex flex-col gap-2">
            <ImageUpload onUploaded={(url) => setListString("gallery", [...form.gallery, url])} label="Upload gallery image" />
            <div className="flex flex-col gap-2">
              {form.gallery.map((url, i) => (
                <div key={`${url}-${i}`} className="flex items-center gap-2">
                  <img src={url} alt="" className="h-10 w-14 rounded object-cover" />
                  <input
                    className={field}
                    value={url}
                    onChange={(e) => {
                      const next = [...form.gallery];
                      next[i] = e.target.value;
                      setListString("gallery", next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setListString("gallery", form.gallery.filter((_, j) => j !== i))}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <h3 className="font-display text-xl font-light">Itinerary</h3>
        <div className="mt-4 flex flex-col gap-4">
          {form.itinerary.map((day, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-line p-4 md:grid-cols-12">
              <div className="md:col-span-1">
                <label className={label}>Day</label>
                <div className="pt-1.5 text-sm text-saffron">{i + 1}</div>
              </div>
              <div className="md:col-span-3">
                <label className={label}>Title</label>
                <input
                  className={field}
                  value={day.title}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, title: e.target.value };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Kind</label>
                <select
                  className={field}
                  value={day.kind}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, kind: e.target.value as Trek["itinerary"][number]["kind"] };
                    set("itinerary", next);
                  }}
                >
                  {allKinds.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={label}>Altitude (m)</label>
                <input
                  type="number"
                  className={field}
                  value={day.altitudeM}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, altitudeM: Number(e.target.value) };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <label className={label}>Description</label>
                <input
                  className={field}
                  value={day.description}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, description: e.target.value };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="flex items-end justify-end md:col-span-1">
                <button
                  type="button"
                  onClick={() => set("itinerary", form.itinerary.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() =>
                set("itinerary", [
                  ...form.itinerary,
                  { day: form.itinerary.length + 1, title: "", kind: "trek", altitudeM: 0, description: "" },
                ])
              }
              className="text-xs text-saffron underline underline-offset-4 hover:text-snow"
            >
              + Add day
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-line pt-5 md:grid-cols-2">
        <div className={inputRow}>
          <label className={label}>Coordinates (lat, lng)</label>
          <input
            className={field}
            value={form.coordinates.join(", ")}
            onChange={(e) => {
              const [a, b] = e.target.value.split(",").map(Number);
              if (!Number.isNaN(a) && !Number.isNaN(b)) set("coordinates", [a, b]);
            }}
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Path (lat, lng per line)</label>
          <textarea
            className={field}
            rows={4}
            value={form.path.map((p) => p.join(", ")).join("\n")}
            onChange={(e) => {
              const next = e.target.value
                .split("\n")
                .map((line) => line.split(",").map(Number))
                .filter((p) => p.length === 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1]))
                .map((p) => p as [number, number]);
              if (next.length > 0) set("path", next);
            }}
          />
        </div>
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          {error}
        </pre>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-saffron px-6 py-3 text-sm font-medium text-night transition-all hover:bg-snow disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create trek"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-mist underline underline-offset-4 hover:text-snow"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
  textarea,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div className={inputRow}>
      <label className={label}>{title}</label>
      {textarea ? (
        <textarea
          className={field}
          rows={Math.max(3, items.length)}
          placeholder={placeholder}
          value={items.join("\n")}
          onChange={(e) =>
            onChange(e.target.value.split("\n").map((s) => s.trim()))
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={field}
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...items, ""])}
            className="text-left text-xs text-saffron underline underline-offset-4 hover:text-snow"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
