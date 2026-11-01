import { Review } from '../types/review';

type ReviewsViewProps = {
  reviews: Review[];
};

export default function ReviewsView({
  reviews,
}: ReviewsViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Customer Reviews
      </h1>

      <div className="mt-8 space-y-4">
        {reviews.map(review => (
          <div
            key={review.id}
            className="rounded-2xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {review.customerName}
              </h2>

              <div>
                {'★'.repeat(review.rating)}
              </div>
            </div>

            <p className="mt-4 text-gray-600">
              {review.comment}
            </p>

            <p className="mt-4 text-sm text-gray-400">
              {review.createdAt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}