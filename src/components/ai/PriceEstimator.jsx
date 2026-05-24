import React, { useState } from 'react';
import { Sparkles, Loader2, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const formatFCFA = (n) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

const PriceEstimator = ({ formData, onApply }) => {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const canEstimate = formData.title || formData.category;

  const estimate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-price-estimator', {
        body: {
          title:       formData.title       || '',
          category:    formData.category    || '',
          subcategory: formData.subcategory || '',
          condition:   formData.condition   || '',
          description: formData.description || '',
        },
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Erreur inconnue');
      }

      setResult(data);
    } catch {
      setError("Impossible d'estimer le prix. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    onApply(String(result.suggested_price));
    setResult(null);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={estimate}
        disabled={loading || !canEstimate}
        className="flex items-center gap-1.5 text-xs font-medium text-custom-green-600 hover:text-custom-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <TrendingUp className="w-3.5 h-3.5" />
        }
        {loading ? 'Estimation en cours…' : 'Estimer avec l\'IA'}
      </button>

      <AnimatePresence>
        {(result || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-3"
          >
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </p>
            )}

            {result && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-custom-green-500 rounded-md flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Estimation IA</p>
                </div>

                {/* Price range */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-center flex-1 bg-white rounded-lg py-2 px-3 border border-green-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Min</p>
                    <p className="text-sm font-bold text-gray-700">{formatFCFA(result.min_price)}</p>
                  </div>

                  <div className="text-center flex-1 bg-custom-green-500 rounded-lg py-2 px-3 shadow-sm shadow-green-300">
                    <p className="text-[10px] text-green-100 uppercase tracking-wide mb-0.5">Suggéré</p>
                    <p className="text-sm font-bold text-white">{formatFCFA(result.suggested_price)}</p>
                  </div>

                  <div className="text-center flex-1 bg-white rounded-lg py-2 px-3 border border-green-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Max</p>
                    <p className="text-sm font-bold text-gray-700">{formatFCFA(result.max_price)}</p>
                  </div>
                </div>

                {/* Reasoning */}
                {result.reasoning && (
                  <p className="text-xs text-gray-600 leading-relaxed border-t border-green-200 pt-3">
                    {result.reasoning}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={apply}
                    className="flex-1 gradient-bg hover:opacity-90 text-white text-xs h-8"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Utiliser {formatFCFA(result.suggested_price)}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="text-xs h-8 px-3 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Ignorer
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceEstimator;
