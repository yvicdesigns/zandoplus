import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const reportReasons = [
  { value: 'spam', label: 'Spam ou annonce répétitive' },
  { value: 'fraud', label: 'Tentative de fraude ou arnaque' },
  { value: 'prohibited', label: 'Article ou service interdit' },
  { value: 'misleading', label: 'Annonce trompeuse ou incorrecte' },
  { value: 'other', label: 'Autre' },
];

const ReportListingDialog = ({ open, onOpenChange, listingId, listingTitle }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setReason('');
      setComments('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour signaler une annonce.", variant: "destructive" });
      return;
    }
    if (!reason) {
      toast({ title: "Motif requis", description: "Veuillez sélectionner un motif pour le signalement.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason: reason,
        comments: comments,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: "Annonce signalée",
        description: "Merci, nous avons bien reçu votre signalement et allons l'examiner.",
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Erreur lors du signalement de l'annonce:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du signalement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Signaler l'annonce</DialogTitle>
            <DialogDescription>
              Aidez-nous à maintenir une communauté sûre. Pourquoi signalez-vous "{listingTitle}" ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div>
              <Label htmlFor="reason">Motif du signalement</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Sélectionnez un motif..." />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comments">Commentaires (facultatif)</Label>
              <Textarea
                id="comments"
                placeholder="Donnez-nous plus de détails..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" className="gradient-bg hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportListingDialog;