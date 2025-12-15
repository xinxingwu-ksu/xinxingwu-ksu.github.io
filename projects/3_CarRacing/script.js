var myGamePiece;
var spwanpoint = 0;
var type = 0;
var myObstacles = [];
var myScore;

function startGame() {
    myGamePiece = new component(40, 70, "car6.png", 200, 400, "image");
    myGamePiece.gravity = 0.00;
    myScore = new component("30px", "Impact", "white", 150, 40, "text");
    myGameArea.start();
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = 420;
        this.canvas.height = 500;
        this.canvas.id = "demo";
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);

        window.addEventListener('keydown', function (e) {
            myGameArea.key = e.keyCode;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.key = false;
        })
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function () {
        clearInterval(this.interval);
    }
};

function component(width, height, color, x, y, type) {
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;

    this.update = function () {
        let ctx = myGameArea.context;
        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type == "image") {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    };

    this.crashWith = function (otherobj) {
        var myleft = this.x;
        var myright = this.x + this.width;
        var mytop = this.y;
        var mybottom = this.y + this.height;
        var otherleft = otherobj.x;
        var otherright = otherobj.x + otherobj.width;
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + otherobj.height;
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom - 20) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    };
}

function updateGameArea() {
    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            if (confirm("Game Over. Try again?")) {
                window.location = "game.html";
                myGameArea.stop();
            } else {
                window.location = "index.html";
                myGameArea.stop();
            }
        }
    }

    myGameArea.clear();
    myGameArea.frameNo += 1;

    if (myGameArea.frameNo == 1 || everyinterval(80)) {
        spawnpoint = Math.floor(Math.random() * (300 - 100 + 1)) + 100;
        type = Math.floor(Math.random() * 7) + 1;

        let image;
        switch (type) {
            case 1: image = "car1.png"; break;
            case 2: image = "car2.png"; break;
            case 3: image = "car3.png"; break;
            case 4: image = "car4.png"; break;
            case 5: image = "car5.png"; break;
            case 6: image = "barrel.png"; break;
            case 7: image = "roadblock.png"; break;
        }
        let w = (type >= 6) ? 50 : 40;
        let h = (type >= 6) ? 50 : 70;
        myObstacles.push(new component(w, h, image, spawnpoint, 0, "image"));
    }

    for (i = 0; i < myObstacles.length; i += 1) {
        myObstacles[i].y += 4;
        myObstacles[i].update();
    }

    myScore.text = "SCORE: " + myGameArea.frameNo;
    myScore.update();

    myGamePiece.speedX = 0;
    myGamePiece.speedY = 0;
    if (myGameArea.key && myGameArea.key == 37) { myGamePiece.speedX = -3; }
    if (myGameArea.key && myGameArea.key == 39) { myGamePiece.speedX = 3; }

    myGamePiece.newPos();
    myGamePiece.update();
}

function everyinterval(n) {
    return ((myGameArea.frameNo / n) % 1 == 0);
}

// Mouse click controls for left/right movement
document.addEventListener("click", function (event) {
    const canvas = myGameArea.canvas;
    const clickX = event.clientX - canvas.getBoundingClientRect().left;
    const centerX = canvas.width / 2;

    const roadLeftEdge = 70; // strict left bound
    const roadRightEdge = canvas.width - 80 - myGamePiece.width; // strict right bound

    if (clickX < centerX) {
        // Move left
        myGamePiece.x -= 40;
        if (myGamePiece.x < roadLeftEdge) {
            myGamePiece.x = roadLeftEdge;
        }
    } else {
        // Move right
        myGamePiece.x += 40;
        if (myGamePiece.x > roadRightEdge) {
            myGamePiece.x = roadRightEdge;
        }
    }
});
