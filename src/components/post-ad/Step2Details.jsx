import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import FormError from './FormError';
import { conditions, currencies, deliveryMethods } from './postAdConstants';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import PriceEstimator from '@/components/ai/PriceEstimator';

const Step2Details = ({ formData, formErrors, handleInputChange, handleSelectChange, handleRadioChange, onAIPrice }) => {
  const { categoriesMap } = useCategories();
  const isJobCategory = formData.category && categoriesMap[formData.category]?.type === 'job';
  const isServiceCategory = formData.category && categoriesMap[formData.category]?.type === 'service';

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
          {!isJobCategory && onAIPrice && (
            <PriceEstimator formData={formData} onApply={onAIPrice} />
          )}
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
            {formData.delivery_method === 'seller_delivery' && (
              <div className="mt-3 space-y-1">
                <Label htmlFor="delivery_fee">Frais de livraison (FCFA)</Label>
                <Input
                  id="delivery_fee"
                  name="delivery_fee"
                  type="number"
                  min="0"
                  placeholder="Ex: 1000"
                  value={formData.delivery_fee}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500">Montant que vous facturez pour livrer chez l'acheteur.</p>
                <FormError message={formErrors.delivery_fee} />
              </div>
            )}

            {formData.delivery_method !== 'pickup' && (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Checkbox
                  id="accepts_cash_on_delivery"
                  name="accepts_cash_on_delivery"
                  checked={!!formData.accepts_cash_on_delivery}
                  onCheckedChange={(checked) => handleSelectChange('accepts_cash_on_delivery', checked)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="accepts_cash_on_delivery" className="cursor-pointer font-semibold">
                    Accepter le paiement à la livraison 💵
                  </Label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Zando livre le produit et collecte le cash sur place. Vous recevez votre paiement après livraison (commission 7% + 1 500 FCFA frais Zando Delivery).
                  </p>
                </div>
              </div>
            )}
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
        
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl opacity-70">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-base">🔥</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-red-700">Boost Urgent</p>
            <p className="text-[11px] text-red-400">Disponible après publication — depuis votre espace vendeur.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Step2Details;