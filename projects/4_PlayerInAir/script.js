// Hand-controlled MP4 drawn onto a canvas with play/pause via index-thumb pinch
const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('canvas');
const overlayEl = document.getElementById('unmuteOverlay');
const unmuteBtn = document.getElementById('unmuteBtn');
const mediaVideo = document.getElementById('mediaVideo'); // present in DOM for reliable audio on iOS
const ctx = canvasElement.getContext('2d');

function resizeCanvas(){
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// === Your MP4 video ===
// Put a file named 'midwayvideo.mp4' next to this script (same folder as index.html)
mediaVideo.src = 'midwayvideo.mp4';
mediaVideo.loop = true;
// Start muted so we can autoplay the first frame; we'll unmute after a user gesture.
mediaVideo.muted = true;
mediaVideo.playsInline = true;

let videoReady = false;
mediaVideo.addEventListener('loadeddata', () => {
  videoReady = true;
  // Try to start muted so frames render in canvas immediately.
  mediaVideo.play().catch(()=>{});
});
mediaVideo.addEventListener('error', (e) => {
  console.error('Error loading video:', e);
});

// === Unlock audio with a real user gesture ===
let audioUnlocked = false;
async function unlockAudio(){
  if (audioUnlocked) return;
  try{
    // Some browsers need a pause->unmute->play sequence in the same user gesture.
    mediaVideo.pause();
    mediaVideo.muted = false;
    mediaVideo.volume = 1.0;
    await mediaVideo.play();
    audioUnlocked = true;
    overlayEl.style.display = 'none';
  }catch(e){
    console.warn('Audio unlock failed, try again:', e);
  }
}
// Click or touch on overlay button
unmuteBtn.addEventListener('click', unlockAudio);
unmuteBtn.addEventListener('touchend', unlockAudio);
// Also allow clicking anywhere
document.addEventListener('pointerdown', unlockAudio, { once: true });

// --- Position/transform for the MP4 on the canvas ---
const VIDEO_ALPHA = 0.85; // 1.0 = opaque, lower = more transparent
let vidX = canvasElement.width / 2;
let vidY = canvasElement.height / 2;
let baseScale = 0.6;   // video width takes ~60% of canvas width
let currentScale = 1;
let rotation = 0;

// Optional two-hand transform helpers
let lastDistance = null;
let lastAngle = null;

// === MediaPipe Hands setup ===
const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => { await hands.send({ image: videoElement }); },
  width: 640,
  height: 480
});
camera.start();

// --- Utilities ---
function normalizedDistance(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
function angleBetween(a, b){ return Math.atan2(b.y - a.y, b.x - a.x); }

// Toggle play/pause on pinch (index tip close to thumb tip)
let pinchDown = false;
let lastToggleTime = 0;
const TOGGLE_COOLDOWN = 600; // ms

function onResults(results){
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw mirrored camera feed as background
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
  ctx.restore();

  const handsDetected = results.multiHandLandmarks || [];

  // Draw landmarks (mirrored)
  for (const lm of handsDetected){
    const mirrored = lm.map(p => ({ ...p, x: 1 - p.x }));
    drawConnectors(ctx, mirrored, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(ctx, mirrored, { color: '#FF0000', lineWidth: 2 });
  }

  // Gesture: pinch to toggle play/pause
  if (handsDetected.length > 0){
    const lm = handsDetected[0];
    const d = normalizedDistance(lm[8], lm[4]); // index tip (8) & thumb tip (4)
    const now = performance.now();

    if (d < 0.05 && !pinchDown){
      pinchDown = true;
      if (now - lastToggleTime > TOGGLE_COOLDOWN){
        if (mediaVideo.paused) {
          mediaVideo.play().catch(()=>{});
        } else {
          mediaVideo.pause();
        }
        lastToggleTime = now;
      }
    } else if (d >= 0.07 && pinchDown){
      pinchDown = false; // require release before next toggle
    }
  } else {
    pinchDown = false;
  }

  // Optional: two-hand move/scale/rotate (using pinch midpoints)
  if (handsDetected.length === 2){
    const h1 = handsDetected[0], h2 = handsDetected[1];
    // Midpoints between thumb & index for each hand
    const p1 = { x: (h1[4].x + h1[8].x)/2, y: (h1[4].y + h1[8].y)/2 };
    const p2 = { x: (h2[4].x + h2[8].x)/2, y: (h2[4].y + h2[8].y)/2 };
    // Mirror X
    const m1 = { x: (1 - p1.x) * canvasElement.width, y: p1.y * canvasElement.height };
    const m2 = { x: (1 - p2.x) * canvasElement.width, y: p2.y * canvasElement.height };

    const mid = { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 };
    const dist = Math.hypot(m2.x - m1.x, m2.y - m1.y);
    const ang  = angleBetween(m1, m2);

    if (lastDistance != null && lastAngle != null){
      currentScale *= dist / lastDistance;
      rotation += ang - lastAngle;
    }
    lastDistance = dist;
    lastAngle = ang;
    vidX = mid.x;
    vidY = mid.y;
  } else {
    lastDistance = null;
    lastAngle = null;
  }

  // Draw the MP4 onto the canvas when ready
  if (videoReady && mediaVideo.videoWidth > 0 && mediaVideo.videoHeight > 0){
    const targetW = canvasElement.width * baseScale;
    const scaleToTarget = targetW / mediaVideo.videoWidth;

    ctx.save();
    ctx.globalAlpha = VIDEO_ALPHA;
    ctx.translate(vidX, vidY);
    ctx.rotate(rotation);
    ctx.scale(scaleToTarget * currentScale, scaleToTarget * currentScale);
    ctx.drawImage(mediaVideo, -mediaVideo.videoWidth/2, -mediaVideo.videoHeight/2);
    ctx.restore();
  } else {
    // Helpful loading text
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Loading video... (make sure midwayvideo.mp4 is in the same folder)', 16, 28);
  }
}
