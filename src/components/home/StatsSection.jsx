import React, { useState, useEffect } from 'react';
import { motion, useSpring, useInView, useTransform } from 'framer-motion';
import { TrendingUp, Users, Shield, Eye } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

/* Compteur animé */
const AnimatedCount = ({ value }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 80, damping: 25 });
  useEffect(() => { if (isInView) spring.set(value); }, [isInView, value, spring]);
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString('fr-FR'));
  return <motion.span ref={ref}>{display}</motion.span>;
};

const StatsSection = () => {
  const [stats, setStats] = useState({ listingsCount: 0, usersCount: 0, visitsCount: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc('get_site_statistics');
      if (!error && data) setStats(data);
    };
    fetch();

    const channel = supabase.channel('stats-why')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_visits' }, () => {
        setStats(s => ({ ...s, visitsCount: s.visitsCount + 1 }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const statItems = [
    { icon: TrendingUp, value: stats.listingsCount, label: 'Annonces actives',        suffix: '+' },
    { icon: Users,      value: stats.usersCount,    label: 'Utilisateurs satisfaits', suffix: '+' },
    { icon: Shield,     value: null,                label: 'Transactions sécurisées', text: '100%' },
    { icon: Eye,        value: stats.visitsCount,   label: 'Visiteurs sur Zando+',    suffix: '+' },
  ];

  return (
    <section className="py-6 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">

        {/* ── Stats chiffres ── */}
        <div className="bg-card-bg border border-gray-100 rounded-2xl px-3 sm:px-8 py-4 sm:py-6 grid grid-cols-4 gap-2 sm:gap-6">
          {statItems.map(({ icon: Icon, value, label, suffix, text }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-custom-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[15px] sm:text-[20px] font-black text-gray-900 leading-none tabular-nums">
                  {text || (value != null ? <><AnimatedCount value={value} />{suffix}</> : '...')}
                </p>
                <p className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
