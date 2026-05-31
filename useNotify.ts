import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification } from "../types";

export type NotificationPermission =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission as NotificationPermission;
  });

  const request = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported" as const;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch {
      return "denied" as const;
    }
  }, []);

  const show = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        const n = new Notification(title, {
          ...options,
          // Keep notification short-lived
        });
        // Auto-close after a few seconds
        setTimeout(() => {
          try {
            n.close();
          } catch {
            /* ignore */
          }
        }, 6000);
        // Bring window to front when clicked
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        /* ignore */
      }
    },
    []
  );

  return { permission, request, show };
}

// Play a short beep using Web Audio API — no external assets needed
export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC =
        (window as unknown as { AudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  const play = useCallback((kind: AppNotification["kind"]) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    // Resume if suspended (browsers suspend audio contexts)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {
        /* ignore */
      });
    }
    const now = ctx.currentTime;
    // Different tones for different events
    const patterns: Record<AppNotification["kind"], Array<[number, number, number]>> = {
      "task-sent": [[880, 0, 0.12], [1175, 0.14, 0.12]],
      "task-received": [[660, 0, 0.15]],
      "task-started": [[523, 0, 0.1], [659, 0.12, 0.1]],
      "task-completed": [[523, 0, 0.12], [659, 0.14, 0.12], [784, 0.28, 0.22]],
    };
    const notes = patterns[kind] ?? patterns["task-received"];
    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  }, []);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      const ctx = ensureCtx();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {
          /* ignore */
        });
      }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return play;
}
