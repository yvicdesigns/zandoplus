import React, { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const ListingHelper = ({ formData, onApply }) => {
  const [open, setOpen]           = useState(false);
  const [keywords, setKeywords]   = useState('');
  const [generated, setGenerated] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setGenerated('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-listing-helper', {
        body: {
          title:       formData.title       || '',
          category:    formData.category    || '',
          subcategory: formData.subcategory || '',
          condition:   formData.condition   || '',
          keywords:    keywords.trim(),
        },
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Erreur inconnue');
      }

      setGenerated(data.description);
    } catch (err) {
      setError("Impossible de générer la description. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    onApply(generated);
    setOpen(false);
    setGenerated('');
    setKeywords('');
  };

  const reset = () => {
    setGenerated('');
    setError('');
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-custom-green-600 hover:text-custom-green-700 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Générer avec l'IA
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-custom-green-500 rounded-md flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Assistant rédaction IA</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Keywords input */}
              {!generated && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">
                      Mots-clés ou caractéristiques à inclure <span className="text-gray-400">(optionnel)</span>
                    </Label>
                    <Textarea
                      value={keywords}
                      onChange={e => setKeywords(e.target.value)}
                      placeholder="Ex: 8 Go RAM, très bon état, chargeur inclus, garantie 6 mois..."
                      rows={2}
                      maxLength={300}
                      className="text-sm resize-none bg-white border-green-200 focus:border-custom-green-400"
                    />
                    <p className="text-xs text-gray-400 text-right">{keywords.length}/300</p>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={generate}
                    disabled={loading || (!formData.title && !keywords.trim())}
                    className="w-full gradient-bg hover:opacity-90 text-white text-sm h-9"
                  >
                    {loading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Génération en cours…</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5 mr-2" /> Générer la description</>
                    )}
                  </Button>

                  {!formData.title && !keywords.trim() && (
                    <p className="text-xs text-amber-600 text-center">
                      Renseignez d'abord un titre ou des mots-clés
                    </p>
                  )}
                </>
              )}

              {/* Generated result */}
              {generated && (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {generated}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={apply}
                      className="flex-1 gradient-bg hover:opacity-90 text-white text-sm h-9"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Utiliser cette description
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={reset}
                      className="h-9 px-3 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Vous pouvez modifier la description après l'avoir utilisée
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingHelper;
