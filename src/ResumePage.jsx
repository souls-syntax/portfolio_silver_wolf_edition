import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import char1 from './assets/Silverwolf_Render1_Hoyo-transparents.png';
import char2 from './assets/Silverwolf_Render2_Hoyo-transparents.png';
import char3 from './assets/Silverwolf_Render3_Hoyo-transparents.png';
import icon1 from './assets/icon1.png';
import icon2 from './assets/icon2.png';
import icon3 from './assets/icon3.png';

const ITEMS = [
  { id: 'edu',   title: 'EDUCATION',   subtitle: 'CS Undergrad',          icon: icon1, img: char1, tag: 'EDU',   badge: 'Lv.2', color: '#22d3ee' },
  { id: 'skill', title: 'TECH STACK',  subtitle: 'C · CUDA · Zig',        icon: icon2, img: char2, tag: 'SKILL', badge: 'Lv.5', color: '#a855f7' },
  { id: 'proj',  title: 'PROJECTS',    subtitle: 'OSdev · Shell · Loader', icon: icon3, img: char3, tag: 'PROJ',  badge: 'Lv.4', color: '#39ff14' },
  { id: 'lang',  title: 'LANGUAGES',   subtitle: 'C · CUDA · Zig',        icon: icon1, img: char1, tag: 'LANG',  badge: 'Lv.3', color: '#facc15' },
];

const CHAR_CROPS = {
  edu:   { objectPosition: 'center top',  transform: 'scale(1.2)' },
  skill: { objectPosition: 'center 15%', transform: 'scale(1.1)' },
  proj:  { objectPosition: 'center top',  transform: 'scale(1.3)' },
  lang:  { objectPosition: 'center 10%', transform: 'scale(1.2)' },
};

const DETAIL_DATA = [
  {
    topTitle:    'Education Log',
    subLevel:    'Superimposition Lv. 2',
    description: 'Computer Science undergraduate. Specializing in systems programming, OS internals, and low-level computing. Active open source contributor with real shipped projects.',
    bullets: [
      'B.Tech Computer Science — currently enrolled',
      'CGPA competitive, side projects prioritized',
      'Self-taught systems programmer since high school',
    ],
    links: ['#', '#', '#'],
  },
  {
    topTitle:    'Tech Stack',
    subLevel:    'Superimposition Lv. 5',
    description: 'Systems-first programming stack. C is the primary weapon. CUDA for GPU-accelerated workloads. Zig for memory-safe systems work. Shell scripting for automation.',
    bullets: [
      'C  ·  CUDA  ·  C++  ·  Zig',
      'Lua  ·  Shell  ·  Python (reluctantly)',
      'Neovim · Git · GDB · Valgrind · Make',
    ],
    links: ['#', '#', '#'],
  },
  {
    topTitle:    'Shipped Projects',
    subLevel:    'Superimposition Lv. 4',
    description: 'Real projects that actually run. OS from bare metal. A POSIX shell. A runtime loader. A typed C STL. Each one built to understand systems from the ground up.',
    bullets: [
      'sauceOS — x86_64 OS (Limine bootloader, Flanterm terminal)',
      'sush — POSIX shell written in C++',
      'tsundere-runtime — ELF runtime loader in Zig',
      'C-STL — generic containers in C with type tokens',
    ],
    links: [
      'https://github.com/souls-syntax/sauceOS',
      'https://github.com/souls-syntax/sush',
      'https://github.com/souls-syntax/tsundere-runtime',
      'https://github.com/souls-syntax/C-STL',
    ],
  },
  {
    topTitle:    'Languages',
    subLevel:    'Superimposition Lv. 3',
    description: 'Language fluency ranked by depth of understanding, not just syntax. C is home. CUDA for parallel computing. Zig is the future of systems.',
    bullets: [
      'C — primary language, used daily',
      'CUDA — GPU kernels, memory models',
      'C++ — sush shell, template metaprogramming',
      'Zig — tsundere-runtime, comptime wizardry',
    ],
    links: ['#', '#', '#', '#'],
  },
];

export default function ResumePage({ src }) {
  const navigate = useNavigate();
  const [active, setActive]   = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectorY, setSelectorY] = useState(null);
  const barRefs = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Track selector Y from active bar ref
  useEffect(() => {
    const el = barRefs.current[active];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSelectorY(rect.top + rect.height / 2);
  }, [active, mounted]);

  useEffect(() => {
    const onResize = () => {
      const el = barRefs.current[active];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSelectorY(rect.top + rect.height / 2);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') setActive(i => Math.min(ITEMS.length - 1, i + 1));
      if (e.key === 'ArrowUp')   setActive(i => Math.max(0, i - 1));
      if (e.key === 'Escape' || e.key === 'Backspace') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const detail = DETAIL_DATA[active];
  const item   = ITEMS[active];

  return (
    <div id="hsr-resume-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#06030f' }}>

      <video
        src={src}
        autoPlay loop muted playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
          filter: 'blur(8px) brightness(0.3) saturate(1.3)',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 65% 50%, transparent 15%, rgba(6,3,15,0.82) 100%)',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(6,3,15,0.72) 0%, transparent 50%)',
        zIndex: 1,
      }} />

      {/* Selector bracket */}
      {selectorY !== null && (
        <div style={{
          position: 'fixed', left: 0, top: selectorY,
          transform: 'translateY(-50%)', zIndex: 50, pointerEvents: 'none',
          transition: 'top 0.22s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            width: 4, height: 60,
            background: 'linear-gradient(180deg, #a855f7 0%, #22d3ee 100%)',
            boxShadow: '0 0 14px #a855f7, 0 0 28px rgba(168,85,247,0.4)',
            flexShrink: 0,
          }} />
          <svg width="30" height="60" viewBox="0 0 30 60"
            style={{ display: 'block', filter: 'drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 4px #a855f7)' }}
          >
            <defs>
              <linearGradient id="res-sel-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <polygon points="0,0 30,30 0,60" fill="url(#res-sel-grad)" opacity="0.92" />
          </svg>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap');

        #hsr-resume-screen { font-family: 'JetBrains Mono', monospace; }

        .res-overlay {
          position: absolute; inset: 0; z-index: 10;
          display: flex; flex-direction: column; overflow: hidden;
          opacity: 0; transform: translateX(22px);
          transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1);
        }
        .res-overlay.mounted { opacity: 1; transform: translateX(0); }

        /* HEADER */
        .res-header {
          position: relative; flex-shrink: 0; height: 72px;
          background: rgba(6,3,15,0.68); backdrop-filter: blur(18px);
          display: flex; align-items: center; padding: 0 40px; gap: 22px; z-index: 2;
        }
        .res-header::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, #22d3ee 0%, #a855f7 55%, rgba(168,85,247,0) 100%);
          box-shadow: 0 -1px 18px rgba(34,211,238,0.25);
        }
        .res-back-btn {
          font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px;
          color: #22d3ee; background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.3);
          padding: 7px 18px; cursor: pointer; transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%); flex-shrink: 0;
        }
        .res-back-btn:hover {
          background: rgba(34,211,238,0.15); border-color: #22d3ee; color: #fff;
          box-shadow: 0 0 18px rgba(34,211,238,0.35); transform: translateX(-3px);
        }
        .res-header-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 38px; letter-spacing: 5px;
          color: #fff; line-height: 1; user-select: none; white-space: nowrap;
          transform: skewX(-4deg); text-shadow: 0 0 28px rgba(34,211,238,0.35);
        }
        .res-header-slash {
          font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 3px;
          color: #22d3ee; font-style: italic; transform: skewX(-5deg);
          text-shadow: 0 0 18px rgba(34,211,238,0.7); line-height: 1; margin-left: 2px;
        }
        .res-header-sub {
          font-family: 'Bebas Neue', sans-serif; font-size: 10px; letter-spacing: 3px;
          color: rgba(34,211,238,0.45); padding-top: 4px; text-transform: uppercase;
        }

        /* BODY */
        .res-body { flex: 1; display: flex; overflow: hidden; }

        /* LEFT */
        .res-left {
          position: relative; width: 44vw; flex-shrink: 0;
          display: flex; flex-direction: column; align-items: flex-start;
          justify-content: center; overflow: hidden;
        }
        .res-char-bg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 0; overflow: hidden;
        }
        .res-char-bg img {
          width: 100%; height: 100%; object-fit: contain; object-position: center bottom;
          filter: drop-shadow(0 0 32px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(34,211,238,0.25));
          transform: skewX(-5deg) scale(1.05); transform-origin: center bottom;
          /* KEY: transition instead of remount — smooth crossfade on char swap */
          transition: opacity 0.35s ease;
          opacity: 0.55; will-change: transform, opacity;
        }

        /* Bar outer */
        .res-bar-outer {
          position: relative; flex-shrink: 0; width: 100%;
          transform: translateX(-110%);
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
          z-index: 2; cursor: pointer;
        }
        .res-bar-outer.mounted { transform: translateX(0); }
        .res-bar-outer:nth-child(1) { transition-delay: 0ms; }
        .res-bar-outer:nth-child(2) { transition-delay: 80ms; }
        .res-bar-outer:nth-child(3) { transition-delay: 160ms; }
        .res-bar-outer:nth-child(4) { transition-delay: 240ms; }

        .res-bar {
          position: relative; width: 42vw; height: 70px;
          background: rgba(10,5,20,0.78);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          border-left: 3px solid rgba(34,211,238,0.12); border-top: 1px solid rgba(255,255,255,0.04);
          box-shadow: 0 6px 28px rgba(0,0,0,0.6);
          transition: height 0.28s cubic-bezier(0.22,1,0.36,1), border-left-color 0.18s ease, background 0.18s ease;
          margin-bottom: 3px; overflow: hidden;
        }
        .res-bar-outer.active .res-bar { height: 94px; border-left-color: #22d3ee; background: rgba(18,8,32,0.88); }

        .res-bar-red {
          position: absolute; top: 0; left: 0; width: 42vw; height: 70px;
          background: #a855f7;
          clip-path: polygon(50% 0, 100% 0, 100% 100%, calc(50% - 12px) 100%);
          transform: translateY(-8px); opacity: 0;
          transition: opacity 0.2s ease, height 0.28s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none; z-index: 0;
        }
        .res-bar-outer.active .res-bar-red { opacity: 1; height: 94px; }

        .res-bar-fill {
          position: absolute; inset: 0; background: #ffffff;
          clip-path: polygon(100% 0, 100% 0, calc(100% - 36px) 100%, calc(100% - 36px) 100%);
          transition: clip-path 0.32s cubic-bezier(0.22,1,0.36,1); z-index: 0;
        }
        .res-bar-outer.active .res-bar-fill {
          clip-path: polygon(22% 0, 100% 0, calc(100% - 18px) 100%, calc(22% + 150px) 100%);
        }

        .res-bar-shade {
          position: absolute; top: 0; bottom: 0; left: 73%; width: 6%;
          background: linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%);
          z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.32s ease;
        }
        .res-bar-outer.active .res-bar-shade { opacity: 1; }

        .res-bar-content {
          position: relative; z-index: 2; height: 100%;
          display: flex; align-items: center; padding: 0 22px 0 52px; gap: 14px;
        }
        .res-bar-icon {
          width: 34px; height: 34px; object-fit: contain; flex-shrink: 0;
          opacity: 0.85; transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .res-bar-outer.active .res-bar-icon { opacity: 1; transform: scale(1.15); }
        .res-bar-text { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .res-bar-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 4px;
          color: rgba(255,255,255,0.82); line-height: 1; transition: color 0.18s ease; user-select: none;
        }
        .res-bar-outer.active .res-bar-title { color: #111; }
        .res-bar-sub {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1px;
          color: rgba(255,255,255,0.35); line-height: 1; transition: color 0.18s ease; user-select: none;
        }
        .res-bar-outer.active .res-bar-sub { color: rgba(0,0,0,0.5); }
        .res-bar-badge {
          font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 2px;
          padding: 3px 10px; border: 1px solid; flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
          transition: all 0.18s ease;
        }
        .res-bar-outer:not(.active):hover .res-bar { border-left-color: rgba(168,85,247,0.5); background: rgba(18,8,32,0.65); }
        .res-bar-outer:not(.active):hover .res-bar-title { color: #a855f7; text-shadow: 0 0 14px rgba(168,85,247,0.4); }

        /* RIGHT */
        .res-right {
          flex: 1; position: relative; display: flex;
          align-items: center; justify-content: flex-start;
          padding: 48px 44px 48px 52px; overflow-y: auto;
        }
        .res-right::-webkit-scrollbar { width: 2px; }
        .res-right::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); }

        /* ── Detail card — NO key remount, CSS transition only ── */
        .res-detail-card {
          position: relative; width: 100%; max-width: 520px;
          background: rgba(6,3,15,0.48); backdrop-filter: blur(12px);
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 38px), calc(100% - 38px) 100%, 0 100%);
          border-top: 1px solid rgba(34,211,238,0.22);
          border-left: 3px solid rgba(168,85,247,0.35);
          border-right: 1px solid rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .res-detail-card::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px);
          pointer-events: none; z-index: 1;
          animation: res-scan 6s linear infinite;
        }
        @keyframes res-scan {
          from { background-position-y: 0px; }
          to   { background-position-y: 80px; }
        }
        .res-detail-card::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
          background: linear-gradient(90deg, #22d3ee 0%, #a855f7 60%, transparent 100%); z-index: 2;
        }

        .res-detail-corner { position: absolute; bottom: 0; right: 0; width: 60px; height: 60px; pointer-events: none; z-index: 3; }

        .res-detail-inner { position: relative; z-index: 2; padding: 28px 32px 32px 32px; }

        .res-detail-tag {
          font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 3px;
          color: #22d3ee; background: rgba(34,211,238,0.07); border: 1px solid rgba(34,211,238,0.22);
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 12px; margin-bottom: 14px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          /* Smooth fade on content change */
          transition: opacity 0.2s ease;
        }
        .res-detail-tag-dot {
          width: 5px; height: 5px; background: #22d3ee; border-radius: 50%;
          animation: res-pulse 1.8s ease-in-out infinite;
        }
        @keyframes res-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px #22d3ee; }
          50%       { opacity: 0.4; box-shadow: none; }
        }

        /* Title — transitions in place, no remount */
        .res-detail-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 54px; letter-spacing: 5px;
          line-height: 0.95; color: #fff; transform: skewX(-4deg);
          text-shadow: 0 0 32px rgba(34,211,238,0.2); margin-bottom: 3px; user-select: none;
          transition: opacity 0.18s ease;
        }
        .res-detail-title-slash {
          font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px;
          color: #a855f7; font-style: italic; transform: skewX(-5deg);
          text-shadow: 0 0 14px rgba(168,85,247,0.65); margin-bottom: 18px; user-select: none;
          transition: opacity 0.18s ease;
        }
        .res-detail-divider {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, rgba(34,211,238,0.4) 0%, rgba(168,85,247,0.2) 50%, transparent 100%);
          margin-bottom: 18px;
        }
        .res-detail-desc {
          font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
          line-height: 1.68; color: rgba(200,215,230,0.65); margin-bottom: 22px; letter-spacing: 0.3px;
          transition: opacity 0.18s ease;
        }

        /* Bullets — stagger via CSS only, no key remount */
        .res-bullets { display: flex; flex-direction: column; gap: 7px; margin-bottom: 26px; }
        .res-bullet {
          display: flex; align-items: flex-start; gap: 10px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: rgba(220,235,245,0.75); line-height: 1.5; letter-spacing: 0.3px;
          padding: 7px 14px; background: rgba(34,211,238,0.03);
          border-left: 2px solid rgba(34,211,238,0.18);
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
          transition: border-left-color 0.14s ease, background 0.14s ease, opacity 0.18s ease;
          cursor: default;
        }
        .res-bullet:hover { border-left-color: #22d3ee; background: rgba(34,211,238,0.06); color: rgba(240,250,255,0.9); }
        .res-bullet-arrow { color: #22d3ee; font-size: 12px; flex-shrink: 0; margin-top: 1px; transition: color 0.14s ease, transform 0.14s ease; }
        .res-bullet:hover .res-bullet-arrow { color: #39ff14; transform: translateX(3px); }

        .res-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .res-link {
          font-family: 'Bebas Neue', sans-serif; font-size: 12px; letter-spacing: 2px;
          color: rgba(168,85,247,0.7); background: rgba(168,85,247,0.05);
          border: 1px solid rgba(168,85,247,0.22); padding: 5px 14px; text-decoration: none;
          clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 100%, 0 100%);
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .res-link:hover { color: #39ff14; border-color: #39ff14; background: rgba(57,255,20,0.07); box-shadow: 0 0 14px rgba(57,255,20,0.2); transform: translateY(-2px); }
        .res-link[href='#'] { opacity: 0.35; pointer-events: none; }

        /* Footer */
        .res-footer {
          position: fixed; bottom: 20px; right: 28px;
          display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif; z-index: 40;
          opacity: 0; transition: opacity 0.4s ease 0.6s;
        }
        .res-footer.mounted { opacity: 1; }
        .res-footer-row { display: flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,0.3); }
        .res-footer-key { border: 1px solid rgba(34,211,238,0.45); color: #22d3ee; padding: 1px 6px; font-size: 10px; clip-path: polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%); }

        /* Glitch */
        @keyframes res-glitch-1 {
          0%,94%,100% { clip-path: inset(50% 0 30% 0); transform: translate(-2px,0); opacity: 0; }
          95%          { clip-path: inset(50% 0 30% 0); transform: translate(-2px,0); opacity: 0.8; }
          97%          { clip-path: inset(10% 0 70% 0); transform: translate(2px,0);  opacity: 0.6; }
        }
        @keyframes res-glitch-2 {
          0%,88%,100% { clip-path: inset(20% 0 60% 0); transform: translate(3px,0); opacity: 0; }
          89%          { clip-path: inset(20% 0 60% 0); transform: translate(3px,0); opacity: 0.5; }
          91%          { clip-path: inset(70% 0 10% 0); transform: translate(-3px,0); opacity: 0.3; }
        }
        .res-glitch-wrap { position: relative; display: inline-block; }
        .res-glitch-wrap::before, .res-glitch-wrap::after {
          content: attr(data-text); position: absolute; inset: 0;
          font-family: 'Bebas Neue', sans-serif; font-size: inherit; letter-spacing: inherit; line-height: inherit; pointer-events: none;
        }
        .res-glitch-wrap::before { color: #22d3ee; animation: res-glitch-1 5s linear infinite; }
        .res-glitch-wrap::after  { color: #a855f7; animation: res-glitch-2 5s linear infinite; }
      `}</style>

      <div className={`res-overlay${mounted ? ' mounted' : ''}`}>

        {/* HEADER */}
        <div className="res-header">
          <button className="res-back-btn" onClick={() => navigate(-1)}>← BACK</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div className="res-header-title">PROFILE</div>
              <div className="res-header-slash">// data log</div>
            </div>
            <div className="res-header-sub">SOULS SYNTAX — SYSTEM INTEGRITY REPORT</div>
          </div>
        </div>

        {/* BODY */}
        <div className="res-body">

          {/* LEFT — selector bars */}
          <div className="res-left">
            <div className="res-char-bg">
              {/* Render all chars, only show active — no remount, just opacity swap */}
              {ITEMS.map((it, i) => (
                <img
                  key={it.id}
                  src={it.img}
                  alt=""
                  style={{
                    ...CHAR_CROPS[it.id],
                    position: i === 0 ? 'relative' : 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain', objectPosition: 'center bottom',
                    filter: 'drop-shadow(0 0 32px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(34,211,238,0.25))',
                    transformOrigin: 'center bottom',
                    opacity: active === i ? 0.55 : 0,
                    transition: 'opacity 0.35s ease',
                    willChange: 'opacity',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </div>

            {ITEMS.map((it, i) => (
              <div
                key={it.id}
                ref={el => barRefs.current[i] = el}
                className={`res-bar-outer${active === i ? ' active' : ''}${mounted ? ' mounted' : ''}`}
                onClick={() => setActive(i)}
                onMouseEnter={() => { if (active !== i) setActive(i); }}
                style={{ transitionDelay: mounted ? `${i * 80}ms` : '0ms' }}
              >
                <div className="res-bar-red" />
                <div className="res-bar">
                  <div className="res-bar-fill" />
                  <div className="res-bar-shade" />
                  <div className="res-bar-content">
                    <img
                      className="res-bar-icon"
                      src={it.icon}
                      alt=""
                      style={{ filter: `drop-shadow(0 0 6px ${it.color})` }}
                    />
                    <div className="res-bar-text">
                      <div className="res-bar-title">{it.title}</div>
                      <div className="res-bar-sub">{it.subtitle}</div>
                    </div>
                    <div
                      className="res-bar-badge"
                      style={{ color: it.color, borderColor: it.color, background: `${it.color}12` }}
                    >
                      {it.tag} {it.badge}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — detail panel, NO key prop — stays mounted, content updates in place */}
          <div className="res-right">
            <div className="res-detail-card">

              <svg className="res-detail-corner" viewBox="0 0 60 60" fill="none">
                <polyline points="0,60 60,60 60,0" stroke="rgba(168,85,247,0.35)" strokeWidth="1.5" fill="none" />
                <polyline points="10,60 60,10" stroke="rgba(34,211,238,0.18)" strokeWidth="1" fill="none" />
              </svg>

              <div className="res-detail-inner">

                <div className="res-detail-tag">
                  <div className="res-detail-tag-dot" />
                  {item.tag} · {detail.subLevel.toUpperCase()}
                </div>

                <div
                  className="res-glitch-wrap res-detail-title"
                  data-text={detail.topTitle.toUpperCase()}
                >
                  {detail.topTitle.toUpperCase()}
                </div>

                <div className="res-detail-title-slash">// {item.subtitle}</div>
                <div className="res-detail-divider" />
                <div className="res-detail-desc">{detail.description}</div>

                <div className="res-bullets">
                  {detail.bullets.map((b, bi) => (
                    <div key={bi} className="res-bullet">
                      <span className="res-bullet-arrow">▶</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="res-links">
                  {detail.bullets.map((b, bi) => {
                    const link = detail.links[bi] || '#';
                    const label = link === '#'
                      ? `REF_${String(bi + 1).padStart(2, '0')}`
                      : link.replace('https://github.com/', '').split('/').pop().toUpperCase();
                    return (
                      <a
                        key={bi}
                        className="res-link"
                        href={link}
                        target={link !== '#' ? '_blank' : undefined}
                        rel="noopener noreferrer"
                      >
                        ↗ {label}
                      </a>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className={`res-footer${mounted ? ' mounted' : ''}`}>
          <div className="res-footer-row"><span className="res-footer-key">↑↓</span><span>SELECT</span></div>
          <div className="res-footer-row"><span className="res-footer-key">ESC</span><span>BACK</span></div>
        </div>

      </div>
    </div>
  );
}
