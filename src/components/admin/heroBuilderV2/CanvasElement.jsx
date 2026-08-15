import React, { useRef, useCallback } from 'react';
import { MIN_EL_W, MIN_EL_H } from './constants';

const CanvasElement = ({ element, layout, selected, onSelect, onLayoutChange, canvasSize }) => {
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
    onSelect(element.id);
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, layout: { ...layout } };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    dragState.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, layout: { ...layout } };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    const st = dragState.current;
    if (!st) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (st.mode === 'move') {
      onLayoutChange(clamp({ ...st.layout, x: st.layout.x + dx, y: st.layout.y + dy }));
    } else {
      onLayoutChange(clamp({ ...st.layout, w: st.layout.w + dx, h: st.layout.h + dy }));
    }
  };

  const onMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
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
  };

  return (
    <div style={style} onMouseDown={startDrag}>
      {element.type === 'text' && (
        <div
          style={{
            width: '100%', height: '100%', overflow: 'hidden',
            fontSize: element.fontSize, fontWeight: element.fontWeight,
            color: element.color, textAlign: element.align, lineHeight: 1.15,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'button' && (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: 14,
            borderRadius: 8, pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'image' && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 6, background: '#22243a', pointerEvents: 'none' }}>
          {element.imageUrl ? (
            <img src={element.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: element.fit || 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8ea0', fontSize: 11 }}>
              Aucune image
            </div>
          )}
        </div>
      )}
      {selected && (
        <div
          onMouseDown={startResize}
          style={{
            position: 'absolute', right: -7, bottom: -7, width: 14, height: 14,
            borderRadius: '50%', background: '#fff', border: '2px solid #3787ff',
            cursor: 'nwse-resize',
          }}
        />
      )}
    </div>
  );
};

export default CanvasElement;
