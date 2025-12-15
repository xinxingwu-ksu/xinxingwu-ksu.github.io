// Get video, canvas, and result elements
const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const resultText = document.getElementById("result");

// Initial brightness level
let brightnessLevel = 50; // Start at 50%
let previousY = 0;

// Configure MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
});

// Previous gesture to avoid repeated actions
let previousGesture = "";

// Process hand tracking results
hands.onResults((results) => {
    // Clear the canvas before drawing landmarks
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1 });

            // Detect gestures for brightness control
            detectBrightnessGesture(landmarks);
        }
    } else {
        resultText.innerText = "No hand detected! 😢";
    }
});

// Detect brightness control gestures
function detectBrightnessGesture(landmarks) {
    const indexFinger = landmarks[8]; // Index finger tip

    const y = indexFinger.y * canvasElement.height;

    // ☝️ Index Finger Moves Up - Increase Brightness
    if (previousGesture !== "brightness-up" && previousY - y > 20) {
        increaseBrightness();
        previousY = y;
        previousGesture = "brightness-up";
        return;
    }

    // 👇 Index Finger Moves Down - Decrease Brightness
    if (previousGesture !== "brightness-down" && y - previousY > 20) {
        decreaseBrightness();
        previousY = y;
        previousGesture = "brightness-down";
        return;
    }

    // Reset gesture if no movement detected
    previousGesture = "";
}

// Increase brightness
function increaseBrightness() {
    if (brightnessLevel < 100) {
        brightnessLevel += 10;
        resultText.innerText = `💡 Brightness: ${brightnessLevel}%`;
        setBrightness(brightnessLevel);
    }
}

// Decrease brightness
function decreaseBrightness() {
    if (brightnessLevel > 0) {
        brightnessLevel -= 10;
        resultText.innerText = `💡 Brightness: ${brightnessLevel}%`;
        setBrightness(brightnessLevel);
    }
}

// Simulate brightness control (adjust using CSS for now)
function setBrightness(level) {
    document.body.style.filter = `brightness(${level}%)`;
}

// Configure the camera for capturing video
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
});

// Start the camera
camera.start();
