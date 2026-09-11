/**
 * JM MUSIC — Interactive Media & Scroll Video Controller
 * - Handles ambient looping hero background video
 * - Scroll-driven frame scrubber for HeroCentre.mp4 (only moves when scrolled)
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. Ambient Hero Background Video (Loops continuously)
  // =========================================================================
  const bgVideo = document.getElementById('bgVideo');

  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.defaultMuted = true;

    const startPlayback = () => {
      bgVideo.play().catch(() => {
        const resumePlayback = () => {
          bgVideo.play();
          document.removeEventListener('click', resumePlayback);
          document.removeEventListener('touchstart', resumePlayback);
        };
        document.addEventListener('click', resumePlayback, { once: true });
        document.addEventListener('touchstart', resumePlayback, { once: true });
      });
    };

    startPlayback();

    bgVideo.addEventListener('ended', () => {
      bgVideo.currentTime = 0;
      bgVideo.play().catch(() => {});
    });
  }

  // =========================================================================
  // 2. Instant 1:1 Zero-Delay Frame Scrubber Engine
  // - Direct 1:1 cursor-to-frame tracking with zero lag/inertia delay
  // - Snaps directly to exact 24fps frames
  // - Batches via requestAnimationFrame to eliminate pointer jitter
  // - Halts seeking completely when stationary to guarantee zero shimmer
  // =========================================================================
  function initFrameScrubber(trackId, videoId, fps = 24) {
    const track = document.getElementById(trackId);
    const video = document.getElementById(videoId);

    if (!track || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.pause();

    let totalFrames = 240; // 10s @ 24fps
    let currentRenderedFrame = -1;
    let targetProgress = 0;
    let rafActive = false;

    const computeFrames = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        totalFrames = Math.max(1, Math.round(video.duration * fps));
      }
      if (currentRenderedFrame === -1) {
        currentRenderedFrame = 0;
        try {
          video.currentTime = 0.001;
        } catch (_) {}
      }
    };

    video.addEventListener('loadedmetadata', computeFrames);
    video.addEventListener('durationchange', computeFrames);
    video.addEventListener('canplay', computeFrames);

    if (video.readyState >= 1) {
      computeFrames();
    }

    function renderFrame() {
      rafActive = false;
      const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(targetProgress * (totalFrames - 1))));

      if (frameIndex !== currentRenderedFrame && (video.readyState >= 1 || video.duration > 0)) {
        currentRenderedFrame = frameIndex;
        try {
          // Direct 1:1 seek to exact frame timestamp with zero delay
          video.currentTime = currentRenderedFrame / fps;
        } catch (_) {}
      }
    }

    function onPointerMove(clientX) {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      targetProgress = Math.max(0, Math.min(1, x / rect.width));

      if (!rafActive) {
        rafActive = true;
        requestAnimationFrame(renderFrame);
      }
    }

    track.addEventListener('mousemove', (e) => {
      onPointerMove(e.clientX);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX);
      }
    }, { passive: true });

    track.addEventListener('click', (e) => {
      onPointerMove(e.clientX);
    });
  }

  // Section 3: HeroCentre video frame scrubber (woman moving with mouse action)
  initFrameScrubber('sequenceTrack', 'heroCentreVideo', 24);
});
