import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { validatePhone, sanitizeInput } from '@/lib/validationUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EditProfileDialog = ({ isOpen, onOpenChange, profileData, onSave }) => {
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Reset form state when dialog opens/closes or profile data changes
  useEffect(() => {
    if (isOpen && profileData) {
      setEditData({
        name: profileData.full_name || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        bio: profileData.bio || ''
      });
      setErrors({});
      setGlobalError('');
      setIsSubmitting(false);
    }
  }, [profileData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific field error on typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (globalError) setGlobalError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!editData.name || editData.name.trim() === '') {
      newErrors.name = 'Le nom complet est requis.';
    } else if (editData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères.';
    }

    // Phone format validation (optional, but if provided must be valid)
    if (editData.phone && editData.phone.trim() !== '') {
      if (!validatePhone(editData.phone)) {
        newErrors.phone = 'Le format du numéro de téléphone est invalide. (ex: +242061234567)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    setGlobalError('');
    
    // 1. Validate inputs before processing
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Sanitize inputs before passing to parent
      const sanitizedData = {
        name: sanitizeInput(editData.name),
        phone: sanitizeInput(editData.phone),
        location: sanitizeInput(editData.location),
        bio: sanitizeInput(editData.bio)
      };

      // 3. Call parent save handler and wait for it
      await onSave(sanitizedData);
      
      // Dialog will be closed by parent on success
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du profil:", err);
      setGlobalError(err.message || 'Une erreur inattendue est survenue lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations personnelles publiques. Cliquez sur sauvegarder une fois terminé.
          </DialogDescription>
        </DialogHeader>
        
        {globalError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <Input
              id="profile-name"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="Votre nom complet"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-phone" className="text-sm font-medium">Téléphone</label>
            <Input
              id="profile-phone"
              name="phone"
              type="tel"
              value={editData.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="+242..."
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-location" className="text-sm font-medium">Localisation</label>
            <Input
              id="profile-location"
              name="location"
              value={editData.location}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Ex: Brazzaville, Pointe-Noire..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-bio" className="text-sm font-medium">À propos de moi (Bio)</label>
            <Textarea
              id="profile-bio"
              name="bio"
              value={editData.bio}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Parlez-nous de vous..."
              className="resize-none h-24"
              maxLength={500}
            />
            <div className="text-xs text-right text-gray-400">
              {editData.bio.length} / 500
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            className="gradient-bg hover:opacity-90 min-w-[140px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;