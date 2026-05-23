import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BLOGS, SERIES, getSeriesChapters } from "./data/blogs.js";
import {
  getComments, saveComment, addReaction, buildThreadTree,
  getIdentity, saveIdentity, formatTime,
} from "./data/comments.js";
import bgVideo from "./assets/main1.mp4";

// ── Markdown renderer (lightweight, no deps) ─────────────────────────────────
function renderMarkdown(md) {
  if (!md) return "";

  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code-block" data-lang="${lang}"><code>${highlightCode(escapeHtml(code.trim()), lang)}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, (_, c) => `<code class="md-inline-code">${escapeHtml(c)}</code>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Tables
    .replace(/\|(.+)\|\n\|[-: |]+\|\n((?:\|.+\|\n?)*)/g, (_, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map(h => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map(row =>
        row.split('|').map(c => c.trim()).filter(Boolean)
      );
      const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      const tbody = rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
      return `<table class="md-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="md-hr" />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')
    // Paragraphs (double newline)
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed; // already tagged
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  // Wrap adjacent <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="md-ul">$1</ul>');

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Lightweight syntax highlighter ───────────────────────────────────────────────
const KEYWORDS = new Set([
  // C / C++ / Zig / CUDA
  'auto','break','case','const','continue','default','do','else','enum',
  'extern','for','goto','if','inline','register','return','sizeof','static',
  'struct','switch','typedef','union','unsigned','volatile','while',
  // C++ extras
  'class','delete','explicit','friend','namespace','new','nullptr','operator',
  'override','private','protected','public','template','this','throw','try',
  'catch','virtual','using','decltype','constexpr','noexcept','typename',
  // Zig
  'fn','var','const','pub','defer','errdefer','try','catch','unreachable',
  'comptime','anytype','usingnamespace','test','packed','align','allowzero',
  // Lua
  'and','end','false','in','local','nil','not','or','repeat','then','true','until',
  // Shell
  'fi','done','esac','function','select','time','coproc',
  // JS / TS
  'async','await','import','export','from','let','of','yield','typeof',
  'instanceof','extends','implements','interface','abstract','type','enum',
  'declare','readonly','keyof','infer','never','any','unknown',
]);

const TYPES = new Set([
  'int','long','short','char','float','double','bool','void','size_t',
  'uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t',
  'ptrdiff_t','uintptr_t','intptr_t','ssize_t','off_t','FILE','NULL','true','false',
  'string','number','boolean','object','symbol','bigint','undefined','null',
  'i8','i16','i32','i64','u8','u16','u32','u64','f32','f64','usize','isize',
]);

function highlightCode(escaped, _lang) {
  // Work token-by-token on the escaped HTML string.
  // We recognise: block comments, line comments, preprocessor, strings, numbers, identifiers.
  return escaped.replace(
    // Order matters: longest / most-specific patterns first.
    /(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*|#[^\n]*)|(&quot;(?:[^&]|&(?!quot;))*&quot;|&apos;(?:[^&]|&(?!apos;))*&apos;'|'[^'\\]*')|\b(0x[0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b|\b([a-zA-Z_][\w]*)\b(\s*\()?/g,
    (match, blockComment, lineComment, str, num, ident, callParen) => {
      if (blockComment) return `<span class="tok-comment">${match}</span>`;
      if (lineComment)  return `<span class="tok-comment">${match}</span>`;
      if (str)          return `<span class="tok-string">${match}</span>`;
      if (num !== undefined) return `<span class="tok-number">${match}</span>`;
      if (ident) {
        if (KEYWORDS.has(ident)) return `<span class="tok-keyword">${ident}</span>${callParen ?? ''}`;
        if (TYPES.has(ident))    return `<span class="tok-type">${ident}</span>${callParen ?? ''}`;
        if (callParen)           return `<span class="tok-fn">${ident}</span>${callParen}`;
        // ALL_CAPS = constant
        if (/^[A-Z_][A-Z0-9_]+$/.test(ident)) return `<span class="tok-const">${ident}</span>`;
      }
      return match;
    }
  );
}

// ── Avatar color from hue ─────────────────────────────────────────────────────
function avatarStyle(colorHue) {
  return {
    background: `linear-gradient(135deg, hsl(${colorHue},75%,45%) 0%, hsl(${(colorHue+40)%360},60%,30%) 100%)`,
  };
}

const EMOJIS = ["🔥", "💯", "👏", "🧠", "😮", "❤️"];
const HUE_PRESETS = [0, 30, 60, 120, 200, 240, 280, 330];

// ── Identity Modal ────────────────────────────────────────────────────────────
function IdentityModal({ onSave }) {
  const [name, setName] = useState("");
  const [hue, setHue]   = useState(0);

  return (
    <div className="identity-backdrop">
      <div className="identity-modal">
        <div className="identity-modal-header">CHOOSE YOUR IDENTITY</div>
        <div className="identity-modal-sub">This persists in your browser. No account needed.</div>

        <div className="identity-preview" style={avatarStyle(hue)}>
          {name ? name[0].toUpperCase() : "?"}
        </div>

        <input
          id="identity-username-input"
          className="identity-input"
          type="text"
          placeholder="your name / handle"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={32}
          autoFocus
        />

        <div className="identity-hue-label">PICK A COLOR</div>
        <div className="identity-hues">
          {HUE_PRESETS.map(h => (
            <div
              key={h}
              className={`identity-hue-swatch${hue === h ? " selected" : ""}`}
              style={{ background: `hsl(${h},70%,45%)` }}
              onClick={() => setHue(h)}
            />
          ))}
        </div>

        <button
          id="identity-save-btn"
          className="identity-save-btn"
          disabled={!name.trim()}
          onClick={() => name.trim() && onSave(name.trim(), hue)}
        >
          ENTER THE THREAD →
        </button>
      </div>
    </div>
  );
}

// ── Single comment node (recursive for threads) ───────────────────────────────
function CommentNode({ node, postId, depth = 0, onReply, onReact, allComments, setComments }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText]       = useState("");
  const [showEmojis, setShowEmojis]     = useState(false);
  const identity = getIdentity();

  const handleReply = () => {
    if (!replyText.trim() || !identity) return;
    const newComment = saveComment(postId, {
      parentId:  node.id,
      author:    identity.username,
      colorHue:  identity.colorHue,
      body:      replyText.trim(),
    });
    const updated = getComments(postId);
    setComments(buildThreadTree(updated));
    setReplyText("");
    setShowReplyBox(false);
  };

  const handleReact = (emoji) => {
    addReaction(postId, node.id, emoji);
    const updated = getComments(postId);
    setComments(buildThreadTree(updated));
    setShowEmojis(false);
  };

  const totalReactions = Object.values(node.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <div
      className="comment-node"
      style={{
        marginLeft: depth > 0 ? `${Math.min(depth * 24, 96)}px` : 0,
        borderLeft: depth > 0 ? `2px solid hsl(${node.colorHue},55%,35%)` : "none",
        paddingLeft: depth > 0 ? "12px" : "0",
      }}
    >
      <div className="comment-header">
        <div className="comment-avatar" style={avatarStyle(node.colorHue)}>
          {node.author[0].toUpperCase()}
        </div>
        <div className="comment-meta">
          <span className="comment-author" style={{ color: `hsl(${node.colorHue},75%,65%)` }}>
            {node.author}
          </span>
          <span className="comment-time">{formatTime(node.timestamp)}</span>
        </div>
      </div>

      <div className="comment-body">{node.body}</div>

      <div className="comment-actions">
        {/* Reactions display */}
        {Object.entries(node.reactions || {}).map(([emoji, count]) =>
          count > 0 ? (
            <span
              key={emoji}
              className="comment-reaction-badge"
              onClick={() => handleReact(emoji)}
              title={`React with ${emoji}`}
            >
              {emoji} {count}
            </span>
          ) : null
        )}

        {/* Action buttons */}
        <span className="comment-action-btn" onClick={() => setShowReplyBox(v => !v)}>
          ↩ REPLY
        </span>
        <span
          className="comment-action-btn"
          onClick={() => setShowEmojis(v => !v)}
        >
          {totalReactions > 0 ? `✦ REACT (${totalReactions})` : "✦ REACT"}
        </span>

        {showEmojis && (
          <div className="emoji-picker">
            {EMOJIS.map(e => (
              <span key={e} className="emoji-option" onClick={() => handleReact(e)}>{e}</span>
            ))}
          </div>
        )}
      </div>

      {showReplyBox && (
        <div className="comment-reply-box">
          <textarea
            className="comment-textarea"
            placeholder={`Replying to ${node.author}...`}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="comment-reply-actions">
            <button
              className="comment-submit-btn"
              onClick={handleReply}
              disabled={!replyText.trim()}
            >POST REPLY</button>
            <button
              className="comment-cancel-btn"
              onClick={() => { setShowReplyBox(false); setReplyText(""); }}
            >CANCEL</button>
          </div>
        </div>
      )}

      {/* Recursive children */}
      {node.children?.map(child => (
        <CommentNode
          key={child.id}
          node={child}
          postId={postId}
          depth={depth + 1}
          onReply={onReply}
          onReact={onReact}
          allComments={allComments}
          setComments={setComments}
        />
      ))}
    </div>
  );
}

// ── Comment Section ───────────────────────────────────────────────────────────
function CommentSection({ postId }) {
  const [identity, setIdentity]     = useState(getIdentity);
  const [showModal, setShowModal]   = useState(false);
  const [comments, setComments]     = useState(() => buildThreadTree(getComments(postId)));
  const [newComment, setNewComment] = useState("");
  const [postError, setPostError]   = useState("");

  const totalComments = getComments(postId).length;

  const handlePost = () => {
    if (!identity) { setShowModal(true); return; }
    if (!newComment.trim()) { setPostError("Write something first."); return; }
    saveComment(postId, {
      parentId: null,
      author:   identity.username,
      colorHue: identity.colorHue,
      body:     newComment.trim(),
    });
    const updated = getComments(postId);
    setComments(buildThreadTree(updated));
    setNewComment("");
    setPostError("");
  };

  const handleSaveIdentity = (username, colorHue) => {
    const id = saveIdentity(username, colorHue);
    setIdentity(id);
    setShowModal(false);
  };

  return (
    <div className="comments-section">
      {showModal && <IdentityModal onSave={handleSaveIdentity} />}

      <div className="comments-header">
        <span className="comments-title">THREAD</span>
        <span className="comments-count">{totalComments} {totalComments === 1 ? "POST" : "POSTS"}</span>
        {identity && (
          <span
            className="comments-identity-badge"
            style={{ color: `hsl(${identity.colorHue},75%,65%)` }}
            onClick={() => setShowModal(true)}
            title="Click to change identity"
          >
            ✎ {identity.username}
          </span>
        )}
      </div>

      {/* New comment box */}
      <div className="comment-compose">
        {!identity ? (
          <button
            id="comment-identity-btn"
            className="comment-identity-prompt"
            onClick={() => setShowModal(true)}
          >
            SET IDENTITY TO COMMENT →
          </button>
        ) : (
          <>
            <div className="comment-compose-avatar" style={avatarStyle(identity.colorHue)}>
              {identity.username[0].toUpperCase()}
            </div>
            <div className="comment-compose-right">
              <textarea
                id="comment-new-textarea"
                className="comment-textarea"
                placeholder="Share your thoughts, corrections, or war stories..."
                value={newComment}
                onChange={e => { setNewComment(e.target.value); setPostError(""); }}
                rows={4}
              />
              {postError && <div className="comment-error">{postError}</div>}
              <div className="comment-compose-footer">
                <span className="comment-markdown-hint">Plain text. Be yourself.</span>
                <button
                  id="comment-post-btn"
                  className="comment-submit-btn"
                  onClick={handlePost}
                  disabled={!newComment.trim()}
                >POST TO THREAD</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Thread */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">
            <div className="comments-empty-text">NO POSTS YET</div>
            <div className="comments-empty-sub">Be the first to drop a note in the thread.</div>
          </div>
        ) : comments.map(node => (
          <CommentNode
            key={node.id}
            node={node}
            postId={postId}
            depth={0}
            setComments={setComments}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main BlogPost component ───────────────────────────────────────────────────
export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef(null);

  const post = BLOGS.find(b => b.id === id);
  const series = post?.seriesId ? SERIES.find(s => s.id === post.seriesId) : null;
  const chapters = series ? getSeriesChapters(post.seriesId) : [];
  const currentChapterIdx = chapters.findIndex(c => c.id === id);
  const prevChapter = currentChapterIdx > 0 ? chapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx < chapters.length - 1 ? chapters[currentChapterIdx + 1] : null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        if (document.activeElement?.tagName !== "TEXTAREA" &&
            document.activeElement?.tagName !== "INPUT") {
          navigate("/blog");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (!post) {
    return (
      <div id="menu-screen">
        <video src={bgVideo} autoPlay loop muted playsInline />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 64, color: "#c4001a", letterSpacing: 4 }}>404</div>
          <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 18, color: "rgba(255,255,255,0.4)", letterSpacing: 3 }}>POST NOT FOUND</div>
          <button
            style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 16, letterSpacing: 2, padding: "10px 24px", background: "#c4001a", border: "none", color: "#fff", cursor: "pointer", marginTop: 16 }}
            onClick={() => navigate("/blog")}
          >← BACK TO BLOG</button>
        </div>
      </div>
    );
  }

  const htmlContent = renderMarkdown(post.content);

  return (
    <div id="menu-screen">
      <video src={bgVideo} autoPlay loop muted playsInline />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Barlow+Condensed:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

        /* ── Post layout ── */
        .post-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .post-overlay.mounted { opacity: 1; transform: translateX(0); }
        /* Blurred black-tint backdrop behind all content */
        .post-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(18px) saturate(0.5);
          -webkit-backdrop-filter: blur(18px) saturate(0.5);
          pointer-events: none;
        }
        /* Lift all children above the backdrop */
        .post-topbar,
        .post-body {
          position: relative;
          z-index: 1;
        }

        /* ── Top bar ── */
        .post-topbar {
          position: relative;
          flex-shrink: 0;
          background: rgba(0,0,0,0.85);
          border-bottom: 2px solid #c4001a;
          padding: 10px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 2;
        }
        .post-back-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          color: #c4001a;
          background: none;
          border: 1px solid rgba(196,0,26,0.4);
          padding: 4px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .post-back-btn:hover {
          background: #c4001a;
          color: #fff;
        }
        .post-breadcrumb {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .post-breadcrumb-sep { color: #c4001a; }
        .post-breadcrumb-current { color: rgba(255,255,255,0.65); }

        /* ── Main content area ── */
        .post-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(196,0,26,0.4) transparent;
          background: rgba(0, 0, 0, 0.35);
        }
        .post-body::-webkit-scrollbar { width: 4px; }
        .post-body::-webkit-scrollbar-thumb { background: rgba(196,0,26,0.4); }

        /* ── Article container ── */
        .post-article {
          max-width: 820px;
          margin: 0 auto;
          width: 100%;
          padding: 40px 40px 0;
        }

        /* ── Series banner ── */
        .post-series-banner {
          background: rgba(196,0,26,0.1);
          border: 1px solid rgba(196,0,26,0.3);
          clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          padding: 12px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .post-series-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #c4001a;
        }
        .post-series-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.75);
        }
        .post-series-chapter {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.4);
          margin-left: auto;
        }

        /* ── Post header ── */
        .post-title-block {
          margin-bottom: 20px;
        }
        .post-title {
          font-family: 'Anton', sans-serif;
          font-size: 52px;
          letter-spacing: 2px;
          color: #fff;
          line-height: 1.05;
          margin-bottom: 14px;
        }
        .post-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .post-date {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.35);
        }
        .post-tag {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          padding: 2px 8px;
          border: 1px solid;
          opacity: 0.8;
        }
        .post-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, #c4001a 0%, transparent 100%);
          margin: 20px 0 32px;
        }

        /* ── Series chapter list (inline at top of post) ── */
        .post-chapter-nav {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(196,0,26,0.2);
          clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          padding: 16px 20px;
          margin-bottom: 32px;
        }
        .post-chapter-nav-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          color: #c4001a;
          margin-bottom: 10px;
        }
        .post-chapter-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          cursor: pointer;
          transition: transform 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .post-chapter-nav-item:last-child { border-bottom: none; }
        .post-chapter-nav-item:hover { transform: translateX(4px); }
        .post-chapter-nav-item:hover .pch-title { color: #fff; }
        .post-chapter-nav-item.current .pch-num { background: #c4001a; }
        .post-chapter-nav-item.current .pch-title { color: #fff; }
        .pch-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          color: #fff;
          background: rgba(196,0,26,0.5);
          padding: 2px 8px;
          flex-shrink: 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
        }
        .pch-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: rgba(200,220,235,0.65);
          flex: 1;
          transition: color 0.15s ease;
        }

        /* ── Markdown content styles ── */
        .post-content {
          color: rgba(220, 232, 242, 0.9);
          line-height: 1.7;
        }
        .md-h1 {
          font-family: 'Anton', sans-serif;
          font-size: 42px;
          letter-spacing: 2px;
          color: #fff;
          margin: 36px 0 16px;
          line-height: 1.1;
        }
        .md-h2 {
          font-family: 'Anton', sans-serif;
          font-size: 30px;
          letter-spacing: 1px;
          color: #eef4ff;
          margin: 32px 0 12px;
          border-left: 3px solid #c4001a;
          padding-left: 14px;
          line-height: 1.15;
        }
        .md-h3 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.75);
          margin: 24px 0 8px;
        }
        .md-p {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          margin: 0 0 18px;
          color: rgba(210,225,240,0.85);
        }
        .md-code-block {
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(196,0,26,0.2);
          border-left: 3px solid #c4001a;
          padding: 20px 24px;
          margin: 20px 0;
          overflow-x: auto;
          position: relative;
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .md-code-block::before {
          content: attr(data-lang);
          position: absolute;
          top: 8px;
          right: 16px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: #c4001a;
          opacity: 0.7;
          text-transform: uppercase;
        }
        .md-code-block {
          background: rgba(4,6,14,0.88) !important;
        }
        .md-code-block code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px;
          color: #b8d0e8;
          white-space: pre;
          line-height: 1.6;
        }
        /* ── Syntax token colours ── */
        .md-code-block .tok-keyword {
          color: #ff6eb4;
          font-weight: 700;
        }
        .md-code-block .tok-type {
          color: #4fc3f7;
        }
        .md-code-block .tok-string {
          color: #a8e6a3;
        }
        .md-code-block .tok-number {
          color: #ffb74d;
        }
        .md-code-block .tok-comment {
          color: #637070;
          font-style: italic;
        }
        .md-code-block .tok-fn {
          color: #82cfff;
        }
        .md-code-block .tok-const {
          color: #ffd54f;
        }
        .md-inline-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          background: rgba(196,0,26,0.12);
          border: 1px solid rgba(196,0,26,0.25);
          color: #ff8080;
          padding: 1px 5px;
          border-radius: 2px;
        }
        .md-link {
          color: #3ce2ff;
          text-decoration: none;
          border-bottom: 1px solid rgba(60,226,255,0.3);
          transition: border-color 0.15s ease;
        }
        .md-link:hover { border-color: #3ce2ff; }
        .md-ul {
          margin: 0 0 18px;
          padding-left: 0;
          list-style: none;
        }
        .md-li {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: rgba(210,225,240,0.85);
          padding: 4px 0 4px 20px;
          position: relative;
          line-height: 1.6;
        }
        .md-li::before {
          content: "▸";
          position: absolute;
          left: 0;
          color: #c4001a;
        }
        .md-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
        }
        .md-table th {
          background: rgba(196,0,26,0.2);
          color: #fff;
          padding: 8px 14px;
          text-align: left;
          letter-spacing: 1px;
          border-bottom: 2px solid #c4001a;
        }
        .md-table td {
          padding: 8px 14px;
          color: rgba(210,225,240,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .md-table tr:hover td { background: rgba(255,255,255,0.03); }
        .md-hr {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, #c4001a 0%, transparent 100%);
          margin: 32px 0;
        }
        .md-blockquote {
          border-left: 3px solid rgba(196,0,26,0.6);
          margin: 16px 0;
          padding: 10px 20px;
          background: rgba(196,0,26,0.06);
          font-family: 'Inter', sans-serif;
          font-style: italic;
          color: rgba(200,215,230,0.7);
        }

        /* ── Chapter navigation (prev/next) ── */
        .post-chapter-pagination {
          display: flex;
          gap: 12px;
          margin: 48px 0 0;
        }
        .post-chapter-nav-btn {
          flex: 1;
          background: rgba(10,10,20,0.85);
          border: 1px solid rgba(196,0,26,0.3);
          clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          text-decoration: none;
          display: block;
        }
        .post-chapter-nav-btn:hover {
          background: rgba(196,0,26,0.15);
          border-color: #c4001a;
        }
        .post-chapter-nav-btn.next { text-align: right; }
        .post-chapter-nav-dir {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: #c4001a;
          margin-bottom: 4px;
        }
        .post-chapter-nav-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: rgba(220,235,245,0.75);
        }

        /* ── Comments ── */
        .comments-section {
          max-width: 820px;
          margin: 0 auto;
          width: 100%;
          padding: 40px 40px 80px;
        }
        .comments-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #c4001a;
        }
        .comments-title {
          font-family: 'Anton', sans-serif;
          font-size: 32px;
          letter-spacing: 3px;
          color: #fff;
        }
        .comments-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.35);
        }
        .comments-identity-badge {
          margin-left: auto;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 1px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.15s ease;
          border: 1px solid currentColor;
          padding: 2px 10px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .comments-identity-badge:hover { opacity: 1; }

        /* ── Compose ── */
        .comment-compose {
          display: flex;
          gap: 14px;
          margin-bottom: 32px;
          background: rgba(0,0,0,0.45);
          padding: 16px;
          border: 1px solid rgba(196,0,26,0.15);
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .comment-compose-avatar {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Anton', sans-serif;
          font-size: 20px;
          color: #fff;
          flex-shrink: 0;
        }
        .comment-compose-right { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .comment-compose-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .comment-markdown-hint {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.2);
        }
        .comment-identity-prompt {
          width: 100%;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 3px;
          color: #c4001a;
          background: rgba(196,0,26,0.08);
          border: 1px dashed rgba(196,0,26,0.4);
          padding: 20px;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: center;
        }
        .comment-identity-prompt:hover {
          background: rgba(196,0,26,0.15);
          border-style: solid;
        }

        /* ── Comment node ── */
        .comment-node {
          margin-bottom: 4px;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          padding-top: 16px;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Anton', sans-serif;
          font-size: 16px;
          color: #fff;
          flex-shrink: 0;
        }
        .comment-meta { display: flex; align-items: baseline; gap: 10px; }
        .comment-author {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1px;
        }
        .comment-time {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.25);
        }
        .comment-body {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: rgba(210,225,240,0.82);
          line-height: 1.6;
          margin-bottom: 8px;
          white-space: pre-wrap;
        }
        .comment-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 4px;
          position: relative;
        }
        .comment-action-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: color 0.15s ease;
          user-select: none;
        }
        .comment-action-btn:hover { color: #c4001a; }
        .comment-reaction-badge {
          font-size: 13px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 2px 8px;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.15s ease;
          user-select: none;
        }
        .comment-reaction-badge:hover { background: rgba(196,0,26,0.15); }
        .emoji-picker {
          position: absolute;
          top: 100%;
          left: 0;
          background: rgba(10,10,20,0.97);
          border: 1px solid rgba(196,0,26,0.3);
          display: flex;
          gap: 4px;
          padding: 8px;
          z-index: 50;
        }
        .emoji-option {
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          transition: background 0.15s ease;
        }
        .emoji-option:hover { background: rgba(196,0,26,0.2); }

        /* ── Textarea & buttons ── */
        .comment-textarea {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(196,0,26,0.3);
          color: rgba(220,232,242,0.9);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          padding: 12px 14px;
          resize: vertical;
          outline: none;
          transition: border-color 0.18s ease;
          box-sizing: border-box;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        }
        .comment-textarea:focus { border-color: #c4001a; }
        .comment-textarea::placeholder { color: rgba(255,255,255,0.2); }

        .comment-submit-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          background: #c4001a;
          color: #fff;
          border: none;
          padding: 8px 20px;
          cursor: pointer;
          transition: background 0.15s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        }
        .comment-submit-btn:hover { background: #e0001f; }
        .comment-submit-btn:disabled { background: rgba(196,0,26,0.3); cursor: not-allowed; }

        .comment-cancel-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 2px;
          background: transparent;
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 7px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .comment-cancel-btn:hover { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.3); }

        .comment-reply-box {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .comment-reply-actions { display: flex; gap: 8px; }
        .comment-error {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 1.5px;
          color: #c4001a;
        }

        /* ── Empty comments ── */
        .comments-empty {
          text-align: center;
          padding: 48px 20px;
          background: rgba(0,0,0,0.3);
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .comments-empty-text {
          font-family: 'Anton', sans-serif;
          font-size: 28px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.15);
        }
        .comments-empty-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.1);
          margin-top: 6px;
        }

        /* ── Identity Modal ── */
        .identity-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .identity-modal {
          background: rgba(8,10,24,0.98);
          border: 1px solid rgba(196,0,26,0.5);
          clip-path: polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%);
          padding: 40px;
          width: min(480px, 90vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .identity-modal-header {
          font-family: 'Anton', sans-serif;
          font-size: 36px;
          letter-spacing: 3px;
          color: #fff;
          text-align: center;
        }
        .identity-modal-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.3);
          text-align: center;
          margin-top: -8px;
        }
        .identity-preview {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Anton', sans-serif;
          font-size: 40px;
          color: #fff;
          margin: 8px 0;
          transition: background 0.3s ease;
        }
        .identity-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(196,0,26,0.4);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.18s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          box-sizing: border-box;
        }
        .identity-input:focus { border-color: #c4001a; }
        .identity-input::placeholder { color: rgba(255,255,255,0.2); }
        .identity-hue-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.3);
          align-self: flex-start;
        }
        .identity-hues {
          display: flex;
          gap: 8px;
          align-self: flex-start;
        }
        .identity-hue-swatch {
          width: 28px;
          height: 28px;
          border-radius: 3px;
          cursor: pointer;
          transition: transform 0.15s ease;
          border: 2px solid transparent;
        }
        .identity-hue-swatch:hover { transform: scale(1.2); }
        .identity-hue-swatch.selected {
          border-color: #fff;
          transform: scale(1.2);
        }
        .identity-save-btn {
          width: 100%;
          font-family: 'Anton', sans-serif;
          font-size: 20px;
          letter-spacing: 3px;
          background: #c4001a;
          color: #fff;
          border: none;
          padding: 14px;
          cursor: pointer;
          transition: background 0.18s ease;
          clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          margin-top: 8px;
        }
        .identity-save-btn:hover { background: #e0001f; }
        .identity-save-btn:disabled { background: rgba(196,0,26,0.3); cursor: not-allowed; }

        /* ── Hint ── */
        .post-hint {
          position: fixed;
          bottom: 20px; right: 28px;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif;
          z-index: 50;
          opacity: 0;
          transition: opacity 0.4s ease 0.5s;
          pointer-events: none;
        }
        .post-hint.mounted { opacity: 1; }
        .post-hint-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; letter-spacing: 2px;
          color: rgba(255,255,255,0.2);
        }
        .post-hint-key {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 3px;
          padding: 1px 6px; font-size: 11px;
        }
      `}</style>

      <div className={`post-overlay${mounted ? " mounted" : ""}`}>
        {/* Top bar */}
        <div className="post-topbar">
          <button id="post-back-btn" className="post-back-btn" onClick={() => navigate("/blog")}>
            ← BLOG
          </button>
          <div className="post-breadcrumb">
            <span>BLOG</span>
            <span className="post-breadcrumb-sep">▸</span>
            {series && <><span>{series.title}</span><span className="post-breadcrumb-sep">▸</span></>}
            <span className="post-breadcrumb-current">{post.title.slice(0, 40)}{post.title.length > 40 ? "…" : ""}</span>
          </div>
        </div>

        <div className="post-body" ref={contentRef}>
          <div className="post-article">
            {/* Series banner */}
            {series && (
              <div className="post-series-banner">
                <div>
                  <div className="post-series-label">SERIES</div>
                  <div className="post-series-name">{series.title}</div>
                </div>
                <div className="post-series-chapter">CHAPTER {post.chapterIndex} / {chapters.length}</div>
              </div>
            )}

            {/* Series chapter list */}
            {series && chapters.length > 1 && (
              <div className="post-chapter-nav">
                <div className="post-chapter-nav-title">CHAPTERS IN THIS SERIES</div>
                {chapters.map(ch => (
                  <div
                    key={ch.id}
                    className={`post-chapter-nav-item${ch.id === id ? " current" : ""}`}
                    onClick={() => ch.id !== id && navigate(`/blog/${ch.id}`)}
                  >
                    <span className="pch-num">CH {ch.chapterIndex}</span>
                    <span className="pch-title">{ch.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Post header */}
            <div className="post-title-block">
              <div className="post-title">{post.title}</div>
              <div className="post-meta-row">
                <span className="post-date">{post.date}</span>
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="post-tag"
                    style={{
                      color: `hsl(${tag.charCodeAt(0) * 37 % 360},65%,65%)`,
                      borderColor: `hsl(${tag.charCodeAt(0) * 37 % 360},65%,65%)`,
                    }}
                  >{tag}</span>
                ))}
              </div>
            </div>

            <div className="post-divider" />

            {/* Markdown content */}
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Prev/Next chapter navigation */}
            {series && (prevChapter || nextChapter) && (
              <div className="post-chapter-pagination">
                {prevChapter ? (
                  <div
                    className="post-chapter-nav-btn"
                    onClick={() => navigate(`/blog/${prevChapter.id}`)}
                  >
                    <div className="post-chapter-nav-dir">← PREVIOUS CHAPTER</div>
                    <div className="post-chapter-nav-title">{prevChapter.title}</div>
                  </div>
                ) : <div style={{ flex: 1 }} />}
                {nextChapter && (
                  <div
                    className="post-chapter-nav-btn next"
                    onClick={() => navigate(`/blog/${nextChapter.id}`)}
                  >
                    <div className="post-chapter-nav-dir">NEXT CHAPTER →</div>
                    <div className="post-chapter-nav-title">{nextChapter.title}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments / Thread */}
          <CommentSection postId={post.id} />
        </div>
      </div>

      <div className={`post-hint${mounted ? " mounted" : ""}`}>
        <div className="post-hint-row"><span className="post-hint-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
