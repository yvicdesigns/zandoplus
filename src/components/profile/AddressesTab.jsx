import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Home, Building2, MapPin, Pencil, Trash2, Loader2, Check } from 'lucide-react';

const LABEL_ICONS = { 'Maison': Home, 'Bureau': Building2, 'Autre': MapPin };

const AddressForm = ({ initial = {}, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    label:      initial.label      || 'Maison',
    full_name:  initial.full_name  || '',
    phone:      initial.phone      || '',
    street:     initial.street     || '',
    city:       initial.city       || 'Brazzaville',
    is_default: initial.is_default || false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-gray-50">
      {/* Type d'adresse */}
      <div className="flex gap-2">
        {['Maison', 'Bureau', 'Autre'].map(l => (
          <button
            key={l} type="button" onClick={() => set('label', l)}
            className={`flex-1 h-9 rounded-lg text-[12px] font-semibold border-2 transition-colors ${
              form.label === l
                ? 'border-custom-green-500 bg-green-50 text-custom-green-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
            }`}
          >{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nom complet</label>
          <input
            type="text" value={form.full_name} placeholder="Jean Dupont"
            onChange={e => set('full_name', e.target.value)}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Téléphone</label>
          <input
            type="tel" value={form.phone} placeholder="+242 06 000 00 00"
            onChange={e => set('phone', e.target.value)}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Adresse complète</label>
        <input
          type="text" value={form.street} placeholder="123, Avenue de la Paix, Centre-ville"
          onChange={e => set('street', e.target.value)}
          className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500 bg-white"
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ville</label>
        <input
          type="text" value={form.city} placeholder="Brazzaville"
          onChange={e => set('city', e.target.value)}
          className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500 bg-white"
        />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
        <input
          type="checkbox" checked={form.is_default}
          onChange={e => set('is_default', e.target.checked)}
          className="accent-custom-green-500 w-4 h-4"
        />
        Définir comme adresse par défaut
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={loading || !form.full_name || !form.street}
          className="flex-1 h-10 bg-custom-green-500 text-white rounded-lg text-[13px] font-bold hover:bg-custom-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Enregistrer
        </button>
        {onCancel && (
          <button onClick={onCancel}
            className="flex-1 h-10 border border-gray-200 bg-white text-gray-600 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

const AddressesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadAddresses(); }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    setAddresses(data || []);
    setLoading(false);
  };

  const handleAdd = async (form) => {
    setSavingId('new');
    try {
      if (form.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { error } = await supabase.from('user_addresses').insert({ ...form, user_id: user.id });
      if (error) throw error;
      setShowAddForm(false);
      await loadAddresses();
      toast({ title: 'Adresse ajoutée !', className: 'bg-custom-green-500 text-white' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = async (id, form) => {
    setSavingId(id);
    try {
      if (form.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { error } = await supabase.from('user_addresses').update(form).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      await loadAddresses();
      toast({ title: 'Adresse mise à jour !', className: 'bg-custom-green-500 text-white' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
      await loadAddresses();
      toast({ title: 'Adresse supprimée.' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
    await loadAddresses();
    toast({ title: 'Adresse par défaut mise à jour !', className: 'bg-custom-green-500 text-white' });
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Liste adresses */}
      {addresses.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-[14px] font-semibold text-gray-500">Aucune adresse enregistrée</p>
          <p className="text-[12px] text-gray-400 mt-1">Ajoutez une adresse pour accélérer vos prochaines commandes</p>
        </div>
      )}

      {addresses.map(addr => {
        const Icon = LABEL_ICONS[addr.label] || MapPin;
        const isEditing = editingId === addr.id;

        return (
          <div key={addr.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {!isEditing ? (
              <div className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-bold text-gray-900">{addr.label}</p>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold text-custom-green-600 bg-green-50 border border-custom-green-200 px-2 py-0.5 rounded-full">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-700">{addr.full_name}</p>
                  <p className="text-[12px] text-gray-500">{addr.street}</p>
                  <p className="text-[12px] text-gray-500">{addr.city}, République du Congo</p>
                  {addr.phone && <p className="text-[12px] text-gray-400 mt-0.5">{addr.phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(addr.id)}
                      className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-custom-green-600 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {deletingId === addr.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] text-custom-green-600 hover:underline"
                    >
                      Définir par défaut
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Modifier l'adresse</p>
                <AddressForm
                  initial={addr}
                  onSave={(form) => handleEdit(addr.id, form)}
                  onCancel={() => setEditingId(null)}
                  loading={savingId === addr.id}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Ajouter nouvelle adresse */}
      {showAddForm ? (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Nouvelle adresse</p>
          <AddressForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            loading={savingId === 'new'}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 h-12 border-2 border-dashed border-gray-200 rounded-xl text-[13px] font-semibold text-custom-green-600 hover:border-custom-green-400 hover:bg-green-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une adresse
        </button>
      )}
    </div>
  );
};

export default AddressesTab;
