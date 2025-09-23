"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const CONFETTI_PRESET = [
  { id: 1, left: "5%", delay: 0, duration: 2.4, color: "#38bdf8", offset: "-30px", width: 8, height: 16 },
  { id: 2, left: "15%", delay: 0.1, duration: 2.6, color: "#f97316", offset: "20px", width: 10, height: 18 },
  { id: 3, left: "25%", delay: 0.2, duration: 2.5, color: "#a855f7", offset: "-10px", width: 7, height: 14 },
  { id: 4, left: "35%", delay: 0.05, duration: 2.8, color: "#22c55e", offset: "30px", width: 9, height: 16 },
  { id: 5, left: "45%", delay: 0.15, duration: 2.7, color: "#facc15", offset: "-25px", width: 8, height: 18 },
  { id: 6, left: "55%", delay: 0.05, duration: 2.9, color: "#38bdf8", offset: "35px", width: 10, height: 17 },
  { id: 7, left: "65%", delay: 0.25, duration: 2.5, color: "#f97316", offset: "-20px", width: 9, height: 16 },
  { id: 8, left: "75%", delay: 0.1, duration: 2.6, color: "#a855f7", offset: "28px", width: 8, height: 15 },
  { id: 9, left: "85%", delay: 0.18, duration: 2.8, color: "#22c55e", offset: "-18px", width: 9, height: 17 },
  { id: 10, left: "12%", delay: 0.32, duration: 2.7, color: "#facc15", offset: "24px", width: 7, height: 15 },
  { id: 11, left: "32%", delay: 0.27, duration: 2.5, color: "#38bdf8", offset: "-22px", width: 8, height: 14 },
  { id: 12, left: "52%", delay: 0.35, duration: 2.9, color: "#f97316", offset: "18px", width: 9, height: 16 },
  { id: 13, left: "72%", delay: 0.22, duration: 2.6, color: "#a855f7", offset: "-28px", width: 8, height: 18 },
  { id: 14, left: "92%", delay: 0.3, duration: 2.7, color: "#22c55e", offset: "16px", width: 10, height: 17 },
  { id: 15, left: "2%", delay: 0.26, duration: 2.8, color: "#facc15", offset: "-15px", width: 9, height: 15 },
  { id: 16, left: "48%", delay: 0.4, duration: 3, color: "#38bdf8", offset: "32px", width: 11, height: 18 },
  { id: 17, left: "68%", delay: 0.36, duration: 2.9, color: "#f97316", offset: "-26px", width: 9, height: 16 },
  { id: 18, left: "88%", delay: 0.42, duration: 2.8, color: "#a855f7", offset: "22px", width: 8, height: 14 }
] as const;

type ConfettiStyle = CSSProperties & {
  "--confetti-x"?: string;
};

type Props = {
  duration?: number;
  onComplete?: () => void;
};

export function ConfettiCelebration({ duration = 2600, onComplete }: Props) {
  useEffect(() => {
    if (!onComplete) return;
    const timer = window.setTimeout(() => {
      onComplete();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="confetti-container">
      {CONFETTI_PRESET.map((piece) => {
        const style: ConfettiStyle = {
          left: piece.left,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          width: piece.width,
          height: piece.height,
          "--confetti-x": piece.offset,
        };
        return <span key={piece.id} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}
