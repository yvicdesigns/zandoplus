import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, ImageIcon, GripVertical, Eye, EyeOff } from 'lucide-react';

const SIZES = [
  { value: 'sm', label: 'Petite' },
  { value: 'md', label: 'Moyenne' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Très grande' },
];

const IMAGE_SIZE_CLASS = { sm: 'w-[70px]', md: 'w-[100px]', lg: 'w-[130px]', xl: 'w-[160px]' };

/* ── Mini prévisualisation de carte ── */
const CardPreview = ({ card }) => {
  const imgLeft = card.image_position === 'left';
  const sizeW = IMAGE_SIZE_CLASS[card.image_size] || 'w-[100px]';
  return (
    <div
      className="rounded-2xl overflow-hidden flex items-center min-h-[110px] relative select-none"
      style={{ backgroundColor: card.bg_color }}
    >
      {imgLeft && card.image_url && (
        <div className={`${sizeW} flex-shrink-0 flex items-end justify-center self-stretch overflow-hidden`}>
          <img src={card.image_url} alt="" className="w-full h-auto object-contain object-bottom max-h-[130px]" onError={e => { e.currentTarget.style.display = 'none'; }} />
        </div>
      )}
      <div className="flex-1 px-4 py-4 z-10">
        <p className="text-[12px] font-black uppercase leading-tight mb-1" style={{ color: card.text_color }}>{card.title || 'Titre'}</p>
        <p className="text-[10px] leading-snug opacity-70 mb-2" style={{ color: card.text_color }}>{card.subtitle || 'Description'}</p>
        {card.btn_enabled && card.btn_text && (
          <span className="inline-block bg-white text-[10px] font-bold px-3 py-1 rounded-lg" style={{ color: card.bg_color }}>{card.btn_text}</span>
        )}
      </div>
      {!imgLeft && card.image_url && (
        <div className={`${sizeW} flex-shrink-0 flex items-end justify-center self-stretch overflow-hidden`}>
          <img src={card.image_url} alt="" className="w-full h-auto object-contain object-bottom max-h-[130px]" onError={e => { e.currentTarget.style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
};

/* ── Champ upload image ── */
const ImageField = ({ value, onChange, bucket = 'site_assets', prefix = 'home-cards/' }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(publicUrl);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="URL de l'image ou upload ci-dessous"
          className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <label className="flex items-center gap-1.5 bg-gray-900 text-white text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors whitespace-nowrap">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Upload…' : 'Uploader'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {value && (
        <div className="flex items-center gap-2">
          <img src={value} alt="" className="h-12 w-20 object-contain rounded border border-gray-100 bg-gray-50" onError={e => { e.currentTarget.style.display = 'none'; }} />
          <button onClick={() => onChange('')} className="text-[11px] text-red-500 hover:text-red-700">Supprimer</button>
        </div>
      )}
    </div>
  );
};

/* ── Éditeur d'une carte ── */
const CardEditor = ({ card, onChange, onToggle, saving }) => {
  const set = (field, val) => onChange({ ...card, [field]: val });

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${card.enabled ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-[13px] font-bold text-gray-800 flex-1 capitalize">{card.key}</span>
        <button
          onClick={() => onToggle(card.key, !card.enabled)}
          disabled={saving}
          className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${card.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
        >
          {card.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {card.enabled ? 'Visible' : 'Masquée'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Prévisualisation */}
        <CardPreview card={card} />

        <div className="grid grid-cols-2 gap-3">
          {/* Titre */}
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Titre</label>
            <input type="text" value={card.title} onChange={e => set('title', e.target.value)}
              className="w-full mt-1 text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
            <textarea value={card.subtitle} onChange={e => set('subtitle', e.target.value)} rows={2}
              className="w-full mt-1 text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          {/* Couleur de fond */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Couleur de fond</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={card.bg_color} onChange={e => set('bg_color', e.target.value)}
                className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
              <input type="text" value={card.bg_color} onChange={e => set('bg_color', e.target.value)}
                className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Couleur du texte */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Couleur du texte</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={card.text_color} onChange={e => set('text_color', e.target.value)}
                className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
              <input type="text" value={card.text_color} onChange={e => set('text_color', e.target.value)}
                className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Image</label>
          <div className="mt-1">
            <ImageField value={card.image_url} onChange={v => set('image_url', v)} />
          </div>
        </div>

        {card.image_url && (
          <div className="grid grid-cols-2 gap-3">
            {/* Position image */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Position image</label>
              <div className="flex gap-2 mt-1">
                {['left', 'right'].map(pos => (
                  <button key={pos} onClick={() => set('image_position', pos)}
                    className={`flex-1 py-2 text-[12px] font-semibold rounded-lg border transition-colors capitalize ${card.image_position === pos ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {pos === 'left' ? '← Gauche' : 'Droite →'}
                  </button>
                ))}
              </div>
            </div>

            {/* Taille image */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Taille image</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => set('image_size', s.value)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${card.image_size === s.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bouton */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bouton d'action</label>
            <button onClick={() => set('btn_enabled', !card.btn_enabled)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${card.btn_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {card.btn_enabled ? 'Activé' : 'Désactivé'}
            </button>
          </div>
          {card.btn_enabled && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={card.btn_text} onChange={e => set('btn_text', e.target.value)}
                placeholder="Texte du bouton"
                className="text-[12px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input type="text" value={card.btn_link} onChange={e => set('btn_link', e.target.value)}
                placeholder="/lien"
                className="text-[12px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Composant principal ── */
const AdminHomeCardsTab = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { toast } = useToast();

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('home_cards').select('*').order('order', { ascending: true });
    if (!error && data) setCards(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleChange = (key, updated) => {
    setCards(prev => prev.map(c => c.key === key ? updated : c));
  };

  const handleToggle = async (key, enabled) => {
    setCards(prev => prev.map(c => c.key === key ? { ...c, enabled } : c));
    await supabase.from('home_cards').update({ enabled }).eq('key', key);
  };

  const handleSave = async (card) => {
    setSaving(card.key);
    const { error } = await supabase.from('home_cards').update({
      enabled: card.enabled,
      title: card.title,
      subtitle: card.subtitle,
      bg_color: card.bg_color,
      text_color: card.text_color,
      image_url: card.image_url,
      image_position: card.image_position,
      image_size: card.image_size,
      btn_text: card.btn_text,
      btn_link: card.btn_link,
      btn_enabled: card.btn_enabled,
    }).eq('key', card.key);

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      toast({ title: 'Carte enregistrée', description: `La carte "${card.title}" a été mise à jour.`, className: 'bg-custom-green-500 text-white' });
    }
    setSaving(null);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-[16px] font-black text-gray-900">Cartes section mobile</h2>
        <p className="text-[13px] text-gray-500 mt-1">Ces 3 cartes s'affichent uniquement sur téléphone. Active, désactive ou modifie chaque carte indépendamment.</p>
      </div>

      {cards.map(card => (
        <div key={card.key}>
          <CardEditor
            card={card}
            onChange={(updated) => handleChange(card.key, updated)}
            onToggle={handleToggle}
            saving={saving === card.key}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => handleSave(card)}
              disabled={saving === card.key}
              className="flex items-center gap-2 bg-gray-900 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving === card.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminHomeCardsTab;
