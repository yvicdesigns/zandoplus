import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { SLIDE_TEMPLATES } from './constants';

const SlideList = ({ slides, selectedId, onSelect, onAdd, onDelete, onDuplicate, onMoveUp, onMoveDown }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 relative" ref={menuRef}>
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Slides ({slides.length})</span>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-7 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
            {SLIDE_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => { onAdd(t.key); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] text-gray-700 hover:bg-violet-50 hover:text-violet-700"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {slides.map((s, i) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] cursor-pointer ${
              s.id === selectedId ? 'bg-violet-100 text-violet-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="truncate">{s.name}{s.is_active ? ' •' : ''}</span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveUp(s.id); }}
                disabled={i === 0}
                className="text-gray-300 hover:text-violet-600 disabled:opacity-20 disabled:hover:text-gray-300"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onMoveDown(s.id); }}
                disabled={i === slides.length - 1}
                className="text-gray-300 hover:text-violet-600 disabled:opacity-20 disabled:hover:text-gray-300"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(s.id); }}
                className="text-gray-300 hover:text-violet-600"
                title="Dupliquer"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="text-gray-300 hover:text-red-500"
                title="Supprimer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {slides.length === 0 && (
          <p className="text-[11px] text-gray-400 text-center py-6">Aucun slide. Clique sur + pour en créer un.</p>
        )}
      </div>
    </div>
  );
};

export default SlideList;
