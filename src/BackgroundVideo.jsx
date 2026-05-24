import { useState, useEffect } from 'react';
import staticBg from './assets/static_background.png';

export default function BackgroundVideo({ src, className, style, containerStyle }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let localUrl = null;

    async function loadVideo() {
      if (!window.caches) {
        if (active) setVideoSrc(src);
        return;
      }

      try {
        const cache = await caches.open('persona3-assets-cache');
        const match = await cache.match(src);
        
        if (match) {
          const blob = await match.blob();
          localUrl = URL.createObjectURL(blob);
          if (active) setVideoSrc(localUrl);
        } else {
          // If not cached, fetch it, save it, and play it
          const response = await fetch(src);
          if (!response.ok) throw new Error(`Video fetch failed: ${response.status}`);
          
          const clone = response.clone();
          const blob = await response.blob();
          localUrl = URL.createObjectURL(blob);
          
          if (active) setVideoSrc(localUrl);
          
          try {
            await cache.put(src, clone);
          } catch (e) {
            console.error('Failed to put video in cache:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching/caching video, fallback to direct url:', err);
        if (active) setVideoSrc(src);
      }
    }

    loadVideo();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [src]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, ...containerStyle }}>
      {/* Static Background Image */}
      <img
        src={staticBg}
        alt="background fallback"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          filter: style?.filter || 'blur(10px) brightness(0.4) saturate(1.2)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.8s ease',
        }}
      />
      {/* Video Element */}
      {videoSrc && (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onPlay={() => setIsLoaded(true)}
          className={className}
          style={{
            ...style,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      )}
    </div>
  );
}
