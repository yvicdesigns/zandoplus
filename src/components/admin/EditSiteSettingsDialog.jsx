import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { submitChangeRequest, logAuditAction } from '@/lib/adminUtils';
import { Loader2 } from 'lucide-react';

const EditSiteSettingsDialog = ({ isOpen, onClose }) => {
  const { siteSettings, fetchSiteSettings } = useSiteSettings();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      reset(siteSettings);
    }
  }, [siteSettings, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (userRole === 'admin') {
        // Direct update for Admins
        const { error } = await supabase
          .from('site_settings')
          .update(data)
          .eq('id', 1);

        if (error) throw error;
        await logAuditAction(user.id, 'UPDATE_SETTINGS', 'site_settings', '1', data);
        
        toast({ title: 'Succès', description: 'Paramètres mis à jour.' });
        fetchSiteSettings();
      } else {
        // Change request for Editors
        const { error } = await submitChangeRequest(user.id, 'site_settings', '1', 'update', data);
        if (error) throw error;
        
        toast({ title: 'Demande envoyée', description: 'Vos modifications sont en attente d\'approbation.' });
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les Paramètres du Site</DialogTitle>
          <DialogDescription>
            {userRole === 'admin' 
              ? "Vos modifications seront appliquées immédiatement." 
              : "Vos modifications seront soumises à approbation."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">Numéro WhatsApp</Label>
              <Input id="whatsapp_number" {...register('whatsapp_number')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL du Logo</Label>
              <Input id="logo_url" {...register('logo_url')} />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="notification_email" className="flex items-center gap-2">
              📧 Email de notification admin
            </Label>
            <Input
              id="notification_email"
              type="email"
              placeholder="ex: zandopluscg@gmail.com"
              {...register('notification_email')}
            />
            <p className="text-xs text-gray-500">
              Cet email reçoit une alerte automatique dès qu'un vendeur demande un retrait (avec son nom, numéro MoMo et montant).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="gradient-bg">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : null}
              {userRole === 'admin' ? 'Enregistrer' : 'Soumettre la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSiteSettingsDialog;