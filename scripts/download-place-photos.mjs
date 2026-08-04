// Download best-effort photos for trek places from Wikimedia Commons.
// Usage: node scripts/download-place-photos.mjs
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dirname}/../public/images/places`;

const UA =
  "SherpaTravell/1.0 (demo site; not affiliated with Wikimedia) node-fetch";

const API = "https://commons.wikimedia.org/w/api.php";

const BAD = /map|logo|icon|diagram|plan|coat of arms|flag|seatbelt|ticket|poster|book cover|infographic|chart|signage/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, tries = 5) {
  for (let t = 0; t < tries; t++) {
    try {
      return await fn();
    } catch (e) {
      const is429 = /429/.test(e.message);
      if (!is429 && t === tries - 1) throw e;
      await sleep((is429 ? 4000 : 1000) * 2 ** t + Math.random() * 1500);
    }
  }
  throw new Error("retries exhausted");
}

async function search(query) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "12");
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
      i.width >= 800 &&
      i.height >= 500 &&
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
  let img = null;
  try {
    img = pick(await search(query));
  } catch (e) {
    console.log(`ERR   ${key}: ${e.message}`);
    return false;
  }
  if (!img) {
    console.log(`MISS  ${key}: no jpg for "${query}"`);
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
    console.log(
      `ok    ${key}  ${img.width}x${img.height}  ${(buf.length / 1024).toFixed(0)}kb  <- ${img.title}`,
    );
    return true;
  } catch (e) {
    console.log(`ERR   ${key}: ${e.message}`);
    return false;
  }
}

mkdirSync(OUT, { recursive: true });

// key: query
const PLACES = {
  lukla: "Lukla Tenzing-Hillary Airport",
  phakding: "Phakding Nepal village",
  namche: "Namche Bazaar",
  tengboche: "Tengboche monastery Nepal",
  dingboche: "Dingboche Nepal",
  lobuche: "Lobuche Nepal",
  everest_base_camp: "Everest Base Camp Khumbu",
  kala_patthar: "Kala Patthar Everest view",
  pheriche: "Pheriche village Nepal",
  kathmandu: "Kathmandu valley temples",
  machha_khola: "Machha Khola Manaslu",
  jagat: "Jagat Manaslu village",
  deng: "Deng village Manaslu",
  namrung: "Namrung village Manaslu",
  samagaon: "Samagaon Manaslu village",
  samdo: "Samdo Manaslu",
  larkya_la: "Larkya La pass",
  bimthang: "Bimthang Manaslu",
  tilije: "Tilje Manaslu village",
  dharapani: "Dharapani Manaslu Annapurna",
  ghunsa: "Ghunsa village Kanchenjunga",
  khambachen: "Khambachen Kanchenjunga",
  lhonak: "Lhonak Kanchenjunga",
  pangpema: "Pangpema Kanchenjunga base camp",
  tseram: "Tseram Kanchenjunga",
  oktang: "Oktang Kanchenjunga viewpoint",
  syabrubesi: "Syabrubesi Langtang",
  lama_hotel: "Lama Hotel Langtang trek",
  langtang_village: "Langtang village Nepal",
  kyanjin_gompa: "Kyanjin Gompa Langtang",
  tserko_ri: "Tserko Ri viewpoint",
  dhunche: "Dhunche town Nepal",
  sing_gompa: "Sing Gompa Langtang cheese",
  gosaikunda: "Gosaikunda Lake Nepal",
  laurebina_la: "Laurebina pass Nepal",
  sundarijal: "Sundarijal Nepal",
  nepalgunj: "Nepalgunj",
  juphal: "Juphal Dolpa airport",
  dunai: "Dunai Dolpa",
  chhepka: "Chhepka Dolpa",
  phoksundo: "Phoksundo Lake Dolpo",
  shey_gompa: "Shey Gompa Dolpo Crystal Mountain",
  saldang: "Saldang Dolpo",
  dho_tarap: "Dho Tarap Dolpo",
  tarakot: "Tarakot Dolpo",
  numa_la: "Numa La pass Dolpo",
  baga_la: "Baga La Dolpo pass",
  simikot: "Simikot Humla",
  kermi: "Kermi Humla",
  hilsa: "Hilsa Humla Nepal Tibet border",
  halji: "Halji Limi valley Humla",
  jang: "Jang Limi valley Humla",
  yari: "Yari Humla Nara La",
  nara_la: "Nara La pass Humla",
  nyalu_la: "Nyalu La pass Humla",
  himalaya_valley: "Himalaya Nepal valley mountains",
  khumbu_glacier: "Khumbu Glacier icefall",
  amadablam: "Ama Dablam mountain",
};

const n = Object.keys(PLACES).length;
let ok = 0;
let i = 0;
for (const [key, query] of Object.entries(PLACES)) {
  i++;
  process.stdout.write(`[${i}/${n}] `);
  if (await download(key, query)) ok++;
  await sleep(1400 + Math.random() * 800);
}
console.log(`\ndone: ${ok}/${n} downloaded`);
