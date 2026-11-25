import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

/**
 * Tracks pointer coordinates over any element with `.spotlight-card`
 * to drive the soft dusty-mauve radial hover spotlight without per-card listeners.
 */
export function useCardSpotlight() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return undefined;

    let activeCard = null;
    let rafId = 0;
    let lastEvent = null;

    const update = () => {
      rafId = 0;
      if (!lastEvent) return;
      const target = lastEvent.target instanceof Element
        ? lastEvent.target.closest('.spotlight-card')
        : null;

      if (activeCard && activeCard !== target) {
        activeCard.removeAttribute('data-hovered');
      }
      activeCard = target;

      if (target) {
        const rect = target.getBoundingClientRect();
        const x = lastEvent.clientX - rect.left;
        const y = lastEvent.clientY - rect.top;
        target.style.setProperty('--mx', `${x.toFixed(1)}px`);
        target.style.setProperty('--my', `${y.toFixed(1)}px`);
        target.setAttribute('data-hovered', 'true');
      }
    };

    const handleMove = event => {
      lastEvent = event;
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    const handleLeave = () => {
      if (activeCard) {
        activeCard.removeAttribute('data-hovered');
        activeCard = null;
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', handleLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (activeCard) activeCard.removeAttribute('data-hovered');
    };
  }, []);
}

/**
 * Smoothly animates numeric values when a view opens or totals change.
 */
export function AnimatedValue({ value, format, duration = 520 }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const previousRef = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      previousRef.current = target;
      setDisplay(target);
      return undefined;
    }

    const from = previousRef.current;
    const delta = target - from;
    if (Math.abs(delta) < 0.01) {
      setDisplay(target);
      return undefined;
    }

    let frame = 0;
    const start = performance.now();

    const step = now => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + delta * eased);
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
      } else {
        previousRef.current = target;
        setDisplay(target);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      previousRef.current = target;
    };
  }, [target, duration]);

  return <>{format ? format(Math.round(display)) : Math.round(display)}</>;
}

/**
 * Floating Helios-style glass toast for instant visual confirmation.
 */
export function ToastBanner({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="helios-toast" role="status" aria-live="polite">
      <span className="helios-toast-icon">
        {toast.tone === 'sparkle' ? <Sparkles size={16} /> : <CheckCircle2 size={16} />}
      </span>
      <div className="helios-toast-copy">
        <b>{toast.title}</b>
        {toast.subtitle && <small>{toast.subtitle}</small>}
      </div>
      <button type="button" className="helios-toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
}
