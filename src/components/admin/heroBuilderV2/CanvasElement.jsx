import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Move, Pencil, Copy, Eye, EyeOff, Lock, Unlock, X, PlayCircle } from 'lucide-react';
import { MIN_EL_W, MIN_EL_H } from './constants';
import { ICON_MAP } from './iconLibrary';
import { cornerRadius, effectStyle, borderStyle, isElementHidden, animationStyle, ANIMATIONS, LOOP_FRIENDLY_ANIMATIONS, TEXT_ONLY_ANIMATIONS } from './elementStyles';
import FocalPointEditor from './FocalPointEditor';
import TypingText from './TypingText';

export { cornerRadius, ANIMATIONS, LOOP_FRIENDLY_ANIMATIONS, TEXT_ONLY_ANIMATIONS };

const CORNERS = ['nw', 'ne', 'sw', 'se'];
const CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
const EDITABLE_TYPES = ['text', 'button', 'badge', 'stat'];
const FOCAL_TYPES = ['image', 'video'];
const ALIGN_TO_JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' };

const cornerStyle = (corner) => {
  const style = { position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2px solid #3787ff', cursor: CURSORS[corner] };
  style[corner.includes('n') ? 'top' : 'bottom'] = -6;
  style[corner.includes('w') ? 'left' : 'right'] = -6;
  return style;
};

const toolbarBtnCls = 'w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 flex-shrink-0';

const CanvasElement = ({ element, layout, selected, showHandles, onSelect, onLayoutChange, onDragEnd, onTextChange, onFocalChange, onDuplicate, onToggleHidden, onToggleLock, canvasSize, zoom = 1, device = 'desktop' }) => {
  const dragState = useRef(null);
  const elRef = useRef(null);
  const locked = !!element.locked;
  const fontSize = element.fontSizeByDevice?.[device] ?? element.fontSize;
  const align = element.alignByDevice?.[device] ?? element.align;
  const subFontSize = element.subFontSizeByDevice?.[device] ?? element.subFontSize;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(element.text);
  const [focusEditing, setFocusEditing] = useState(false);
  const focal = element.focal || { x: 50, y: 50, zoom: 1 };

  const startEditing = (e) => {
    if (locked || !EDITABLE_TYPES.includes(element.type)) return;
    e.stopPropagation();
    setDraft(element.text);
    setEditing(true);
  };

  const commitEditing = () => {
    setEditing(false);
    if (draft !== element.text) onTextChange(draft);
  };

  const mediaUrl = element.type === 'image' ? element.imageUrl : element.videoUrl;
  const onDoubleClickElement = (e) => {
    e.stopPropagation();
    if (locked) return;
    if (EDITABLE_TYPES.includes(element.type)) { startEditing(e); return; }
    if (FOCAL_TYPES.includes(element.type) && mediaUrl) {
      setFocusEditing(true);
    }
  };

  useEffect(() => {
    if (!focusEditing) return;
    const handleOutside = (e) => { if (elRef.current && !elRef.current.contains(e.target)) setFocusEditing(false); };
    const handleKey = (e) => { if (e.key === 'Escape') setFocusEditing(false); };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('mousedown', handleOutside); window.removeEventListener('keydown', handleKey); };
  }, [focusEditing]);

  const clamp = useCallback((next) => {
    const w = Math.max(MIN_EL_W, Math.min(next.w, canvasSize.w));
    const h = Math.max(MIN_EL_H, Math.min(next.h, canvasSize.h));
    const x = Math.max(0, Math.min(next.x, canvasSize.w - w));
    const y = Math.max(0, Math.min(next.y, canvasSize.h - h));
    return { x, y, w, h };
  }, [canvasSize]);

  const startDrag = (e) => {
    if (editing) return;
    e.stopPropagation();
    onSelect(element.id, e.shiftKey);
    if (locked) return;
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, layout: { ...layout } };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResize = (corner) => (e) => {
    if (locked) return;
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
    cursor: locked ? 'not-allowed' : editing ? 'text' : 'move',
    outline: selected ? `2px solid ${locked ? '#9296a8' : '#3787ff'}` : 'none',
    outlineOffset: 2,
    userSelect: 'none',
    zIndex: selected ? 500 : undefined,
    ...animationStyle(element),
    ...effectStyle(element),
  };

  const contentStyle = { width: '100%', height: '100%', opacity: element.opacity ?? 1 };

  const editorBaseStyle = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    background: 'transparent', fontFamily: 'inherit', padding: 0,
  };

  const isHidden = isElementHidden(element, device);

  return (
    <>
      {showHandles && (
        <div
          style={{
            position: 'absolute',
            left: layout.x,
            top: layout.y - 36 / zoom,
            transform: `scale(${1 / zoom})`,
            transformOrigin: 'top left',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#fff',
            borderRadius: 10,
            padding: '3px 4px',
            boxShadow: '0 4px 14px rgba(20,22,45,.18)',
            whiteSpace: 'nowrap',
            zIndex: 600,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase px-1.5">{element.type}</span>
          <button className={`${toolbarBtnCls} cursor-move`} onMouseDown={startDrag} title="Déplacer"><Move className="w-3.5 h-3.5" /></button>
          {EDITABLE_TYPES.includes(element.type) && (
            <button className={toolbarBtnCls} onClick={startEditing} title="Modifier le contenu" disabled={locked}><Pencil className="w-3.5 h-3.5" /></button>
          )}
          <button className={toolbarBtnCls} onClick={() => onDuplicate(element.id)} title="Dupliquer"><Copy className="w-3.5 h-3.5" /></button>
          <button className={toolbarBtnCls} onClick={() => onToggleHidden(element.id)} title={`${isHidden ? 'Afficher' : 'Masquer'} (${device} uniquement)`}>
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button className={toolbarBtnCls} onClick={() => onToggleLock(element.id)} title={locked ? 'Déverrouiller' : 'Verrouiller'}>
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button className={toolbarBtnCls} onClick={() => onSelect(null, false)} title="Désélectionner"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    <div ref={elRef} key={`anim-${element._animTick || 0}`} style={style} onMouseDown={startDrag} onDoubleClick={onDoubleClickElement}>
      {element.type === 'text' && (editing ? (
        <textarea
          autoFocus
          style={{
            ...editorBaseStyle,
            fontSize, fontWeight: element.fontWeight,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            textTransform: element.textTransform || 'none',
            color: element.color, textAlign: align,
            background: element.bgColor || 'transparent',
            lineHeight: element.lineHeight ?? 1.15,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={commitEditing}
          onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); } if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitEditing(); } }}
        />
      ) : (
        <div
          style={{
            ...contentStyle, overflow: 'hidden',
            fontSize, fontWeight: element.fontWeight,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            textTransform: element.textTransform || 'none',
            color: element.color, textAlign: align,
            background: element.bgColor || 'transparent',
            lineHeight: element.lineHeight ?? 1.15,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none',
          }}
        >
          {element.animation?.type === 'typing'
            ? <TypingText text={element.text} duration={element.animation?.duration ?? 600} loop={!!element.animation?.loop} animTick={element._animTick} />
            : element.text}
        </div>
      ))}
      {element.type === 'button' && (editing ? (
        <input
          autoFocus
          style={{ ...editorBaseStyle, textAlign: 'center', background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 14, borderRadius: cornerRadius(element, 8) }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={commitEditing}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); if (e.key === 'Enter') { e.preventDefault(); commitEditing(); } }}
        />
      ) : (
        <div
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: ALIGN_TO_JUSTIFY[align] || 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 14,
            borderRadius: cornerRadius(element, 8), border: borderStyle(element), boxSizing: 'border-box', pointerEvents: 'none',
            padding: '0 12px',
          }}
        >
          {element.text}
        </div>
      ))}
      {element.type === 'badge' && (editing ? (
        <input
          autoFocus
          style={{ ...editorBaseStyle, textAlign: 'center', background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 12, letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: cornerRadius(element, 999) }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={commitEditing}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); if (e.key === 'Enter') { e.preventDefault(); commitEditing(); } }}
        />
      ) : (
        <div
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: ALIGN_TO_JUSTIFY[align] || 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 12,
            letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: cornerRadius(element, 999),
            border: borderStyle(element), boxSizing: 'border-box', pointerEvents: 'none', padding: '0 10px',
          }}
        >
          {element.text}
        </div>
      ))}
      {element.type === 'stat' && (editing ? (
        <input
          autoFocus
          style={{ ...editorBaseStyle, textAlign: 'center', background: element.bgColor, color: element.textColor, fontWeight: 800, fontSize: fontSize ?? 22, borderRadius: cornerRadius(element, 14) }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={commitEditing}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); if (e.key === 'Enter') { e.preventDefault(); commitEditing(); } }}
        />
      ) : (
        <div
          style={{
            ...contentStyle, display: 'flex', flexDirection: 'column', alignItems: ALIGN_TO_JUSTIFY[align] || 'center', justifyContent: 'center',
            background: element.bgColor, borderRadius: cornerRadius(element, 14), border: borderStyle(element), boxSizing: 'border-box',
            pointerEvents: 'none', padding: '4px 10px', overflow: 'hidden',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: fontSize ?? 22, lineHeight: 1.1, color: element.textColor }}>{element.text}</span>
          <span style={{ fontWeight: 500, fontSize: subFontSize ?? 11, color: element.subColor, marginTop: element.gap ?? 4 }}>{element.subtext}</span>
        </div>
      ))}
      {element.type === 'image' && (
        <div style={{ ...contentStyle, overflow: 'hidden', borderRadius: cornerRadius(element, 6), border: borderStyle(element), boxSizing: 'border-box', background: element.imageUrl ? undefined : '#22243a', pointerEvents: focusEditing ? 'auto' : 'none', position: 'relative' }}>
          {element.imageUrl ? (
            focusEditing ? (
              <FocalPointEditor
                src={element.imageUrl}
                type="image"
                focal={focal}
                frameW={layout.w}
                frameH={layout.h}
                onCommit={(f) => onFocalChange(f)}
                onClose={() => setFocusEditing(false)}
              />
            ) : (
              <img
                src={element.imageUrl}
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: element.fit || 'cover', objectPosition: `${focal.x}% ${focal.y}%`,
                  transform: focal.zoom && focal.zoom !== 1 ? `scale(${focal.zoom})` : undefined,
                  transformOrigin: `${focal.x}% ${focal.y}%`,
                }}
              />
            )
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8ea0', fontSize: 11 }}>
              Aucune image
            </div>
          )}
        </div>
      )}
      {element.type === 'video' && (
        <div style={{ ...contentStyle, overflow: 'hidden', borderRadius: cornerRadius(element, 6), border: borderStyle(element), boxSizing: 'border-box', background: element.videoUrl ? undefined : '#0c0d1a', pointerEvents: focusEditing ? 'auto' : 'none', position: 'relative' }}>
          {element.videoUrl ? (
            focusEditing ? (
              <FocalPointEditor
                src={element.videoUrl}
                type="video"
                focal={focal}
                frameW={layout.w}
                frameH={layout.h}
                onCommit={(f) => onFocalChange(f)}
                onClose={() => setFocusEditing(false)}
              />
            ) : (
              <video
                key={element.videoUrl}
                src={element.videoUrl}
                poster={element.poster || undefined}
                autoPlay={element.autoplay !== false}
                loop={element.loop !== false}
                muted={element.muted !== false}
                controls={!!element.controls}
                playsInline
                style={{
                  width: '100%', height: '100%', objectFit: element.fit || 'cover', objectPosition: `${focal.x}% ${focal.y}%`,
                  transform: focal.zoom && focal.zoom !== 1 ? `scale(${focal.zoom})` : undefined,
                  transformOrigin: `${focal.x}% ${focal.y}%`,
                }}
              />
            )
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#8a8ea0', fontSize: 11 }}>
              <PlayCircle className="w-6 h-6" />
              Aucune vidéo
            </div>
          )}
        </div>
      )}
      {element.type === 'shape' && (
        <div
          style={{
            ...contentStyle,
            background: element.bgColor,
            borderRadius: element.shape === 'circle' ? '50%' : cornerRadius(element, 10),
            border: borderStyle(element), boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        />
      )}
      {element.type === 'separator' && (
        <div style={{ ...contentStyle, background: element.bgColor, pointerEvents: 'none' }} />
      )}
      {element.type === 'icon' && (() => {
        const Icon = ICON_MAP[element.icon] || ICON_MAP.Star;
        return (
          <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Icon color={element.color} strokeWidth={element.strokeWidth ?? 2} style={{ width: '100%', height: '100%' }} />
          </div>
        );
      })()}
      {showHandles && !locked && CORNERS.map((corner) => (
        <div key={corner} onMouseDown={startResize(corner)} style={cornerStyle(corner)} />
      ))}
    </div>
    </>
  );
};

export default CanvasElement;
