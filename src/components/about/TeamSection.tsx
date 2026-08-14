import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import type { TeamMember } from "@/data/team";

const socialIcons: Record<"instagram" | "facebook" | "whatsapp", React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M14.5 21v-7.5h2.5l.5-3h-3V8.3c0-.9.3-1.6 1.6-1.6h1.5V3.9C16.9 3.8 15.9 3.7 14.9 3.7c-2.4 0-4 1.5-4 4.1V10.5H8.4v3H10.9V21" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M7 20l1.1-3.3A7.8 7.8 0 1 1 11.9 19.7z" />
      <path d="M9 9.6c0-.6.5-1.1 1.1-1.1.3 0 .5.1.7.4l.6 1c.2.3.1.7-.1.9l-.5.5c.4.9 1.1 1.6 2 2l.5-.5c.2-.2.6-.3.9-.1l1 .6c.3.2.4.5.4.7 0 .6-.5 1.2-1.1 1.2-3 0-5.5-2.5-5.5-5.6z" />
    </svg>
  ),
};

const socialLabels: Record<keyof typeof socialIcons, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

export default function TeamSection({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="The people"
            title="The team on the ground."
            className="mb-12"
          />
        </Reveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,320px))] justify-center gap-6">
          {members.map((member, i) => {
            const links = (["instagram", "facebook", "whatsapp"] as const).filter(
              (key) => member[key],
            );
            return (
              <Reveal key={member.id} delay={i * 0.05}>
                <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-night-raised">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col p-5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                      <span className="h-px w-6 shrink-0 bg-ice/50" />
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-ice">
                        {member.role}
                      </span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-light tracking-tight text-snow">
                      {member.name}
                    </p>
                    {member.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-mist">{member.bio}</p>
                    )}
                    {links.length > 0 && (
                      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                        {links.map((key) => (
                          <a
                            key={key}
                            href={member[key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on ${socialLabels[key]}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-mist transition-colors hover:border-saffron hover:text-saffron"
                          >
                            <span className="h-4 w-4">{socialIcons[key]}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
