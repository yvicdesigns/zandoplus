import React, { useEffect, useState } from 'react';

// Révélation progressive du texte, caractère par caractère, pilotée en JS plutôt qu'en CSS
// pur — contrairement à une animation de largeur, ça respecte les retours à la ligne (\n)
// et le retour à la ligne naturel du texte, et ne coupe jamais la fin du texte.
const TypingText = ({ text, duration = 600, loop = false, animTick = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const total = (text || '').length;
    if (total === 0) return undefined;
    const stepMs = Math.max(20, duration / total);
    let i = 0;
    let cancelled = false;
    let timeoutId;

    const tick = () => {
      if (cancelled) return;
      i += 1;
      setCount(i);
      if (i < total) {
        timeoutId = setTimeout(tick, stepMs);
      } else if (loop) {
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          i = 0;
          setCount(0);
          timeoutId = setTimeout(tick, stepMs);
        }, 900);
      }
    };
    timeoutId = setTimeout(tick, stepMs);

    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [text, duration, loop, animTick]);

  return (
    <>
      {(text || '').slice(0, count)}
      <span style={{ display: 'inline-block', width: '0.08em', borderRight: '0.12em solid currentColor', animation: 'hb-caret 750ms step-end infinite' }} />
    </>
  );
};

export default TypingText;
