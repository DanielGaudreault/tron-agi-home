class UIController {
    constructor() {
        // System components
        this.agiSystem = new AGISystem();
        this.tronGrid = new TronGrid(document.getElementById('grid-canvas'));
        
        // UI Elements
        this.chatContainer = document.getElementById('chat-container');
        this.userInput = document.getElementById('user-input');
        this.submitBtn = document.getElementById('submit-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Status elements
        this.statusText = document.getElementById('status-text');
        this.loadText = document.getElementById('load-text');
        this.memoryText = document.getElementById('memory-text');
        this.statusMeter = document.getElementById('status-meter');
        this.loadMeter = document.getElementById('load-meter');
        this.memoryMeter = document.getElementById('memory-meter');
        
        // Console
        this.consoleOutput = document.getElementById('console-output');
        
        // Audio elements
        this.startupSound = document.getElementById('startup-sound');
        this.clickSound = document.getElementById('click-sound');
        this.gridSound = document.getElementById('grid-sound');
        
        // Initialize
        this.setupEventListeners();
        this.playStartupSequence();
        this.logToConsole("System initialization started...");
    }
    
    playStartupSequence() {
        // Play startup sound
        this.startupSound.volume = 0.3;
        this.startupSound.play().catch(e => console.log("Audio play failed:", e));
        
        // Start grid sound (looping)
        this.gridSound.volume = 0.1;
        this.gridSound.play().catch(e => console.log("Grid sound failed:", e));
        
        // Add initial system messages with delay
        setTimeout(() => {
            this.addSystemMessage("Booting neural network core...");
            this.logToConsole("Neural network initializing");
        }, 500);
        
        setTimeout(() => {
            this.addSystemMessage("Loading knowledge base modules...");
            this.logToConsole("Knowledge base loaded");
        }, 1500);
        
        setTimeout(() => {
            this.addSystemMessage("Establishing user interface...");
            this.logToConsole("UI components ready");
        }, 2500);
        
        setTimeout(() => {
            this.addSystemMessage("System ready. Awaiting user input.");
            this.logToConsole("System operational");
            this.updateStatusDisplay();
            this.userInput.focus();
        }, 3500);
    }
    
    setupEventListeners() {
        // Submit button click
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
        
        // Reset button click
        this.resetBtn.addEventListener('click', () => this.handleReset());
        
        // Input field keypress
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        });
        
        // Input field focus
        this.userInput.addEventListener('focus', () => {
            this.userInput.style.boxShadow = '0 0 15px var(--neon-blue)';
            this.playClickSound();
        });
        
        this.userInput.addEventListener('blur', () => {
            this.userInput.style.boxShadow = 'none';
        });
        
        // Button hover effects
        const buttons = [this.submitBtn, this.resetBtn];
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => this.playClickSound());
        });
        
        // Window resize debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.logToConsole("Viewport resized: " + window.innerWidth + "x" + window.innerHeight);
            }, 200);
        });
    }
    
    playClickSound() {
        this.clickSound.currentTime = 0;
        this.clickSound.volume = 0.2;
        this.clickSound.play().catch(e => console.log("Click sound failed:", e));
    }
    
    handleSubmit() {
        const input = this.userInput.value.trim();
        if (!input) return;
        
        this.playClickSound();
        this.addUserMessage(input);
        this.userInput.value = '';
        this.logToConsole("User input: " + input);
        
        // Simulate processing delay based on input length
        const processingTime = Math.min(2000, Math.max(500, input.length * 20));
        
        setTimeout(() => {
            const response = this.agiSystem.processInput(input);
            this.addSystemMessage(response);
            this.updateStatusDisplay();
            this.logToConsole("System response: " + response.substring(0, 50) + "...");
        }, processingTime);
    }
    
    handleReset() {
        this.playClickSound();
        this.agiSystem.reset();
        this.chatContainer.innerHTML = '';
        this.addSystemMessage("System reset complete. Ready for new interaction.");
        this.updateStatusDisplay();
        this.logToConsole("System reset performed");
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-header">USER</div>
            <div class="message-content">${message}</div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        messageDiv.innerHTML = `
            <div class="message-header">SYSTEM</div>
            <div class="message-content">${message}</div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    updateStatusDisplay() {
        this.statusText.textContent = this.agiSystem.status.toUpperCase();
        this.loadText.textContent = `${this.agiSystem.load.toFixed(1)}%`;
        this.memoryText.textContent = this.agiSystem.formatMemory(this.agiSystem.memoryUsage);
        
        // Update meters
        this.loadMeter.style.width = `${this.agiSystem.load}%`;
        this.memoryMeter.style.width = `${Math.min(this.agiSystem.memoryUsage / 1024, 100)}%`;
        
        // Update status meter color and animation
        if (this.agiSystem.status.includes('critical')) {
            this.statusMeter.style.backgroundColor = '#f00';
            this.statusMeter.style.boxShadow = '0 0 10px #f00';
            this.statusMeter.style.width = '100%';
            this.statusText.style.animation = 'statusCritical 1s infinite';
        } else if (this.agiSystem.status.includes('high')) {
            this.statusMeter.style.backgroundColor = '#ff0';
            this.statusMeter.style.boxShadow = '0 0 10px #ff0';
            this.statusMeter.style.width = '75%';
            this.statusText.style.animation = 'none';
        } else if (this.agiSystem.status.includes('moderate')) {
            this.statusMeter.style.backgroundColor = '#0f0';
            this.statusMeter.style.boxShadow = '0 0 10px #0f0';
            this.statusMeter.style.width = '50%';
            this.statusText.style.animation = 'none';
        } else {
            this.statusMeter.style.backgroundColor = '#0ff';
            this.statusMeter.style.boxShadow = '0 0 10px #0ff';
            this.statusMeter.style.width = '25%';
            this.statusText.style.animation = 'none';
        }
        
        // Adjust grid intensity based on load
        const gridIntensity = 0.1 + (this.agiSystem.load / 100) * 0.9;
        this.tronGrid.setIntensity(gridIntensity);
    }
    
    logToConsole(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        this.consoleOutput.appendChild(logEntry);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
        
        // Keep console to a reasonable size
        if (this.consoleOutput.children.length > 50) {
            this.consoleOutput.removeChild(this.consoleOutput.children[0]);
        }
    }
}
