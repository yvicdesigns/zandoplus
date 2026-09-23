import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, MessageCircle, Phone, ChevronRight } from 'lucide-react';

const HelpContactBlock = () => (
  <div className="mt-16 p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
    <div className="text-center mb-8">
      <LifeBuoy className="w-12 h-12 text-custom-green-500 mx-auto mb-3" />
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Vous ne trouvez pas de réponse ?</h3>
      <p className="text-gray-600">Notre équipe est disponible pour vous aider. Choisissez le canal qui vous convient le mieux.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <a
        href="https://wa.me/242064623778?text=Bonjour%20Zando%2B%2C%20j'ai%20besoin%20d'aide."
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-5 bg-white rounded-xl border border-green-200 hover:border-green-400 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-800">WhatsApp</p>
          <p className="text-green-600 font-semibold text-sm">+242 06 462 37 78</p>
          <p className="text-gray-500 text-xs mt-0.5">Réponse rapide · 7j/7</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" />
      </a>
      <Link
        to="/contact"
        className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-custom-green-300 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 bg-custom-green-100 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Phone className="w-6 h-6 text-custom-green-600" />
        </div>
        <div>
          <p className="font-bold text-gray-800">Formulaire de contact</p>
          <p className="text-gray-500 text-sm">Envoyer un message écrit</p>
          <p className="text-gray-400 text-xs mt-0.5">Réponse sous 24h</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-custom-green-500 transition-colors" />
      </Link>
    </div>
  </div>
);

export default HelpContactBlock;
