"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const CONFETTI_PRESET = [
  {
    id: 1,
    start: "-48px",
    x: "-168px",
    y: "-64vh",
    rotate: "640deg",
    delay: 0,
    duration: 2.6,
    color: "#38bdf8",
    width: 9,
    height: 18,
  },
  {
    id: 2,
    start: "-36px",
    x: "-138px",
    y: "-60vh",
    rotate: "600deg",
    delay: 0.08,
    duration: 2.7,
    color: "#f97316",
    width: 8,
    height: 16,
  },
  {
    id: 3,
    start: "-28px",
    x: "-112px",
    y: "-56vh",
    rotate: "690deg",
    delay: 0.15,
    duration: 2.5,
    color: "#a855f7",
    width: 7,
    height: 15,
  },
  {
    id: 4,
    start: "-16px",
    x: "-86px",
    y: "-58vh",
    rotate: "620deg",
    delay: 0.05,
    duration: 2.8,
    color: "#22c55e",
    width: 9,
    height: 16,
  },
  {
    id: 5,
    start: "-6px",
    x: "-62px",
    y: "-62vh",
    rotate: "720deg",
    delay: 0.12,
    duration: 2.9,
    color: "#facc15",
    width: 8,
    height: 18,
  },
  {
    id: 6,
    start: "4px",
    x: "-34px",
    y: "-65vh",
    rotate: "670deg",
    delay: 0.04,
    duration: 2.85,
    color: "#38bdf8",
    width: 8,
    height: 17,
  },
  {
    id: 7,
    start: "12px",
    x: "-6px",
    y: "-68vh",
    rotate: "760deg",
    delay: 0.18,
    duration: 3,
    color: "#38bdf8",
    width: 9,
    height: 19,
  },
  {
    id: 8,
    start: "22px",
    x: "24px",
    y: "-64vh",
    rotate: "650deg",
    delay: 0.1,
    duration: 2.7,
    color: "#f97316",
    width: 8,
    height: 16,
  },
  {
    id: 9,
    start: "32px",
    x: "52px",
    y: "-60vh",
    rotate: "700deg",
    delay: 0.2,
    duration: 2.6,
    color: "#a855f7",
    width: 9,
    height: 18,
  },
  {
    id: 10,
    start: "42px",
    x: "82px",
    y: "-58vh",
    rotate: "640deg",
    delay: 0.06,
    duration: 2.9,
    color: "#22c55e",
    width: 8,
    height: 16,
  },
  {
    id: 11,
    start: "54px",
    x: "112px",
    y: "-60vh",
    rotate: "710deg",
    delay: 0.24,
    duration: 2.75,
    color: "#facc15",
    width: 7,
    height: 14,
  },
  {
    id: 12,
    start: "64px",
    x: "138px",
    y: "-62vh",
    rotate: "660deg",
    delay: 0.16,
    duration: 2.9,
    color: "#38bdf8",
    width: 9,
    height: 18,
  },
  {
    id: 13,
    start: "74px",
    x: "164px",
    y: "-65vh",
    rotate: "720deg",
    delay: 0.3,
    duration: 3.05,
    color: "#f97316",
    width: 8,
    height: 17,
  },
  {
    id: 14,
    start: "-58px",
    x: "-152px",
    y: "-66vh",
    rotate: "700deg",
    delay: 0.28,
    duration: 3,
    color: "#a855f7",
    width: 9,
    height: 17,
  },
] as const;

type ConfettiStyle = CSSProperties & {
  "--confetti-start"?: string;
  "--confetti-x"?: string;
  "--confetti-y"?: string;
  "--confetti-rotate"?: string;
};

type Props = {
  duration?: number;
  onComplete?: () => void;
};

export function ConfettiCelebration({ duration = 3200, onComplete }: Props) {
  useEffect(() => {
    if (!onComplete) return;
    const timer = window.setTimeout(() => {
      onComplete();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="confetti-container">
      {/** base confetti */}
      {CONFETTI_PRESET.map((piece) => {
        const style: ConfettiStyle = {
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          width: piece.width,
          height: piece.height,
          "--confetti-start": piece.start,
          "--confetti-x": piece.x,
          "--confetti-y": piece.y,
          "--confetti-rotate": piece.rotate,
        };
        return <span key={`base-${piece.id}`} className="confetti-piece" style={style} />;
      })}
      {/** mirrored/confetti clones for higher density */}
      {CONFETTI_PRESET.map((piece) => {
        const mirrored: ConfettiStyle = {
          backgroundColor: piece.color,
          animationDelay: `${(piece.delay ?? 0) + 0.05}s`,
          animationDuration: `${(piece.duration ?? 2.6) + 0.2}s`,
          width: Math.max(6, (piece.width ?? 8) - 1),
          height: Math.max(12, (piece.height ?? 16) - 1),
          "--confetti-start": piece.start.startsWith("-")
            ? piece.start.replace("-", "")
            : `-${piece.start}`,
          "--confetti-x": piece.x.startsWith("-")
            ? piece.x.replace("-", "")
            : `-${piece.x}`,
          "--confetti-y": piece.y,
          "--confetti-rotate": piece.rotate,
        };
        return <span key={`mirror-${piece.id}`} className="confetti-piece confetti-piece--soft" style={mirrored} />;
      })}
    </div>
  );
}
