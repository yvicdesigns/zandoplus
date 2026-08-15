import React from 'react';
import { Trash2 } from 'lucide-react';

const Field = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-violet-400';

const PropertiesPanel = ({ element, onChange, onDelete }) => {
  if (!element) {
    return (
      <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed">
        Sélectionnez un élément sur le canvas pour modifier ses propriétés.
      </div>
    );
  }

  const set = (key, value) => onChange({ ...element, [key]: value });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{element.type}</span>
        <button onClick={() => onDelete(element.id)} className="text-red-500 hover:bg-red-50 rounded-lg p-1.5">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {element.type === 'text' && (
        <>
          <Field label="Texte">
            <textarea className={inputCls} rows={3} value={element.text} onChange={(e) => set('text', e.target.value)} />
          </Field>
          <Field label="Taille (px)">
            <input type="number" className={inputCls} value={element.fontSize} onChange={(e) => set('fontSize', Number(e.target.value))} />
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
    </div>
  );
};

export default PropertiesPanel;
