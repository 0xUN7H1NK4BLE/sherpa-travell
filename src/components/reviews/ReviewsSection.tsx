import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ReviewsList from "@/components/reviews/ReviewsList";
import ReviewForm from "@/components/reviews/ReviewForm";
import { getApprovedReviews } from "@/data/reviews";

export default async function ReviewsSection({
  subjectType,
  subjectSlug,
  subjectName,
  subjectImage,
}: {
  subjectType: "trek" | "expedition";
  subjectSlug: string;
  subjectName: string;
  subjectImage: string;
}) {
  const reviews = await getApprovedReviews(subjectType, subjectSlug);

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal className="mb-14">
        <SectionHeading eyebrow="Reviews" title="What travelers say." />
      </Reveal>

      <Reveal className={reviews.length > 0 ? "mb-16" : "mb-10"}>
        <ReviewsList reviews={reviews} subjectName={subjectName} subjectImage={subjectImage} />
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-6 font-display text-2xl font-light tracking-tight text-snow">
            Share your experience
          </h3>
          <ReviewForm subjectType={subjectType} subjectSlug={subjectSlug} />
        </div>
      </Reveal>
    </section>
  );
}
