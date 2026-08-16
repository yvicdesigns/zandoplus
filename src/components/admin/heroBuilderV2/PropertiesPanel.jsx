import React from 'react';
import { Trash2, Copy, Italic, Underline } from 'lucide-react';
import { CANVAS_SIZE, MIN_EL_W, MIN_EL_H } from './constants';

const Field = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-violet-400';
const toggleCls = (active) =>
  `w-8 h-8 rounded-lg border flex items-center justify-center text-[12px] font-bold ${
    active ? 'bg-violet-100 border-violet-300 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
  }`;

const PropertiesPanel = ({ element, device, onChange, onDelete, onDuplicate }) => {
  if (!element) {
    return (
      <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed">
        Sélectionnez un élément sur le canvas pour modifier ses propriétés.
      </div>
    );
  }

  const set = (key, value) => onChange({ ...element, [key]: value });

  const layout = element.layout?.[device] || element.layout?.desktop || { x: 0, y: 0, w: 0, h: 0 };
  const setLayout = (key, value) => {
    const v = Number(value);
    if (Number.isNaN(v)) return;
    const canvas = CANVAS_SIZE[device];
    const next = { ...layout, [key]: v };
    next.w = Math.max(MIN_EL_W, Math.min(next.w, canvas.w));
    next.h = Math.max(MIN_EL_H, Math.min(next.h, canvas.h));
    next.x = Math.max(0, Math.min(next.x, canvas.w - next.w));
    next.y = Math.max(0, Math.min(next.y, canvas.h - next.h));
    onChange({ ...element, layout: { ...element.layout, [device]: next } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{element.type}</span>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} className="text-gray-500 hover:bg-gray-100 rounded-lg p-1.5" title="Dupliquer">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(element.id)} className="text-red-500 hover:bg-red-50 rounded-lg p-1.5" title="Supprimer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Field label="X"><input type="number" className={inputCls} value={Math.round(layout.x)} onChange={(e) => setLayout('x', e.target.value)} /></Field>
        <Field label="Y"><input type="number" className={inputCls} value={Math.round(layout.y)} onChange={(e) => setLayout('y', e.target.value)} /></Field>
        <Field label="Largeur"><input type="number" className={inputCls} value={Math.round(layout.w)} onChange={(e) => setLayout('w', e.target.value)} /></Field>
        <Field label="Hauteur"><input type="number" className={inputCls} value={Math.round(layout.h)} onChange={(e) => setLayout('h', e.target.value)} /></Field>
      </div>

      {element.type === 'text' && (
        <>
          <Field label="Texte">
            <textarea className={inputCls} rows={3} value={element.text} onChange={(e) => set('text', e.target.value)} />
          </Field>
          <Field label="Taille (px)">
            <input type="number" className={inputCls} value={element.fontSize} onChange={(e) => set('fontSize', Number(e.target.value))} />
          </Field>
          <Field label="Graisse">
            <select className={inputCls} value={element.fontWeight} onChange={(e) => set('fontWeight', Number(e.target.value))}>
              <option value={400}>Normal (400)</option>
              <option value={500}>Medium (500)</option>
              <option value={600}>Semi-bold (600)</option>
              <option value={700}>Bold (700)</option>
              <option value={800}>Extra-bold (800)</option>
              <option value={900}>Black (900)</option>
            </select>
          </Field>
          <Field label="Style">
            <div className="flex gap-1">
              <button onClick={() => set('fontStyle', element.fontStyle === 'italic' ? 'normal' : 'italic')} className={toggleCls(element.fontStyle === 'italic')} title="Italique">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => set('textDecoration', element.textDecoration === 'underline' ? 'none' : 'underline')} className={toggleCls(element.textDecoration === 'underline')} title="Souligné">
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => set('textTransform', element.textTransform === 'uppercase' ? 'none' : 'uppercase')} className={toggleCls(element.textTransform === 'uppercase')} title="Majuscules">
                A
              </button>
            </div>
          </Field>
          <Field label="Interligne">
            <input type="number" step="0.05" className={inputCls} value={element.lineHeight ?? 1.15} onChange={(e) => set('lineHeight', Number(e.target.value))} />
          </Field>
          <Field label="Espacement des lettres (px)">
            <input type="number" step="0.5" className={inputCls} value={element.letterSpacing ?? 0} onChange={(e) => set('letterSpacing', Number(e.target.value))} />
          </Field>
          <Field label="Couleur">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.color} onChange={(e) => set('color', e.target.value)} />
          </Field>
          <Field label="Alignement">
            <select className={inputCls} value={element.align} onChange={(e) => set('align', e.target.value)}>
              <option value="left">Gauche</option>
              <option value="center">Centre</option>
              <option value="right">Droite</option>
            </select>
          </Field>
        </>
      )}

      {element.type === 'button' && (
        <>
          <Field label="Texte du bouton">
            <input className={inputCls} value={element.text} onChange={(e) => set('text', e.target.value)} />
          </Field>
          <Field label="Lien">
            <input className={inputCls} value={element.link} onChange={(e) => set('link', e.target.value)} />
          </Field>
          <Field label="Couleur de fond">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.bgColor} onChange={(e) => set('bgColor', e.target.value)} />
          </Field>
          <Field label="Couleur du texte">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.textColor} onChange={(e) => set('textColor', e.target.value)} />
          </Field>
        </>
      )}

      {element.type === 'badge' && (
        <>
          <Field label="Texte du badge">
            <input className={inputCls} value={element.text} onChange={(e) => set('text', e.target.value)} />
          </Field>
          <Field label="Couleur de fond">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.bgColor} onChange={(e) => set('bgColor', e.target.value)} />
          </Field>
          <Field label="Couleur du texte">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.textColor} onChange={(e) => set('textColor', e.target.value)} />
          </Field>
        </>
      )}

      {element.type === 'image' && (
        <>
          <Field label="URL de l'image">
            <input className={inputCls} value={element.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Ajustement">
            <select className={inputCls} value={element.fit} onChange={(e) => set('fit', e.target.value)}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
        </>
      )}

      {element.type === 'shape' && (
        <>
          <Field label="Forme">
            <select className={inputCls} value={element.shape} onChange={(e) => set('shape', e.target.value)}>
              <option value="rect">Rectangle</option>
              <option value="circle">Cercle</option>
            </select>
          </Field>
          <Field label="Couleur de fond">
            <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.bgColor} onChange={(e) => set('bgColor', e.target.value)} />
          </Field>
        </>
      )}

      {element.type === 'separator' && (
        <Field label="Couleur">
          <input type="color" className="w-full h-8 rounded-lg border border-gray-200" value={element.bgColor} onChange={(e) => set('bgColor', e.target.value)} />
        </Field>
      )}

      <Field label={`Rotation (${element.rotation ?? 0}°)`}>
        <input
          type="range" min="-180" max="180" step="1"
          value={element.rotation ?? 0}
          onChange={(e) => set('rotation', Number(e.target.value))}
          className="w-full"
        />
      </Field>
      <Field label={`Opacité (${Math.round((element.opacity ?? 1) * 100)}%)`}>
        <input
          type="range" min="0" max="1" step="0.01"
          value={element.opacity ?? 1}
          onChange={(e) => set('opacity', Number(e.target.value))}
          className="w-full"
        />
      </Field>
    </div>
  );
};

export default PropertiesPanel;
