// Phase 2: regional generics + retries for photo-scarce places.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dirname}/../public/images/places`;
const UA =
  "SherpaTravell/1.0 (demo site; not affiliated with Wikimedia) node-fetch";
const API = "https://commons.wikimedia.org/w/api.php";
const BAD = /map|logo|icon|diagram|plan|coat of arms|flag|seatbelt|ticket|poster|book cover|infographic|chart|signage|herbarium|fuchsia/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, tries = 5) {
  for (let t = 0; t < tries; t++) {
    try {
      return await fn();
    } catch (e) {
      if (t === tries - 1) throw e;
      await sleep((/429/.test(e.message) ? 4000 : 1000) * 2 ** t + Math.random() * 1500);
    }
  }
}

async function search(query) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "10");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|size|mime");
  url.searchParams.set("iiurlwidth", "1600");
  url.searchParams.set("format", "json");
  return withRetry(async () => {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    return pages.map((p) => ({
      title: p.title,
      mime: p.imageinfo?.[0]?.mime ?? "",
      width: p.imageinfo?.[0]?.width ?? 0,
      height: p.imageinfo?.[0]?.height ?? 0,
      thumb: p.imageinfo?.[0]?.thumburl ?? "",
    }));
  });
}

function pick(items) {
  const cands = items.filter(
    (i) =>
      (i.mime === "image/jpeg" || i.mime === "image/jpg") &&
      i.width >= 900 &&
      i.height >= 550 &&
      i.width >= i.height &&
      !BAD.test(i.title),
  );
  if (cands.length === 0) return null;
  cands.sort((a, b) => b.width * b.height - a.width * a.height);
  return cands[0];
}

async function download(key, query) {
  const file = `${OUT}/${key}.jpg`;
  if (existsSync(file)) {
    console.log(`skip  ${key} (exists)`);
    return true;
  }
  let img;
  try {
    img = pick(await search(query));
  } catch (e) {
    console.log(`ERR   ${key}: ${e.message}`);
    return false;
  }
  if (!img) {
    console.log(`MISS  ${key}: "${query}"`);
    return false;
  }
  const url = img.thumb.split("?")[0];
  try {
    const res = await withRetry(async () => {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`dl ${r.status}`);
      return r;
    });
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    console.log(`ok    ${key}  ${img.width}x${img.height}  <- ${img.title}`);
    return true;
  } catch (e) {
    console.log(`ERR   ${key}: ${e.message}`);
    return false;
  }
}

mkdirSync(OUT, { recursive: true });

const PHASE2 = {
  manaslu_mountain: "Manaslu mountain Nepal snow",
  kanchenjunga_mountain: "Kanchenjunga mountain snow peak",
  dolpo_valley: "Dolpo Nepal valley",
  langtang_valley: "Langtang valley river mountains",
  humla_valley: "Humla Nepal valley",
  budhi_gandaki: "Budhi Gandaki river Nepal",
  teahouse_trail: "Nepal trekking trail teahouse",
  yak_pasture: "Nepal yak pasture Himalaya",
  snow_peak: "Himalaya snow peak blue sky",
  river_gorge: "Himalaya river gorge Nepal",
  shey_gompa: "Shey Gompa",
  tarakot: "Tarakot",
  numa_la: "Numa La",
  kermi: "Kermi",
  halji: "Halji",
  ghunsa: "Ghunsa",
  pangpema: "Pangpema",
  oktang: "Oktang",
  yari: "Yari Humla",
};

const n = Object.keys(PHASE2).length;
let ok = 0;
let i = 0;
for (const [key, query] of Object.entries(PHASE2)) {
  i++;
  process.stdout.write(`[${i}/${n}] `);
  if (await download(key, query)) ok++;
  await sleep(1400 + Math.random() * 800);
}
console.log(`\ndone: ${ok}/${n}`);
