"use client";

import confetti from "canvas-confetti";
import { useCallback } from "react";

export function useConfetti() {
  const fireConfetti = useCallback(
    (options?: confetti.Options) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        ...options,
      });
    },
    []
  );

  const fireFromElement = useCallback(
    (element: HTMLElement, options?: confetti.Options) => {
      const rect = element.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        ...options,
      });
    },
    []
  );

  const fireCelebration = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  return {
    fireConfetti,
    fireFromElement,
    fireCelebration,
  };
}

