import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Menu, X, User, MessageCircle, Plus, Settings, LogOut,
  ShoppingBag, LogIn, LayoutDashboard, Heart, ShoppingCart,
  ShieldCheck, Wallet, KeyRound, ChevronDown, Facebook, Instagram, Music, Store,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMessagesDrawer } from '@/contexts/MessagesDrawerContext';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import useUnreadMessages from '@/hooks/useUnreadMessages';
import { getCategoryEmoji } from '@/components/post-ad/categoryIcons';

/* ── Barre de recherche isolée ── */
const SearchBar = memo(({ onSubmit }) => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autocomplete avec debounce 250ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      let query = supabase
        .from('listings')
        .select('id, title, images, price, currency, listing_slug')
        .eq('status', 'active')
        .ilike('title', `%${q.trim()}%`)
        .limit(6);
      if (cat) query = query.eq('category', cat);
      const { data } = await query;
      setSuggestions(data || []);
      setShowSuggestions(true);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [q, cat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      const params = new URLSearchParams({ search: q.trim() });
      if (cat) params.set('category', cat);
      navigate(`/listings?${params}`);
      setQ(''); setSuggestions([]); setShowSuggestions(false);
      onSubmit?.();
    }
  };

  const handleSuggestionClick = (listing) => {
    navigate(`/listings/${listing.listing_slug || listing.id}`);
    setQ(''); setSuggestions([]); setShowSuggestions(false);
    onSubmit?.();
  };

  return (
    <div ref={wrapperRef} className="flex flex-1 max-w-[560px] relative">
      <form onSubmit={handleSubmit} className="flex w-full border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className="border-r border-gray-200 px-3 text-[13px] text-gray-600 bg-white h-[42px] cursor-pointer outline-none shrink-0 hidden md:block"
        >
          <option value="">Toutes les catégories</option>
          <option value="electronics">Électronique</option>
          <option value="phones-tablets">Téléphones</option>
          <option value="fashion">Mode</option>
          <option value="maison-meubles">Maison</option>
          <option value="vehicles">Véhicules</option>
          <option value="real-estate">Immobilier</option>
          <option value="beaute-soins">Beauté</option>
          <option value="jobs">Emplois</option>
        </select>
        <input
          type="text"
          placeholder="Rechercher un produit, une marque..."
          value={q}
          onChange={e => { setQ(e.target.value); if (!e.target.value.trim()) setShowSuggestions(false); }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="flex-1 px-4 text-[13px] outline-none h-[42px] bg-white min-w-0"
        />
        <button type="submit" className="w-[46px] h-[42px] bg-custom-green-500 text-white flex items-center justify-center hover:bg-custom-green-600 transition-colors shrink-0 rounded-r-2xl">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Dropdown suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-[46px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] overflow-hidden">
          {suggestions.map((listing) => (
            <button
              key={listing.id}
              onMouseDown={() => handleSuggestionClick(listing)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <img
                src={listing.images?.[0] || 'https://placehold.co/40x40/f3f4f6/9ca3af?text=?'}
                alt={listing.title}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{listing.title}</p>
                <p className="text-[11px] text-custom-green-500 font-bold">
                  {(listing.price || 0).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
                </p>
              </div>
              <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </button>
          ))}
          <button
            onMouseDown={handleSubmit}
            className="w-full px-4 py-2.5 text-[12px] font-semibold text-custom-green-600 hover:bg-green-50 border-t border-gray-100 text-center transition-colors"
          >
            Voir tous les résultats pour "{q}"
          </button>
        </div>
      )}
    </div>
  );
});

const Header = memo(({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isLoading, isOAuthPending } = useAuth();
  const authPending = isLoading || isOAuthPending;
  const unreadCount = useUnreadMessages();
  const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { totalItems: cartCount } = useCart();
  const { openMessages } = useMessagesDrawer();

  const userName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar_url || user?.user_metadata?.avatar_url || '';
  const isAdmin = user?.user_metadata?.is_admin || ['admin', 'editor', 'monetisation', 'gestion'].includes(user?.role);
  const initials = userName.charAt(0).toUpperCase();

  const handleLoginClick = useCallback(() => {
    onLoginClick?.();
    setIsMenuOpen(false);
  }, [onLoginClick]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Déconnexion réussie', description: 'À bientôt !' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { label: 'Accueil',                href: '/' },
    { label: 'Offres du jour 🔥',      href: '/listings?daily=true' },
    { label: 'Nouveautés',             href: '/listings?sortBy=newest' },
    { label: 'Meilleures ventes',      href: '/listings?sortBy=popularity' },
    { label: 'Boutiques officielles',  href: '/boutiques-officielles' },
    { label: 'Aide & Support',         href: '/help' },
  ];

  const allCategories = [
    { slug: 'electronics',            name: 'Électronique' },
    { slug: 'phones-tablets',         name: 'Téléphones' },
    { slug: 'vehicles',               name: 'Véhicules' },
    { slug: 'real-estate',            name: 'Immobilier' },
    { slug: 'fashion',                name: 'Mode' },
    { slug: 'jobs',                   name: 'Emplois' },
    { slug: 'maison-meubles',         name: 'Maison & Meubles' },
    { slug: 'beaute-soins',           name: 'Beauté & Soins' },
    { slug: 'services',               name: 'Services' },
    { slug: 'loisirs-sports',         name: 'Loisirs & Sports' },
    { slug: 'bebes-enfants',          name: 'Bébés & Enfants' },
    { slug: 'animaux',                name: 'Animaux' },
    { slug: 'agro-alimentaire',       name: 'Agroalimentaire' },
    { slug: 'traditional-medicine',   name: 'Médecine Traditionnelle' },
    { slug: 'equipement-commercial',  name: 'Équipement Commercial' },
    { slug: 'reparation-construction',name: 'Réparation' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] bg-card-bg">

      {/* ── 1. Barre d'annonces verte ── */}
      <div className="bg-custom-green-500 text-white text-[12px] font-medium hidden md:block">
        <div className="max-w-[1280px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span>{siteSettings?.ann_msg1 || '🚚 Livraison rapide à Brazzaville et partout au Congo'}</span>
            <div className="w-px h-3.5 bg-white/25" />
            <span>{siteSettings?.ann_msg2 || '🔒 Paiements 100% sécurisés'}</span>
            <div className="w-px h-3.5 bg-white/25" />
            <span>{siteSettings?.ann_msg3 || '🎧 Service client à votre écoute'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-white/70 text-[11px]">Suivez-nous</span>
            <a href="https://www.facebook.com/profile.php?id=61577391354742" target="_blank" rel="noopener noreferrer"
              className="w-[22px] h-[22px] bg-white/15 rounded flex items-center justify-center hover:bg-white/25 transition-colors">
              <Facebook className="w-3 h-3 text-white" />
            </a>
            <a href="https://www.instagram.com/zandopluscongo/" target="_blank" rel="noopener noreferrer"
              className="w-[22px] h-[22px] bg-white/15 rounded flex items-center justify-center hover:bg-white/25 transition-colors">
              <Instagram className="w-3 h-3 text-white" />
            </a>
            <a href="https://www.tiktok.com/@zandopluscongo" target="_blank" rel="noopener noreferrer"
              className="w-[22px] h-[22px] bg-white/15 rounded flex items-center justify-center hover:bg-white/25 transition-colors">
              <Music className="w-3 h-3 text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Header principal blanc ── */}
      <div className="bg-card-bg border-b border-gray-200">

        {/* ── Mobile uniquement : burger | logo centré | panier ── */}
        <div className="md:hidden flex items-center px-4 py-3 relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 z-10 shrink-0">
            {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 z-10">
            {siteSettingsLoading ? <Skeleton className="h-7 w-20" /> : siteSettings?.logo_url
              ? <img src={siteSettings.logo_url} alt="Zando+" className="h-8 w-auto object-contain" />
              : <span className="text-[22px] font-black text-custom-green-500 leading-none">Zando<span className="text-accent-yellow">+</span></span>
            }
          </Link>
          <Link to="/cart" className="ml-auto relative p-1 z-10 shrink-0">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-[3px] bg-custom-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-card-bg">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* ── Desktop : layout inchangé ── */}
        <div className="hidden md:flex max-w-[1280px] mx-auto px-6 py-3 items-center gap-5">

          {/* Logo */}
          <Link to="/" className="flex flex-col shrink-0 text-decoration-none">
            {siteSettingsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : siteSettings?.logo_url ? (
              <img src={siteSettings.logo_url} alt="Zando+" className="h-10 w-auto object-contain" />
            ) : (
              <>
                <span className="text-[28px] font-black text-custom-green-500 leading-none tracking-tight">
                  Zando<span className="text-accent-yellow">+</span>
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5 leading-none">{siteSettings?.site_tagline || 'Plus de ventes, moins de tracas'}</span>
              </>
            )}
          </Link>

          {/* Barre de recherche */}
          <div className="flex-1 hidden md:flex justify-center">
            <SearchBar onSubmit={() => setIsMenuOpen(false)} />
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0">
            {authPending ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <>
                {/* Notifications */}
                <NotificationsPopover />

                {/* Messages — ouvre le drawer */}
                <button onClick={() => user ? openMessages() : onLoginClick()} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-custom-green-500 transition-colors cursor-pointer">
                  <div className="relative shrink-0">
                    <MessageCircle className="w-[22px] h-[22px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-[6px] -right-[8px] min-w-[17px] h-[17px] px-[3px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-card-bg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none">Non lus</p>
                    <p className="text-[13px] font-bold leading-snug">Messages</p>
                  </div>
                </button>

                {/* Panier */}
                <Link to="/cart" className="relative hidden md:flex items-center gap-2 text-gray-600 hover:text-custom-green-500 transition-colors">
                  <div className="relative shrink-0">
                    <ShoppingCart className="w-[22px] h-[22px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-[6px] -right-[8px] min-w-[17px] h-[17px] px-[3px] bg-custom-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-card-bg">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none">Mon</p>
                    <p className="text-[13px] font-bold leading-snug">Panier</p>
                  </div>
                </Link>

                {/* Avatar + dropdown */}
                <div className="relative group hidden md:block">
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="w-8 h-8 border-2 border-gray-200 group-hover:border-custom-green-400 transition-colors shrink-0">
                      <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Mon compte</p>
                      <p className="text-[13px] font-bold leading-snug max-w-[80px] truncate">{userName.split(' ')[0]}</p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-bold text-sm truncate">{userName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1.5">
                      {/* Espace vendeur — visible si vendeur ou admin */}
                      {(user?.is_seller || isAdmin) && (
                        <Link to="/espace-vendeur" className="flex items-center px-3 py-2 mx-1.5 mb-1 text-[13px] font-bold text-white bg-custom-green-500 hover:bg-custom-green-600 rounded-lg transition-colors">
                          <Store className="w-4 h-4 mr-2.5" />
                          Espace vendeur
                        </Link>
                      )}
                      {/* Bloc compte */}
                      {[
                        { to: '/profile',      icon: User,          label: 'Mon Profil'       },
                        { to: null, icon: MessageCircle, label: 'Mes Messages', action: openMessages },
                        { to: '/transactions', icon: ShieldCheck,   label: 'Mes Commandes' },
                        { to: '/wallet',       icon: Wallet,        label: 'Mon Portefeuille' },
                      ].map(({ to, icon: Icon, label, action }) => (
                        action ? (
                          <button key={label} onClick={action} className="flex items-center w-full px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-custom-green-500 transition-colors text-left">
                            <Icon className="w-4 h-4 mr-2.5 opacity-60" />
                            {label}
                          </button>
                        ) : (
                          <Link key={to} to={to} className="flex items-center px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-custom-green-500 transition-colors">
                            <Icon className="w-4 h-4 mr-2.5 opacity-60" />
                            {label}
                          </Link>
                        )
                      ))}
                      {/* Dashboard Admin séparé */}
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center px-3 py-2 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-custom-green-500 transition-colors border-t border-gray-100 mt-1">
                          <LayoutDashboard className="w-4 h-4 mr-2.5 opacity-60" />
                          Dashboard Admin
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-gray-100">
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>

                {/* Publier */}
                <Link to={user?.is_seller || isAdmin ? "/post-ad" : "/devenir-vendeur"} className="hidden md:block shrink-0">
                  <button className="h-[38px] px-5 bg-custom-green-500 text-white text-[13px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-custom-green-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    Publier
                  </button>
                </Link>
              </>
            ) : (
              <>
                {/* Compte (visiteur) */}
                <button onClick={handleLoginClick} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-custom-green-500 transition-colors">
                  <User className="w-[22px] h-[22px] shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Se connecter</p>
                    <p className="text-[13px] font-bold leading-snug">Mon compte</p>
                  </div>
                </button>

                {/* Favoris (visiteur) */}
                <button onClick={handleLoginClick} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-custom-green-500 transition-colors">
                  <Heart className="w-[22px] h-[22px] shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Mes</p>
                    <p className="text-[13px] font-bold leading-snug">Favoris</p>
                  </div>
                </button>

                {/* Panier (visiteur) */}
                <Link to="/cart" className="hidden md:flex items-center gap-2 text-gray-600 hover:text-custom-green-500 transition-colors">
                  <div className="relative shrink-0">
                    <ShoppingCart className="w-[22px] h-[22px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-[6px] -right-[8px] min-w-[17px] h-[17px] px-[3px] bg-custom-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-card-bg">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Mon</p>
                    <p className="text-[13px] font-bold leading-snug">Panier</p>
                  </div>
                </Link>
              </>
            )}

            {/* Burger mobile */}
            <button className="md:hidden p-1" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <div className="md:hidden px-5 pb-3">
          <SearchBar onSubmit={() => setIsMenuOpen(false)} />
        </div>
      </div>

      {/* ── 3. Navbar verte ── */}
      <div className="bg-card-bg border-b border-gray-200 hidden md:block">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center">

          {/* Bouton toutes catégories */}
          <div className="relative group shrink-0 mr-1">
            <button className="flex items-center gap-2 bg-custom-green-500 text-white text-[13px] font-semibold px-4 py-3 rounded-md hover:bg-custom-green-600 transition-colors">
              <Menu className="w-4 h-4" />
              Toutes les catégories
            </button>
            {/* Dropdown catégories */}
            <div className="absolute left-0 top-full w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
              {allCategories.map(({ slug, name }) => (
                <Link
                  key={slug}
                  to={`/listings?category=${slug}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-custom-green-500 transition-colors"
                >
                  <span className="text-base">{getCategoryEmoji(slug)}</span>
                  {name}
                </Link>
              ))}
            </div>
          </div>

          {/* Liens de navigation */}
          <nav className="flex items-center">
            {navLinks.map(({ label, href }) => {
              const isActive = location.pathname === href || (href !== '/' && location.pathname + location.search === href);
              return (
                <Link
                  key={href}
                  to={href}
                  className={`px-3.5 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-custom-green-500 border-custom-green-500 font-bold'
                      : 'text-gray-500 border-transparent hover:text-custom-green-500 hover:border-custom-green-200'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden"
          >
            <div className="px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-h-[calc(100dvh-8rem-env(safe-area-inset-top))] overflow-y-auto">
              {/* Catégories */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Catégories</p>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {allCategories.slice(0, 12).map(({ slug, name }) => (
                  <Link
                    key={slug}
                    to={`/listings?category=${slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl hover:bg-gray-50 text-center"
                  >
                    <span className="text-2xl">{getCategoryEmoji(slug)}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{name}</span>
                  </Link>
                ))}
              </div>

              {/* Navigation */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Navigation</p>
              <div className="flex flex-col gap-1 mb-4">
                {navLinks.map(({ label, href }) => (
                  <Link key={href} to={href} onClick={() => setIsMenuOpen(false)}
                    className="py-2.5 px-3 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg">
                    {label}
                  </Link>
                ))}
              </div>

              {/* Compte */}
              {!authPending && user ? (
                <div className="border-t border-gray-100 pt-4 space-y-1">
                  {/* Espace vendeur — visible si vendeur ou admin */}
                  {(user?.is_seller || isAdmin) && (
                    <Link to="/espace-vendeur" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2.5 px-3 text-[13px] font-bold text-white bg-custom-green-500 hover:bg-custom-green-600 rounded-lg transition-colors mb-1">
                      <Store className="w-4 h-4 mr-2.5" />
                      Espace vendeur
                    </Link>
                  )}
                  {[
                    { to: '/profile',      icon: User,          label: 'Mon Profil'       },
                    { to: null,            icon: MessageCircle, label: 'Mes Messages',     action: () => { setIsMenuOpen(false); openMessages(); } },
                    { to: '/cart',         icon: ShoppingCart,  label: 'Mon Panier'       },
                    { to: '/transactions', icon: ShieldCheck,   label: 'Mes Commandes' },
                    { to: '/wallet',       icon: Wallet,        label: 'Mon Portefeuille' },
                  ].map(({ to, icon: Icon, label, action }) => action ? (
                    <button key={label} onClick={action}
                      className="flex items-center w-full py-2.5 px-3 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                      <Icon className="w-4 h-4 mr-2.5 opacity-60" />{label}
                    </button>
                  ) : (
                    <Link key={to} to={to} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2.5 px-3 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg">
                      <Icon className="w-4 h-4 mr-2.5 opacity-60" />
                      {label}
                    </Link>
                  )
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2.5 px-3 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg border-t border-gray-100 mt-1">
                      <LayoutDashboard className="w-4 h-4 mr-2.5 opacity-60" />
                      Dashboard Admin
                    </Link>
                  )}
                  <Link to={user?.is_seller || isAdmin ? "/post-ad" : "/devenir-vendeur"} onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full mt-2 h-[42px] bg-custom-green-500 text-white font-bold text-[13px] rounded-lg flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Publier une annonce
                    </button>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center w-full py-2.5 px-3 text-[13px] text-red-500 hover:bg-red-50 rounded-lg mt-1">
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Déconnexion
                  </button>
                </div>
              ) : !authPending ? (
                <div className="border-t border-gray-100 pt-4">
                  <button onClick={handleLoginClick}
                    className="w-full h-[42px] bg-custom-green-500 text-white font-bold text-[13px] rounded-lg flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" /> Connexion / Inscription
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});

export default Header;
