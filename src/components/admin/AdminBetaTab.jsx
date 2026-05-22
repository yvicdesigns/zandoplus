import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Bug, Trophy, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Zap, AlertTriangle, Loader2, RefreshCw, Star,
  Copy, Link, Mail, Save
} from 'lucide-react';
import { getTierFromPoints } from '@/lib/testerScoring';

const STATUS_STYLES = {
  pending:  { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  active:   { label: 'Actif',      color: 'bg-green-100  text-green-700  border-green-200'  },
  waitlist: { label: 'Liste d\'attente', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  rejected: { label: 'Refusé',     color: 'bg-red-100    text-red-700    border-red-200'    },
};

const SEVERITY_COLORS = {
  critical:   'bg-red-100 text-red-700',
  major:      'bg-orange-100 text-orange-700',
  minor:      'bg-yellow-100 text-yellow-700',
  suggestion: 'bg-blue-100 text-blue-700',
};

const ScoreBar = ({ score }) => {
  const color = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-7 text-right ${score >= 70 ? 'text-green-600' : score >= 45 ? 'text-yellow-600' : 'text-red-500'}`}>{score}</span>
    </div>
  );
};

const AdminBetaTab = () => {
  const [tab, setTab]           = useState('candidatures');
  const [testers, setTesters]   = useState([]);
  const [bugs, setBugs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [playStoreLink, setPlayStoreLinkState] = useState(
    () => localStorage.getItem('beta_play_store_link') || ''
  );
  const [linkSaved, setLinkSaved] = useState(false);
  const { toast } = useToast();

  const savePlayStoreLink = () => {
    localStorage.setItem('beta_play_store_link', playStoreLink);
    setLinkSaved(true);
    setTimeout(() => setLinkSaved(false), 2000);
    toast({ title: 'Lien Play Store sauvegardé' });
  };

  const copyActiveEmails = () => {
    const emails = testers.filter(t => t.status === 'active').map(t => t.email).join(', ');
    if (!emails) { toast({ title: 'Aucun testeur actif' }); return; }
    navigator.clipboard.writeText(emails);
    toast({ title: 'Emails copiés !', description: `${testers.filter(t => t.status === 'active').length} email(s) prêts à coller dans Google Play Console` });
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: b }] = await Promise.all([
      supabase.from('testers').select('*').order('score', { ascending: false }),
      supabase.from('bug_reports').select('*, testers(full_name)').order('created_at', { ascending: false }),
    ]);
    setTesters(t || []);
    setBugs(b || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (tester, newStatus) => {
    setActionId(tester.id);
    try {
      // Try to link user account by email if not yet linked
      let userId = tester.user_id;
      if (!userId && newStatus === 'active') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', tester.email)
          .maybeSingle();
        userId = profile?.id ?? null;
      }

      const updates = {
        status: newStatus,
        ...(userId && { user_id: userId }),
        ...(newStatus === 'active' && { activation_date: new Date().toISOString() }),
      };

      const { error } = await supabase.from('testers').update(updates).eq('id', tester.id);
      if (error) throw error;
      setTesters(prev => prev.map(t => t.id === tester.id ? { ...t, ...updates } : t));

      // Send activation email automatically
      if (newStatus === 'active') {
        const link = localStorage.getItem('beta_play_store_link') || '';
        const { error: emailErr } = await supabase.functions.invoke('send-tester-activation-email', {
          body: { to: tester.email, name: tester.full_name, play_store_link: link },
        });
        if (emailErr) {
          toast({ title: 'Testeur activé', description: `Email non envoyé (configurez le lien Play Store). ${tester.full_name}`, variant: 'destructive' });
        } else {
          toast({ title: `✅ ${tester.full_name} activé !`, description: `Email d'activation envoyé à ${tester.email}` });
        }
      } else {
        toast({ title: `Statut mis à jour → ${STATUS_STYLES[newStatus].label}`, description: tester.full_name });
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  const activateTop20 = async () => {
    const pending = testers
      .filter(t => t.status === 'pending' || t.status === 'waitlist')
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    if (!pending.length) { toast({ title: 'Aucun candidat à activer' }); return; }
    for (const t of pending) await updateStatus(t, 'active');
    toast({ title: `${pending.length} testeur(s) activé(s)` });
  };

  const resolveBug = async (bugId, current) => {
    const { error } = await supabase.from('bug_reports').update({ resolved: !current }).eq('id', bugId);
    if (!error) setBugs(prev => prev.map(b => b.id === bugId ? { ...b, resolved: !current } : b));
  };

  const pending  = testers.filter(t => t.status === 'pending');
  const active   = testers.filter(t => t.status === 'active');
  const total_bugs = bugs.length;
  const unresolved = bugs.filter(b => !b.resolved).length;

  const TABS = [
    { id: 'candidatures', label: 'Candidatures', count: pending.length, icon: Users },
    { id: 'actifs',       label: 'Actifs',        count: active.length,  icon: Trophy },
    { id: 'bugs',         label: 'Bugs',           count: unresolved,     icon: Bug, alert: unresolved > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Play Store link config */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Link className="w-3.5 h-3.5" /> Lien Google Play (test interne)
        </p>
        <div className="flex gap-2">
          <Input
            value={playStoreLink}
            onChange={e => setPlayStoreLinkState(e.target.value)}
            placeholder="https://play.google.com/apps/internaltest/..."
            className="flex-1 text-sm bg-white border-blue-200"
          />
          <Button onClick={savePlayStoreLink} size="sm"
            className={`flex-shrink-0 ${linkSaved ? 'bg-green-600' : 'bg-blue-600'} text-white hover:opacity-90`}>
            {linkSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </Button>
          <Button onClick={copyActiveEmails} size="sm" variant="outline"
            className="flex-shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100 gap-1.5">
            <Copy className="w-4 h-4" /> Copier emails
          </Button>
        </div>
        <p className="text-xs text-blue-500 mt-2">
          Ce lien est envoyé automatiquement par email à chaque testeur activé. Collez les emails copiés dans Google Play Console → Testeurs.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Candidatures',    value: pending.length,  color: 'text-yellow-600', icon: Clock },
          { label: 'Actifs',          value: active.length,   color: 'text-green-600',  icon: CheckCircle2 },
          { label: 'Bugs total',      value: total_bugs,      color: 'text-red-500',    icon: Bug },
          { label: 'Non résolus',     value: unresolved,      color: 'text-orange-500', icon: AlertTriangle },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <kpi.icon className={`w-5 h-5 ${kpi.color} flex-shrink-0`} />
            <div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-gray-500 text-xs">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id ? 'bg-white border border-b-white border-gray-100 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${t.alert ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-2 text-gray-400 hover:text-gray-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>
      ) : (
        <>
          {/* ── CANDIDATURES tab ── */}
          {tab === 'candidatures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{testers.filter(t => t.status !== 'active').length} dossier(s) · triés par score</p>
                <Button onClick={activateTop20} size="sm" className="gradient-bg text-white hover:opacity-90 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Activer top 20
                </Button>
              </div>
              <div className="space-y-3">
                {testers.filter(t => t.status !== 'active').map(tester => (
                  <div key={tester.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">{tester.full_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[tester.status]?.color}`}>
                            {STATUS_STYLES[tester.status]?.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{tester.email} · {tester.phone}</p>
                        <ScoreBar score={tester.score} />
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span>📱 {tester.device_model} (Android {tester.android_version})</span>
                          <span>⏱ {tester.daily_availability}h/j</span>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button size="sm" disabled={actionId === tester.id || tester.status === 'active'}
                          onClick={() => updateStatus(tester, 'active')}
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-3">
                          {actionId === tester.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓ Activer'}
                        </Button>
                        <Button size="sm" variant="outline" disabled={actionId === tester.id || tester.status === 'waitlist'}
                          onClick={() => updateStatus(tester, 'waitlist')}
                          className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 px-3">
                          Liste attente
                        </Button>
                        <Button size="sm" variant="ghost" disabled={actionId === tester.id || tester.status === 'rejected'}
                          onClick={() => updateStatus(tester, 'rejected')}
                          className="h-7 text-xs text-red-500 hover:bg-red-50 px-3">
                          Refuser
                        </Button>
                      </div>
                    </div>
                    {/* Expandable motivation */}
                    <button
                      onClick={() => setExpanded(p => ({ ...p, [tester.id]: !p[tester.id] }))}
                      className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {expanded[tester.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Motivation
                    </button>
                    {expanded[tester.id] && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{tester.motivation}</p>
                    )}
                  </div>
                ))}
                {testers.filter(t => t.status !== 'active').length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune candidature en attente</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIFS tab (leaderboard) ── */}
          {tab === 'actifs' && (
            <div className="space-y-3">
              {active.sort((a, b) => b.points - a.points).map((tester, i) => {
                const tier = getTierFromPoints(tester.points);
                return (
                  <div key={tester.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{tester.full_name}</p>
                      <p className="text-xs text-gray-500">{tester.email}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${tier.bg} ${tier.color} ${tier.border}`}>
                      <Star className="w-3 h-3" /> {tester.points} pts — {tier.label}
                    </div>
                    {tester.activation_date && (
                      <p className="text-xs text-gray-400 hidden md:block">
                        Activé {new Date(tester.activation_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                );
              })}
              {active.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun testeur actif pour l'instant</p>
                </div>
              )}
            </div>
          )}

          {/* ── BUGS tab ── */}
          {tab === 'bugs' && (
            <div className="space-y-3">
              {bugs.map(bug => (
                <div key={bug.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${bug.resolved ? 'opacity-60' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_COLORS[bug.severity]}`}>
                          {bug.severity}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{bug.category}</span>
                        {bug.resolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Résolu</span>}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{bug.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>Par : {bug.testers?.full_name}</span>
                        <span>{bug.page_url?.replace('https://www.zandopluscg.com', '') || '/'}</span>
                        <span>{new Date(bug.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => resolveBug(bug.id, bug.resolved)}
                        className={`h-7 text-xs px-3 ${bug.resolved ? 'border-gray-200 text-gray-500' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                      >
                        {bug.resolved ? 'Rouvrir' : '✓ Résoudre'}
                      </Button>
                      {bug.screenshot_url && (
                        <a href={bug.screenshot_url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline text-center">
                          Screenshot
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {bugs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun rapport de bug pour l'instant</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBetaTab;
