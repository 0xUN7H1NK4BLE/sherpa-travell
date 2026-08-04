import Reveal from "@/components/ui/Reveal";

export default function Gallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {images.map((src, i) => (
        <Reveal key={src} delay={i * 0.08}>
          <div className="overflow-hidden rounded-2xl border border-line">
            <img
              src={src}
              alt={`${name} — photo ${i + 1}`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
            />
          </div>
        </Reveal>
      ))}
    </div>
  );
}
