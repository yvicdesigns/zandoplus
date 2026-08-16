import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import {
  Monitor, Tablet, Smartphone, Type, Square, Image as ImageIcon, Circle, Minus, Hash, Video, Save, Eye, X, Undo2, Redo2,
  ZoomIn, ZoomOut, Group, Ungroup, Trash2, Layers, Copy, LayoutGrid, LayoutTemplate, Presentation, Settings,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import Canvas from './Canvas';
import SlideList from './SlideList';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import BackgroundEditor from './BackgroundEditor';
import { DEVICES, CANVAS_SIZE, DEFAULT_BACKGROUND, ELEMENT_TYPES, SLIDE_TEMPLATES, BADGE_PRESETS } from './constants';
import { ICON_LIBRARY } from './iconLibrary';
import { convertOldSlideToV2 } from './importOldSlide';
import { isElementHidden } from './elementStyles';

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];
const RAIL_ITEMS = [
  { key: 'add', label: 'Ajouter', Icon: LayoutGrid },
  { key: 'layers', label: 'Calques', Icon: Layers },
  { key: 'templates', label: 'Modèles', Icon: LayoutTemplate },
  { key: 'background', label: 'Fond', Icon: ImageIcon },
  { key: 'slides', label: 'Slides', Icon: Presentation },
  { key: 'settings', label: 'Réglages', Icon: Settings },
];
const addRowCls = 'flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-700 hover:border-violet-300 hover:bg-violet-50';

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
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState('add');

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
    setSelectedElementIds([]);
    forceHistoryRender();
  }, [flushPending]);

  const handleRedo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const nextForm = future.pop();
    setForm((current) => { past.push(current); return nextForm; });
    setSelectedElementIds([]);
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

  const [oldSlides, setOldSlides] = useState([]);
  useEffect(() => {
    supabase.from('hero_slides').select('*').order('order', { ascending: true })
      .then(({ data, error }) => { if (!error) setOldSlides(data || []); });
  }, []);

  const handleImportOldSlide = async (oldSlide) => {
    const payload = { ...emptyForm(), ...convertOldSlideToV2(oldSlide) };
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order || 0)) + 1 : 0;
    const { data, error } = await supabase
      .from('hero_slides_v2')
      .insert({ ...payload, order: nextOrder })
      .select()
      .single();
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    setSlides([...syncFormIntoSlides(slides), data]);
    setSelectedId(data.id);
    setForm(slideToForm(data));
    setSelectedElementIds([]);
    resetHistory();
    toast({ title: 'Slide importée', description: 'Vérifie la mise en page, elle a été reconstruite automatiquement.', className: 'bg-custom-green-500 text-white' });
  };

  // Recopie le form en cours (édité en mémoire, pas forcément enregistré en base) dans le
  // tableau local `slides` avant de changer de slide — sinon quitter une slide sans avoir
  // cliqué "Enregistrer" perdait silencieusement ses modifications en mémoire.
  const syncFormIntoSlides = (slidesList) =>
    selectedId ? slidesList.map((s) => (s.id === selectedId ? { ...s, ...form } : s)) : slidesList;

  const selectSlide = (id) => {
    if (id === selectedId) return;
    const synced = syncFormIntoSlides(slides);
    const s = synced.find((x) => x.id === id);
    if (!s) return;
    setSlides(synced);
    setSelectedId(id);
    setForm(slideToForm(s));
    setSelectedElementIds([]);
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
    setSlides([...syncFormIntoSlides(slides), data]);
    setSelectedId(data.id);
    setForm(slideToForm(data));
    setSelectedElementIds([]);
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
      setSelectedElementIds([]);
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

  const addElement = (type, overrides = {}) => {
    const sameTypeCount = form.elements.filter((e) => e.type === type).length;
    const cascade = (layout, canvas) => {
      const step = (sameTypeCount % 6) * 24;
      const w = layout.w, h = layout.h;
      return {
        ...layout,
        x: Math.max(0, Math.min(layout.x + step, canvas.w - w)),
        y: Math.max(0, Math.min(layout.y + step, canvas.h - h)),
      };
    };
    const def = { ...ELEMENT_TYPES[type].defaults(CANVAS_SIZE[device]), ...overrides };
    def.layout = cascade(def.layout, CANVAS_SIZE[device]);
    const id = `el_${Date.now()}`;
    const layout = {};
    DEVICES.forEach((d) => {
      layout[d] = d === device ? def.layout : cascade(ELEMENT_TYPES[type].defaults(CANVAS_SIZE[d]).layout, CANVAS_SIZE[d]);
    });
    const el = { id, ...def, layout };
    commitForm((f) => ({ ...f, elements: [...f.elements, el] }));
    setSelectedElementIds([id]);
  };

  const updateElement = (updated) => {
    commitForm((f) => ({ ...f, elements: f.elements.map((e) => (e.id === updated.id ? updated : e)) }), { coalesce: true });
  };

  const updateElementText = (elId, text) => {
    commitForm((f) => ({ ...f, elements: f.elements.map((e) => (e.id === elId ? { ...e, text } : e)) }));
  };

  const updateElementFocal = (elId, focal) => {
    commitForm((f) => ({ ...f, elements: f.elements.map((e) => (e.id === elId ? { ...e, focal } : e)) }), { coalesce: true });
  };

  const updateBackground = (dev, value) => {
    commitForm((f) => ({ ...f, background: { ...f.background, [dev]: value } }), { coalesce: true });
  };

  const toggleElementHidden = (elId) => {
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => (e.id === elId ? { ...e, hiddenByDevice: { ...e.hiddenByDevice, [device]: !isElementHidden(e, device) } } : e)),
    }));
  };

  const toggleElementLock = (elId) => {
    commitForm((f) => ({ ...f, elements: f.elements.map((e) => (e.id === elId ? { ...e, locked: !e.locked } : e)) }));
  };

  const updateElementLayout = (elId, dev, layout) => {
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => (e.id === elId ? { ...e, layout: { ...e.layout, [dev]: layout } } : e)),
    }), { coalesce: true });
  };

  const updateGroupLayout = (ids, dev, dx, dy, draggedId, draggedNext) => {
    if (dx === 0 && dy === 0) return;
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => {
        if (!ids.includes(e.id)) return e;
        if (e.id === draggedId) return { ...e, layout: { ...e.layout, [dev]: draggedNext } };
        const l = e.layout?.[dev] || e.layout?.desktop;
        return { ...e, layout: { ...e.layout, [dev]: { ...l, x: l.x + dx, y: l.y + dy } } };
      }),
    }), { coalesce: true });
  };

  const deleteElement = (elId) => {
    commitForm((f) => ({ ...f, elements: f.elements.filter((e) => e.id !== elId) }));
    setSelectedElementIds((prev) => prev.filter((id) => id !== elId));
  };

  const deleteSelected = () => {
    commitForm((f) => ({ ...f, elements: f.elements.filter((e) => !selectedElementIds.includes(e.id)) }));
    setSelectedElementIds([]);
  };

  const moveLayer = (elId, direction) => {
    commitForm((f) => {
      const idx = f.elements.findIndex((e) => e.id === elId);
      const swapIdx = direction === 'forward' ? idx + 1 : idx - 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= f.elements.length) return f;
      const next = [...f.elements];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return { ...f, elements: next };
    });
  };

  const handleSelect = (id, additive) => {
    if (id === null) { setSelectedElementIds([]); return; }
    const el = form.elements.find((e) => e.id === id);
    const groupIds = el?.groupId
      ? form.elements.filter((e) => e.groupId === el.groupId).map((e) => e.id)
      : [id];
    if (additive) {
      setSelectedElementIds((prev) => {
        const allIn = groupIds.every((gid) => prev.includes(gid));
        return allIn ? prev.filter((x) => !groupIds.includes(x)) : [...new Set([...prev, ...groupIds])];
      });
    } else {
      setSelectedElementIds(groupIds);
    }
  };

  const handleGroup = () => {
    if (selectedElementIds.length < 2) return;
    const groupId = `grp_${Date.now()}`;
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => (selectedElementIds.includes(e.id) ? { ...e, groupId } : e)),
    }));
  };

  const handleUngroup = () => {
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => {
        if (!selectedElementIds.includes(e.id)) return e;
        const { groupId, ...rest } = e;
        return rest;
      }),
    }));
  };

  const duplicateSelected = () => {
    if (selectedElementIds.length === 0) return;
    const groupIdMap = {};
    const idMap = {};
    selectedElementIds.forEach((id) => { idMap[id] = `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; });
    commitForm((f) => {
      const newElements = [];
      f.elements.forEach((e) => {
        newElements.push(e);
        if (!selectedElementIds.includes(e.id)) return;
        const { groupId, ...rest } = e;
        const offsetLayout = {};
        DEVICES.forEach((d) => {
          const l = e.layout?.[d] || e.layout?.desktop;
          offsetLayout[d] = l ? { ...l, x: l.x + 16, y: l.y + 16 } : l;
        });
        const dup = { ...rest, id: idMap[e.id], layout: offsetLayout };
        if (groupId) {
          if (!groupIdMap[groupId]) groupIdMap[groupId] = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          dup.groupId = groupIdMap[groupId];
        }
        newElements.push(dup);
      });
      return { ...f, elements: newElements };
    });
    setSelectedElementIds(Object.values(idMap));
  };

  const alignSelected = (edge) => {
    if (selectedElementIds.length === 0) return;
    const canvas = CANVAS_SIZE[device];
    commitForm((f) => ({
      ...f,
      elements: f.elements.map((e) => {
        if (!selectedElementIds.includes(e.id)) return e;
        const l = e.layout?.[device] || e.layout?.desktop;
        if (!l) return e;
        let { x, y } = l;
        if (edge === 'left') x = 0;
        if (edge === 'center-h') x = Math.round((canvas.w - l.w) / 2);
        if (edge === 'right') x = canvas.w - l.w;
        if (edge === 'top') y = 0;
        if (edge === 'middle-v') y = Math.round((canvas.h - l.h) / 2);
        if (edge === 'bottom') y = canvas.h - l.h;
        return { ...e, layout: { ...e.layout, [device]: { ...l, x, y } } };
      }),
    }));
  };

  const orderSelected = (direction) => {
    if (selectedElementIds.length === 0) return;
    commitForm((f) => {
      const selected = f.elements.filter((e) => selectedElementIds.includes(e.id));
      const rest = f.elements.filter((e) => !selectedElementIds.includes(e.id));
      return { ...f, elements: direction === 'front' ? [...rest, ...selected] : [...selected, ...rest] };
    });
  };

  const duplicateSlide = async (id) => {
    // Si on duplique la slide actuellement affichée, on part du form en mémoire (édits non
    // encore enregistrés inclus) plutôt que de la dernière version sauvegardée.
    const original = id === selectedId ? form : slides.find((s) => s.id === id);
    if (!original) return;
    const groupIdMap = {};
    const newElements = (original.elements || []).map((e) => {
      const { groupId, ...rest } = e;
      const newId = `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const mapped = { ...rest, id: newId };
      if (groupId) {
        if (!groupIdMap[groupId]) groupIdMap[groupId] = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        mapped.groupId = groupIdMap[groupId];
      }
      return mapped;
    });
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order || 0)) + 1 : 0;
    const payload = {
      name: `${original.name} (copie)`,
      order: nextOrder,
      is_active: false,
      background: original.background,
      elements: newElements,
      settings: original.settings || {},
    };
    const { data, error } = await supabase.from('hero_slides_v2').insert(payload).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    setSlides([...syncFormIntoSlides(slides), data]);
    setSelectedId(data.id);
    setForm(slideToForm(data));
    setSelectedElementIds([]);
    resetHistory();
  };

  const selectedElement = selectedElementIds.length === 1
    ? form.elements.find((e) => e.id === selectedElementIds[0]) || null
    : null;

  const zoomIdx = ZOOM_LEVELS.indexOf(zoom);
  const zoomOut = () => setZoom(ZOOM_LEVELS[Math.max(0, zoomIdx - 1)]);
  const zoomIn = () => setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomIdx + 1)]);

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
        <a
          href="/?heroPreview=v2"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-violet-600 hover:underline flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" /> Voir en situation réelle
        </a>
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
        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} disabled={zoomIdx <= 0} title="Zoom arrière" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-gray-500 w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoomIdx >= ZOOM_LEVELS.length - 1} title="Zoom avant" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ZoomIn className="w-4 h-4" />
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

      <div className="flex-1 grid grid-cols-[64px_280px_1fr_260px] min-h-0">
        {/* Rail: tool categories */}
        <div className="bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 overflow-y-auto">
          {RAIL_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`w-12 h-14 flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] flex-shrink-0 ${
                activePanel === key ? 'bg-violet-100 text-violet-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Flyout: content for the active tool category */}
        <div className="bg-white border-r border-gray-200 overflow-y-auto">
          {activePanel === 'add' && (
            <div className="p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Éléments</h3>
              {!selectedId ? (
                <p className="text-[11px] text-gray-400">Sélectionne ou crée un slide pour ajouter des éléments.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5 mb-4">
                    <button onClick={() => addElement('text')} className={addRowCls}><Type className="w-4 h-4" /> Texte</button>
                    <button onClick={() => addElement('button')} className={addRowCls}><Square className="w-4 h-4" /> Bouton</button>
                    <button onClick={() => addElement('image')} className={addRowCls}><ImageIcon className="w-4 h-4" /> Image</button>
                    <button onClick={() => addElement('shape')} className={addRowCls}><Circle className="w-4 h-4" /> Forme</button>
                    <button onClick={() => addElement('video')} className={addRowCls}><Video className="w-4 h-4" /> Vidéo</button>
                    <button onClick={() => addElement('separator')} className={addRowCls}><Minus className="w-4 h-4" /> Séparateur</button>
                    <button onClick={() => addElement('stat')} className={addRowCls}><Hash className="w-4 h-4" /> Stat (chiffre + légende)</button>
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Bibliothèque de badges</h3>
                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {BADGE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => addElement('badge', { text: p.text, bgColor: p.bgColor, textColor: p.textColor })}
                        className="flex items-center justify-center px-2 py-2 rounded-lg border border-gray-200 hover:border-violet-300"
                      >
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: p.bgColor, color: p.textColor }}>
                          {p.text}
                        </span>
                      </button>
                    ))}
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Bibliothèque d'icônes</h3>
                  <div className="grid grid-cols-6 gap-1">
                    {ICON_LIBRARY.map(({ name, Icon }) => (
                      <button
                        key={name}
                        onClick={() => addElement('icon', { icon: name })}
                        title={name}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-violet-100 hover:text-violet-700"
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activePanel === 'layers' && (
            <div className="p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Calques</h3>
              {!selectedId ? (
                <p className="text-[11px] text-gray-400">Sélectionne ou crée un slide.</p>
              ) : (
                <LayersPanel
                  elements={form.elements}
                  selectedIds={selectedElementIds}
                  onSelect={handleSelect}
                  onMoveLayer={moveLayer}
                  onDelete={deleteElement}
                  onToggleHidden={toggleElementHidden}
                  onToggleLock={toggleElementLock}
                  device={device}
                />
              )}
            </div>
          )}

          {activePanel === 'templates' && (
            <div className="p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Nouveau slide depuis un modèle</h3>
              <div className="flex flex-col gap-1.5">
                {SLIDE_TEMPLATES.map((t) => (
                  <button key={t.key} onClick={() => handleAdd(t.key)} className={addRowCls}>
                    <LayoutTemplate className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'background' && (
            <div className="p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Arrière-plan ({device})</h3>
              {!selectedId ? (
                <p className="text-[11px] text-gray-400">Sélectionne ou crée un slide.</p>
              ) : (
                <BackgroundEditor
                  value={form.background[device] || ''}
                  onChange={(v) => updateBackground(device, v)}
                />
              )}
            </div>
          )}

          {activePanel === 'slides' && (
            <div className="p-3">
              <SlideList
                slides={slides}
                selectedId={selectedId}
                onSelect={selectSlide}
                onAdd={handleAdd}
                onDelete={handleDelete}
                onDuplicate={duplicateSlide}
                onMoveUp={(id) => handleReorder(id, 'up')}
                onMoveDown={(id) => handleReorder(id, 'down')}
              />
              {oldSlides.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">Importer une ancienne slide</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                    Reconstruit une slide de l'ancien Hero (fond, badge, titre, sous-titre, boutons) en éléments modifiables ici. À ajuster ensuite.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {oldSlides.map((s) => {
                      const label = s.text_content?.[0]?.spans?.[0]?.text || 'Sans titre';
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleImportOldSlide(s)}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-700 hover:border-violet-300 hover:bg-violet-50 text-left"
                        >
                          <span className="truncate">{label}</span>
                          <span className="text-[10px] text-violet-600 font-semibold flex-shrink-0">Importer</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'settings' && (
            <div className="p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Réglages du slide</h3>
              {!selectedId ? (
                <p className="text-[11px] text-gray-400">Sélectionne ou crée un slide.</p>
              ) : (
                <>
                  <label className="block text-[10px] text-gray-500 mb-1">Nom</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-violet-400 mb-3"
                    value={form.name}
                    onChange={(e) => commitForm((f) => ({ ...f, name: e.target.value }), { coalesce: true })}
                  />
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => commitForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    Actif (visible sur la page d'accueil)
                  </label>
                  <p className="text-[10px] text-gray-400">Dimensions du canvas ({device}) : {CANVAS_SIZE[device].label}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center: canvas */}
        <div className="overflow-auto p-8 flex flex-col items-center gap-4">
          {!selectedId ? (
            <p className="text-gray-400 text-sm mt-20">Sélectionne ou crée un slide pour commencer.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 self-start text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">{form.name}</span>
                <span>· {CANVAS_SIZE[device].label}</span>
                {form.is_active && <span className="text-emerald-600 font-semibold">· Actif</span>}
              </div>

              {selectedElementIds.length >= 1 && (
                <div className="flex items-center gap-1 self-start bg-violet-50 border border-violet-200 rounded-lg px-2 py-1.5 flex-wrap">
                  <span className="text-[11px] text-violet-700 font-semibold px-1">
                    {selectedElementIds.length > 1 ? `${selectedElementIds.length} éléments` : '1 élément'}
                  </span>
                  <div className="w-px h-4 bg-violet-200" />
                  <button onClick={() => alignSelected('left')} title="Aligner à gauche" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => alignSelected('center-h')} title="Centrer horizontalement" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => alignSelected('right')} title="Aligner à droite" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => alignSelected('top')} title="Aligner en haut" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => alignSelected('middle-v')} title="Centrer verticalement" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => alignSelected('bottom')} title="Aligner en bas" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-violet-200" />
                  <button onClick={() => orderSelected('front')} title="Premier plan" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => orderSelected('back')} title="Arrière-plan" className="w-7 h-7 flex items-center justify-center rounded-md text-violet-700 hover:bg-violet-100">
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-violet-200" />
                  {selectedElementIds.length > 1 && (
                    <>
                      <button onClick={handleGroup} className="h-7 px-2 rounded-md bg-white border border-violet-200 text-[11px] flex items-center gap-1 text-violet-700 hover:bg-violet-100">
                        <Group className="w-3 h-3" /> Grouper
                      </button>
                      <button onClick={handleUngroup} className="h-7 px-2 rounded-md bg-white border border-violet-200 text-[11px] flex items-center gap-1 text-violet-700 hover:bg-violet-100">
                        <Ungroup className="w-3 h-3" /> Dégrouper
                      </button>
                    </>
                  )}
                  <button onClick={duplicateSelected} className="h-7 px-2 rounded-md bg-white border border-violet-200 text-[11px] flex items-center gap-1 text-violet-700 hover:bg-violet-100">
                    <Copy className="w-3 h-3" /> Dupliquer
                  </button>
                  <button onClick={deleteSelected} className="h-7 px-2 rounded-md bg-white border border-red-200 text-[11px] flex items-center gap-1 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" /> Supprimer
                  </button>
                </div>
              )}

              <Canvas
                device={device}
                background={form.background}
                elements={form.elements}
                selectedIds={selectedElementIds}
                onSelect={handleSelect}
                onLayoutChange={updateElementLayout}
                onGroupMove={updateGroupLayout}
                onTextChange={updateElementText}
                onFocalChange={updateElementFocal}
                onBackgroundChange={updateBackground}
                onDuplicate={duplicateSelected}
                onToggleHidden={toggleElementHidden}
                onToggleLock={toggleElementLock}
                zoom={zoom}
              />
            </>
          )}
        </div>

        {/* Right: properties */}
        <div className="border-l border-gray-200 bg-white p-3 overflow-y-auto">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 block mb-2">Propriétés</span>
          {selectedElementIds.length > 1 ? (
            <p className="text-[12px] text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed">
              Plusieurs éléments sélectionnés. Groupe-les pour les déplacer ensemble, ou sélectionne-en un seul pour modifier ses propriétés.
            </p>
          ) : (
            <PropertiesPanel element={selectedElement} device={device} onChange={updateElement} onDelete={deleteElement} onDuplicate={duplicateSelected} />
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBuilderV2;
