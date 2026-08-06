import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Trek } from "@/data/treks";

export const TREKS_FILE_REPO_PATH = "src/data/treks.json";
const TREKS_LOCAL_PATH = path.join(process.cwd(), TREKS_FILE_REPO_PATH);

function gitConfig() {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!repo || !token) return null;
  return { repo, token, branch };
}

export function isGitBacked(): boolean {
  return gitConfig() !== null;
}

async function readFromGitHub(): Promise<Trek[]> {
  const cfg = gitConfig();
  if (!cfg) throw new Error("GitHub not configured (GITHUB_REPO / GITHUB_TOKEN)");
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${TREKS_FILE_REPO_PATH}?ref=${cfg.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sherpa-travell",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error("GitHub file has no content");
  const raw = Buffer.from(data.content, "base64").toString("utf8");
  return JSON.parse(raw) as Trek[];
}

async function readLocal(): Promise<Trek[]> {
  const raw = await readFile(TREKS_LOCAL_PATH, "utf8");
  return JSON.parse(raw) as Trek[];
}

export async function readTreks(): Promise<Trek[]> {
  try {
    if (isGitBacked()) return await readFromGitHub();
  } catch (err) {
    console.warn("[trekStore] GitHub read failed, falling back to local:", err);
  }
    return readLocal();
}

async function writeToGitHub(treks: Trek[]): Promise<void> {
  const cfg = gitConfig();
  if (!cfg) throw new Error("GitHub not configured (GITHUB_REPO / GITHUB_TOKEN)");
  const content = JSON.stringify(treks, null, 2) + "\n";
  const base64 = Buffer.from(content).toString("base64");

  const contentsUrl = `https://api.github.com/repos/${cfg.repo}/contents/${TREKS_FILE_REPO_PATH}`;
  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sherpa-travell",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(`${contentsUrl}?ref=${cfg.branch}`, { headers, next: { revalidate: 0 } });
  const existing = getRes.ok ? ((await getRes.json()) as { sha: string }) : null;

  const body: Record<string, string> = {
    message: `Update treks from admin (${new Date().toISOString()})`,
    content: base64,
    branch: cfg.branch,
  };
  if (existing?.sha) body.sha = existing.sha;

  const putRes = await fetch(contentsUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!putRes.ok) throw new Error(`GitHub write failed: ${putRes.status} ${await putRes.text()}`);
}

async function writeLocal(treks: Trek[]): Promise<void> {
  const content = JSON.stringify(treks, null, 2) + "\n";
  await writeFile(TREKS_LOCAL_PATH, content, "utf8");
}

export async function writeTreks(treks: Trek[]): Promise<void> {
  if (isGitBacked()) {
    await writeToGitHub(treks);
    return;
  }
  await writeLocal(treks);
}
