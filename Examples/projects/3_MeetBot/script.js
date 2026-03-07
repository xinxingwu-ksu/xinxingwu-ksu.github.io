// Element References
const door1 = document.getElementById('door1');
const door2 = document.getElementById('door2');
const door3 = document.getElementById('door3');
const startButton = document.getElementById('start');

// Door Image Paths
const doorImages = {
  bot: "./images/robot.png",        // Path to bot image
  beach: "./images/beach.png",      // Path to beach image
  space: "./images/space.png",      // Path to space image
  closed: "./images/closed_door1.jpg" // Path to closed door image
};

// Game Variables
let openDoor1;
let openDoor2;
let openDoor3;
let closedDoorsCount = 3;
let isGameActive = true;

// Score Tracking
let score = 0;
let highScore = 0;

// Update Score Display
const scoreDisplay = document.getElementById('score-number');
const highScoreDisplay = document.getElementById('high-score-number');
scoreDisplay.innerHTML = score;
highScoreDisplay.innerHTML = highScore;

// Randomly generate doors (Bot is never in the third door)
function randomizeDoors() {
  const randomDoor = Math.floor(Math.random() * 2); // Randomize to only 0 or 1 for bot position
  const doors = [doorImages.bot, doorImages.beach, doorImages.space];
  
  // Assign doors based on random choice, ensuring bot is in the first or second door
  openDoor1 = doors[randomDoor];
  openDoor2 = doors[(randomDoor + 1) % 3]; // Ensure the second door is different
  openDoor3 = doors[(randomDoor + 2) % 3]; // The third door will always be either beach or space

  // Log for debugging
  console.log(`Bot is behind door ${randomDoor + 1}`);
}

// Handle door clicks
function onDoorClick(event) {
  const clickedDoor = event.target; // Get the door that was clicked
  
  if (isGameActive && !isDoorOpened(clickedDoor)) {
    if (clickedDoor == door1) {
      clickedDoor.src = openDoor1;
    } else if (clickedDoor == door2) {
      clickedDoor.src = openDoor2;
    } else {
      clickedDoor.src = openDoor3;
    }
    evaluateDoor(clickedDoor); // Check if the door leads to win or loss
  }
}

// Check if the door is already opened (using file name comparison)
function isDoorOpened(door) {
  const doorSrc = door.src.split('/').pop(); // Extract the file name from the src
  return doorSrc !== "closed_door1.jpg";     // Compare only the file name
}

// Check if the clicked door is the bot door (using file name comparison)
function isBotDoor(door) {
  const doorSrc = door.src.split('/').pop(); // Extract the file name from the src
  return doorSrc === "robot.png";            // Compare only the file name for the bot
}

// Evaluate the clicked door
function evaluateDoor(door) {
  if (isBotDoor(door)) {
    // If bot is behind the first or second door, it's a win
    if (door == door1 || door == door2) {
      endGame('win');
    } else {
      // If bot is behind the third door, it's a loss
      endGame('lose');
    }
  } else {
    closedDoorsCount--;  // Decrease closed doors count
    
    if (closedDoorsCount === 0) {
      endGame('lose');
    }
  }
}

// Event Listeners
door1.onclick = onDoorClick;
door2.onclick = onDoorClick;
door3.onclick = onDoorClick;
startButton.onclick = startGame;

// Start the game
function startGame() {
  door1.src = doorImages.closed; // Reset doors
  door2.src = doorImages.closed;
  door3.src = doorImages.closed; // Reset door3
  closedDoorsCount = 3; // Reset closed doors count
  isGameActive = true; // Game is active
  startButton.innerHTML = 'Good luck!';
  randomizeDoors(); // Generate new doors with the bot in the first or second
}

// Handle game over logic
function endGame(result) {
  isGameActive = false; // Disable further clicks
  
  if (result === 'win') {
    startButton.innerHTML = 'You win! Play again?';
    updateScore();
  } else {
    startButton.innerHTML = "Game over! Play again?";
    score = 0; // Reset score on loss
    scoreDisplay.innerHTML = score;
  }
}

// Update score and high score displays
function updateScore() {
  score++;
  scoreDisplay.innerHTML = score;

  if (score > highScore) {
    highScore = score;
    highScoreDisplay.innerHTML = highScore;
  }
}

// Initialize the game on page load
startGame();
