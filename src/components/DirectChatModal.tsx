import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  Store, 
  CheckCheck, 
  Sparkles,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Deal, ChatMessage } from '../types';
import { playSound } from '../utils/sound';

interface DirectChatModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; role: string };
}

const QUICK_QUESTIONS = [
  'Assalomu alaykum, hali bormi?',
  'Yetkazib berish xizmati bormi?',
  'Soat nechagacha ish laysiz?',
  'Sifat kafolatlanganmi?',
];

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  deal,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deal || !isOpen) return;

    // Fetch chat history for this deal
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat/${deal.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Chat yuklashda xatolik:', err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2500); // Polling for replies
    return () => clearInterval(interval);
  }, [deal, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !deal) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    playSound('click');
    setInputText('');

    const newMsg: ChatMessage = {
      id: `client-msg-${Date.now()}`,
      dealId: deal.id,
      dealTitle: deal.title,
      sender: 'buyer',
      senderName: currentUser.name || 'Xaridor',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      setLoading(true);
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          text: text.trim(),
          sender: 'buyer',
          senderName: currentUser.name || 'Xaridor',
        }),
      });
      // Refresh shortly to pick up the simulated response
      setTimeout(async () => {
        const res = await fetch(`/api/chat/${deal.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          playSound('claim');
        }
      }, 1500);
    } catch (err) {
      console.error('Xabar yuborishda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-lg w-full h-[600px] max-h-[90vh] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-600 flex items-center justify-center text-emerald-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{deal.storeName}</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-300 truncate max-w-[200px]">
                {deal.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${deal.storePhone}`}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              title="Do'konga qo'ng'iroq qilish"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Qo'ng'iroq</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Deal mini bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{deal.discountPrice.toLocaleString()} so'm</span>
            <span className="text-slate-400 line-through text-[11px]">
              {deal.originalPrice.toLocaleString()} so'm
            </span>
            <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
              -{deal.discountPercent}%
            </span>
          </div>
          <span className="text-emerald-700 font-medium">
            🍏 {deal.savedFoodKg} kg taom saqlanadi
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                Sotuvchiga to'g'ridan-to'g'ri xabar yuboring!
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Mahsulot sifati, yetkazib berish yoki zaxirasi haqida tezkor javob oling.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === 'buyer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                    {msg.senderName}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
                      isMe
                        ? 'bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isMe ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt buttons */}
        <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] whitespace-nowrap bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Sotuvchiga savolingizni yozing..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
