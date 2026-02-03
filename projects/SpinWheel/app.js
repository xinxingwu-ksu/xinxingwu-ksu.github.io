// ---------------- State ----------------
var students = [];
var history = [];
var angle = 0;
var spinning = false;
var lastWinnerIndex = -1;

// Wheel label font size (controlled by panel)
var wheelFontSizePx = 24;

// For speed-based sound
var lastFrameTime = 0;
var lastAngleForSpeed = 0;
var currentOmega = 0; // rad/sec (angular velocity)

// ---------------- Elements ----------------
var canvas = document.getElementById("wheel");
var ctx = canvas.getContext("2d");

var namesInput = document.getElementById("namesInput");
var updateBtn = document.getElementById("updateBtn");
var shuffleBtn = document.getElementById("shuffleBtn");
var clearBtn = document.getElementById("clearBtn");

var spinBtn = document.getElementById("spinBtn");
var speakBtn = document.getElementById("speakBtn");
var removeWinnerBtn = document.getElementById("removeWinnerBtn");
var resetHistoryBtn = document.getElementById("resetHistoryBtn");

var winnerNameEl = document.getElementById("winnerName");
var winnerSubEl = document.getElementById("winnerSub");
var historyList = document.getElementById("historyList");
var countPill = document.getElementById("countPill");

var spinTimeEl = document.getElementById("spinTime");
var spinTurnsEl = document.getElementById("spinTurns");

var fontSizeEl = document.getElementById("fontSize");
var fontSizeLabel = document.getElementById("fontSizeLabel");
var soundToggle = document.getElementById("soundToggle");

// ---------------- Helpers ----------------
function sanitizeLines(text){
  var lines = text.split(/\r?\n/);
  var cleaned = [];
  for (var i=0; i<lines.length; i++){
    var s = lines[i].trim();
    if (s.length > 0) cleaned.push(s);
  }
  return cleaned;
}

function shuffleArray(arr){
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function setButtons(){
  var hasStudents = students.length > 0;
  spinBtn.disabled = !hasStudents || spinning;
  speakBtn.disabled = (winnerNameEl.textContent === "—") || spinning;
  removeWinnerBtn.disabled = !hasStudents || spinning || lastWinnerIndex < 0;
  updateBtn.disabled = spinning;
  shuffleBtn.disabled = !hasStudents || spinning;
  clearBtn.disabled = spinning;
  resetHistoryBtn.disabled = spinning;

  countPill.textContent = students.length + (students.length === 1 ? " student" : " students");
}

function shortenName(name, maxChars){
  if (name.length <= maxChars) return name;
  return name.slice(0, Math.max(1, maxChars - 1)) + "…";
}

// ---------------- Drawing ----------------
function drawWheel(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  var cx = canvas.width / 2;
  var cy = canvas.height / 2;
  var r  = Math.min(cx, cy) - 10;

  // outer ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.stroke();
  ctx.restore();

  if (students.length === 0){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(17,24,39,0.85)";
    ctx.font = "800 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Add student names → Update Wheel", 0, -10);
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillStyle = "rgba(107,114,128,1)";
    ctx.fillText("Then click Spin", 0, 22);
    ctx.restore();
    return;
  }

  var n = students.length;
  var slice = (Math.PI * 2) / n;

  for (var i=0; i<n; i++){
    var start = angle + i * slice;
    var end   = start + slice;

    // color
    var hue = Math.round((i * 360) / n);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = "hsla(" + hue + ", 80%, 60%, 0.55)";
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.stroke();

    // label
    var mid = (start + end) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid);

    var maxChars = (n <= 12) ? 26 : 16;
    var label = shortenName(students[i], maxChars);

    ctx.textAlign = "right";
    ctx.font = "900 " + wheelFontSizePx + "px system-ui, sans-serif";

    // white outline then dark fill for readability
    ctx.lineWidth = Math.max(4, Math.floor(wheelFontSizePx / 5));
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.strokeText(label, r - 18, 10);

    ctx.fillStyle = "rgba(17,24,39,0.95)";
    ctx.fillText(label, r - 18, 10);

    ctx.restore();
  }

  // center hub
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0,0, r*0.12, 0, Math.PI*2);
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.stroke();
  ctx.restore();
}

function getWinnerIndex(){
  var n = students.length;
  if (n === 0) return -1;

  var slice = (Math.PI * 2) / n;

  var a = angle % (Math.PI * 2);
  if (a < 0) a += (Math.PI * 2);

  // pointer is at the top (-PI/2), represent it as 3PI/2 in [0,2PI)
  var pointer = (Math.PI * 3) / 2;
  var rel = pointer - a;
  if (rel < 0) rel += (Math.PI * 2);

  var index = Math.floor(rel / slice);
  if (index < 0) index = 0;
  if (index >= n) index = n - 1;
  return index;
}

// ---------------- History ----------------
function addToHistory(name){
  history.unshift(name);
  if (history.length > 30) history.pop();

  historyList.innerHTML = "";
  for (var i=0; i<history.length; i++){
    var li = document.createElement("li");
    li.textContent = history[i];
    historyList.appendChild(li);
  }
}

// ---------------- Speech ----------------
function speakName(name){
  if (!name || name === "—") return;
  try{
    var utter = new SpeechSynthesisUtterance(name);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }catch(e){}
}

function announceWinner(name){
  winnerNameEl.textContent = name;
  winnerSubEl.textContent = "Ask your question 🙂";

  // small pop
  winnerNameEl.style.transform = "scale(1.08)";
  winnerNameEl.style.transition = "transform 120ms ease";
  setTimeout(function(){ winnerNameEl.style.transform = "scale(1)"; }, 140);

  // attempt auto speak
  speakName(name);
  setButtons();
}

// ---------------- Speed-based Sound (Web Audio) ----------------
//
// Approach: Create a very short "tick" noise using an oscillator + fast envelope.
// While spinning, we schedule ticks at an interval that depends on angular velocity.
// Higher speed => shorter interval + higher pitch.
//
var audioCtx = null;
var tickGain = null;
var tickOsc = null;
var tickTimer = null;
var audioReady = false;

// Simple mapping helpers
function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
function lerp(a, b, t){ return a + (b - a) * t; }

function ensureAudio(){
  if (audioReady) return;

  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    tickGain = audioCtx.createGain();
    tickGain.gain.value = 0.0;
    tickGain.connect(audioCtx.destination);

    tickOsc = audioCtx.createOscillator();
    tickOsc.type = "triangle";
    tickOsc.frequency.value = 220;
    tickOsc.connect(tickGain);
    tickOsc.start();

    audioReady = true;
  }catch(e){
    audioReady = false;
  }
}

function startSpinSound(){
  if (!soundToggle.checked) return;

  ensureAudio();
  if (!audioReady) return;

  // If suspended (common until user gesture), resume.
  if (audioCtx.state === "suspended"){
    audioCtx.resume().catch(function(){});
  }

  stopSpinSound();

  // Start a scheduler loop. It will self-adjust interval based on currentOmega.
  tickTimer = setInterval(function(){
    // If wheel not spinning, do nothing
    if (!spinning) return;

    // omega in rad/s; map to normalized speed
    var omegaAbs = Math.abs(currentOmega);

    // Typical omega range during this animation: ~0 to ~25+ rad/s.
    // Normalize to 0..1 for mapping.
    var t = clamp(omegaAbs / 25, 0, 1);

    // Tick frequency: slow -> ~3 ticks/sec, fast -> ~20 ticks/sec
    var ticksPerSec = lerp(3, 20, t);

    // We emulate that by sometimes skipping ticks depending on dt:
    // We'll just fire one tick each scheduler run, but scheduler itself is fixed.
    // So instead: set scheduler to fast (every 20ms) and gate ticks using probability.
    // Simpler: make scheduler 20ms, probability = ticksPerSec * 0.02
    // (because 20ms = 0.02s)
    var p = clamp(ticksPerSec * 0.02, 0, 1);
    if (Math.random() > p) return;

    // Pitch: slow -> 180Hz, fast -> 850Hz
    var freq = lerp(180, 850, t);
    tickOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envelope (tiny click)
    var now = audioCtx.currentTime;
    tickGain.gain.cancelScheduledValues(now);
    tickGain.gain.setValueAtTime(0.0001, now);
    tickGain.gain.linearRampToValueAtTime(0.18, now + 0.004);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  }, 20);
}

function stopSpinSound(){
  if (tickTimer){
    clearInterval(tickTimer);
    tickTimer = null;
  }

  if (audioReady && tickGain && audioCtx){
    var now = audioCtx.currentTime;
    tickGain.gain.cancelScheduledValues(now);
    tickGain.gain.setValueAtTime(0.0001, now);
  }
}

// ---------------- Actions ----------------
function updateWheelFromText(){
  students = sanitizeLines(namesInput.value);
  lastWinnerIndex = -1;
  winnerNameEl.textContent = "—";
  winnerSubEl.textContent = students.length ? "Ready to spin." : "Add names → Update Wheel → Spin.";
  drawWheel();
  setButtons();
}

function spin(){
  if (students.length === 0) return;
  if (spinning) return;

  // create audio on user gesture
  startSpinSound();

  spinning = true;
  setButtons();

  var seconds = Number(spinTimeEl.value);
  var turns = Number(spinTurnsEl.value);
  var randomExtra = Math.random() * Math.PI * 2;

  var startAngle = angle;
  var targetAngle = startAngle + (turns * Math.PI * 2) + randomExtra;

  var startTime = performance.now();
  var duration = seconds * 1000;

  // reset speed tracking
  lastFrameTime = startTime;
  lastAngleForSpeed = angle;
  currentOmega = 0;

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function finishSafely(){
    spinning = false;
    stopSpinSound();
    setButtons();
  }

  function step(now){
    try{
      var elapsed = now - startTime;
      var t = elapsed / duration;
      if (t > 1) t = 1;

      var eased = easeOutCubic(t);
      angle = startAngle + (targetAngle - startAngle) * eased;

      // estimate angular velocity
      var dt = (now - lastFrameTime) / 1000;
      if (dt > 0){
        var dA = angle - lastAngleForSpeed;
        currentOmega = dA / dt;
      }
      lastFrameTime = now;
      lastAngleForSpeed = angle;

      drawWheel();

      if (t < 1){
        requestAnimationFrame(step);
      }else{
        lastWinnerIndex = getWinnerIndex();
        var winner = students[lastWinnerIndex];

        announceWinner(winner);
        addToHistory(winner);

        finishSafely();
      }
    }catch(err){
      console.error(err);
      finishSafely();
    }
  }

  requestAnimationFrame(step);
}

function removeWinner(){
  if (lastWinnerIndex < 0 || lastWinnerIndex >= students.length) return;

  var removed = students.splice(lastWinnerIndex, 1)[0];
  lastWinnerIndex = -1;

  namesInput.value = students.join("\n");
  winnerNameEl.textContent = "—";
  winnerSubEl.textContent = removed ? ("Removed: " + removed + ". Spin again.") : "Spin again.";

  drawWheel();
  setButtons();
}

function resetHistory(){
  history = [];
  historyList.innerHTML = "";
  winnerSubEl.textContent = students.length ? "Ready to spin." : "Add names → Update Wheel → Spin.";
}

// ---------------- Wire up ----------------
updateBtn.addEventListener("click", updateWheelFromText);

shuffleBtn.addEventListener("click", function(){
  if (spinning || students.length === 0) return;
  shuffleArray(students);
  namesInput.value = students.join("\n");
  drawWheel();
  setButtons();
});

clearBtn.addEventListener("click", function(){
  if (spinning) return;

  namesInput.value = "";
  students = [];
  lastWinnerIndex = -1;

  history = [];
  historyList.innerHTML = "";

  winnerNameEl.textContent = "—";
  winnerSubEl.textContent = "Add names → Update Wheel → Spin.";

  drawWheel();
  setButtons();
});

spinBtn.addEventListener("click", spin);

speakBtn.addEventListener("click", function(){
  speakName(winnerNameEl.textContent);
});

removeWinnerBtn.addEventListener("click", removeWinner);
resetHistoryBtn.addEventListener("click", resetHistory);

// Font size control (live)
fontSizeEl.addEventListener("input", function(){
  wheelFontSizePx = Number(fontSizeEl.value);
  fontSizeLabel.textContent = wheelFontSizePx + " px";
  drawWheel();
});

// Sound toggle
soundToggle.addEventListener("change", function(){
  if (!soundToggle.checked){
    stopSpinSound();
  }
});

// First draw
wheelFontSizePx = Number(fontSizeEl.value);
fontSizeLabel.textContent = wheelFontSizePx + " px";
drawWheel();
setButtons();
