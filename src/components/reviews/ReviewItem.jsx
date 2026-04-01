import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import StarRating from '@/components/reviews/StarRating';

const ReviewItem = ({ review }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <Card className="border-b border-gray-200 shadow-none rounded-none first:pt-0 last:border-b-0 py-6">
      <CardContent className="p-0">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarImage src={review.reviewer?.avatar_url} alt={review.reviewer?.full_name} />
            <AvatarFallback>{review.reviewer?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{review.reviewer?.full_name || 'Utilisateur Anonyme'}</p>
              <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
            </div>
            <StarRating rating={review.rating} size={16} className="my-1" />
            <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewItem;