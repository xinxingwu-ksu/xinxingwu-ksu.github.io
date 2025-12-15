const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('canvas');
const ctx = canvasElement.getContext('2d');

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let img = new Image();
img.src = 'midwaylogo.png';

// Image position, scale, and rotation
let imgX = canvasElement.width / 2;
let imgY = canvasElement.height / 2;
let scale = 1;
let rotation = 0;

// Store last distance and angle between hands
let lastDistance = null;
let lastAngle = null;

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

// === Utility Functions ===
function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// === Main Handler ===
function onResults(results) {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw mirrored video feed
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
  ctx.restore();

  const handsDetected = results.multiHandLandmarks;

  for (const landmarks of handsDetected) {
    const mirroredLandmarks = landmarks.map(pt => ({
      ...pt,
      x: 1 - pt.x
    }));

    drawConnectors(ctx, mirroredLandmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(ctx, mirroredLandmarks, { color: '#FF0000', lineWidth: 2 });
  }

  if (handsDetected.length === 2) {
    // Get middle point between thumb and index of each hand
    const hand1 = handsDetected[0];
    const hand2 = handsDetected[1];

    const p1 = midpoint(hand1[4], hand1[8]);
    const p2 = midpoint(hand2[4], hand2[8]);

    // Convert to screen coordinates (mirrored x)
    const screenP1 = {
      x: (1 - p1.x) * canvasElement.width,
      y: p1.y * canvasElement.height
    };
    const screenP2 = {
      x: (1 - p2.x) * canvasElement.width,
      y: p2.y * canvasElement.height
    };

    // Midpoint, distance, and angle between two hands
    const mid = {
      x: (screenP1.x + screenP2.x) / 2,
      y: (screenP1.y + screenP2.y) / 2
    };
    const currentDistance = distanceBetween(screenP1, screenP2);
    const currentAngle = angleBetween(screenP1, screenP2);

    // Update scale and rotation
    if (lastDistance && lastAngle != null) {
      scale *= currentDistance / lastDistance;
      rotation += currentAngle - lastAngle;
    }

    lastDistance = currentDistance;
    lastAngle = currentAngle;

    // Update position
    imgX = mid.x;
    imgY = mid.y;

  }

  // Draw the image
  ctx.save();
  ctx.translate(imgX, imgY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}
