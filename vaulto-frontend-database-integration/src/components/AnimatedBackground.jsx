import { useEffect, useRef } from 'react';

// Twelve lightweight SVG notes provide the floating depth around the piggy bank.
const bills = [
  { x: '8%', y: '19%', size: 76, speed: 13, delay: -2, drift: '20px' },
  { x: '22%', y: '67%', size: 62, speed: 15, delay: -8, drift: '24px' },
  { x: '35%', y: '13%', size: 52, speed: 12, delay: -5, drift: '14px' },
  { x: '67%', y: '17%', size: 70, speed: 14, delay: -10, drift: '-18px' },
  { x: '84%', y: '33%', size: 56, speed: 17, delay: -4, drift: '-22px' },
  { x: '75%', y: '72%', size: 78, speed: 16, delay: -12, drift: '-26px' },
  { x: '11%', y: '48%', size: 48, speed: 11, delay: -7, drift: '17px' },
  { x: '91%', y: '58%', size: 44, speed: 13, delay: -1, drift: '-16px' },
  { x: '47%', y: '81%', size: 58, speed: 15, delay: -9, drift: '10px' },
  { x: '57%', y: '8%', size: 42, speed: 12, delay: -3, drift: '-10px' },
  { x: '29%', y: '38%', size: 40, speed: 18, delay: -14, drift: '12px' },
  { x: '94%', y: '84%', size: 64, speed: 16, delay: -6, drift: '-20px' },
];

const symbols = [
  { value: '₹', x: '14%', y: '34%', size: 26 },
  { value: '$', x: '80%', y: '19%', size: 22 },
  { value: '€', x: '89%', y: '46%', size: 30 },
  { value: '£', x: '29%', y: '82%', size: 20 },
  { value: '¥', x: '69%', y: '87%', size: 24 },
  { value: '%', x: '7%', y: '78%', size: 23 },
];

function Banknote({ note }) {
  return (
    <div
      className="money-bill-depth"
      aria-hidden="true"
      style={{
        '--bill-x': note.x,
        '--bill-y': note.y,
        '--bill-size': `${note.size}px`,
        '--bill-speed': `${note.speed}s`,
        '--bill-delay': `${note.delay}s`,
        '--bill-drift': note.drift,
      }}
    >
      <svg className="money-bill" viewBox="0 0 96 52" focusable="false">
        <rect x="2" y="2" width="92" height="48" rx="5" />
        <rect className="money-bill-inset" x="8" y="8" width="80" height="36" rx="3" />
        <circle cx="48" cy="26" r="10" />
        <path d="M16 17h10M70 35h10M20 35h5M71 17h5" />
        <path d="M43 26h10m-5-5v10" />
      </svg>
    </div>
  );
}

function PiggyBank() {
  return (
    <div className="piggy-scroll" aria-hidden="true">
      <svg className="piggy-illustration" viewBox="0 0 420 300" focusable="false">
        <defs>
          <linearGradient id="piggy-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DCFCE7" stopOpacity=".38" />
            <stop offset=".45" stopColor="#22A55A" stopOpacity=".2" />
            <stop offset="1" stopColor="#0E7C66" stopOpacity=".34" />
          </linearGradient>
          <linearGradient id="piggy-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B6FF5C" stopOpacity=".72" />
            <stop offset="1" stopColor="#22A55A" stopOpacity=".48" />
          </linearGradient>
          <radialGradient id="piggy-glow">
            <stop stopColor="#B6FF5C" stopOpacity=".48" />
            <stop offset="1" stopColor="#22A55A" stopOpacity="0" />
          </radialGradient>
          <filter id="piggy-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="piggy-silhouette">
            <path d="M75 169C52 160 40 143 43 122c3-21 21-37 49-44L82 47c-2-8 5-12 12-6l27 24c21-6 46-5 68 3 20-20 45-21 66-2l14 14c26 3 47 17 56 37l29 9c13 4 15 20 1 26l-28 10c-7 20-21 34-42 42v31c0 7-5 11-12 11h-16c-7 0-11-4-11-11v-23c-21 5-43 5-64 0l-4 24c-1 7-6 10-12 10h-16c-7 0-11-4-11-11v-33c-24-7-42-20-54-38Z" />
          </clipPath>
        </defs>

        <ellipse className="piggy-aura" cx="211" cy="156" rx="181" ry="131" fill="url(#piggy-glow)" />
        <path className="piggy-tail" d="M57 151c-25-4-33-27-19-39 10-8 23-3 22 7-1 7-9 8-12 4" />
        <g clipPath="url(#piggy-silhouette)">
          <rect className="piggy-fill" x="35" y="58" width="350" height="195" fill="url(#piggy-fill)" />
          <ellipse cx="212" cy="172" rx="147" ry="82" fill="url(#piggy-glow)" />
          <circle className="piggy-star" cx="130" cy="138" r="2.4" />
          <circle className="piggy-star" cx="190" cy="167" r="1.8" />
          <circle className="piggy-star" cx="254" cy="127" r="2.1" />
          <circle className="piggy-star" cx="289" cy="166" r="1.6" />
          <circle className="piggy-star" cx="160" cy="185" r="1.4" />
        </g>
        <path
          className="piggy-body"
          d="M75 169C52 160 40 143 43 122c3-21 21-37 49-44L82 47c-2-8 5-12 12-6l27 24c21-6 46-5 68 3 20-20 45-21 66-2l14 14c26 3 47 17 56 37l29 9c13 4 15 20 1 26l-28 10c-7 20-21 34-42 42v31c0 7-5 11-12 11h-16c-7 0-11-4-11-11v-23c-21 5-43 5-64 0l-4 24c-1 7-6 10-12 10h-16c-7 0-11-4-11-11v-33c-24-7-42-20-54-38Z"
        />
        <path className="piggy-highlight" d="M89 103c27-27 84-36 127-18m-124 96c26 24 79 35 127 25" />
        <path className="piggy-slot-glow" d="M161 68c13-5 29-5 43 0" />
        <path className="piggy-slot" d="M163 67c12-4 27-4 39 0" />
        <circle className="piggy-eye" cx="286" cy="112" r="4" />
        <ellipse className="piggy-nose" cx="355" cy="143" rx="3" ry="4" />
        <ellipse className="piggy-nose" cx="345" cy="143" rx="2.5" ry="3.5" />
        <circle className="piggy-coin" cx="184" cy="31" r="12" />
        <path className="piggy-coin-mark" d="M181 31h6m-3-4v8" />
      </svg>
    </div>
  );
}

function ChartDoodles() {
  return (
    <svg className="finance-doodles" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="doodle-chart doodle-chart-left">
        <path className="doodle-line" d="M74 475l78-45 64 18 75-94 69 22 75-97" />
        <path className="doodle-arrow" d="M412 279l24-3-4 23" />
        <path className="doodle-bars" d="M103 582v-45m34 45v-78m34 78v-57m34 57v-102m34 102v-128" />
      </g>
      <g className="doodle-chart doodle-chart-right">
        <path className="doodle-candle" d="M1130 280v82m-12-60h24v28h-24zm52-62v103m-12-76h24v39h-24zm52-19v88m-12-60h24v27h-24zm52-80v99m-12-72h24v32h-24z" />
        <path className="doodle-line" d="M1080 432l58-35 55 14 68-78 53 16 72-97" />
        <path className="doodle-arrow" d="M1374 240l21-3-3 22" />
      </g>
      <g className="doodle-coins">
        <circle cx="168" cy="267" r="21" /><circle cx="168" cy="267" r="14" />
        <path d="M161 267h14m-7-8v16" />
        <circle cx="1261" cy="647" r="24" /><circle cx="1261" cy="647" r="16" />
        <path d="M1254 647h14m-7-8v16" />
      </g>
    </svg>
  );
}

export default function AnimatedBackground() {
  const backgroundRef = useRef(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const supportsTimeline = typeof CSS !== 'undefined'
      && CSS.supports('animation-timeline: scroll()');
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      if (document.hidden) return;
      const page = document.documentElement;
      const scrollable = page.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      background.style.setProperty('--scroll-progress', String(Math.min(1, Math.max(0, progress))));
    };

    const requestProgressUpdate = () => {
      if (!frame && !document.hidden) frame = window.requestAnimationFrame(updateProgress);
    };

    const applyMotionMode = () => {
      background.dataset.scrollDriver = reducedMotion.matches
        ? 'reduced'
        : supportsTimeline ? 'timeline' : 'fallback';
      if (!reducedMotion.matches && !supportsTimeline) requestProgressUpdate();
    };

    const handleVisibility = () => {
      document.body.classList.toggle('is-hidden', document.hidden);
      if (!document.hidden) requestProgressUpdate();
    };

    applyMotionMode();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener?.('change', applyMotionMode);

    return () => {
      window.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('resize', requestProgressUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener?.('change', applyMotionMode);
      document.body.classList.remove('is-hidden');
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={backgroundRef} className="animated-background" data-scroll-driver="timeline" aria-hidden="true">
      <div className="background-aurora" />
      <div className="background-stars" />
      <div className="background-noise" />
      <ChartDoodles />
      <div className="finance-symbols">
        {symbols.map((symbol, index) => (
          <span key={`${symbol.value}-${index}`} style={{ left: symbol.x, top: symbol.y, fontSize: symbol.size }}>
            {symbol.value}
          </span>
        ))}
      </div>
      <div className="floating-coins"><i /><i /><i /></div>
      <div className="money-bills">
        {bills.map((bill, index) => <Banknote key={index} note={bill} />)}
      </div>
      <PiggyBank />
      <div className="background-sparkles" />
    </div>
  );
}
