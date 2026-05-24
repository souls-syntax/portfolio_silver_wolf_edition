import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import char1 from "./assets/Silverwolf_Render1_Hoyo-transparents.png";
import char2 from "./assets/Silverwolf_Render2_Hoyo-transparents.png";
import char3 from "./assets/Silverwolf_Render3_Hoyo-transparents.png";
import icon1 from "./assets/icon1.png";
import icon2 from "./assets/icon2.png";
import icon3 from "./assets/icon3.png";
import bgVideo from "./assets/silver-wolf-honkai-star-rail-4k-wallpaperwaifu-com.mp4";

/* ─── Data ──────────────────────────────────────────────────────────────── */
const ITEMS = [
  { id: "github",  title: "GITHUB",  subtitle: "@souls-syntax",  icon: icon1, img: char1 },
  { id: "twitter", title: "TWITTER", subtitle: "@souls_syntax",  icon: icon2, img: char2 },
  { id: "email",   title: "CONTACT", subtitle: "Direct Message", icon: icon3, img: char3 },
];

const CHAR_CROPS = {
  github:  { objectPosition: "center 10%", transform: "scale(1.2)" },
  twitter: { objectPosition: "center top",  transform: "scale(1.3)" },
  email:   { objectPosition: "center 15%", transform: "scale(1.15)" },
};

/* Per-card accent colors so each platform feels unique */
const CARD_ACCENT = {
  github:  { primary: "#22d3ee", secondary: "#a855f7", badge: "#facc15" },
  twitter: { primary: "#a855f7", secondary: "#22d3ee", badge: "#39ff14" },
  email:   { primary: "#39ff14", secondary: "#facc15", badge: "#22d3ee" },
};

const DETAIL_DATA = {
  0: {
    topTitle: "GitHub Profile",
    subLevel: "Level 99",
    rarity: "★★★★★",
    type: "PASSIVE — CODE_NEXUS",
    description:
      "Increases code repository visibility by 100%. When the wearer commits code, there is a 50% base chance to spawn an open-source contributor. Increases 'Star' drops on all repositories by 15%.",
    stats: [
      { tag: "REPO",  value: "57+",  color: "#22d3ee" },
      { tag: "STAR",  value: "13",   color: "#facc15" },
      { tag: "LANG",  value: "5+",   color: "#a855f7" },
    ],
    bullets: [
      "github.com/souls-syntax/tsundere-runtime",
      "github.com/souls-syntax/sauceOS",
      "github.com/souls-syntax/sush",
      "github.com/souls-syntax/C-STL",
    ],
    links: [
      "https://github.com/souls-syntax/tsundere-runtime",
      "https://github.com/souls-syntax/sauceOS",
      "https://github.com/souls-syntax/sush",
      "https://github.com/souls-syntax/C-STL",
    ],
    url: "https://github.com/souls-syntax",
  },
  1: {
    topTitle: "Twitter / X Profile",
    subLevel: "Superimposition Lv. 1",
    rarity: "★★★★",
    type: "ACTIVE — AETHER_DMG",
    description:
      "The wearer's threads deal Aether DMG to the timeline. Increases tech-posting frequency by 20%. After the wearer uses a 'Reply', there is a 100% chance to engage in a low-level programming debate.",
    stats: [
      { tag: "POSTS", value: "∞",    color: "#a855f7" },
      { tag: "REACH", value: "MAX",  color: "#22d3ee" },
      { tag: "RATIO", value: "W",    color: "#39ff14" },
    ],
    bullets: [
      "twitter.com/souls_syntax — Latest tweets",
      "twitter.com/souls_syntax — Tech threads",
      "twitter.com/souls_syntax — Media & clips",
    ],
    links: [
      "https://twitter.com/souls_syntax",
      "https://twitter.com/souls_syntax",
      "https://twitter.com/souls_syntax",
    ],
    url: "https://twitter.com/souls_syntax",
  },
  2: {
    topTitle: "Direct Contact",
    subLevel: "Superimposition Lv. 5",
    rarity: "★★★★★",
    type: "BREAK — FIREWALL_PIERCE",
    description:
      "Bypasses all firewall resistances. Directly applies 'Incoming Message' debuff to the target. Best used for collaborative opportunities, bug reports, or sending cool system-level tricks.",
    stats: [
      { tag: "PING",  value: "0ms",  color: "#39ff14" },
      { tag: "PRIO",  value: "HIGH", color: "#facc15" },
      { tag: "RESP",  value: "24H",  color: "#22d3ee" },
    ],
    bullets: [
      "Message via GitHub profile",
      "Message via Twitter DMs",
    ],
    links: [
      "https://github.com/souls-syntax",
      "https://twitter.com/souls_syntax",
    ],
    url: "https://github.com/souls-syntax",
  },
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Socials() {
  const navigate    = useNavigate();
  const [active,  setActive]  = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);
  /* glitch flicker state */
  const [glitch,  setGlitch]  = useState(false);
  const glitchTimer = useRef(null);

  /* Mount animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Periodic glitch on title */
  useEffect(() => {
    const kick = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
      glitchTimer.current = setTimeout(kick, 3200 + Math.random() * 2000);
    };
    glitchTimer.current = setTimeout(kick, 1200);
    return () => clearTimeout(glitchTimer.current);
  }, []);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  setActive(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setActive(i => Math.min(ITEMS.length - 1, i + 1));
      if (e.key === "Escape" || e.key === "Backspace") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  /* Which index is "focused" — hover overrides keyboard selection for visual feedback */
  const focusIdx = hovered !== null ? hovered : active;
  const detail   = DETAIL_DATA[active];
  const accentC  = CARD_ACCENT[ITEMS[active].id];

  return (
    <div id="sw-socials-screen">

      {/* ── Background video ── */}
      <video
        src={bgVideo}
        autoPlay loop muted playsInline
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
          filter: "blur(8px) brightness(0.3) saturate(1.3)",
        }}
      />

      {/* ── Radial vignette ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 10%, rgba(6,3,15,0.82) 100%)",
        zIndex: 1, pointerEvents: "none",
      }} />

      {/* ── Directional gradient — darkens left edge for readability ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(6,3,15,0.7) 0%, transparent 20%, transparent 75%, rgba(6,3,15,0.9) 100%)",
        zIndex: 1, pointerEvents: "none",
      }} />

      {/* ── Scanline texture ── */}
      <div className="sw-scanlines" />

      {/* ── Inline styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Barlow+Condensed:ital,wght@0,400;0,700;1,700&display=swap');

        /* ─ Root shell ───────────────────────────────── */
        #sw-socials-screen {
          position: absolute; inset: 0;
          overflow: hidden;
          background: #06030f;
        }

        /* ─ Scanlines ─────────────────────────────────*/
        .sw-scanlines {
          position: absolute; inset: 0; z-index: 2;
          pointer-events: none;
          background: repeating-linear-gradient(
            180deg,
            transparent 0px, transparent 3px,
            rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px
          );
        }

        /* ─ Header bar ────────────────────────────────*/
        .sw-header {
          position: absolute; top: 0; left: 0; right: 0; height: 72px;
          z-index: 20;
          background: rgba(6,3,15,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex; align-items: center;
          padding: 0 40px; gap: 20px;
        }
        .sw-header::after {
          content: "";
          position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, #22d3ee 0%, #a855f7 55%, rgba(168,85,247,0) 100%);
          box-shadow: 0 -1px 18px rgba(34,211,238,0.25);
        }

        /* ─ Back button ───────────────────────────────*/
        .sw-back-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px; letter-spacing: 3px;
          color: #22d3ee;
          background: rgba(34,211,238,0.06);
          border: 1px solid rgba(34,211,238,0.35);
          padding: 6px 20px;
          cursor: pointer;
          clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%);
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
        }
        .sw-back-btn:hover {
          background: rgba(34,211,238,0.16);
          border-color: #22d3ee;
          color: #fff;
          box-shadow: 0 0 18px rgba(34,211,238,0.35);
          transform: translateX(-3px);
        }

        /* ─ Header title ──────────────────────────────*/
        .sw-header-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 38px; letter-spacing: 6px;
          color: #fff; line-height: 1;
          transform: skewX(-4deg);
          text-shadow: 0 0 28px rgba(34,211,238,0.4);
          user-select: none;
        }
        .sw-header-slash {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px; letter-spacing: 3px;
          color: #22d3ee; font-style: italic;
          transform: skewX(-5deg);
          text-shadow: 0 0 18px rgba(34,211,238,0.7);
          line-height: 1; margin-left: 4px;
        }
        .sw-header-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 3px;
          color: rgba(34,211,238,0.4); padding-top: 4px;
          text-transform: uppercase;
        }
        .sw-header-badge {
          margin-left: auto;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px; letter-spacing: 2px;
          color: #a855f7;
          border: 1px solid rgba(168,85,247,0.4);
          padding: 4px 14px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }

        /* ─ Glitch on header title ────────────────────*/
        @keyframes sw-glitch-h {
          0%   { text-shadow: 0 0 28px rgba(34,211,238,0.4); clip-path: none; }
          20%  { text-shadow: -3px 0 #a855f7, 3px 0 #22d3ee, 0 0 28px rgba(34,211,238,0.4); clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
          40%  { text-shadow: 3px 0 #39ff14, -3px 0 #a855f7, 0 0 28px rgba(34,211,238,0.4); clip-path: none; }
          60%  { text-shadow: -2px 0 #22d3ee, 2px 0 #a855f7, 0 0 28px rgba(34,211,238,0.4); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
          100% { text-shadow: 0 0 28px rgba(34,211,238,0.4); clip-path: none; }
        }
        .sw-header-title.glitching {
          animation: sw-glitch-h 0.18s steps(2) both;
        }

        /* ─ Cards arena ───────────────────────────────*/
        .sw-cards-arena {
          position: absolute;
          top: 72px; left: 0; right: 0; bottom: 72px;
          z-index: 10;
          display: flex;
          align-items: stretch;
          gap: 0;
          overflow: hidden;
        }

        /* ─ Individual equipment card ─────────────────*/
        .sw-eq-card {
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          cursor: pointer;
          transition:
            flex 0.55s cubic-bezier(0.22,1,0.36,1),
            filter 0.4s ease,
            opacity 0.4s ease;

          /* collapsed = thin sliver */
          flex: 0 0 88px;
        }
        .sw-eq-card.active {
          flex: 1 1 0%;
          cursor: default;
        }
        .sw-eq-card:not(.active) {
          filter: brightness(0.45) saturate(0.5);
        }
        .sw-eq-card:not(.active):hover {
          filter: brightness(0.7) saturate(0.8);
        }

        /* Parallelogram clip — each card leans inward */
        .sw-eq-card:nth-child(1) {
          clip-path: polygon(0 0, calc(100% - 0px) 0, calc(100% - 24px) 100%, 0 100%);
        }
        .sw-eq-card:nth-child(2) {
          clip-path: polygon(16px 0, calc(100% - 16px) 0, calc(100% - 40px) 100%, -8px 100%);
          margin-left: -24px;
          z-index: 1;
        }
        .sw-eq-card:nth-child(3) {
          clip-path: polygon(24px 0, 100% 0, 100% 100%, 0px 100%);
          margin-left: -24px;
          z-index: 2;
        }

        /* ─ Slide-in on mount ─────────────────────────*/
        @keyframes sw-card-rise {
          from { opacity: 0; transform: translateY(60px) skewX(-3deg); }
          to   { opacity: 1; transform: translateY(0) skewX(0); }
        }
        .sw-eq-card.mounted {
          animation: sw-card-rise 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .sw-eq-card:nth-child(1).mounted { animation-delay: 0ms; }
        .sw-eq-card:nth-child(2).mounted { animation-delay: 90ms; }
        .sw-eq-card:nth-child(3).mounted { animation-delay: 180ms; }

        /* ─ Character portrait behind card ───────────*/
        .sw-card-portrait {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.55;
          pointer-events: none;
          transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
          transform-origin: bottom center;
        }
        .sw-eq-card.active .sw-card-portrait {
          opacity: 0.72;
          transform: scale(1.04);
        }
        .sw-eq-card:not(.active) .sw-card-portrait {
          opacity: 0.28;
          transform: scale(1.08);
          filter: grayscale(0.5) blur(1px);
        }

        /* Portrait purple glow layer */
        .sw-card-glow {
          position: absolute; inset: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .sw-eq-card.active .sw-card-glow {
          background: radial-gradient(ellipse at 50% 85%, rgba(168,85,247,0.35) 0%, transparent 65%);
        }
        .sw-eq-card:not(.active) .sw-card-glow {
          background: radial-gradient(ellipse at 50% 85%, rgba(168,85,247,0.12) 0%, transparent 65%);
        }

        /* Bottom gradient inside card — so text is readable */
        .sw-card-fade {
          position: absolute; bottom: 0; left: 0; right: 0; height: 70%;
          background: linear-gradient(0deg,
            rgba(6,3,15,0.96) 0%,
            rgba(6,3,15,0.7) 45%,
            transparent 100%
          );
          pointer-events: none; z-index: 2;
        }

        /* Left edge accent stripe */
        .sw-card-stripe {
          position: absolute; top: 0; left: 0; width: 4px; height: 100%;
          z-index: 4; pointer-events: none;
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }
        .sw-eq-card.active .sw-card-stripe {
          background: linear-gradient(180deg, #22d3ee 0%, #a855f7 60%, rgba(168,85,247,0) 100%);
          box-shadow: 0 0 18px #22d3ee, 0 0 40px rgba(34,211,238,0.3);
        }
        .sw-eq-card:not(.active) .sw-card-stripe {
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
          box-shadow: none;
        }

        /* ─ Collapsed label (vertical text) ──────────*/
        .sw-card-vert-label {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .sw-eq-card.active .sw-card-vert-label { opacity: 0; pointer-events: none; }

        .sw-vert-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px; letter-spacing: 3px;
          color: rgba(34,211,238,0.5);
          writing-mode: vertical-rl;
        }
        .sw-vert-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px; letter-spacing: 4px;
          color: rgba(255,255,255,0.7);
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          text-shadow: 0 0 12px rgba(34,211,238,0.25);
        }
        .sw-vert-icon {
          width: 28px; height: 28px;
          object-fit: contain;
          opacity: 0.55;
          filter: drop-shadow(0 0 6px rgba(168,85,247,0.4));
        }

        /* ─ Active card content ───────────────────────*/
        .sw-card-content {
          position: absolute;
          inset: 0; z-index: 6;
          display: flex; flex-direction: column;
          padding: 70px 32px 32px;
          overflow-y: auto;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.45s ease 0.1s, transform 0.45s cubic-bezier(0.22,1,0.36,1) 0.1s;
          pointer-events: none;
        }
        .sw-eq-card.active .sw-card-content {
          opacity: 1; transform: translateY(0);
          pointer-events: all;
        }

        /* Top area of content — platform title */
        .sw-content-top {
          display: flex; align-items: baseline; gap: 12px;
          margin-top: auto;
          margin-bottom: 4px;
        }
        .sw-platform-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 56px; line-height: 0.9;
          letter-spacing: 3px;
          color: #ffffff;
          transform: skewX(-6deg);
          text-shadow:
            0 0 28px rgba(34,211,238,0.45),
            0 2px 0 rgba(0,0,0,0.8);
          user-select: none;
        }

        .sw-platform-handle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; letter-spacing: 2px;
          color: rgba(34,211,238,0.7);
          margin-bottom: 14px;
        }

        /* Rarity row */
        .sw-rarity-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
        }
        .sw-rarity-stars {
          font-size: 14px; letter-spacing: 2px;
          color: #facc15;
          text-shadow: 0 0 10px rgba(250,204,21,0.6);
        }
        .sw-type-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px; letter-spacing: 2px;
          padding: 2px 10px;
          border: 1px solid;
          clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
        }

        /* Stats strip */
        .sw-stats-strip {
          display: flex; gap: 14px;
          margin-bottom: 18px;
        }
        .sw-stat {
          display: flex; flex-direction: column;
          align-items: flex-start; gap: 3px;
        }
        .sw-stat-top {
          display: flex; align-items: baseline; gap: 4px;
        }
        .sw-stat-tag {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 9px; letter-spacing: 1.5px;
          padding: 1px 5px;
          border-width: 1px; border-style: solid;
          line-height: 1.4; user-select: none;
        }
        .sw-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px; font-style: italic;
          line-height: 1; color: #fff;
          letter-spacing: 1px; user-select: none;
        }
        .sw-stat-bar-track {
          width: 56px; height: 2px;
          background: rgba(255,255,255,0.1);
        }
        .sw-stat-bar-fill {
          height: 2px;
        }

        /* Separator line */
        .sw-sep {
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 80%);
          margin-bottom: 14px;
        }

        /* Description text */
        .sw-desc-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px; letter-spacing: 3px;
          color: rgba(34,211,238,0.5);
          margin-bottom: 6px;
        }
        .sw-desc-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.65;
          color: rgba(200,215,230,0.72);
          margin-bottom: 18px;
        }

        /* Bullet links */
        .sw-bullets-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px; letter-spacing: 3px;
          color: rgba(168,85,247,0.6);
          margin-bottom: 8px;
        }
        .sw-bullet {
          display: flex; align-items: center; gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.5px;
          color: rgba(200,215,230,0.6);
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(34,211,238,0.3);
          padding: 8px 14px;
          margin-bottom: 5px;
          cursor: pointer;
          clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          text-decoration: none;
        }
        .sw-bullet:hover {
          background: rgba(34,211,238,0.07);
          border-left-color: #22d3ee;
          color: #e0f7ff;
          transform: translateX(5px);
        }
        .sw-bullet-arrow {
          font-size: 12px; color: rgba(34,211,238,0.4);
          flex-shrink: 0;
          transition: color 0.18s, transform 0.18s;
        }
        .sw-bullet:hover .sw-bullet-arrow {
          color: #22d3ee;
          transform: translateX(3px);
        }

        /* VISIT button */
        .sw-visit-btn {
          display: inline-flex; align-items: center; gap: 10px;
          margin-top: 16px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px; letter-spacing: 4px;
          color: #06030f;
          background: #22d3ee;
          border: none;
          padding: 11px 28px;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%);
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          text-decoration: none;
          align-self: flex-start;
        }
        .sw-visit-btn:hover {
          background: #39ff14;
          box-shadow: 0 0 28px rgba(57,255,20,0.6), 0 0 60px rgba(57,255,20,0.2);
          transform: translateX(4px);
        }

        /* Icon selector dots — bottom of expanded content */
        .sw-icon-row {
          display: flex; gap: 8px;
          margin-top: 20px;
        }
        .sw-icon-dot {
          width: 8px; height: 8px;
          border: 1px solid rgba(255,255,255,0.25);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          flex-shrink: 0;
        }
        .sw-icon-dot.active {
          background: #22d3ee;
          border-color: #22d3ee;
          box-shadow: 0 0 8px rgba(34,211,238,0.7);
          transform: scaleX(3);
        }

        /* ─ Selector bracket — left edge of active card ─ */
        .sw-selector {
          position: absolute;
          left: -8px; top: 50%;
          transform: translateY(-50%);
          z-index: 30; pointer-events: none;
          display: flex; align-items: center;
          transition: opacity 0.4s ease;
        }
        .sw-sel-bar {
          width: 4px; height: 48px;
          background: linear-gradient(180deg, #a855f7 0%, #22d3ee 100%);
          box-shadow: 0 0 14px #a855f7, 0 0 28px rgba(168,85,247,0.4);
          flex-shrink: 0;
        }

        /* ─ Footer key hints ──────────────────────────*/
        .sw-footer {
          position: absolute; bottom: 0; left: 0; right: 0; height: 72px;
          z-index: 20;
          display: flex; align-items: center; justify-content: flex-end;
          gap: 20px; padding: 0 40px;
          background: rgba(6,3,15,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.05);
          opacity: 0; transition: opacity 0.4s ease 0.7s;
        }
        .sw-footer.mounted { opacity: 1; }
        .sw-footer-row {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px; letter-spacing: 2px;
          color: rgba(255,255,255,0.3);
        }
        .sw-footer-key {
          border: 1px solid rgba(34,211,238,0.45);
          color: #22d3ee; padding: 1px 7px;
          font-size: 11px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
        }

        /* ─ Top-card corner decoration ────────────────*/
        .sw-corner-deco {
          position: absolute; top: 16px; right: 24px;
          z-index: 7; pointer-events: none;
          opacity: 0; transition: opacity 0.4s ease 0.2s;
          display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .sw-eq-card.active .sw-corner-deco { opacity: 1; }
        .sw-corner-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.4));
        }
        .sw-corner-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 9px; letter-spacing: 3px;
          color: rgba(34,211,238,0.35);
        }

        /* ─ Scan line that sweeps on card activate ────*/
        @keyframes sw-scan {
          0%   { top: -4px; opacity: 0.8; }
          100% { top: 110%; opacity: 0; }
        }
        .sw-scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #22d3ee, transparent);
          pointer-events: none; z-index: 8;
          animation: sw-scan 1.2s cubic-bezier(0.22,0.1,0.36,1) both;
        }

        /* ─ Pulse ring on active card top ────────────*/
        @keyframes sw-ring-pulse {
          0%   { opacity: 0.7; transform: scale(0.85); }
          100% { opacity: 0; transform: scale(1.4); }
        }

        /* ─ Number index top-left ─────────────────────*/
        .sw-card-index {
          position: absolute; top: 22px; left: 18px;
          z-index: 7; pointer-events: none;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px; letter-spacing: 3px;
          color: rgba(34,211,238,0.35);
          opacity: 0; transition: opacity 0.4s ease 0.15s;
        }
        .sw-eq-card.active .sw-card-index { opacity: 1; }

        /* ─ Hover shimmer on collapsed cards ─────────*/
        @keyframes sw-shimmer {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        .sw-card-shimmer {
          position: absolute; top: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          pointer-events: none; z-index: 3;
          animation: sw-shimmer 2.4s ease-in-out infinite;
          animation-play-state: paused;
        }
        .sw-eq-card:not(.active):hover .sw-card-shimmer {
          animation-play-state: running;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="sw-header">
        <button className="sw-back-btn" onClick={() => navigate(-1)}>← BACK</button>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div className={`sw-header-title${glitch ? " glitching" : ""}`}>SOCIALS</div>
            <div className="sw-header-slash">// platform</div>
          </div>
          <div className="sw-header-sub">SOULS SYNTAX — EQUIPMENT SELECTION INTERFACE</div>
        </div>
        <div className="sw-header-badge">NIHILITY PATH</div>
      </div>

      {/* ── Card arena ── */}
      <div className="sw-cards-arena">
        {ITEMS.map((item, i) => {
          const isActive  = active === i;
          const det       = DETAIL_DATA[i];
          const acc       = CARD_ACCENT[item.id];
          const crop      = CHAR_CROPS[item.id];

          return (
            <div
              key={item.id}
              className={`sw-eq-card${isActive ? " active" : ""}${mounted ? " mounted" : ""}`}
              onClick={() => !isActive && setActive(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Scan sweep on mount */}
              {mounted && isActive && <div className="sw-scan-line" key={`scan-${i}-${active}`} />}

              {/* Shimmer on hover when collapsed */}
              <div className="sw-card-shimmer" />

              {/* Character portrait */}
              <img
                className="sw-card-portrait"
                src={item.img}
                alt=""
                style={crop}
              />

              {/* Purple glow radial */}
              <div className="sw-card-glow" />

              {/* Bottom fade for text readability */}
              <div className="sw-card-fade" />

              {/* Left edge accent stripe */}
              <div className="sw-card-stripe" />

              {/* Card index — top left */}
              <div className="sw-card-index">0{i + 1} / 03</div>

              {/* Corner decoration — top right */}
              <div className="sw-corner-deco">
                <div className="sw-corner-line" style={{ width: 48 }} />
                <div className="sw-corner-label">EQUIPMENT</div>
                <div className="sw-corner-line" style={{ width: 24 }} />
              </div>

              {/* Selector bracket — only on active */}
              {isActive && (
                <div className="sw-selector">
                  <div className="sw-sel-bar" />
                  <svg width="28" height="48" viewBox="0 0 28 48" style={{ display: "block", filter: "drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 4px #a855f7)" }}>
                    <defs>
                      <linearGradient id={`sg-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <polygon points="0,0 28,24 0,48" fill={`url(#sg-${i})`} opacity="0.9" />
                  </svg>
                </div>
              )}

              {/* ── Collapsed vertical label ── */}
              <div className="sw-card-vert-label">
                <img className="sw-vert-icon" src={item.icon} alt="" />
                <div className="sw-vert-title">{item.title}</div>
                <div className="sw-vert-num">0{i + 1}</div>
              </div>

              {/* ── Active expanded content ── */}
              <div className="sw-card-content">

                {/* Platform mega-title */}
                <div className="sw-content-top">
                  <div className="sw-platform-title">{item.title}</div>
                </div>

                {/* Handle */}
                <div className="sw-platform-handle">{item.subtitle}</div>

                {/* Rarity + type */}
                <div className="sw-rarity-row">
                  <span className="sw-rarity-stars">{det.rarity}</span>
                  <span
                    className="sw-type-badge"
                    style={{ color: acc.primary, borderColor: acc.primary, background: `${acc.primary}18` }}
                  >{det.type}</span>
                  <span
                    className="sw-type-badge"
                    style={{ color: acc.badge, borderColor: acc.badge, background: `${acc.badge}18` }}
                  >{det.subLevel}</span>
                </div>

                {/* Stats strip — mirrors AboutMe sc-stat-tag pattern */}
                <div className="sw-stats-strip">
                  {det.stats.map(s => (
                    <div className="sw-stat" key={s.tag}>
                      <div className="sw-stat-top">
                        <span className="sw-stat-tag" style={{ color: s.color, borderColor: s.color }}>{s.tag}</span>
                        <span className="sw-stat-num">{s.value}</span>
                      </div>
                      <div className="sw-stat-bar-track">
                        <div className="sw-stat-bar-fill" style={{ width: "100%", background: s.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sw-sep" />

                {/* Description */}
                <div className="sw-desc-label">// ABILITY DESC</div>
                <div className="sw-desc-text">{det.description}</div>

                {/* Bullet links */}
                <div className="sw-bullets-label">// LINKED NODES</div>
                {det.bullets.map((b, bi) => (
                  <a
                    key={bi}
                    className="sw-bullet"
                    href={det.links[bi]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="sw-bullet-arrow">▶</span>
                    {b}
                  </a>
                ))}

                {/* Visit button */}
                <a
                  className="sw-visit-btn"
                  href={det.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  ⤴ VISIT {item.title}
                </a>

                {/* Icon dots / selector */}
                <div className="sw-icon-row">
                  {ITEMS.map((_, di) => (
                    <div
                      key={di}
                      className={`sw-icon-dot${active === di ? " active" : ""}`}
                      style={active === di ? {} : {}}
                    />
                  ))}
                </div>

              </div>{/* end sw-card-content */}
            </div>
          );
        })}
      </div>

      {/* ── Footer keyboard hints ── */}
      <div className={`sw-footer${mounted ? " mounted" : ""}`}>
        <div className="sw-footer-row">
          <span className="sw-footer-key">◄ ►</span>
          <span>SWITCH PLATFORM</span>
        </div>
        <div className="sw-footer-row">
          <span className="sw-footer-key">ESC</span>
          <span>BACK</span>
        </div>
        <div className="sw-footer-row">
          <span className="sw-footer-key">↵</span>
          <span>VISIT</span>
        </div>
      </div>

    </div>
  );
}
