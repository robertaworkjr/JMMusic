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
  // 2. Silky-Smooth Inertia Frame Scrubber Engine
  // - Interpolates mouse movement with smooth inertia to eliminate micro-jitter
  // - Snaps cleanly to discrete 24fps frames
  // - Automatically halts all seeking when stationary to prevent any shimmering
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
    let targetProgress = 0;
    let currentProgress = 0;
    let currentRenderedFrame = -1;
    let isMoving = false;
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

    function renderStep() {
      if (!isMoving) {
        rafActive = false;
        return;
      }

      const diff = targetProgress - currentProgress;

      if (Math.abs(diff) > 0.0008) {
        // Smooth cinematic glide (0.24 gives a tactile, responsive feel without jitter)
        currentProgress += diff * 0.24;
        const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(currentProgress * (totalFrames - 1))));

        if (frameIndex !== currentRenderedFrame && (video.readyState >= 1 || video.duration > 0)) {
          currentRenderedFrame = frameIndex;
          try {
            video.currentTime = currentRenderedFrame / fps;
          } catch (_) {}
        }
        requestAnimationFrame(renderStep);
      } else {
        // Settle completely onto final target frame - halt all seeking
        currentProgress = targetProgress;
        const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(currentProgress * (totalFrames - 1))));
        if (frameIndex !== currentRenderedFrame && (video.readyState >= 1 || video.duration > 0)) {
          currentRenderedFrame = frameIndex;
          try {
            video.currentTime = currentRenderedFrame / fps;
          } catch (_) {}
        }
        isMoving = false;
        rafActive = false;
      }
    }

    function onPointerMove(clientX) {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      targetProgress = Math.max(0, Math.min(1, x / rect.width));

      if (!isMoving) {
        isMoving = true;
        if (!rafActive) {
          rafActive = true;
          requestAnimationFrame(renderStep);
        }
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
