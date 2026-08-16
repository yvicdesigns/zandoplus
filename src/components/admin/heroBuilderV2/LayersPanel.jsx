import React from 'react';
import { Type, Square, Image as ImageIcon, Tag, Circle, Minus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { ICON_MAP } from './iconLibrary';

const TYPE_ICONS = { text: Type, button: Square, image: ImageIcon, badge: Tag, shape: Circle, separator: Minus };

const layerLabel = (el) => {
  if (el.type === 'image' || el.type === 'shape' || el.type === 'separator' || el.type === 'icon') return el.name || el.type;
  return el.text || el.name || el.type;
};

const LayersPanel = ({ elements, selectedIds, onSelect, onMoveLayer, onDelete }) => {
  if (elements.length === 0) {
    return <p className="text-[11px] text-gray-400 text-center py-4">Aucun calque. Ajoute un élément sur le canvas.</p>;
  }

  const reversed = [...elements].map((el, idx) => ({ el, idx })).reverse();

  return (
    <div className="flex flex-col gap-1">
      {reversed.map(({ el, idx }) => {
        const Icon = el.type === 'icon' ? (ICON_MAP[el.icon] || Tag) : (TYPE_ICONS[el.type] || Square);
        const isSelected = selectedIds.includes(el.id);
        return (
          <div
            key={el.id}
            onClick={(e) => onSelect(el.id, e.shiftKey)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer ${
              isSelected ? 'bg-violet-100 text-violet-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate flex-1">{layerLabel(el)}</span>
            {el.groupId && <span className="text-[9px] text-gray-400 flex-shrink-0">groupe</span>}
            <button
              onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'forward'); }}
              disabled={idx === elements.length - 1}
              className="text-gray-300 hover:text-violet-600 disabled:opacity-20 disabled:hover:text-gray-300 flex-shrink-0"
              title="Avancer"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'backward'); }}
              disabled={idx === 0}
              className="text-gray-300 hover:text-violet-600 disabled:opacity-20 disabled:hover:text-gray-300 flex-shrink-0"
              title="Reculer"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
              className="text-gray-300 hover:text-red-500 flex-shrink-0"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default LayersPanel;
