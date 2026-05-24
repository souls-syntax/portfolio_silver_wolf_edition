import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import charImg from "./assets/Silverwolf_Render2_Hoyo-transparents.png";
import { getBlogs } from "./blogCache";

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

// Simple fuzzy score for result ordering
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
  const [view, setView]             = useState("posts"); // "posts" | "series"
  const [mounted, setMounted]       = useState(false);
  const [activePost, setActivePost] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const inputRef = useRef(null);

  // Collect all unique tags
  const allTags = [...new Set(blogs.flatMap(b => b.tags))].sort();

  useEffect(() => {
    // getCachedBlogs gives instant result if prefetch already resolved,
    // otherwise getBlogs() returns the in-flight promise — no second fetch.
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
    
    // Custom search function
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
    if (activeTag) {
      filtered = filtered.filter(b => b.tags.includes(activeTag));
    }
    if (query) {
      filtered = [...filtered].sort((a, b) => fuzzyScore(b, query) - fuzzyScore(a, query));
    } else {
      // Default sort: newest first
      filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    setResults(filtered);
    setActivePost(0);
  }, [query, activeTag, blogs, loading]);

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
      <video className="hsr-bg-video" src={src} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'blur(10px) brightness(0.4) saturate(1.2)' }} />
      <div className="hsr-dim-overlay" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(6,3,15,0.8) 100%)', zIndex: 1 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Barlow+Condensed:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap');

        /* ── Layout ── */
        .blog-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: rgba(6, 3, 15, 0.82);
          backdrop-filter: blur(14px) saturate(0.8);
          -webkit-backdrop-filter: blur(14px) saturate(0.8);
        }

        .blog-watermark {
          position: fixed;
          bottom: 20px;
          right: 20px;
          height: 240px;
          width: auto;
          opacity: 1;
          pointer-events: none;
          z-index: 12;
          object-fit: contain;
          object-position: right bottom;
          filter: drop-shadow(0 0 18px rgba(168, 85, 247, 0.45)) drop-shadow(0 0 6px rgba(57, 255, 20, 0.25));
          border-radius: 4px;
        }

        .blog-back-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: #22d3ee;
          background: rgba(34, 211, 238, 0.06);
          border: 1px solid rgba(34, 211, 238, 0.35);
          padding: 7px 16px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
          margin-right: 20px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          position: relative;
          overflow: hidden;
        }
        .blog-back-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.4s ease;
        }
        .blog-back-btn:hover {
          background: rgba(34, 211, 238, 0.18);
          border-color: #22d3ee;
          color: #fff;
          box-shadow: 0 0 16px rgba(34, 211, 238, 0.4), inset 0 0 8px rgba(34, 211, 238, 0.1);
          transform: translateX(-3px);
        }
        .blog-back-btn:hover::after {
          transform: translateX(100%);
        }

        /* ── Header bar ── */
        .blog-header {
          position: relative;
          flex-shrink: 0;
          height: 95px;
          background: linear-gradient(135deg, rgba(12, 6, 20, 0.85) 0%, rgba(26, 11, 46, 0.85) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          padding: 0 40px;
          gap: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          z-index: 2;
        }
        .blog-header::after {
          content: "";
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 3px;
          background: linear-gradient(90deg, #39ff14 0%, #a855f7 50%, #22d3ee 100%);
          box-shadow: 0 -2px 20px rgba(168, 85, 247, 0.5);
        }
        .blog-header-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 46px;
          letter-spacing: 6px;
          background: linear-gradient(90deg, #39ff14 0%, #e0b0ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.1;
          user-select: none;
          white-space: nowrap;
          filter: drop-shadow(0 2px 8px rgba(57, 255, 20, 0.2));
        }
        .blog-header-sub {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 3px;
          color: rgba(220, 200, 255, 0.85);
          padding-top: 6px;
          text-transform: uppercase;
        }

        /* ── View toggle ── */
        .blog-view-toggle {
          margin-left: auto;
          display: flex;
          gap: 4px;
        }
        .blog-view-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          padding: 7px 18px;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(168,85,247,0.25);
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          position: relative;
        }
        .blog-view-btn.active {
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.5);
        }
        .blog-view-btn:hover:not(.active) {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.6);
          color: #e0b0ff;
          box-shadow: 0 0 10px rgba(168,85,247,0.25);
          transform: translateY(-1px);
        }

        /* ── Search bar ── */
        .blog-search-wrap {
          position: relative;
          flex-shrink: 0;
          padding: 14px 40px 10px;
          background: linear-gradient(180deg, rgba(15,10,25,0.55) 0%, rgba(10,5,20,0.35) 100%);
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid rgba(168,85,247,0.35);
        }
        .blog-search-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 3px;
          color: #22d3ee;
          flex-shrink: 0;
          user-select: none;
        }
        .blog-search-input {
          flex: 1;
          background: rgba(168,85,247,0.05);
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          padding: 10px 16px;
          outline: none;
          transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }
        .blog-search-input:focus {
          border-color: #a855f7;
          background: rgba(168,85,247,0.1);
          box-shadow: 0 0 20px rgba(168,85,247,0.2), inset 0 0 12px rgba(168,85,247,0.06);
        }
        .blog-search-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .blog-search-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          color: #a855f7;
          flex-shrink: 0;
        }

        /* ── Tag filter row ── */
        .blog-tags-row {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 40px;
          overflow-x: auto;
          background: rgba(10,5,20,0.3);
          scrollbar-width: none;
        }
        .blog-tags-row::-webkit-scrollbar { display: none; }
        .blog-tag-pill {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border: 1px solid;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .blog-tag-pill:hover {
          opacity: 1;
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 0 12px currentColor;
          filter: brightness(1.3);
        }
        .blog-tag-pill.active {
          background: linear-gradient(135deg, #a855f7 0%, #39ff14 100%) !important;
          border-color: #a855f7 !important;
          color: #06030f !important;
          font-weight: bold;
          box-shadow: 0 0 14px rgba(168,85,247,0.6), 0 0 6px rgba(57,255,20,0.4);
          animation: tag-breathe 2s ease-in-out infinite;
        }
        @keyframes tag-breathe {
          0%, 100% { box-shadow: 0 0 14px rgba(168,85,247,0.6), 0 0 6px rgba(57,255,20,0.4); }
          50% { box-shadow: 0 0 22px rgba(168,85,247,0.9), 0 0 12px rgba(57,255,20,0.6); }
        }

        /* ── Content area ── */
        .blog-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 40px 40px;
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.5) transparent;
        }
        .blog-content::-webkit-scrollbar { width: 4px; }
        .blog-content::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.5); }

        /* ── Post Card ── */
        @keyframes blog-card-in {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .blog-card {
          position: relative;
          margin-bottom: 10px;
          background: linear-gradient(135deg, rgba(30, 18, 58, 0.85) 0%, rgba(10, 6, 20, 0.85) 100%);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          border-left: 3px solid rgba(168, 85, 247, 0.3);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-left: 3px solid rgba(168, 85, 247, 0.4);
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          animation: blog-card-in 0.3s ease both;
          overflow: hidden;
        }
        .blog-card:hover,
        .blog-card.active-card {
          background: linear-gradient(135deg, rgba(42, 27, 77, 0.95) 0%, rgba(16, 10, 32, 0.95) 100%);
          border-left-color: #39ff14;
          transform: translateX(4px);
          box-shadow: 0 4px 24px rgba(57, 255, 20, 0.12), 0 0 0 1px rgba(57, 255, 20, 0.1);
        }
        .blog-card-inner {
          padding: 18px 24px 18px 22px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: start;
        }
        .blog-card-series-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: #facc15;
          background: rgba(250,204,21,0.12);
          border: 1px solid rgba(250,204,21,0.3);
          padding: 2px 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .blog-card-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 24px;
          letter-spacing: 0.5px;
          color: #eef6ff;
          line-height: 1.2;
          margin-bottom: 6px;
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }
        .blog-card:hover .blog-card-title,
        .blog-card.active-card .blog-card-title {
          color: #39ff14;
          text-shadow: 0 0 12px rgba(57, 255, 20, 0.3);
        }
        .blog-card-excerpt {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: rgba(200,215,230,0.65);
          line-height: 1.45;
          margin-bottom: 10px;
        }
        .blog-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .blog-card-tag {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          padding: 2px 7px;
          border: 1px solid;
          opacity: 0.8;
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
          font-size: 13px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.4);
        }
        .blog-card-arrow {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: rgba(168, 85, 247, 0.6);
          transition: color 0.18s ease, transform 0.18s ease;
        }
        .blog-card:hover .blog-card-arrow,
        .blog-card.active-card .blog-card-arrow {
          color: #39ff14;
          transform: translateX(4px);
        }

        /* ── Chapter indicator strip ── */
        .blog-card-chapter-strip {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 28px;
          background: linear-gradient(180deg, #39ff14 0%, rgba(57, 255, 20, 0.25) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blog-card-chapter-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          color: #fff;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          user-select: none;
        }

        /* ── Series View ── */
        .series-card {
          margin-bottom: 18px;
          background: linear-gradient(135deg, rgba(30, 18, 58, 0.85) 0%, rgba(10, 6, 20, 0.85) 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-left: 3px solid rgba(57, 255, 20, 0.4);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          cursor: pointer;
          animation: blog-card-in 0.3s ease both;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .series-card:hover {
          background: linear-gradient(135deg, rgba(42, 27, 77, 0.95) 0%, rgba(16, 10, 32, 0.95) 100%);
          border-left-color: #39ff14;
          box-shadow: 0 4px 24px rgba(57, 255, 20, 0.1);
        }
        .series-header {
          padding: 20px 28px 14px;
          border-bottom: 1px solid rgba(168,85,247,0.2);
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .series-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 28px;
          letter-spacing: 0.5px;
          color: #fff;
          line-height: 1.1;
          flex: 1;
        }
        .series-card:hover .series-title {
          color: #39ff14;
        }
        .series-chapter-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          color: #facc15;
          background: rgba(250,204,21,0.12);
          border: 1px solid rgba(250,204,21,0.4);
          padding: 4px 12px;
          flex-shrink: 0;
        }
        .series-desc {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: rgba(200,215,230,0.6);
          line-height: 1.45;
          margin-top: 6px;
        }
        .series-chapters-list {
          padding: 0 28px 16px;
        }
        .series-chapter-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .series-chapter-row:last-child { border-bottom: none; }
        .series-chapter-row:hover {
          transform: translateX(4px);
        }
        .series-chapter-row:hover .series-chapter-title {
          color: #fff;
        }
        .series-chapter-num-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          color: #06030f;
          background: #22d3ee;
          padding: 2px 8px;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
          font-weight: bold;
        }
        .series-chapter-title {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(220,235,245,0.75);
          flex: 1;
          transition: color 0.15s ease;
        }
        .series-chapter-date {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .series-chapter-arrow {
          font-size: 14px;
          color: rgba(34,211,238,0.5);
          flex-shrink: 0;
        }
        .series-chapter-row:hover .series-chapter-arrow {
          color: #22d3ee;
        }

        /* ── Empty state ── */
        .blog-empty {
          text-align: center;
          padding: 80px 40px;
        }
        .blog-empty-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 36px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 2px;
        }
        .blog-empty-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.25);
          margin-top: 8px;
        }

        /* ── Footer hints ── */
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
          font-size: 13px; letter-spacing: 2px;
          color: rgba(255,255,255,0.4);
        }
        .blog-footer-key {
          border: 1px solid #22d3ee;
          color: #22d3ee;
          border-radius: 3px;
          padding: 1px 6px; font-size: 11px;
        }

        /* ── Transition ── */
        .blog-overlay {
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
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
            <div className="blog-header-title">SYSTEM BLOG</div>
            <div className="blog-header-sub">SOULS SYNTAX — FIELD NOTES FROM THE MACHINE</div>
          </div>
          <div className="blog-view-toggle">
            <button
              id="blog-view-posts"
              className={`blog-view-btn${view === "posts" ? " active" : ""}`}
              onClick={() => setView("posts")}
            >POSTS</button>
            <button
              id="blog-view-series"
              className={`blog-view-btn${view === "series" ? " active" : ""}`}
              onClick={() => setView("series")}
            >SERIES</button>
          </div>
        </div>

        {/* Search */}
        <div className="blog-search-wrap">
          <span className="blog-search-label">⌕ SEARCH</span>
          <input
            id="blog-search-input"
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

        {/* Tag pills */}
        <div className="blog-tags-row">
          <span
            className={`blog-tag-pill${!activeTag ? " active" : ""}`}
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.25)", background: "transparent" }}
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
              <div className="blog-empty-title" style={{ fontSize: 28, color: '#22d3ee', letterSpacing: 6 }}>LOADING...</div>
            </div>
          )}
          {!loading && fetchError && (
            <div className="blog-empty">
              <div className="blog-empty-title" style={{ fontSize: 28, color: '#ef4444' }}>API ERROR</div>
              <div className="blog-empty-sub" style={{ color: 'rgba(239,68,68,0.7)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginTop: 12, maxWidth: 600, wordBreak: 'break-all', margin: '0 auto' }}>{fetchError}</div>
              <div className="blog-empty-sub" style={{ marginTop: 16 }}>Make sure <code style={{ color: '#a855f7', fontFamily: 'monospace' }}>vercel dev</code> is running on port 3000</div>
            </div>
          )}
          {view === "posts" && !loading && !fetchError && (
            <>
              {results.length === 0 ? (
                <div className="blog-empty">
                  <div className="blog-empty-title">NO RESULTS</div>
                  <div className="blog-empty-sub">Try a different query or clear the tag filter</div>
                </div>
              ) : results.map((blog, i) => (
                <div
                  key={blog.id}
                  id={`blog-card-${blog.id}`}
                  className={`blog-card${activePost === i ? " active-card" : ""}`}
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  onMouseEnter={() => setActivePost(i)}
                >
                  {blog.chapterIndex !== null && (
                    <div
                      className="blog-card-chapter-strip"
                      style={{ paddingLeft: "18px" }}
                    >
                      <span className="blog-card-chapter-num">CH {blog.chapterIndex}</span>
                    </div>
                  )}
                  <div
                    className="blog-card-inner"
                    style={{ paddingLeft: blog.chapterIndex !== null ? "46px" : "22px" }}
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
              ))}
            </>
          )}

          {view === "series" && !loading && !fetchError && (
            <>
              {series.map((s, si) => {
                const chapters = blogs
                  .filter(b => b.seriesId === s.id)
                  .sort((a, b) => (a.chapterIndex ?? 0) - (b.chapterIndex ?? 0));
                return (
                  <div
                    key={s.id}
                    className="series-card"
                    style={{ animationDelay: `${si * 80}ms` }}
                  >
                    <div className="series-header">
                      <div>
                        <div className="series-title">{s.title}</div>
                        <div className="series-desc">{s.description}</div>
                        <div className="blog-card-tags" style={{ marginTop: 8 }}>
                          {s.tags.map(tag => (
                            <span
                              key={tag}
                              className="blog-card-tag"
                              style={{ color: tagColor(tag), borderColor: tagColor(tag) }}
                            >{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="series-chapter-count">{chapters.length} CHAPTERS</div>
                    </div>
                    <div className="series-chapters-list">
                      {chapters.map(ch => (
                        <div
                          key={ch.id}
                          className="series-chapter-row"
                          onClick={() => navigate(`/blog/${ch.id}`)}
                        >
                          <div className="series-chapter-num-badge">CH {ch.chapterIndex}</div>
                          <div className="series-chapter-title">{ch.title}</div>
                          <div className="series-chapter-date">{ch.date}</div>
                          <div className="series-chapter-arrow">►</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Footer hints */}
      <div className={`blog-footer${mounted ? " mounted" : ""}`}>
        <div className="blog-footer-row"><span className="blog-footer-key">/</span><span>SEARCH</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">↑↓</span><span>NAVIGATE</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">↵</span><span>OPEN</span></div>
        <div className="blog-footer-row"><span className="blog-footer-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
