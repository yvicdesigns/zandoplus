import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Camera, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormError from './FormError';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const Step3Photos = ({ formData, handleImageUpload, removeImage, formErrors }) => {
  const { siteSettings } = useSiteSettings();
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  const goodExampleImageUrl = siteSettings?.good_example_image_url || 'https://images.unsplash.com/photo-1694179023466-cb438ce7ae0b';
  const badExampleImageUrl = siteSettings?.bad_example_image_url || 'https://images.unsplash.com/photo-1505308088817-f1e3cb2a2f63';

  const triggerFileInput = (ref) => {
    ref.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold mb-4">Télécharger des Photos</h2>
        <p className="text-gray-600 mb-6">Ajoutez des photos de haute qualité pour attirer plus d'acheteurs (max 10 photos)</p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg flex items-start space-x-3 mb-6">
        <Info className="w-5 h-5 flex-shrink-0 mt-1" />
        <div>
          <p className="font-semibold">Conseil important pour vos photos :</p>
          <p className="text-sm">
            Pour garantir la meilleure qualité et protéger vos images, Zando+ ajoute automatiquement son propre logo (watermark) sur toutes les photos.
            Veuillez donc télécharger des images **originales, sans aucun filigrane, logo ou texte** provenant d'autres sources.
            Cela assure une présentation uniforme et professionnelle de votre annonce.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">✅ Bon exemple (Image sans filigrane)</p>
              <img src={goodExampleImageUrl} alt="Exemple d'une image de produit nette et claire, sans aucun texte ou logo superposé." className="w-full h-auto rounded-md shadow-sm" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">❌ Mauvais exemple (Image avec un filigrane)</p>
              <img src={badExampleImageUrl} alt="Exemple d'une image de produit sur laquelle un logo ou un texte de filigrane d'une autre marque est visible." className="w-full h-auto rounded-md shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {formData.images.map((image) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img src={image.url} alt="Aperçu du téléchargement" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => removeImage(image.id)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {formData.images.length < 10 && (
          <>
            <div
              className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-custom-green-400 transition-colors ${formErrors.images ? 'border-red-500' : 'border-gray-300'}`}
              onClick={() => triggerFileInput(fileInputRef1)}
            >
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Ajouter Photo</span>
            </div>
            <input ref={fileInputRef1} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
          </>
        )}
      </div>
      <FormError message={formErrors.images} />

      {formData.images.length === 0 && !formErrors.images && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Téléchargez votre première photo</h3>
          <p className="text-gray-500 mb-4">Glissez-déposez ou cliquez pour sélectionner des fichiers</p>
          <Button type="button" variant="outline" onClick={() => triggerFileInput(fileInputRef2)}>Choisir des Fichiers</Button>
          <input ref={fileInputRef2} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      )}
    </motion.div>
  );
};

export default Step3Photos;