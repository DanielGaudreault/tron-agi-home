// ISO Movement
const isos = document.querySelectorAll('.iso');
isos.forEach(iso => {
    iso.style.left = `${Math.random() * 200}px`;
    iso.style.top = `${Math.random() * 200}px`;
});

// Compile Program
document.getElementById('compile-btn').addEventListener('click', () => {
    const log = document.getElementById('log');
    const programs = ['Security', 'Data', 'Energy', 'AI Core'];
    const randomProgram = programs[Math.floor(Math.random() * programs.length)];
    log.innerHTML += `> Program compiled: <span style="color:#0ff">${randomProgram}.exe</span><br>`;
    log.scrollTop = log.scrollHeight;
});

// Summon ISO
document.getElementById('summon-iso-btn').addEventListener('click', () => {
    const log = document.getElementById('log');
    log.innerHTML += `> <span style="color:#ff00ff">ISO-${Math.floor(Math.random() * 9999)}</span> detected.<br>`;
    
    // AGI Emergence
    if (Math.random() > 0.8) {
        document.getElementById('agi-status').textContent = "AGI Active!";
        log.innerHTML += `> <span style="color:#ff00ff">WARNING: True AGI Emergence Detected.</span><br>`;
    }
    log.scrollTop = log.scrollHeight;
});
