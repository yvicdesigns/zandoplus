import React, { useRef, useCallback } from 'react';
import { MIN_EL_W, MIN_EL_H } from './constants';

const CORNERS = ['nw', 'ne', 'sw', 'se'];
const CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };

const cornerStyle = (corner) => {
  const style = { position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2px solid #3787ff', cursor: CURSORS[corner] };
  style[corner.includes('n') ? 'top' : 'bottom'] = -6;
  style[corner.includes('w') ? 'left' : 'right'] = -6;
  return style;
};

const CanvasElement = ({ element, layout, selected, showHandles, onSelect, onLayoutChange, onDragEnd, canvasSize, zoom = 1 }) => {
  const dragState = useRef(null);

  const clamp = useCallback((next) => {
    const w = Math.max(MIN_EL_W, Math.min(next.w, canvasSize.w));
    const h = Math.max(MIN_EL_H, Math.min(next.h, canvasSize.h));
    const x = Math.max(0, Math.min(next.x, canvasSize.w - w));
    const y = Math.max(0, Math.min(next.y, canvasSize.h - h));
    return { x, y, w, h };
  }, [canvasSize]);

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect(element.id, e.shiftKey);
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, layout: { ...layout } };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResize = (corner) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id, false);
    dragState.current = { mode: 'resize', corner, startX: e.clientX, startY: e.clientY, layout: { ...layout } };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    const st = dragState.current;
    if (!st) return;
    const dx = (e.clientX - st.startX) / zoom;
    const dy = (e.clientY - st.startY) / zoom;
    if (st.mode === 'move') {
      onLayoutChange(clamp({ ...st.layout, x: st.layout.x + dx, y: st.layout.y + dy }), 'move');
    } else {
      const { corner } = st;
      const next = { ...st.layout };
      if (corner.includes('e')) next.w = st.layout.w + dx;
      if (corner.includes('s')) next.h = st.layout.h + dy;
      if (corner.includes('w')) { next.w = st.layout.w - dx; next.x = st.layout.x + dx; }
      if (corner.includes('n')) { next.h = st.layout.h - dy; next.y = st.layout.y + dy; }
      onLayoutChange(clamp(next), 'resize');
    }
  };

  const onMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    onDragEnd && onDragEnd();
  };

  const style = {
    position: 'absolute',
    left: layout.x,
    top: layout.y,
    width: layout.w,
    height: layout.h,
    cursor: 'move',
    outline: selected ? '2px solid #3787ff' : 'none',
    outlineOffset: 2,
    userSelect: 'none',
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  };

  const contentStyle = { width: '100%', height: '100%', opacity: element.opacity ?? 1 };

  return (
    <div style={style} onMouseDown={startDrag}>
      {element.type === 'text' && (
        <div
          style={{
            ...contentStyle, overflow: 'hidden',
            fontSize: element.fontSize, fontWeight: element.fontWeight,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            textTransform: element.textTransform || 'none',
            color: element.color, textAlign: element.align,
            lineHeight: element.lineHeight ?? 1.15,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'button' && (
        <div
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: 14,
            borderRadius: 8, pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'badge' && (
        <div
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: 12,
            letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: 999, pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'image' && (
        <div style={{ ...contentStyle, overflow: 'hidden', borderRadius: 6, background: '#22243a', pointerEvents: 'none' }}>
          {element.imageUrl ? (
            <img src={element.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: element.fit || 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8ea0', fontSize: 11 }}>
              Aucune image
            </div>
          )}
        </div>
      )}
      {element.type === 'shape' && (
        <div
          style={{
            ...contentStyle,
            background: element.bgColor,
            borderRadius: element.shape === 'circle' ? '50%' : 10,
            pointerEvents: 'none',
          }}
        />
      )}
      {element.type === 'separator' && (
        <div style={{ ...contentStyle, background: element.bgColor, pointerEvents: 'none' }} />
      )}
      {showHandles && CORNERS.map((corner) => (
        <div key={corner} onMouseDown={startResize(corner)} style={cornerStyle(corner)} />
      ))}
    </div>
  );
};

export default CanvasElement;
