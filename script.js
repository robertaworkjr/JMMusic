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
  // 2. Solid, Non-Shimmering Frame Scrubber Engine
  // - Snaps directly to discrete 24fps presentation frames
  // - Halts seeking completely when mouse is stationary (eliminates shimmering/flicker)
  // - Responds instantly and cleanly to horizontal mouse movements
  // =========================================================================
  function initFrameScrubber(trackId, videoId, fps = 24) {
    const track = document.getElementById(trackId);
    const video = document.getElementById(videoId);

    if (!track || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.pause();

    let totalFrames = 240; // 10s @ 24fps default
    let currentFrame = -1;
    let targetFrame = 0;
    let rafScheduled = false;

    const computeFrames = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        totalFrames = Math.max(1, Math.round(video.duration * fps));
      }
      if (currentFrame === -1) {
        currentFrame = 0;
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

    function applySeek() {
      rafScheduled = false;
      if (targetFrame !== currentFrame && (video.readyState >= 1 || video.duration > 0)) {
        currentFrame = targetFrame;
        try {
          // Seek directly to exact frame timestamp
          video.currentTime = currentFrame / fps;
        } catch (_) {}
      }
    }

    function handlePointerScrub(clientX) {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const progress = Math.max(0, Math.min(1, x / rect.width));
      const nextFrame = Math.min(totalFrames - 1, Math.max(0, Math.round(progress * (totalFrames - 1))));

      if (nextFrame !== targetFrame) {
        targetFrame = nextFrame;
        if (!rafScheduled) {
          rafScheduled = true;
          requestAnimationFrame(applySeek);
        }
      }
    }

    track.addEventListener('mousemove', (e) => {
      handlePointerScrub(e.clientX);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerScrub(e.touches[0].clientX);
      }
    }, { passive: true });

    track.addEventListener('click', (e) => {
      handlePointerScrub(e.clientX);
    });
  }

  // Section 3: HeroCentre video frame scrubber (woman moving with mouse action)
  initFrameScrubber('sequenceTrack', 'heroCentreVideo', 24);
});
