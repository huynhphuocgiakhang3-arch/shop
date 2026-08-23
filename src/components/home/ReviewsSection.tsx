import { Star } from "lucide-react";
import { RevealSection } from "./RevealSection";

export interface ReviewCardData {
  id: string;
  rating: number;
  comment: string | null;
  user: { displayName: string; avatarUrl: string | null };
  product: { name: string };
}

export function ReviewsSection({ reviews }: { reviews: ReviewCardData[] }) {
  if (reviews.length === 0) return null;

  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-20">
      <h2 className="mb-8 text-h2 font-display text-white">Khách hàng nói gì</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="glass-surface flex flex-col gap-3 rounded-lg p-6 shadow-[0_20px_70px_rgba(0,0,0,.18)]">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < review.rating ? "fill-accent-orange text-accent-orange" : "text-white/15"}`}
                />
              ))}
            </div>
            {review.comment && <p className="text-small text-white/70 line-clamp-4">{review.comment}</p>}
            <div className="mt-auto flex items-center justify-between pt-2 text-caption text-white/40">
              <span>{review.user.displayName}</span>
              <span className="line-clamp-1">{review.product.name}</span>
            </div>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
