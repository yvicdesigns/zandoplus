import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, Star, Zap, Users, Trophy, CheckCircle2, ChevronRight,
  Smartphone, Wifi, ShoppingBag, Clock, MessageSquare, Shield,
  AlertCircle, Loader2, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateTesterScore } from '@/lib/testerScoring';

// ─── Static data ────────────────────────────────────────────

const BENEFITS = [
  { icon: Zap,          title: 'Accès anticipé complet',       desc: 'Toutes les fonctionnalités, avant tout le monde. Achat Sécurisé, Boost, messagerie — vous testez en premier.' },
  { icon: Trophy,       title: 'Récompenses réelles',          desc: 'Des crédits Zando+ utilisables sur la plateforme. Pas des points virtuels — de vraie valeur FCFA.' },
  { icon: MessageSquare,title: 'Ligne directe fondateur',      desc: 'Vos retours vont directement à Tchissambou Van Yvic. Chaque bug que vous trouvez façonne la version finale.' },
  { icon: Star,         title: 'Statut Pionnier permanent',    desc: 'Votre badge "Testeur Officiel Zando+" restera visible sur votre profil après le lancement public.' },
];

const TIERS = [
  { label: 'Bronze', range: '0 – 149 pts',  reward: 'Accès Beta + Badge Pionnier',          color: 'from-orange-400 to-orange-600',   text: 'text-orange-700', bg: 'bg-orange-50'  },
  { label: 'Silver', range: '150 – 349 pts', reward: 'Crédit Zando+ 5 000 FCFA',            color: 'from-slate-400 to-slate-600',     text: 'text-slate-700',  bg: 'bg-slate-50'   },
  { label: 'Gold',   range: '350 – 599 pts', reward: 'Crédit 15 000 FCFA + Mention app',    color: 'from-yellow-400 to-yellow-600',   text: 'text-yellow-700', bg: 'bg-yellow-50'  },
  { label: 'Elite',  range: '600+ pts',      reward: 'Crédit 30 000 FCFA + Rencontre fondateur', color: 'from-purple-500 to-purple-700', text: 'text-purple-700', bg: 'bg-purple-50' },
];

const MISSIONS_PREVIEW = [
  { pts: 50,  label: 'Publier votre première annonce' },
  { pts: 60,  label: 'Initier un Achat Sécurisé' },
  { pts: 45,  label: 'Soumettre 3 rapports de bugs' },
  { pts: 50,  label: 'Se connecter 7 jours consécutifs' },
  { pts: 40,  label: 'Trouver un bug critique' },
  { pts: 30,  label: 'Premier message à un vendeur' },
];

const ANDROID_VERSIONS = ['7', '8', '9', '10', '11', '12', '13', '14+'];

const FORM_INITIAL = {
  full_name: '', phone: '', email: '',
  device_model: '', android_version: '',
  internet_frequency: '', marketplace_experience: '',
  motivation: '', daily_availability: '',
};

// ─── Component ──────────────────────────────────────────────

const TestersLandingPage = () => {
  const [form, setForm]     = useState(FORM_INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const motLen = form.motivation.trim().length;

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())         e.full_name = 'Nom requis';
    if (!form.phone.trim())             e.phone = 'Téléphone requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.device_model.trim())      e.device_model = 'Modèle requis';
    if (!form.android_version)          e.android_version = 'Version requise';
    if (!form.internet_frequency)       e.internet_frequency = 'Sélectionnez une option';
    if (!form.marketplace_experience)   e.marketplace_experience = 'Sélectionnez une option';
    if (motLen < 100)                   e.motivation = `Minimum 100 caractères (${motLen}/100)`;
    if (motLen > 500)                   e.motivation = `Maximum 500 caractères`;
    if (!form.daily_availability)       e.daily_availability = 'Sélectionnez une option';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { score, breakdown } = calculateTesterScore(form);

      const { error } = await supabase.from('testers').insert({
        ...form,
        score,
        score_breakdown: breakdown,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Candidature déjà reçue', description: 'Cet email a déjà soumis une candidature. Nous reviendrons vers vous sous 48h.', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast({ title: 'Erreur', description: "Impossible d'envoyer votre candidature. Réessayez.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Programme Testeurs Officiels — Zando+ Congo</title>
        <meta name="description" content="Rejoignez les 20 premiers testeurs officiels de Zando+, la marketplace congolaise. Accès anticipé, récompenses et influence directe sur le produit." />
        <link rel="canonical" href="https://www.zandopluscg.com/testeurs" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AnimatePresence mode="wait">
        {submitted ? (
          <SuccessScreen key="success" />
        ) : (
          <motion.div key="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HeroSection />
            <BenefitsSection />
            <TiersSection />
            <MissionsSection />
            <ApplicationForm
              form={form} errors={errors} motLen={motLen}
              loading={loading} set={set} onSubmit={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Hero ────────────────────────────────────────────────────

const HeroSection = () => (
  <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-custom-green-900">
    <div className="absolute inset-0 opacity-10"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2EB565 0%, transparent 60%), radial-gradient(circle at 80% 20%, #16a34a 0%, transparent 50%)' }}
    />
    <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <span className="inline-flex items-center gap-2 bg-custom-green-500/20 text-custom-green-400 border border-custom-green-500/30 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Flame className="w-4 h-4" /> Programme Officiel — Accès Limité
        </span>
      </motion.div>

      <motion.h1
        className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        Devenez l'un des{' '}
        <span className="text-custom-green-400">20 premiers testeurs</span>{' '}
        officiels de Zando+
      </motion.h1>

      <motion.p
        className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        La première marketplace congolaise se construit avec vous.
        Testez en avant-première, signalez les bugs, gagnez des récompenses réelles.
      </motion.p>

      <motion.div
        className="flex flex-wrap justify-center gap-4 mb-10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      >
        {['20 places', 'Réponse sous 48h', '100% gratuit'].map(tag => (
          <span key={tag} className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-full text-sm">
            <CheckCircle2 className="w-4 h-4 text-custom-green-400" /> {tag}
          </span>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <a href="#candidature">
          <Button size="lg" className="gradient-bg hover:opacity-90 text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-green-900/30">
            Soumettre ma candidature <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </a>
        <p className="text-gray-500 text-sm mt-3">Candidatures closes dès que les 20 places sont pourvues</p>
      </motion.div>
    </div>
  </section>
);

// ─── Benefits ────────────────────────────────────────────────

const BenefitsSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ce que vous gagnez</h2>
        <p className="text-gray-500">Les testeurs officiels ont un statut unique sur Zando+</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={i}
            className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-custom-green-200 hover:bg-green-50/30 transition-all"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
          >
            <div className="w-12 h-12 bg-custom-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <b.icon className="w-6 h-6 text-custom-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Tiers ───────────────────────────────────────────────────

const TiersSection = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Système de récompenses</h2>
        <p className="text-gray-500">Plus vous testez et signalez, plus vous montez de niveau</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier, i) => (
          <motion.div
            key={i}
            className={`rounded-2xl border-2 p-6 text-center ${tier.bg} ${i === 3 ? 'border-purple-300 ring-2 ring-purple-200' : 'border-transparent'}`}
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
          >
            {i === 3 && (
              <span className="inline-block bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">Meilleure récompense</span>
            )}
            <div className={`inline-block bg-gradient-to-br ${tier.color} text-white font-bold text-lg px-4 py-1.5 rounded-xl mb-3`}>
              {tier.label}
            </div>
            <p className={`text-sm font-semibold ${tier.text} mb-2`}>{tier.range}</p>
            <p className="text-gray-700 text-sm leading-snug">{tier.reward}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Missions preview ────────────────────────────────────────

const MissionsSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Aperçu des missions</h2>
        <p className="text-gray-500">Des tâches concrètes, chacune avec ses points</p>
      </div>
      <div className="space-y-3">
        {MISSIONS_PREVIEW.map((m, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-5 py-4"
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07 }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm">{m.label}</span>
            </div>
            <span className="bg-custom-green-100 text-custom-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-4">
              +{m.pts} pts
            </span>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-gray-400 text-sm mt-6">+ 4 autres missions débloquées après activation</p>
    </div>
  </section>
);

// ─── Application Form ────────────────────────────────────────

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-semibold text-gray-700">{label}</Label>
    {children}
    {error && (
      <p className="text-red-500 text-xs flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

const Select = ({ value, onChange, error, children, placeholder }) => (
  <select
    value={value} onChange={onChange}
    className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-custom-green-400 transition-colors ${error ? 'border-red-300' : 'border-gray-200'}`}
  >
    <option value="">{placeholder}</option>
    {children}
  </select>
);

const ApplicationForm = ({ form, errors, motLen, loading, set, onSubmit }) => (
  <section id="candidature" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Soumettre ma candidature</h2>
        <p className="text-gray-500">Remplissez ce formulaire — nous examinons chaque dossier dans les 48h</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">

        {/* Identity */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Identité
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom complet *" error={errors.full_name}>
              <Input value={form.full_name} onChange={set('full_name')}
                className={errors.full_name ? 'border-red-300' : ''}
                placeholder="Jean Mbemba" />
            </Field>
            <Field label="Téléphone (Congo) *" error={errors.phone}>
              <Input value={form.phone} onChange={set('phone')}
                className={errors.phone ? 'border-red-300' : ''}
                placeholder="+242 06 000 0000" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Adresse email *" error={errors.email}>
              <Input type="email" value={form.email} onChange={set('email')}
                className={errors.email ? 'border-red-300' : ''}
                placeholder="vous@exemple.com" />
            </Field>
          </div>
        </div>

        {/* Device */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Appareil Android
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Modèle de téléphone *" error={errors.device_model}>
              <Input value={form.device_model} onChange={set('device_model')}
                className={errors.device_model ? 'border-red-300' : ''}
                placeholder="Samsung Galaxy A54" />
            </Field>
            <Field label="Version Android *" error={errors.android_version}>
              <Select value={form.android_version} onChange={set('android_version')}
                error={errors.android_version} placeholder="Sélectionner...">
                {ANDROID_VERSIONS.map(v => <option key={v} value={v}>Android {v}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        {/* Usage */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4" /> Habitudes numériques
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Fréquence d'utilisation d'internet *" error={errors.internet_frequency}>
              <Select value={form.internet_frequency} onChange={set('internet_frequency')}
                error={errors.internet_frequency} placeholder="Sélectionner...">
                <option value="daily">Tous les jours</option>
                <option value="several_times_week">Plusieurs fois / semaine</option>
                <option value="weekly">Une fois / semaine</option>
                <option value="occasional">Occasionnellement</option>
              </Select>
            </Field>
            <Field label="Expérience marketplace *" error={errors.marketplace_experience}>
              <Select value={form.marketplace_experience} onChange={set('marketplace_experience')}
                error={errors.marketplace_experience} placeholder="Sélectionner...">
                <option value="two_or_more">2 apps ou plus (Jumia, Olx…)</option>
                <option value="one">1 app marketplace</option>
                <option value="none">Aucune expérience</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Disponibilité quotidienne *" error={errors.daily_availability}>
              <Select value={form.daily_availability} onChange={set('daily_availability')}
                error={errors.daily_availability} placeholder="Heures par jour...">
                <option value="1">1 heure / jour</option>
                <option value="2">2 heures / jour</option>
                <option value="3">3 heures / jour</option>
                <option value="4+">4 heures ou plus / jour</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Motivation */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Motivation
          </p>
          <Field label="Pourquoi voulez-vous tester Zando+ ? *" error={errors.motivation}>
            <Textarea
              value={form.motivation} onChange={set('motivation')}
              rows={5} maxLength={500}
              className={`resize-none ${errors.motivation ? 'border-red-300' : ''}`}
              placeholder="Parlez-nous de votre intérêt pour Zando+, ce que vous espérez apporter comme testeur, votre expérience avec les marketplaces... (100 caractères minimum)"
            />
            <div className={`text-xs text-right mt-1 ${motLen < 100 ? 'text-gray-400' : motLen > 450 ? 'text-amber-500' : 'text-custom-green-600'}`}>
              {motLen} / 500
            </div>
          </Field>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Vos informations sont confidentielles et ne seront utilisées que pour évaluer votre candidature au programme beta Zando+.</p>
        </div>

        <Button
          type="submit" disabled={loading}
          className="w-full gradient-bg hover:opacity-90 text-white font-semibold py-6 rounded-xl text-base"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Envoi en cours…</>
            : <> Envoyer ma candidature <ChevronRight className="w-5 h-5 ml-1" /></>
          }
        </Button>
      </form>
    </div>
  </section>
);

// ─── Success screen ──────────────────────────────────────────

const SuccessScreen = () => (
  <motion.div
    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-custom-green-900 px-4"
    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
  >
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-custom-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/40">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Candidature reçue !</h1>
      <p className="text-gray-300 leading-relaxed mb-8">
        Votre dossier est entre les mains de l'équipe Zando+. Nous analysons chaque candidature avec soin.
        Vous recevrez une réponse dans les <strong className="text-white">48 heures</strong>.
      </p>
      <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-left mb-8">
        <p className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wide">Et maintenant ?</p>
        {[
          'Votre candidature est en cours d\'évaluation',
          'L\'équipe vous contacte par email sous 48h',
          'Si sélectionné : accès à votre Dashboard Testeur',
          'Début des missions et de la collecte de points',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
            <span className="w-6 h-6 rounded-full bg-custom-green-500/30 text-custom-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <span className="text-gray-300 text-sm">{step}</span>
          </div>
        ))}
      </div>
      <a href="/">
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Retour à l'accueil
        </Button>
      </a>
    </div>
  </motion.div>
);

export default TestersLandingPage;
