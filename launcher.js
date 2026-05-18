// Get all form elements
let playerName = document.getElementById("playerName");
let difficulty = document.getElementById("difficulty");
let gameLength = document.getElementById("gameLength");
let soundEnabled = document.getElementById("soundEnabled");
let doublePoints = document.getElementById("doublePoints");
let bonusBalloons = document.getElementById("bonusBalloons");
let previewText = document.getElementById("previewText");

// Get all buttons
let openGameBtn = document.getElementById("openGameBtn");
let loadSettingsBtn = document.getElementById("loadSettingsBtn");
let resetSettingsBtn = document.getElementById("resetSettingsBtn");

function updatePreview() {
    let name = playerName.value || "Unknown";
    let diff = difficulty.value;
    let length = gameLength.value;
    let theme = document.querySelector('input[name="theme"]:checked').value;

    previewText.textContent = name + " | " + diff + " | " + length + "s | " + theme;
}

playerName.addEventListener("input", updatePreview);
difficulty.addEventListener("change", updatePreview);
gameLength.addEventListener("change", updatePreview);
document.querySelectorAll('input[name="theme"]').forEach(function(radio) {
    radio.addEventListener("change", updatePreview);
});

// Cookie helper function
function setCookie(name, value) {
    document.cookie = name + "=" + value + "; max-age=86400; path=/";
}

// Save function
function saveSettings() {
    let name = playerName.value.trim();

    if (name === "") {
        alert("Please enter a player name before saving.");
        return;
    }

    // Save to cookies
    setCookie("playerName", name);
    setCookie("difficulty", difficulty.value);

    // Save to sessionStorage
    sessionStorage.setItem("gameLength", gameLength.value);
    sessionStorage.setItem("theme", document.querySelector('input[name="theme"]:checked').value);
    sessionStorage.setItem("soundEnabled", soundEnabled.checked);
    sessionStorage.setItem("doublePoints", doublePoints.checked);
    sessionStorage.setItem("bonusBalloons", bonusBalloons.checked);

    alert("Settings saved!");
}

// Change 8 - Save Settings button removed
// saveSettingsBtn.addEventListener("click", saveSettings);

// Cookie reader function
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

// Load function
function loadSettings(silent = false) {
    // Load from cookies
    let savedName = getCookie("playerName");
    let savedDifficulty = getCookie("difficulty");

    if (savedName !== "") playerName.value = savedName;
    if (savedDifficulty !== "") difficulty.value = savedDifficulty;

    // Load from sessionStorage
    let savedLength = sessionStorage.getItem("gameLength");
    let savedTheme = sessionStorage.getItem("theme");
    let savedSound = sessionStorage.getItem("soundEnabled");
    let savedDouble = sessionStorage.getItem("doublePoints");
    let savedBonus = sessionStorage.getItem("bonusBalloons");

    if (savedLength) gameLength.value = savedLength;
    if (savedTheme) {
        document.querySelector('input[name="theme"][value="' + savedTheme + '"]').checked = true;
    }
    if (savedSound !== null) soundEnabled.checked = savedSound === "true";
    if (savedDouble !== null) doublePoints.checked = savedDouble === "true";
    if (savedBonus !== null) bonusBalloons.checked = savedBonus === "true";

    updatePreview();
    if (!silent) alert("Settings loaded!");
}

loadSettingsBtn.addEventListener("click", loadSettings);

// Reset function
function resetSettings() {
    let confirmed = confirm("Are you sure you want to reset all settings?");
    if (confirmed) {
        playerName.value = "";
        difficulty.value = "medium";
        gameLength.value = "30";
        document.querySelector('input[name="theme"][value="classic"]').checked = true;
        soundEnabled.checked = true;
        doublePoints.checked = false;
        bonusBalloons.checked = true;

        updatePreview();
        alert("Settings have been reset.");
    }
}

resetSettingsBtn.addEventListener("click", resetSettings);

// Open Game Window
function openGame() {
    let name = playerName.value.trim();

    if (name === "") {
        alert("Please enter a player name to start the game.");
        return;
    }

    // Save to sessionStorage so game window can read it immediately
    sessionStorage.setItem("playerName", name);
    sessionStorage.setItem("gameLength", gameLength.value);
    sessionStorage.setItem("theme", document.querySelector('input[name="theme"]:checked').value);
    sessionStorage.setItem("soundEnabled", soundEnabled.checked);
    sessionStorage.setItem("doublePoints", doublePoints.checked);
    sessionStorage.setItem("bonusBalloons", bonusBalloons.checked);

    window.open("game.html", "_blank");
}

openGameBtn.addEventListener("click", openGame);

// Load saved settings on page load
loadSettings(true);



