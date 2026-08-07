import { isAuthenticated } from "@/lib/adminAuth";

type PlaceHit = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  namedetails?: Record<string, string>;
  lat: string;
  lon: string;
};

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 120) : "";
  if (!q) {
    return Response.json({ ok: false, error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "np");
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("namedetails", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "sherpa-travell-admin/1.0 (admin place search)",
      "Accept-Language": "en",
    },
  });

  const data = (await res.json().catch(() => null)) as NominatimResult[] | null;
  if (!res.ok || !Array.isArray(data)) {
    return Response.json(
      { ok: false, error: "Place search failed" },
      { status: 502 },
    );
  }

  const places: PlaceHit[] = data.map((p) => {
    const parts = p.display_name.split(",").map((s) => s.trim()).filter(Boolean);
    const name =
      p.namedetails?.["name:en"] ?? p.namedetails?.name ?? parts[0] ?? "Unknown";
    return {
      id: String(p.place_id),
      name,
      address: parts.slice(1).join(", "),
      lat: Number.parseFloat(p.lat),
      lng: Number.parseFloat(p.lon),
    };
  });

  return Response.json({ ok: true, places });
}
