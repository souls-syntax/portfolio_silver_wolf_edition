import { useState, useEffect } from "react";

const ITEMS = [
  { id: "about",  label: "ABOUT ME",    href: "#about",  fontSize: 110, offsetX: 0,  offsetY: 0  },
  { id: "resume", label: "RESUME",      href: "#resume", fontSize: 90,  offsetX: 38, offsetY: 0 },
  { id: "sideproj", label: "SIDE PROJECTS", href: "#sideproj", fontSize: 75,  offsetX: 14, offsetY: 0 },
  { id: "github", label: "GITHUB LINK", href: "https://github.com/yourname", fontSize: 75, offsetX: 14, offsetY: 0 },
];

const CLIP_SHAPES = [
  (w, h) => `polygon(0px ${h*0.1}px, ${w - h*0.4}px 0px, ${w}px ${h*0.5}px, ${w - h*0.2}px ${h}px, 0px ${h*0.9}px)`,
  (w, h) => `polygon(${h*0.2}px 0px, ${w - h*0.3}px ${h*0.05}px, ${w}px ${h*0.5}px, ${w - h*0.1}px ${h}px, 0px ${h*0.8}px)`,
  (w, h) => `polygon(0px ${h*0.2}px, ${w - h*0.2}px 0px, ${w}px ${h*0.4}px, ${w - h*0.3}px ${h}px, ${h*0.1}px ${h*0.9}px)`,
];

export default function P3Menu({ onNavigate }) {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowUp")   setActive(i => Math.max(0, i - 1));
      if (e.key === "ArrowDown") setActive(i => Math.min(ITEMS.length - 1, i + 1));
      if (e.key === "Enter") {
        if (onNavigate) {
           onNavigate(ITEMS[active].id);
        } else {
           window.location.href = ITEMS[active].href;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onNavigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        
        .hsr-root {
          position: relative;
          width: 100%;
          min-height: 100svh;
          background: #06030f;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .hsr-video {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.6;
          z-index: 0;
          pointer-events: none;
          filter: saturate(1.2) hue-rotate(-10deg);
        }
        .hsr-circle {
          position: absolute;
          right: -10vw; top: 50%;
          transform: translateY(-50%);
          width: 65vw; height: 65vw;
          max-width: 800px; max-height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(34, 211, 238, 0.15) 50%, transparent 80%);
          z-index: 1;
          pointer-events: none;
          filter: blur(40px);
        }
        .hsr-bg-word {
          position: absolute;
          bottom: -2vw; left: -1vw;
          font-family: 'Anton', sans-serif;
          font-size: clamp(140px, 22vw, 300px);
          color: rgba(255,255,255,0.03);
          letter-spacing: 0px;
          pointer-events: none;
          z-index: 2;
          white-space: nowrap;
          user-select: none;
        }
        .hsr-scanlines {
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px
          );
          z-index: 3;
          pointer-events: none;
        }
        .hsr-mask {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(6,3,15,0.9) 0%, rgba(6,3,15,0.4) 40%, transparent 100%);
          z-index: 4;
          pointer-events: none;
        }
        .hsr-stripe  { position:absolute; right:0; top:0; bottom:0; width:6px; background:#22d3ee; z-index:10; box-shadow: 0 0 15px #22d3ee; }
        .hsr-stripe2 { position:absolute; right:12px; top:0; bottom:0; width:2px; background:rgba(167, 139, 250, 0.5); z-index:10; }

        .hsr-menu {
          position: relative;
          z-index: 20;
          padding: 48px 0 48px 60px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .hsr-row {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          line-height: 1;
          text-decoration: none;
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .hsr-row.mounted {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        .hsr-highlight {
          position: absolute;
          left: -60px; top: 50%;
          transform: translateY(-50%) scaleX(0);
          transform-origin: left center;
          background: linear-gradient(90deg, #7c3aed, #22d3ee);
          z-index: -1;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
        }
        .hsr-row.active .hsr-highlight {
          transform: translateY(-50%) scaleX(1);
        }

        .hsr-label {
          font-family: 'Anton', sans-serif;
          display: block;
          color: rgba(255,255,255,0.4);
          letter-spacing: 4px;
          line-height: 0.9;
          position: relative;
          z-index: 1;
          transition: color 0.15s ease, text-shadow 0.15s ease;
          text-transform: uppercase;
          -webkit-text-stroke: 1px rgba(255,255,255,0.1);
        }
        .hsr-row.active .hsr-label { 
          color: #ffffff; 
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
          -webkit-text-stroke: 0px;
        }
        .hsr-row:hover:not(.active) .hsr-label { 
          color: #22d3ee; 
        }

        .hsr-hint {
          position: absolute;
          bottom: 30px; right: 35px;
          z-index: 20;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 8px;
          font-family: 'Anton', sans-serif;
          opacity: 0;
          transition: opacity 0.6s ease 1s;
        }
        .hsr-hint.mounted { opacity: 1; }
        .hsr-hint-row {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; letter-spacing: 3px;
          color: rgba(255,255,255,0.4);
        }
        .hsr-hint-key {
          border: 1px solid rgba(34, 211, 238, 0.4);
          border-radius: 2px;
          padding: 2px 8px; font-size: 12px;
          color: #22d3ee;
        }
      `}</style>

      <div className="hsr-root">
        <div className="hsr-circle" />
        <div className="hsr-bg-word">AETHER EDITING</div>
        <div className="hsr-scanlines" />
        <div className="hsr-mask" />
        <div className="hsr-stripe" />
        <div className="hsr-stripe2" />

        <nav className="hsr-menu">
          {ITEMS.map((item, i) => {
            const isActive = active === i;
            const dist = Math.abs(i - active);
            const opacity = isActive ? 1 : Math.max(0.2, 1 - dist * 0.4);
            const estW = item.label.length * item.fontSize * 0.5 + 100;
            const estH = item.fontSize * 1.1;
            const clipFn = CLIP_SHAPES[i] ?? CLIP_SHAPES[0];

            return (
              <a
                key={item.id}
                href={item.href}
                className={`hsr-row ${isActive ? "active" : ""} ${mounted ? "mounted" : ""}`}
                style={{
                  marginLeft: item.offsetX,
                  marginTop: item.offsetY,
                  transitionDelay: mounted ? `${i * 100}ms` : "0ms",
                }}
                onMouseEnter={() => setActive(i)}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate(item.id);
                  } else {
                    window.location.href = item.href;
                  }
                }}
              >
                <div
                  className="hsr-highlight"
                  style={{
                    width: estW,
                    height: estH,
                    clipPath: clipFn(estW, estH),
                  }}
                />
                <span
                  className="hsr-label"
                  style={{ fontSize: item.fontSize, opacity }}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className={`hsr-hint ${mounted ? "mounted" : ""}`}>
          <div className="hsr-hint-row"><span className="hsr-hint-key">↑↓</span><span>NAVIGATE</span></div>
          <div className="hsr-hint-row"><span className="hsr-hint-key">↵</span><span>CONFIRM</span></div>
        </div>
      </div>
    </>
  );
}
