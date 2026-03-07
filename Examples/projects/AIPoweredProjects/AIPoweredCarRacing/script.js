// script.js

// ─── CONSTANTS & GLOBALS ───────────────────────────────────────────────────
const REGION_W        = 420;
const REGION_H        = 500;
const SCROLL_SPEED    = 3;
const SMOOTH_ALPHA    = 0.8;
const DEAD_ZONE       = 2;
const OB_SPAWN_FRAMES = 80;

// Road edges inside the 420px board
const ROAD_LEFT   = 70;
const ROAD_RIGHT  = REGION_W - 80;  // 420 - 80 = 340

let roadImg, roadY = 0;
let myGamePiece = null;
let latestLm    = null;
let frameCount  = 0;
let obstacles   = [];
let score       = 0;
let gameOver    = false;
let resetBtn    = null;

// Bone pairs for drawing landmarks
const BONES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20]
];

// ─── 1) INITIAL SETUP ───────────────────────────────────────────────────────
// Called once on load to set up canvas, camera, and start the render loop.
function init() {
  // preload road texture
  roadImg = new Image();
  roadImg.src = 'map1.png';

  // set up canvas
  myGameArea.start();

  // set up MediaPipe hands + camera
  initHands();

  // kick off first game state
  startGame();
}

const myGameArea = {
  canvas: document.createElement('canvas'),
  start() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', () => {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
    // begin the render loop
    requestAnimationFrame(updateGameArea);
  },
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
};

// ─── 2) RESETTING STATE ─────────────────────────────────────────────────────
function startGame() {
  // reset scroll
  roadY = 0;

  // create/reset car sprite
  myGamePiece = {
    width: 40,
    height: 70,
    x: (REGION_W - 40) / 2,
    y: REGION_H - 70 - 10,
    image: new Image()
  };
  myGamePiece.image.src = 'car6.png';

  // remove old Reset button
  if (resetBtn) {
    document.body.removeChild(resetBtn);
    resetBtn = null;
  }

  // reset game variables
  frameCount = 0;
  obstacles.length = 0;
  score = 0;
  gameOver = false;
}

// ─── 3) MAIN RENDER LOOP ───────────────────────────────────────────────────
function updateGameArea() {
  const ctx = myGameArea.ctx;
  const cw  = myGameArea.canvas.width;
  const ch  = myGameArea.canvas.height;
  const regionX = cw - REGION_W;
  const regionY = 0;

  myGameArea.clear();

  // 1) mirrored camera full‑screen
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, -cw, 0, cw, ch);
  ctx.restore();

  // 2) scrolling road (only when running)
  if (!gameOver) {
    roadY = (roadY + SCROLL_SPEED) % REGION_H;
  }
  ctx.globalAlpha = 0.5;
  for (let y = -REGION_H + roadY; y < REGION_H * 2; y += REGION_H) {
    ctx.drawImage(roadImg, regionX, regionY + y, REGION_W, REGION_H);
  }
  ctx.globalAlpha = 1.0;

  // 3) spawn & update obstacles if running
  if (!gameOver) {
    frameCount++;
    if (frameCount % OB_SPAWN_FRAMES === 0) {
      spawnObstacle(regionX, regionY);
    }
    updateObstacles(regionX, regionY);
    // smooth car follow
    if (latestLm) updateCarPosition();
  }

  // 4) draw car
  ctx.drawImage(
    myGamePiece.image,
    regionX + myGamePiece.x,
    regionY + myGamePiece.y,
    myGamePiece.width, myGamePiece.height
  );

  // 5) draw score
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Score: ${score}`, regionX + 10, regionY + 30);

  // 6) if game over, overlay text and show reset
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over',
      regionX + (REGION_W/2 - 120),
      regionY + (REGION_H/2)
    );
    ctx.font = '32px sans-serif';
    ctx.fillText(`Final Score: ${score}`,
      regionX + (REGION_W/2 - 130),
      regionY + (REGION_H/2 + 50)
    );
    if (!resetBtn) createResetButton(regionX,regionY);
  }

  // 7) always draw hand landmarks
  drawHandLandmarks(cw, ch);

  // loop forever
  requestAnimationFrame(updateGameArea);
}

// ─── 4) OBSTACLES & CAR HELPERS ─────────────────────────────────────────────
function spawnObstacle(regionX, regionY) {
  const type = Math.floor(Math.random() * 7) + 1;
  let imgSrc, w, h;
  switch (type) {
    case 1: imgSrc="car1.png";      w=40; h=70; break;
    case 2: imgSrc="car2.png";      w=40; h=70; break;
    case 3: imgSrc="car3.png";      w=40; h=70; break;
    case 4: imgSrc="car4.png";      w=40; h=70; break;
    case 5: imgSrc="car5.png";      w=40; h=70; break;
    case 6: imgSrc="barrel.png";    w=50; h=50; break;
    case 7: imgSrc="roadblock.png"; w=50; h=50; break;
  }
  const minX = regionX + ROAD_LEFT;
  const maxX = regionX + ROAD_RIGHT - w;
  const x = minX + Math.random() * (maxX - minX);
  obstacles.push({
    x, y: regionY,
    w, h,
    speed: 4,
    image: (() => { const i=new Image(); i.src=imgSrc; return i; })()
  });
}

function updateObstacles(regionX, regionY) {
  const ctx = myGameArea.ctx;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed;

    // collision?
    if (!gameOver &&
        o.x < regionX + myGamePiece.x + myGamePiece.width &&
        o.x + o.w > regionX + myGamePiece.x &&
        o.y < regionY + myGamePiece.y + myGamePiece.height &&
        o.y + o.h > regionY + myGamePiece.y) {
      gameOver = true;
    }

    // off‑board
    if (o.y > regionY + REGION_H) {
      obstacles.splice(i,1);
      if (!gameOver) score++;
    } else {
      ctx.drawImage(o.image, o.x, o.y, o.w, o.h);
    }
  }
}

function updateCarPosition() {
  const mx      = 1 - latestLm[8].x;
  const targetX = mx * (REGION_W - myGamePiece.width);
  let delta     = targetX - myGamePiece.x;
  if (Math.abs(delta) > DEAD_ZONE) {
    myGamePiece.x += delta * SMOOTH_ALPHA;
  }
  myGamePiece.x = Math.max(
    ROAD_LEFT,
    Math.min(myGamePiece.x, ROAD_RIGHT - myGamePiece.width)
  );
}

// ─── 5) RESET BUTTON ───────────────────────────────────────────────────────
function createResetButton(regionX, regionY) {
  resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  Object.assign(resetBtn.style, {
    position: 'absolute',
    left:  `${regionX + (REGION_W/2) - 50}px`,
    top:   `${regionY + (REGION_H/2) + 100}px`,
    padding: '10px 20px',
    fontSize: '16px',
    zIndex: 999
  });
  resetBtn.onclick = startGame;
  document.body.appendChild(resetBtn);
}

// ─── 6) HAND LANDMARK DRAWING ─────────────────────────────────────────────
function drawHandLandmarks(cw, ch) {
  if (!latestLm) return;
  const ctx = myGameArea.ctx;
  ctx.strokeStyle = 'green';
  ctx.fillStyle   = 'red';
  ctx.lineWidth   = 2;
  for (let [a,b] of BONES) {
    const pa = latestLm[a], pb = latestLm[b];
    const ax = (1-pa.x)*cw, ay = pa.y*ch;
    const bx = (1-pb.x)*cw, by = pb.y*ch;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  for (let lm of latestLm) {
    const x = (1-lm.x)*cw, y = lm.y*ch;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.fill();
  }
}

// ─── 7) MEDIAPIPE HANDS & CAMERA ──────────────────────────────────────────
const videoElement = document.getElementById('video');

function initHands() {
  const hands = new Hands({
    locateFile: path => {
      const file = path.split('/').pop();
      if (file.endsWith('.tflite')) {
        return `https://storage.googleapis.com/mediapipe-assets/${file}`;
      }
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });
  hands.setOptions({
    modelComplexity: 1,
    maxNumHands: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  hands.onResults(results => {
    latestLm = results.multiHandLandmarks?.[0] ?? null;
    // after game over, any pinch resets
    if (gameOver && latestLm) {
      const d = Math.hypot(
        latestLm[8].x - latestLm[4].x,
        latestLm[8].y - latestLm[4].y
      );
      if (d < 0.08) startGame();
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => await hands.send({ image: videoElement }),
    width:  window.innerWidth,
    height: window.innerHeight
  });
  camera.start();
}

// ─── 8) BOOTSTRAP ─────────────────────────────────────────────────────────
init();
