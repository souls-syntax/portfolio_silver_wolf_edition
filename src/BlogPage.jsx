import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BLOGS, SERIES, searchBlogs } from "./data/blogs.js";
import bgVideo from "./assets/main1.mp4";

const LANG_COLORS = {
  C: "#5b8fcc", "C++": "#f34b7d", Zig: "#f7a41d", CUDA: "#76b900",
  Lua: "#000080", Systems: "#c4001a", OS: "#8b5cf6", Shell: "#22c55e",
  Memory: "#ea580c", Linux: "#ef4444", Kernel: "#dc2626", POSIX: "#0891b2",
  GPU: "#76b900", Performance: "#f59e0b", Neovim: "#65a30d", Tooling: "#6366f1",
  ELF: "#7c3aed", Linker: "#9333ea", Series: "#c4001a", Default: "#555",
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

export default function BlogPage() {
  const navigate = useNavigate();
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState(BLOGS);
  const [activeTag, setActiveTag]   = useState(null);
  const [view, setView]             = useState("posts"); // "posts" | "series"
  const [mounted, setMounted]       = useState(false);
  const [activePost, setActivePost] = useState(0);
  const inputRef = useRef(null);

  // Collect all unique tags
  const allTags = [...new Set(BLOGS.flatMap(b => b.tags))].sort();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
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
  }, [query, activeTag]);

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
    <div id="menu-screen">
      <video src={bgVideo} autoPlay loop muted playsInline />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Barlow+Condensed:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');

        /* ── Layout ── */
        .blog-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        /* Blurred black-tint backdrop */
        .blog-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(18px) saturate(0.6);
          -webkit-backdrop-filter: blur(18px) saturate(0.6);
          pointer-events: none;
        }
        /* Ensure all direct children sit above the backdrop */
        .blog-header,
        .blog-search-wrap,
        .blog-tags-row,
        .blog-content,
        .blog-footer {
          position: relative;
          z-index: 1;
        }

        /* ── Header bar ── */
        .blog-header {
          position: relative;
          flex-shrink: 0;
          height: 90px;
          background: #c4001a;
          clip-path: polygon(0 0, 100% 0, 97% 100%, 0 100%);
          display: flex;
          align-items: center;
          padding: 0 40px;
          gap: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          z-index: 2;
        }
        .blog-header-title {
          font-family: 'Anton', sans-serif;
          font-size: 64px;
          letter-spacing: 4px;
          color: #fff;
          line-height: 1;
          font-style: italic;
          user-select: none;
          white-space: nowrap;
        }
        .blog-header-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.55);
          padding-top: 6px;
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
          padding: 6px 16px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.15s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .blog-view-btn.active {
          background: #fff;
          color: #c4001a;
          border-color: transparent;
        }
        .blog-view-btn:hover:not(.active) {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        /* ── Search bar ── */
        .blog-search-wrap {
          position: relative;
          flex-shrink: 0;
          padding: 14px 40px 10px;
          background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%);
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid rgba(196,0,26,0.35);
        }
        .blog-search-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 3px;
          color: #c4001a;
          flex-shrink: 0;
          user-select: none;
        }
        .blog-search-input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(196,0,26,0.4);
          border-radius: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          padding: 10px 16px;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .blog-search-input:focus {
          border-color: rgba(196,0,26,0.9);
          background: rgba(255,255,255,0.1);
        }
        .blog-search-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .blog-search-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.35);
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
          background: rgba(0,0,0,0.3);
          scrollbar-width: none;
        }
        .blog-tags-row::-webkit-scrollbar { display: none; }
        .blog-tag-pill {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 1.5px;
          padding: 3px 10px;
          border: 1px solid;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .blog-tag-pill:hover { opacity: 0.8; }
        .blog-tag-pill.active {
          background: #c4001a !important;
          border-color: #c4001a !important;
          color: #fff !important;
        }

        /* ── Content area ── */
        .blog-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 40px 40px;
          scrollbar-width: thin;
          scrollbar-color: rgba(196,0,26,0.5) transparent;
        }
        .blog-content::-webkit-scrollbar { width: 4px; }
        .blog-content::-webkit-scrollbar-thumb { background: rgba(196,0,26,0.5); }

        /* ── Post Card ── */
        @keyframes blog-card-in {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .blog-card {
          position: relative;
          margin-bottom: 10px;
          background: rgba(10,10,20,0.82);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          border-left: 3px solid transparent;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
          animation: blog-card-in 0.3s ease both;
          overflow: hidden;
        }
        .blog-card:hover,
        .blog-card.active-card {
          background: rgba(20,20,40,0.95);
          border-left-color: #c4001a;
          transform: translateX(4px);
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
          color: #c4001a;
          background: rgba(196,0,26,0.12);
          border: 1px solid rgba(196,0,26,0.3);
          padding: 2px 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .blog-card-title {
          font-family: 'Anton', sans-serif;
          font-size: 26px;
          letter-spacing: 1px;
          color: #eef6ff;
          line-height: 1.1;
          margin-bottom: 6px;
          transition: color 0.15s ease;
        }
        .blog-card:hover .blog-card-title,
        .blog-card.active-card .blog-card-title {
          color: #fff;
        }
        .blog-card-excerpt {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
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
          color: rgba(255,255,255,0.3);
        }
        .blog-card-arrow {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: rgba(196,0,26,0.5);
          transition: color 0.18s ease, transform 0.18s ease;
        }
        .blog-card:hover .blog-card-arrow,
        .blog-card.active-card .blog-card-arrow {
          color: #c4001a;
          transform: translateX(4px);
        }

        /* ── Chapter indicator strip ── */
        .blog-card-chapter-strip {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 28px;
          background: linear-gradient(180deg, #c4001a 0%, rgba(196,0,26,0.3) 100%);
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
          background: rgba(10,10,20,0.82);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          cursor: pointer;
          animation: blog-card-in 0.3s ease both;
        }
        .series-header {
          padding: 20px 28px 14px;
          border-bottom: 1px solid rgba(196,0,26,0.2);
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .series-title {
          font-family: 'Anton', sans-serif;
          font-size: 32px;
          letter-spacing: 2px;
          color: #fff;
          line-height: 1.1;
          flex: 1;
        }
        .series-chapter-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          color: #c4001a;
          background: rgba(196,0,26,0.12);
          border: 1px solid rgba(196,0,26,0.4);
          padding: 4px 12px;
          flex-shrink: 0;
        }
        .series-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
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
          color: #fff;
          background: #c4001a;
          padding: 2px 8px;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
        }
        .series-chapter-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: rgba(220,235,245,0.75);
          flex: 1;
          transition: color 0.15s ease;
        }
        .series-chapter-date {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.25);
          flex-shrink: 0;
        }
        .series-chapter-arrow {
          font-size: 14px;
          color: rgba(196,0,26,0.5);
          flex-shrink: 0;
        }

        /* ── Empty state ── */
        .blog-empty {
          text-align: center;
          padding: 80px 40px;
        }
        .blog-empty-title {
          font-family: 'Anton', sans-serif;
          font-size: 48px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 4px;
        }
        .blog-empty-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.15);
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
          color: rgba(255,255,255,0.22);
        }
        .blog-footer-key {
          border: 1px solid rgba(255,255,255,0.15);
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
        {/* Header */}
        <div className="blog-header">
          <div>
            <div className="blog-header-title">BLOG</div>
            <div className="blog-header-sub">AAKARSH KASHYAP — FIELD NOTES FROM THE MACHINE</div>
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
          <span className="blog-search-count">{results.length} / {BLOGS.length}</span>
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
          {view === "posts" && (
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
                          {SERIES.find(s => s.id === blog.seriesId)?.title ?? blog.seriesId}
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

          {view === "series" && (
            <>
              {SERIES.map((series, si) => {
                const chapters = BLOGS
                  .filter(b => b.seriesId === series.id)
                  .sort((a, b) => (a.chapterIndex ?? 0) - (b.chapterIndex ?? 0));
                return (
                  <div
                    key={series.id}
                    className="series-card"
                    style={{ animationDelay: `${si * 80}ms` }}
                  >
                    <div className="series-header">
                      <div>
                        <div className="series-title">{series.title}</div>
                        <div className="series-desc">{series.description}</div>
                        <div className="blog-card-tags" style={{ marginTop: 8 }}>
                          {series.tags.map(tag => (
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
