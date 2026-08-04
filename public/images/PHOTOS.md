# Photo manifest

All site images are real photos from Wikimedia Commons contributors
(CC BY-SA). Replace any with a new photo by keeping the same filename
and path; the site picks it up automatically. Landscape, ≥1000px wide.

## Site-wide

| File | Used on |
| --- | --- |
| `hero.jpg` | Home hero (Sunset view of Everest) |
| `about.jpg` | About page header (Tribeni Trek) |

## Per trek (`treks/`) — referenced via each trek's `image` field in `src/data/treks.ts`

| File | Trek |
| --- | --- |
| `treks/everest-base-camp.jpg` | Everest Base Camp |
| `treks/manaslu-circuit.jpg` | Manaslu Circuit |
| `treks/kanchenjunga-base-camp.jpg` | Kanchenjunga Base Camps |
| `treks/langtang-valley.jpg` | Langtang Valley |
| `treks/gosaikunda-lake.jpg` | Gosaikunda |
| `treks/upper-dolpo.jpg` | Upper Dolpo |
| `treks/lower-dolpo.jpg` | Lower Dolpo |
| `treks/limi-valley.jpg` | Limi Valley |

## Gallery scenes (`scenes/`) — each trek picks three via its `gallery` field; also home CTA uses `stars.jpg`

| File | Subject |
| --- | --- |
| `flags.jpg` | Prayer flags |
| `glacier.jpg` | Khumbu glacier |
| `lake.jpg` | Gokyo lakes |
| `monastery.jpg` | Tengboche monastery |
| `stars.jpg` | Milky way over Annapurna |
| `trail.jpg` | Hikers on the trail (Machermo) |
| `valley.jpg` | Kyanjin valley, Langtang |

## Per-day itinerary photos (`places/`) — mapped in `src/data/trekPhotos.ts`

`public/images/places/*.jpg` hold the per-day day-card photos for all
eight treks, keyed by place (lukla, namche, tengboche, gosaikunda,
phoksundo, halji, etc.). Regional fallbacks (himalaya_valley,
river_gorge, humla_valley…) cover places without a direct photo.
