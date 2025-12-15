// Initial status
var sueloY = 22;
var velY = 0;
var impulso = 900;
var gravity = 2500;

var dinoPosY = sueloY;
var isAir = false;
var deltaTime = 0;
var time = new Date();

// New: Additional Game Mechanics
var gameSpeed = 1;
var groundX = 0;
var sceneSpeed = 1280 / 3;
var obstacles = [];
var obstacleSpawnTime = 2;
var minObstacleTime = 0.7;
var maxObstacleTime = 1.8;
var score = 0;
var isPaused = false;

var container, scoreText, ground, dino, gameOverScreen;

var replayButton;

// Start the game
function Start() {
	gameOverScreen = document.querySelector(".game-over");
    dino = document.querySelector(".dino");
    ground = document.querySelector(".suelo");
    container = document.querySelector(".contenedor");
	scoreText = document.querySelector(".score");
	
	replayButton = document.querySelector(".replay-btn");
	
    document.addEventListener("keydown", HandleKeyDown);
	replayButton.addEventListener("click", RestartGame); // Add event listener to replay button
    Loop();
}

// Handle key press (jump)
function HandleKeyDown(ev) {
    if (ev.keyCode == 32) { // Spacebar
        if (dinoPosY === sueloY) {
            isAir = true;
            velY = impulso;
            dino.classList.remove("dino-corriendo"); 
			
			// Play jump sound
			let jumpSound = document.getElementById("jumpSound");
			jumpSound.currentTime = 0;  // Reset audio if already playing
			jumpSound.play();
        }
    }
}

// Game loop
function Loop() {
    if (!isPaused) {
		deltaTime = (new Date() - time) / 1000;
		time = new Date();
        
		MoverDinosaurio();
		moveGround();
		checkObstacleSpawn();
		moveObstacles();
		checkCollision();
	}
    requestAnimationFrame(Loop);
}

// Move the ground
function moveGround() {
    groundX += sceneSpeed * deltaTime * gameSpeed;
    ground.style.left = -(groundX % container.clientWidth) + "px";
	//console.log(container.clientWidth);
}

// Check if an obstacle should be spawned
function checkObstacleSpawn() {
    obstacleSpawnTime -= deltaTime;
    if (obstacleSpawnTime <= 0) {
        spawnObstacle();
    }
}

// Spawn an obstacle
function spawnObstacle() {
    let obstacle = document.createElement("div");
    obstacle.classList.add("cactus");
    container.appendChild(obstacle);

    obstacle.posX = container.clientWidth;
    obstacle.style.left = `${container.clientWidth}px`;

    obstacles.push(obstacle);

    obstacleSpawnTime = minObstacleTime + Math.random() * (maxObstacleTime - minObstacleTime) / gameSpeed;
}

// Move obstacles
function moveObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obstacle = obstacles[i];

        obstacle.posX -= Math.round(sceneSpeed * deltaTime * gameSpeed);
        obstacle.style.left = `${obstacle.posX}px`;

        // Remove obstacle if off-screen
        if (obstacle.posX + obstacle.clientWidth <= 0) {
            obstacle.remove();
            obstacles.splice(i, 1);
            score++;
            scoreText.innerText = score;
        }
    }
}


// Move the dinosaur
function MoverDinosaurio() {
    velY -= gravity * deltaTime; // Apply gravity
    dinoPosY += velY * deltaTime;

    if (dinoPosY < sueloY) {
        dinoPosY = sueloY;
        velY = 0;
        isAir = false;
        dino.classList.add("dino-corriendo");
    }

    dino.style.bottom = dinoPosY + "px";
}

// Check collision with obstacles
function checkCollision() {
    obstacles.forEach(obstacle => {
        let dinoRight = dino.offsetLeft + dino.offsetWidth;
        let obstacleLeft = obstacle.posX;
        let obstacleRight = obstacle.posX + obstacle.clientWidth;

        if (obstacleLeft < dinoRight && obstacleRight > dino.offsetLeft && !isAir) {
            endGame();
        }
    });
}

// End the game
function endGame() {
    isPaused = true;
	gameOverScreen.style.display = "block";
}

function RestartGame() {
    isPaused = false;
    score = 0;
    scoreText.innerText = score;
    obstacles.forEach(obstacle => obstacle.remove()); // Remove all obstacles
    obstacles = []; // Clear the obstacles array
    dinoPosY = sueloY; // Reset dino position
    velY = 0;
    groundX = 0; // Reset ground position
    gameOverScreen.style.display = "none"; // Hide game over screen
    dino.classList.add("dino-corriendo"); // Ensure dino is running

    Loop(); // Restart the game loop
}


// Start when the page loads
document.addEventListener("DOMContentLoaded", Start);