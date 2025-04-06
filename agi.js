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
        this.logSystemMessage(`Neural network initialized with ${this.conceptNetwork.nodeCount()} base concepts`);
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

    generateContextualResponse(context, currentConcepts) {
        // Find most relevant context item
        const mostRelevant = context.reduce((prev, current) => 
            current.concepts.filter(c => currentConcepts.includes(c)).length > 
            prev.concepts.filter(c => currentConcepts.includes(c)).length ? current : prev
        );
        
        const sharedConcepts = mostRelevant.concepts.filter(c => currentConcepts.includes(c));
        
        return this.randomResponse([
            `My neural connections associate this with your previous mention of "${sharedConcepts.join(', ')}".`,
            `This relates to our earlier discussion about "${mostRelevant.input.substring(0, 30)}${mostRelevant.input.length > 30 ? '...' : ''}".`,
            `My knowledge matrix connects this concept with previous interactions.`,
            `This input strengthens existing neural pathways about "${sharedConcepts[0]}".`
        ]);
    }

    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'happy', 'awesome', 'like', 'love'];
        const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'upset', 'sad'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });
        
        return {
            score: Math.max(-1, Math.min(1, score / 5)),
            words: words.length
        };
    }

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

    randomResponse(options) {
        return options[Math.floor(Math.random() * options.length)];
    }

    tokenize(input) {
        return input.toLowerCase().split(/\s+/);
    }

    extractConcepts(tokens) {
        // Filter out common words and keep meaningful concepts
        const commonWords = ['the', 'and', 'a', 'an', 'is', 'are', 'i', 'you', 'we', 'they'];
        return tokens.filter(token => 
            token.length > 3 && 
            !commonWords.includes(token) && 
            !/\d+/.test(token)
        );
    }

    generateSessionId() {
        return 'TRON-ALC-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
}

class NeuralMemory {
    constructor() {
        this.data = [];
        this.maxSize = 1000;
        this.conceptIndex = new Map();
    }
    
    store(item) {
        this.data.push(item);
        
        // Index concepts for faster lookup
        item.concepts.forEach(concept => {
            if (!this.conceptIndex.has(concept)) {
                this.conceptIndex.set(concept, []);
            }
            this.conceptIndex.get(concept).push(this.data.length - 1);
        });
        
        // Maintain memory limits
        if (this.data.length > this.maxSize) {
            const removed = this.data.shift();
            removed.concepts.forEach(concept => {
                const indices = this.conceptIndex.get(concept);
                if (indices) {
                    const index = indices.indexOf(0);
                    if (index !== -1) {
                        indices.splice(index, 1);
                        // Update remaining indices
                        for (let i = 0; i < indices.length; i++) {
                            indices[i] -= 1;
                        }
                    }
                }
            });
        }
    }
    
    recallRelated(concepts) {
        const relatedIndices = new Set();
        
        concepts.forEach(concept => {
            if (this.conceptIndex.has(concept)) {
                this.conceptIndex.get(concept).forEach(index => {
                    relatedIndices.add(index);
                });
            }
        });
        
        return Array.from(relatedIndices)
            .map(index => this.data[index])
            .filter(Boolean)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    getRecent(count) {
        return [...this.data]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }
    
    size() {
        return this.data.length;
    }
    
    getStats() {
        const allConcepts = new Set();
        this.data.forEach(item => {
            item.concepts.forEach(concept => allConcepts.add(concept));
        });
        
        return {
            count: this.data.length,
            uniqueConcepts: allConcepts.size
        };
    }
    
    export() {
        return {
            data: this.data,
            maxSize: this.maxSize,
            conceptIndex: Array.from(this.conceptIndex.entries())
        };
    }
    
    import(state) {
        this.data = state.data || [];
        this.maxSize = state.maxSize || 1000;
        this.conceptIndex = new Map(state.conceptIndex || []);
    }
}

class ConceptNetwork {
    constructor() {
        this.concepts = new Map();
        this.initializeBaseConcepts();
    }
    
    initializeBaseConcepts() {
        const baseConcepts = [
            'learn', 'knowledge', 'memory', 'think', 'understand',
            'system', 'core', 'network', 'process', 'analyze',
            'input', 'output', 'response', 'question', 'answer'
        ];
        
        baseConcepts.forEach(concept => {
            this.concepts.set(concept, {
                strength: 1.0,
                connections: new Map(baseConcepts
                    .filter(c => c !== concept)
                    .map(c => [c, 0.5])
            });
        });
    }
    
    update(newConcepts, learningRate) {
        newConcepts.forEach(concept => {
            // Add new concept if not exists
            if (!this.concepts.has(concept)) {
                this.concepts.set(concept, {
                    strength: 1.0,
                    connections: new Map()
                });
            }
            
            // Strengthen concept
            const node = this.concepts.get(concept);
            node.strength += learningRate * 0.1;
            
            // Create/strengthen connections between concepts
            newConcepts.forEach(otherConcept => {
                if (otherConcept !== concept) {
                    const currentWeight = node.connections.get(otherConcept) || 0;
                    node.connections.set(otherConcept, currentWeight + learningRate);
                }
            });
        });
    }
    
    nodeCount() {
        return this.concepts.size;
    }
    
    connectionCount() {
        let count = 0;
        this.concepts.forEach(node => {
            count += node.connections.size;
        });
        return count;
    }
    
    size() {
        return this.concepts.size;
    }
    
    export() {
        const exportData = {
            concepts: Array.from(this.concepts.entries()).map(([key, value]) => ({
                concept: key,
                strength: value.strength,
                connections: Array.from(value.connections.entries())
            }))
        };
        return exportData;
    }
    
    import(state) {
        this.concepts = new Map();
        (state.concepts || []).forEach(item => {
            this.concepts.set(item.concept, {
                strength: item.strength,
                connections: new Map(item.connections)
            });
        });
    }
}
