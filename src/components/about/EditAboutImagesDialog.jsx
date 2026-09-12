import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import FileUpload from '@/components/verification/FileUpload';

// Ne gère plus que la photo du fondateur : la section "mission" de la page
// À propos n'utilise plus d'image (elle utilisait par erreur le logo Zando+
// comme photo -> retiré lors de la refonte du 12/09/2026).
const EditAboutImagesDialog = ({ open, onOpenChange, initialData, onSave }) => {
  const [creatorImageFile, setCreatorImageFile] = useState(null);
  const [creatorImageUrl, setCreatorImageUrl] = useState(initialData?.creator_image_url);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setCreatorImageUrl(initialData.creator_image_url);
    }
  }, [initialData]);

  const uploadFile = async (file, path) => {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('site_assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('site_assets')
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;
  };

  const handleSaveChanges = async () => {
    setIsUploading(true);
    try {
      let finalCreatorUrl = creatorImageUrl;
      if (creatorImageFile) {
        const filePath = `about/creator_image_${Date.now()}_${creatorImageFile.name}`;
        finalCreatorUrl = await uploadFile(creatorImageFile, filePath);
      }

      const { data, error } = await supabase
        .from('about_page_content')
        .update({
          creator_image_url: finalCreatorUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;

      onSave(data);
      toast({ title: 'Succès', description: 'La photo a été mise à jour.' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating about page image:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la photo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la photo du fondateur</DialogTitle>
          <DialogDescription>
            Téléversez une nouvelle photo pour la section « Le fondateur ».
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FileUpload
            label="Photo du fondateur"
            onFileSelect={setCreatorImageFile}
            onFileRemove={() => setCreatorImageFile(null)}
            acceptedFileTypes="image/jpeg,image/png,image/webp,image/svg+xml"
            previouslyUploadedUrl={creatorImageUrl}
            loading={isUploading}
            disabled={isUploading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleSaveChanges} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAboutImagesDialog;
