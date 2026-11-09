"use strict";

/*
    IBM Bob Catch Challenge
    -----------------------
    This game uses only standard browser technologies.

    The configuration below is intentionally centralized so IBM Bob
    can easily understand and modify the game during the demonstration.
*/

const gameConfig = {
    durationSeconds: 45,
    startingLives: 3,
    pointsPerItem: 10,
    obstaclePenalty: 10,

    playerSpeeds: {
        slow: 5,
        normal: 8,
        fast: 12
    },

    fallingSpeed: 3.2,
    spawnIntervalMilliseconds: 850,
    obstacleChance: 0.25
};

const themes = {
    technology: {
        title: "IBM Bob Catch Challenge",
        description: "Collect the AI stars and avoid the bugs.",
        playerIcon: "🤖",
        goodIcon: "⭐",
        badIcon: "🐞",
        primaryColor: "#0f62fe",
        accentColor: "#78a9ff",
        backgroundStart: "#071a2f",
        backgroundEnd: "#123f68",
        successMessage: "You powered the future with AI!"
    },

    cybersecurity: {
        title: "Cybersecurity Defense Challenge",
        description: "Collect protected data and avoid cyber threats.",
        playerIcon: "🛡️",
        goodIcon: "🔐",
        badIcon: "🦠",
        primaryColor: "#007d79",
        accentColor: "#42be65",
        backgroundStart: "#061a18",
        backgroundEnd: "#0b4f4a",
        successMessage: "You protected the digital environment!"
    },

    smartCity: {
        title: "Smart City Challenge",
        description: "Collect clean energy and avoid traffic barriers.",
        playerIcon: "🚙",
        goodIcon: "⚡",
        badIcon: "🚧",
        primaryColor: "#198038",
        accentColor: "#a7f0ba",
        backgroundStart: "#082b16",
        backgroundEnd: "#165c31",
        successMessage: "You helped build a smarter city!"
    }
};

/*
    DOM references
*/

const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const startOverlay = document.getElementById("startOverlay");

const gameTitle = document.getElementById("gameTitle");
const subtitle = document.querySelector(".subtitle");

const playerNameInput = document.getElementById("playerNameInput");
const themeSelect = document.getElementById("themeSelect");
const speedSelect = document.getElementById("speedSelect");
const pointsSelect = document.getElementById("pointsSelect");

const playerNameDisplay = document.getElementById("playerNameDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const timeDisplay = document.getElementById("timeDisplay");

const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");

const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");

const howToPlayButton = document.getElementById("howToPlayButton");
const instructionsDialog = document.getElementById("instructionsDialog");
const closeDialogButton = document.getElementById("closeDialogButton");

/*
    Game state
*/

let gameRunning = false;
let animationFrameId = null;
let spawnTimerId = null;
let countdownTimerId = null;

let score = 0;
let lives = gameConfig.startingLives;
let timeRemaining = gameConfig.durationSeconds;

let playerX = 0;
let currentPlayerSpeed = gameConfig.playerSpeeds.normal;
let currentTheme = themes.technology;

let moveLeft = false;
let moveRight = false;

let fallingItems = [];

/*
    Initialization
*/

function initializeGame() {
    applyTheme(themeSelect.value);
    positionPlayerInCenter();
    updateScoreboard();

    window.addEventListener("resize", keepPlayerInsideGameArea);
}

function applyTheme(themeName) {
    currentTheme = themes[themeName] || themes.technology;

    document.documentElement.style.setProperty(
        "--primary-color",
        currentTheme.primaryColor
    );

    document.documentElement.style.setProperty(
        "--accent-color",
        currentTheme.accentColor
    );

    document.documentElement.style.setProperty(
        "--game-background-start",
        currentTheme.backgroundStart
    );

    document.documentElement.style.setProperty(
        "--game-background-end",
        currentTheme.backgroundEnd
    );

    gameTitle.textContent = currentTheme.title;
    subtitle.textContent = currentTheme.description;
    player.textContent = currentTheme.playerIcon;

    const overlayIcon = startOverlay.querySelector(".large-icon");

    if (overlayIcon) {
        overlayIcon.textContent = currentTheme.playerIcon;
    }
}

function positionPlayerInCenter() {
    const gameWidth = gameArea.clientWidth;
    const playerWidth = player.offsetWidth;

    playerX = Math.max(0, (gameWidth - playerWidth) / 2);
    updatePlayerPosition();
}

function keepPlayerInsideGameArea() {
    const maximumX = gameArea.clientWidth - player.offsetWidth;

    playerX = Math.max(0, Math.min(playerX, maximumX));
    updatePlayerPosition();
}

function updatePlayerPosition() {
    player.style.left = `${playerX}px`;
}

/*
    Starting and resetting
*/

function startGame() {
    if (gameRunning) {
        return;
    }

    applyTheme(themeSelect.value);

    const enteredName = playerNameInput.value.trim();

    playerNameDisplay.textContent =
        enteredName.length > 0 ? enteredName : "Guest";

    currentPlayerSpeed =
        gameConfig.playerSpeeds[speedSelect.value] ||
        gameConfig.playerSpeeds.normal;

    gameConfig.pointsPerItem =
        Number.parseInt(pointsSelect.value, 10) || 10;

    score = 0;
    lives = gameConfig.startingLives;
    timeRemaining = gameConfig.durationSeconds;

    removeAllFallingItems();
    positionPlayerInCenter();
    updateScoreboard();

    startOverlay.classList.add("hidden");
    gameRunning = true;

    gameArea.focus();

    spawnTimerId = window.setInterval(
        createFallingItem,
        gameConfig.spawnIntervalMilliseconds
    );

    countdownTimerId = window.setInterval(() => {
        timeRemaining -= 1;
        updateScoreboard();

        if (timeRemaining <= 0) {
            endGame("time");
        }
    }, 1000);

    animationFrameId = window.requestAnimationFrame(gameLoop);
}

function resetGame() {
    stopGameTimers();
    removeAllFallingItems();

    gameRunning = false;
    score = 0;
    lives = gameConfig.startingLives;
    timeRemaining = gameConfig.durationSeconds;

    moveLeft = false;
    moveRight = false;

    positionPlayerInCenter();
    updateScoreboard();

    startOverlay.innerHTML = `
        <div class="overlay-content">
            <div class="large-icon">${currentTheme.playerIcon}</div>
            <h2>Ready to play?</h2>
            <p>${currentTheme.description}</p>
            <p>
                Choose your settings and select
                <strong>Start Game</strong>.
            </p>
        </div>
    `;

    startOverlay.classList.remove("hidden");
    startButton.textContent = "Start Game";
}

function stopGameTimers() {
    if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (spawnTimerId !== null) {
        window.clearInterval(spawnTimerId);
        spawnTimerId = null;
    }

    if (countdownTimerId !== null) {
        window.clearInterval(countdownTimerId);
        countdownTimerId = null;
    }
}

/*
    Main animation loop
*/

function gameLoop() {
    if (!gameRunning) {
        return;
    }

    movePlayer();
    moveFallingItems();

    animationFrameId = window.requestAnimationFrame(gameLoop);
}

function movePlayer() {
    if (moveLeft) {
        playerX -= currentPlayerSpeed;
    }

    if (moveRight) {
        playerX += currentPlayerSpeed;
    }

    const maximumX = gameArea.clientWidth - player.offsetWidth;

    playerX = Math.max(0, Math.min(playerX, maximumX));

    updatePlayerPosition();
}

/*
    Falling items
*/

function createFallingItem() {
    if (!gameRunning) {
        return;
    }

    const isBadItem = Math.random() < gameConfig.obstacleChance;
    const itemElement = document.createElement("div");

    itemElement.className = isBadItem
        ? "falling-item bad-item"
        : "falling-item good-item";

    itemElement.textContent = isBadItem
        ? currentTheme.badIcon
        : currentTheme.goodIcon;

    itemElement.setAttribute(
        "aria-label",
        isBadItem ? "Obstacle" : "Collectible"
    );

    const itemWidth = 48;
    const maximumX = Math.max(
        0,
        gameArea.clientWidth - itemWidth
    );

    const itemX = Math.random() * maximumX;

    itemElement.style.left = `${itemX}px`;

    gameArea.appendChild(itemElement);

    fallingItems.push({
        element: itemElement,
        x: itemX,
        y: -55,
        isBad: isBadItem,
        speed:
            gameConfig.fallingSpeed +
            Math.random() * 1.5
    });
}

function moveFallingItems() {
    for (let index = fallingItems.length - 1; index >= 0; index -= 1) {
        const item = fallingItems[index];

        item.y += item.speed;
        item.element.style.top = `${item.y}px`;

        if (isColliding(item.element, player)) {
            handleCollision(item);
            removeFallingItem(index);
            continue;
        }

        if (item.y > gameArea.clientHeight) {
            removeFallingItem(index);
        }
    }
}

function isColliding(firstElement, secondElement) {
    const firstRectangle = firstElement.getBoundingClientRect();
    const secondRectangle = secondElement.getBoundingClientRect();

    return !(
        firstRectangle.right < secondRectangle.left ||
        firstRectangle.left > secondRectangle.right ||
        firstRectangle.bottom < secondRectangle.top ||
        firstRectangle.top > secondRectangle.bottom
    );
}

function handleCollision(item) {
    if (item.isBad) {
        lives -= 1;

        showScorePopup(
            `-${gameConfig.obstaclePenalty}`,
            item.x,
            item.y,
            "#ff8389"
        );

        gameArea.classList.remove("screen-flash");

        /*
            Reading offsetWidth restarts the CSS animation.
        */
        void gameArea.offsetWidth;

        gameArea.classList.add("screen-flash");

        if (lives <= 0) {
            lives = 0;
            updateScoreboard();
            endGame("lives");
            return;
        }
    } else {
        score += gameConfig.pointsPerItem;

        showScorePopup(
            `+${gameConfig.pointsPerItem}`,
            item.x,
            item.y,
            "#a7f0ba"
        );
    }

    updateScoreboard();
}

function removeFallingItem(index) {
    const item = fallingItems[index];

    if (item && item.element.parentNode) {
        item.element.remove();
    }

    fallingItems.splice(index, 1);
}

function removeAllFallingItems() {
    fallingItems.forEach((item) => {
        if (item.element.parentNode) {
            item.element.remove();
        }
    });

    fallingItems = [];
}

/*
    Score popup
*/

function showScorePopup(text, x, y, color) {
    const popup = document.createElement("div");

    popup.className = "score-popup";
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${Math.max(0, y)}px`;
    popup.style.color = color;

    gameArea.appendChild(popup);

    window.setTimeout(() => {
        popup.remove();
    }, 700);
}

/*
    Game completion
*/

function endGame(reason) {
    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    stopGameTimers();
    removeAllFallingItems();

    const playerName =
        playerNameDisplay.textContent || "Guest";

    let resultHeading = "Game Complete!";

    if (reason === "lives") {
        resultHeading = "Challenge Over!";
    }

    const scoreMessage = getScoreMessage(score);

    startOverlay.innerHTML = `
        <div class="overlay-content">
            <div class="large-icon">${currentTheme.playerIcon}</div>

            <h2>${resultHeading}</h2>

            <p>
                <strong>${escapeHtml(playerName)}</strong>,
                your final score is:
            </p>

            <p style="font-size: 2.2rem; margin: 12px 0;">
                <strong>${score}</strong>
            </p>

            <p>${scoreMessage}</p>

            <p>${currentTheme.successMessage}</p>
        </div>
    `;

    startOverlay.classList.remove("hidden");
    startButton.textContent = "Play Again";
}

function getScoreMessage(finalScore) {
    if (finalScore >= 300) {
        return "Outstanding performance! You are an AI Champion.";
    }

    if (finalScore >= 150) {
        return "Excellent work! You completed the challenge.";
    }

    if (finalScore >= 50) {
        return "Good work! Try again to improve your score.";
    }

    return "Nice attempt! Play again and collect more items.";
}

/*
    Scoreboard
*/

function updateScoreboard() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    timeDisplay.textContent = timeRemaining;
}

/*
    Input controls
*/

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        moveLeft = true;
    }

    if (key === "arrowright" || key === "d") {
        event.preventDefault();
        moveRight = true;
    }
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
        moveLeft = false;
    }

    if (key === "arrowright" || key === "d") {
        moveRight = false;
    }
});

function activateMovementButton(button, direction) {
    const startMoving = (event) => {
        event.preventDefault();

        if (direction === "left") {
            moveLeft = true;
        } else {
            moveRight = true;
        }
    };

    const stopMoving = (event) => {
        event.preventDefault();

        if (direction === "left") {
            moveLeft = false;
        } else {
            moveRight = false;
        }
    };

    button.addEventListener("pointerdown", startMoving);
    button.addEventListener("pointerup", stopMoving);
    button.addEventListener("pointercancel", stopMoving);
    button.addEventListener("pointerleave", stopMoving);
}

activateMovementButton(moveLeftButton, "left");
activateMovementButton(moveRightButton, "right");

/*
    Interface events
*/

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);

themeSelect.addEventListener("change", () => {
    if (!gameRunning) {
        applyTheme(themeSelect.value);
    }
});

howToPlayButton.addEventListener("click", () => {
    if (typeof instructionsDialog.showModal === "function") {
        instructionsDialog.showModal();
    } else {
        window.alert(
            "Use the arrow keys or A and D to move. " +
            "Collect good items and avoid obstacles."
        );
    }
});

closeDialogButton.addEventListener("click", () => {
    instructionsDialog.close();
});

/*
    Basic HTML escaping for user-supplied names.
*/

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

initializeGame();