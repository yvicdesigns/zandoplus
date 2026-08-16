import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Minus, Plus } from 'lucide-react';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

// Lets the admin drag the full (uncropped) media inside its fixed frame, and zoom in/out,
// to choose which part stays visible under object-fit: cover — same math as object-position,
// with an extra scale factor applied around that same anchor point. Below zoom 1 the media
// no longer fills the frame (letterboxed on the container's fallback color) — the pan range
// then covers the gap instead of a crop, computed generally via min/max rather than assuming
// the media is always bigger than the frame.
const FocalPointEditor = ({ src, type, focal, frameW, frameH, onCommit, onClose }) => {
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(focal?.zoom ?? 1);
  const [pos, setPos] = useState(null);
  const dragRef = useRef(null);

  const geometry = useCallback((natW, natH, z) => {
    const baseScale = Math.max(frameW / natW, frameH / natH);
    const scale = baseScale * z;
    const sw = natW * scale;
    const sh = natH * scale;
    const minLeft = Math.min(0, frameW - sw);
    const maxLeft = Math.max(0, frameW - sw);
    const minTop = Math.min(0, frameH - sh);
    const maxTop = Math.max(0, frameH - sh);
    return { sw, sh, minLeft, maxLeft, minTop, maxTop };
  }, [frameW, frameH]);

  useEffect(() => {
    if (!natural) return;
    const { sw, sh, minLeft, maxLeft, minTop, maxTop } = geometry(natural.w, natural.h, zoom);
    setPos({
      left: minLeft + (maxLeft - minLeft) * ((focal?.x ?? 50) / 100),
      top: minTop + (maxTop - minTop) * ((focal?.y ?? 50) / 100),
      sw, sh, minLeft, maxLeft, minTop, maxTop,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, zoom, geometry]);

  const onMouseMove = (e) => {
    const st = dragRef.current;
    if (!st) return;
    setPos((p) => ({
      ...p,
      left: Math.max(p.minLeft, Math.min(p.maxLeft, st.left + (e.clientX - st.startX))),
      top: Math.max(p.minTop, Math.min(p.maxTop, st.top + (e.clientY - st.startY))),
    }));
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    dragRef.current = null;
    setPos((p) => {
      if (p) {
        const rangeX = p.maxLeft - p.minLeft;
        const rangeY = p.maxTop - p.minTop;
        const x = rangeX !== 0 ? Math.round(((p.left - p.minLeft) / rangeX) * 100) : 50;
        const y = rangeY !== 0 ? Math.round(((p.top - p.minTop) / rangeY) * 100) : 50;
        onCommit({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), zoom });
      }
      return p;
    });
  };

  const onMouseDown = (e) => {
    e.stopPropagation();
    if (!pos) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, left: pos.left, top: pos.top };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const changeZoom = (z) => {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(z * 100) / 100));
    setZoom(next);
    onCommit({ x: focal?.x ?? 50, y: focal?.y ?? 50, zoom: next });
  };

  const mediaStyle = {
    position: 'absolute',
    left: pos ? pos.left : 0,
    top: pos ? pos.top : 0,
    width: pos ? pos.sw : '100%',
    height: pos ? pos.sh : '100%',
    maxWidth: 'none',
    opacity: pos ? 1 : 0,
    cursor: 'grab',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} onMouseDown={(e) => e.stopPropagation()}>
      {type === 'image' ? (
        <img
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          onMouseDown={onMouseDown}
          style={mediaStyle}
        />
      ) : (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          onLoadedMetadata={(e) => setNatural({ w: e.target.videoWidth, h: e.target.videoHeight })}
          onMouseDown={onMouseDown}
          style={mediaStyle}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(255,255,255,.85)', pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,16,32,.75)',
          borderRadius: 8, padding: '4px 6px', whiteSpace: 'nowrap',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button onClick={() => changeZoom(zoom - ZOOM_STEP)} title="Dézoomer" style={{ color: '#fff', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          style={{ width: 70, accentColor: '#8b5cf6' }}
        />
        <button onClick={() => changeZoom(zoom + ZOOM_STEP)} title="Zoomer" style={{ color: '#fff', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          title="Terminer"
          style={{ background: '#fff', color: '#111', borderRadius: 6, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default FocalPointEditor;
