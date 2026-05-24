import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import char1 from "./assets/Silverwolf_Render1_Hoyo-transparents.png";
import char2 from "./assets/Silverwolf_Render2_Hoyo-transparents.png";
import char3 from "./assets/Silverwolf_Render3_Hoyo-transparents.png";
import icon1 from "./assets/icon1.png";
import icon2 from "./assets/icon2.png";
import icon3 from "./assets/icon3.png";

const ITEMS = [
  { id: "edu",   title: "EDUCATION",  subtitle: "CS / Self-taught",      icon: icon1, img: char1 },
  { id: "skill", title: "SKILLS",     subtitle: "Systems / Low-level",   icon: icon2, img: char2 },
  { id: "proj",  title: "PROJECTS",   subtitle: "OSes · Shells",         icon: icon3, img: char3 },
  { id: "lang",  title: "LANGUAGES",  subtitle: "C · CUDA · Zig",        icon: icon1, img: char1 },
];

const CHAR_CROPS = {
  edu: { objectPosition: "center top", transform: "scale(1.2)" },
  skill: { objectPosition: "center 15%", transform: "scale(1.1)" },
  proj: { objectPosition: "center top", transform: "scale(1.3)" },
  lang: { objectPosition: "center 10%", transform: "scale(1.2)" },
};

const DETAIL_DATA = {
  0: {
    topTitle: "Education Log",
    subLevel: "Level 99",
    description: "Increases the wearer's foundational knowledge by 24%. When the wearer encounters a difficult bug, increases problem-solving speed by 12%. After the wearer builds a complete OS, there is a 100% base chance to implant 'Systems Master' code on the target codebase.",
    bullets: [
      "Computer Science Core Curriculum",
      "Systems Programming & Low-level Architecture",
      "Operating Systems Internals (sauceOS)",
      "Self-taught Advanced Concepts",
    ],
  },
  1: {
    topTitle: "Skills Log",
    subLevel: "Level 99",
    description: "Boosts low-level systems proficiency. Increases C memory management efficiency by 50%. The wearer ignores 20% of abstraction overhead when writing CUDA kernels.",
    bullets: [
      "C & C++ — Systems, POSIX, Shells",
      "CUDA — GPU programming & memory coalescing",
      "Zig — Runtime / systems development",
      "Memory allocators (arena, pool, slab)",
      "OS internals: paging, syscalls, ELF loading",
    ],
  },
  2: {
    topTitle: "Projects Log",
    subLevel: "Superimposition Lv. 5",
    description: "The wearer's project portfolio deals massive DMG to standard enterprise CRUD apps. Each low-level project built increases the wearer's 'Nerd Cred' stack by 1, up to a maximum of 5 stacks.",
    bullets: [
      "sauceOS — x86_64 hobby OS with Limine bootloader",
      "sush — POSIX-compliant shell in C++",
      "tsundere-runtime — ELF loader in Zig",
      "C-STL — Standard template library in C",
    ],
  },
  3: {
    topTitle: "Language Log",
    subLevel: "Level 99",
    description: "The wearer gains a 100% base chance to prefer languages without hidden runtimes. Every abstraction used has its overhead revealed. If there's no garbage collector, increases critical hit rate by 15%.",
    bullets: [
      "C — Primary daily driver",
      "CUDA — Parallel processing",
      "C++ — Shell and toolsets",
      "Zig — Active learning for modern systems",
      "Lua — Neovim config and scripting",
    ],
  },
};

export default function ResumePage({ src, mode }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  setActive((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setActive((i) => Math.min(ITEMS.length - 1, i + 1));
      if (e.key === "Escape" || e.key === "Backspace") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const detail = DETAIL_DATA[active];
  const currentItem = ITEMS[active];

  return (
    <div id="hsr-resume-screen">
      <video className="hsr-bg-video" src={src} autoPlay loop muted playsInline />
      <div className="hsr-dim-overlay" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans:wght@400;700&display=swap');

        #hsr-resume-screen {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #06030f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Noto Sans', 'Inter', sans-serif;
        }

        .hsr-bg-video {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(10px) brightness(0.4) saturate(1.2);
          z-index: 0;
        }
        
        .hsr-dim-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 20%, rgba(6,3,15,0.8) 100%);
          z-index: 1;
        }

        .hsr-content-wrap {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6vw;
          width: 90vw;
          max-width: 1400px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .hsr-content-wrap.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* --- LEFT SIDE: CARD & ICONS --- */
        .hsr-left-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .hsr-card-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 42px;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
          align-self: flex-start;
          margin-bottom: -10px;
        }

        .hsr-card-subtitle {
          font-family: 'Noto Sans', sans-serif;
          font-size: 16px;
          color: #d1d5db;
          align-self: flex-start;
          margin-bottom: 10px;
        }

        .hsr-main-card {
          position: relative;
          width: 320px;
          height: 480px;
          border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.2);
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.4), inset 0 0 20px rgba(255,255,255,0.1);
          overflow: hidden;
          transition: transform 0.3s ease;
          background: linear-gradient(135deg, #2a1b4d 0%, #100a20 100%);
        }
        
        .hsr-main-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid rgba(34, 211, 238, 0.5);
          border-radius: 6px;
          margin: 4px;
          pointer-events: none;
        }

        .hsr-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.9;
          filter: contrast(1.1) brightness(1.1);
          animation: floatCard 6s ease-in-out infinite;
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }

        .hsr-icon-row {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .hsr-icon-box {
          width: 54px;
          height: 54px;
          background: rgba(20, 15, 40, 0.8);
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hsr-icon-box:hover {
          border-color: #39ff14;
          background: rgba(57, 255, 20, 0.15);
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 0 18px rgba(57, 255, 20, 0.4), 0 6px 20px rgba(0,0,0,0.5);
        }

        .hsr-icon-box.active {
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.2);
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.6), inset 0 0 12px rgba(168, 85, 247, 0.15);
          transform: scale(1.12);
          animation: icon-pulse 2s ease-in-out infinite;
        }

        @keyframes icon-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(168, 85, 247, 0.6), inset 0 0 12px rgba(168, 85, 247, 0.15); }
          50% { box-shadow: 0 0 28px rgba(168, 85, 247, 0.9), inset 0 0 20px rgba(168, 85, 247, 0.25); }
        }

        .hsr-icon-box img {
          width: 80%;
          height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        /* --- RIGHT SIDE: DESCRIPTION PANEL --- */
        .hsr-right-panel {
          width: 480px;
          background: rgba(15, 10, 25, 0.85);
          backdrop-filter: blur(12px);
          border-left: 3px solid #facc15;
          padding: 30px;
          color: #e5e7eb;
          box-shadow: 10px 10px 30px rgba(0,0,0,0.5);
          min-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .hsr-panel-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 24px;
          color: #facc15; /* HSR Yellow */
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .hsr-panel-sub {
          font-family: 'Noto Sans', sans-serif;
          font-size: 14px;
          color: #fef08a; /* Lighter yellow */
          margin-bottom: 20px;
        }

        .hsr-panel-desc {
          font-size: 15px;
          line-height: 1.6;
          color: #d1d5db;
          margin-bottom: 24px;
        }

        .hsr-panel-bullets {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }

        .hsr-bullet-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          line-height: 1.5;
          background: rgba(255,255,255,0.03);
          padding: 10px 14px;
          border-left: 2px solid #39ff14;
          transition: all 0.2s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .hsr-bullet-item::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #39ff14, #a855f7);
          box-shadow: 0 0 8px rgba(57,255,20,0.6);
        }
        .hsr-bullet-item:hover {
          background: rgba(57, 255, 20, 0.06);
          padding-left: 20px;
          border-left-color: #a855f7;
          box-shadow: inset 0 0 20px rgba(57, 255, 20, 0.04);
        }

        .hsr-nav-hint {
          position: absolute;
          top: 30px;
          left: 40px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          opacity: 0.7;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .hsr-nav-hint:hover {
          opacity: 1;
          color: #39ff14;
          transform: translateX(-4px);
          text-shadow: 0 0 12px rgba(57, 255, 20, 0.5);
        }
        .hsr-nav-hint:hover .hsr-back-btn {
          border-color: #39ff14;
          box-shadow: 0 0 14px rgba(57, 255, 20, 0.5);
          background: rgba(57, 255, 20, 0.1);
        }
        .hsr-back-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.5);
          transition: all 0.25s ease;
          font-size: 18px;
        }
      `}</style>

      <div className="hsr-nav-hint" onClick={() => navigate(-1)}>
        <div className="hsr-back-btn">←</div>
        <span>BACK</span>
      </div>

      <div className={`hsr-content-wrap ${mounted ? "mounted" : ""}`}>
        
        {/* LEFT PANEL */}
        <div className="hsr-left-panel">
          <div className="hsr-card-title">{currentItem.title}</div>
          <div className="hsr-card-subtitle">Path: Nihility // {currentItem.subtitle}</div>
          
          <div className="hsr-main-card">
            <img src={currentItem.img} alt={currentItem.title} className="hsr-card-image" style={CHAR_CROPS[currentItem.id]} />
          </div>

          <div className="hsr-icon-row">
            {ITEMS.map((item, idx) => (
              <div 
                key={item.id} 
                className={`hsr-icon-box ${active === idx ? 'active' : ''}`}
                onClick={() => setActive(idx)}
              >
                <img src={item.icon} alt={item.title} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="hsr-right-panel">
          <div className="hsr-panel-title">| {detail.topTitle}</div>
          <div className="hsr-panel-sub">{detail.subLevel}</div>
          
          <div className="hsr-panel-desc">
            {detail.description}
          </div>

          <div className="hsr-panel-bullets">
            {detail.bullets.map((b, i) => (
              <div className="hsr-bullet-item" key={i}>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
