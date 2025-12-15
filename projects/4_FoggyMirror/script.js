const videoElement = document.getElementById('video');
const fogCanvas = document.getElementById('fogCanvas');
const ctx = fogCanvas.getContext('2d');

fogCanvas.width = 640;
fogCanvas.height = 480;

// Flip canvas context to match mirrored video
ctx.translate(fogCanvas.width, 0);
ctx.scale(-1, 1);

// Fill canvas with fog
function fillFog() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
}
fillFog();

// Reset button
document.getElementById('resetBtn').addEventListener('click', fillFog);

// Setup MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// Setup Camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

// Wipe fog with soft, realistic fingertip smudges
function onResults(results) {
  if (!results.multiHandLandmarks) return;

  ctx.globalCompositeOperation = 'destination-out';

  results.multiHandLandmarks.forEach(hand => {
    hand.forEach(point => {
      const x = point.x * fogCanvas.width;
      const y = point.y * fogCanvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.fill();
    });
  });

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
}
