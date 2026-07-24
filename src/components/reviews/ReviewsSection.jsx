import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import StarRating from '@/components/reviews/StarRating';
import ReviewItem from '@/components/reviews/ReviewItem';
import ReviewForm from '@/components/reviews/ReviewForm';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck } from 'lucide-react';

const ReviewsSection = ({ listingId, sellerId, reviews, averageRating, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false);

  const hasUserReviewed = user && reviews.some(r => r.reviewer_id === user.id);
  const isSeller = user && user.id === sellerId;

  useEffect(() => {
    if (!user || isSeller || !listingId) return;

    supabase
      .from('transactions_escrow')
      .select('id')
      .eq('acheteur_id', user.id)
      .eq('annonce_id', listingId)
      .in('statut', ['confirme', 'complete', 'retrait_demande', 'withdrawal_sent'])
      .limit(1)
      .then(({ data }) => setHasVerifiedPurchase(!!data?.length));
  }, [user, listingId, isSeller]);

  const canLeaveReview = user && !isSeller && !hasUserReviewed && hasVerifiedPurchase;
  const isPendingPurchase = user && !isSeller && !hasUserReviewed && !hasVerifiedPurchase;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Avis ({reviews.length})</CardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="font-bold text-lg">{averageRating.toFixed(1)} sur 5</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {canLeaveReview && (
          <>
            <ReviewForm listingId={listingId} sellerId={sellerId} onSubmit={onReviewSubmitted} />
            <Separator className="my-8" />
          </>
        )}

        {isPendingPurchase && user && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Achetez cet article pour pouvoir laisser un avis.</span>
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map(review => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Aucun avis pour le moment.{canLeaveReview ? ' Soyez le premier à en laisser un !' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsSection;
