import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Tag, ShieldCheck, CreditCard, Truck, MapPin, BadgeCheck,
  Brush, Camera, Video, Code, Zap, Cpu, Edit, Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import EditAboutImagesDialog from '@/components/about/EditAboutImagesDialog';

// Fond vert de marque (même dégradé que les en-têtes d'e-mail) — utilisé
// pour les deux bandes pleine largeur (hero + CTA final).
const BRAND_GRADIENT = 'linear-gradient(160deg, #005023 0%, #003D1A 100%)';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id6800881634',
  android: 'https://play.google.com/store/apps/details?id=com.zando.app',
};

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.3-3.1zM14.5 6.2c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4l13 8-13 8V4z" fill="currentColor" />
    <path d="M4 4l9.5 8L4 20" fill="currentColor" opacity=".45" />
  </svg>
);

const FEATURES = [
  { icon: Tag, title: 'Publication gratuite', text: 'Aucun frais, aucun abonnement, annonces illimitées.' },
  { icon: ShieldCheck, title: 'Vendeurs vérifiés', text: "Badge attribué après contrôle de la pièce d'identité." },
  { icon: CreditCard, title: 'Mobile Money & Achat Sécurisé', text: 'Fonds bloqués jusqu’à la réception de l’article.' },
  { icon: Truck, title: 'Livraison à Brazzaville', text: 'Un livreur Zando+ passe directement chez vous.' },
];

const SKILLS = [
  { icon: Brush, label: 'Design graphique' },
  { icon: Camera, label: 'Photographie' },
  { icon: Video, label: 'Vidéo' },
  { icon: Code, label: 'Développement web' },
  { icon: Zap, label: 'Électricité' },
  { icon: Cpu, label: 'Intelligence artificielle' },
];

const TIMELINE = [
  { date: 'Dolisie', title: 'Baccalauréat en électrotechnique', text: "Lycée Technique de Dolisie, les bases d'une formation autodidacte et technique." },
  { date: 'Accra, Ghana', title: "Spécialisation à l'IPMC College of Technology", text: 'Développement web et design graphique.' },
  { date: 'Brazzaville', title: 'Fondation de Creative Art Afrik', text: 'Formation en design et production créative.' },
  { date: 'Lancement', title: 'Mise en ligne de Zando+', text: 'La première marketplace de petites annonces pensée pour le Congo.' },
  { date: "Aujourd'hui", title: 'Disponible sur App Store & Google Play', text: 'Et ça continue.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const AboutPage = () => {
  const { isAdmin } = useAuth();
  const { siteSettings } = useSiteSettings();
  const { toast } = useToast();
  const [content, setContent] = useState(null);
  const [stats, setStats] = useState({ listings: null, members: null });
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('about_page_content').select('*').eq('id', 1).single();
    if (error) {
      console.error('Error fetching about page content:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger le contenu de la page.', variant: 'destructive' });
    } else {
      setContent(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    const loadStats = async () => {
      const [{ count: listings }, { count: members }] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      setStats({ listings, members });
    };
    loadStats();
  }, []);

  const handleSave = (newContent) => setContent(newContent);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>À Propos - Zando+ Congo | Fondateur M. Tchissambou Van Yvic</title>
        <meta name="description" content="Zando+ Congo est fondée par M. Tchissambou Van Yvic, entrepreneur congolais, CEO de Creative Art Afrik, spécialisé en développement web et design graphique. La première place de marché en ligne du Congo Brazzaville." />
        <link rel="canonical" href="https://www.zandopluscg.com/about" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": "https://www.zandopluscg.com/about#founder",
              "name": "Tchissambou Van Yvic",
              "alternateName": ["M. Tchissambou Van Yvic", "Van Yvic Tchissambou"],
              "jobTitle": "Fondateur & CEO",
              "worksFor": { "@type": "Organization", "name": "Creative Art Afrik" },
              "birthPlace": {
                "@type": "Place",
                "name": "Loubomo",
                "alternateName": "Dolisie",
                "description": "Loubomo est l'ancien nom officiel de Dolisie, troisième ville de la République du Congo.",
                "address": { "@type": "PostalAddress", "addressCountry": "CG", "addressLocality": "Loubomo" }
              },
              "nationality": "Congolaise",
              "alumniOf": [
                { "@type": "EducationalOrganization", "name": "Lycée Technique de Dolisie", "description": "Baccalauréat en électrotechnique" },
                { "@type": "EducationalOrganization", "name": "IPMC College of Technology", "address": { "@type": "PostalAddress", "addressCountry": "GH", "addressLocality": "Accra" } }
              ],
              "knowsAbout": ["Développement web", "Design graphique", "Photographie", "Vidéo", "Intelligence artificielle", "Électricité", "Entrepreneuriat numérique"],
              "description": "Tchissambou Van Yvic est développeur web, entrepreneur numérique et designer, originaire de Dolisie (République du Congo). Fondateur de Creative Art Afrik et de Zando+CG (zandopluscg.com), la première marketplace congolaise de petites annonces. Il travaille également sur Zando Food, une marketplace de restaurants au Congo, et contribue au projet OLEM Consulting. Sa vision : un Congo pleinement numérisé grâce à la technologie et l'intelligence artificielle.",
              "url": "https://www.zandopluscg.com/about",
              "sameAs": []
            },
            {
              "@type": "Organization",
              "@id": "https://www.zandopluscg.com/#organization",
              "name": "Zando+",
              "alternateName": "Zando Plus",
              "url": "https://www.zandopluscg.com/",
              "logo": "https://www.zandopluscg.com/icons/icon-192x192.png",
              "description": "La première place de marché en ligne du Congo Brazzaville. Achetez et vendez électronique, véhicules, immobilier, mode et plus encore.",
              "founder": { "@id": "https://www.zandopluscg.com/about#founder" },
              "foundingLocation": { "@type": "Place", "name": "Brazzaville, Congo" },
              "areaServed": "Congo-Brazzaville",
              "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "url": "https://www.zandopluscg.com/contact" }
            }
          ]
        })}</script>
      </Helmet>

      <div style={{ fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* ══ HERO ══ */}
        <section className="relative overflow-hidden py-24 md:py-32 text-center" style={{ background: BRAND_GRADIENT }}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 opacity-[0.08]">
            <svg width="220" height="220" viewBox="0 0 100 100"><rect x="40" y="0" width="20" height="100" rx="10" fill="#fff" /><rect x="0" y="40" width="100" height="20" rx="10" fill="#fff" /></svg>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -left-12 -bottom-24 opacity-[0.10]">
            <svg width="280" height="280" viewBox="0 0 100 100"><rect x="40" y="0" width="20" height="100" rx="10" fill="#FEC405" /><rect x="0" y="40" width="100" height="20" rx="10" fill="#FEC405" /></svg>
          </div>
          <div className="relative container mx-auto px-4">
            <motion.span initial="hidden" animate="visible" variants={fadeUp}
              className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-accent-yellow"
              style={{ fontFamily: "'Space Mono', monospace" }}>
              Made in Congo, depuis Brazzaville
            </motion.span>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
              className="mt-4 text-3xl md:text-5xl lg:text-6xl font-extrabold text-white max-w-4xl mx-auto leading-tight"
              style={{ fontFamily: "'Baloo 2', sans-serif" }}>
              Un marché où le Congo <span className="text-custom-green-400">achète</span>, <span className="text-custom-green-400">vend</span> et se <span className="text-custom-green-400">fait confiance</span>.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
              className="mt-6 text-base md:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
              Zando+ connecte directement acheteurs et vendeurs, à Brazzaville et partout au Congo, sans agence et sans commission cachée, avec l'argent protégé jusqu'à la livraison.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#fondateur" className="rounded-xl bg-accent-yellow px-6 py-3.5 text-sm font-bold text-[#241A00] hover:opacity-90 transition-opacity">
                Découvrir le fondateur
              </a>
              <Link to="/contact" className="rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Nous contacter
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══ BANDE DE CHIFFRES ══ */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-dashed divide-gray-200">
            {[
              { value: stats.listings != null ? stats.listings.toLocaleString('fr-FR') : '—', label: 'Annonces actives' },
              { value: stats.members != null ? `${stats.members.toLocaleString('fr-FR')}+` : '—', label: 'Membres inscrits' },
              { value: '0 FCFA', label: 'Pour publier une annonce' },
              { value: siteSettings?.launch_date ? format(new Date(siteSettings.launch_date), 'MMMM yyyy', { locale: fr }) : '2025', label: 'En ligne depuis' },
            ].map((s, i) => (
              <div key={i} className="py-7 text-center">
                <div className="text-2xl md:text-3xl font-bold text-custom-green-800 tabular-nums" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {s.value}
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-wide text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MISSION ══ */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-custom-green-100 text-custom-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <Tag className="w-4 h-4" />
                <span>Notre mission</span>
              </div>
              <h2 className="mt-5 text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                Le marché de quartier, mis en ligne.
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed">
                Au Congo, vendre ou acheter d'occasion voulait souvent dire passer par le bouche-à-oreille, un groupe WhatsApp ou un vendeur ambulant. Zando+ met cette même confiance en ligne&nbsp;: n'importe qui peut publier une annonce gratuitement, discuter directement avec l'acheteur, et être payé en Mobile Money, sans jamais dépendre d'un intermédiaire.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Les vendeurs peuvent aussi devenir vérifiés en soumettant une pièce d'identité, ce qui rassure les acheteurs. Et pour les transactions plus importantes, l'Achat Sécurisé bloque les fonds jusqu'à la réception de l'article&nbsp;: personne n'est payé, personne ne perd son argent, avant que tout le monde soit satisfait.
              </p>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.15 }}
              className="flex flex-col gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 items-start bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex-none w-10 h-10 rounded-xl bg-custom-green-50 flex items-center justify-center">
                    <Icon className="w-[19px] h-[19px] text-custom-green-700" />
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-bold text-gray-900">{title}</h3>
                    <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">{text}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ FONDATEUR ══ */}
        <section id="fondateur" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-custom-green-100 text-custom-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <BadgeCheck className="w-4 h-4" />
                <span>Le fondateur</span>
              </div>
            </div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp}
              className="relative bg-white border border-gray-100 rounded-[26px] shadow-lg p-8 md:p-11 grid md:grid-cols-[220px_1fr] gap-8 md:gap-10">
              <div className="relative mx-auto md:mx-0 max-w-[220px] w-full group">
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  {content?.creator_image_url
                    ? <img className="w-full h-full object-cover" alt="Portrait de M. Tchissambou Van Yvic, fondateur de Zando+" src={content.creator_image_url} />
                    : <div className="w-full h-full bg-gray-200 animate-pulse" />}
                  {isAdmin && (
                    <button onClick={() => setIsEditDialogOpen(true)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 flex items-center gap-1.5 bg-custom-green-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                  <BadgeCheck className="w-3.5 h-3.5" /> Profil vérifié
                </div>
              </div>

              <div className="mt-2 md:mt-0 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Tchissambou Van Yvic</h3>
                <div className="mt-1.5 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-[13.5px] text-gray-500">
                  <span>Fondateur & CEO · Creative Art Afrik</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Loubomo &rarr; Brazzaville</span>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-[14.5px] text-gray-600 leading-relaxed">
                    Développeur web et entrepreneur numérique congolais, originaire de Loubomo (aujourd'hui Dolisie). Autodidacte dans l'âme, il obtient son <strong className="text-gray-800">Baccalauréat en électrotechnique</strong> au Lycée Technique de Dolisie avant de se spécialiser à l'<strong className="text-gray-800">IPMC College of Technology</strong> (Accra, Ghana), où il maîtrise le développement web et le design graphique.
                  </p>
                  <p className="text-[14.5px] text-gray-600 leading-relaxed">
                    Il fonde ensuite <strong className="text-gray-800">Creative Art Afrik</strong>, une structure dédiée à la formation en design et à la production créative. Aujourd'hui, il développe <strong className="text-gray-800">Zando+</strong>, la marketplace <em>made in Congo</em>, ainsi que <strong className="text-gray-800">Zando Food</strong>, dédiée aux restaurants, et contribue au projet <strong className="text-gray-800">OLEM Consulting</strong>.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                  {SKILLS.map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 bg-custom-green-50 text-custom-green-700 text-[12.5px] font-semibold px-3 py-1.5 rounded-full">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </span>
                  ))}
                </div>

                <blockquote className="mt-6 border-l-[3px] border-accent-yellow pl-4 text-[16.5px] text-gray-800"
                  style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                  « Mettre la technologie et l'intelligence artificielle au service du développement économique du Congo. »
                </blockquote>

                <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                  {['Creative Art Afrik', 'Zando Food', 'OLEM Consulting'].map((p) => (
                    <span key={p} className="text-[12.5px] font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Frise chronologique ── */}
            <div className="max-w-2xl mx-auto mt-16 relative pl-7">
              <div className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-gray-200" />
              {TIMELINE.map((item, i) => (
                <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp}
                  transition={{ delay: i * 0.08 }} className="relative pb-9 last:pb-0">
                  <div className="absolute -left-7 top-0.5 w-3 h-3 rounded-full bg-white border-[2.5px] border-custom-green-500" />
                  <div className="text-[11px] font-bold text-custom-green-700 uppercase tracking-wide" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {item.date}
                  </div>
                  <h4 className="mt-1 text-[15.5px] font-bold text-gray-900">{item.title}</h4>
                  <p className="mt-1 text-[13px] text-gray-500 leading-snug max-w-md">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section className="py-20 text-center text-white" style={{ background: BRAND_GRADIENT }}>
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
              Une question&nbsp;? On est joignables.
            </h2>
            <p className="mt-3 text-white/70 max-w-lg mx-auto">
              Notre équipe répond directement, sans standard ni attente.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact" className="rounded-xl bg-accent-yellow px-7 py-3.5 text-sm font-bold text-[#241A00] hover:opacity-90 transition-opacity">
                Nous contacter
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a href={STORE_URLS.ios} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/30 rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-white/10 transition-colors">
                <AppleIcon /> App Store
              </a>
              <a href={STORE_URLS.android} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/30 rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-white/10 transition-colors">
                <PlayIcon /> Google Play
              </a>
            </div>
          </div>
        </section>
      </div>

      {content && <EditAboutImagesDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} initialData={content} onSave={handleSave} />}
    </>
  );
};

export default AboutPage;
