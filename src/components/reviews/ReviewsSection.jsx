import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/reviews/StarRating';
import ReviewItem from '@/components/reviews/ReviewItem';
import ReviewForm from '@/components/reviews/ReviewForm';
import { Separator } from '@/components/ui/separator';

const ReviewsSection = ({ listingId, sellerId, reviews, averageRating, onReviewSubmitted }) => {
  const { user } = useAuth();
  const hasUserReviewed = user && reviews.some(review => review.reviewer_id === user.id);
  const isSeller = user && user.id === sellerId;

  const canLeaveReview = user && !isSeller && !hasUserReviewed;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>Avis ({reviews.length})</CardTitle>
            <div className="flex items-center gap-2">
                <StarRating rating={averageRating} />
                <span className="font-bold text-lg">{averageRating.toFixed(1)} sur 5</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {canLeaveReview && (
          <>
            <ReviewForm listingId={listingId} sellerId={sellerId} onSubmit={onReviewSubmitted} />
            <Separator className="my-8" />
          </>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map(review => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun avis pour le moment. {canLeaveReview ? "Soyez le premier à en laisser un !" : ""}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsSection;