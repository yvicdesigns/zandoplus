import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Check, X, Camera, ImageOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getCategoryEmoji } from '@/components/post-ad/categoryIcons';

const slugify = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const TYPE_LABELS = { product: 'Produit', job: 'Emploi', service: 'Service' };
const TYPE_COLORS = { product: 'bg-blue-100 text-blue-700', job: 'bg-purple-100 text-purple-700', service: 'bg-yellow-100 text-yellow-700' };

const InlineEdit = ({ value, onSave, onCancel }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <Input value={val} onChange={e => setVal(e.target.value)} className="h-7 text-sm" autoFocus />
      <button onClick={() => onSave(val)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
};

/* ── Vignette photo d'une catégorie ── */
const CategoryPhoto = ({ cat, onUpdated }) => {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Supprimer l'ancienne photo si elle existe dans site_assets
      if (cat.image_url?.includes('site_assets')) {
        const oldPath = cat.image_url.split('/site_assets/')[1];
        if (oldPath) await supabase.storage.from('site_assets').remove([oldPath]);
      }

      const ext = file.name.split('.').pop();
      const filePath = `categories/${cat.slug}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('site_assets')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('categories')
        .update({ image_url: imageUrl })
        .eq('id', cat.id);
      if (dbError) throw dbError;

      toast({ title: 'Photo mise à jour !', className: 'bg-custom-green-500 text-white' });
      onUpdated();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!cat.image_url) return;
    try {
      if (cat.image_url.includes('site_assets')) {
        const oldPath = cat.image_url.split('/site_assets/')[1];
        if (oldPath) await supabase.storage.from('site_assets').remove([oldPath]);
      }
      const { error } = await supabase.from('categories').update({ image_url: null }).eq('id', cat.id);
      if (error) throw error;
      toast({ title: 'Photo supprimée', className: 'bg-custom-green-500 text-white' });
      onUpdated();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-[52px] h-[52px] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-custom-green-500 transition-colors relative group bg-gray-50 flex items-center justify-center"
        title="Changer la photo"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-custom-green-500" />
        ) : cat.image_url ? (
          <>
            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <>
            <span className="text-2xl">{getCategoryEmoji(cat.slug)}</span>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </>
        )}
      </button>
      {cat.image_url && (
        <button
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Supprimer la photo"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}
    </div>
  );
};

const AdminCategoriesTab = () => {
  const { categories, loading, refetch } = useCategories();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState({});
  const [editingCat, setEditingCat] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [addingSub, setAddingSub] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', type: 'product' });
  const [newSubName, setNewSubName] = useState('');

  const ok = (msg) => toast({ title: msg, className: 'bg-custom-green-500 text-white' });
  const err = (msg) => toast({ title: 'Erreur', description: msg, variant: 'destructive' });

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) return;
    const slug = slugify(newCat.name);
    const { error } = await supabase.from('categories').insert({
      slug, name: newCat.name.trim(), type: newCat.type,
      display_order: categories.length + 1,
    });
    if (error) return err(error.message);
    ok('Catégorie ajoutée');
    setAddingCat(false);
    setNewCat({ name: '', type: 'product' });
    refetch();
  };

  const handleEditCategory = async (cat, newName) => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('categories').update({ name: newName.trim() }).eq('id', cat.id);
    if (error) return err(error.message);
    ok('Catégorie mise à jour');
    setEditingCat(null);
    refetch();
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Supprimer "${cat.name}" et toutes ses sous-catégories ?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) return err(error.message);
    ok('Catégorie supprimée');
    refetch();
  };

  const handleAddSub = async (categoryId) => {
    if (!newSubName.trim()) return;
    const subs = categories.find(c => c.id === categoryId)?.subcategories || [];
    const { error } = await supabase.from('subcategories').insert({
      category_id: categoryId, name: newSubName.trim(),
      display_order: subs.length + 1,
    });
    if (error) return err(error.message);
    ok('Sous-catégorie ajoutée');
    setAddingSub(null);
    setNewSubName('');
    refetch();
  };

  const handleEditSub = async (sub, newName) => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('subcategories').update({ name: newName.trim() }).eq('id', sub.id);
    if (error) return err(error.message);
    ok('Sous-catégorie mise à jour');
    setEditingSub(null);
    refetch();
  };

  const handleDeleteSub = async (sub) => {
    if (!confirm(`Supprimer "${sub.name}" ?`)) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', sub.id);
    if (error) return err(error.message);
    ok('Sous-catégorie supprimée');
    refetch();
  };

  if (loading) return (
    <Card><CardContent className="flex justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Catégories & Sous-catégories</CardTitle>
          <p className="text-[12px] text-gray-400 mt-1">Cliquez sur la vignette pour changer la photo d'une catégorie</p>
        </div>
        <Button size="sm" className="gradient-bg" onClick={() => setAddingCat(true)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Migration SQL */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 mb-4">
          <p className="font-bold mb-1">⚠️ Migration SQL requise pour les photos :</p>
          <code className="bg-white border border-amber-100 rounded px-2 py-1 block">
            ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
          </code>
        </div>

        {/* Form nouvelle catégorie */}
        {addingCat && (
          <div className="border-2 border-dashed border-custom-green-400 rounded-xl p-4 space-y-3 bg-green-50">
            <p className="text-sm font-semibold text-gray-700">Nouvelle catégorie</p>
            <Input
              placeholder="Nom (ex: Maison & Jardin)"
              value={newCat.name}
              onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
              autoFocus
            />
            <Select value={newCat.type} onValueChange={v => setNewCat(p => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Produit</SelectItem>
                <SelectItem value="job">Emploi</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" className="gradient-bg" onClick={handleAddCategory}>Ajouter</Button>
              <Button size="sm" variant="outline" onClick={() => { setAddingCat(false); setNewCat({ name: '', type: 'product' }); }}>Annuler</Button>
            </div>
          </div>
        )}

        {/* Liste des catégories */}
        {categories.map(cat => (
          <div key={cat.id} className="border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-3 bg-gray-50">
              {/* Bouton expand */}
              <button onClick={() => toggleExpand(cat.id)} className="text-gray-500 shrink-0">
                {expanded[cat.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* ── Photo ── */}
              <CategoryPhoto cat={cat} onUpdated={refetch} />

              {/* Nom / édition inline */}
              {editingCat === cat.id ? (
                <div className="flex-1">
                  <InlineEdit
                    value={cat.name}
                    onSave={(v) => handleEditCategory(cat, v)}
                    onCancel={() => setEditingCat(null)}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-800 truncate">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[cat.type]}`}>
                    {TYPE_LABELS[cat.type]}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline shrink-0">/{cat.slug}</span>
                  {cat.image_url && (
                    <span className="text-[10px] text-custom-green-600 font-semibold shrink-0 bg-green-50 px-1.5 py-0.5 rounded">
                      📷 photo
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-500 ml-auto shrink-0 whitespace-nowrap">
                    {cat.subcategories?.length || 0} s.cat.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <button onClick={() => setEditingCat(cat.id)} className="p-1 text-gray-400 hover:text-blue-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sous-catégories */}
            {expanded[cat.id] && (
              <div className="p-3 space-y-2 bg-white">
                {(cat.subcategories || []).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 pl-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    {editingSub === sub.id ? (
                      <div className="flex-1">
                        <InlineEdit
                          value={sub.name}
                          onSave={(v) => handleEditSub(sub, v)}
                          onCancel={() => setEditingSub(null)}
                        />
                      </div>
                    ) : (
                      <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                    )}
                    <button onClick={() => setEditingSub(sub.id)} className="p-1 text-gray-300 hover:text-blue-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteSub(sub)} className="p-1 text-gray-300 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {addingSub === cat.id ? (
                  <div className="flex items-center gap-2 pl-4 mt-2">
                    <Input
                      placeholder="Nom de la sous-catégorie"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddSub(cat.id)}
                    />
                    <button onClick={() => handleAddSub(cat.id)} className="text-green-600 hover:text-green-700">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setAddingSub(null); setNewSubName(''); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingSub(cat.id); setExpanded(p => ({ ...p, [cat.id]: true })); }}
                    className="flex items-center gap-1 pl-4 text-xs text-custom-green-600 hover:text-custom-green-700 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une sous-catégorie
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-center text-gray-400 py-8">Aucune catégorie.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCategoriesTab;
