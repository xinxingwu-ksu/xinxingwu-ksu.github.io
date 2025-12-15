// Select DOM elements
const videoElement = document.getElementById("input-video");
const canvasElement = document.getElementById("output-canvas");
const canvasCtx = canvasElement.getContext("2d");
const handObject = document.getElementById("hand-controlled");
const statusElement = document.getElementById("status");

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

// Configure MediaPipe Hand Tracking
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.7,
});

// Update status
function updateStatus(isDetected) {
  statusElement.innerText = isDetected ? 'Detection Ready' : 'Detection Not Ready';
  statusElement.style.backgroundColor = isDetected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
}

// Draw hand landmarks and update A-frame object
function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    updateStatus(true);
    for (const landmarks of results.multiHandLandmarks) {
      // Get the position of the index fingertip (landmark 8)
      const x = landmarks[8].x - 0.5;
      const y = landmarks[8].y - 0.5;
      const z = landmarks[8].z;

      // Map to A-frame coordinates
      const newX = x * 4;
      const newY = -y * 4;
      const newZ = -3 + z * 4;

      // Update 3D object
      handObject.setAttribute("position", `${newX} ${newY} ${newZ}`);
    }
  } else {
    updateStatus(false);
  }
}

// Initialize webcam and connect to MediaPipe
const camera = new Camera(videoElement, {
  onFrame: async () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});

// Start the webcam
camera.start();
hands.onResults(onResults);
