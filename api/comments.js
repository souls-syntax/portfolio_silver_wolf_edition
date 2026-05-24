import connectToDatabase from './utils/db.js';
import Comment from './models/Comment.js';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
  } catch (error) {
    console.error('[/api/comments] DB connect error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: 'postId query param is required' });
    }
    try {
      const comments = await Comment.find({ postId }).sort({ timestamp: 1 }).lean();
      return res.status(200).json(comments);
    } catch (error) {
      console.error('[/api/comments GET]', error);
      return res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
    }
  }

  // ── POST (new comment) ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { postId, parentId, author, colorHue, body } = req.body;
      if (!postId || !author || !body) {
        return res.status(400).json({ error: 'postId, author, and body are required' });
      }
      const newComment = new Comment({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        postId,
        parentId: parentId || null,
        author,
        colorHue: colorHue ?? 0,
        body,
        timestamp: Date.now(),
        reactions: {},
      });
      await newComment.save();
      const comments = await Comment.find({ postId }).sort({ timestamp: 1 }).lean();
      return res.status(201).json(comments);
    } catch (error) {
      console.error('[/api/comments POST]', error);
      return res.status(500).json({ error: 'Failed to create comment', details: error.message });
    }
  }

  // ── PUT (add reaction) ────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    try {
      const { commentId, emoji } = req.body;
      if (!commentId || !emoji) {
        return res.status(400).json({ error: 'commentId and emoji are required' });
      }
      const comment = await Comment.findOne({ id: commentId });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      const current = comment.reactions.get(emoji) || 0;
      comment.reactions.set(emoji, current + 1);
      await comment.save();
      const comments = await Comment.find({ postId: comment.postId }).sort({ timestamp: 1 }).lean();
      return res.status(200).json(comments);
    } catch (error) {
      console.error('[/api/comments PUT]', error);
      return res.status(500).json({ error: 'Failed to add reaction', details: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
