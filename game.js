// Cookie helper
function getCookie(name) {
    let cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        let parts = cookies[i].split("=");
        if (parts[0] === name) {
            return parts[1];
        }
    }
    return "";
}

// Read settings from storage
let savedName = sessionStorage.getItem("playerName") || decodeURIComponent(getCookie("playerName"));
let savedDifficulty = getCookie("difficulty");
let savedLength = sessionStorage.getItem("gameLength");
let savedTheme = sessionStorage.getItem("theme");
let savedBonus = sessionStorage.getItem("bonusBalloons");
let savedDouble = sessionStorage.getItem("doublePoints");

// Get display elements
let displayPlayer = document.getElementById("displayPlayer");
let displayScore = document.getElementById("displayScore");
let displayPopped = document.getElementById("displayPopped");
let displayEscaped = document.getElementById("displayEscaped");
let displayTimeLeft = document.getElementById("displayTimeLeft");
let displayDifficulty = document.getElementById("displayDifficulty");
let displayGameLength = document.getElementById("displayGameLength");
let displayTheme = document.getElementById("displayTheme");
let displayBestScore = document.getElementById("displayBestScore");
let messageArea = document.getElementById("messageArea");
let skyArea = document.getElementById("skyArea");
let logArea = document.getElementById("logArea");

// Get buttons
let startBtn = document.getElementById("startBtn");
let pauseBtn = document.getElementById("pauseBtn");
let saveBtn = document.getElementById("saveBtn");
let loadBtn = document.getElementById("loadBtn");
let resetBtn = document.getElementById("resetBtn");
let backBtn = document.getElementById("backBtn");

// Game state object
let game = {
    playerName: savedName || "Unknown",
    difficulty: savedDifficulty || "medium",
    gameLength: Number(savedLength) || 30,
    theme: savedTheme || "classic",
    bonusBalloons: savedBonus === "true",
    doublePoints: savedDouble === "true",
    score: 0,
    popped: 0,
    escaped: 0,
    timeLeft: Number(savedLength) || 30,
    running: false,
    paused: false,
    timerInterval: null,
    spawnInterval: null
};

// Arrays to track game elements
let balloons = [];
let gameLog = [];

// Sound function using Web Audio API
function playPopSound() {
    let soundOn = sessionStorage.getItem("soundEnabled");
    if (soundOn !== "true") return;

    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
}

// Display initial settings function
function displaySettings() {
    displayPlayer.textContent = game.playerName;
    displayDifficulty.textContent = game.difficulty;
    displayGameLength.textContent = game.gameLength + "s";
    displayTheme.textContent = game.theme;
    displayTimeLeft.textContent = game.timeLeft + "s";
    displayBestScore.textContent = getCookie("bestScore") || 0;
}

// Themes function
function applyTheme() {
    document.body.classList.remove("theme-classic", "theme-party", "theme-space");
    document.body.classList.add("theme-" + game.theme);
}

displaySettings();
applyTheme();

// Make sure game over screen is hidden on load
document.getElementById("gameOverScreen").classList.add("hidden");

// Start the game function
function getSpawnRate() {
    if (game.difficulty === "easy") return 2000;
    if (game.difficulty === "hard") return 800;
    return 1300; // medium
}

function getBalloonSpeed() {
    if (game.difficulty === "easy") return 8;
    if (game.difficulty === "hard") return 3;
    return 5; // medium
}

function startGame() {
    if (game.running) return;

    // Ask for name if not set
    if (!game.playerName || game.playerName === "Unknown" || game.playerName === "") {
        let name = prompt("Please enter your name to start:");
        if (name && name.trim() !== "") {
            game.playerName = name.trim();
            displayPlayer.textContent = game.playerName;
        }
    }

    game.running = true;
    game.paused = false;
    game.score = 0;
    game.popped = 0;
    game.escaped = 0;
    game.timeLeft = game.gameLength;

    displaySettings();
    messageArea.textContent = "Game started! Pop those balloons!";
    addLog("Game started - Difficulty: " + game.difficulty);

    game.timerInterval = setInterval(updateTimer, 1000);
    game.spawnInterval = setInterval(spawnBalloon, getSpawnRate());
}

startBtn.addEventListener("click", startGame);

// Timer function
function updateTimer() {
    game.timeLeft--;
    displayTimeLeft.textContent = game.timeLeft + "s";
    sessionStorage.setItem("timeLeft", game.timeLeft);

    if (game.timeLeft <= 0) {
        endGame();
    }
}

// Log function
function addLog(message) {
    gameLog.push(message);
    let entry = document.createElement("p");
    entry.textContent = message;
    logArea.appendChild(entry);
}

// Balloon colours array
let balloonColours = game.theme === "space" 
    ? ["#4a4aff", "#7b2fff", "#00d4ff", "#ff00ff", "#c0c0ff", "#9400d3"]
    : ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#e91e63"];

// Spawn function
function spawnBalloon() {
    if (!game.running || game.paused) return;

    // Decide if bonus balloon
    let isBonus = game.bonusBalloons && Math.random() < 0.2;

    // Create balloon element
    let balloon = document.createElement("div");
    balloon.classList.add("balloon");

    // Random horizontal position
    let leftPos = Math.floor(Math.random() * 80) + 5;
    balloon.style.left = leftPos + "%";
    balloon.style.bottom = "-80px";

    // Random colour from array
    let colour = balloonColours[Math.floor(Math.random() * balloonColours.length)];
    balloon.style.backgroundColor = colour;

    // Bonus balloon styling
    if (isBonus) {
        balloon.classList.add("bonus");
        balloon.textContent = "★";
    }

    // Animate upward
    balloon.style.transition = "bottom " + getBalloonSpeed() + "s linear";

    // Add to sky and array
    skyArea.appendChild(balloon);
    balloons.push(balloon);

    // Start moving after small delay
    setTimeout(function() {
        balloon.style.bottom = "110%";
    }, 50);

    // Click to pop
    balloon.addEventListener("click", function() {
        popBalloon(balloon, isBonus);
    });

    // Detect escape
    setTimeout(function() {
        if (balloon.parentElement) {
            escapedBalloon(balloon);
        }
    }, (getBalloonSpeed() * 1000) + 100);
}

// Pop and escape functions
function popBalloon(balloon, isBonus) {
    let points = isBonus ? 5 : 1;
    if (game.doublePoints) points = points * 2;

    playPopSound();
    game.score += points;
    game.popped++;

    displayScore.textContent = game.score;
    displayPopped.textContent = game.popped;

    addLog("Popped! +" + points + " points");
    balloon.remove();
    balloons.splice(balloons.indexOf(balloon), 1);
}

function escapedBalloon(balloon) {
    if (!balloon.parentElement) return;

    game.escaped++;
    game.score = Math.max(0, game.score - 1);

    displayEscaped.textContent = game.escaped;
    displayScore.textContent = game.score;

    addLog("Balloon escaped! -1 point");
    balloon.remove();
    balloons.splice(balloons.indexOf(balloon), 1);
}

// Pause and Resume function
function togglePause() {
    if (!game.running) return;

    game.paused = !game.paused;

    if (game.paused) {
        clearInterval(game.timerInterval);
        clearInterval(game.spawnInterval);
        messageArea.textContent = "Game paused.";
        addLog("Game paused at " + game.timeLeft + "s remaining");
    } else {
        game.timerInterval = setInterval(updateTimer, 1000);
        game.spawnInterval = setInterval(spawnBalloon, getSpawnRate());
        messageArea.textContent = "Game resumed!";
        addLog("Game resumed");
    }
}

pauseBtn.addEventListener("click", togglePause);

// Reset Game function
function resetGame() {
    let confirmed = confirm("Are you sure you want to reset the game?");
    if (!confirmed) return;

    clearInterval(game.timerInterval);
    clearInterval(game.spawnInterval);

    // Remove all balloons
    balloons.forEach(function(b) { b.remove(); });
    balloons = [];
    gameLog = [];
    logArea.innerHTML = "";

    game.running = false;
    game.paused = false;
    game.score = 0;
    game.popped = 0;
    game.escaped = 0;
    game.timeLeft = game.gameLength;

    displaySettings();
    messageArea.textContent = "Game reset. Click Start Game when ready.";
}

resetBtn.addEventListener("click", resetGame);

// Back to Settings function
backBtn.addEventListener("click", function() {
    let confirmed = confirm("Go back to settings? Current game will be lost.");
    if (confirmed) {
        window.close();
    }
});

// Save and Load Session function
function saveSession() {
    sessionStorage.setItem("savedScore", game.score);
    sessionStorage.setItem("savedPopped", game.popped);
    sessionStorage.setItem("savedEscaped", game.escaped);
    sessionStorage.setItem("savedTimeLeft", game.timeLeft);
    alert("Session saved!");
    addLog("Session saved - Score: " + game.score);
}

function loadSession() {
    let savedScore = sessionStorage.getItem("savedScore");
    let savedPopped = sessionStorage.getItem("savedPopped");
    let savedEscaped = sessionStorage.getItem("savedEscaped");
    let savedTimeLeft = sessionStorage.getItem("savedTimeLeft");

    if (savedScore === null) {
        alert("No saved session found.");
        return;
    }

    game.score = Number(savedScore);
    game.popped = Number(savedPopped);
    game.escaped = Number(savedEscaped);
    game.timeLeft = Number(savedTimeLeft);

    displayScore.textContent = game.score;
    displayPopped.textContent = game.popped;
    displayEscaped.textContent = game.escaped;
    displayTimeLeft.textContent = game.timeLeft + "s";

    alert("Session loaded!");
    addLog("Session loaded - Score: " + game.score);
}

saveBtn.addEventListener("click", saveSession);
loadBtn.addEventListener("click", loadSession);

// Game over function
function endGame() {
    clearInterval(game.timerInterval);
    clearInterval(game.spawnInterval);

    game.running = false;

    // Remove remaining balloons
    balloons.forEach(function(b) { b.remove(); });
    balloons = [];

    // Update best score cookie
    let bestScore = Number(getCookie("bestScore")) || 0;
    if (game.score > bestScore) {
        document.cookie = "bestScore=" + game.score + "; max-age=86400; path=/";
        displayBestScore.textContent = game.score;
    }

    messageArea.textContent = "Game Over! Final score: " + game.score;
    launchConfetti();
    addLog("Game over - Final score: " + game.score + " | Popped: " + game.popped + " | Escaped: " + game.escaped);

    // Show game over screen
    document.getElementById("gameOverPlayer").textContent = "Well done, " + game.playerName + "!";
    document.getElementById("goScore").textContent = game.score;
    document.getElementById("goPopped").textContent = game.popped;
    document.getElementById("goEscaped").textContent = game.escaped;
    document.getElementById("gameOverScreen").classList.remove("hidden");
}

// Confetti for party theme
function launchConfetti() {
    if (game.theme !== "party") return;
    let container = document.getElementById("confettiContainer");
    if (!container) return;
    
    let colours = ["#e63946", "#1d6edd", "#ffd700", "#2ecc71", "#f4a261"];
    
    for (let i = 0; i < 80; i++) {
        let piece = document.createElement("div");
        piece.classList.add("confetti-piece");
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.backgroundColor = colours[Math.floor(Math.random() * colours.length)];
        piece.style.animationDuration = (Math.random() * 2 + 2) + "s";
        piece.style.animationDelay = (Math.random() * 2) + "s";
        piece.style.width = (Math.random() * 8 + 6) + "px";
        piece.style.height = (Math.random() * 8 + 6) + "px";
        container.appendChild(piece);
        
        setTimeout(function() { piece.remove(); }, 4000);
    }
}

// Play Again button
let playAgainBtn = document.getElementById("playAgainBtn");
if (playAgainBtn) {
    playAgainBtn.addEventListener("click", function() {
        document.getElementById("gameOverScreen").classList.add("hidden");
        resetGame();
    });
}





