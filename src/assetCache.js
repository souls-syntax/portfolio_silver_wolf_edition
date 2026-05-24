/**
 * Utility to manage prefetching and caching of heavy assets.
 */

const CACHE_NAME = 'persona3-assets-cache';

/**
 * Prefetches a list of image URLs using the browser's Image constructor.
 * This stores them in the browser's standard HTTP cache (disk/memory).
 */
export function prefetchImages(urls) {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  });
}

/**
 * Prefetches and stores a large file (like a video) directly in the Cache Storage API
 * so it can be loaded instantly as a local Object URL.
 */
export async function prefetchVideo(url) {
  if (typeof window === 'undefined' || !window.caches) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(url);
    if (!match) {
      // Fetch and store in Cache Storage
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    }
  } catch (err) {
    console.error('Failed to prefetch/cache video:', url, err);
  }
}
