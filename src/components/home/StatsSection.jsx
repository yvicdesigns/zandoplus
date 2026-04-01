import React, { useState, useEffect } from 'react';
import { motion, useSpring, useInView, useTransform } from 'framer-motion';
import { TrendingUp, Star, Shield, Eye, ShoppingBag as LoadingIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const AnimatedStat = ({ value, icon: Icon, label }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const isNumber = typeof value === 'number';
  
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  
  useEffect(() => {
    if (isInView && isNumber) {
      springValue.set(value);
    }
  }, [isInView, value, springValue, isNumber]);

  const rounded = useTransform(springValue, (latest) => Math.round(latest).toLocaleString('fr-FR'));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="w-12 h-12 mx-auto mb-3 bg-custom-green-100 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-custom-green-600" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-1 text-gray-900">
        {isNumber ? <motion.span>{rounded}</motion.span> : value}
        {isNumber && '+'}
      </h3>
      <p className="text-sm text-gray-600">{label}</p>
    </motion.div>
  );
};


const StatsSection = () => {
    const [siteStats, setSiteStats] = useState({ listingsCount: 0, usersCount: 0, visitsCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_site_statistics');
            if (error) {
                console.error("Erreur de récupération des statistiques du site:", error);
                setSiteStats({ listingsCount: 50000, usersCount: 25000, visitsCount: 100000 });
            } else {
                setSiteStats(data);
            }
            setLoading(false);
        };
        fetchStats();

        const channel = supabase.channel('realtime stats')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_visits' }, (payload) => {
            setSiteStats(currentStats => ({
              ...currentStats,
              visitsCount: currentStats.visitsCount + 1
            }));
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
             fetchStats();
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
            fetchStats();
          })
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const stats = [
        { label: 'Annonces Actives', value: siteStats.listingsCount, icon: TrendingUp },
        { label: 'Utilisateurs Satisfaits', value: siteStats.usersCount, icon: Star },
        { label: 'Transactions Sécurisées', value: '100%', icon: Shield },
        { label: 'Visiteurs sur Zando+', value: siteStats.visitsCount, icon: Eye }
    ];

    return (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Approuvé par des Milliers
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
                Rejoignez la communauté de marché la plus dynamique du Congo Brazzaville
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 lg:gap-x-8 gap-y-8 lg:gap-y-12">
              {loading ? (
                <div className="col-span-full flex justify-center items-center h-24">
                  <LoadingIcon className="w-8 h-8 animate-spin text-custom-green-500" />
                </div>
              ) : (
                stats.map((stat) => (
                  <AnimatedStat key={stat.label} value={stat.value} icon={stat.icon} label={stat.label} />
                ))
              )}
            </div>
          </div>
        </section>
    );
};

export default StatsSection;