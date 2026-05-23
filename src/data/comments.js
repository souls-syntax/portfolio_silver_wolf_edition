// ─── localStorage Comment Store ──────────────────────────────────────────────
// All comments are stored in localStorage under keys like:
//   p3_comments_<postId>  → Comment[]
//   p3_identity           → { username, colorHue }
//
// Comment shape:
// {
//   id:        string  (crypto.randomUUID or Date.now())
//   postId:    string
//   parentId:  string | null  (null = top-level, else thread reply)
//   author:    string
//   colorHue:  number (0–360, persistent per user identity)
//   body:      string
//   timestamp: number (Date.now())
//   reactions: { [emoji]: number }  (count per emoji)
// }
// ─────────────────────────────────────────────────────────────────────────────

const COMMENTS_PREFIX = "p3_comments_";
const IDENTITY_KEY    = "p3_identity";

// ── Identity ──────────────────────────────────────────────────────────────────

export function getIdentity() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function saveIdentity(username, colorHue) {
  const identity = { username, colorHue };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function getComments(postId) {
  try {
    const raw = localStorage.getItem(COMMENTS_PREFIX + postId);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function saveComment(postId, comment) {
  const existing = getComments(postId);
  const newComment = {
    id:        crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    postId,
    parentId:  comment.parentId ?? null,
    author:    comment.author,
    colorHue:  comment.colorHue,
    body:      comment.body,
    timestamp: Date.now(),
    reactions: {},
  };
  existing.push(newComment);
  localStorage.setItem(COMMENTS_PREFIX + postId, JSON.stringify(existing));
  return newComment;
}

export function addReaction(postId, commentId, emoji) {
  const comments = getComments(postId);
  const comment = comments.find(c => c.id === commentId);
  if (!comment) return comments;
  comment.reactions[emoji] = (comment.reactions[emoji] ?? 0) + 1;
  localStorage.setItem(COMMENTS_PREFIX + postId, JSON.stringify(comments));
  return comments;
}

// ── Thread Builder: flat list → tree ─────────────────────────────────────────

export function buildThreadTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.id] = { ...c, children: [] };
  });

  comments.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

// ── Format timestamp ───────────────────────────────────────────────────────

export function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)  return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
