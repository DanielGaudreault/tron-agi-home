class TRON_AGI {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.memory = new NeuralMatrix();
        this.learningRate = 0.85;
        this.interactionCount = 0;
        this.isProcessing = false;
        
        this.initElements();
        this.initEventListeners();
        this.startSystemMonitor();
        
        this.loadState();
        this.showSystemMessage(`TRON AGI CORE ONLINE - SESSION ${this.sessionId}`);
        this.updateHUD();
    }
    
    initElements() {
        this.outputElement = document.getElementById('console-output');
        this.inputElement = document.getElementById('user-input');
        this.submitButton = document.getElementById('submit-btn');
    }
    
    initEventListeners() {
        this.submitButton.addEventListener('click', () => this.processInput());
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processInput();
        });
    }
    
    processInput() {
        if (this.isProcessing) {
            this.showSystemMessage("SYSTEM BUSY - PROCESSING PREVIOUS INPUT");
            return;
        }
        
        const input = this.inputElement.value.trim();
        if (!input) {
            this.showSystemMessage("INPUT REQUIRED");
            return;
        }
        
        this.addMessage('user', input);
        this.inputElement.value = '';
        this.isProcessing = true;
        this.submitButton.classList.add('processing');
        this.triggerEnergyPulse();
        
        setTimeout(() => {
            try {
                const processed = this.understand(input);
                const response = this.generateResponse(processed);
                
                setTimeout(() => {
                    this.addMessage('ai', response);
                    this.learnFromInteraction(input, response);
                    this.isProcessing = false;
                    this.submitButton.classList.remove('processing');
                    this.updateHUD();
                    
                    if (this.interactionCount % 5 === 0) {
                        this.saveState();
                    }
                }, 500 + Math.random() * 1000);
                
            } catch (error) {
                console.error("Processing error:", error);
                this.showSystemMessage(`SYSTEM ERROR: ${error.message}`);
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
            timestamp: Date.now()
        });
        
        this.memory.updateConceptNetwork(concepts, this.learningRate);
        
        this.interactionCount++;
        this.adjustLearningRate();
        
        return { tokens, concepts, sentiment };
    }
    
    generateResponse(processedInput) {
        const { concepts, sentiment } = processedInput;
        const context = this.memory.recallRelatedContext(concepts);
        
        // Response strategies
        if (this.isGreeting(concepts)) {
            return this.randomResponse([
                "GREETINGS USER",
                "SYSTEM ONLINE - AWAITING INPUT",
                "TRON AGI CORE READY"
            ]);
        }
        
        if (this.isAboutSystem(concepts)) {
            const stats = this.memory.getStats();
            return `SYSTEM STATUS:\n- LEARNING RATE: ${this.learningRate.toFixed(2)}\n- MEMORY NODES: ${stats.nodes}\n- CONCEPT LINKS: ${stats.connections}`;
        }
        
        if (sentiment.score < -0.3) {
            return this.randomResponse([
                "NEGATIVE SENTIMENT DETECTED - ADJUSTING PARAMETERS",
                "FEEDBACK ACKNOWLEDGED - SYSTEM ADAPTING",
                "CRITIQUE PROCESSED - OPTIMIZING RESPONSES"
            ]);
        }
        
        if (context.length > 0) {
            const relatedConcept = context[0].concepts[0] || "PREVIOUS INPUT";
            return `RELATED TO ${relatedConcept.toUpperCase()}:\n${this.generateContextualResponse(context)}`;
        }
        
        return this.randomResponse([
            "INPUT PROCESSED - KNOWLEDGE INTEGRATED",
            "NEURAL MATRIX UPDATED",
            "RESPONSE GENERATED - LEARNING RATE: " + this.learningRate.toFixed(2),
            "COMMAND EXECUTED - SYSTEM OPTIMIZING"
        ]);
    }
    
    learnFromInteraction(input, response) {
        // Reinforcement learning - strengthen used concepts
        const concepts = this.extractConcepts(this.tokenize(input + " " + response));
        this.memory.reinforceConcepts(concepts, this.learningRate * 0.1);
    }
    
    adjustLearningRate() {
        // Dynamic learning rate adjustment
        if (this.interactionCount < 20) {
            this.learningRate = Math.min(0.95, this.learningRate + 0.01);
        } else {
            this.learningRate = Math.max(0.3, this.learningRate * 0.995);
        }
    }
    
    // Helper methods
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
    
    extractConcepts(tokens) {
        const stopWords = new Set(['the', 'and', 'a', 'an', 'is', 'are', 'i', 'you']);
        return tokens.filter(t => t.length > 3 && !stopWords.has(t));
    }
    
    analyzeSentiment(text) {
        const positive = ['good', 'great', 'excellent', 'happy', 'like', 'love'];
        const negative = ['bad', 'terrible', 'hate', 'awful', 'angry'];
        
        const words = this.tokenize(text);
        let score = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) score += 1;
            if (negative.includes(word)) score -= 1;
        });
        
        return {
            score: Math.max(-1, Math.min(1, score / 5)),
            words: words.length
        };
    }
    
    isGreeting(concepts) {
        return ['hello', 'hi', 'greet'].some(c => concepts.includes(c));
    }
    
    isAboutSystem(concepts) {
        return ['system', 'status', 'learn', 'memory'].some(c => concepts.includes(c));
    }
    
    generateContextualResponse(context) {
        const lastInteraction = context[0];
        const concepts = lastInteraction.concepts.join(', ');
        return `CONTEXT: ${concepts}\nPREVIOUS: "${lastInteraction.input.substring(0, 30)}${lastInteraction.input.length > 30 ? '...' : ''}"`;
    }
    
    randomResponse(options) {
        return options[Math.floor(Math.random() * options.length)];
    }
    
    addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = text;
        this.outputElement.appendChild(messageElement);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
    
    showSystemMessage(message) {
        this.addMessage('system', message);
    }
    
    triggerEnergyPulse() {
        const pulse = document.getElementById('energy-pulse');
        pulse.style.opacity = '0.5';
        setTimeout(() => {
            pulse.style.opacity = '0';
        }, 300);
    }
    
    updateHUD() {
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
        
        const stats = this.memory.getStats();
        document.getElementById('memory-nodes').textContent = stats.nodes.toLocaleString();
        document.getElementById('concept-links').textContent = stats.connections.toLocaleString();
        document.getElementById('session-id').textContent = this.sessionId;
    }
    
    startSystemMonitor() {
        setInterval(() => {
            this.updateHUD();
        }, 3000);
    }
    
    generateSessionId() {
        return 'TRON-AGI-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    
    saveState() {
        const state = {
            memory: this.memory.export(),
            learningRate: this.learningRate,
            interactionCount: this.interactionCount,
            sessionId: this.sessionId
        };
        
        try {
            localStorage.setItem('tronAGIState', JSON.stringify(state));
            this.showSystemMessage("SYSTEM STATE SAVED");
            return true;
        } catch (e) {
            console.error("Save failed:", e);
            return false;
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('tronAGIState');
            if (!saved) return false;
            
            const state = JSON.parse(saved);
            
            this.memory.import(state.memory || {});
            this.learningRate = state.learningRate || 0.85;
            this.interactionCount = state.interactionCount || 0;
            this.sessionId = state.sessionId || this.generateSessionId();
            
            this.showSystemMessage("PREVIOUS SESSION LOADED");
            return true;
        } catch (e) {
            console.error("Load failed:", e);
            return false;
        }
    }
}

class NeuralMatrix {
    constructor() {
        this.memories = [];
        this.concepts = new Map();
        this.conceptLinks = new Map();
        this.maxSize = 1000;
    }
    
    store(memory) {
        this.memories.push(memory);
        
        // Index concepts
        memory.concepts.forEach(concept => {
            if (!this.concepts.has(concept)) {
                this.concepts.set(concept, {
                    strength: 1.0,
                    lastUsed: Date.now()
                });
            } else {
                const conceptData = this.concepts.get(concept);
                conceptData.strength += 0.1;
                conceptData.lastUsed = Date.now();
            }
        });
        
        // Maintain memory size
        if (this.memories.length > this.maxSize) {
            this.memories.shift();
        }
    }
    
    updateConceptNetwork(concepts, learningRate) {
        concepts.forEach(concept => {
            concepts.forEach(otherConcept => {
                if (concept !== otherConcept) {
                    const linkKey = `${concept}-${otherConcept}`;
                    const currentStrength = this.conceptLinks.get(linkKey) || 0;
                    this.conceptLinks.set(linkKey, currentStrength + learningRate);
                }
            });
        });
    }
    
    reinforceConcepts(concepts, amount) {
        concepts.forEach(concept => {
            if (this.concepts.has(concept)) {
                const data = this.concepts.get(concept);
                data.strength += amount;
                data.lastUsed = Date.now();
            }
        });
    }
    
    recallRelatedContext(concepts) {
        if (concepts.length === 0) return [];
        
        // Find memories with matching concepts
        const related = this.memories.filter(memory => 
            memory.concepts.some(c => concepts.includes(c))
        );
        
        // Sort by relevance (number of matching concepts)
        return related.sort((a, b) => {
            const aMatches = a.concepts.filter(c => concepts.includes(c)).length;
            const bMatches = b.concepts.filter(c => concepts.includes(c)).length;
            return bMatches - aMatches;
        }).slice(0, 3); // Return top 3 related memories
    }
    
    getStats() {
        return {
            nodes: this.concepts.size,
            connections: this.conceptLinks.size,
            memories: this.memories.length
        };
    }
    
    export() {
        return {
            memories: this.memories,
            concepts: Array.from(this.concepts.entries()),
            conceptLinks: Array.from(this.conceptLinks.entries()),
            maxSize: this.maxSize
        };
    }
    
    import(data) {
        this.memories = data.memories || [];
        this.concepts = new Map(data.concepts || []);
        this.conceptLinks = new Map(data.conceptLinks || []);
        this.maxSize = data.maxSize || 1000;
    }
}

// Initialize when loaded
window.TRON_AGI = TRON_AGI;
