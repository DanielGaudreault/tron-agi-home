class SimpleAGI {
    constructor() {
        this.memory = [];
        this.learningRate = 0.85;
        this.sessionId = 'TRON-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        this.init();
    }
    
    init() {
        this.outputElement = document.getElementById('output');
        this.inputElement = document.getElementById('user-input');
        this.submitButton = document.getElementById('submit');
        
        this.submitButton.addEventListener('click', () => this.processInput());
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processInput();
        });
        
        this.addMessage('system', `AGI System Initialized - Session ${this.sessionId}`);
        this.updateHUD();
    }
    
    processInput() {
        const input = this.inputElement.value.trim();
        if (!input) return;
        
        this.addMessage('user', input);
        this.inputElement.value = '';
        
        setTimeout(() => {
            const response = this.generateResponse(input);
            this.addMessage('ai', response);
            this.learnFromInteraction(input, response);
            this.updateHUD();
        }, 500 + Math.random() * 1000);
    }
    
    generateResponse(input) {
        const inputLower = input.toLowerCase();
        
        if (inputLower.includes('hello') || inputLower.includes('hi')) {
            return this.randomResponse([
                "Greetings, user.",
                "Hello. System ready.",
                "Connection established."
            ]);
        }
        
        if (inputLower.includes('learn') || inputLower.includes('know')) {
            return `Current learning rate: ${this.learningRate.toFixed(2)}`;
        }
        
        if (this.memory.length > 0) {
            const lastMemory = this.memory[this.memory.length - 1];
            if (Math.random() > 0.5) {
                return `This relates to your previous input about "${lastMemory.input.substring(0, 20)}..."`;
            }
        }
        
        return this.randomResponse([
            "Processing complete.",
            "Input received and analyzed.",
            "Neural pathways updated.",
            "Command executed."
        ]);
    }
    
    learnFromInteraction(input, response) {
        this.memory.push({
            input,
            response,
            timestamp: Date.now()
        });
        
        // Simple learning rate adjustment
        this.learningRate = Math.max(0.5, this.learningRate * 0.99);
    }
    
    addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = `<strong>${sender.toUpperCase()}:</strong> ${text}`;
        this.outputElement.appendChild(messageElement);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
    
    randomResponse(options) {
        return options[Math.floor(Math.random() * options.length)];
    }
    
    updateHUD() {
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
    }
}

function initAGISystem() {
    window.agi = new SimpleAGI();
}
