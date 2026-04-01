import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import StarRating from '@/components/reviews/StarRating';
import { useAuth } from '@/contexts/AuthContext';

const ReviewForm = ({ listingId, sellerId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Évaluation requise', description: 'Veuillez sélectionner une note.', variant: 'destructive' });
      return;
    }
    if (!comment.trim()) {
        toast({ title: 'Commentaire requis', description: 'Veuillez écrire un commentaire.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        listing_id: listingId,
        seller_id: sellerId,
        reviewer_id: user.id,
        rating,
        comment,
      });
      setRating(0);
      setComment('');
    } catch (error) {
      // Error toast is handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-semibold text-gray-700">Votre note</label>
        <StarRating rating={rating} onRatingChange={setRating} isInteractive={true} size={24} className="mt-1" />
      </div>
      <div>
        <label htmlFor="comment" className="font-semibold text-gray-700">Votre commentaire</label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce vendeur..."
          className="mt-1"
          rows={4}
        />
      </div>
      <div className="text-right">
        <Button type="submit" disabled={isSubmitting} className="gradient-bg hover:opacity-90">
          {isSubmitting ? 'Envoi en cours...' : 'Soumettre l\'avis'}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;