import CTASection from "@/components/home/CTASection";
import FeaturedTreks from "@/components/home/FeaturedTreks";
import Hero from "@/components/home/Hero";
import MapTeaser from "@/components/home/MapTeaser";
import StatsBand from "@/components/home/StatsBand";
import WhyUs from "@/components/home/WhyUs";
import Marquee from "@/components/ui/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBand />
      <Marquee />
      <FeaturedTreks />
      <WhyUs />
      <MapTeaser />
      <CTASection />
    </>
  );
}
