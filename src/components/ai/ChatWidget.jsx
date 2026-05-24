import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const QUICK_REPLIES = [
  "Comment vendre sur Zando+ ?",
  "Comment payer en sécurité ?",
  "Comment contacter un vendeur ?",
  "Comment signaler une arnaque ?",
];

const WELCOME = "Bonjour ! 👋 Je suis **Zando**, votre assistant. Comment puis-je vous aider aujourd'hui ?";

const Message = ({ msg }) => {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${isBot ? 'bg-custom-green-500' : 'bg-gray-200'}`}>
        {isBot
          ? <Bot className="w-4 h-4 text-white" />
          : <User className="w-4 h-4 text-gray-600" />
        }
      </div>
      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isBot
          ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
          : 'bg-custom-green-500 text-white rounded-br-sm'
      }`}>
        {msg.content.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <div className="w-7 h-7 rounded-full bg-custom-green-500 flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const getDefaultPos = () => ({
  x: typeof window !== 'undefined' ? window.innerWidth - 68 : 320,
  y: typeof window !== 'undefined' ? window.innerHeight - 100 : 600,
});

const ChatWidget = () => {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const isDragging = useRef(false);
  const constraintsRef = useRef(null);

  const [savedPos] = useState(() => {
    try {
      const saved = localStorage.getItem('chatWidgetPos');
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === 'number' && typeof p.y === 'number') return p;
      }
    } catch {}
    return getDefaultPos();
  });

  // Motion values drive the button's position — no CSS left/top needed
  const bx = useMotionValue(savedPos.x);
  const by = useMotionValue(savedPos.y);

  // chatAnchor tracks where the chat window should open (updated on drag end)
  const [chatAnchor, setChatAnchor] = useState(savedPos);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    const userMsg = { role: 'user', content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('ai-chatbot', {
        body: { messages: history.filter(m => m.role !== 'system') },
      });
      const reply = data?.reply || "Désolé, une erreur s'est produite. Réessayez dans un instant.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Je suis temporairement indisponible. Consultez **/help** pour de l'aide. 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showQuickReplies = messages.length <= 1 && !loading;

  const handleDragStart = () => {
    isDragging.current = true;
    setOpen(false); // close chat while dragging
  };

  const handleDragEnd = () => {
    const newPos = { x: bx.get(), y: by.get() };
    setChatAnchor(newPos);
    localStorage.setItem('chatWidgetPos', JSON.stringify(newPos));
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const handleClick = () => {
    if (!isDragging.current) setOpen(o => !o);
  };

  // Position the chat window near the button, fitting within viewport
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 400;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const chatW = Math.min(336, vw - 16);
  const chatLeft = clamp(chatAnchor.x - chatW + 52, 8, vw - chatW - 8);
  const spaceAbove = chatAnchor.y - 12;
  const chatStyle = {
    position: 'fixed',
    ...(spaceAbove >= 480
      ? { bottom: vh - chatAnchor.y + 12 }
      : { top: chatAnchor.y + 64 }),
    left: chatLeft,
    zIndex: 50,
    width: chatW,
    maxHeight: 'min(520px, calc(100vh - 100px))',
  };

  return (
    <>
      {/* Invisible full-viewport div used as drag boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 49 }} />

      {/* Draggable floating button */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x: bx,
          y: by,
          zIndex: 50,
          touchAction: 'none',
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className="w-[52px] h-[52px] bg-custom-green-500 hover:bg-custom-green-600 text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 0.95 }}
        aria-label="Assistant Zando+"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90,  opacity: 0 }}><X             className="w-5 h-5" /></motion.div>
            : <motion.div key="chat" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-5 h-5" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={chatStyle}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-custom-green-500 to-emerald-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Zando Assistant</p>
                <p className="text-green-100 text-xs">Disponible 24h/24 · 7j/7</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <AnimatePresence>
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0"
                >
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs bg-green-50 hover:bg-green-100 text-custom-green-700 border border-green-200 rounded-full px-3 py-1.5 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="px-3 pb-3 flex-shrink-0 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Posez votre question…"
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
                  maxLength={500}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 bg-custom-green-500 hover:bg-custom-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">Propulsé par Claude · Zando+ Congo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
