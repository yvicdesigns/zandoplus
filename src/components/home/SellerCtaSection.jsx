import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

// Carte "Créer ma boutique" sur l'accueil — beaucoup de clients demandent
// directement (WhatsApp, Instagram...) comment ouvrir leur boutique sans
// trouver le chemin dans l'app (caché derrière le bouton "Publier"). Cachée
// pour ceux qui sont déjà vendeurs/admin, visible pour les acheteurs et les
// visiteurs non connectés (le clic les mène vers /devenir-vendeur, qui invite
// à se connecter si besoin).
const SellerCtaSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.is_admin || ['admin', 'editor', 'monetisation', 'gestion'].includes(user?.role);

  if (user?.is_seller || isAdmin) return null;

  return (
    <section className="container mx-auto px-4 py-2">
      <button
        onClick={() => navigate('/devenir-vendeur')}
        className="w-full relative overflow-hidden rounded-2xl text-left p-6 sm:p-8 bg-gradient-to-br from-custom-green-500 to-custom-green-600 text-white group"
      >
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-10 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative max-w-md">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent-yellow mb-1.5">
            Gratuit · Sans abonnement
          </p>
          <h3 className="text-lg sm:text-xl font-black mb-1.5">
            Créez votre boutique sur Zando+
          </h3>
          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            Publiez vos produits, discutez avec vos acheteurs et recevez vos paiements en toute sécurité.
          </p>
          <span className="inline-flex items-center gap-1.5 bg-white text-custom-green-600 font-extrabold text-sm rounded-full px-4 py-2 group-hover:gap-2.5 transition-all">
            Créer ma boutique <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </button>
    </section>
  );
};

export default SellerCtaSection;
