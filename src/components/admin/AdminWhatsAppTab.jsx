import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, UserX, ShoppingBag, CheckCircle, Loader2,
  CalendarClock, Clock, Zap, RefreshCw, Play, ExternalLink,
  MessageCircle, AlertTriangle,
} from 'lucide-react';

const SEGMENTS = [
  { id: 'all',          label: 'Tous les utilisateurs', icon: Users,       description: 'Tous ceux qui ont un numéro enregistré' },
  { id: 'inactive_30d', label: 'Inactifs 30 jours',    icon: UserX,       description: 'Pas connectes depuis 30+ jours' },
  { id: 'no_listing',   label: 'Sans annonce',          icon: ShoppingBag, description: 'Inscrits mais n\'ont jamais publie' },
];

const SUGGESTED_TEMPLATES = [
  {
    name: 'zandoplus_rappel',
    label: 'Re-engagement',
    example: 'Bonjour {{1}} ! Des nouvelles annonces vous attendent sur Zando+ Congo. Visitez zandopluscg.com',
    status: 'soumettre à Meta',
  },
  {
    name: 'zandoplus_vendeur',
    label: 'Appel vendeurs',
    example: 'Bonjour {{1}} ! Vendez vos articles sur Zando+ Congo gratuitement. Publication illimitée, aucun abonnement. zandopluscg.com/post-ad',
    status: 'soumettre à Meta',
  },
];

const AdminWhatsAppTab = () => {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState('zandoplus_rappel');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [sendMode, setSendMode] = useState('drip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchQueueStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [pendingRes, sentRes, failedRes] = await Promise.all([
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('channel', 'whatsapp'),
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'sent').eq('channel', 'whatsapp'),
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed').eq('channel', 'whatsapp'),
      ]);
      setQueueStats({
        pending: pendingRes.count ?? 0,
        sent: sentRes.count ?? 0,
        failed: failedRes.count ?? 0,
      });
    } catch { /* silent */ } finally { setLoadingStats(false); }
  }, []);

  useEffect(() => { fetchQueueStats(); }, [fetchQueueStats]);

  const handleSend = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Template requis', description: 'Entrez le nom du template Meta approuvé.', variant: 'destructive' });
      return;
    }
    const seg = SEGMENTS.find(s => s.id === selectedSegment);
    const modeLabel = sendMode === 'drip' ? '50 messages/jour automatiquement' : 'tous maintenant';
    const confirmed = window.confirm(
      `Envoyer le template "${templateName}" au segment "${seg?.label}" — ${modeLabel} ?\n\nLe template doit être approuvé par Meta sinon les messages seront rejetés.`
    );
    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    try {
      const { data } = await supabase.functions.invoke('send-whatsapp-campaign', {
        body: { template_name: templateName.trim(), segment: selectedSegment, mode: sendMode },
      });
      const res = data || {};
      if (!res.success) throw new Error(res.error || 'Erreur inconnue');
      setResult(res);
      fetchQueueStats();

      if (sendMode === 'drip') {
        toast({ title: 'Campagne lancée', description: `${res.queued} messages en file. ~${res.days_needed} jour(s) pour finir.` });
      } else {
        toast({ title: 'Messages envoyés', description: `${res.sent} envoyés, ${res.failed} échecs.` });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleProcessNow = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('process-campaign-queue');
      const res = data || {};
      if (!res.success) throw new Error(res.error || 'Erreur');
      toast({ title: 'Batch traité', description: `${res.sent} envoyés. ${res.remaining} restants.` });
      fetchQueueStats();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const totalJobs = queueStats ? queueStats.sent + queueStats.pending + queueStats.failed : 0;
  const progressPct = totalJobs > 0 ? Math.round((queueStats.sent / totalJobs) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-500" />
          Campagnes WhatsApp
        </h2>
        <p className="text-sm text-gray-500">Envoyez des messages WhatsApp via l'API Cloud Meta.</p>
      </div>

      {/* Setup guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-2">Configuration requise avant le premier envoi</p>
            <ol className="text-sm text-amber-800 space-y-1.5 list-decimal list-inside">
              <li>
                Allez sur{' '}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-0.5">
                  developers.facebook.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                → créez une App → ajoutez le produit WhatsApp
              </li>
              <li>Copiez votre <strong>Phone Number ID</strong> et votre <strong>Access Token permanent</strong></li>
              <li>
                Dans Supabase → Edge Functions → Secrets, ajoutez :<br />
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">WHATSAPP_TOKEN</code> et{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">WHATSAPP_PHONE_NUMBER_ID</code>
              </li>
              <li>
                Dans Meta Business Suite → WhatsApp Manager → Message Templates,{' '}
                créez et soumettez vos templates (approbation 24-48h)
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Suggested templates */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Templates suggérés à créer dans Meta</h3>
        <div className="space-y-3">
          {SUGGESTED_TEMPLATES.map(tpl => (
            <div key={tpl.name} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm text-gray-900">{tpl.label}</span>
                  <code className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">{tpl.name}</code>
                </div>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {tpl.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 italic">"{tpl.example}"</p>
              <p className="text-xs text-gray-400 mt-1">Catégorie : Marketing · Langue : Français (fr) · Variable : {'{'}{'{'}'1{'}'}{'}'}= prénom</p>
            </div>
          ))}
        </div>
      </div>

      {/* Queue status */}
      {queueStats && (queueStats.pending > 0 || queueStats.sent > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-500" />
              File d'attente WhatsApp
            </h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleProcessNow} disabled={loading || queueStats.pending === 0} className="text-xs">
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                Envoyer le batch maintenant
              </Button>
              <button onClick={fetchQueueStats} className="text-gray-400 hover:text-gray-600">
                <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{queueStats.sent} envoyés</span>
              <span>{queueStats.pending} en attente</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700"><span className="w-2 h-2 bg-green-500 rounded-full" />{queueStats.sent} envoyés</span>
            <span className="flex items-center gap-1.5 text-blue-700"><span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />{queueStats.pending} en attente</span>
            {queueStats.failed > 0 && <span className="flex items-center gap-1.5 text-red-600"><span className="w-2 h-2 bg-red-400 rounded-full" />{queueStats.failed} échecs</span>}
          </div>
        </div>
      )}

      {/* Template & segment */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">1. Nom du template Meta (approuvé)</h3>
          <div className="space-y-2">
            <Label htmlFor="template_name">Nom exact du template dans Meta Business Suite</Label>
            <Input
              id="template_name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="ex: zandoplus_rappel"
              className="font-mono"
            />
            <p className="text-xs text-gray-400">Ce nom doit correspondre exactement au template approuvé par Meta.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">2. Segment de destinataires</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SEGMENTS.map(seg => {
              const Icon = seg.icon;
              const isSelected = selectedSegment === seg.id;
              return (
                <button key={seg.id} onClick={() => setSelectedSegment(seg.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-sm mb-1 ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>{seg.label}</p>
                  <p className="text-xs text-gray-500">{seg.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">3. Mode d'envoi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <button onClick={() => setSendMode('drip')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${sendMode === 'drip' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <Clock className={`w-5 h-5 mb-2 ${sendMode === 'drip' ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm mb-1 ${sendMode === 'drip' ? 'text-green-800' : 'text-gray-700'}`}>Progressif — 50/jour (recommandé)</p>
              <p className="text-xs text-gray-500">Moins de risque d'être marqué comme spam. Le cron tourne automatiquement chaque matin.</p>
            </button>
            <button onClick={() => setSendMode('immediate')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${sendMode === 'immediate' ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <Zap className={`w-5 h-5 mb-2 ${sendMode === 'immediate' ? 'text-red-500' : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm mb-1 ${sendMode === 'immediate' ? 'text-red-800' : 'text-gray-700'}`}>Immédiat — tout maintenant</p>
              <p className="text-xs text-gray-500">Envoie a tous les destinataires dans la foulée.</p>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Template <strong>{templateName || '—'}</strong> → {SEGMENTS.find(s => s.id === selectedSegment)?.label} → {sendMode === 'drip' ? '50/jour' : 'immédiat'}
            </p>
            <Button onClick={handleSend} disabled={loading || !templateName.trim()}
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> En cours...</>
                : sendMode === 'drip'
                  ? <><CalendarClock className="w-4 h-4 mr-2" /> Lancer la campagne</>
                  : <><MessageCircle className="w-4 h-4 mr-2" /> Envoyer maintenant</>
              }
            </Button>
          </div>

          {result && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-green-800">
                {result.mode === 'drip'
                  ? <>{result.queued} messages en file. ~{result.days_needed} jour(s) pour finir. {result.invalid_phones > 0 && `(${result.invalid_phones} numéros invalides ignorés)`}</>
                  : <>{result.sent} messages envoyés. {result.failed > 0 && `${result.failed} échecs.`} {result.invalid_phones > 0 && `${result.invalid_phones} numéros invalides.`}</>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsAppTab;
