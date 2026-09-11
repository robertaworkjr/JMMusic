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
  // 2. Mouse Move Left-to-Right Frame Scrubber for HeroCentre.mp4
  // Moving mouse from left to right scrubs through frames while staying in section
  // =========================================================================
  const sequenceTrack = document.getElementById('sequenceTrack');
  const heroCentreVideo = document.getElementById('heroCentreVideo');

  if (heroCentreVideo && sequenceTrack) {
    // Ensure video is explicitly paused (never plays automatically)
    heroCentreVideo.pause();
    heroCentreVideo.muted = true;
    heroCentreVideo.defaultMuted = true;

    let targetTime = 0;
    let videoDuration = 10; // Fallback to 10s until metadata resolves

    heroCentreVideo.addEventListener('loadedmetadata', () => {
      if (heroCentreVideo.duration && !isNaN(heroCentreVideo.duration)) {
        videoDuration = heroCentreVideo.duration;
      }
    });

    // Map horizontal mouse position (X) across container to timeline (0.0 to 1.0)
    function handleHorizontalScrub(clientX) {
      const rect = sequenceTrack.getBoundingClientRect();
      const x = clientX - rect.left;
      const progress = Math.max(0, Math.min(1, x / rect.width));
      targetTime = progress * videoDuration;
    }

    sequenceTrack.addEventListener('mousemove', (e) => {
      handleHorizontalScrub(e.clientX);
    });

    sequenceTrack.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleHorizontalScrub(e.touches[0].clientX);
      }
    }, { passive: true });

    // Smooth render loop using requestAnimationFrame
    function renderLoop() {
      if (heroCentreVideo.readyState >= 2) {
        const diff = targetTime - heroCentreVideo.currentTime;
        if (Math.abs(diff) > 0.012) {
          heroCentreVideo.currentTime += diff * 0.35;
        }
      }
      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }

  // =========================================================================
  // 3. Section 5: Mouse Move Frame Scrubber for Extended Sequence Video
  // Moving mouse horizontally across container scrubs static frames
  // =========================================================================
  const placeholderScrubContainer = document.getElementById('placeholderScrubContainer');
  const placeholderScrubVideo = document.getElementById('placeholderScrubVideo');

  if (placeholderScrubVideo && placeholderScrubContainer) {
    // Ensure video is explicitly paused (frames are static until moved)
    placeholderScrubVideo.pause();
    placeholderScrubVideo.muted = true;
    placeholderScrubVideo.defaultMuted = true;

    let targetTimeSec5 = 0;
    let videoDurationSec5 = 20; // Default fallback duration

    placeholderScrubVideo.addEventListener('loadedmetadata', () => {
      if (placeholderScrubVideo.duration && !isNaN(placeholderScrubVideo.duration)) {
        videoDurationSec5 = placeholderScrubVideo.duration;
      }
    });

    function handleSec5Scrub(clientX) {
      const rect = placeholderScrubContainer.getBoundingClientRect();
      const x = clientX - rect.left;
      const progress = Math.max(0, Math.min(1, x / rect.width));
      targetTimeSec5 = progress * videoDurationSec5;
    }

    placeholderScrubContainer.addEventListener('mousemove', (e) => {
      handleSec5Scrub(e.clientX);
    });

    placeholderScrubContainer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleSec5Scrub(e.touches[0].clientX);
      }
    }, { passive: true });

    function renderLoopSec5() {
      if (placeholderScrubVideo.readyState >= 2) {
        const diff = targetTimeSec5 - placeholderScrubVideo.currentTime;
        if (Math.abs(diff) > 0.012) {
          placeholderScrubVideo.currentTime += diff * 0.35;
        }
      }
      requestAnimationFrame(renderLoopSec5);
    }

    requestAnimationFrame(renderLoopSec5);
  }
});
