import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, Trash2, Search, Heart, MessageCircle, Rss, ExternalLink, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ConfirmActionDialog from '@/components/admin/ConfirmActionDialog';
import { Skeleton } from '@/components/ui/skeleton';

// Zando Social — onglet admin de modération des publications, sur le modèle
// exact d'AdminListingsTab.jsx (mêmes statuts, mêmes RPC admin_*, même
// disposition). Voir supabase_migration_social_commerce_admin.sql pour les
// RPC utilisées ici (admin_approve_post / admin_request_post_changes /
// admin_delete_post) — jamais d'UPDATE/DELETE direct sur la table.

// Bascule du feature flag, sur le modèle exact de HeroV2ToggleCard dans
// AdminHeroTab.jsx (requête isolée sur site_settings, échoue silencieusement
// si la colonne n'existe pas encore plutôt que de casser tout l'onglet).
const SocialCommerceToggleCard = () => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnMissing, setColumnMissing] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('social_commerce_enabled').eq('id', 1).single()
      .then(({ data, error }) => {
        if (error) { setColumnMissing(true); return; }
        setEnabled(!!data?.social_commerce_enabled);
      });
  }, []);

  const toggle = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('site_settings').update({ social_commerce_enabled: !enabled }).eq('id', 1).select('social_commerce_enabled');
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else if (!data || data.length === 0) {
      toast({ variant: 'destructive', title: 'Non enregistré', description: "La base de données a refusé la modification (droits insuffisants sur ton compte). Aucun changement n'a été appliqué." });
    } else {
      setEnabled(!!data[0].social_commerce_enabled);
    }
    setSaving(false);
  };

  if (columnMissing) {
    return (
      <Card className="border-amber-200 bg-amber-50/40 mb-4">
        <CardContent className="pt-5 text-[12px] text-amber-800">
          ⚠️ La colonne <code>social_commerce_enabled</code> n'existe pas encore sur <code>site_settings</code>.
          Lance <code>supabase_migration_social_commerce_phase1.sql</code> pour activer cette bascule.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-custom-green-200 bg-custom-green-50/40 mb-4">
      <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <Rss className="w-5 h-5 text-custom-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Fil Zando Social (/social)</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {enabled
                ? 'Actif — tout le monde voit le fil de publications.'
                : "Désactivé — le fil n'est visible pour personne. Toi seul peux le prévisualiser via le lien ci-contre."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="/social?feedPreview=1" target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-custom-green-700 hover:underline flex items-center gap-1">
            Aperçu en situation réelle <ExternalLink className="w-3 h-3" />
          </a>
          <Button size="sm" variant={enabled ? 'default' : 'outline'} onClick={toggle} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (enabled ? 'Activé pour tous' : 'Activer pour tous')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const STATUS_LABELS = {
  pending_review: 'À vérifier', needs_changes: 'Modif. demandées', active: 'Active', rejected: 'Rejetée', archived: 'Archivée', draft: 'Brouillon',
};
const STATUS_COLORS = {
  pending_review: 'bg-amber-100 text-amber-800 border-amber-300',
  needs_changes: 'bg-orange-100 text-orange-800 border-orange-300',
  active: 'bg-green-100 text-green-800',
};

const AdminPostsTab = memo(() => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [loadingAction, setLoadingAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, postId: null, reason: '' });
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, caption, media_urls, status, likes_count, comments_count, created_at, author:profiles(full_name)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleApprove = async (postId) => {
    setLoadingAction(postId);
    const { error } = await supabase.rpc('admin_approve_post', { p_post_id: postId });
    setLoadingAction(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Publication approuvée', className: 'bg-green-100 text-green-800' });
    fetchPosts();
  };

  const handleRequestChanges = async () => {
    if (!rejectDialog.postId) return;
    setLoadingAction(rejectDialog.postId);
    const { error } = await supabase.rpc('admin_request_post_changes', { p_post_id: rejectDialog.postId, p_reason: rejectDialog.reason });
    setLoadingAction(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Modifications demandées', className: 'bg-amber-100 text-amber-800' });
    setRejectDialog({ isOpen: false, postId: null, reason: '' });
    fetchPosts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoadingAction(deleteTarget.id);
    const { error } = await supabase.rpc('admin_delete_post', { p_post_id: deleteTarget.id });
    setLoadingAction(null);
    setDeleteTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Publication supprimée.' });
    fetchPosts();
  };

  const counts = useMemo(() => ({
    all: posts.length,
    pending_review: posts.filter(p => p.status === 'pending_review').length,
    needs_changes: posts.filter(p => p.status === 'needs_changes').length,
    active: posts.filter(p => p.status === 'active').length,
  }), [posts]);

  const filtered = useMemo(() => posts.filter(p => {
    const matchSearch = p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || p.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  }), [posts, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SocialCommerceToggleCard />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <SocialCommerceToggleCard />
        <div className="relative mb-4 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Légende ou auteur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {[
            { value: 'pending_review', label: `À vérifier${counts.pending_review ? ` (${counts.pending_review})` : ''}` },
            { value: 'needs_changes', label: `Modif. demandées${counts.needs_changes ? ` (${counts.needs_changes})` : ''}` },
            { value: 'active', label: `Actives (${counts.active})` },
            { value: 'all', label: `Toutes (${counts.all})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                statusFilter === f.value ? 'bg-custom-green-600 text-white border-custom-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-custom-green-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                <Card className="border shadow-sm">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-2 flex items-center gap-4">
                      <img src={post.media_urls?.[0] || 'https://via.placeholder.com/80'} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <div>
                        <p className="font-semibold text-gray-800 line-clamp-1">{post.caption || <span className="text-gray-400 italic">Sans légende</span>}</p>
                        <p className="text-sm text-gray-500">Par : {post.author?.full_name || 'Inconnu'}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[post.status] || post.status}
                      </span>
                      <p className="flex items-center gap-3 text-xs text-gray-400 pt-1">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-self-start md:justify-self-end">
                      {(post.status === 'pending_review' || post.status === 'needs_changes') && (
                        <Button size="sm" onClick={() => handleApprove(post.id)} disabled={loadingAction === post.id} className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Approuver
                        </Button>
                      )}
                      {post.status === 'pending_review' && (
                        <Button size="sm" variant="outline" onClick={() => setRejectDialog({ isOpen: true, postId: post.id, reason: '' })} disabled={loadingAction === post.id} className="border-amber-400 text-amber-700 hover:bg-amber-50 h-8 px-3 text-xs gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Modif.
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 bg-red-50 h-8 w-8" onClick={() => setDeleteTarget(post)} disabled={loadingAction === post.id}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl font-semibold text-gray-700">Aucune publication trouvée</p>
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la publication"
        description={`Êtes-vous sûr de vouloir supprimer cette publication ?`}
      />

      <Dialog open={rejectDialog.isOpen} onOpenChange={(open) => !open && setRejectDialog({ isOpen: false, postId: null, reason: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Demander des modifications</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Expliquez à l'auteur ce qu'il doit corriger :</p>
          <Textarea
            placeholder="Ex: La photo est floue, merci d'en ajouter une plus nette."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ isOpen: false, postId: null, reason: '' })}>Annuler</Button>
            <Button onClick={handleRequestChanges} disabled={!rejectDialog.reason.trim() || loadingAction === rejectDialog.postId} className="bg-amber-500 hover:bg-amber-600 text-white">
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminPostsTab;
