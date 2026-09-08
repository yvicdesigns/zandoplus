import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import FormError from './FormError';
import { Label } from '@/components/ui/label';
import ListingHelper from '@/components/ai/ListingHelper';
import { Camera as CameraIcon, ImagePlus, X } from 'lucide-react';
import { getCategoryEmoji } from './categoryIcons';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { BLOCKED_DIGITAL_EXTENSIONS, MAX_DIGITAL_FILE_SIZE_MB } from './postAdConstants';
import { FileUp, FileCheck2, X as XIcon, Link2, Youtube } from 'lucide-react';

const mediaResultToFile = async (result, index = 0) => {
  const res = await fetch(result.webPath);
  const blob = await res.blob();
  const ext = blob.type?.split('/')[1] || 'jpeg';
  return new File([blob], `photo-${Date.now()}-${index}.${ext}`, { type: blob.type || `image/${ext}` });
};

const Step1BasicInfo = ({ formData, handleInputChange, handleSelectChange, formErrors, onAIDescription, handleImageUpload, removeImage, onNativeImages, digitalFile, onDigitalFileChange }) => {
  const deliveryType = formData.digital_delivery_type || 'file';
  const fileInputRef = useRef(null);
  const digitalFileInputRef = useRef(null);
  const isNative = Capacitor.isNativePlatform();

  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  };

  const pickDigitalFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (BLOCKED_DIGITAL_EXTENSIONS.includes(ext)) {
      onDigitalFileChange?.(null, `Le format ".${ext}" n'est pas autorisé pour un produit numérique.`);
      return;
    }
    if (file.size > MAX_DIGITAL_FILE_SIZE_MB * 1024 * 1024) {
      onDigitalFileChange?.(null, `Le fichier dépasse la taille maximale de ${MAX_DIGITAL_FILE_SIZE_MB} Mo.`);
      return;
    }
    onDigitalFileChange?.(file, null);
  };

  const takeNativePhoto = async () => {
    try {
      const result = await Camera.takePhoto({ quality: 85 });
      onNativeImages?.([await mediaResultToFile(result)]);
    } catch {
      // Annulé par l'utilisateur — rien à faire
    }
  };

  const chooseFromNativeGallery = async () => {
    try {
      const { results } = await Camera.chooseFromGallery({ allowMultipleSelection: true });
      const files = await Promise.all(results.map(mediaResultToFile));
      onNativeImages?.(files);
    } catch {
      // Annulé par l'utilisateur — rien à faire
    }
  };
  const { categories, categoriesMap } = useCategories();
  const selectedCategoryType = formData.category ? categoriesMap[formData.category]?.type : null;
  const isJobCategory = selectedCategoryType === 'job';
  const isDigitalCategory = selectedCategoryType === 'digital';
  const [showCustomSub, setShowCustomSub] = useState(false);

  // Reset custom sub when category changes
  useEffect(() => {
    setShowCustomSub(false);
  }, [formData.category]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold mb-4">Informations de Base</h2>
        <p className="text-gray-600 mb-6">Commençons par les bases de votre article ou service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="block text-sm font-medium mb-2">Catégorie <span className="text-red-500">*</span></Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {getCategoryEmoji(cat.slug)}  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={formErrors.category} />
        </div>

        {formData.category && categoriesMap[formData.category]?.subcategories.length > 0 && (
          <div>
            <Label className="block text-sm font-medium mb-2">
              {isJobCategory ? 'Type de contrat' : 'Sous-catégorie'}
              {isJobCategory && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={showCustomSub ? '__other__' : (formData.subcategory || '')}
              onValueChange={(value) => {
                if (value === '__other__') {
                  setShowCustomSub(true);
                  handleSelectChange('subcategory', '');
                } else {
                  setShowCustomSub(false);
                  handleSelectChange('subcategory', value);
                }
              }}
            >
              <SelectTrigger className={isJobCategory && formErrors.subcategory ? 'border-red-500' : ''}>
                <SelectValue placeholder={isJobCategory ? "Sélectionnez un type de contrat" : "Sélectionnez une sous-catégorie"} />
              </SelectTrigger>
              <SelectContent>
                {categoriesMap[formData.category]?.subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
                <SelectItem value="__other__">✏️ Autre (préciser)</SelectItem>
              </SelectContent>
            </Select>
            {showCustomSub && (
              <div className="mt-2">
                <Input
                  placeholder="Ex: Meubles de bureau en rotin..."
                  value={formData.subcategory || ''}
                  onChange={(e) => handleSelectChange('subcategory', e.target.value)}
                  className="text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Décrivez votre sous-catégorie en quelques mots</p>
              </div>
            )}
            {isJobCategory && <FormError message={formErrors.subcategory} />}
          </div>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Titre <span className="text-red-500">*</span></Label>
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder={isJobCategory ? "Ex: Développeur Web React" : "Donnez un titre accrocheur à votre annonce"}
          className={`text-lg ${formErrors.title ? 'border-red-500' : ''}`}
          maxLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.title.length}/100 caractères</p>
        <FormError message={formErrors.title} />
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Description <span className="text-red-500">*</span></Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={isJobCategory ? "Décrivez le poste, les responsabilités, les qualifications requises, etc." : "Décrivez votre article en détail. Incluez les caractéristiques clés, l'état et toute autre information pertinente."}
          rows={6}
          maxLength={2000}
          className={formErrors.description ? 'border-red-500' : ''}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.description.length}/2000 caractères</p>
        <FormError message={formErrors.description} />
        {onAIDescription && (
          <ListingHelper formData={formData} onApply={onAIDescription} />
        )}
      </div>

      {/* Photos */}
      <div>
        <Label className="block text-sm font-medium mb-1">
          {isDigitalCategory ? 'Image de présentation' : 'Photos'} <span className="text-red-500">*</span>
          <span className="text-xs font-normal text-gray-400 ml-2">max 10 · JPG/PNG · 5 Mo max</span>
        </Label>
        {isDigitalCategory && (
          <p className="text-xs text-gray-500 mb-2">Sert de couverture pour l'annonce — ce n'est pas le fichier vendu, il se télécharge juste en dessous.</p>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
          {(formData.images || []).map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={image.url} alt="aperçu" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {(formData.images || []).length < 10 && (
            <>
              <div
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-custom-green-400 transition-colors ${formErrors.images ? 'border-red-500' : 'border-gray-300'}`}
                onClick={() => (isNative ? chooseFromNativeGallery() : fileInputRef.current?.click())}
              >
                <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 text-center px-1">Ajouter</span>
              </div>
              {isNative && (
                <div
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-custom-green-400 transition-colors"
                  onClick={takeNativePhoto}
                >
                  <CameraIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 text-center px-1">Photo</span>
                </div>
              )}
              {!isNative && (
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              )}
            </>
          )}
        </div>

        <FormError message={formErrors.images} />
      </div>

      {/* Contenu numérique — uniquement pour la catégorie Produits numériques */}
      {isDigitalCategory && (
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Comment livrer le contenu ? <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectChange('digital_delivery_type', 'file')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors ${deliveryType === 'file' ? 'border-custom-green-500 bg-custom-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FileUp className={`w-4 h-4 shrink-0 ${deliveryType === 'file' ? 'text-custom-green-600' : 'text-gray-400'}`} />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Envoyer un fichier</span>
                  <span className="block text-xs text-gray-500">E-book, template, logiciel…</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectChange('digital_delivery_type', 'link')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors ${deliveryType === 'link' ? 'border-custom-green-500 bg-custom-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Link2 className={`w-4 h-4 shrink-0 ${deliveryType === 'link' ? 'text-custom-green-600' : 'text-gray-400'}`} />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Coller un lien</span>
                  <span className="block text-xs text-gray-500">Vidéo hébergée ailleurs (YouTube, Drive…)</span>
                </span>
              </button>
            </div>
          </div>

          {deliveryType === 'file' ? (
            <div>
              <Label className="block text-sm font-medium mb-1">
                Fichier à vendre <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">{MAX_DIGITAL_FILE_SIZE_MB} Mo max</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Envoyé une seule fois ici — l'acheteur le télécharge automatiquement une fois son paiement validé, via un lien sécurisé propre à sa commande.
              </p>

              {digitalFile ? (
                <div className="flex items-center gap-3 border border-custom-green-200 bg-custom-green-50 rounded-lg px-4 py-3">
                  <FileCheck2 className="w-5 h-5 text-custom-green-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{digitalFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(digitalFile.size)}</p>
                  </div>
                  <button type="button" onClick={() => onDigitalFileChange?.(null, null)} className="p-1 text-gray-400 hover:text-red-500 shrink-0">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer hover:border-custom-green-400 transition-colors ${formErrors.digitalFile ? 'border-red-500' : 'border-gray-300'}`}
                  onClick={() => digitalFileInputRef.current?.click()}
                >
                  <FileUp className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">Choisir le fichier à vendre</span>
                  <input ref={digitalFileInputRef} type="file" onChange={pickDigitalFile} className="hidden" />
                </div>
              )}
              <FormError message={formErrors.digitalFile} />
            </div>
          ) : (
            <div>
              <Label htmlFor="digital_external_url" className="block text-sm font-medium mb-1">
                Lien complet (privé) <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Le lien vers votre contenu complet (vidéo non répertoriée, dossier Drive privé…). Il n'est révélé à l'acheteur qu'une fois son paiement validé — gardez-le privé de votre côté.
              </p>
              <Input
                id="digital_external_url"
                name="digital_external_url"
                type="url"
                placeholder="https://..."
                value={formData.digital_external_url || ''}
                onChange={handleInputChange}
                className={formErrors.digitalExternalUrl ? 'border-red-500' : ''}
              />
              <FormError message={formErrors.digitalExternalUrl} />
            </div>
          )}

          <div>
            <Label htmlFor="preview_video_url" className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" /> Lien d'aperçu <span className="text-gray-400 font-normal">(optionnel)</span>
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Un extrait public (30 secondes suffisent) que <strong>tout le monde</strong> peut voir sur votre annonce, avant achat — ça rassure les acheteurs.
            </p>
            <Input
              id="preview_video_url"
              name="preview_video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.preview_video_url || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Step1BasicInfo;