class SelfLearningAGI {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.memory = new NeuralMemory();
        this.conceptNetwork = new ConceptNetwork();
        this.learningRate = 0.8;
        this.iteration = 0;
        this.systemHealth = 100;
        this.coreTemperature = 36.5;
        this.isProcessing = false;
        this.voiceEnabled = false;
        
        this.initElements();
        this.initEventListeners();
        this.initVoiceRecognition();
        this.startSystemMonitor();
        
        this.loadState();
        
        this.logSystemMessage(`TRON AGI CORE v3.1 initialized`);
        this.logSystemMessage(`Session ID: ${this.sessionId}`);
        this.logSystemMessage(`Ready for interaction`);
        
        this.updateHUD();
    }
    
    initElements() {
        this.outputElement = document.getElementById('console-output');
        this.inputElement = document.getElementById('user-input');
        this.submitButton = document.getElementById('submit-btn');
    }
    
    initEventListeners() {
        // Submit on button click
        this.submitButton.addEventListener('click', () => this.processInput());
        
        // Submit on Enter key
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processInput();
        });
        
        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveState();
            this.showNotification("System state saved");
        });
        
        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });
    }
    
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.voiceRecognition = new webkitSpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.inputElement.value = transcript;
                this.processInput();
            };
            
            this.voiceRecognition.onerror = (event) => {
                this.logSystemMessage(`Voice error: ${event.error}`);
                this.setVoiceEnabled(false);
            };
        } else {
            document.getElementById('voice-btn').style.display = 'none';
        }
    }
    
    toggleVoiceRecognition() {
        if (!this.voiceRecognition) return;
        
        this.voiceEnabled = !this.voiceEnabled;
        const voiceBtn = document.getElementById('voice-btn');
        
        if (this.voiceEnabled) {
            voiceBtn.classList.add('active');
            this.voiceRecognition.start();
            this.logSystemMessage("Voice input enabled");
        } else {
            voiceBtn.classList.remove('active');
            this.voiceRecognition.stop();
            this.logSystemMessage("Voice input disabled");
        }
    }
    
    processInput() {
        if (this.isProcessing) {
            this.showNotification("System busy processing");
            return;
        }
        
        const input = this.inputElement.value.trim();
        if (!input) {
            this.showNotification("Input required");
            return;
        }
        
        this.logMessage('user', input);
        this.inputElement.value = '';
        this.isProcessing = true;
        this.submitButton.classList.add('processing');
        
        setTimeout(() => {
            try {
                const processed = this.understand(input);
                
                setTimeout(() => {
                    const response = this.generateResponse(processed);
                    this.logMessage('ai', response);
                    
                    this.isProcessing = false;
                    this.submitButton.classList.remove('processing');
                    
                    this.updateSystemState();
                    this.updateHUD();
                    
                    if (this.iteration % 5 === 0) {
                        this.saveState();
                    }
                }, 500 + Math.random() * 1000);
            } catch (error) {
                console.error("Processing error:", error);
                this.logSystemMessage(`Error: ${error.message}`);
                this.isProcessing = false;
                this.submitButton.classList.remove('processing');
            }
        }, 300);
    }
    
    understand(input) {
        const tokens = this.tokenize(input);
        const concepts = this.extractConcepts(tokens);
        const sentiment = this.analyzeSentiment(input);
        
        this.memory.store({
            input,
            tokens,
            concepts,
            sentiment,
            timestamp: Date.now(),
            session: this.sessionId
        });
        
        this.conceptNetwork.update(concepts, this.learningRate);
        
        this.iteration++;
        this.coreTemperature += 0.1;
        this.systemHealth = Math.max(0, this.systemHealth - 0.05);
        
        if (this.iteration % 10 === 0) {
            this.learningRate = Math.max(0.2, this.learningRate * 0.98);
        }
        
        return { tokens, concepts, sentiment };
    }
    
    generateResponse({ tokens, concepts, sentiment }) {
        const context = this.memory.recallRelated(concepts);
        
        if (this.isGreeting(concepts)) {
            return this.randomResponse([
                "Greetings, user.",
                "Hello. System ready.",
                "Connection established."
            ]);
        }
        
        if (this.isAboutLearning(concepts)) {
            return `Learning rate: ${(this.learningRate * 100).toFixed(1)}%`;
        }
        
        if (sentiment.score < -0.3) {
            return this.randomResponse([
                "Negative input detected.",
                "Adjusting parameters.",
                "Feedback received."
            ]);
        }
        
        if (context.length > 0) {
            return `Related to previous input about "${context[0].concepts[0]}"`;
        }
        
        return this.randomResponse([
            "Processing complete.",
            "Input assimilated.",
            "Neural pathways updated."
        ]);
    }
    
    isGreeting(concepts) {
        return ['hello', 'hi', 'greet'].some(w => concepts.includes(w));
    }
    
    isAboutLearning(concepts) {
        return ['learn', 'knowledge', 'memory'].some(w => concepts.includes(w));
    }
    
    tokenize(input) {
        return input.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
    
    extractConcepts(tokens) {
        const common = new Set(['the', 'and', 'a', 'an', 'is', 'are', 'i', 'you']);
        return tokens.filter(t => t.length > 3 && !common.has(t));
    }
    
    analyzeSentiment(text) {
        const positive = ['good', 'great', 'happy', 'like'];
        const negative = ['bad', 'terrible', 'hate', 'angry'];
        
        const words = this.tokenize(text);
        let score = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) score += 1;
            if (negative.includes(word)) score -= 1;
        });
        
        return { score: score / 5, wordCount: words.length };
    }
    
    randomResponse(options) {
        return options[Math.floor(Math.random() * options.length)];
    }
    
    logMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageElement.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="sender">${sender.toUpperCase()}:</span>
            <span class="content">${message}</span>
        `;
        
        this.outputElement.appendChild(messageElement);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
    
    logSystemMessage(message) {
        this.logMessage('system', message);
    }
    
