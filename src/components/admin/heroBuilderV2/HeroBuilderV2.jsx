import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { Monitor, Tablet, Smartphone, Type, Square, Image as ImageIcon, Tag, Save, Eye, X, Undo2, Redo2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import Canvas from './Canvas';
import SlideList from './SlideList';
import PropertiesPanel from './PropertiesPanel';
import BackgroundEditor from './BackgroundEditor';
import { DEVICES, CANVAS_SIZE, DEFAULT_BACKGROUND, ELEMENT_TYPES, SLIDE_TEMPLATES } from './constants';

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

const emptyForm = () => ({
  name: 'Nouveau slide',
  order: 0,
  is_active: false,
  background: { ...DEFAULT_BACKGROUND },
  elements: [],
  settings: {},
});

const HeroBuilderV2 = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [device, setDevice] = useState('desktop');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const historyRef = useRef({ past: [], future: [] });
  const pendingSnapshotRef = useRef(null);
  const coalesceTimerRef = useRef(null);
  const [, forceHistoryRender] = useReducer((c) => c + 1, 0);

  const resetHistory = () => {
    historyRef.current = { past: [], future: [] };
    pendingSnapshotRef.current = null;
    clearTimeout(coalesceTimerRef.current);
    forceHistoryRender();
  };

  const pushHistory = useCallback((prevForm) => {
    historyRef.current.past.push(prevForm);
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, []);

  const flushPending = useCallback(() => {
    clearTimeout(coalesceTimerRef.current);
    if (pendingSnapshotRef.current) {
      pushHistory(pendingSnapshotRef.current);
      pendingSnapshotRef.current = null;
      forceHistoryRender();
    }
  }, [pushHistory]);

  const commitForm = useCallback((updater, { coalesce = false } = {}) => {
    setForm((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (coalesce) {
        if (!pendingSnapshotRef.current) pendingSnapshotRef.current = prev;
        clearTimeout(coalesceTimerRef.current);
        coalesceTimerRef.current = setTimeout(() => {
          pushHistory(pendingSnapshotRef.current);
          pendingSnapshotRef.current = null;
          forceHistoryRender();
        }, 600);
      } else {
        clearTimeout(coalesceTimerRef.current);
        if (pendingSnapshotRef.current) {
          pushHistory(pendingSnapshotRef.current);
          pendingSnapshotRef.current = null;
        }
        pushHistory(prev);
        forceHistoryRender();
      }
      return next;
    });
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    flushPending();
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const prevForm = past.pop();
    setForm((current) => { future.push(current); return prevForm; });
    setSelectedElementId(null);
    forceHistoryRender();
  }, [flushPending]);

  const handleRedo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const nextForm = future.pop();
    setForm((current) => { past.push(current); return nextForm; });
    setSelectedElementId(null);
    forceHistoryRender();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) handleRedo(); else handleUndo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const slideToForm = (s) => ({
    name: s.name,
    order: s.order,
    is_active: s.is_active,
    background: { ...DEFAULT_BACKGROUND, ...(s.background || {}) },
    elements: s.elements || [],
    settings: s.settings || {},
  });

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hero_slides_v2').select('*').order('order', { ascending: true });
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      setSlides(data || []);
      if (data && data.length > 0) {
        setSelectedId(data[0].id);
        setForm(slideToForm(data[0]));
        resetHistory();
      }
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const selectSlide = (id) => {
    const s = slides.find((x) => x.id === id);
    if (!s) return;
    setSelectedId(id);
    setForm(slideToForm(s));
    setSelectedElementId(null);
    resetHistory();
  };

  const handleAdd = async (templateKey = 'blank') => {
    const template = SLIDE_TEMPLATES.find((t) => t.key === templateKey) || SLIDE_TEMPLATES[0];
    const payload = { ...emptyForm(), ...template.build() };
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order || 0)) + 1 : 0;
    const { data, error } = await supabase
      .from('hero_slides_v2')
      .insert({ ...payload, order: nextOrder })
      .select()
      .single();
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    setSlides((prev) => [...prev, data]);
    setSelectedId(data.id);
    setForm(slideToForm(data));
    setSelectedElementId(null);
    resetHistory();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce slide ?')) return;
    const { error } = await supabase.from('hero_slides_v2').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    const remaining = slides.filter((s) => s.id !== id);
    setSlides(remaining);
    if (id === selectedId) {
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setForm(slideToForm(remaining[0]));
      } else {
        setSelectedId(null);
        setForm(emptyForm());
      }
      setSelectedElementId(null);
      resetHistory();
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase.from('hero_slides_v2').update(form).eq('id', selectedId);
    if (error) {
      setSaving(false);
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    let updatedSlides = slides.map((s) => (s.id === selectedId ? { ...s, ...form } : s));
    if (form.is_active) {
      const others = slides.filter((s) => s.id !== selectedId && s.is_active);
      if (others.length > 0) {
        const { error: deactivateError } = await supabase
          .from('hero_slides_v2')
          .update({ is_active: false })
          .neq('id', selectedId)
          .eq('is_active', true);
        if (!deactivateError) {
          updatedSlides = updatedSlides.map((s) => (s.id !== selectedId ? { ...s, is_active: false } : s));
        }
      }
    }
    setSlides(updatedSlides);
    setSaving(false);
    toast({ title: 'Enregistré', className: 'bg-custom-green-500 text-white' });
  };

  const handleReorder = async (id, direction) => {
    const idx = slides.findIndex((s) => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= slides.length) return;
    const a = slides[idx];
    const b = slides[swapIdx];
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('hero_slides_v2').update({ order: b.order }).eq('id', a.id),
      supabase.from('hero_slides_v2').update({ order: a.order }).eq('id', b.id),
    ]);
    if (e1 || e2) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e1 || e2).message });
      return;
    }
    const next = [...slides];
    next[idx] = { ...a, order: b.order };
    next[swapIdx] = { ...b, order: a.order };
    next.sort((x, y) => x.order - y.order);
    setSlides(next);
  };

  const addElement = (type) => {
    const def = ELEMENT_TYPES[type].defaults(CANVAS_SIZE[device]);
    const id = `el_${Date.now()}`;
    const layout = {};
    DEVICES.forEach((d) => {
      layout[d] = d === device ? def.layout : ELEMENT_TYPES[type].defaults(CANVAS_SIZE[d]).layout;
    });
    const el = { id, ...def, layout };
    commitForm((f) => ({ ...f, elements: [...f.elements, el] }));
    setSelectedElementId(id);
  };

  const updateElement = (updated) => {
    commitForm((f) => ({ ...f, elements: f.elements.map((e) => (e.id === updated.id ? updated : e)) }), { coalesce: true });
  };

  const updateElementLayout = (elId, dev, layout) => {
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => (e.id === elId ? { ...e, layout: { ...e.layout, [dev]: layout } } : e)),
    }), { coalesce: true });
  };

  const deleteElement = (elId) => {
    commitForm((f) => ({ ...f, elements: f.elements.filter((e) => e.id !== elId) }));
    setSelectedElementId(null);
  };

  const selectedElement = form.elements.find((e) => e.id === selectedElementId) || null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
        <span className="font-bold text-sm">Hero Builder</span>
        <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">BETA — isolé</span>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={historyRef.current.past.length === 0 && !pendingSnapshotRef.current}
            title="Annuler (Ctrl/Cmd+Z)"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyRef.current.future.length === 0}
            title="Rétablir (Ctrl/Cmd+Shift+Z)"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {DEVICES.map((d) => {
            const Icon = DEVICE_ICONS[d];
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${device === d ? 'bg-white shadow text-violet-600' : 'text-gray-500'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedId || saving}
          className="h-9 px-4 rounded-lg bg-violet-600 text-white text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
        {/* Left: slides */}
        <div className="border-r border-gray-200 bg-white p-3 overflow-y-auto">
          <SlideList
            slides={slides}
            selectedId={selectedId}
            onSelect={selectSlide}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onMoveUp={(id) => handleReorder(id, 'up')}
            onMoveDown={(id) => handleReorder(id, 'down')}
          />
        </div>

        {/* Center: canvas */}
        <div className="overflow-auto p-8 flex flex-col items-center gap-4">
          {!selectedId ? (
            <p className="text-gray-400 text-sm mt-20">Sélectionne ou crée un slide pour commencer.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 self-start bg-white border border-gray-200 rounded-lg px-3 py-2">
                <input
                  className="text-[12px] font-semibold outline-none"
                  value={form.name}
                  onChange={(e) => commitForm((f) => ({ ...f, name: e.target.value }), { coalesce: true })}
                />
                <span className="text-[10px] text-gray-400">{CANVAS_SIZE[device].label}</span>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-600 ml-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => commitForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Actif
                </label>
              </div>

              <Canvas
                device={device}
                background={form.background}
                elements={form.elements}
                selectedId={selectedElementId}
                onSelect={setSelectedElementId}
                onLayoutChange={updateElementLayout}
              />

              <div className="flex items-center gap-2">
                <button onClick={() => addElement('text')} className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] flex items-center gap-1.5 hover:border-violet-300">
                  <Type className="w-3.5 h-3.5" /> Texte
                </button>
                <button onClick={() => addElement('button')} className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] flex items-center gap-1.5 hover:border-violet-300">
                  <Square className="w-3.5 h-3.5" /> Bouton
                </button>
                <button onClick={() => addElement('image')} className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] flex items-center gap-1.5 hover:border-violet-300">
                  <ImageIcon className="w-3.5 h-3.5" /> Image
                </button>
                <button onClick={() => addElement('badge')} className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] flex items-center gap-1.5 hover:border-violet-300">
                  <Tag className="w-3.5 h-3.5" /> Badge
                </button>
              </div>

              <div className="w-full max-w-[500px] bg-white border border-gray-200 rounded-lg p-3">
                <label className="block text-[10px] text-gray-500 mb-2">Arrière-plan ({device})</label>
                <BackgroundEditor
                  value={form.background[device] || ''}
                  onChange={(v) => commitForm((f) => ({ ...f, background: { ...f.background, [device]: v } }), { coalesce: true })}
                />
              </div>
            </>
          )}
        </div>

        {/* Right: properties */}
        <div className="border-l border-gray-200 bg-white p-3 overflow-y-auto">
          <PropertiesPanel element={selectedElement} onChange={updateElement} onDelete={deleteElement} />
        </div>
      </div>
    </div>
  );
};

export default HeroBuilderV2;
