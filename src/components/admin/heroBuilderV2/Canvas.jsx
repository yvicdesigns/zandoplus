import React, { useState, useCallback } from 'react';
import CanvasElement from './CanvasElement';
import { CANVAS_SIZE } from './constants';

const SNAP_THRESHOLD = 6;
const GUIDE_COLOR = '#ff4d6d';

const Canvas = ({ device, background, elements, selectedId, onSelect, onLayoutChange }) => {
  const size = CANVAS_SIZE[device];
  const [guides, setGuides] = useState({ v: [], h: [] });

  const computeSnap = useCallback((elId, layout, mode) => {
    const vx = [0, size.w / 2, size.w];
    const hy = [0, size.h / 2, size.h];

    elements.forEach((el) => {
      if (el.id === elId) return;
      const l = el.layout?.[device] || el.layout?.desktop;
      if (!l) return;
      vx.push(l.x, l.x + l.w / 2, l.x + l.w);
      hy.push(l.y, l.y + l.h / 2, l.y + l.h);
    });

    let { x, y, w, h } = layout;
    const activeV = [];
    const activeH = [];

    const snapV = (value, apply) => {
      const hit = vx.find((t) => Math.abs(value - t) <= SNAP_THRESHOLD);
      if (hit !== undefined) { apply(hit); activeV.push(hit); }
    };
    const snapH = (value, apply) => {
      const hit = hy.find((t) => Math.abs(value - t) <= SNAP_THRESHOLD);
      if (hit !== undefined) { apply(hit); activeH.push(hit); }
    };

    if (mode === 'move') {
      snapV(x, (v) => { x = v; });
      snapV(x + w / 2, (v) => { x = v - w / 2; });
      snapV(x + w, (v) => { x = v - w; });
      snapH(y, (v) => { y = v; });
      snapH(y + h / 2, (v) => { y = v - h / 2; });
      snapH(y + h, (v) => { y = v - h; });
    } else if (mode === 'resize') {
      snapV(x + w, (v) => { w = v - x; });
      snapH(y + h, (v) => { h = v - y; });
    }

    return { layout: { x, y, w, h }, guides: { v: activeV, h: activeH } };
  }, [elements, device, size]);

  const handleLayoutChange = (elId) => (next, mode) => {
    const { layout, guides: g } = computeSnap(elId, next, mode);
    setGuides(g);
    onLayoutChange(elId, device, layout);
  };

  return (
    <div
      onMouseDown={() => onSelect(null)}
      style={{
        position: 'relative',
        width: size.w,
        height: size.h,
        margin: '0 auto',
        borderRadius: 12,
        overflow: 'hidden',
        background: background?.[device] || background?.desktop || '#171a32',
        boxShadow: '0 18px 55px rgba(31,34,68,.25)',
      }}
    >
      {elements.map((el) => {
        const layout = el.layout?.[device] || el.layout?.desktop;
        if (!layout) return null;
        return (
          <CanvasElement
            key={el.id}
            element={el}
            layout={layout}
            selected={el.id === selectedId}
            onSelect={onSelect}
            canvasSize={size}
            onLayoutChange={handleLayoutChange(el.id)}
            onDragEnd={() => setGuides({ v: [], h: [] })}
          />
        );
      })}
      {guides.v.map((x) => (
        <div key={`v${x}`} style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 1, background: GUIDE_COLOR, pointerEvents: 'none', zIndex: 50 }} />
      ))}
      {guides.h.map((y) => (
        <div key={`h${y}`} style={{ position: 'absolute', top: y, left: 0, right: 0, height: 1, background: GUIDE_COLOR, pointerEvents: 'none', zIndex: 50 }} />
      ))}
    </div>
  );
};

export default Canvas;
