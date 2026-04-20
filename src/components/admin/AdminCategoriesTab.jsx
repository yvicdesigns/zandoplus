import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const slugify = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

  // --- Categories ---
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

  // --- Subcategories ---
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
        <CardTitle>Catégories & Sous-catégories</CardTitle>
        <Button size="sm" className="gradient-bg" onClick={() => setAddingCat(true)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter une catégorie
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">

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
            {/* Header catégorie */}
            <div className="flex items-center gap-3 p-3 bg-gray-50">
              <button onClick={() => toggleExpand(cat.id)} className="text-gray-500">
                {expanded[cat.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {editingCat === cat.id ? (
                <div className="flex-1">
                  <InlineEdit
                    value={cat.name}
                    onSave={(v) => handleEditCategory(cat, v)}
                    onCancel={() => setEditingCat(null)}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cat.type]}`}>
                    {TYPE_LABELS[cat.type]}
                  </span>
                  <span className="text-xs text-gray-400">/{cat.slug}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {cat.subcategories?.length || 0} sous-cat.
                  </Badge>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
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

                {/* Form nouvelle sous-catégorie */}
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
          <p className="text-center text-gray-400 py-8">Aucune catégorie. Cliquez sur "Ajouter" pour commencer.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCategoriesTab;
