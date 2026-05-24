import connectToDatabase from './utils/db.js';
import Blog from './models/Blog.js';
import Series from './models/Series.js';

// ── In-memory cache ──────────────────────────────────────────────────────────
// Populated on first GET, invalidated on POST.
// For production you'd replace this with Redis/Vercel KV.
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    // Serve from cache if fresh
    if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) {
      return res.status(200).json(_cache);
    }

    try {
      await connectToDatabase();
      const [blogs, series] = await Promise.all([
        Blog.find({}).sort({ date: -1 }).lean(),
        Series.find({}).lean(),
      ]);

      _cache = { blogs, series, cachedAt: Date.now() };
      _cacheTime = Date.now();

      return res.status(200).json(_cache);
    } catch (error) {
      console.error('[/api/blogs GET]', error);
      return res.status(500).json({
        error: 'Failed to fetch blogs',
        details: error.message,
      });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (authHeader !== `Bearer ${adminPassword}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      await connectToDatabase();
      const newBlog = new Blog(req.body);
      await newBlog.save();

      // Bust the cache so the next GET returns fresh data
      _cache = null;
      _cacheTime = 0;

      return res.status(201).json(newBlog);
    } catch (error) {
      console.error('[/api/blogs POST]', error);
      return res.status(500).json({
        error: 'Failed to create blog',
        details: error.message,
      });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (authHeader !== `Bearer ${adminPassword}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing blog id' });
    }

    try {
      await connectToDatabase();
      const deletedBlog = await Blog.findOneAndDelete({ id });
      
      if (!deletedBlog) {
        return res.status(404).json({ error: 'Blog not found' });
      }

      // Bust the cache so the next GET returns fresh data
      _cache = null;
      _cacheTime = 0;

      return res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
      console.error('[/api/blogs DELETE]', error);
      return res.status(500).json({
        error: 'Failed to delete blog',
        details: error.message,
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
