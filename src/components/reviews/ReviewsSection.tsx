import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ReviewsList from "@/components/reviews/ReviewsList";
import ReviewForm from "@/components/reviews/ReviewForm";
import { getApprovedReviews } from "@/data/reviews";

export default async function ReviewsSection({
  subjectType,
  subjectSlug,
}: {
  subjectType: "trek" | "expedition";
  subjectSlug: string;
}) {
  const reviews = await getApprovedReviews(subjectType, subjectSlug);

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal className="mb-14">
        <SectionHeading eyebrow="Reviews" title="What travelers say." />
      </Reveal>
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ReviewsList reviews={reviews} />
        <ReviewForm subjectType={subjectType} subjectSlug={subjectSlug} />
      </div>
    </section>
  );
}
