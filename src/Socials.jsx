import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import char1 from "./assets/Silverwolf_Render1_Hoyo-transparents.png";
import char2 from "./assets/Silverwolf_Render2_Hoyo-transparents.png";
import char3 from "./assets/Silverwolf_Render3_Hoyo-transparents.png";
import icon1 from "./assets/icon1.png";
import icon2 from "./assets/icon2.png";
import icon3 from "./assets/icon3.png";
import bgVideo from "./assets/silver-wolf-honkai-star-rail-4k-wallpaperwaifu-com.mp4";

const ITEMS = [
  { id: "github",  title: "GITHUB",   subtitle: "@souls-syntax",  icon: icon1, img: char1 },
  { id: "twitter", title: "TWITTER",  subtitle: "@souls_syntax",  icon: icon2, img: char2 },
  { id: "email",   title: "CONTACT",  subtitle: "Direct Message", icon: icon3, img: char3 },
];

const CHAR_CROPS = {
  github: { objectPosition: "center 10%", transform: "scale(1.2)" },
  twitter: { objectPosition: "center top", transform: "scale(1.3)" },
  email: { objectPosition: "center 15%", transform: "scale(1.15)" },
};

const DETAIL_DATA = {
  0: {
    topTitle: "GitHub Profile",
    subLevel: "Level 99",
    description: "Increases code repository visibility by 100%. When the wearer commits code, there is a 50% base chance to spawn an open-source contributor. Increases 'Star' drops on all repositories by 15%.",
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
    ]
  },
  1: {
    topTitle: "Twitter / X Profile",
    subLevel: "Superimposition Lv. 1",
    description: "The wearer's threads deal Aether DMG to the timeline. Increases tech-posting frequency by 20%. After the wearer uses a 'Reply', there is a 100% chance to engage in a low-level programming debate.",
    bullets: [
      "twitter.com/souls_syntax (Latest)",
      "twitter.com/souls_syntax (Threads)",
      "twitter.com/souls_syntax (Media)",
    ],
    links: [
      "https://twitter.com/souls_syntax",
      "https://twitter.com/souls_syntax",
      "https://twitter.com/souls_syntax",
    ]
  },
  2: {
    topTitle: "Direct Contact",
    subLevel: "Superimposition Lv. 5",
    description: "Bypasses all firewall resistances. Directly applies 'Incoming Message' debuff to the target. Best used for collaborative opportunities, bug reports, or sending cool system-level tricks.",
    bullets: [
      "Message via GitHub profile",
      "Message via Twitter DMs",
    ],
    links: [
      "https://github.com/souls-syntax",
      "https://twitter.com/souls_syntax",
    ]
  },
};

export default function Socials() {
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
      <video className="hsr-bg-video" src={bgVideo} autoPlay loop muted playsInline />
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
          border-color: #22d3ee;
          background: rgba(34, 211, 238, 0.2);
          transform: translateY(-2px);
        }

        .hsr-icon-box.active {
          border-color: #facc15;
          box-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
          transform: scale(1.05);
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
          color: #facc15;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .hsr-panel-sub {
          font-family: 'Noto Sans', sans-serif;
          font-size: 14px;
          color: #fef08a;
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
          border-left: 2px solid #22d3ee;
          cursor: pointer;
          transition: background 0.2s, padding-left 0.2s;
        }
        
        .hsr-bullet-item:hover {
          background: rgba(34, 211, 238, 0.1);
          padding-left: 20px;
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
              <div 
                className="hsr-bullet-item" 
                key={i}
                onClick={() => window.open(detail.links[i], "_blank")}
              >
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
