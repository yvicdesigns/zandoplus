import React, { useState, useCallback } from 'react';
import CanvasElement from './CanvasElement';
import { CANVAS_SIZE } from './constants';

const SNAP_THRESHOLD = 6;
const GUIDE_COLOR = '#ff4d6d';
const RULER_SIZE = 18;
const RULER_STEP = 50;

const Canvas = ({ device, background, elements, selectedIds, onSelect, onLayoutChange, onGroupMove, zoom = 1 }) => {
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
    const isGroupMove = mode === 'move' && selectedIds.length > 1 && selectedIds.includes(elId);
    if (isGroupMove) {
      const el = elements.find((e) => e.id === elId);
      const cur = el?.layout?.[device] || el?.layout?.desktop;
      const dx = next.x - (cur?.x ?? next.x);
      const dy = next.y - (cur?.y ?? next.y);
      setGuides({ v: [], h: [] });
      onGroupMove(selectedIds, device, dx, dy, elId, next);
      return;
    }
    const { layout, guides: g } = computeSnap(elId, next, mode);
    setGuides(g);
    onLayoutChange(elId, device, layout);
  };

  const bg = background?.[device] || background?.desktop || '#171a32';
  const isVideo = typeof bg === 'string' && bg.startsWith('video:');
  const videoUrl = isVideo ? bg.slice(6) : null;

  const hTicks = [];
  for (let t = 0; t <= size.w; t += RULER_STEP) hTicks.push(t);
  const vTicks = [];
  for (let t = 0; t <= size.h; t += RULER_STEP) vTicks.push(t);

  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `${RULER_SIZE}px ${size.w * zoom}px`,
        gridTemplateRows: `${RULER_SIZE}px ${size.h * zoom}px`,
      }}
    >
      <div style={{ background: '#f4f4fa', borderRight: '1px solid #e3e4ee', borderBottom: '1px solid #e3e4ee' }} />

      <div style={{ position: 'relative', width: size.w * zoom, height: RULER_SIZE, background: '#f4f4fa', borderBottom: '1px solid #e3e4ee', overflow: 'hidden' }}>
        {hTicks.map((t) => (
          <div key={`ht${t}`} style={{ position: 'absolute', left: t * zoom, top: 0, bottom: 0, borderLeft: '1px solid #d5d6e4' }}>
            <span style={{ position: 'absolute', left: 2, top: 2, fontSize: 8, color: '#9294a8', whiteSpace: 'nowrap' }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', width: RULER_SIZE, height: size.h * zoom, background: '#f4f4fa', borderRight: '1px solid #e3e4ee', overflow: 'hidden' }}>
        {vTicks.map((t) => (
          <div key={`vt${t}`} style={{ position: 'absolute', top: t * zoom, left: 0, right: 0, borderTop: '1px solid #d5d6e4' }}>
            <span style={{ position: 'absolute', left: 2, top: 2, fontSize: 8, color: '#9294a8', whiteSpace: 'nowrap' }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ width: size.w * zoom, height: size.h * zoom, overflow: 'hidden', position: 'relative' }}>
        <div
          onMouseDown={() => onSelect(null, false)}
          style={{
            position: 'relative',
            width: size.w,
            height: size.h,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            borderRadius: 12,
            overflow: 'hidden',
            background: isVideo ? '#000' : bg,
            boxShadow: '0 18px 55px rgba(31,34,68,.25)',
          }}
        >
          {isVideo && videoUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
          )}
          {elements.map((el) => {
            const layout = el.layout?.[device] || el.layout?.desktop;
            if (!layout) return null;
            const isSelected = selectedIds.includes(el.id);
            return (
              <CanvasElement
                key={el.id}
                element={el}
                layout={layout}
                selected={isSelected}
                showHandles={isSelected && selectedIds.length === 1}
                onSelect={onSelect}
                canvasSize={size}
                zoom={zoom}
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
      </div>
    </div>
  );
};

export default Canvas;
