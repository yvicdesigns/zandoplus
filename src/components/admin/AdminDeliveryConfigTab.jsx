import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Banknote, Package, MapPin, Plus, Loader2 } from 'lucide-react';

const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      enabled ? 'bg-green-500' : 'bg-gray-300'
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
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [newCity, setNewCity] = useState('');
  const [adding, setAdding] = useState(false);

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
      .insert({ city: name, zando_delivery_enabled: false, cod_enabled: false, seller_delivery_enabled: true, active: true });

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
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Livraisons par ville</h2>
        <p className="text-sm text-gray-400">
          Active ou désactive chaque mode de livraison selon les ressources disponibles dans chaque ville.
          Le retrait en boutique est toujours disponible.
        </p>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-400" /> Zando Delivery (livreurs Zando)</span>
        <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-orange-400" /> Paiement à la livraison (COD)</span>
        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-purple-400" /> Livraison vendeur (propre livreur)</span>
      </div>

      {/* Table des villes */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Ville</span>
          <span className="flex items-center gap-1 w-28 justify-center"><Truck className="w-3 h-3 text-blue-400" /> Zando Delivery</span>
          <span className="flex items-center gap-1 w-28 justify-center"><Banknote className="w-3 h-3 text-orange-400" /> COD</span>
          <span className="flex items-center gap-1 w-28 justify-center"><Package className="w-3 h-3 text-purple-400" /> Vendeur</span>
        </div>

        {cities.map((c, i) => (
          <div
            key={c.city}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${
              i < cities.length - 1 ? 'border-b border-gray-700/50' : ''
            }`}
          >
            <div>
              <p className="font-semibold text-white">{c.city}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {[
                  c.zando_delivery_enabled && 'Zando Delivery',
                  c.cod_enabled && 'COD',
                  c.seller_delivery_enabled && 'Livraison vendeur',
                  'Retrait boutique',
                ].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div className="w-28 flex justify-center">
              <Toggle
                enabled={c.zando_delivery_enabled}
                onChange={v => toggle(c.city, 'zando_delivery_enabled', v)}
                disabled={saving === `${c.city}-zando_delivery_enabled`}
              />
            </div>
            <div className="w-28 flex justify-center">
              <Toggle
                enabled={c.cod_enabled}
                onChange={v => toggle(c.city, 'cod_enabled', v)}
                disabled={saving === `${c.city}-cod_enabled`}
              />
            </div>
            <div className="w-28 flex justify-center">
              <Toggle
                enabled={c.seller_delivery_enabled}
                onChange={v => toggle(c.city, 'seller_delivery_enabled', v)}
                disabled={saving === `${c.city}-seller_delivery_enabled`}
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
