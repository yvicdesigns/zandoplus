import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Trophy, Bug, Target, Star, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getTierFromPoints } from '@/lib/testerScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TesterDashboardPage = () => {
  const { user } = useAuth();
  const [tester, setTester]   = useState(null);
  const [missions, setMissions] = useState([]);
  const [bugs, setBugs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: t }, { data: m }, { data: b }] = await Promise.all([
        supabase.from('testers').select('*').eq('user_id', user.id).single(),
        supabase.from('beta_missions').select('*, beta_mission_completions(id)').eq('is_active', true).order('order_index'),
        supabase.from('bug_reports').select('id, category, severity, resolved, created_at')
          .eq('tester_id', (await supabase.from('testers').select('id').eq('user_id', user.id).single()).data?.id)
          .order('created_at', { ascending: false }).limit(5),
      ]);
      setTester(t);
      setMissions(m || []);
      setBugs(b || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  if (!tester) return null;

  const tier = getTierFromPoints(tester.points);
  const completedIds = new Set(missions.flatMap(m => m.beta_mission_completions.map(c => m.id)));

  return (
    <>
      <Helmet>
        <title>Dashboard Testeur — Zando+</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-10">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Testeur</h1>
              <p className="text-gray-500 text-sm">Bienvenue, {tester.full_name}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border ${tier.bg} ${tier.color} ${tier.border}`}>
              <Trophy className="w-4 h-4" /> Niveau {tier.label} · {tester.points} pts
            </div>
          </motion.div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Points totaux',    value: tester.points,               icon: Star,   color: 'text-yellow-600' },
              { label: 'Missions complètes', value: completedIds.size,          icon: Target, color: 'text-green-600'  },
              { label: 'Bugs signalés',    value: bugs.length,                  icon: Bug,    color: 'text-red-500'    },
              { label: 'Statut',           value: tester.status === 'active' ? 'Actif' : tester.status, icon: Clock, color: 'text-blue-600' },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <Card>
                  <CardContent className="p-5 text-center">
                    <kpi.icon className={`w-6 h-6 ${kpi.color} mx-auto mb-2`} />
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{kpi.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Missions */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-custom-green-600" /> Mes Missions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missions.map(m => {
                  const done = m.beta_mission_completions?.length > 0;
                  return (
                    <div key={m.id} className={`flex items-center justify-between p-4 rounded-xl border ${done ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-green-500' : 'bg-gray-100'}`}>
                          {done ? <Star className="w-4 h-4 text-white" /> : <Target className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{m.title}</p>
                          <p className="text-xs text-gray-500">{m.description}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-4 ${done ? 'bg-green-100 text-green-700' : 'bg-custom-green-100 text-custom-green-700'}`}>
                        {done ? '✓ Fait' : `+${m.points} pts`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent bugs */}
          {bugs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bug className="w-5 h-5 text-red-500" /> Derniers rapports</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bugs.map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          b.severity === 'major'    ? 'bg-orange-100 text-orange-700' :
                          b.severity === 'minor'    ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{b.severity}</span>
                        <span className="text-sm text-gray-600 capitalize">{b.category}</span>
                      </div>
                      <span className={`text-xs ${b.resolved ? 'text-green-600' : 'text-gray-400'}`}>
                        {b.resolved ? 'Résolu' : 'En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-gray-400 text-sm pb-4">
            Dashboard complet (leaderboard, analytics, bug report) — disponible bientôt
          </p>
        </div>
      </div>
    </>
  );
};

export default TesterDashboardPage;
