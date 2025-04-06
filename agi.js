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
        this.voiceRecognition = null;
        
        this.initElements();
        this.initEventListeners();
        this.initSounds();
        this.initVoiceRecognition();
        this.startSystemMonitor();
        
        this.loadState();
        
        this.logSystemMessage(`TRON AGI CORE v3.0 initialized`);
        this.logSystemMessage(`Session ID: ${this.sessionId}`);
        this.logSystemMessage(`Ready for user interaction`);
        
        this.updateHUD();
    }
    
    initElements() {
        this.outputElement = document.getElementById('console-output');
        this.inputElement = document.getElementById('user-input');
        this.submitButton = document.getElementById('submit-btn');
        this.saveButton = document.getElementById('save-btn');
        this.voiceButton = document.getElementById('voice-btn');
    }
    
    initEventListeners() {
        // Submit on button click
        this.submitButton.addEventListener('click', () => this.processInput());
        
        // Submit on Enter key
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processInput();
            }
        });
        
        // Save button
        this.saveButton.addEventListener('click', () => {
            this.saveState();
            this.showNotification("System state saved successfully");
        });
        
        // Voice button
        this.voiceButton.addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });
    }
    
    initSounds() {
        this.sounds = {
            input: document.getElementById('input-sound'),
            response: document.getElementById('response-sound'),
            error: document.getElementById('error-sound')
        };
        
        // Set volumes
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });
    }
    
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.voiceRecognition = new webkitSpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.inputElement.value = transcript;
                this.processInput();
            };
            
            this.voiceRecognition.onerror = (event) => {
                this.logSystemMessage(`Voice recognition error: ${event.error}`);
                this.setVoiceEnabled(false);
            };
            
            this.voiceRecognition.onend = () => {
                if (this.voiceEnabled) {
                    this.voiceRecognition.start();
                }
            };
        } else {
            this.logSystemMessage("Voice recognition not supported in this browser");
            this.voiceButton.style.display = 'none';
        }
    }
    
    toggleVoiceRecognition() {
        if (!this.voiceRecognition) return;
        
        this.voiceEnabled = !this.voiceEnabled;
        
        if (this.voiceEnabled) {
            this.voiceButton.classList.add('active');
            this.voiceRecognition.start();
            this.logSystemMessage("Voice recognition activated");
            this.showNotification("Voice input enabled");
        } else {
            this.voiceButton.classList.remove('active');
            this.voiceRecognition.stop();
            this.logSystemMessage("Voice recognition deactivated");
            this.showNotification("Voice input disabled");
        }
    }
    
    processInput() {
        if (this.isProcessing) {
            this.showNotification("System is currently processing");
            return;
        }
        
        const input = this.inputElement.value.trim();
        if (!input) {
            this.showNotification("Please enter input");
            return;
        }
        
        // Play input sound
        this.playSound('input');
        
        // Display user message
        this.logMessage('user', input);
        this.inputElement.value = '';
        this.isProcessing = true;
        this.submitButton.classList.add('processing');
        
        // Process input with delay to simulate thinking
        setTimeout(() => {
            try {
                // Understand input
                const processed = this.understand(input);
                
                // Generate response after another delay
                setTimeout(() => {
                    const response = this.generateResponse(processed);
                    this.logMessage('ai', response);
                    this.playSound('response');
                    
                    this.isProcessing = false;
                    this.submitButton.classList.remove('processing');
                    
                    // Update system stats
                    this.updateSystemState();
                    this.updateHUD();
                    
                    // Auto-save periodically
                    if (this.iteration % 5 === 0) {
                        this.saveState();
                    }
                    
                }, 500 + Math.random() * 1000);
                
            } catch (error) {
                console.error("Processing error:", error);
                this.logSystemMessage(`Processing error: ${error.message}`);
                this.playSound('error');
                this.isProcessing = false;
                this.submitButton.classList.remove('processing');
            }
        }, 300);
    }
    
    understand(input) {
        // Tokenize input
        const tokens = this.tokenize(input);
        
        // Extract meaningful concepts
        const concepts = this.extractConcepts(tokens);
        
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(input);
        
        // Store in memory
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
        
        // Update system state
        this.iteration++;
        this.coreTemperature += 0.1;
        this.systemHealth = Math.max(0, this.systemHealth - 0.05);
        
        // Adjust learning rate
        if (this.iteration % 10 === 0) {
            this.learningRate = Math.max(0.2, this.learningRate * 0.98);
        }
        
        return { tokens, concepts, sentiment };
    }
    
    generateResponse({ tokens, concepts, sentiment }) {
        // Get relevant context
        const context = this.memory.recallRelated(concepts);
        const recentHistory = this.memory.getRecent(3);
        
        // Response strategies
        if (this.isGreeting(concepts)) {
            return this.getGreetingResponse();
        }
        
        if (this.isAboutLearning(concepts)) {
            return this.getLearningStatusResponse();
        }
        
        if (this.isNegativeSentiment(sentiment)) {
            return this.getNegativeSentimentResponse();
        }
        
        if (context.length > 0) {
            return this.getContextualResponse(context, concepts);
        }
        
        // Default response
        return this.getDefaultResponse();
    }
    
    // Helper methods
    isGreeting(concepts) {
        const greetingWords = ['hello', 'hi', 'greet', 'hey', 'salutation'];
        return greetingWords.some(word => concepts.includes(word));
    }
    
    isAboutLearning(concepts) {
        const learningWords = ['learn', 'knowledge', 'memory', 'remember', 'teach'];
        return learningWords.some(word => concepts.includes(word));
    }
    
    isNegativeSentiment(sentiment) {
        return sentiment.score < -0.3;
    }
    
    getGreetingResponse() {
        const greetings = [
            "Greetings, user.",
            "Hello. I am ready to assist.",
            "Salutations. How may I help?",
            "Connection established. Hello.",
            "Recognition protocol activated. Greetings."
        ];
        return this.randomResponse(greetings);
    }
    
    getLearningStatusResponse() {
        const stats = this.memory.getStats();
        return `My neural matrix contains ${stats.count} memories with ${stats.uniqueConcepts} unique concepts. ` +
               `Current learning efficiency: ${(this.learningRate * 100).toFixed(1)}%`;
    }
    
    getNegativeSentimentResponse() {
        const responses = [
            "I detect negative sentiment. How may I improve?",
            "My analysis indicates dissatisfaction. Please elaborate.",
            "I will adjust my parameters based on this feedback."
        ];
        return this.randomResponse(responses);
    }
    
    getContextualResponse(context, currentConcepts) {
        const mostRelevant = context[0];
        const sharedConcepts = mostRelevant.concepts.filter(c => currentConcepts.includes(c));
        
        const responses = [
            `This relates to our previous discussion about "${sharedConcepts.join(', ')}".`,
            `My neural connections associate this with "${mostRelevant.input.substring(0, 30)}${mostRelevant.input.length > 30 ? '...' : ''}".`,
            `This strengthens existing pathways about "${sharedConcepts[0]}".`
        ];
        return this.randomResponse(responses);
    }
    
    getDefaultResponse() {
        const responses = [
            "Processing... analyzing neural pathways.",
            "Input assimilated into knowledge matrix.",
            "My learning algorithms are adapting.",
            "Concept integration complete.",
            "Neural connections forming.",
            "Knowledge acquisition in progress."
        ];
        return this.randomResponse(responses);
    }
    
    tokenize(input) {
        return input.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(token => token.length > 0);
    }
    
    extractConcepts(tokens) {
        const commonWords = new Set(['the', 'and', 'a', 'an', 'is', 'are', 'i', 'you', 'we', 'they', 'this', 'that']);
        return tokens.filter(token => 
            token.length > 3 && 
            !commonWords.has(token) && 
            !/\d+/.test(token)
        );
    }
    
    analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'like', 'love', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'dislike'];
        
        const words = this.tokenize(text);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });
        
        // Normalize score
        score = Math.max(-1, Math.min(1, score / 5));
        
        return { score, wordCount: words.length };
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
    
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('system-notification');
        notification.textContent = message;
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
    
    playSound(type) {
        try {
            if (this.sounds[type]) {
                this.sounds[type].currentTime = 0;
                this.sounds[type].play();
            }
        } catch (e) {
            console.log("Audio error:", e);
        }
    }
    
    updateSystemState() {
        // Cool down over time
        this.coreTemperature = Math.max(35, this.coreTemperature - 0.02);
        
        // Recover health
        this.systemHealth = Math.min(100, this.systemHealth + 0.01);
    }
    
    startSystemMonitor() {
        setInterval(() => {
            this.updateSystemState();
            this.updateHUD();
        }, 5000);
    }
    
    updateHUD() {
        // Update core stats
        document.getElementById('core-integrity').textContent = `${Math.floor(this.systemHealth)}%`;
        document.getElementById('core-temp').textContent = `${this.coreTemperature.toFixed(1)}°C`;
        document.getElementById('integrity-bar').style.width = `${this.systemHealth}%`;
        document.getElementById('temp-bar').style.width = `${Math.min(100, (this.coreTemperature - 35) * 20)}%`;
        
        // Update neural stats
        document.getElementById('neural-nodes').textContent = this.conceptNetwork.nodeCount().toLocaleString();
        document.getElementById('neural-connections').textContent = this.conceptNetwork.connectionCount().toLocaleString();
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
        
        // Update memory stats
        const memoryUsage = Math.min(100, Math.floor(this.memory.size() / 10));
        document.getElementById('memory-usage').textContent = `${memoryUsage}%`;
        document.getElementById('memory-bar').style.width = `${memoryUsage}%`;
        
        // Update session ID
        document.getElementById('session-id').textContent = this.sessionId;
        
        // Visual feedback for system health
        if (this.systemHealth < 30) {
            document.querySelector('.core-status .panel-header').style.color = '#ff0033';
            document.querySelector('.core-status .panel-header').style.textShadow = '0 0 10px #ff0033';
        } else {
            document.querySelector('.core-status .panel-header').style.color = '';
            document.querySelector('.core-status .panel-header').style.textShadow = '';
        }
    }
    
    generateSessionId() {
        return 'TRON-AGI-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    
    saveState() {
        const state = {
            memory: this.memory.export(),
            conceptNetwork: this.conceptNetwork.export(),
            learningRate: this.learningRate,
            iteration: this.iteration,
            sessionId: this.sessionId,
            systemHealth: this.systemHealth,
            coreTemperature: this.coreTemperature
        };
        
        try {
            localStorage.setItem('agiState', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error("Failed to save state:", e);
            return false;
        }
    }
    
    loadState() {
        try {
            const savedState = localStorage.getItem('agiState');
            if (!savedState) return false;
            
            const state = JSON.parse(savedState);
            
            this.memory.import(state.memory || {});
            this.conceptNetwork.import(state.conceptNetwork || {});
            this.learningRate = state.learningRate || 0.8;
            this.iteration = state.iteration || 0;
            this.sessionId = state.sessionId || this.generateSessionId();
            this.systemHealth = state.systemHealth || 100;
            this.coreTemperature = state.coreTemperature || 36.5;
            
            this.logSystemMessage(`Loaded previous session with ${this.memory.size()} memories`);
            return true;
            
        } catch (e) {
            console.error("Failed to load state:", e);
            return false;
        }
    }
}

class NeuralMemory {
    constructor() {
        this.memories = [];
        this.conceptIndex = new Map();
        this.maxSize = 1000;
    }
    
    store(memory) {
        // Add to memories
        this.memories.push(memory);
        
        // Index concepts
        memory.concepts.forEach(concept => {
            if (!this.conceptIndex.has(concept)) {
                this.conceptIndex.set(concept, []);
            }
            this.conceptIndex.get(concept).push(this.memories.length - 1);
        });
        
        // Enforce memory limit
        if (this.memories.length > this.maxSize) {
            this.forgetOldest();
        }
    }
    
    forgetOldest() {
        if (this.memories.length === 0) return;
        
        const oldest = this.memories.shift();
        
        // Update concept index
        oldest.concepts.forEach(concept => {
            const indices = this.conceptIndex.get(concept);
            if (indices && indices.length > 0) {
                const index = indices.indexOf(0);
                if (index !== -1) {
                    indices.splice(index, 1);
                }
                
                // Decrement other indices
                for (let i = 0; i < indices.length; i++) {
                    indices[i]--;
                }
            }
        });
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
            .map(index => this.memories[index])
            .filter(Boolean)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    getRecent(count) {
        return this.memories
            .slice(-count)
            .reverse();
    }
    
    size() {
        return this.memories.length;
    }
    
    getStats() {
        const allConcepts = new Set();
        this.memories.forEach(memory => {
            memory.concepts.forEach(concept => allConcepts.add(concept));
        });
        
        return {
            count: this.memories.length,
            uniqueConcepts: allConcepts.size
        };
    }
    
    export() {
        return {
            memories: this.memories,
            conceptIndex: Array.from(this.conceptIndex.entries()),
            maxSize: this.maxSize
        };
    }
    
    import(data) {
        this.memories = data.memories || [];
        this.conceptIndex = new Map(data.conceptIndex || []);
        this.maxSize = data.maxSize || 1000;
    }
}

class ConceptNetwork {
    constructor() {
        this.nodes = new Map();
        this.initializeBaseConcepts();
    }
    
    initializeBaseConcepts() {
        const baseConcepts = [
            'system', 'core', 'memory', 'learn', 'knowledge',
            'process', 'think', 'understand', 'analyze', 'respond',
            'input', 'output', 'communication', 'data', 'information'
        ];
        
        baseConcepts.forEach(concept => {
            this.nodes.set(concept, {
                strength: 1.0,
                connections: new Map(
                    baseConcepts
                        .filter(c => c !== concept)
                        .map(c => [c, 0.5])
            });
        });
    }
    
    update(concepts, learningRate) {
        concepts.forEach(concept => {
            // Add new concept if not exists
            if (!this.nodes.has(concept)) {
                this.nodes.set(concept, {
                    strength: 1.0,
                    connections: new Map()
                });
            }
            
            // Strengthen concept
            const node = this.nodes.get(concept);
            node.strength += learningRate * 0.1;
            
            // Create/strengthen connections
            concepts.forEach(otherConcept => {
                if (otherConcept !== concept) {
                    const currentWeight = node.connections.get(otherConcept) || 0;
                    node.connections.set(otherConcept, currentWeight + learningRate);
                }
            });
        });
    }
    
    nodeCount() {
        return this.nodes.size;
    }
    
    connectionCount() {
        let count = 0;
        this.nodes.forEach(node => {
            count += node.connections.size;
        });
        return count;
    }
    
    export() {
        return {
            nodes: Array.from(this.nodes.entries()).map(([concept, data]) => ({
                concept,
                strength: data.strength,
                connections: Array.from(data.connections.entries())
            }))
        };
    }
    
    import(data) {
        this.nodes = new Map();
        (data.nodes || []).forEach(nodeData => {
            this.nodes.set(nodeData.concept, {
                strength: nodeData.strength,
                connections: new Map(nodeData.connections)
            });
        });
    }
}

// Initialize AGI when window loads
window.SelfLearningAGI = SelfLearningAGI;
