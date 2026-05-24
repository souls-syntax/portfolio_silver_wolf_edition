import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import charImg from "./assets/Silverwolf_Render2_Hoyo-transparents.png";
import { getBlogs } from "./blogCache";
import BackgroundVideo from "./BackgroundVideo";

const LANG_COLORS = {
  C: "#5b8fcc", "C++": "#f34b7d", Zig: "#f7a41d", CUDA: "#76b900",
  Lua: "#000080", Systems: "#a855f7", OS: "#8b5cf6", Shell: "#22c55e",
  Memory: "#ea580c", Linux: "#ef4444", Kernel: "#dc2626", POSIX: "#0891b2",
  GPU: "#76b900", Performance: "#f59e0b", Neovim: "#65a30d", Tooling: "#6366f1",
  ELF: "#7c3aed", Linker: "#9333ea", Series: "#a855f7", Default: "#555",
};

function tagColor(tag) {
  return LANG_COLORS[tag] || LANG_COLORS.Default;
}

function fuzzyScore(blog, query) {
  const q = query.toLowerCase();
  let score = 0;
  if (blog.title.toLowerCase().includes(q))   score += 10;
  if (blog.excerpt.toLowerCase().includes(q)) score += 5;
  if (blog.tags.some(t => t.toLowerCase().includes(q))) score += 8;
  return score;
}

export default function BlogPage({ src }) {
  const navigate = useNavigate();
  const [blogs, setBlogs]           = useState([]);
  const [series, setSeries]         = useState([]);
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [activeTag, setActiveTag]   = useState(null);
  const [view, setView]             = useState("posts");
  const [mounted, setMounted]       = useState(false);
  const [activePost, setActivePost] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectorY, setSelectorY]   = useState(null);
  const inputRef  = useRef(null);
  const cardRefs  = useRef({});

  const allTags = [...new Set(blogs.flatMap(b => b.tags))].sort();

  useEffect(() => {
    getBlogs()
      .then(data => {
        setBlogs(data.blogs);
        setSeries(data.series);
        setResults(data.blogs);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch blogs:', err);
        setFetchError(err.message);
        setLoading(false);
      });

    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    const searchBlogs = (q) => {
      if (!q.trim()) return blogs;
      const lowerQ = q.toLowerCase();
      return blogs.filter(blog =>
        blog.title.toLowerCase().includes(lowerQ) ||
        blog.excerpt.toLowerCase().includes(lowerQ) ||
        blog.tags.some(tag => tag.toLowerCase().includes(lowerQ)) ||
        (blog.seriesId && blog.seriesId.toLowerCase().includes(lowerQ))
      );
    };
    let filtered = searchBlogs(query);
    if (activeTag) filtered = filtered.filter(b => b.tags.includes(activeTag));
    if (query) {
      filtered = [...filtered].sort((a, b) => fuzzyScore(b, query) - fuzzyScore(a, query));
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    setResults(filtered);
    setActivePost(0);
  }, [query, activeTag, blogs, loading]);

  // Track selector position to the active card
  useEffect(() => {
    if (results.length === 0) return;
    const active = results[activePost];
    if (!active) return;
    const el = cardRefs.current[active.id];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSelectorY(rect.top + rect.height / 2);
  }, [activePost, results]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        if (document.activeElement !== inputRef.current) navigate(-1);
      }
      if (e.key === "ArrowDown") setActivePost(i => Math.min(results.length - 1, i + 1));
      if (e.key === "ArrowUp")   setActivePost(i => Math.max(0, i - 1));
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        if (results[activePost]) navigate(`/blog/${results[activePost].id}`);
      }
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, activePost, navigate]);

  return (
    <div id="hsr-blog-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#06030f' }}>

      {/* BG video — same treatment as main page, no flat overlay killing it */}
      <BackgroundVideo
        src={src}
        style={{
          filter: 'blur(8px) brightness(0.3) saturate(1.3)',
        }}
      />
      {/* Radial vignette — same shape as main page */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 65% 50%, transparent 15%, rgba(6,3,15,0.8) 100%)',
        zIndex: 1,
      }} />
      {/* Left-side readability gradient so cards don't fight the character art */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(6,3,15,0.65) 0%, transparent 55%)',
        zIndex: 1,
      }} />

      {/* ── Angular selector bracket — tracks hovered/active card ── */}
      {selectorY !== null && view === "posts" && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: selectorY,
          transform: 'translateY(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
          transition: 'top 0.16s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Vertical bar — purple fading to cyan */}
          <div style={{
            width: 4,
            height: 52,
            background: 'linear-gradient(180deg, #a855f7 0%, #22d3ee 100%)',
            boxShadow: '0 0 14px #a855f7, 0 0 28px rgba(168,85,247,0.4)',
            flexShrink: 0,
          }} />
          {/* Triangle arrow — matches the main page selector shape */}
          <svg
            width="30"
            height="52"
            viewBox="0 0 30 52"
            style={{ display: 'block', filter: 'drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 4px #a855f7)' }}
          >
            <defs>
              <linearGradient id="sel-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <polygon points="0,0 30,26 0,52" fill="url(#sel-grad)" opacity="0.92" />
          </svg>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Barlow+Condensed:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap');

        /* ── Layout shell — NO backdrop-filter, lets video breathe ── */
        .blog-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Silver Wolf — bottom right, character art always present */
        .blog-watermark {
          position: fixed;
          bottom: 0;
          right: 0;
          height: 300px;
          width: auto;
          opacity: 0.9;
          pointer-events: none;
          z-index: 12;
          object-fit: contain;
          object-position: right bottom;
          filter:
            drop-shadow(0 0 24px rgba(168, 85, 247, 0.55))
            drop-shadow(0 0 8px rgba(34, 211, 238, 0.35));
        }

        /* ── Back button — angular clip-path, same language as main page nav ── */
        .blog-back-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: #22d3ee;
          background: rgba(34, 211, 238, 0.05);
          border: 1px solid rgba(34, 211, 238, 0.3);
          padding: 7px 18px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          margin-right: 20px;
          clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%);
          flex-shrink: 0;
        }
        .blog-back-btn:hover {
          background: rgba(34, 211, 238, 0.15);
          border-color: #22d3ee;
          color: #fff;
          box-shadow: 0 0 18px rgba(34, 211, 238, 0.35);
          transform: translateX(-3px);
        }

        /* ── Header — thin dark band, blur only for readability ── */
        .blog-header {
          position: relative;
          flex-shrink: 0;
          height: 78px;
          background: rgba(6, 3, 15, 0.68);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          padding: 0 40px;
          gap: 24px;
          z-index: 2;
        }
        /* Bottom line — cyan to purple, matches main page palette */
        .blog-header::after {
          content: "";
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, #22d3ee 0%, #a855f7 55%, rgba(168,85,247,0) 100%);
          box-shadow: 0 -1px 18px rgba(34, 211, 238, 0.25);
        }

        /* Title — Bebas Neue slanted, same vibe as main "silver wolf //" */
        .blog-header-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 40px;
          letter-spacing: 5px;
          color: #fff;
          line-height: 1;
          user-select: none;
          white-space: nowrap;
          transform: skewX(-4deg);
          text-shadow: 0 0 28px rgba(34, 211, 238, 0.35);
        }
        /* "// system blog" in cyan italic — mirrors main page subtitle style */
        .blog-header-slash {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 3px;
          color: #22d3ee;
          font-style: italic;
          transform: skewX(-5deg);
          text-shadow: 0 0 18px rgba(34, 211, 238, 0.7);
          line-height: 1;
          margin-left: 2px;
        }
        .blog-header-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px;
          letter-spacing: 3px;
          color: rgba(34, 211, 238, 0.45);
          padding-top: 5px;
          text-transform: uppercase;
        }

        /* ── View toggle ── */
        .blog-view-toggle {
          margin-left: auto;
          display: flex;
          gap: 3px;
        }
        .blog-view-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 2px;
          padding: 6px 20px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(34, 211, 238, 0.18);
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%);
        }
        .blog-view-btn.active {
          background: rgba(34, 211, 238, 0.1);
          color: #22d3ee;
          border-color: rgba(34, 211, 238, 0.6);
          box-shadow: 0 0 14px rgba(34, 211, 238, 0.25);
        }
        .blog-view-btn:hover:not(.active) {
          background: rgba(34, 211, 238, 0.06);
          border-color: rgba(34, 211, 238, 0.4);
          color: rgba(34, 211, 238, 0.7);
        }

        /* ── Search bar ── */
        .blog-search-wrap {
          flex-shrink: 0;
          padding: 10px 40px;
          background: rgba(6, 3, 15, 0.52);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.18);
        }
        .blog-search-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 3px;
          color: #22d3ee;
          flex-shrink: 0;
          user-select: none;
        }
        .blog-search-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(34, 211, 238, 0.3);
          color: #e0f7ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 6px 10px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .blog-search-input:focus {
          border-bottom-color: #a855f7;
          box-shadow: 0 4px 14px rgba(168, 85, 247, 0.12);
        }
        .blog-search-input::placeholder { color: rgba(255,255,255,0.18); }
        .blog-search-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 2px;
          color: rgba(168, 85, 247, 0.65);
          flex-shrink: 0;
        }

        /* ── Tag pills ── */
        .blog-tags-row {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 40px;
          overflow-x: auto;
          background: rgba(6, 3, 15, 0.38);
          border-bottom: 1px solid rgba(168,85,247,0.1);
          scrollbar-width: none;
        }
        .blog-tags-row::-webkit-scrollbar { display: none; }
        .blog-tag-pill {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          padding: 3px 10px;
          border: 1px solid;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
        }
        .blog-tag-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 10px currentColor;
          filter: brightness(1.4);
        }
        .blog-tag-pill.active {
          background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%) !important;
          border-color: #22d3ee !important;
          color: #06030f !important;
          font-weight: bold;
          box-shadow: 0 0 16px rgba(34, 211, 238, 0.55);
        }

        /* ── Scrollable content — extra left padding for selector bracket ── */
        .blog-content {
          flex: 1;
          overflow-y: auto;
          padding: 14px 40px 40px 52px;
          scrollbar-width: thin;
          scrollbar-color: rgba(34,211,238,0.25) transparent;
        }
        .blog-content::-webkit-scrollbar { width: 3px; }
        .blog-content::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.25); }

        /* ── Post cards ── */
        @keyframes blog-card-in {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .blog-card {
          position: relative;
          margin-bottom: 7px;
          background: rgba(6, 3, 15, 0.48);
          clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
          border-left: 3px solid rgba(34, 211, 238, 0.18);
          border-top: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: border-color 0.14s ease, background 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
          animation: blog-card-in 0.28s ease both;
          overflow: hidden;
          backdrop-filter: blur(4px);
        }
        .blog-card:hover,
        .blog-card.active-card {
          background: rgba(34, 211, 238, 0.04);
          border-left-color: #22d3ee;
          transform: translateX(8px);
          box-shadow: 0 0 0 1px rgba(34,211,238,0.08), 0 4px 20px rgba(34,211,238,0.06);
        }
        /* Right accent on active */
        .blog-card.active-card::before {
          content: '';
          position: absolute;
          top: 0; right: 22px; bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(168,85,247,0.5), transparent);
        }

        .blog-card-inner {
          padding: 15px 22px 15px 22px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: start;
        }
        .blog-card-series-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px;
          letter-spacing: 2px;
          color: #22d3ee;
          background: rgba(34,211,238,0.07);
          border: 1px solid rgba(34,211,238,0.22);
          padding: 2px 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 5px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
        }
        /* Card title — Bebas Neue to match main page typography */
        .blog-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.82);
          line-height: 1.05;
          margin-bottom: 5px;
          transition: color 0.14s ease, text-shadow 0.14s ease;
        }
        .blog-card:hover .blog-card-title,
        .blog-card.active-card .blog-card-title {
          color: #22d3ee;
          text-shadow: 0 0 18px rgba(34, 211, 238, 0.35);
        }
        .blog-card-excerpt {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(200,215,230,0.45);
          line-height: 1.55;
          margin-bottom: 9px;
        }
        .blog-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .blog-card-tag {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px;
          letter-spacing: 1px;
          padding: 2px 6px;
          border: 1px solid;
          opacity: 0.7;
          clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
        }
        .blog-card-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }
        .blog-card-date {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.28);
        }
        .blog-card-arrow {
          font-size: 17px;
          color: rgba(34,211,238,0.35);
          transition: color 0.14s ease, transform 0.14s ease;
        }
        .blog-card:hover .blog-card-arrow,
        .blog-card.active-card .blog-card-arrow {
          color: #22d3ee;
          transform: translateX(5px);
        }

        .blog-card-chapter-strip {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 24px;
          background: linear-gradient(180deg, rgba(34,211,238,0.5) 0%, rgba(168,85,247,0.25) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blog-card-chapter-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px;
          letter-spacing: 1px;
          color: #fff;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          user-select: none;
        }

        /* ── Series cards ── */
        .series-card {
          margin-bottom: 14px;
          background: rgba(6, 3, 15, 0.48);
          border: 1px solid rgba(34,211,238,0.1);
          border-left: 3px solid rgba(168,85,247,0.35);
          clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
          cursor: pointer;
          animation: blog-card-in 0.28s ease both;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          backdrop-filter: blur(4px);
        }
        .series-card:hover {
          background: rgba(34,211,238,0.03);
          border-left-color: #22d3ee;
          box-shadow: 0 4px 24px rgba(34,211,238,0.06);
        }
        .series-header {
          padding: 16px 26px 12px;
          border-bottom: 1px solid rgba(168,85,247,0.12);
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .series-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 3px;
          color: #fff;
          line-height: 1.05;
          flex: 1;
        }
        .series-card:hover .series-title { color: #22d3ee; }
        .series-chapter-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #a855f7;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.25);
          padding: 4px 10px;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .series-desc {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(200,215,230,0.45);
          line-height: 1.5;
          margin-top: 5px;
        }
        .series-chapters-list { padding: 0 26px 12px; }
        .series-chapter-row {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: transform 0.14s ease;
        }
        .series-chapter-row:last-child { border-bottom: none; }
        .series-chapter-row:hover { transform: translateX(5px); }
        .series-chapter-row:hover .series-chapter-title { color: #22d3ee; }
        .series-chapter-num-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 10px;
          letter-spacing: 1px;
          color: #06030f;
          background: #22d3ee;
          padding: 2px 7px;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
        }
        .series-chapter-title {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(220,235,245,0.65);
          flex: 1;
          transition: color 0.14s ease;
        }
        .series-chapter-date {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.28);
        }
        .series-chapter-arrow { font-size: 12px; color: rgba(34,211,238,0.35); }
        .series-chapter-row:hover .series-chapter-arrow { color: #22d3ee; }

        /* ── Empty state ── */
        .blog-empty { text-align: center; padding: 80px 40px; }
        .blog-empty-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          letter-spacing: 5px;
          color: rgba(255,255,255,0.22);
        }
        .blog-empty-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.18);
          margin-top: 8px;
        }

        /* ── Footer key hints ── */
        .blog-footer {
          position: fixed;
          bottom: 20px; right: 28px;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif;
          z-index: 14;
          opacity: 0;
          transition: opacity 0.4s ease 0.6s;
        }
        .blog-footer.mounted { opacity: 1; }
        .blog-footer-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; letter-spacing: 2px;
          color: rgba(255,255,255,0.3);
        }
        .blog-footer-key {
          border: 1px solid rgba(34,211,238,0.45);
          color: #22d3ee;
          padding: 1px 6px;
          font-size: 10px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
        }

        /* ── Entry animation ── */
        .blog-overlay {
          opacity: 0;
          transform: translateX(22px);
          transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1);
        }
        .blog-overlay.mounted {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      <div className={`blog-overlay${mounted ? " mounted" : ""}`}>
        <img className="blog-watermark" src={charImg} alt="" />

        {/* Header */}
        <div className="blog-header">
          <button className="blog-back-btn" onClick={() => navigate("/")}>← BACK</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div className="blog-header-title">SYSTEM BLOG</div>
              <div className="blog-header-slash">// field notes</div>
            </div>
            <div className="blog-header-sub">SOULS SYNTAX — FIELD NOTES FROM THE MACHINE</div>
          </div>
          <div className="blog-view-toggle">
            <button className={`blog-view-btn${view === "posts" ? " active" : ""}`} onClick={() => setView("posts")}>POSTS</button>
            <button className={`blog-view-btn${view === "series" ? " active" : ""}`} onClick={() => setView("series")}>SERIES</button>
          </div>
        </div>

        {/* Search */}
        <div className="blog-search-wrap">
          <span className="blog-search-label">⌕ SEARCH</span>
          <input
            ref={inputRef}
            className="blog-search-input"
            type="text"
            placeholder="title, tag, topic... (press / to focus)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="blog-search-count">{results.length} / {blogs.length}</span>
        </div>

        {/* Tags */}
        <div className="blog-tags-row">
          <span
            className={`blog-tag-pill${!activeTag ? " active" : ""}`}
            style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,0.3)", background: "transparent" }}
            onClick={() => setActiveTag(null)}
          >ALL</span>
          {allTags.map(tag => {
            const c = tagColor(tag);
            return (
              <span
                key={tag}
                className={`blog-tag-pill${activeTag === tag ? " active" : ""}`}
                style={{ color: c, borderColor: c, background: "transparent" }}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >{tag}</span>
            );
          })}
        </div>

        {/* Content */}
        <div className="blog-content">
          {loading && (
            <div className="blog-empty">
              <div className="blog-empty-title" style={{ color: '#22d3ee' }}>LOADING...</div>
            </div>
          )}
          {!loading && fetchError && (
            <div className="blog-empty">
              <div className="blog-empty-title" style={{ color: '#ef4444' }}>API ERROR</div>
              <div className="blog-empty-sub" style={{ color: 'rgba(239,68,68,0.6)', marginTop: 12 }}>{fetchError}</div>
            </div>
          )}

          {view === "posts" && !loading && !fetchError && (
            results.length === 0 ? (
              <div className="blog-empty">
                <div className="blog-empty-title">NO RESULTS</div>
                <div className="blog-empty-sub">try a different query or clear the tag filter</div>
              </div>
            ) : results.map((blog, i) => (
              <div
                key={blog.id}
                ref={el => cardRefs.current[blog.id] = el}
                className={`blog-card${activePost === i ? " active-card" : ""}`}
                style={{ animationDelay: `${i * 35}ms` }}
                onClick={() => navigate(`/blog/${blog.id}`)}
                onMouseEnter={() => setActivePost(i)}
              >
                {blog.chapterIndex !== null && (
                  <div className="blog-card-chapter-strip">
                    <span className="blog-card-chapter-num">CH {blog.chapterIndex}</span>
                  </div>
                )}
                <div
                  className="blog-card-inner"
                  style={{ paddingLeft: blog.chapterIndex !== null ? "42px" : "22px" }}
                >
                  <div>
                    {blog.seriesId && (
                      <div className="blog-card-series-badge">
                        <span>▶</span>
                        {series.find(s => s.id === blog.seriesId)?.title ?? blog.seriesId}
                      </div>
                    )}
                    <div className="blog-card-title">{blog.title}</div>
                    <div className="blog-card-excerpt">{blog.excerpt}</div>
                    <div className="blog-card-tags">
                      {blog.tags.map(tag => (
                        <span
                          key={tag}
                          className="blog-card-tag"
                          style={{ color: tagColor(tag), borderColor: tagColor(tag) }}
                        >{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="blog-card-meta">
                    <div className="blog-card-date">{blog.date}</div>
                    <div className="blog-card-arrow">►</div>
                  </div>
                </div>
              </div>
            ))
          )}

          {view === "series" && !loading && !fetchError && (
            series.map((s, si) => {
              const chapters = blogs
                .filter(b => b.seriesId === s.id)
                .sort((a, b) => (a.chapterIndex ?? 0) - (b.chapterIndex ?? 0));
              return (
                <div key={s.id} className="series-card" style={{ animationDelay: `${si * 80}ms` }}>
                  <div className="series-header">
                    <div>
                      <div className="series-title">{s.title}</div>
                      <div className="series-desc">{s.description}</div>
                      <div className="blog-card-tags" style={{ marginTop: 7 }}>
                        {s.tags.map(tag => (
                          <span key={tag} className="blog-card-tag" style={{ color: tagColor(tag), borderColor: tagColor(tag) }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="series-chapter-count">{chapters.length} CHAPTERS</div>
                  </div>
                  <div className="series-chapters-list">
                    {chapters.map(ch => (
                      <div key={ch.id} className="series-chapter-row" onClick={() => navigate(`/blog/${ch.id}`)}>
                        <div className="series-chapter-num-badge">CH {ch.chapterIndex}</div>
                        <div className="series-chapter-title">{ch.title}</div>
                        <div className="series-chapter-date">{ch.date}</div>
                        <div className="series-chapter-arrow">►</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer key hints */}
      <div className={`blog-footer${mounted ? " mounted" : ""}`}>
        <div className="blog-footer-row"><span className="blog-footer-key">/</span><span>SEARCH</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">↑↓</span><span>NAVIGATE</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">↵</span><span>OPEN</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
