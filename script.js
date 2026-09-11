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
  // 2. Interactive Frame Scrubber Engine
  // Moving mouse horizontally left-to-right across track scrubs video frames
  // =========================================================================
  function initFrameScrubber(trackId, videoId, defaultDuration) {
    const track = document.getElementById(trackId);
    const video = document.getElementById(videoId);

    if (!track || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.pause();

    let videoDuration = defaultDuration || 10;
    let targetTime = 0;
    let isSeeking = false;

    const onMeta = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        videoDuration = video.duration;
      }
      try {
        video.currentTime = 0.001;
      } catch (_) {}
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    video.addEventListener('canplay', onMeta);

    if (video.readyState >= 1) {
      onMeta();
    }

    function handleScrub(clientX) {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const progress = Math.max(0, Math.min(1, x / rect.width));
      targetTime = progress * videoDuration;
    }

    track.addEventListener('mousemove', (e) => {
      handleScrub(e.clientX);
    });

    track.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleScrub(e.touches[0].clientX);
      }
    }, { passive: true });

    track.addEventListener('click', (e) => {
      handleScrub(e.clientX);
    });

    video.addEventListener('seeking', () => {
      isSeeking = true;
    });

    video.addEventListener('seeked', () => {
      isSeeking = false;
    });

    function renderLoop() {
      if (!isSeeking && (video.readyState >= 1 || video.duration > 0)) {
        const diff = targetTime - video.currentTime;
        if (Math.abs(diff) > 0.02) {
          try {
            video.currentTime += diff * 0.4;
          } catch (_) {}
        }
      }
      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }

  // Section 3: HeroCentre video frame scrubber
  initFrameScrubber('sequenceTrack', 'heroCentreVideo', 10);

  // Section 5: HeroDistanceCombined extended sequence scrubber
  initFrameScrubber('sequenceTrack2', 'placeholderScrubVideo', 30);
});
