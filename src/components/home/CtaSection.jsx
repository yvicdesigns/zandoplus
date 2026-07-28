import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ShoppingBag } from 'lucide-react';

const CtaSection = () => (
  <section className="py-6 bg-page-bg">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="bg-custom-green-500 rounded-2xl px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-[22px] font-black text-white leading-tight mb-2">
            Prêt à commencer à vendre ?
          </h2>
          <p className="text-[13px] text-white/75 max-w-lg leading-relaxed">
            Rejoignez des milliers de vendeurs sur Zando+. Publiez votre première annonce
            gratuitement et atteignez des acheteurs partout au Congo.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link
            to="/post-ad"
            className="flex items-center gap-2 bg-accent-yellow text-[#1a1200] font-bold text-[13px] px-5 py-3 rounded-xl hover:brightness-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Publier une annonce
          </Link>
          <Link
            to="/listings"
            className="flex items-center gap-2 bg-white/15 text-white font-semibold text-[13px] px-5 py-3 rounded-xl hover:bg-white/25 transition-all border border-white/20"
          >
            <ShoppingBag className="w-4 h-4" />
            Parcourir les annonces
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default CtaSection;
