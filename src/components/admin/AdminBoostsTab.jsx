import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Search, Link as LinkIcon, Loader2, Trash2, MessageCircle, AlertCircle } from 'lucide-react';
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
        user:user_id(full_name, whatsapp_number)
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

    const isUrgent = boost.boost_type === 'urgent';
    if (isActivating) {
      await supabase.from('listings').update({
        is_boosted: true,
        ...(isUrgent ? { is_urgent: true } : {}),
      }).eq('id', boost.annonce?.id);
    } else {
      await supabase.from('listings').update({
        is_boosted: false,
        ...(isUrgent ? { is_urgent: false } : {}),
      }).eq('id', boost.annonce?.id);
    }

    toast({ title: 'Succès', description: `Boost ${isActivating ? 'activé' : 'désactivé'} avec succès.` });
    fetchBoosts();
  };

  const openWhatsApp = (boost, type) => {
    const raw = boost.user?.whatsapp_number || '';
    const phone = raw.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
    if (!phone) {
      toast({ title: 'Pas de numéro WhatsApp', description: `${boost.user?.full_name || 'Ce vendeur'} n'a pas encore enregistré son numéro WhatsApp.`, variant: 'destructive' });
      return;
    }
    const name    = boost.user?.full_name || 'Vendeur';
    const titre   = boost.annonce?.title  || 'votre annonce';
    const montant = boost.montant?.toLocaleString('fr-FR') || '—';
    const debut   = boost.date_debut ? new Date(boost.date_debut).toLocaleDateString('fr-FR') : 'aujourd\'hui';
    const fin     = boost.date_fin   ? new Date(boost.date_fin).toLocaleDateString('fr-FR')   : '—';

    const msgConfirm =
      `Bonjour ${name} ! 👋\n\n` +
      `✅ Nous avons bien reçu votre boost pour l'annonce *${titre}*.\n\n` +
      `💰 Montant reçu : ${montant} FCFA\n` +
      `📅 Début : ${debut}\n` +
      `📅 Fin estimée : ${fin}\n\n` +
      `Votre annonce est maintenant mise en avant sur Zando+ ! Merci de votre confiance. 🙏\n\n` +
      `— L'équipe Zando+`;

    const msgDispute =
      `Bonjour ${name} ! 👋\n\n` +
      `⚠️ Nous avons bien reçu votre demande de boost pour l'annonce *${titre}* (montant : ${montant} FCFA).\n\n` +
      `Cependant, nous n'avons pas encore reçu le paiement correspondant.\n\n` +
      `Merci de nous envoyer votre preuve de paiement ou de nous contacter pour régulariser la situation.\n\n` +
      `— L'équipe Zando+`;

    const text = encodeURIComponent(type === 'confirm' ? msgConfirm : msgDispute);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
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
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        {boost.boost_type === 'urgent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                            🔥 Urgent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            ⚡ Simple
                          </span>
                        )}
                      </div>
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
                      {boost.user?.whatsapp_number ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-green-500" />
                          {boost.user.whatsapp_number}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Pas de WhatsApp
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 justify-self-start md:justify-self-end">
                      {/* WhatsApp buttons */}
                      <button
                        onClick={() => openWhatsApp(boost, 'confirm')}
                        title="Confirmer le paiement par WhatsApp"
                        className="flex items-center gap-1.5 px-3 h-8 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-[11px] font-bold rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Confirmer
                      </button>
                      <button
                        onClick={() => openWhatsApp(boost, 'dispute')}
                        title="Signaler un problème de paiement par WhatsApp"
                        className="flex items-center gap-1.5 px-3 h-8 bg-orange-50 hover:bg-orange-100 text-orange-600 text-[11px] font-bold rounded-lg border border-orange-200 transition-colors"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Dispute
                      </button>
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
