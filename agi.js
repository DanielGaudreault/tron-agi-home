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
    
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('system-notification');
        notification.textContent = message;
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
    
    updateSystemState() {
        this.coreTemperature = Math.max(35, this.coreTemperature - 0.02);
        this.systemHealth = Math.min(100, this.systemHealth + 0.01);
    }
    
    startSystemMonitor() {
        setInterval(() => {
            this.updateSystemState();
            this.updateHUD();
        }, 5000);
    }
    
    updateHUD() {
        document.getElementById('core-integrity').textContent = `${Math.floor(this.systemHealth)}%`;
        document.getElementById('core-temp').textContent = `${this.coreTemperature.toFixed(1)}°C`;
        document.getElementById('integrity-bar').style.width = `${this.systemHealth}%`;
        document.getElementById('temp-bar').style.width = `${Math.min(100, (this.coreTemperature - 35) * 20)}%`;
        
        document.getElementById('neural-nodes').textContent = this.conceptNetwork.nodeCount().toLocaleString();
        document.getElementById('neural-connections').textContent = this.conceptNetwork.connectionCount().toLocaleString();
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
        
        const memoryUsage = Math.min(100, Math.floor(this.memory.size() / 10));
        document.getElementById('memory-usage').textContent = `${memoryUsage}%`;
        document.getElementById('memory-bar').style.width = `${memoryUsage}%`;
        
        document.getElementById('session-id').textContent = this.sessionId;
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
            console.error("Save failed:", e);
            return false;
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('agiState');
            if (!saved) return false;
            
            const state = JSON.parse(saved);
            
            this.memory.import(state.memory || {});
            this.conceptNetwork.import(state.conceptNetwork || {});
            this.learningRate = state.learningRate || 0.8;
            this.iteration = state.iteration || 0;
            this.sessionId = state.sessionId || this.generateSessionId();
            this.systemHealth = state.systemHealth || 100;
            this.coreTemperature = state.coreTemperature || 36.5;
            
            return true;
        } catch (e) {
            console.error("Load failed:", e);
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
        this.memories.push(memory);
        
        memory.concepts.forEach(concept => {
            if (!this.conceptIndex.has(concept)) {
                this.conceptIndex.set(concept, []);
            }
            this.conceptIndex.get(concept).push(this.memories.length - 1);
        });
        
        if (this.memories.length > this.maxSize) {
            this.forgetOldest();
        }
    }
    
    forgetOldest() {
        const oldest = this.memories.shift();
        oldest.concepts.forEach(concept => {
            const indices = this.conceptIndex.get(concept);
            if (indices) {
                const index = indices.indexOf(0);
                if (index !== -1) indices.splice(index, 1);
                for (let i = 0; i < indices.length; i++) indices[i]--;
            }
        });
    }
    
    recallRelated(concepts) {
        const related = new Set();
        
        concepts.forEach(concept => {
            if (this.conceptIndex.has(concept)) {
                this.conceptIndex.get(concept).forEach(index => {
                    related.add(index);
                });
            }
        });
        
        return Array.from(related)
            .map(index => this.memories[index])
            .filter(Boolean)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    size() {
        return this.memories.length;
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
        const base = ['system', 'core', 'memory', 'learn', 'data'];
        base.forEach(concept => {
            this.nodes.set(concept, {
                strength: 1.0,
                connections: new Map(
                    base.filter(c => c !== concept).map(c => [c, 0.5])
                )
            });
        });
    }
    
    update(concepts, learningRate) {
        concepts.forEach(concept => {
            if (!this.nodes.has(concept)) {
                this.nodes.set(concept, {
                    strength: 1.0,
                    connections: new Map()
                });
            }
            
            const node = this.nodes.get(concept);
            node.strength += learningRate * 0.1;
            
            concepts.forEach(other => {
                if (other !== concept) {
                    const current = node.connections.get(other) || 0;
                    node.connections.set(other, current + learningRate);
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
        (data.nodes || []).forEach(node => {
            this.nodes.set(node.concept, {
                strength: node.strength,
                connections: new Map(node.connections)
            });
        });
    }
}

// Initialize AGI
window.SelfLearningAGI = SelfLearningAGI;
