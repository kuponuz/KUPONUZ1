import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Award, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/sound';

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (points: number, message: string) => void;
}

const SECTORS = [
  { label: '50 Eko-ball', points: 50, color: '#059669', textColor: '#ffffff' },
  { label: '100 Eko-ball', points: 100, color: '#d97706', textColor: '#ffffff' },
  { label: '20% Chegirma', points: 30, color: '#047857', textColor: '#ffffff' },
  { label: '250 Eko-ball', points: 250, color: '#b45309', textColor: '#ffffff' },
  { label: 'Bepul Desert', points: 40, color: '#10b981', textColor: '#ffffff' },
  { label: '500 Eko-ball 🔥', points: 500, color: '#f59e0b', textColor: '#1e293b' },
  { label: 'Yana Aylantiring', points: 10, color: '#065f46', textColor: '#ffffff' },
  { label: '75 Eko-ball', points: 75, color: '#ca8a04', textColor: '#ffffff' },
];

export const DailySpinModal: React.FC<DailySpinModalProps> = ({ isOpen, onClose, onReward }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ label: string; points: number } | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWonPrize(null);
    playSound('spin');

    // Random sector index
    const sectorCount = SECTORS.length;
    const winningIndex = Math.floor(Math.random() * sectorCount);
    const sectorAngle = 360 / sectorCount;

    // Additional full spins (between 5 and 8)
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    
    // Exact angle to align winning sector to top pointer (270 deg / top)
    const targetAngle = extraSpins + (sectorCount - winningIndex) * sectorAngle - (sectorAngle / 2);
    const totalRotation = rotation + targetAngle;
    
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      const prize = SECTORS[winningIndex];
      setWonPrize(prize);
      setHasSpunToday(true);
      playSound('win');

      // Trigger colorful eco confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#f59e0b', '#fbbf24', '#34d399'],
      });

      onReward(prize.points, `Omad g'ildiragida "${prize.label}" yutib oldingiz!`);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 overflow-hidden text-center">
        {/* Background decorative aura */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-100 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-100 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Har kungi sovg'a</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Omad G'ildiragi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aylantiring va oziq-ovqat isrofiga qarshi harakatingiz uchun eko-ballar yuting!
          </p>
        </div>

        {/* Spin Wheel Container */}
        <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
          {/* Wheel Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 z-20">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-500 filter drop-shadow-md" />
          </div>

          {/* Rotating Canvas SVG Wheel */}
          <div
            ref={wheelRef}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.95, 0.35, 1)' : 'none',
            }}
            className="w-64 h-64 rounded-full border-4 border-emerald-800 shadow-xl overflow-hidden relative"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {SECTORS.map((sector, i) => {
                const angle = 360 / SECTORS.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                // Calculate middle angle for text placement
                const midAngle = startAngle + angle / 2;
                const textRad = (Math.PI * midAngle) / 180;
                const tx = 50 + 32 * Math.cos(textRad);
                const ty = 50 + 32 * Math.sin(textRad);

                return (
                  <g key={i}>
                    <path d={pathData} fill={sector.color} stroke="#ffffff" strokeWidth="0.5" />
                    <text
                      x={tx}
                      y={ty}
                      fill={sector.textColor}
                      fontSize="3.2"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    >
                      {sector.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub Button */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="absolute z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white font-extrabold text-xs shadow-lg border-2 border-amber-300 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80"
          >
            <RotateCcw className={`w-4 h-4 text-amber-300 ${spinning ? 'animate-spin' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-wider uppercase">
              {spinning ? 'Kuting' : 'Aylantir'}
            </span>
          </button>
        </div>

        {/* Winner Announcement */}
        {wonPrize && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 my-3 animate-scale-up">
            <p className="text-xs text-emerald-800 font-medium">Tabriklaymiz!</p>
            <p className="text-base font-extrabold text-emerald-950 flex items-center justify-center gap-1.5 mt-0.5">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{wonPrize.label}</span>
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              +{wonPrize.points} Eko-ball hisobingizga qo'shildi. Kuponlar olishda ishlatishingiz mumkin!
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{hasSpunToday ? 'Yana sinab ko\'rish' : 'G\'ildirakni Aylantirish'}</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
