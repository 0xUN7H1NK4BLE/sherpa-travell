const words = [
  "Khumbu",
  "Everest Base Camp",
  "Dolpo",
  "Limi Valley",
  "Kanchenjunga",
  "Langtang",
  "Gosaikunda",
  "Shey Phoksundo",
  "Larkya La",
  "Phoksundo Lake",
  "Tarap Valley",
  "Rinchenling",
];

function Row() {
  return (
    <div className="flex items-center" aria-hidden>
      {words.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-6 font-display text-3xl font-light tracking-tight text-mist/50 transition-colors hover:text-saffron md:text-4xl">
            {word}
          </span>
          <span className="text-xs text-saffron">✦</span>
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="border-y border-line bg-night-raised py-6">
      <div className="marquee" aria-label="Treks and regions">
        <div className="marquee-track">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
