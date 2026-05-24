/**
 * blogCache.js — singleton in-memory cache for /api/blogs
 *
 * • First call kicks off the network request.
 * • Every subsequent call (from any component) gets the same Promise — no re-fetch.
 * • Back-navigating to /blog or opening a post is instant because data is already resolved.
 * • Cache is intentionally NOT reset on navigation (lives for the full session).
 */

let _promise = null;
let _data    = null; // { blogs: [], series: [] }

/** Kick off the fetch without waiting for the result (fire-and-forget prefetch). */
export function prefetchBlogs() {
  if (_promise) return; // already in-flight or resolved
  _promise = fetch('/api/blogs')
    .then(res => {
      if (!res.ok) throw new Error(`/api/blogs ${res.status}`);
      return res.json();
    })
    .then(data => {
      _data = {
        blogs:  Array.isArray(data.blogs)  ? data.blogs  : [],
        series: Array.isArray(data.series) ? data.series : [],
      };
      return _data;
    })
    .catch(err => {
      // On error, reset so a retry is possible (e.g. user refreshes or navigates again)
      _promise = null;
      throw err;
    });
}

/**
 * Returns a Promise<{ blogs, series }>.
 * Safe to call from multiple components simultaneously — only one fetch is ever made.
 */
export function getBlogs() {
  prefetchBlogs(); // no-op if already in-flight
  return _promise;
}

/** Synchronously return cached data if already resolved, otherwise null. */
export function getCachedBlogs() {
  return _data;
}

/** Call after a write (POST / DELETE) to bust the cache so next getBlogs() re-fetches. */
export function invalidateBlogCache() {
  _promise = null;
  _data    = null;
}
