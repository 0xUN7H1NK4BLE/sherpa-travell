# Photo manifest

All current images are generated SVG placeholders. Replace them with real
photos **using the exact same filenames** (any of `.jpg` / `.webp` — then
update the matching path in `src/data/treks.ts` or the component that
references it) and the site updates automatically. Landscape orientation,
at least 1600px wide.

## Site-wide

| File | Used on | Replace with |
| --- | --- | --- |
| `hero.svg` | Home hero | Your single most dramatic Himalayan shot — a sunrise over a big face works best |
| `about.svg` | About page header | Abishek on the trail, or a group walking a high ridge |

## Per trek (`treks/`)

Referenced in `src/data/treks.ts` under each trek's `image` field.

| File | Trek |
| --- | --- |
| `treks/everest-base-camp.svg` | Everest Base Camp |
| `treks/manaslu-circuit.svg` | Manaslu Circuit |
| `treks/kanchenjunga-base-camp.svg` | Kanchenjunga Base Camps |
| `treks/langtang-valley.svg` | Langtang Valley |
| `treks/gosaikunda-lake.svg` | Gosaikunda |
| `treks/upper-dolpo.svg` | Upper Dolpo |
| `treks/lower-dolpo.svg` | Lower Dolpo |
| `treks/limi-valley.svg` | Limi Valley |

## Gallery scenes (`scenes/`)

Used for trek galleries and the home CTA background. Each trek picks three in
its `gallery` field in `src/data/treks.ts` — swap in real shots per trek
(prayer flags, glaciers, lakes, monasteries, night skies, trail life, valleys).
