import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';

const HelpSupportBanner = () => (
  <div className="bg-green-50 border-y border-green-200">
    <div className="container mx-auto px-4 max-w-4xl py-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Besoin d'aide rapidement ?</p>
            <p className="text-gray-600 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Réponse en moins d'1h via WhatsApp
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/242064623778?text=Bonjour%20Zando%2B%2C%20j'ai%20besoin%20d'aide."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-full transition-colors text-sm shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp : +242 06 462 37 78
        </a>
      </div>
    </div>
  </div>
);

export default HelpSupportBanner;
