import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating = 0, totalStars = 5, size = 20, className, onRatingChange, isInteractive = false }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (rate) => {
    if (isInteractive && onRatingChange) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate) => {
    if (isInteractive) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center', className)} onMouseLeave={handleMouseLeave}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              'transition-colors',
              starValue <= displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300',
              isInteractive ? 'cursor-pointer' : ''
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;