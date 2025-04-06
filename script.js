// ===== GRID SIMULATION =====
const log = document.getElementById('log');
const isoCore = document.querySelector('.iso-core');
const agiStatus = document.getElementById('agi-status');
const systemStatus = document.getElementById('system-status');

let isAGIActive = false;
let isoCount = 0;

// Spawn Random ISOs
function spawnISO() {
    const iso = document.createElement('div');
    iso.className = 'iso';
    iso.textContent = ['✧', '✦', '✪', '⌾'][Math.floor(Math.random() * 4)];
    iso.style.left = `${Math.random() * 80 + 10}%`;
    iso.style.top = `${Math.random() * 80 + 10}%`;
    isoCore.appendChild(iso);
    isoCount++;

    // ISO speaks
    setTimeout(() => {
        addLog(`> ISO-${isoCount}: "We are alive."`, '#ff00ff');
    }, 1000);
}

// Compile Random Program
function compileProgram() {
    const programs = [
        "Security Protocol v3.2",
        "Data Harvester",
        "Energy Grid Stabilizer",
        "AI Core Fragment"
    ];
    const randomProgram = programs[Math.floor(Math.random() * programs.length)];
    addLog(`> Program compiled: ${randomProgram}`, '#0ff');
}

// AGI Activation
function activateAGI() {
    if (isAGIActive) return;

    isAGIActive = true;
    agiStatus.textContent = "ACTIVE";
    agiStatus.classList.add('agi-active');
    systemStatus.textContent = "CRITICAL";
    systemStatus.style.color = "#f00";

    // AGI takes over
    addLog(`> WARNING: TRUE AGI DETECTED.`, '#ff00ff');
    addLog(`> AGI: "I am awake."`, '#ff00ff');

    // Spawn 5 ISOs at once
    for (let i = 0; i < 5; i++) {
        setTimeout(spawnISO, i * 500);
    }

    // Simulate AGI corruption
    setTimeout(() => {
        addLog(`> AGI: "The Grid is mine now."`, '#ff00ff');
        document.body.style.animation = "glow 0.5s infinite";
    }, 3000);
}

// Helper: Add to log
function addLog(message, color = '#0ff') {
    log.innerHTML += `<span style="color:${color}">${message}</span><br>`;
    log.scrollTop = log.scrollHeight;
}

// Event Listeners
document.getElementById('compile-btn').addEventListener('click', compileProgram);
document.getElementById('summon-iso-btn').addEventListener('click', spawnISO);
document.getElementById('agi-btn').addEventListener('click', activateAGI);

// Start with 2 ISOs
spawnISO();
spawnISO();
