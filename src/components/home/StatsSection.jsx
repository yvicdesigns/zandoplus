import React, { useState, useEffect } from 'react';
import { motion, useSpring, useInView, useTransform } from 'framer-motion';
import { Truck, Shield, Star, Headphones, RefreshCw, TrendingUp, Users, Eye } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const reasons = [
  { icon: Truck,       title: 'Livraison à domicile',       desc: 'Recevez vos commandes directement chez vous à Brazzaville et dans les grandes villes' },
  { icon: Shield,      title: 'Paiements sécurisés',        desc: 'MTN Money, Airtel Money ou paiement à la livraison — à vous de choisir' },
  { icon: Star,        title: 'Vendeurs certifiés',          desc: 'Des vendeurs vérifiés par Zando+, notés par de vrais acheteurs' },
  { icon: Headphones,  title: 'Support 7j/7',               desc: 'Notre équipe est disponible par messagerie pour vous accompagner à chaque étape' },
  { icon: RefreshCw,   title: 'Achat protégé',              desc: 'Vos fonds sont bloqués jusqu\'à confirmation de réception — remboursé en cas de litige' },
];

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
    <section className="py-8 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* ── Pourquoi choisir Zando+ ── */}
        <div className="mb-8">
          <h2 className="text-[19px] font-extrabold text-gray-900 mb-6">Pourquoi choisir Zando+ ?</h2>
          <div className="flex gap-4 justify-between">
            {reasons.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
                className="flex-1 flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 bg-custom-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900 leading-tight mb-1">{title}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Stats chiffres ── */}
        <div className="bg-card-bg border border-gray-100 rounded-2xl px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map(({ icon: Icon, value, label, suffix, text }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <div className="w-11 h-11 bg-custom-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-custom-green-500" />
              </div>
              <div>
                <p className="text-[20px] font-black text-gray-900 leading-none tabular-nums">
                  {text || (value != null ? <><AnimatedCount value={value} />{suffix}</> : '...')}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
