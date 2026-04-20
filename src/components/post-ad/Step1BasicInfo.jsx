import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import FormError from './FormError';
import { Label } from '@/components/ui/label';

const Step1BasicInfo = ({ formData, handleInputChange, handleSelectChange, formErrors }) => {
  const { categories, categoriesMap } = useCategories();
  const selectedCategoryType = formData.category ? categoriesMap[formData.category]?.type : null;
  const isJobCategory = selectedCategoryType === 'job';
  
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
                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
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
              value={formData.subcategory}
              onValueChange={(value) => handleSelectChange('subcategory', value)}
            >
              <SelectTrigger className={isJobCategory && formErrors.subcategory ? 'border-red-500' : ''}>
                <SelectValue placeholder={isJobCategory ? "Sélectionnez un type de contrat" : "Sélectionnez une sous-catégorie"} />
              </SelectTrigger>
              <SelectContent>
                {categoriesMap[formData.category]?.subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </div>
    </motion.div>
  );
};

export default Step1BasicInfo;