import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SearchX, Home, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page introuvable - Zando+ Congo</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20 bg-page-bg">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <SearchX className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Page introuvable</h1>
        <p className="text-[14px] text-gray-500 max-w-md mb-8">
          Le lien que vous avez suivi est peut-être cassé, ou la page a été déplacée ou supprimée.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gradient-bg hover:opacity-90">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/listings">
              <Store className="w-4 h-4 mr-2" />
              Explorer les annonces
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
