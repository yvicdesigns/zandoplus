import React, { useState, useEffect, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, User, MessageCircle, Plus, Settings, LogOut, ShoppingBag, LogIn, LayoutDashboard, ChevronDown, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import useUnreadMessages from '@/hooks/useUnreadMessages';

// Isolated SearchForm component to prevent parent re-renders on keystroke
const SearchForm = memo(({ className, onSearchSubmit, initialValue = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      if (onSearchSubmit) onSearchSubmit();
    }
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative w-full">
        <Input 
          type="text" 
          placeholder="Rechercher des produits..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-custom-green-200 focus:border-custom-green-400 bg-white shadow-sm transition-colors duration-200" 
          autoComplete="off"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-custom-green-400 w-5 h-5 pointer-events-none" />
        <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6 gradient-bg hover:opacity-90">
          Rechercher
        </Button>
      </div>
    </form>
  );
});

const Header = memo(({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const unreadCount = useUnreadMessages();
  const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);

  // Directly derive display values to avoid useEffect flickering
  const userName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar_url || user?.user_metadata?.avatar_url || '';
  const isAdmin = user?.user_metadata?.is_admin || user?.role === 'admin' || false;
  const UserAvatarFallback = userName ? userName.charAt(0).toUpperCase() : 'U';
  const logoUrl = siteSettings?.logo_url;

  // Optimized scroll handler with throttling and hysteresis
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(prev => {
            // Hysteresis buffer to prevent rapid toggling
            if (scrollY > 20 && !prev) return true;
            if (scrollY < 10 && prev) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = useCallback(() => {
    if (onLoginClick) onLoginClick();
    if (isMenuOpen) setIsMenuOpen(false);
  }, [onLoginClick, isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message || "Une erreur s'est produite.",
        variant: "destructive"
      });
    }
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleSearchSubmit = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const mainCategories = [
    { name: 'Électronique', path: '/listings?category=electronics' },
    { name: 'Véhicules', path: '/listings?category=vehicles' },
    { name: 'Immobilier', path: '/listings?category=real-estate' },
    { name: 'Mode', path: '/listings?category=fashion' },
    { name: 'Emplois', path: '/listings?category=jobs' },
    { name: 'Services', path: '/listings?category=services' }
  ];

  const moreCategories = [
    { name: 'Agroalimentaire', path: '/listings?category=agro-alimentaire' },
    { name: 'Médecine traditionnelle', path: '/listings?category=traditional-medicine' }
  ];

  return (
    <header 
      className={`sticky top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        isScrolled || isMenuOpen ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      } pt-[env(safe-area-inset-top)]`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            {siteSettingsLoading ? (
              <Skeleton className="h-8 md:h-10 lg:h-12 w-24" />
            ) : logoUrl ? (
                <img src={logoUrl} alt="Logo Zando+" className="h-8 md:h-10 lg:h-12 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-custom-green-500 to-custom-green-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            )}
          </Link>

          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <SearchForm />
          </div>

          <nav className="hidden lg:flex items-center space-x-4 shrink-0">
            {!isLoading && user ? (
              <>
                <Link to="/post-ad">
                  <Button className="gradient-bg hover:opacity-90 rounded-full px-6 transition-opacity">
                    <Plus className="w-4 h-4 mr-2" />
                    Publier
                  </Button>
                </Link>
                <Link to="/messages" className="relative group">
                  <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-custom-green-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
                <NotificationsPopover />
                <div className="relative group">
                  <Avatar className="cursor-pointer w-10 h-10 border-2 border-transparent group-hover:border-custom-green-200 transition-all">
                    <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
                    <AvatarFallback>{UserAvatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
                    <div className="p-3 border-b">
                      <p className="font-semibold text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <div className="py-2">
                      <Link to="/profile" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                        <User className="w-4 h-4 mr-2" />
                        Mon Profil
                      </Link>
                      <Link to="/messages" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mes Messages
                      </Link>
                      <Link to="/settings" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Tableau de Bord Admin
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : !isLoading && !user ? (
              <div className="flex items-center space-x-4">
                <Link to="/reset-password" className="text-sm font-medium text-gray-500 hover:text-custom-green-600 transition-colors">
                  Mot de passe oublié ?
                </Link>
                <Button onClick={handleLoginClick} className="gradient-bg hover:opacity-90 rounded-full px-6 transition-opacity">
                  <LogIn className="w-4 h-4 mr-2" />
                  Connexion / Inscription
                </Button>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            )}
          </nav>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        <div className="hidden md:flex items-center justify-center space-x-8 py-3 border-t border-green-100">
          {mainCategories.map(category => (
            <Link key={category.name} to={category.path} className="text-sm font-medium text-gray-600 hover:text-custom-green-600 transition-colors">
              {category.name}
            </Link>
          ))}
          {moreCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium text-gray-600 hover:text-custom-green-600 transition-colors outline-none focus:outline-none">
                Plus
                <ChevronDown className="w-4 h-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {moreCategories.map(category => (
                  <DropdownMenuItem key={category.name} asChild>
                    <Link to={category.path}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-green-100 shadow-lg overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="mb-4">
                <SearchForm onSearchSubmit={handleSearchSubmit} />
              </div>

              <div className="flex flex-col space-y-1 mb-4">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Catégories</p>
                {mainCategories.map(category => (
                  <Link key={category.name} to={category.path} className="text-sm font-medium text-gray-600 hover:text-custom-green-600 py-2 px-3 rounded-lg hover:bg-custom-green-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {category.name}
                  </Link>
                ))}
                {moreCategories.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Plus</p>
                    {moreCategories.map(category => (
                      <Link key={category.name} to={category.path} className="text-sm font-medium text-gray-600 hover:text-custom-green-600 py-2 px-3 rounded-lg hover:bg-custom-green-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        {category.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>

              {!isLoading && user ? (
                <div className="space-y-2">
                  <Link to="/post-ad" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full gradient-bg hover:opacity-90 rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Publier Annonce
                    </Button>
                  </Link>
                  <Link to="/profile" className="flex items-center py-2 px-3 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Mon Profil
                  </Link>
                  <Link to="/messages" className="flex items-center justify-between py-2 px-3 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Mes Messages
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/settings" className="flex items-center py-2 px-3 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center py-2 px-3 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Tableau de Bord Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center w-full py-2 px-3 text-sm hover:bg-gray-50 rounded-lg text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              ) : !isLoading && !user ? (
                <div className="space-y-3">
                  <Button onClick={handleLoginClick} className="w-full gradient-bg hover:opacity-90 rounded-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Connexion / Inscription
                  </Button>
                  <Link 
                    to="/reset-password" 
                    className="flex items-center justify-center py-2 px-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Mot de passe oublié ?
                  </Link>
                </div>
              ) : (
                <div className="flex justify-center items-center p-4">
                  <div className="w-8 h-8 border-4 border-custom-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});

export default Header;