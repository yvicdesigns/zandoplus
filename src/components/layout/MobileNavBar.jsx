import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Plus, MessageSquare, User } from 'lucide-react';
import { isMobile } from 'react-device-detect';
import { motion } from 'framer-motion';
import useUnreadMessages from '@/hooks/useUnreadMessages';

const MobileNavBar = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessages();

  if (!isMobile) {
    return null;
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/listings', icon: LayoutGrid, label: 'Annonces' },
    { path: 'PLUS_BUTTON', icon: Plus, label: 'Ajouter' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];
  
  const NavItem = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname === path;
    return (
      <NavLink
        to={path}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center space-y-1 w-full transition-colors duration-200 ${
            isActive ? 'text-custom-green-500' : 'text-gray-500'
          }`
        }
      >
        <Icon className={`h-6 w-6 ${isActive ? 'text-custom-green-500' : ''}`} />
        <span className="text-xs font-medium">{label}</span>
      </NavLink>
    );
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item, index) => {
          if (item.path === 'PLUS_BUTTON') {
            return (
              <div key="plus-button" className="relative w-1/5 flex justify-center">
                <Link
                  to="/post-ad"
                  className="absolute bottom-1 flex items-center justify-center w-14 h-14 rounded-full gradient-bg text-white shadow-lg transform transition-transform hover:scale-110"
                >
                  <Plus className="h-8 w-8" />
                </Link>
              </div>
            );
          }
          return (
            <div key={item.path} className="w-1/5 relative">
              <NavItem {...item} />
              {item.path === '/messages' && unreadCount > 0 && (
                <span className="absolute top-0 right-3 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobileNavBar;