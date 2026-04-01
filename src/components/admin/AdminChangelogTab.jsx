import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminChangelogTab = () => {
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    release_date: new Date().toISOString().split('T')[0],
    is_published: false,
    changes: [{ type: 'feat', text: '' }]
  });

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    try {
      const { data, error } = await supabase
        .from('changelogs')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) throw error;
      setChangelogs(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les changelogs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChangeItemUpdate = (index, field, value) => {
    const newChanges = [...formData.changes];
    newChanges[index][field] = value;
    setFormData(prev => ({ ...prev, changes: newChanges }));
  };

  const addChangeItem = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, { type: 'feat', text: '' }]
    }));
  };

  const removeChangeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        version: formData.version,
        title: formData.title,
        description: formData.description,
        release_date: formData.release_date,
        is_published: formData.is_published,
        changes: formData.changes.filter(c => c.text.trim() !== '')
      };

      let error;
      if (editingLog) {
        const { error: updateError } = await supabase
          .from('changelogs')
          .update(payload)
          .eq('id', editingLog.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('changelogs')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Changelog ${editingLog ? 'mis à jour' : 'créé'} avec succès`,
        className: 'bg-green-500 text-white'
      });

      setIsDialogOpen(false);
      setEditingLog(null);
      resetForm();
      fetchChangelogs();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      version: '',
      title: '',
      description: '',
      release_date: new Date().toISOString().split('T')[0],
      is_published: false,
      changes: [{ type: 'feat', text: '' }]
    });
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      version: log.version,
      title: log.title,
      description: log.description || '',
      release_date: log.release_date,
      is_published: log.is_published,
      changes: log.changes && log.changes.length > 0 ? log.changes : [{ type: 'feat', text: '' }]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce changelog ?')) return;

    try {
      const { error } = await supabase.from('changelogs').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: 'Supprimé', description: 'Changelog supprimé avec succès' });
      fetchChangelogs();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  const togglePublish = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('changelogs').update({ is_published: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchChangelogs();
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Historique des versions</h2>
          <p className="text-gray-500">Gérez les mises à jour et le journal des modifications du site.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) {
             setEditingLog(null);
             resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLog ? 'Modifier la version' : 'Créer une nouvelle version'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Version (ex: v1.0.0)</label>
                  <Input 
                    name="version" 
                    value={formData.version} 
                    onChange={handleInputChange} 
                    placeholder="v1.0.0" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de sortie</label>
                  <Input 
                    type="date" 
                    name="release_date" 
                    value={formData.release_date} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Titre de la mise à jour</label>
                <Input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="Mise à jour majeure de l'interface" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optionnel)</label>
                <Textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Description générale..." 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium mb-2 block">Changements</label>
                {formData.changes.map((change, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={change.type}
                      onChange={(e) => handleChangeItemUpdate(index, 'type', e.target.value)}
                    >
                      <option value="feat">✨ Feature</option>
                      <option value="fix">🐛 Fix</option>
                      <option value="style">🎨 Style</option>
                      <option value="perf">⚡ Perf</option>
                      <option value="security">🔒 Security</option>
                    </select>
                    <Input
                      value={change.text}
                      onChange={(e) => handleChangeItemUpdate(index, 'text', e.target.value)}
                      placeholder="Détail du changement..."
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChangeItem(index)}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addChangeItem} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter un changement
                </Button>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <label htmlFor="is_published" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Publier immédiatement
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="gradient-bg">Sauvegarder</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Chargement...</p>
        ) : changelogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Aucun changelog trouvé. Créez-en un nouveau !
            </CardContent>
          </Card>
        ) : (
          changelogs.map((log) => (
            <Card key={log.id} className="relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.is_published ? "default" : "secondary"} className={log.is_published ? "bg-green-100 text-green-800" : ""}>
                        {log.version}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.release_date), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      {!log.is_published && <Badge variant="outline" className="text-xs">Brouillon</Badge>}
                    </div>
                    <CardTitle className="text-xl">{log.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(log.id, log.is_published)}>
                      {log.is_published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(log)}>
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                {log.description && <CardDescription>{log.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 mt-2">
                  {log.changes && log.changes.map((change, idx) => (
                    <li key={idx} className="text-sm flex gap-2 items-start">
                      <span className="inline-block w-6 text-center shrink-0">
                        {change.type === 'feat' && '✨'}
                        {change.type === 'fix' && '🐛'}
                        {change.type === 'style' && '🎨'}
                        {change.type === 'perf' && '⚡'}
                        {change.type === 'security' && '🔒'}
                      </span>
                      <span className="text-gray-700">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminChangelogTab;