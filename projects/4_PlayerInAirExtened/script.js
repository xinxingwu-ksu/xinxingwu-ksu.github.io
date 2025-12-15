const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('canvas');
const ctx = canvasElement.getContext('2d');

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

const media = document.createElement('video');
media.src = 'cs.mp4';
media.loop = true;
media.muted = false;
media.playsInline = true;
media.style.display = 'none';
document.body.appendChild(media);

let videoReady = false;
media.onloadeddata = () => {
  videoReady = true;
  media.play();
  isPlaying = true;
};

let mediaX = canvasElement.width / 2;
let mediaY = canvasElement.height / 2;
let scale = 1;
let rotation = 0;
let showLandmarks = true;
let showVideo = true;
let isPlaying = false;
let freezeVideoControl = false;
let handsStillStart = null;
let lastHandPositions = [];
let controlReleased = false;
let lastDistance = null;
let lastAngle = null;
let lastScrollY = null;

const toggleBtn = document.getElementById('toggleBtn');
const videoToggleBtn = document.getElementById('videoToggleBtn');
const resetBtn = document.getElementById('resetBtn');
const scheduleBtn = document.getElementById('scheduleBtn');
const volumeTrigger = document.getElementById('volumeTrigger');
const volumeBarContainer = document.getElementById('volumeBarContainer');
const volumeBar = document.getElementById('volumeBar');
const termScheduleContainer = document.getElementById('termScheduleContainer');

resetBtn.onclick = () => {
  mediaX = canvasElement.width / 2;
  mediaY = canvasElement.height / 2;
  scale = 1;
  rotation = 0;
  showVideo = false;
  videoToggleBtn.textContent = '🎥 Show Video';
  media.pause();
  isPlaying = false;
};

toggleBtn.onclick = () => {
  showLandmarks = !showLandmarks;
  toggleBtn.textContent = showLandmarks ? '🖐 Show Landmarks' : '🖐 Hide Landmarks';
};

videoToggleBtn.onclick = () => {
  showVideo = !showVideo;
  videoToggleBtn.textContent = showVideo ? '🎥 Hide Video' : '🎥 Show Video';
  if (showVideo) {
    media.style.opacity = 1;
    media.play();
    isPlaying = true;
  } else {
    let fade = 1;
    const fadeOut = setInterval(() => {
      fade -= 0.1;
      media.style.opacity = fade;
      if (fade <= 0) {
        media.pause();
        isPlaying = false;
        clearInterval(fadeOut);
      }
    }, 50);
  }
};

scheduleBtn.onclick = () => {
  const visible = termScheduleContainer.style.display === 'block';
  termScheduleContainer.style.display = visible ? 'none' : 'block';
  scheduleBtn.textContent = visible ? '🗓 Show Schedule' : '🗓 Hide Schedule';
};

const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => await hands.send({ image: videoElement }),
  width: 640,
  height: 480
});
camera.start();

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}
function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

let lastClickTime = 0;
function simulateClick(element) {
  if (Date.now() - lastClickTime < 800) return;
  element.click();
  lastClickTime = Date.now();
}

function onResults(results) {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
  ctx.restore();

  const handsDetected = results.multiHandLandmarks;
  volumeTrigger.style.display = 'none';

  if (handsDetected.length >= 1) {
    const hand = handsDetected[0];
    const indexTip = hand[8];
    const screenIndex = {
      x: (1 - indexTip.x) * canvasElement.width,
      y: indexTip.y * canvasElement.height
    };

    // Click buttons
    [toggleBtn, resetBtn, scheduleBtn, videoToggleBtn].forEach(btn => {
      const box = btn.getBoundingClientRect();
      if (
        screenIndex.x >= box.left &&
        screenIndex.x <= box.right &&
        screenIndex.y >= box.top &&
        screenIndex.y <= box.bottom
      ) {
        simulateClick(btn);
      }
    });

    // Volume control
    const bar = volumeBarContainer.getBoundingClientRect();
    if (
      screenIndex.x >= bar.left &&
      screenIndex.x <= bar.right &&
      screenIndex.y >= bar.top - 10 &&
      screenIndex.y <= bar.bottom + 10
    ) {
      volumeTrigger.style.display = 'block';
      volumeTrigger.style.left = `${screenIndex.x - 10}px`;
      volumeTrigger.style.top = `${screenIndex.y - 10}px`;
      const volume = (screenIndex.x - bar.left) / bar.width;
      const clamped = Math.min(1, Math.max(0, volume));
      media.volume = clamped;
      volumeBar.style.width = `${clamped * 100}%`;
    }

    // Video play/pause region
    const videoRegion = {
      left: mediaX - (media.videoWidth * scale) / 2,
      right: mediaX + (media.videoWidth * scale) / 2,
      top: mediaY - (media.videoHeight * scale) / 2,
      bottom: mediaY + (media.videoHeight * scale) / 2
    };
    if (
      screenIndex.x >= videoRegion.left &&
      screenIndex.x <= videoRegion.right &&
      screenIndex.y >= videoRegion.top &&
      screenIndex.y <= videoRegion.bottom &&
      !media.clickedRecently
    ) {
      media.clickedRecently = true;
      isPlaying ? media.pause() : media.play();
      isPlaying = !isPlaying;
      setTimeout(() => (media.clickedRecently = false), 1000);
    }

    // ✅ Scroll Schedule if visible
    if (termScheduleContainer.style.display === 'block') {
      const scheduleBox = termScheduleContainer.getBoundingClientRect();
      if (
        screenIndex.x >= scheduleBox.left &&
        screenIndex.x <= scheduleBox.right &&
        screenIndex.y >= scheduleBox.top &&
        screenIndex.y <= scheduleBox.bottom
      ) {
        if (lastScrollY != null) {
          const dy = screenIndex.y - lastScrollY;
          termScheduleContainer.scrollTop += dy * 2;
        }
        lastScrollY = screenIndex.y;
      } else {
        lastScrollY = null;
      }
    }
  }

  if (handsDetected.length === 2) {
    const hand1 = handsDetected[0];
    const hand2 = handsDetected[1];
    const p1 = midpoint(hand1[4], hand1[8]);
    const p2 = midpoint(hand2[4], hand2[8]);
    const screenP1 = { x: (1 - p1.x) * canvasElement.width, y: p1.y * canvasElement.height };
    const screenP2 = { x: (1 - p2.x) * canvasElement.width, y: p2.y * canvasElement.height };
    const mid = { x: (screenP1.x + screenP2.x) / 2, y: (screenP1.y + screenP2.y) / 2 };
    const movement = lastHandPositions.length
      ? Math.hypot(mid.x - lastHandPositions[0].x, mid.y - lastHandPositions[0].y)
      : 0;

    lastHandPositions.unshift(mid);
    if (lastHandPositions.length > 5) lastHandPositions.pop();

    if (movement < 10) {
      if (!handsStillStart) handsStillStart = Date.now();
      else if (Date.now() - handsStillStart > 3000 && !freezeVideoControl) {
        freezeVideoControl = true;
        controlReleased = true;
        lastDistance = null;
        lastAngle = null;
      }
    } else {
      handsStillStart = null;
    }

    if (!freezeVideoControl) {
      controlReleased = false;
      if (isPlaying) {
        media.pause();
        isPlaying = false;
      }

      const currentDistance = distanceBetween(screenP1, screenP2);
      const currentAngle = angleBetween(screenP1, screenP2);

      if (lastDistance && lastAngle != null) {
        const distanceChange = currentDistance / lastDistance;
        if (Math.abs(distanceChange - 1) > 0.02) scale *= distanceChange;

        const angleChange = currentAngle - lastAngle;
        if (Math.abs(angleChange) > 0.01) rotation += angleChange;
      }

      lastDistance = currentDistance;
      lastAngle = currentAngle;

      mediaX = mid.x;
      mediaY = mid.y;

      if (media.videoWidth > 0) {
        scale = Math.abs(screenP2.x - screenP1.x) / media.videoWidth;
      }
    }
  } else if (controlReleased) {
    freezeVideoControl = false;
    lastDistance = null;
    lastAngle = null;
  }

  if (showVideo && videoReady) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.translate(mediaX, mediaY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    if (media.videoWidth > 0 && media.videoHeight > 0) {
      ctx.drawImage(media, -media.videoWidth / 2, -media.videoHeight / 2);
    }
    ctx.restore();
  }

  // Draw landmarks
  for (const landmarks of handsDetected) {
    const mirrored = landmarks.map(pt => ({ ...pt, x: 1 - pt.x }));
    if (showLandmarks) {
      drawConnectors(ctx, mirrored, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(ctx, mirrored, { color: '#FF0000', lineWidth: 2 });
    }
  }
}
