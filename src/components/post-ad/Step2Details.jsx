import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import FormError from './FormError';
import { conditions, currencies, categories, deliveryMethods } from './postAdConstants';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';

const Step2Details = ({ formData, formErrors, handleInputChange, handleSelectChange, handleRadioChange }) => {
  const isJobCategory = formData.category && categories[formData.category]?.type === 'job';
  const isServiceCategory = formData.category && categories[formData.category]?.type === 'service';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold mb-4">{isJobCategory ? "Détails du Poste" : "Détails et Prix"}</h2>
        <p className="text-gray-600">{isJobCategory ? "Renseignez le salaire et l'emplacement du poste." : "Renseignez le prix, l'état et l'emplacement."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="price">{isJobCategory ? "Salaire (Optionnel)" : `Prix ${!isJobCategory ? '*' : ''}`}</Label>
          <div className="flex space-x-2 mt-1">
            <Input
              id="price"
              name="price"
              type="number"
              placeholder={isJobCategory ? "Ex: 500000" : "Ex: 50000"}
              value={formData.price}
              onChange={handleInputChange}
              className={!isJobCategory && formErrors.price ? 'border-red-500' : ''}
              min="0"
            />
            <Select name="currency" value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!isJobCategory && <FormError message={formErrors.price} />}
          {isJobCategory && <p className="text-xs text-gray-500 mt-1">Indiquez un salaire mensuel ou annuel.</p>}
        </div>

        {!isJobCategory && (
          <div>
            <Label htmlFor="condition">État *</Label>
            <Select name="condition" value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
              <SelectTrigger id="condition" className={`mt-1 ${formErrors.condition ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionnez l'état de l'article" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormError message={formErrors.condition} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="location">Localisation *</Label>
          <Input
            id="location"
            name="location"
            placeholder="Ex: Brazzaville, Poto-Poto"
            value={formData.location}
            onChange={handleInputChange}
            className={`mt-1 ${formErrors.location ? 'border-red-500' : ''}`}
          />
          <FormError message={formErrors.location} />
        </div>
        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Pour être contacté par les acheteurs"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Optionnel. Sera sauvegardé sur votre profil.</p>
          <FormError message={formErrors.phone} />
        </div>
      </div>
      
      {!isJobCategory && !isServiceCategory && (
        <>
          <div>
            <Label htmlFor="quantity">Quantité en stock</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              placeholder="Laisser vide si article unique"
              value={formData.quantity}
              onChange={handleInputChange}
              className="mt-1"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Optionnel. Indiquez combien d'articles vous avez à vendre.</p>
            <FormError message={formErrors.quantity} />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label>Mode de livraison</Label>
            <RadioGroup name="delivery_method" value={formData.delivery_method} onValueChange={(value) => handleRadioChange('delivery_method', value)}>
              {deliveryMethods.map(method => (
                <div key={method.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value={method.value} id={method.value} className="mt-1"/>
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={method.value} className="font-bold cursor-pointer">
                      {method.label}
                    </Label>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" /> {method.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </>
      )}

      <div className="space-y-4 pt-4 border-t">
        {!isJobCategory && (
            <div className="flex items-center space-x-2">
            <Checkbox id="negotiable" name="negotiable" checked={formData.negotiable} onCheckedChange={(checked) => handleSelectChange('negotiable', checked)} />
            <Label htmlFor="negotiable" className="cursor-pointer">Le prix est négociable</Label>
            </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Checkbox id="is_urgent" name="is_urgent" checked={formData.is_urgent} onCheckedChange={(checked) => handleSelectChange('is_urgent', checked)} />
          <Label htmlFor="is_urgent" className="cursor-pointer">Marquer comme "Urgent"</Label>
        </div>
      </div>
    </motion.div>
  );
};

export default Step2Details;