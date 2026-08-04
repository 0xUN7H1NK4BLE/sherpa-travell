export const site = {
  name: "Sherpa Treks Nepal",
  tagline: "Walk where the maps end.",
  description:
    "Sherpa-guided treks and expeditions across Nepal's wildest regions — Kanchenjunga, Sagarmatha, Langtang, Gosaikunda, Manaslu, Upper and Lower Dolpo, Limi Valley and beyond.",
  contact: {
    name: "Abishek Sherpa",
    role: "Founder & Lead Guide",
    phoneDisplay: "+977 9818561151",
    phoneHref: "tel:+9779818561151",
    whatsapp: "https://wa.me/9779818561151",
    address: "Kathmandu, Nepal",
  },
  nav: [
    { href: "/treks", label: "Treks" },
    { href: "/gallery", label: "Gallery" },
    { href: "/map", label: "Map" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export function waLink(message: string) {
  return `${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
