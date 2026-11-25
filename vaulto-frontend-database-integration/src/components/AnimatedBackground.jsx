import { useEffect, useRef } from 'react';

// Restrained, minimal floating '$' markers at subtle opacity so foreground typography stays razor-sharp.
const floatingDollars = [
  { x: '7%', y: '22%', size: 28, speed: 16, delay: -2, layer: 'mid' },
  { x: '16%', y: '78%', size: 22, speed: 19, delay: -7, layer: 'far' },
  { x: '84%', y: '18%', size: 32, speed: 17, delay: -4, layer: 'near' },
  { x: '91%', y: '54%', size: 24, speed: 15, delay: -9, layer: 'mid' },
  { x: '76%', y: '82%', size: 26, speed: 20, delay: -11, layer: 'far' },
  { x: '44%', y: '14%', size: 20, speed: 18, delay: -5, layer: 'far' },
  { x: '62%', y: '88%', size: 22, speed: 16, delay: -3, layer: 'mid' },
  { x: '94%', y: '84%', size: 30, speed: 21, delay: -12, layer: 'near' },
];

// Fine crimson ember sparks inspired by Nexora's subtle orbital particles.
const embers = [
  { x: '12%', y: '32%', size: 3, delay: -1, duration: 7 },
  { x: '27%', y: '16%', size: 2, delay: -3, duration: 9 },
  { x: '79%', y: '28%', size: 3, delay: -2, duration: 8 },
  { x: '88%', y: '66%', size: 2.5, delay: -5, duration: 6.5 },
  { x: '68%', y: '74%', size: 2, delay: -4, duration: 8.5 },
  { x: '22%', y: '64%', size: 2.5, delay: -6, duration: 7.5 },
  { x: '53%', y: '24%', size: 2, delay: -2.5, duration: 9.5 },
  { x: '93%', y: '38%', size: 3, delay: -4.5, duration: 7 },
];

function OrbitalArcs() {
  return (
    <svg
      className="nexora-orbits"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="crimson-arc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF3B3A" stopOpacity="0" />
          <stop offset="35%" stopColor="#EF3B3A" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#FF7A7A" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#EF3B3A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="crimson-arc-subtle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF3B3A" stopOpacity="0" />
          <stop offset="50%" stopColor="#C81E24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EF3B3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse
        className="orbit-path orbit-path-1"
        cx="1120"
        cy="780"
        rx="560"
        ry="150"
        transform="rotate(-14 1120 780)"
        fill="none"
        stroke="url(#crimson-arc)"
        strokeWidth="1.15"
      />
      <ellipse
        className="orbit-path orbit-path-2"
        cx="1120"
        cy="780"
        rx="440"
        ry="110"
        transform="rotate(9 1120 780)"
        fill="none"
        stroke="url(#crimson-arc-subtle)"
        strokeWidth="1"
      />
      <circle className="orbit-spark" cx="760" cy="705" r="2.6" />
      <circle className="orbit-spark orbit-spark-2" cx="1310" cy="648" r="2.2" />
    </svg>
  );
}

export default function AnimatedBackground() {
  const backgroundRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const updateScroll = () => {
      frame = 0;
      if (document.hidden) return;
      const page = document.documentElement;
      const scrollable = page.scrollHeight - window.innerHeight;
      const rawScrollY = window.scrollY || 0;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, rawScrollY / scrollable)) : 0;

      background.style.setProperty('--scroll-progress', progress.toFixed(4));
      background.style.setProperty('--scroll-y', `${rawScrollY.toFixed(1)}px`);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const requestUpdate = () => {
      if (!frame && !document.hidden) {
        frame = window.requestAnimationFrame(updateScroll);
      }
    };

    const applyMotionMode = () => {
      background.dataset.scrollDriver = reducedMotion.matches ? 'reduced' : 'active';
      if (!reducedMotion.matches) requestUpdate();
    };

    const handleVisibility = () => {
      document.body.classList.toggle('is-hidden', document.hidden);
      if (!document.hidden) requestUpdate();
    };

    applyMotionMode();
    updateScroll();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener?.('change', applyMotionMode);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener?.('change', applyMotionMode);
      document.body.classList.remove('is-hidden');
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress-track" aria-hidden="true">
        <div ref={progressBarRef} className="scroll-progress-bar" />
      </div>
      <div ref={backgroundRef} className="animated-background" data-scroll-driver="active" aria-hidden="true">
        <div className="background-vignette" />
        <div className="background-grid" />
        <div className="background-noise" />
        <OrbitalArcs />

        <div className="ember-particles">
          {embers.map((ember, index) => (
            <span
              key={index}
              className="ember-dot"
              style={{
                '--ex': ember.x,
                '--ey': ember.y,
                '--esize': `${ember.size}px`,
                '--edelay': `${ember.delay}s`,
                '--edur': `${ember.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="floating-dollars">
          {floatingDollars.map((item, index) => (
            <span
              key={index}
              className={`dollar-glyph dollar-${item.layer}`}
              style={{
                '--dx': item.x,
                '--dy': item.y,
                '--dsize': `${item.size}px`,
                '--dspeed': `${item.speed}s`,
                '--ddelay': `${item.delay}s`,
              }}
            >
              $
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
