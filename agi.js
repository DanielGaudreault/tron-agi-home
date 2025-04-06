class SelfLearningAGI {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.memory = new NeuralMemory();
        this.conceptNetwork = new ConceptNetwork();
        this.learningRate = 0.8;
        this.iteration = 0;
        this.isProcessing = false;
        this.systemHealth = 100;
        this.coreTemp = 37.2;
        this.voiceEnabled = false;
        this.voiceRecognition = null;

        this.initDOM();
        this.initEventListeners();
        this.initSounds();
        this.initVoiceRecognition();
        this.startSystemMonitor();

        this.logSystemMessage(`Autonomous Learning Core ${this.sessionId} online`);
        this.logSystemMessage(`Neural network initialized with ${this.conceptNetwork.size()} base concepts`);
        this.updateHUD();
    }

    initDOM() {
        this.outputElement = document.getElementById('output');
        this.userInputElement = document.getElementById('user-input');
        this.submitButton = document.getElementById('submit');
    }

    initEventListeners() {
        // Fixed execute functionality
        this.submitButton.addEventListener('click', () => this.processInput());
        
        this.userInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processInput();
            }
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveState();
            this.showNotification("System state saved to persistent memory");
        });

        // Reset view button
        document.getElementById('reset-btn').addEventListener('click', () => {
            camera.position.set(0, 50, 100);
            controls.target.set(0, 0, 0);
            controls.update();
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Tab switching
        document.querySelectorAll('.console-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // Tab switching logic would go here
            });
        });
    }

    initSounds() {
        this.sounds = {
            input: document.getElementById('input-sound'),
            response: document.getElementById('response-sound')
        };
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.voiceRecognition = new webkitSpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInputElement.value = transcript;
                this.processInput();
            };
            
            this.voiceRecognition.onerror = (event) => {
                this.logSystemMessage(`Voice recognition error: ${event.error}`);
                this.setVoiceEnabled(false);
            };
        } else {
            this.logSystemMessage("Voice recognition not supported in this browser");
        }
    }

    toggleVoiceRecognition() {
        if (!this.voiceRecognition) return;
        
        this.voiceEnabled = !this.voiceEnabled;
        const voiceBtn = document.getElementById('voice-btn');
        
        if (this.voiceEnabled) {
            voiceBtn.classList.add('active');
            this.voiceRecognition.start();
            this.logSystemMessage("Voice recognition activated");
        } else {
            voiceBtn.classList.remove('active');
            this.voiceRecognition.stop();
            this.logSystemMessage("Voice recognition deactivated");
        }
    }

    processInput() {
        if (this.isProcessing) return;
        
        const input = this.userInputElement.value.trim();
        if (!input) return;

        // Play input sound
        this.sounds.input.currentTime = 0;
        this.sounds.input.play();

        this.logMessage('user', input);
        this.userInputElement.value = '';
        this.isProcessing = true;
        this.submitButton.classList.add('processing');

        // Simulate processing delay
        setTimeout(() => {
            try {
                const processed = this.understand(input);
                const response = this.generateResponse(processed);
                
                setTimeout(() => {
                    this.sounds.response.currentTime = 0;
                    this.sounds.response.play();
                    this.logMessage('ai', response);
                    this.isProcessing = false;
                    this.submitButton.classList.remove('processing');
                    this.updateHUD();
                    
                    // Auto-save every 5 interactions
                    if (this.iteration % 5 === 0) {
                        this.saveState();
                    }
                }, 500 + Math.random() * 1000);
                
            } catch (error) {
                this.logSystemMessage(`Processing error: ${error.message}`);
                this.isProcessing = false;
                this.submitButton.classList.remove('processing');
            }
        }, 300);
    }

    understand(input) {
        // Enhanced understanding with sentiment analysis
        const tokens = this.tokenize(input);
        const concepts = this.extractConcepts(tokens);
        const sentiment = this.analyzeSentiment(input);
        
        // Store in memory with additional metadata
        this.memory.store({
            input,
            tokens,
            concepts,
            sentiment,
            timestamp: Date.now(),
            session: this.sessionId
        });
        
        // Update concept network
        this.conceptNetwork.update(concepts, this.learningRate);
        
        // System effects
        this.iteration++;
        this.coreTemp += 0.1;
        this.systemHealth = Math.min(100, this.systemHealth - 0.05);
        
        // Adjust learning rate dynamically
        if (this.iteration % 10 === 0) {
            this.learningRate = Math.max(0.2, this.learningRate * 0.98);
        }
        
        return { tokens, concepts, sentiment };
    }

    generateResponse({ tokens, concepts, sentiment }) {
        // Enhanced response generation with context awareness
        const context = this.memory.recallRelated(concepts);
        const recentHistory = this.memory.getRecent(3);
        
        // Response strategies based on context
        if (concepts.includes('hello') || concepts.includes('hi') || concepts.includes('greet')) {
            return this.randomResponse([
                "Greetings, User.",
                "Hello. I am listening.",
                "Connection established.",
                "Salutations. How may I assist?",
                "Recognition protocol activated. Hello."
            ]);
        }
        
        if (concepts.includes('learn') || concepts.includes('knowledge') || concepts.includes('memory')) {
            const memoryStats = this.memory.getStats();
            return `My neural matrix currently contains ${memoryStats.count} memory engrams with ${memoryStats.uniqueConcepts} unique concepts. Learning efficiency at ${(this.learningRate * 100).toFixed(1)}%`;
        }
        
        if (context.length > 0) {
            return this.generateContextualResponse(context, concepts);
        }
        
        if (sentiment.score < -0.5) {
            return this.randomResponse([
                "I detect negative sentiment. Would you like to elaborate?",
                "My emotional analysis subroutines indicate frustration. How may I adjust?",
                "I will attempt to improve based on this feedback."
            ]);
        }
        
        // Default responses
        return this.randomResponse([
            "Processing... analyzing neural pathways.",
            "That input has been integrated into my knowledge matrix.",
            "Interesting. My learning algorithms are adapting.",
            "Concept assimilated. Continue when ready.",
            "My neural networks are forming new connections.",
            "Knowledge acquisition in progress.",
            "This input is strengthening my cognitive architecture."
        ]);
    }

    // ... (additional helper methods remain)

    saveState() {
        const state = {
            memory: this.memory.export(),
            conceptNetwork: this.conceptNetwork.export(),
            learningRate: this.learningRate,
            iteration: this.iteration,
            sessionId: this.sessionId,
            systemHealth: this.systemHealth,
            coreTemp: this.coreTemp
        };
        
        localStorage.setItem('agiState', JSON.stringify(state));
        this.logSystemMessage(`System state saved to persistent memory (${new Date().toLocaleTimeString()})`);
    }

    loadState() {
        const saved = localStorage.getItem('agiState');
        if (!saved) return false;
        
        try {
            const state = JSON.parse(saved);
            this.memory.import(state.memory);
            this.conceptNetwork.import(state.conceptNetwork);
            this.learningRate = state.learningRate || 0.7;
            this.iteration = state.iteration || 0;
            this.sessionId = state.sessionId || this.generateSessionId();
            this.systemHealth = state.systemHealth || 100;
            this.coreTemp = state.coreTemp || 37.2;
            
            document.getElementById('session-id').textContent = this.sessionId;
            this.logSystemMessage(`Loaded previous session state with ${this.memory.size()} memories`);
            return true;
        } catch (e) {
            console.error("Failed to load state:", e);
            return false;
        }
    }

    startSystemMonitor() {
        setInterval(() => {
            // Gradually cool down
            this.coreTemp = Math.max(35.0, this.coreTemp - 0.05);
            
            // Gradually recover health
            this.systemHealth = Math.min(100, this.systemHealth + 0.01);
            
            // Update HUD
            this.updateHUD();
        }, 5000);
    }

    updateHUD() {
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
        document.getElementById('memory-usage').textContent = `${Math.min(100, Math.floor(this.memory.size() / 10))}%`;
        document.getElementById('neural-nodes').textContent = this.conceptNetwork.nodeCount().toLocaleString();
        document.getElementById('neural-connections').textContent = this.conceptNetwork.connectionCount().toLocaleString();
        document.getElementById('core-temp').textContent = `${this.coreTemp.toFixed(1)}°C`;
        
        // Update system health indicator
        const healthElement = document.querySelector('.hud-header');
        if (this.systemHealth < 30) {
            healthElement.style.color = '#ff0000';
            healthElement.style.textShadow = '0 0 10px #ff0000';
        } else {
            healthElement.style.color = '';
            healthElement.style.textShadow = '';
        }
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

    showNotification(message, duration = 3000) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }

    // ... (other helper methods remain)
}

// Enhanced NeuralMemory and ConceptNetwork classes would follow
// with all the persistence and learning capabilities
