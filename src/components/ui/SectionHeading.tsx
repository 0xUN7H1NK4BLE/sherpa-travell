import Eyebrow from "@/components/ui/Eyebrow";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-5", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-4xl leading-[1.05] font-light tracking-tight text-balance md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-relaxed text-mist">{description}</p>
      ) : null}
    </div>
  );
}
