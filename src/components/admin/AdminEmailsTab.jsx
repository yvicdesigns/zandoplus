import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Mail, Send, Users, RefreshCw, Eye, CheckCircle,
  Loader2, UserX, ShoppingBag, RotateCcw, Zap, Clock,
  CalendarClock, Play, Pause,
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'reengagement',
    label: 'Re-engagement',
    subject: 'Zando+ — des nouvelles annonces vous attendent',
    description: 'Rappel pour les utilisateurs inactifs. Les invite a revenir voir les nouvelles annonces.',
    icon: RotateCcw,
    iconBg: 'bg-green-50',
    iconColor: 'text-custom-green-600',
    borderSelected: 'border-custom-green-500',
    bgSelected: 'bg-custom-green-50',
  },
  {
    id: 'new_seller',
    label: 'Appel vendeurs',
    subject: 'Vendez sur Zando+ — inscription et publication sans frais',
    description: 'Encourage les utilisateurs sans annonce a commencer a vendre.',
    icon: ShoppingBag,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderSelected: 'border-amber-500',
    bgSelected: 'bg-amber-50',
  },
];

const SEGMENTS = [
  { id: 'all', label: 'Tous les utilisateurs', icon: Users, description: 'Tout le monde ayant un compte' },
  { id: 'inactive_30d', label: 'Inactifs 30 jours', icon: UserX, description: 'Pas connectes depuis 30+ jours' },
  { id: 'no_listing', label: 'Sans annonce', icon: ShoppingBag, description: 'Inscrits mais n\'ont jamais publie' },
];

const AdminEmailsTab = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [sendMode, setSendMode] = useState('drip'); // 'immediate' | 'drip'
  const [loading, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [result, setResult] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchQueueStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [pendingRes, sentRes, failedRes] = await Promise.all([
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('campaign_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      ]);
      setQueueStats({
        pending: pendingRes.count ?? 0,
        sent: sentRes.count ?? 0,
        failed: failedRes.count ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchQueueStats(); }, [fetchQueueStats]);

  const handlePreview = async (templateId) => {
    try {
      const { data } = await supabase.functions.invoke('send-campaign', {
        body: { template_id: templateId, preview: true },
      });
      setPreviewHtml((data || {}).html);
    } catch (err) {
      toast({ title: 'Erreur preview', description: err.message, variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast({ title: 'Template requis', description: 'Selectionnez un template.', variant: 'destructive' });
      return;
    }

    const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
    const seg = SEGMENTS.find(s => s.id === selectedSegment);
    const modeLabel = sendMode === 'drip' ? '50 emails/jour automatiquement' : 'tous d\'un coup maintenant';

    const confirmed = window.confirm(
      `Envoyer "${tpl?.label}" au segment "${seg?.label}" — ${modeLabel} ?\n\nCette action est irreversible.`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);
    try {
      const { data } = await supabase.functions.invoke('send-campaign', {
        body: { template_id: selectedTemplate, segment: selectedSegment, mode: sendMode },
      });
      const res = data || {};
      if (!res.success) throw new Error(res.error || 'Erreur inconnue');
      setResult(res);
      fetchQueueStats();

      if (sendMode === 'drip') {
        toast({ title: 'Campagne lancee', description: `${res.queued} emails en file. ~${res.days_needed} jour(s) pour finir.` });
      } else {
        toast({ title: 'Campagne envoyee', description: `${res.sent} emails envoyes.` });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleProcessNow = async () => {
    setSending(true);
    try {
      const { data } = await supabase.functions.invoke('process-campaign-queue');
      const res = data || {};
      if (!res.success) throw new Error(res.error || 'Erreur');
      toast({ title: 'Batch traite', description: `${res.sent} envoyes. ${res.remaining} restants.` });
      fetchQueueStats();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const totalJobs = queueStats ? queueStats.sent + queueStats.pending + queueStats.failed : 0;
  const progressPct = totalJobs > 0 ? Math.round((queueStats.sent / totalJobs) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Campagnes Email</h2>
        <p className="text-sm text-gray-500">Envoyez des emails a vos utilisateurs via Resend.</p>
      </div>

      {/* Queue status */}
      {queueStats && (queueStats.pending > 0 || queueStats.sent > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-500" />
              File d'attente active
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleProcessNow}
                disabled={loading || queueStats.pending === 0}
                className="text-xs"
              >
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                Envoyer le batch maintenant
              </Button>
              <button onClick={fetchQueueStats} className="text-gray-400 hover:text-gray-600">
                <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{queueStats.sent} envoyes</span>
              <span>{queueStats.pending} en attente</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #005023, #10CE6A)' }}
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {queueStats.sent} envoyes
            </span>
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              {queueStats.pending} en attente
            </span>
            {queueStats.failed > 0 && (
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                {queueStats.failed} echecs
              </span>
            )}
            {queueStats.pending > 0 && (
              <span className="text-gray-400 text-xs ml-auto">
                ~{Math.ceil(queueStats.pending / 50)} jour(s) restants
              </span>
            )}
          </div>
        </div>
      )}

      {/* Template selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-purple-500" />
          1. Choisir un template
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected ? `${tpl.borderSelected} ${tpl.bgSelected}` : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 ${tpl.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${tpl.iconColor}`} />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{tpl.label}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{tpl.description}</p>
                <p className="text-xs text-gray-400 italic mb-3">Objet : {tpl.subject}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePreview(tpl.id); }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Apercu
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          2. Choisir le segment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            const isSelected = selectedSegment === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setSelectedSegment(seg.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm mb-1 ${isSelected ? 'text-orange-800' : 'text-gray-700'}`}>
                  {seg.label}
                </p>
                <p className="text-xs text-gray-500">{seg.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Send mode */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          3. Mode d'envoi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSendMode('drip')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              sendMode === 'drip'
                ? 'border-custom-green-500 bg-custom-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Clock className={`w-5 h-5 mb-2 ${sendMode === 'drip' ? 'text-custom-green-600' : 'text-gray-400'}`} />
            <p className={`font-semibold text-sm mb-1 ${sendMode === 'drip' ? 'text-custom-green-800' : 'text-gray-700'}`}>
              Progressif — 50/jour (recommande)
            </p>
            <p className="text-xs text-gray-500">Moins de risque de spam. Le cron tourne automatiquement chaque matin a 10h.</p>
          </button>

          <button
            onClick={() => setSendMode('immediate')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              sendMode === 'immediate'
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Zap className={`w-5 h-5 mb-2 ${sendMode === 'immediate' ? 'text-red-500' : 'text-gray-400'}`} />
            <p className={`font-semibold text-sm mb-1 ${sendMode === 'immediate' ? 'text-red-800' : 'text-gray-700'}`}>
              Immediat — tout d'un coup
            </p>
            <p className="text-xs text-gray-500">Envoie a tous les destinataires maintenant. A utiliser pour les annonces urgentes.</p>
          </button>
        </div>

        {/* Send button */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div>
            {selectedTemplate
              ? <p className="text-sm text-gray-600">
                  <strong>{TEMPLATES.find(t => t.id === selectedTemplate)?.label}</strong> →{' '}
                  {SEGMENTS.find(s => s.id === selectedSegment)?.label} →{' '}
                  {sendMode === 'drip' ? '50/jour' : 'immédiat'}
                </p>
              : <p className="text-sm text-gray-400">Selectionnez un template ci-dessus</p>
            }
          </div>
          <Button
            onClick={handleSend}
            disabled={loading || !selectedTemplate}
            style={selectedTemplate ? { background: 'linear-gradient(135deg, #005023, #003D1A)' } : {}}
            className="shrink-0 text-white font-bold disabled:opacity-40"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> En cours...</>
              : sendMode === 'drip'
                ? <><CalendarClock className="w-4 h-4 mr-2" /> Lancer la campagne</>
                : <><Send className="w-4 h-4 mr-2" /> Envoyer maintenant</>
            }
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-green-800">
              {result.mode === 'drip'
                ? <>{result.queued} emails ajoutes en file d'attente. Envoi de 50 par jour. Termine dans ~{result.days_needed} jour(s).</>
                : <>{result.sent} emails envoyes. {result.failed > 0 && `${result.failed} echecs.`} {result.skipped > 0 && `${result.skipped} desabonnes ignores.`}</>
              }
            </div>
          </div>
        )}
      </div>

      {/* Sync section (collapsed) */}
      <details className="bg-white rounded-2xl border border-gray-200">
        <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-600 text-sm">Sync Audience Resend (optionnel)</span>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pour Broadcasts depuis resend.com</span>
        </summary>
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Pour envoyer des Broadcasts depuis l'interface resend.com, vous devez d'abord synchroniser vos contacts.
            Necessite une cle API Resend avec les permissions "Full access".
          </p>
          <Button
            onClick={async () => {
              try {
                const { data } = await supabase.functions.invoke('sync-contacts-resend');
                const res = data || {};
                if (!res.success) {
                  const msg = res.error || '';
                  if (msg.includes('restricted_api_key')) {
                    toast({ title: 'Cle API restreinte', description: 'Creez une cle "Full access" dans Resend et mettez a jour RESEND_API_KEY dans Supabase.', variant: 'destructive' });
                    return;
                  }
                  throw new Error(msg);
                }
                toast({ title: 'Sync terminee', description: `${res.synced} contacts synchronises.` });
              } catch (err) {
                toast({ title: 'Erreur sync', description: err.message, variant: 'destructive' });
              }
            }}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser vers Resend
          </Button>
        </div>
      </details>

      {/* HTML Preview modal */}
      {previewHtml && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewHtml(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Apercu email</h3>
              <button onClick={() => setPreviewHtml(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">x</button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe srcDoc={previewHtml} title="Email preview" className="w-full min-h-[500px] border-0" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailsTab;
