import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Search, Link as LinkIcon, Loader2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  active:   'bg-green-100 text-green-800',
  expired:  'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  pending: 'En attente', active: 'Actif', expired: 'Expiré', rejected: 'Rejeté',
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'N/A';

const AdminBoostsTab = memo(() => {
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useToast();

  const fetchBoosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ad_boosts')
      .select(`
        id, statut, montant, date_debut, date_fin, preuve_paiement_url, created_at,
        annonce:annonce_id(id, title, images),
        user:user_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setBoosts(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchBoosts(); }, [fetchBoosts]);

  const handleActivate = async (boost) => {
    setLoadingAction({ id: boost.id, type: 'toggle' });
    const isActivating = boost.statut !== 'active';
    const now = new Date();
    const dateFin = new Date(now);
    dateFin.setDate(dateFin.getDate() + 7);

    const updates = isActivating
      ? { statut: 'active', date_debut: now.toISOString(), date_fin: dateFin.toISOString() }
      : { statut: 'pending', date_debut: null, date_fin: null };

    const { error } = await supabase.from('ad_boosts').update(updates).eq('id', boost.id);
    setLoadingAction(null);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    if (isActivating) {
      await supabase.from('listings').update({ is_boosted: true }).eq('id', boost.annonce?.id);
    } else {
      await supabase.from('listings').update({ is_boosted: false }).eq('id', boost.annonce?.id);
    }

    toast({ title: 'Succès', description: `Boost ${isActivating ? 'activé' : 'désactivé'} avec succès.` });
    fetchBoosts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoadingAction({ id: deleteTarget.id, type: 'delete' });
    const { error } = await supabase.from('ad_boosts').delete().eq('id', deleteTarget.id);
    setLoadingAction(null);
    setDeleteTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Boost supprimé.' });
    fetchBoosts();
  };

  const filtered = useMemo(() =>
    boosts.filter(b =>
      b.annonce?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [boosts, searchQuery]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Rechercher par annonce ou vendeur..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((boost, i) => (
              <motion.div
                key={boost.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Listing info */}
                    <div className="md:col-span-2 flex items-center gap-4">
                      <img
                        src={boost.annonce?.images?.[0] || 'https://via.placeholder.com/80'}
                        alt={boost.annonce?.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <Link
                          to={`/listings/${boost.annonce?.id}`}
                          className="font-semibold text-gray-800 hover:text-custom-green-600 transition-colors line-clamp-1"
                        >
                          {boost.annonce?.title || 'Annonce supprimée'}
                        </Link>
                        <p className="text-sm text-gray-500">Vendeur : {boost.user?.full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">Créé le {formatDate(boost.created_at)}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>Montant : <span className="font-semibold text-amber-700">{boost.montant?.toLocaleString()} FCFA</span></p>
                      {boost.date_fin && <p>Expire : {formatDate(boost.date_fin)}</p>}
                    </div>

                    {/* Status + proof */}
                    <div className="text-sm space-y-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[boost.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[boost.statut] || boost.statut}
                      </span>
                      {boost.preuve_paiement_url && (
                        <a
                          href={boost.preuve_paiement_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-custom-green-600 hover:underline text-xs"
                        >
                          <LinkIcon className="w-3 h-3" /> Preuve de paiement
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
                      <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
                        <Switch
                          checked={boost.statut === 'active'}
                          onCheckedChange={() => handleActivate(boost)}
                          disabled={!!loadingAction || boost.statut === 'rejected'}
                        />
                        <span className="text-sm font-medium">
                          {boost.statut === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 bg-red-50"
                        onClick={() => setDeleteTarget(boost)}
                        disabled={!!loadingAction}
                      >
                        {loadingAction?.id === boost.id && loadingAction?.type === 'delete'
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
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
            <Zap className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700">Aucun boost trouvé</p>
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le boost</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce boost pour "{deleteTarget?.annonce?.title}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!loadingAction}>
              {loadingAction?.type === 'delete' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminBoostsTab;
