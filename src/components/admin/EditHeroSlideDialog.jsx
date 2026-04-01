import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import FileUpload from '@/components/verification/FileUpload';
import imageCompression from 'browser-image-compression';
import HeroTextEditor from './HeroTextEditor';
import HeroSlidePreview from './HeroSlidePreview';
import AdvancedColorPicker from './ColorPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

const EditHeroSlideDialog = ({ isOpen, onClose, slide, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const { toast } = useToast();

  const resetForm = useCallback((currentSlide) => {
    const initialData = {
      text_content: currentSlide?.text_content || [{ spans: [{ text: "Achetez & Vendez", color: '#FFFFFF', size: '2.25rem', weight: 'bold', style: 'normal' }] }, { spans: [{ text: "Tout au Congo", color: '#FFFFFF', size: '1.125rem', weight: 'normal', style: 'normal' }] }],
      text_align: currentSlide?.text_align || 'center',
      cta_text: currentSlide?.cta_text || '',
      cta_link: currentSlide?.cta_link || '',
      secondary_cta_text: currentSlide?.secondary_cta_text || '',
      secondary_cta_link: currentSlide?.secondary_cta_link || '',
      image_url: currentSlide?.image_url || '',
      order: currentSlide?.order || 0,
      is_active: currentSlide ? currentSlide.is_active !== false : true,
      show_search_bar: currentSlide ? currentSlide.show_search_bar !== false : true,
      background_color: currentSlide?.background_color || '#000000',
      overlay_enabled: currentSlide ? currentSlide.overlay_enabled !== false : true,
      overlay_color: currentSlide?.overlay_color || '#000000',
      overlay_opacity: currentSlide?.overlay_opacity ?? 0.5,
    };
    setFormData(initialData);
    setPreviewUrl(initialData.image_url);
    setImageFile(null);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      resetForm(slide);
    }
  }, [slide, isOpen, resetForm]);

  const handleFormChange = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleImageChange = async (file) => {
    if (!file) {
      handleRemoveImage();
      return;
    }
    
    setIsLoading(true);
    toast({ title: 'Optimisation', description: 'Compression de l\'image en cours...' });

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(objectUrl);
      handleFormChange({ image_url: objectUrl });
      toast({ title: 'Succès', description: 'Image optimisée et prête à être téléversée.', className: 'bg-custom-green-500 text-white' });
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'optimisation de l\'image a échoué.' });
      const objectUrl = URL.createObjectURL(file);
      setImageFile(file); // fallback to original file
      setPreviewUrl(objectUrl);
      handleFormChange({ image_url: objectUrl });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl('');
    handleFormChange({ image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalImageUrl = slide?.image_url || '';

      if (imageFile) {
        if (slide?.image_url) {
          const oldPath = new URL(slide.image_url).pathname.split('/site_assets/')[1];
          if (oldPath) await supabase.storage.from('site_assets').remove([oldPath]);
        }
        
        const fileExt = 'webp';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `hero_slides/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('site_assets').upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      } 
      else if (!previewUrl && slide?.image_url) {
        const oldPath = new URL(slide.image_url).pathname.split('/site_assets/')[1];
        if (oldPath) await supabase.storage.from('site_assets').remove([oldPath]);
        finalImageUrl = '';
      }

      const { image_url, ...restOfFormData } = formData;
      const updates = { ...restOfFormData, image_url: finalImageUrl };

      let result;
      if (slide?.id) {
        const { data, error } = await supabase.from('hero_slides').update(updates).eq('id', slide.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('hero_slides').insert(updates).select().single();
        if (error) throw error;
        result = data;
      }

      onSave(result);
      toast({ title: "Succès", description: "La bannière a été sauvegardée.", className: 'bg-custom-green-500 text-white' });
      onClose();

    } catch (error) {
      console.error("Error saving slide:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentImageUrl = previewUrl || formData.image_url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh]">
        <DialogHeader>
          <DialogTitle>{slide?.id ? 'Modifier la Bannière' : 'Nouvelle Bannière'}</DialogTitle>
          <DialogDescription>
            Concevez votre bannière à gauche et visualisez l'aperçu en direct à droite.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(90vh-150px)]">
          <div className="overflow-y-auto pr-4 space-y-4">
            <form id="hero-slide-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="image">Image de fond (optionnel)</Label>
                {currentImageUrl && (
                  <div className="mt-2 relative">
                    <img src={currentImageUrl} alt="Aperçu" className="w-full h-auto rounded-md object-cover max-h-40" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FileUpload
                  onFileSelect={handleImageChange}
                  acceptedFileTypes="image/jpeg, image/png, image/webp"
                  label=""
                  triggerClass="mt-2"
                  loading={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Les images sont converties en WebP et compressées.</p>
              </div>

              <div>
                <Label htmlFor="background_color">Couleur de fond (si pas d'image)</Label>
                <div className="flex items-center gap-2">
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" style={{ backgroundColor: formData.background_color }}>
                        <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }}/>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <AdvancedColorPicker
                        color={formData.background_color}
                        onChange={(color) => handleFormChange({ background_color: color })}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="background_color"
                    name="background_color"
                    type="text"
                    value={formData.background_color || '#000000'}
                    onChange={(e) => handleFormChange({ background_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="overlay_enabled" className="font-semibold">Superposition de couleur (Overlay)</Label>
                  <Switch id="overlay_enabled" checked={formData.overlay_enabled || false} onCheckedChange={(checked) => handleFormChange({ overlay_enabled: checked })} />
                </div>
                {formData.overlay_enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="overlay_color">Couleur de la superposition</Label>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" style={{ backgroundColor: formData.overlay_color }}>
                              <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }}/>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <AdvancedColorPicker
                              color={formData.overlay_color}
                              onChange={(color) => handleFormChange({ overlay_color: color })}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          id="overlay_color"
                          name="overlay_color"
                          type="text"
                          value={formData.overlay_color || '#000000'}
                          onChange={(e) => handleFormChange({ overlay_color: e.target.value })}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="overlay_opacity">Opacité de la superposition ({Math.round((formData.overlay_opacity || 0) * 100)}%)</Label>
                      <Slider
                        id="overlay_opacity"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[formData.overlay_opacity || 0]}
                        onValueChange={(value) => handleFormChange({ overlay_opacity: value[0] })}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 rounded-md border p-4">
                <HeroTextEditor 
                  textContent={formData.text_content || []}
                  onTextContentChange={(content) => handleFormChange({ text_content: content })}
                  textAlign={formData.text_align || 'center'}
                  onTextAlignChange={(align) => align && handleFormChange({ text_align: align })}
                />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <Label className="font-semibold">Boutons d'action</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="cta_text">Texte du bouton principal</Label>
                      <Input id="cta_text" name="cta_text" value={formData.cta_text || ''} onChange={(e) => handleFormChange({ cta_text: e.target.value })} />
                  </div>
                  <div>
                      <Label htmlFor="cta_link">Lien du bouton principal</Label>
                      <Input id="cta_link" name="cta_link" value={formData.cta_link || ''} onChange={(e) => handleFormChange({ cta_link: e.target.value })} placeholder="/listings" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="secondary_cta_text">Texte du bouton secondaire</Label>
                      <Input id="secondary_cta_text" name="secondary_cta_text" value={formData.secondary_cta_text || ''} onChange={(e) => handleFormChange({ secondary_cta_text: e.target.value })} />
                  </div>
                  <div>
                      <Label htmlFor="secondary_cta_link">Lien du bouton secondaire</Label>
                      <Input id="secondary_cta_link" name="secondary_cta_link" value={formData.secondary_cta_link || ''} onChange={(e) => handleFormChange({ secondary_cta_link: e.target.value })} placeholder="/post-ad" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="order">Ordre d'affichage</Label>
                    <Input id="order" name="order" type="number" value={formData.order || 0} onChange={(e) => handleFormChange({ order: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch id="is_active" checked={formData.is_active || false} onCheckedChange={(checked) => handleFormChange({ is_active: checked })} />
                  <Label htmlFor="is_active">Activer la bannière</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="show_search_bar" checked={formData.show_search_bar || false} onCheckedChange={(checked) => handleFormChange({ show_search_bar: checked })} />
                <Label htmlFor="show_search_bar">Afficher la barre de recherche</Label>
              </div>
            </form>
          </div>
          <div className="flex flex-col h-full">
            <Label className="font-semibold mb-2">Aperçu en direct</Label>
            <div className="flex-grow">
              <HeroSlidePreview slideData={formData} imageUrl={currentImageUrl} />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
          <Button type="submit" form="hero-slide-form" disabled={isLoading} className="gradient-bg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHeroSlideDialog;