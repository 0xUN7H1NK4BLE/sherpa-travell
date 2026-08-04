import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/images");
const MIN_W = 1000;
const MIN_H = 600;
const BAD = /map|logo|icon|diagram|plan|coat of arms|ticket|poster|book cover|infographic|chart|signage|textbook|illustration|drawing|painting|herbarium|fuchsia|ISS0|la réole|gmbh|everest-3d/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SherpaTravell/1.0 (demo site; not affiliated with Wikimedia)",
      Accept: "application/json",
    },
  });
  if (res.status === 429) {
    const err = new Error("rate limited");
    err.status = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function search(query) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "30",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1600",
    format: "json",
  });
  const json = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  return Object.values(json?.query?.pages ?? {})
    .filter((p) => p.imageinfo?.length)
    .map((p) => {
      const ii = p.imageinfo[0];
      return { title: p.title, url: ii.thumburl ?? ii.url, width: ii.width, height: ii.height, mime: ii.mime };
    });
}

async function byTitle(title) {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1920",
    format: "json",
  });
  const json = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const p = Object.values(json?.query?.pages ?? {})[0];
  const ii = p?.imageinfo?.[0];
  if (!ii) return [];
  return [{ title: p.title, url: ii.thumburl ?? ii.url, width: ii.width, height: ii.height, mime: ii.mime }];
}

function passes(c) {
  const clean = c.url.split("?")[0];
  if (!/\.(jpg|jpeg)$/i.test(clean)) return false;
  if (c.width < MIN_W || c.height < MIN_H) return false;
  if (c.width < c.height) return false;
  if (BAD.test(c.title)) return false;
  if (c.width / c.height > 3.2) return false;
  return true;
}

async function withRetry(fn, tries = 5) {
  for (let t = 0; t < tries; t++) {
    try {
      return await fn();
    } catch (e) {
      if (e?.status !== 429 && t === tries - 1) throw e;
      const base = e?.status === 429 ? 4000 : 1000;
      await sleep(base * 2 ** t + Math.floor(Math.random() * 1500));
    }
  }
}

async function download(url, file) {
  const res = await fetch(url.split("?")[0], {
    headers: { "User-Agent": "SherpaTravell/1.0 (demo site; not affiliated with Wikimedia)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

let ok = 0;

async function saveTitle(title, file, label) {
  const results = await withRetry(() => byTitle(title));
  const pick = results.find(passes);
  if (!pick) {
    console.log(`MISS  ${label}: ${title} (no passing candidate)`);
    return;
  }
  await withRetry(() => download(pick.url, file));
  console.log(`ok    ${label}  ${pick.width}x${pick.height}  <- ${pick.title}`);
  ok++;
}

async function saveQuery(queries, file, label) {
  for (const q of queries) {
    try {
      const results = await withRetry(() => search(q));
      const candidates = results.filter(passes);
      candidates.sort((a, b) => b.width * b.height - a.width * a.height);
      const pick = candidates[0];
      if (pick) {
        await withRetry(() => download(pick.url, file));
        console.log(`ok    ${label}  ${pick.width}x${pick.height}  <- ${pick.title}`);
        ok++;
        return;
      }
      console.log(`  try "${q}" -> no candidates`);
    } catch (e) {
      console.log(`  try "${q}" -> ${e.message}`);
    }
    await sleep(1600 + Math.floor(Math.random() * 800));
  }
  console.log(`MISS  ${label}`);
}

await saveTitle("File:Sunset view of Everest.jpg", path.join(OUT, "hero.jpg"), "hero.jpg");
await saveQuery(
  ["Nepal trekking trail hikers", "Manaslu trek hikers", "Annapurna trekking hikers trail"],
  path.join(OUT, "about.jpg"),
  "about.jpg",
);
await saveQuery(
  ["milky way Nepal night", "star trail Himalaya night sky", "night sky stars mountains Nepal"],
  path.join(OUT, "scenes/stars.jpg"),
  "scenes/stars.jpg",
);
await saveQuery(
  ["Langtang valley Nepal", "Khumbu valley Nepal", "Himalayan valley Nepal"],
  path.join(OUT, "scenes/valley.jpg"),
  "scenes/valley.jpg",
);

console.log(`\ndone: ${ok} ok`);
