"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "./ImageUpload";
import type { TeamMember } from "@/data/team";
import { newTeamId } from "@/lib/teamSchema";

export default function TeamAdmin() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<TeamMember | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/team", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) {
      setMembers(data.members);
      setVersion((v) => v + 1);
    } else setError(data.error ?? "Failed to load team");
  }, []);

  useEffect(() => {
    fetch("/api/team", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setMembers(data.members);
        else setError((data && data.error) ?? "Failed to load team");
      })
      .catch(() => setError("Failed to load team"));
  }, []);

  async function save(member: TeamMember, isNew: boolean) {
    setBusy(member.id);
    setError(null);
    try {
      const res = await fetch(isNew ? "/api/team" : `/api/team/${member.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (isNew) setPending(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this team member from the About page?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
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

  function add() {
    if (pending) return;
    setError(null);
    setPending({
      id: newTeamId(""),
      name: "",
      role: "",
      photo: "",
      bio: "",
      instagram: "",
      facebook: "",
      whatsapp: "",
    });
  }

  return (
    <div className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-light">Team</h2>
          <p className="mt-2 text-sm text-mist">
            Manage the team shown on /about. Only members saved here appear
            publicly.
          </p>
        </div>
        <button
          onClick={add}
          disabled={!!pending}
          className="rounded-full bg-saffron px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-snow disabled:opacity-50"
        >
          + New member
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {!members ? (
        <p className="mt-8 text-sm text-mist">Loading…</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {members.map((member) => (
            <MemberRow
              key={`${member.id}-${version}`}
              item={member}
              busy={busy === member.id}
              onSave={(draft) => void save(draft, false)}
              onRemove={() => void remove(member.id)}
            />
          ))}
          {members.length === 0 && <Empty>No team members yet.</Empty>}
        </div>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-line bg-night p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-light">New team member</h3>
              <button
                onClick={() => setPending(null)}
                aria-label="Close"
                className="text-mist transition-colors hover:text-snow"
              >
                ✕
              </button>
            </div>
            <MemberRow
              item={pending}
              busy={busy === pending.id}
              isNew
              onSave={(draft) => void save(draft, true)}
              onRemove={() => setPending(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full rounded-xl border border-dashed border-line p-6 text-center text-sm text-mist">
      {children}
    </p>
  );
}

const field =
  "rounded-lg border border-line-strong bg-night px-3.5 py-2.5 text-sm text-snow outline-none transition-colors focus:border-saffron";

function MemberRow({
  item,
  busy,
  isNew = false,
  onSave,
  onRemove,
}: {
  item: TeamMember;
  busy: boolean;
  isNew?: boolean;
  onSave: (item: TeamMember, isNew: boolean) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<TeamMember>(item);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof TeamMember>(key: K, value: TeamMember[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-night/40 p-4">
      <div className="flex items-start gap-3">
        {draft.photo ? (
          <img src={draft.photo} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line text-xs text-mist">
            No photo
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            className={field}
            value={draft.name}
            placeholder="Name"
            autoFocus={isNew}
            onChange={(e) => update("name", e.target.value)}
          />
          <input
            className={field}
            value={draft.role}
            placeholder="Role (e.g. Lead Guide)"
            onChange={(e) => update("role", e.target.value)}
          />
        </div>
      </div>
      <textarea
        className={`${field} resize-none`}
        rows={2}
        value={draft.bio ?? ""}
        placeholder="Short description (optional)"
        maxLength={300}
        onChange={(e) => update("bio", e.target.value)}
      />
      <ImageUpload onUploaded={(url) => update("photo", url)} label="Upload photo" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          className={field}
          value={draft.instagram ?? ""}
          placeholder="Instagram URL"
          onChange={(e) => update("instagram", e.target.value)}
        />
        <input
          className={field}
          value={draft.facebook ?? ""}
          placeholder="Facebook URL"
          onChange={(e) => update("facebook", e.target.value)}
        />
        <input
          className={field}
          value={draft.whatsapp ?? ""}
          placeholder="WhatsApp URL"
          onChange={(e) => update("whatsapp", e.target.value)}
        />
      </div>
      <RowActions
        busy={busy}
        dirty={dirty}
        hasContent={draft.name.length > 0 && draft.role.length > 0 && draft.photo.length > 0}
        onSave={() => onSave(draft, isNew)}
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
