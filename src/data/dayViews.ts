import { treks } from "@/data/treks";
import { expeditions } from "@/data/expeditions";
import type { ItineraryDay } from "@/data/treks";

interface RouteLike {
  slug: string;
  itinerary: ItineraryDay[];
}

const allRoutes: RouteLike[] = [...treks, ...expeditions];


// dayPlaces[slug][i] = the start and end place of itinerary day i.
// trekLabels[slug] = named places rendered on the map (villages, peaks,
// passes, lakes, monasteries) so the satellite view reads like a tour.

export interface DayPlace {
  from: string;
  to: string;
}

export type PlaceKind =
  | "city"
  | "village"
  | "peak"
  | "pass"
  | "lake"
  | "monastery"
  | "basecamp"
  | "river";

export interface PlaceLabel {
  name: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
}



export const scenicLabels: Record<string, PlaceLabel[]> = {
  "everest-base-camp": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Lukla", lat: 27.6873, lng: 86.7314, kind: "village" },
    { name: "Phakding", lat: 27.7432, lng: 86.7125, kind: "village" },
    { name: "Namche Bazaar", lat: 27.8045, lng: 86.7102, kind: "village" },
    { name: "Tengboche", lat: 27.8365, lng: 86.7638, kind: "monastery" },
    { name: "Dingboche", lat: 27.8953, lng: 86.8278, kind: "village" },
    { name: "Lobuche", lat: 27.9524, lng: 86.8122, kind: "village" },
    { name: "Pheriche", lat: 27.8946, lng: 86.8204, kind: "village" },
    { name: "Everest Base Camp", lat: 27.9854, lng: 86.8604, kind: "basecamp" },
    { name: "Kala Patthar", lat: 27.9958, lng: 86.8283, kind: "peak" },
    { name: "Mt Everest", lat: 27.9881, lng: 86.925, kind: "peak" },
    { name: "Lhotse", lat: 27.9617, lng: 86.9336, kind: "peak" },
    { name: "Ama Dablam", lat: 27.8614, lng: 86.8611, kind: "peak" },
    { name: "Island Peak", lat: 27.9255, lng: 86.9361, kind: "peak" },
    { name: "Pumori", lat: 28.0154, lng: 86.8286, kind: "peak" },
    { name: "Khumbu Icefall", lat: 27.984, lng: 86.901, kind: "river" },
    { name: "Dudh Koshi", lat: 27.76, lng: 86.69, kind: "river" },
  ],
  "manaslu-circuit": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Machha Khola", lat: 28.3003, lng: 84.7957, kind: "village" },
    { name: "Jagat", lat: 28.382, lng: 84.805, kind: "village" },
    { name: "Deng", lat: 28.42, lng: 84.831, kind: "village" },
    { name: "Namrung", lat: 28.47, lng: 84.86, kind: "village" },
    { name: "Samagaon", lat: 28.594, lng: 84.962, kind: "village" },
    { name: "Samdo", lat: 28.625, lng: 84.968, kind: "village" },
    { name: "Dharamsala", lat: 28.645, lng: 85.005, kind: "village" },
    { name: "Bimthang", lat: 28.55, lng: 85.02, kind: "village" },
    { name: "Tilije", lat: 28.51, lng: 84.9, kind: "village" },
    { name: "Dharapani", lat: 28.235, lng: 84.38, kind: "village" },
    { name: "Mt Manaslu", lat: 28.55, lng: 84.56, kind: "peak" },
    { name: "Larkya La", lat: 28.61, lng: 84.95, kind: "pass" },
    { name: "Pungyen Gompa", lat: 28.62, lng: 84.98, kind: "monastery" },
    { name: "Budhi Gandaki", lat: 28.35, lng: 84.8, kind: "river" },
  ],
  "kanchenjunga-base-camp": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Ilam", lat: 26.909, lng: 87.926, kind: "village" },
    { name: "Sekathum", lat: 27.556, lng: 87.857, kind: "village" },
    { name: "Amjilosa", lat: 27.626, lng: 87.898, kind: "village" },
    { name: "Gyabla", lat: 27.688, lng: 87.912, kind: "village" },
    { name: "Ghunsa", lat: 27.725, lng: 87.937, kind: "village" },
    { name: "Khambachen", lat: 27.758, lng: 87.949, kind: "village" },
    { name: "Lhonak", lat: 27.835, lng: 88.006, kind: "village" },
    { name: "Pangpema", lat: 27.87, lng: 88.033, kind: "basecamp" },
    { name: "Tseram", lat: 27.626, lng: 87.948, kind: "village" },
    { name: "Tortong", lat: 27.59, lng: 87.86, kind: "village" },
    { name: "Yamphudin", lat: 27.556, lng: 87.832, kind: "village" },
    { name: "Khebang", lat: 27.5, lng: 87.79, kind: "village" },
    { name: "Mt Kanchenjunga", lat: 27.702, lng: 88.147, kind: "peak" },
    { name: "Jannu", lat: 27.682, lng: 88.043, kind: "peak" },
    { name: "Oktang", lat: 27.6, lng: 87.85, kind: "basecamp" },
    { name: "Sele La", lat: 27.665, lng: 87.888, kind: "pass" },
  ],
  "langtang-valley": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Syabrubesi", lat: 28.162, lng: 85.34, kind: "village" },
    { name: "Lama Hotel", lat: 28.198, lng: 85.395, kind: "village" },
    { name: "Langtang", lat: 28.213, lng: 85.528, kind: "village" },
    { name: "Kyanjin Gompa", lat: 28.223, lng: 85.573, kind: "monastery" },
    { name: "Tserko Ri", lat: 28.177, lng: 85.6, kind: "peak" },
    { name: "Langtang Lirung", lat: 28.257, lng: 85.517, kind: "peak" },
    { name: "Dorje Lakpa", lat: 28.176, lng: 86.048, kind: "peak" },
    { name: "Shishapangma", lat: 28.35, lng: 85.78, kind: "peak" },
    { name: "Langtang River", lat: 28.2, lng: 85.46, kind: "river" },
  ],
  "gosaikunda-lake": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Dhunche", lat: 28.12, lng: 85.29, kind: "village" },
    { name: "Sing Gompa", lat: 28.147, lng: 85.32, kind: "monastery" },
    { name: "Gosaikunda", lat: 28.083, lng: 85.417, kind: "lake" },
    { name: "Saraswati Kunda", lat: 28.086, lng: 85.407, kind: "lake" },
    { name: "Laurebina La", lat: 28.1, lng: 85.42, kind: "pass" },
    { name: "Ghopte", lat: 28.1, lng: 85.478, kind: "village" },
    { name: "Kutumsang", lat: 27.99, lng: 85.51, kind: "village" },
    { name: "Chisapani", lat: 27.81, lng: 85.43, kind: "village" },
    { name: "Langtang Lirung", lat: 28.257, lng: 85.517, kind: "peak" },
  ],
  "upper-dolpo": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Nepalgunj", lat: 28.053, lng: 81.62, kind: "city" },
    { name: "Juphal", lat: 29.24, lng: 82.12, kind: "village" },
    { name: "Dunai", lat: 29.293, lng: 82.174, kind: "village" },
    { name: "Chhepka", lat: 29.235, lng: 82.183, kind: "village" },
    { name: "Chunuwar", lat: 29.183, lng: 82.97, kind: "village" },
    { name: "Phoksundo", lat: 29.183, lng: 82.97, kind: "village" },
    { name: "Phoksundo Lake", lat: 29.2, lng: 82.97, kind: "lake" },
    { name: "Sallaghari", lat: 29.207, lng: 82.938, kind: "village" },
    { name: "Kang La", lat: 29.34, lng: 83.15, kind: "pass" },
    { name: "Shey Gompa", lat: 29.393, lng: 83.134, kind: "monastery" },
    { name: "Crystal Mountain", lat: 29.39, lng: 83.16, kind: "peak" },
    { name: "Saldang", lat: 29.5, lng: 83.16, kind: "village" },
    { name: "Namgung", lat: 29.46, lng: 83.08, kind: "village" },
    { name: "Jeng La", lat: 29.42, lng: 83.24, kind: "pass" },
    { name: "Dho Tarap", lat: 29.29, lng: 83.05, kind: "village" },
    { name: "Tarakot", lat: 29.12, lng: 82.95, kind: "village" },
    { name: "Dhaulagiri", lat: 28.696, lng: 83.487, kind: "peak" },
  ],
  "lower-dolpo": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Nepalgunj", lat: 28.053, lng: 81.62, kind: "city" },
    { name: "Juphal", lat: 29.24, lng: 82.12, kind: "village" },
    { name: "Dunai", lat: 29.293, lng: 82.174, kind: "village" },
    { name: "Tarakot", lat: 29.05, lng: 82.82, kind: "village" },
    { name: "Laini", lat: 29.08, lng: 82.88, kind: "village" },
    { name: "Nawarpani", lat: 29.1, lng: 82.95, kind: "village" },
    { name: "Dho Tarap", lat: 29.29, lng: 83.05, kind: "village" },
    { name: "Numa La", lat: 29.4, lng: 83.19, kind: "pass" },
    { name: "Baga La", lat: 29.33, lng: 83.21, kind: "pass" },
    { name: "Pelung Tang", lat: 29.39, lng: 83.18, kind: "village" },
    { name: "Dajok Tang", lat: 29.32, lng: 83.16, kind: "village" },
    { name: "Phoksundo", lat: 29.183, lng: 82.97, kind: "village" },
    { name: "Phoksundo Lake", lat: 29.2, lng: 82.97, kind: "lake" },
    { name: "Chhepka", lat: 29.293, lng: 82.174, kind: "village" },
    { name: "Dhaulagiri", lat: 28.696, lng: 83.487, kind: "peak" },
  ],
  "limi-valley": [
    { name: "Kathmandu", lat: 27.7172, lng: 85.324, kind: "city" },
    { name: "Nepalgunj", lat: 28.053, lng: 81.62, kind: "city" },
    { name: "Simikot", lat: 29.97, lng: 81.82, kind: "village" },
    { name: "Dharapuri", lat: 30.03, lng: 81.78, kind: "village" },
    { name: "Kermi", lat: 30.08, lng: 81.76, kind: "village" },
    { name: "Yalbang", lat: 30.12, lng: 81.76, kind: "village" },
    { name: "Tumkot", lat: 30.15, lng: 81.78, kind: "village" },
    { name: "Yari", lat: 30.03, lng: 81.47, kind: "village" },
    { name: "Nara La", lat: 30.02, lng: 81.51, kind: "pass" },
    { name: "Hilsa", lat: 30.08, lng: 81.58, kind: "village" },
    { name: "Manepeme", lat: 30.07, lng: 81.54, kind: "village" },
    { name: "Til", lat: 30.07, lng: 81.53, kind: "village" },
    { name: "Halji", lat: 30.09, lng: 81.58, kind: "village" },
    { name: "Rinchenling Gompa", lat: 30.09, lng: 81.585, kind: "monastery" },
    { name: "Jang", lat: 30.09, lng: 81.58, kind: "village" },
    { name: "Nyalu La", lat: 30.17, lng: 81.71, kind: "pass" },
    { name: "Selima Tsho", lat: 30.2, lng: 81.7, kind: "lake" },
    { name: "Mt Api", lat: 30.015, lng: 80.93, kind: "peak" },
    { name: "Mt Saipal", lat: 29.89, lng: 81.36, kind: "peak" },
    { name: "Karnali River", lat: 30.05, lng: 81.6, kind: "river" },
  ],
};

// trailWaypoints[slug][i] = intermediate points strictly between path[i-1]
// and path[i] (day i's walking leg), as [lat, lng]. Empty for travel/acclimatization
// days. Lets the camera follow the winding trail instead of a straight line.

export const dayPlaces: Record<string, DayPlace[]> = Object.fromEntries(
  allRoutes.map((t) => [
    t.slug,
    t.itinerary.map((d) => ({
      from: d.from.name,
      to: d.to.name,
    })),
  ]),
);

export const trekLabels: Record<string, PlaceLabel[]> = Object.fromEntries(
  allRoutes.map((t) => {
    const map = new Map<string, PlaceLabel>();
    for (const d of t.itinerary) {
      for (const p of [d.from, d.to]) {
        if (p && p.name && !map.has(p.name)) {
          map.set(p.name, { name: p.name, lat: p.lat, lng: p.lng, kind: p.kind });
        }
      }
    }
    for (const p of scenicLabels[t.slug] ?? []) {
      if (!map.has(p.name)) map.set(p.name, p);
    }
    return [t.slug, [...map.values()]];
  }),
);

export const trailWaypoints: Record<string, [number, number][][]> = {
  "everest-base-camp": [
    [],
    [
      [27.7546, 86.7042],
      [27.7585, 86.713],
      [27.7868, 86.7199],
      [27.7949, 86.7176],
      [27.8009, 86.7125],
    ],
    [],
    [
      [27.8005, 86.695],
      [27.7818, 86.682],
      [27.8075, 86.741],
      [27.828, 86.759],
    ],
    [
      [27.858, 86.783],
      [27.872, 86.799],
      [27.888, 86.815],
    ],
    [],
    [
      [27.91, 86.823],
      [27.93, 86.82],
      [27.945, 86.816],
    ],
    [
      [27.97, 86.83],
      [27.98, 86.845],
    ],
    [
      [27.95, 86.84],
      [27.92, 86.83],
      [27.895, 86.822],
    ],
    [
      [27.872, 86.799],
      [27.858, 86.783],
      [27.8075, 86.741],
      [27.7818, 86.682],
      [27.8005, 86.695],
    ],
    [
      [27.8009, 86.7125],
      [27.7949, 86.7176],
      [27.7868, 86.7199],
      [27.7585, 86.713],
      [27.7546, 86.7042],
      [27.724, 86.7185],
      [27.707, 86.7245],
    ],
    [],
  ],
  "manaslu-circuit": [
    [],
    [
      [28.33, 84.798],
      [28.355, 84.802],
      [28.37, 84.807],
    ],
    [
      [28.4, 84.815],
      [28.412, 84.823],
    ],
    [
      [28.44, 84.842],
      [28.455, 84.852],
    ],
    [
      [28.51, 84.885],
      [28.55, 84.92],
      [28.575, 84.945],
    ],
    [],
    [[28.61, 84.965]],
    [],
    [[28.63, 84.99]],
    [
      [28.6, 85.012],
      [28.565, 85.018],
    ],
    [
      [28.53, 84.97],
      [28.52, 84.935],
    ],
    [
      [28.45, 84.8],
      [28.35, 84.55],
      [28.28, 84.42],
    ],
    [],
  ],
  "kanchenjunga-base-camp": [
    [],
    [],
    [
      [27.59, 87.875],
      [27.61, 87.89],
    ],
    [
      [27.655, 87.905],
      [27.67, 87.91],
    ],
    [[27.705, 87.925]],
    [],
    [[27.742, 87.943]],
    [],
    [
      [27.79, 87.97],
      [27.815, 87.99],
    ],
    [[27.852, 88.02]],
    [
      [27.8, 87.97],
      [27.76, 87.947],
      [27.73, 87.94],
    ],
    [
      [27.72, 87.92],
      [27.705, 87.905],
    ],
    [
      [27.69, 87.9],
      [27.665, 87.888],
      [27.645, 87.92],
    ],
    [[27.615, 87.9]],
    [
      [27.605, 87.88],
      [27.59, 87.86],
    ],
    [[27.573, 87.845]],
    [[27.528, 87.81]],
    [],
    [],
  ],
  "langtang-valley": [
    [],
    [
      [28.178, 85.365],
      [28.188, 85.38],
    ],
    [
      [28.2, 85.45],
      [28.205, 85.49],
    ],
    [[28.218, 85.55]],
    [],
    [
      [28.215, 85.52],
      [28.205, 85.49],
      [28.2, 85.45],
      [28.19, 85.4],
    ],
    [
      [28.178, 85.365],
      [28.17, 85.35],
    ],
    [],
  ],
  "gosaikunda-lake": [
    [],
    [
      [28.13, 85.3],
      [28.14, 85.31],
    ],
    [
      [28.12, 85.36],
      [28.1, 85.39],
    ],
    [
      [28.09, 85.44],
      [28.095, 85.46],
    ],
    [
      [28.045, 85.5],
      [28.02, 85.505],
    ],
    [
      [27.9, 85.46],
      [27.85, 85.44],
    ],
    [
      [27.75, 85.37],
      [27.72, 85.33],
    ],
  ],
  "upper-dolpo": [
    [],
    [],
    [[29.27, 82.15]],
    [
      [29.26, 82.18],
      [29.245, 82.183],
    ],
    [],
    [],
    [[29.195, 82.955]],
    [
      [29.24, 82.97],
      [29.27, 82.99],
    ],
    [
      [29.35, 83.07],
      [29.37, 83.1],
    ],
    [],
    [[29.45, 83.16]],
    [],
    [[29.48, 83.12]],
    [
      [29.38, 83.05],
      [29.33, 83.05],
    ],
    [],
    [[29.25, 83.03]],
    [[29.17, 82.98]],
    [[29.08, 82.88]],
    [],
    [
      [29.31, 82.25],
      [29.33, 82.3],
    ],
    [],
  ],
  "lower-dolpo": [
    [],
    [],
    [],
    [[29.06, 82.85]],
    [[29.09, 82.92]],
    [
      [29.19, 83.0],
      [29.24, 83.03],
    ],
    [],
    [[29.32, 83.09]],
    [[29.39, 83.17]],
    [[29.35, 83.15]],
    [
      [29.26, 83.06],
      [29.22, 83.0],
    ],
    [],
    [],
    [[29.32, 82.27]],
    [],
  ],
  "limi-valley": [
    [],
    [],
    [[29.99, 81.8]],
    [[30.055, 81.77]],
    [[30.1, 81.76]],
    [[30.135, 81.77]],
    [[30.09, 81.62]],
    [[30.055, 81.52]],
    [[30.075, 81.56]],
    [[30.07, 81.535]],
    [[30.08, 81.555]],
    [],
    [
      [30.12, 81.61],
      [30.14, 81.64],
    ],
    [[30.17, 81.675]],
    [
      [30.12, 81.7],
      [30.06, 81.76],
    ],
    [[30.0, 81.8]],
    [],
  ],
};
