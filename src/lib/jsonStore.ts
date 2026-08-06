import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function gitMeta():
  | { repo: string; token: string; branch: string }
  | null {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) return null;
  return { repo, token, branch: process.env.GITHUB_BRANCH ?? "main" };
}

export function isGitBacked(): boolean {
  return gitMeta() !== null;
}

function requestHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sherpa-travell",
    "Content-Type": "application/json",
  };
}

async function readFromGitHub<T>(repoPath: string): Promise<T> {
  const cfg = gitMeta();
  if (!cfg) throw new Error("GitHub not configured (GITHUB_REPO / GITHUB_TOKEN)");
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${repoPath}?ref=${cfg.branch}`;
  const res = await fetch(url, {
    headers: requestHeaders(cfg.token),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error(`GitHub file ${repoPath} has no content`);
  const raw = Buffer.from(data.content, "base64").toString("utf8");
  return JSON.parse(raw) as T;
}

export async function readLocal<T>(localPath: string): Promise<T> {
  const raw = await readFile(localPath, "utf8");
  return JSON.parse(raw) as T;
}

export async function readJson<T>(repoPath: string): Promise<T> {
  const localPath = path.join(process.cwd(), repoPath);
  try {
    if (isGitBacked()) return await readFromGitHub<T>(repoPath);
  } catch (err) {
    console.warn(`[jsonStore] GitHub read of ${repoPath} failed, falling back to local:`, err);
  }
  return readLocal<T>(localPath);
}

export async function writeJson(repoPath: string, data: unknown): Promise<void> {
  if (isGitBacked()) {
    const cfg = gitMeta()!;
    const content = JSON.stringify(data, null, 2) + "\n";
    const contentsUrl = `https://api.github.com/repos/${cfg.repo}/contents/${repoPath}`;
    const headers = requestHeaders(cfg.token);

    const getRes = await fetch(`${contentsUrl}?ref=${cfg.branch}`, { headers, next: { revalidate: 0 } });
    const existing = getRes.ok ? ((await getRes.json()) as { sha: string }) : null;

    const body: Record<string, string> = {
      message: `Update ${repoPath} from admin (${new Date().toISOString()})`,
      content: Buffer.from(content).toString("base64"),
      branch: cfg.branch,
    };
    if (existing?.sha) body.sha = existing.sha;

    const putRes = await fetch(contentsUrl, { method: "PUT", headers, body: JSON.stringify(body) });
    if (!putRes.ok) throw new Error(`GitHub write failed: ${putRes.status} ${await putRes.text()}`);
    return;
  }

  await writeFile(path.join(process.cwd(), repoPath), JSON.stringify(data, null, 2) + "\n", "utf8");
}