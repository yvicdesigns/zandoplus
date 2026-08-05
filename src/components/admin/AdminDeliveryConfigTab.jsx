import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Banknote, Package, MapPin, Plus, Loader2, Save } from 'lucide-react';

const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      enabled ? 'bg-custom-green-500' : 'bg-gray-300'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const AdminDeliveryConfigTab = () => {
  const { toast } = useToast();
  const { siteSettings, updateSiteSettings } = useSiteSettings();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [newCity, setNewCity] = useState('');
  const [adding, setAdding] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    if (siteSettings?.zando_delivery_fee !== undefined) {
      setDeliveryFee(String(siteSettings.zando_delivery_fee));
    }
  }, [siteSettings?.zando_delivery_fee]);

  const saveDeliveryFee = async () => {
    const fee = parseInt(deliveryFee, 10);
    if (isNaN(fee) || fee < 0) {
      toast({ title: 'Valeur invalide', description: 'Entrez un montant positif.', variant: 'destructive' });
      return;
    }
    setSavingFee(true);
    await updateSiteSettings({ zando_delivery_fee: fee });
    setSavingFee(false);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from('delivery_city_config')
      .select('*')
      .order('city');
    if (data) setCities(data);
    setLoading(false);
  };

  useEffect(() => { fetchCities(); }, []);

  const toggle = async (city, field, value) => {
    setSaving(`${city}-${field}`);
    const { error } = await supabase
      .from('delivery_city_config')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('city', city);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setCities(prev => prev.map(c => c.city === city ? { ...c, [field]: value } : c));
      toast({ title: `${city} mis à jour`, className: 'bg-green-100 text-green-800' });
    }
    setSaving(null);
  };

  const addCity = async () => {
    const name = newCity.trim();
    if (!name) return;
    setAdding(true);
    const { error } = await supabase
      .from('delivery_city_config')
      .insert({ city: name, zando_delivery_enabled: false, cod_enabled: false, seller_delivery_enabled: false, pickup_enabled: false, active: true });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setNewCity('');
      await fetchCities();
      toast({ title: `${name} ajoutée`, description: 'Tous les modes de livraison sont désactivés par défaut.' });
    }
    setAdding(false);
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Prix Zando Delivery ── */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
        <h3 className="text-[15px] font-bold text-white mb-1 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-400" /> Prix Zando Delivery
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Frais de livraison facturés par vendeur. S'applique à toutes les commandes Zando+.
        </p>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Input
              type="number"
              min="0"
              value={deliveryFee}
              onChange={e => setDeliveryFee(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white pr-16"
              placeholder="1500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">FCFA</span>
          </div>
          <Button
            onClick={saveDeliveryFee}
            disabled={savingFee}
            className="bg-custom-green-600 hover:bg-custom-green-700 text-white gap-2"
          >
            {savingFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-1">Livraisons par ville</h2>
        <p className="text-sm text-gray-400">
          Active ou désactive chaque mode de livraison selon les ressources disponibles dans chaque ville.
        </p>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-400" /> Zando Delivery (livreurs Zando)</span>
        <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-orange-400" /> Paiement à la livraison (COD)</span>
        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-purple-400" /> Livraison vendeur (propre livreur)</span>
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-green-400" /> Retrait en personne</span>
      </div>

      {/* Table des villes */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Ville</span>
          <span className="flex items-center gap-1 w-24 justify-center"><Truck className="w-3 h-3 text-blue-400" /> Zando</span>
          <span className="flex items-center gap-1 w-24 justify-center"><Banknote className="w-3 h-3 text-orange-400" /> COD</span>
          <span className="flex items-center gap-1 w-24 justify-center"><Package className="w-3 h-3 text-purple-400" /> Vendeur</span>
          <span className="flex items-center gap-1 w-24 justify-center"><MapPin className="w-3 h-3 text-green-400" /> Retrait</span>
        </div>

        {cities.map((c, i) => (
          <div
            key={c.city}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 ${
              i < cities.length - 1 ? 'border-b border-gray-700/50' : ''
            }`}
          >
            <div>
              <p className="font-semibold text-white">{c.city}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {[
                  c.zando_delivery_enabled && 'Zando',
                  c.cod_enabled && 'COD',
                  c.seller_delivery_enabled && 'Vendeur',
                  c.pickup_enabled && 'Retrait',
                ].filter(Boolean).join(' · ') || 'Aucun mode actif'}
              </p>
            </div>

            <div className="w-24 flex justify-center">
              <Toggle
                enabled={c.zando_delivery_enabled}
                onChange={v => toggle(c.city, 'zando_delivery_enabled', v)}
                disabled={saving === `${c.city}-zando_delivery_enabled`}
              />
            </div>
            <div className="w-24 flex justify-center">
              <Toggle
                enabled={c.cod_enabled}
                onChange={v => toggle(c.city, 'cod_enabled', v)}
                disabled={saving === `${c.city}-cod_enabled`}
              />
            </div>
            <div className="w-24 flex justify-center">
              <Toggle
                enabled={c.seller_delivery_enabled}
                onChange={v => toggle(c.city, 'seller_delivery_enabled', v)}
                disabled={saving === `${c.city}-seller_delivery_enabled`}
              />
            </div>
            <div className="w-24 flex justify-center">
              <Toggle
                enabled={!!c.pickup_enabled}
                onChange={v => toggle(c.city, 'pickup_enabled', v)}
                disabled={saving === `${c.city}-pickup_enabled`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ajouter une ville */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter une ville
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Nkayi, Ouesso..."
            value={newCity}
            onChange={e => setNewCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCity()}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={addCity}
            disabled={adding || !newCity.trim()}
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tous les modes de livraison sont désactivés par défaut pour une nouvelle ville.
        </p>
      </div>
    </div>
  );
};

export default AdminDeliveryConfigTab;
