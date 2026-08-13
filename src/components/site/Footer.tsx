import Link from "next/link";
import { site } from "@/data/site";
import { treks } from "@/data/treks";
import SiteLogo from "@/components/site/SiteLogo";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-night-raised">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <SiteLogo className="h-24 w-24" />
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl tracking-tight">
                Sherpa Treks
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-saffron">
                Nepal
              </span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-mist">
            Sherpa-guided treks and expeditions into Nepal&apos;s wildest
            corners — from Everest to the hidden valleys of Dolpo and Limi.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Explore
          </h3>
          <ul className="space-y-2.5 text-sm text-mist">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-snow"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Treks
          </h3>
          <ul className="space-y-2.5 text-sm text-mist">
            {treks.slice(0, 6).map((trek) => (
              <li key={trek.slug}>
                <Link
                  href={`/treks/${trek.slug}`}
                  className="transition-colors hover:text-snow"
                >
                  {trek.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Talk to us
          </h3>
          <ul className="space-y-2.5 text-sm text-mist">
            <li className="text-snow">{site.contact.name}</li>
            <li>
              <a
                href={site.contact.phoneHref}
                className="transition-colors hover:text-snow"
              >
                {site.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-snow"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={site.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-snow"
              >
                Instagram
              </a>
            </li>
            <li>{site.contact.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-mist/70 md:flex-row md:px-8">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
