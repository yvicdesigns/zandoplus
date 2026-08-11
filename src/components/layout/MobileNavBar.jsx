import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Plus, Wallet, User } from 'lucide-react';
import { isMobile } from 'react-device-detect';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const MobileNavBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.is_admin || ['admin', 'editor', 'monetisation', 'gestion'].includes(user?.role);
  const plusTarget = user?.is_seller || isAdmin ? '/post-ad' : '/devenir-vendeur';

  if (!isMobile) return null;

  const navItems = [
    { path: '/',         icon: Home,       label: 'Accueil'      },
    { path: '/listings', icon: LayoutGrid,  label: 'Annonce'      },
    { path: 'PLUS',      icon: Plus,        label: null           },
    { path: '/wallet',   icon: Wallet,      label: 'Portefeuille' },
    { path: '/profile',  icon: User,        label: 'Compte'       },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          if (item.path === 'PLUS') {
            return (
              <div key="plus" className="relative flex justify-center w-1/5 -translate-y-3">
                <Link
                  to={plusTarget}
                  className="w-14 h-14 rounded-full bg-custom-green-500 flex items-center justify-center shadow-lg shadow-custom-green-500/30 border-4 border-white"
                >
                  <Plus className="w-7 h-7 text-white stroke-[2.5]" />
                </Link>
              </div>
            );
          }

          const isActive = location.pathname === item.path
            || (item.path === '/listings' && location.pathname === '/listings');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 w-1/5 py-2"
            >
              {({ isActive: navActive }) => {
                const active = navActive || isActive;
                return (
                  <>
                    <item.icon
                      className={`w-[22px] h-[22px] ${active ? 'text-custom-green-500' : 'text-gray-400'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    <span className={`text-[10px] font-semibold leading-none ${active ? 'text-custom-green-500' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobileNavBar;
