import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, X, Check, RotateCcw, Loader2 } from 'lucide-react';

const SIZE = 300;
const OUTPUT = 400;

const AvatarCropDialog = ({ file, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (!file) return;
    setImgLoaded(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const url = URL.createObjectURL(file);
    const img = imgRef.current;
    img.onload = () => { setImgLoaded(true); URL.revokeObjectURL(url); };
    img.src = url;
  }, [file]);

  const computeLayout = useCallback((z, off) => {
    const img = imgRef.current;
    const { naturalWidth: iw, naturalHeight: ih } = img;
    const baseScale = Math.max(SIZE / iw, SIZE / ih);
    const scale = baseScale * z;
    const dw = iw * scale;
    const dh = ih * scale;
    const maxX = Math.max(0, (dw - SIZE) / 2);
    const maxY = Math.max(0, (dh - SIZE) / 2);
    const cx = Math.max(-maxX, Math.min(maxX, off.x));
    const cy = Math.max(-maxY, Math.min(maxY, off.y));
    return { dx: (SIZE - dw) / 2 + cx, dy: (SIZE - dh) / 2 + cy, dw, dh };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    const { dx, dy, dw, dh } = computeLayout(zoom, offset);
    const R = SIZE / 2;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Full image dimmed as background
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Image clipped to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(R, R, R - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    // Circle border
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(R, R, R - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [imgLoaded, zoom, offset, computeLayout]);

  useEffect(() => { draw(); }, [draw]);

  const getClient = (e) => ({
    x: e.touches ? e.touches[0].clientX : e.clientX,
    y: e.touches ? e.touches[0].clientY : e.clientY,
  });

  const onPointerDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    const { x, y } = getClient(e);
    dragStart.current = { x, y, ox: offset.x, oy: offset.y };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const { x, y } = getClient(e);
      setOffset({
        x: dragStart.current.ox + (x - dragStart.current.x),
        y: dragStart.current.oy + (y - dragStart.current.y),
      });
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleConfirm = () => {
    const { dx, dy, dw, dh } = computeLayout(zoom, offset);
    const ratio = OUTPUT / SIZE;
    const out = document.createElement('canvas');
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, dx * ratio, dy * ratio, dw * ratio, dh * ratio);
    ctx.restore();
    setExporting(true);
    out.toBlob((blob) => {
      setExporting(false);
      onSave(blob);
    }, 'image/webp', 0.92);
  };

  const handleReset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Ajuster la photo</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Glisse pour repositionner</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex items-center justify-center bg-gray-900 py-6 px-6">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
            style={{
              cursor: 'grab',
              width: SIZE,
              height: SIZE,
              borderRadius: '50%',
              display: 'block',
              touchAction: 'none',
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom(z => Math.max(1, parseFloat((z - 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-green-600 h-1.5 cursor-pointer"
            />
            <button
              onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400">Zoom : {Math.round(zoom * 100)}%</span>
            <button
              onClick={handleReset}
              className="text-[11px] text-custom-green-600 hover:text-custom-green-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!imgLoaded || exporting}
            className="flex-1 h-10 rounded-xl bg-custom-green-500 text-white text-[13px] font-bold hover:bg-custom-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Check className="w-4 h-4" />
            }
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropDialog;
