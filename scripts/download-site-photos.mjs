import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/images");
const MIN_W = 1000;
const MIN_H = 600;
const BAD = /map|logo|icon|diagram|plan|coat of arms|ticket|poster|book cover|infographic|chart|signage|textbook|illustration|drawing|painting|herbarium|fuchsia|ISS0|la réole|gmbh|mount everest 3d|everest-3d/i;

const JOBS = [
  { out: "hero.jpg", query: "Mount Everest sunrise", pick: "largest" },
  { out: "about.jpg", query: "himalaya trekking hikers ridge trail", pick: "largest" },
  { out: "scenes/flags.jpg", query: "prayer flags himalaya nepal", pick: "largest" },
  { out: "scenes/stars.jpg", query: "milky way night sky himalaya", pick: "largest" },
  { out: "scenes/trail.jpg", query: "trekking trail himalaya nepal hikers", pick: "largest" },
  { out: "scenes/valley.jpg", query: "himalaya valley nepal mountains green", pick: "largest" },
  { out: "scenes/lake.jpg", query: "Gokyo Lakes turquoise", pick: "largest" },
];

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
  const json = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );
  const pages = json?.query?.pages ?? {};
  return Object.values(pages)
    .filter((p) => p.imageinfo?.length)
    .map((p) => {
      const ii = p.imageinfo[0];
      return {
        title: p.title,
        url: ii.thumburl ?? ii.url,
        width: ii.width,
        height: ii.height,
        mime: ii.mime,
      };
    });
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
  const clean = url.split("?")[0];
  const res = await fetch(clean, {
    headers: { "User-Agent": "SherpaTravell/1.0 (demo site; not affiliated with Wikimedia)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

let ok = 0;
let fail = 0;
for (const job of JOBS) {
  const file = path.join(OUT, job.out);
  if (fs.existsSync(file)) {
    console.log(`skip  ${job.out} (exists)`);
    continue;
  }
  try {
    const results = await withRetry(() => search(job.query));
    const candidates = results.filter(passes);
    candidates.sort((a, b) => b.width * b.height - a.width * a.height);
    const pick = candidates[0];
    if (!pick) {
      console.log(`MISS  ${job.out}: "${job.query}"`);
      fail++;
      continue;
    }
    await withRetry(() => download(pick.url, file));
    console.log(
      `ok    ${job.out}  ${pick.width}x${pick.height}  <- ${pick.title}`,
    );
    ok++;
  } catch (e) {
    console.log(`ERR   ${job.out}: ${e.message}`);
    fail++;
  }
  await sleep(1600 + Math.floor(Math.random() * 800));
}
console.log(`\ndone: ${ok} ok, ${fail} miss/err`);
