import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const SlideList = ({ slides, selectedId, onSelect, onAdd, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Slides ({slides.length})</span>
      <button onClick={onAdd} className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="flex flex-col gap-1.5">
      {slides.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] cursor-pointer ${
            s.id === selectedId ? 'bg-violet-100 text-violet-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="truncate">{s.name}{s.is_active ? ' •' : ''}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
            className="text-gray-300 hover:text-red-500 flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      {slides.length === 0 && (
        <p className="text-[11px] text-gray-400 text-center py-6">Aucun slide. Clique sur + pour en créer un.</p>
      )}
    </div>
  </div>
);

export default SlideList;
