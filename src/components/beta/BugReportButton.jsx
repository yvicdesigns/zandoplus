import React, { useState } from 'react';
import { Bug, X, Loader2, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useTesterStatus } from '@/hooks/useTesterStatus';

const POINTS_BY_SEVERITY = { critical: 40, major: 25, minor: 15, suggestion: 10 };

const Select = ({ value, onChange, children, placeholder }) => (
  <select
    value={value} onChange={onChange}
    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-custom-green-400"
  >
    <option value="">{placeholder}</option>
    {children}
  </select>
);

const BugReportButton = () => {
  const { tester, isActiveTester } = useTesterStatus();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [form, setForm] = useState({ category: '', severity: '', description: '' });
  const [error, setError] = useState('');
  const { toast } = useToast();

  if (!isActiveTester) return null;

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleOpen = () => { setOpen(true); setDone(false); setError(''); setForm({ category: '', severity: '', description: '' }); setScreenshot(null); };
  const handleClose = () => setOpen(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Screenshot max 5MB'); return; }
    setScreenshot(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.severity) { setError('Catégorie et sévérité requises'); return; }
    if (form.description.trim().length < 20) { setError('Description trop courte (min 20 caractères)'); return; }
    setLoading(true);
    setError('');

    try {
      let screenshotUrl = null;

      if (screenshot) {
        const ext  = screenshot.name.split('.').pop();
        const path = `${tester.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('bug-screenshots')
          .upload(path, screenshot, { cacheControl: '3600' });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('bug-screenshots').getPublicUrl(path);
          screenshotUrl = publicUrl;
        }
      }

      const points = POINTS_BY_SEVERITY[form.severity] ?? 10;

      const { error: insertErr } = await supabase.from('bug_reports').insert({
        tester_id:    tester.id,
        category:     form.category,
        severity:     form.severity,
        description:  form.description.trim(),
        screenshot_url: screenshotUrl,
        page_url:     window.location.href,
        device_info:  { model: tester.device_model, android: tester.android_version },
        points_awarded: points,
      });

      if (insertErr) throw insertErr;

      // Award points to tester
      await supabase.from('testers')
        .update({ points: (tester.points ?? 0) + points })
        .eq('id', tester.id);

      // Log event
      await supabase.from('beta_events').insert({
        tester_id:  tester.id,
        event_type: 'bug_report_submitted',
        event_data: { category: form.category, severity: form.severity, points_awarded: points },
        page_url:   window.location.href,
      });

      setDone(true);
      toast({ title: `+${points} pts gagnés !`, description: `Rapport ${form.severity} enregistré. Merci !` });
      setTimeout(() => setOpen(false), 2000);
    } catch {
      setError("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        title="Signaler un bug"
        aria-label="Signaler un bug"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Panel */}
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {done ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Rapport envoyé !</h3>
                  <p className="text-gray-500 text-sm">+{POINTS_BY_SEVERITY[form.severity]} pts crédités sur votre compte</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Bug className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">Signaler un bug</h3>
                    </div>
                    <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Catégorie *</Label>
                      <Select value={form.category} onChange={set('category')} placeholder="Choisir...">
                        <option value="ui">Interface (UI)</option>
                        <option value="performance">Performance</option>
                        <option value="logic">Logique métier</option>
                        <option value="crash">Crash / Blocage</option>
                        <option value="other">Autre</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sévérité *</Label>
                      <Select value={form.severity} onChange={set('severity')} placeholder="Choisir...">
                        <option value="critical">🔴 Critique (+40 pts)</option>
                        <option value="major">🟠 Majeur (+25 pts)</option>
                        <option value="minor">🟡 Mineur (+15 pts)</option>
                        <option value="suggestion">💡 Suggestion (+10 pts)</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description *</Label>
                    <Textarea
                      value={form.description} onChange={set('description')}
                      rows={4} maxLength={1000}
                      className="resize-none text-sm"
                      placeholder="Décrivez ce qui s'est passé, comment reproduire le bug, ce que vous attendiez…"
                    />
                    <p className="text-xs text-gray-400 text-right">{form.description.length}/1000</p>
                  </div>

                  {/* Screenshot */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Screenshot (optionnel)</Label>
                    <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-custom-green-300 transition-colors">
                      <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500 truncate">
                        {screenshot ? screenshot.name : 'Cliquer pour joindre une capture (max 5MB)'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>

                  {/* Page auto-filled note */}
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                    Page détectée : <span className="font-mono text-gray-500">{window.location.pathname}</span>
                  </p>

                  {error && (
                    <p className="text-red-500 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </p>
                  )}

                  <Button type="submit" disabled={loading} className="w-full gradient-bg hover:opacity-90 text-white font-semibold py-5">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi…</>
                      : <>Envoyer le rapport {form.severity && `(+${POINTS_BY_SEVERITY[form.severity]} pts)`}</>
                    }
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BugReportButton;
