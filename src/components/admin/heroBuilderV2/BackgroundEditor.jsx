import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const parseGradient = (css) => {
  const m = /^\s*linear-gradient\(\s*(-?\d+)deg\s*,\s*(.+)\)\s*$/i.exec(css || '');
  if (!m) return null;
  const angle = Number(m[1]);
  const stops = m[2].split(',').map((s) => {
    const parts = s.trim().split(/\s+/);
    const pos = parts.length > 1 && /%$/.test(parts[parts.length - 1]) ? parts.pop() : '';
    return { color: parts.join(' '), pos };
  });
  if (stops.length < 2) return null;
  return { angle, stops };
};

const buildGradient = ({ angle, stops }) =>
  `linear-gradient(${angle}deg, ${stops.map((s) => (s.pos ? `${s.color} ${s.pos}` : s.color)).join(', ')})`;

const detectMode = (css) => {
  if (!css) return 'color';
  if (/^\s*#([0-9a-f]{3}|[0-9a-f]{6})\s*$/i.test(css)) return 'color';
  if (parseGradient(css)) return 'gradient';
  if (/url\(/i.test(css)) return 'image';
  return 'css';
};

const DEFAULT_GRADIENT = { angle: 135, stops: [{ color: '#101657', pos: '' }, { color: '#9f368f', pos: '' }] };

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-violet-400';

const TABS = [['color', 'Couleur'], ['gradient', 'Dégradé'], ['image', 'Image'], ['css', 'CSS']];

const BackgroundEditor = ({ value, onChange }) => {
  const [mode, setMode] = useState(() => detectMode(value));
  const [gradient, setGradient] = useState(() => parseGradient(value) || DEFAULT_GRADIENT);
  const [imageUrl, setImageUrl] = useState(() => /url\(['"]?([^'")]+)/i.exec(value || '')?.[1] || '');

  useEffect(() => {
    setMode(detectMode(value));
    const g = parseGradient(value);
    if (g) setGradient(g);
    const u = /url\(['"]?([^'")]+)/i.exec(value || '');
    if (u) setImageUrl(u[1]);
  }, [value]);

  const applyGradient = (next) => { setGradient(next); onChange(buildGradient(next)); };

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TABS.map(([m, l]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold ${mode === m ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === 'color' && (
        <input
          type="color"
          className="w-full h-8 rounded-lg border border-gray-200"
          value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#171a32'}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {mode === 'gradient' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-10">Angle</span>
            <input type="range" min="0" max="360" value={gradient.angle} onChange={(e) => applyGradient({ ...gradient, angle: Number(e.target.value) })} className="flex-1" />
            <span className="text-[10px] text-gray-500 w-8">{gradient.angle}°</span>
          </div>
          {gradient.stops.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="color"
                className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0"
                value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.color) ? s.color : '#101657'}
                onChange={(e) => { const stops = [...gradient.stops]; stops[i] = { ...s, color: e.target.value }; applyGradient({ ...gradient, stops }); }}
              />
              <input
                className={inputCls}
                placeholder="52%"
                value={s.pos}
                onChange={(e) => { const stops = [...gradient.stops]; stops[i] = { ...s, pos: e.target.value }; applyGradient({ ...gradient, stops }); }}
              />
              {gradient.stops.length > 2 && (
                <button onClick={() => { const stops = gradient.stops.filter((_, idx) => idx !== i); applyGradient({ ...gradient, stops }); }} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => applyGradient({ ...gradient, stops: [...gradient.stops, { color: '#ffffff', pos: '' }] })}
            className="self-start flex items-center gap-1 text-[10px] text-violet-600 font-semibold"
          >
            <Plus className="w-3 h-3" /> Ajouter une couleur
          </button>
        </div>
      )}

      {mode === 'image' && (
        <input
          className={inputCls}
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => { setImageUrl(e.target.value); onChange(`url('${e.target.value}') center/cover no-repeat`); }}
        />
      )}

      {mode === 'css' && (
        <textarea className={`${inputCls} font-mono`} rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
};

export default BackgroundEditor;
