import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const Footer = () => {
  const { user, openAuthModal } = useAuth();
  const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();

  const categories = [
    { label: 'Électronique',      href: '/listings?category=electronics' },
    { label: 'Mode',              href: '/listings?category=fashion' },
    { label: 'Maison & Meubles',  href: '/listings?category=maison-meubles' },
    { label: 'Beauté',            href: '/listings?category=services' },
    { label: 'Accessoires',       href: '/listings?category=fashion' },
    { label: 'Chaussures',        href: '/listings?category=fashion' },
    { label: 'Santé & bien-être', href: '/listings?category=traditional-medicine' },
  ];

  const about = [
    { label: 'Qui sommes-nous ?', href: '/about' },
    { label: 'Devenir vendeur',   href: '/post-ad' },
    { label: 'Changelog',         href: '/changelog' },
    { label: 'Contact',           href: '/contact' },
  ];

  const support = [
    { label: 'Centre d\'aide',          href: '/help' },
    { label: 'Livraison & Retours',     href: '/help' },
    { label: 'Paiement',                href: '/help' },
    { label: 'FAQ',                     href: '/help' },
    { label: 'Contactez-nous',          href: '/contact' },
  ];

  const legal = [
    { label: 'Conditions générales',          href: '/terms' },
    { label: 'Politique de confidentialité',  href: '/privacy' },
    { label: 'Mentions légales',              href: '/terms' },
    { label: 'Rapport d\'audit',              href: '/audit-report' },
  ];

  const socials = [
    { icon: Facebook,  href: 'https://www.facebook.com/profile.php?id=61577391354742', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/zandopluscongo/',               label: 'Instagram' },
    { icon: Music,     href: 'https://www.tiktok.com/@zandopluscongo',                  label: 'TikTok' },
  ];

  const Col = ({ title, links }) => (
    <div>
      <h4 className="text-[13px] font-extrabold text-gray-900 mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(({ label, href, action }) => (
          <li key={label}>
            {href ? (
              <Link to={href} className="text-[12px] text-gray-500 hover:text-custom-green-500 transition-colors">
                {label}
              </Link>
            ) : (
              <button onClick={action} className="text-[12px] text-gray-500 hover:text-custom-green-500 transition-colors text-left">
                {label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-card-bg border-t border-gray-200">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* ── Colonnes ── */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Colonne logo */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-block mb-3">
              {!siteSettingsLoading && siteSettings?.footer_logo_url ? (
                <img src={siteSettings.footer_logo_url} alt="Zando+" className="h-9" />
              ) : (
                <span className="text-[26px] font-black text-custom-green-500 leading-none">
                  Zando<span className="text-accent-yellow">+</span>
                </span>
              )}
            </Link>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-4 max-w-[200px]">
              Votre marketplace de confiance au Congo. Des milliers de produits de qualité à prix imbattables.
            </p>
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-custom-green-500 rounded-lg flex items-center justify-center hover:bg-custom-green-600 transition-colors"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          <Col title="Catégories"         links={categories} />
          <Col title="À propos"           links={about} />
          <Col title="Aide & Support"     links={support} />
          <Col title="Informations légales" links={legal} />
        </div>

        {/* ── Bas de page ── */}
        <div className="border-t border-gray-200 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} Zando+. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded border border-gray-200 text-[#1a1f71]">VISA</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded border border-gray-200 text-[#eb001b]">MC</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-800 text-[#ffcc00] border-gray-800">MTN</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#e8001a] text-white border-[#e8001a]">Airtel</span>
            <span className="text-[11px] text-gray-400 ml-1">🔒 Paiements 100% sécurisés</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold">
            🇨🇬 Congo (CG)
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
