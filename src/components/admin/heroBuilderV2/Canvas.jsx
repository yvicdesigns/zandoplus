import React from 'react';
import CanvasElement from './CanvasElement';
import { CANVAS_SIZE } from './constants';

const Canvas = ({ device, background, elements, selectedId, onSelect, onLayoutChange }) => {
  const size = CANVAS_SIZE[device];

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
            onLayoutChange={(next) => onLayoutChange(el.id, device, next)}
          />
        );
      })}
    </div>
  );
};

export default Canvas;
