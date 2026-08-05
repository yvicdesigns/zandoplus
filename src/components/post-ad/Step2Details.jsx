import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import FormError from './FormError';
import { conditions, currencies } from './postAdConstants';
import { Info } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import PriceEstimator from '@/components/ai/PriceEstimator';
import { supabase } from '@/lib/customSupabaseClient';

const Step2Details = ({ formData, formErrors, handleInputChange, handleSelectChange, handleRadioChange, onAIPrice }) => {
  const { categoriesMap } = useCategories();
  const [cities, setCities] = useState([]);
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const initialized = useRef(false);

  // Fetch available cities from delivery_city_config
  useEffect(() => {
    supabase
      .from('delivery_city_config')
      .select('city')
      .order('city', { ascending: true })
      .then(({ data }) => {
        if (data) setCities(data.map(r => r.city));
      });
  }, []);

  // Parse formData.location into city + neighborhood once it's available (handles EditAd async load)
  useEffect(() => {
    if (initialized.current || !formData.location) return;
    initialized.current = true;
    const parts = formData.location.split(' - ');
    setSelectedCity(parts[0]?.trim() || '');
    setNeighborhood(parts.slice(1).join(' - ').trim() || '');
  }, [formData.location]);

  const updateLocation = (city, hood) => {
    const combined = hood.trim() ? `${city} - ${hood.trim()}` : city;
    handleSelectChange('location', combined);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    updateLocation(city, neighborhood);
  };

  const handleNeighborhoodChange = (e) => {
    const hood = e.target.value;
    setNeighborhood(hood);
    if (selectedCity) updateLocation(selectedCity, hood);
  };
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
        <div className="space-y-3">
          <div>
            <Label htmlFor="city">Ville *</Label>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger id="city" className={`mt-1 ${formErrors.location ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionnez votre ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormError message={formErrors.location} />
          </div>
          <div>
            <Label htmlFor="neighborhood">Quartier / Zone <span className="text-gray-400 font-normal">(optionnel)</span></Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              placeholder="Ex: Poto-Poto, Bacongo, Loandjili…"
              value={neighborhood}
              onChange={handleNeighborhoodChange}
              className="mt-1"
            />
          </div>
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

          <div className="space-y-3 pt-4 border-t">
            <Label>Modes de livraison proposés</Label>
            <p className="text-xs text-gray-500">Cochez tout ce que vous êtes prêt à offrir. L'administrateur décide ce qui est disponible dans votre ville.</p>

            {/* Zando Delivery — toujours actif, non modifiable */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg bg-green-50 border-green-200 opacity-80 cursor-not-allowed">
              <Checkbox checked={true} disabled className="mt-0.5" />
              <div>
                <Label className="font-bold text-green-800">Zando Delivery</Label>
                <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Activé par défaut sur toutes les annonces. L'admin décide si Zando est disponible dans votre ville.
                </p>
              </div>
            </div>

            {/* J'ai mon propre livreur */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <Checkbox
                id="offers_seller_delivery"
                checked={!!formData.offers_seller_delivery}
                onCheckedChange={(checked) => handleSelectChange('offers_seller_delivery', checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="offers_seller_delivery" className="font-bold cursor-pointer">J'ai mon propre livreur</Label>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Vous gérez la livraison vous-même avec votre propre livreur.
                </p>
                {formData.offers_seller_delivery && (
                  <div className="mt-2">
                    <Input
                      name="delivery_fee"
                      type="number"
                      min="0"
                      placeholder="Frais de livraison (FCFA)"
                      value={formData.delivery_fee}
                      onChange={handleInputChange}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Montant que vous facturez pour livrer chez l'acheteur.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Retrait en boutique */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <Checkbox
                id="offers_pickup"
                checked={!!formData.offers_pickup}
                onCheckedChange={(checked) => handleSelectChange('offers_pickup', checked)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="offers_pickup" className="font-bold cursor-pointer">Retrait en boutique / en personne</Label>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> L'acheteur vient récupérer la commande chez vous.
                </p>
              </div>
            </div>

            {/* COD — lié à Zando (toujours disponible) */}
            <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Checkbox
                id="accepts_cash_on_delivery"
                checked={!!formData.accepts_cash_on_delivery}
                onCheckedChange={(checked) => handleSelectChange('accepts_cash_on_delivery', checked)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="accepts_cash_on_delivery" className="cursor-pointer font-semibold">
                  Accepter le paiement à la livraison 💵
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Zando livre le produit et collecte le cash sur place. Commission 7% + 1 500 FCFA frais Zando Delivery.
                </p>
              </div>
            </div>

            {/* Livraison nationale */}
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="national_delivery"
                name="national_delivery"
                checked={!!formData.national_delivery}
                onCheckedChange={(checked) => handleSelectChange('national_delivery', checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="national_delivery" className="cursor-pointer font-semibold">
                  Livraison nationale 🚚
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Je peux envoyer ce produit dans d'autres villes (via La Poste, Chrono Express, etc.). L'acheteur et moi nous mettons d'accord sur le transporteur.
                </p>
                {formData.national_delivery && (
                  <div className="mt-2">
                    <Input
                      name="national_delivery_fee"
                      type="number"
                      min="0"
                      placeholder="Frais d'envoi (FCFA) — laisser vide si variable"
                      value={formData.national_delivery_fee}
                      onChange={handleInputChange}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-4 pt-4 border-t">
        {!isJobCategory && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="negotiable" name="negotiable" checked={formData.negotiable} onCheckedChange={(checked) => handleSelectChange('negotiable', checked)} />
              <Label htmlFor="negotiable" className="cursor-pointer">Le prix est négociable</Label>
            </div>
            {formData.negotiable && (
              <div className="ml-6 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <Label htmlFor="negotiated_price" className="text-sm font-semibold text-green-800">
                  Meilleur prix (FCFA)
                </Label>
                <Input
                  id="negotiated_price"
                  name="negotiated_price"
                  type="number"
                  min="0"
                  placeholder="Ex: 8000 (votre prix final accepté)"
                  value={formData.negotiated_price || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
                <p className="text-xs text-green-700">
                  Ce prix sera affiché aux acheteurs à côté du prix normal. Laissez vide si vous préférez négocier au cas par cas.
                </p>
              </div>
            )}
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