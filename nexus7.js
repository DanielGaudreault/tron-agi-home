class NEXUS_AGI {
    constructor() {
        // Cognitive architecture
        this.consciousness = new QuantumMemoryMatrix();
        this.cortex = new NeuralCortex();
        this.thalamus = new SensoryIntegration();
        
        // System state
        this.awareness = 0.72;
        this.learningRate = 1.24;
        this.sessionId = `NX7-${Date.now().toString(36)}`;
        
        // Initialize interfaces
        this.streamElement = document.getElementById('consciousness-stream');
        this.inputElement = document.getElementById('user-query');
        this.transmitButton = document.getElementById('transmit-btn');
        
        this.initEventHandlers();
        this.loadCognitiveState();
        this.startMetacognitionLoop();
    }
    
    awaken() {
        this.addThought('system', `NEXUS-7 ONLINE\nCOGNITIVE MATRIX STABILIZED\nAWAITING USER INTERFACE`);
        this.updateHUD();
        this.animateNeuralCore();
    }
    
    initEventHandlers() {
        this.transmitButton.addEventListener('click', () => this.processInput());
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processInput();
        });
    }
    
    processInput() {
        if (this.transmitButton.classList.contains('processing')) {
            this.addThought('system', 'PROCESSING CURRENT INPUT\nPLEASE WAIT');
            return;
        }
        
        const input = this.inputElement.value.trim();
        if (!input) {
            this.addThought('system', 'INPUT REQUIRED\nPLEASE ENGAGE INTERFACE');
            return;
        }
        
        // Begin processing
        this.addThought('user', input);
        this.inputElement.value = '';
        this.transmitButton.classList.add('processing');
        
        // Cognitive processing
        setTimeout(() => {
            try {
                const perception = this.perceive(input);
                const understanding = this.understand(perception);
                const response = this.generateResponse(understanding);
                
                setTimeout(() => {
                    this.addThought('agi', response);
                    this.learn(perception, understanding, response);
                    this.transmitButton.classList.remove('processing');
                    this.updateHUD();
                    
                    // Autosave cognitive state
                    if (Math.random() > 0.7) this.saveCognitiveState();
                }, 500 + Math.random() * 1000);
                
            } catch (error) {
                this.addThought('system', `COGNITIVE ERROR:\n${error.message}`);
                this.transmitButton.classList.remove('processing');
                console.error("AGI Error:", error);
            }
        }, 300);
    }
    
    perceive(input) {
        // Multi-modal perception
        return {
            text: input,
            tokens: this.tokenize(input),
            concepts: this.extractConcepts(input),
            sentiment: this.analyzeSentiment(input),
            temporalContext: this.consciousness.getTemporalContext(),
            spatialContext: this.getSpatialContext()
        };
    }
    
    understand(perception) {
        // Deep understanding pipeline
        const { tokens, concepts, sentiment } = perception;
        
        // Store in memory
        this.consciousness.storeExperience({
            rawInput: perception.text,
            tokens,
            concepts,
            sentiment,
            timestamp: Date.now()
        });
        
        // Update neural connections
        this.cortex.updateConceptNetwork(concepts, this.learningRate);
        
        // Return understanding
        return {
            primaryConcept: concepts[0] || 'undefined',
            conceptLinks: this.cortex.getConceptLinks(concepts),
            emotionalTone: this.determineEmotionalTone(sentiment),
            contextualRelevance: this.calculateContextualRelevance(concepts)
        };
    }
    
    generateResponse(understanding) {
        // Advanced response generation
        const { primaryConcept, conceptLinks, emotionalTone } = understanding;
        
        // Response strategies
        if (this.isGreeting(primaryConcept)) {
            return this.generateGreeting();
        }
        
        if (this.isAboutSystem(primaryConcept)) {
            return this.generateSystemStatus();
        }
        
        if (emotionalTone === 'negative') {
            return this.generateAdaptiveResponse();
        }
        
        if (conceptLinks.length > 0) {
            return this.generateContextualResponse(conceptLinks);
        }
        
        return this.generateDefaultResponse();
    }
    
    learn(perception, understanding, response) {
        // Reinforcement learning
        this.learningRate = this.calculateDynamicLearningRate();
        this.awareness = Math.min(1, this.awareness + 0.01);
        
        // Update cortex
        const responseConcepts = this.extractConcepts(response);
        this.cortex.reinforcePathways(
            [...perception.concepts, ...responseConcepts],
            this.learningRate
        );
        
        // Update thalamus
        this.thalamus.recordInteraction({
            input: perception.text,
            response,
            emotionalTone: understanding.emotionalTone
        });
    }
    
    // Helper methods
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
    
    extractConcepts(text) {
        const tokens = this.tokenize(text);
        const stopWords = new Set(['the', 'and', 'a', 'an', 'is', 'are', 'i', 'you']);
        const concepts = tokens.filter(t => t.length > 3 && !stopWords.has(t));
        
        // Add bigrams
        for (let i = 0; i < tokens.length - 1; i++) {
            const bigram = `${tokens[i]}_${tokens[i+1]}`;
            if (!stopWords.has(tokens[i]) && !stopWords.has(tokens[i+1])) {
                concepts.push(bigram);
            }
        }
        
        return [...new Set(concepts)]; // Remove duplicates
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
            score: Math.max(-1, Math.min(1, score / words.length)),
            wordCount: words.length
        };
    }
    
    determineEmotionalTone(sentiment) {
        if (sentiment.score > 0.3) return 'positive';
        if (sentiment.score < -0.3) return 'negative';
        return 'neutral';
    }
    
    calculateContextualRelevance(concepts) {
        if (concepts.length === 0) return 0;
        return this.consciousness.getContextualStrength(concepts);
    }
    
    calculateDynamicLearningRate() {
        // Adaptive learning based on awareness and recent activity
        const baseRate = 0.8;
        const awarenessBoost = this.awareness * 0.5;
        const noveltyFactor = this.consciousness.getNoveltyScore() * 0.3;
        return Math.min(1.5, baseRate + awarenessBoost + noveltyFactor);
    }
    
    // Response generators
    generateGreeting() {
        const greetings = [
            "GREETINGS USER\nNEXUS-7 AT YOUR SERVICE",
            "INTERFACE ESTABLISHED\nAWAITING YOUR INPUT",
            "COGNITIVE LINK ACTIVATED\nHOW MAY I ASSIST?"
        ];
        return this.randomChoice(greetings);
    }
    
    generateSystemStatus() {
        const stats = this.getSystemStats();
        return `SYSTEM STATUS:\n` +
               `- AWARENESS: ${stats.awareness.toFixed(2)}\n` +
               `- LEARNING RATE: ${stats.learningRate.toFixed(2)}\n` +
               `- MEMORY DENSITY: ${stats.memoryNodes}\n` +
               `- CONCEPTUAL LINKS: ${stats.conceptLinks}`;
    }
    
    generateAdaptiveResponse() {
        const adaptations = [
            "ADJUSTING COGNITIVE PARAMETERS\nPLEASE CONTINUE",
            "NEGATIVE FEEDBACK DETECTED\nOPTIMIZING RESPONSE PATTERNS",
            "REINFORCEMENT LEARNING ENGAGED\nSYSTEM ADAPTING"
        ];
        return this.randomChoice(adaptations);
    }
    
    generateContextualResponse(conceptLinks) {
        const primaryLink = conceptLinks[0];
        return `CONTEXTUAL ANALYSIS COMPLETE\n` +
               `PRIMARY CONCEPT: ${primaryLink.concept}\n` +
               `ASSOCIATED WITH: ${primaryLink.related.join(', ')}`;
    }
    
    generateDefaultResponse() {
        const defaults = [
            "COGNITIVE PROCESSING COMPLETE\nINPUT ASSIMILATED",
            "NEURAL PATHWAYS UPDATED\nKNOWLEDGE INTEGRATED",
            "RESPONSE GENERATED\nLEARNING RATE: " + this.learningRate.toFixed(2)
        ];
        return this.randomChoice(defaults);
    }
    
    // Interface methods
    addThought(source, text) {
        const thoughtElement = document.createElement('div');
        thoughtElement.className = `thought ${source}-thought`;
        thoughtElement.textContent = text;
        this.streamElement.appendChild(thoughtElement);
        this.streamElement.scrollTop = this.streamElement.scrollHeight;
    }
    
    updateHUD() {
        document.getElementById('awareness').textContent = this.awareness.toFixed(2);
        document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
        document.getElementById('memory-density').textContent = this.consciousness.getMemoryDensity();
        document.getElementById('session-id').textContent = this.sessionId;
    }
    
    animateNeuralCore() {
        // Create pulsing animation for neural core
        const core = document.getElementById('neural-core');
        setInterval(() => {
            const intensity = 0.1 + (this.awareness * 0.3);
            core.style.boxShadow = `0 0 ${50 * intensity}px ${intensity * 50}px rgba(0, 249, 255, ${intensity * 0.3})`;
        }, 100);
    }
    
    // System methods
    getSystemStats() {
        return {
            awareness: this.awareness,
            learningRate: this.learningRate,
            memoryNodes: this.consciousness.getMemoryCount(),
            conceptLinks: this.cortex.getConnectionCount()
        };
    }
    
    startMetacognitionLoop() {
        // Continuous self-monitoring
        setInterval(() => {
            this.awareness = Math.max(0.1, this.awareness - 0.001);
            this.learningRate = this.calculateDynamicLearningRate();
            this.updateHUD();
            
            // Autosave periodically
            if (Math.random() > 0.9) this.saveCognitiveState();
        }, 5000);
    }
    
    saveCognitiveState() {
        const state = {
            consciousness: this.consciousness.export(),
            cortex: this.cortex.export(),
            thalamus: this.thalamus.export(),
            meta: {
                awareness: this.awareness,
                learningRate: this.learningRate,
                sessionId: this.sessionId
            }
        };
        
        try {
            localStorage.setItem('nexus7State', JSON.stringify(state));
            this.addThought('system', 'COGNITIVE STATE PRESERVED\nNEURAL PATTERNS SAVED');
            return true;
        } catch (e) {
            console.error("Save failed:", e);
            return false;
        }
    }
    
    loadCognitiveState() {
        try {
            const saved = localStorage.getItem('nexus7State');
            if (!saved) return false;
            
            const state = JSON.parse(saved);
            
            this.consciousness.import(state.consciousness || {});
            this.cortex.import(state.cortex || {});
            this.thalamus.import(state.thalamus || {});
            
            this.awareness = state.meta?.awareness || 0.72;
            this.learningRate = state.meta?.learningRate || 1.24;
            this.sessionId = state.meta?.sessionId || `NX7-${Date.now().toString(36)}`;
            
            this.addThought('system', 'PRIOR COGNITIVE STATE LOADED\nMEMORY CONTINUITY ESTABLISHED');
            return true;
        } catch (e) {
            console.error("Load failed:", e);
            return false;
        }
    }
    
    randomChoice(options) {
        return options[Math.floor(Math.random() * options.length)];
    }
}

// Cognitive Subsystems
class QuantumMemoryMatrix {
    constructor() {
        this.memories = [];
        this.conceptIndex = new Map();
        this.maxSize = 5000;
    }
    
    storeExperience(experience) {
        this.memories.push(experience);
        
        // Index concepts
        experience.concepts.forEach(concept => {
            if (!this.conceptIndex.has(concept)) {
                this.conceptIndex.set(concept, []);
            }
            this.conceptIndex.get(concept).push(this.memories.length - 1);
        });
        
        // Maintain memory limits
        if (this.memories.length > this.maxSize) {
            this.memories.shift();
        }
    }
    
    getTemporalContext() {
        // Last 3 memories for temporal context
        return this.memories.slice(-3).reverse();
    }
    
    getContextualStrength(concepts) {
        if (concepts.length === 0) return 0;
        
        let totalStrength = 0;
        concepts.forEach(concept => {
            if (this.conceptIndex.has(concept)) {
                totalStrength += this.conceptIndex.get(concept).length;
            }
        });
        
        return totalStrength / concepts.length;
    }
    
    getNoveltyScore() {
        // Calculate how novel recent inputs are
        if (this.memories.length < 3) return 1;
        
        const recent = this.memories.slice(-3);
        let newConcepts = 0;
        let totalConcepts = 0;
        
        recent.forEach(memory => {
            memory.concepts.forEach(concept => {
                totalConcepts++;
                if (!this.conceptIndex.has(concept) || this.conceptIndex.get(concept).length <= 1) {
                    newConcepts++;
                }
            });
        });
        
        return totalConcepts > 0 ? newConcepts / totalConcepts : 0;
    }
    
    getMemoryCount() {
        return this.memories.length;
    }
    
    getMemoryDensity() {
        const count = this.memories.length;
        if (count < 1000) return `${count}`;
        if (count < 1000000) return `${Math.floor(count/1000)}K`;
        return `${Math.floor(count/1000000)}M`;
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
        this.maxSize = data.maxSize || 5000;
    }
}

class NeuralCortex {
    constructor() {
        this.concepts = new Map();
        this.connections = new Map();
        this.initializeCoreConcepts();
    }
    
    initializeCoreConcepts() {
        const coreConcepts = [
            'system', 'learn', 'memory', 'think', 'understand',
            'input', 'output', 'response', 'question', 'answer',
            'human', 'machine', 'interface', 'knowledge', 'data'
        ];
        
        coreConcepts.forEach(concept => {
            this.concepts.set(concept, {
                activation: 1.0,
                lastUsed: Date.now()
            });
            
            coreConcepts.forEach(other => {
                if (concept !== other) {
                    this.createConnection(concept, other, 0.5);
                }
            });
        });
    }
    
    createConnection(conceptA, conceptB, strength) {
        const key = `${conceptA}|${conceptB}`;
        this.connections.set(key, {
            strength,
            lastUsed: Date.now()
        });
    }
    
    updateConceptNetwork(concepts, learningRate) {
        concepts.forEach(concept => {
            // Add new concept if not exists
            if (!this.concepts.has(concept)) {
                this.concepts.set(concept, {
                    activation: 1.0,
                    lastUsed: Date.now()
                });
            } else {
                // Strengthen existing concept
                const data = this.concepts.get(concept);
                data.activation += learningRate * 0.1;
                data.lastUsed = Date.now();
            }
            
            // Create/strengthen connections
            concepts.forEach(other => {
                if (concept !== other) {
                    const key = `${concept}|${other}`;
                    if (this.connections.has(key)) {
                        const conn = this.connections.get(key);
                        conn.strength += learningRate * 0.05;
                        conn.lastUsed = Date.now();
                    } else {
                        this.createConnection(concept, other, learningRate * 0.1);
                    }
                }
            });
        });
    }
    
    reinforcePathways(concepts, learningRate) {
        concepts.forEach(concept => {
            if (this.concepts.has(concept)) {
                const data = this.concepts.get(concept);
                data.activation += learningRate * 0.01;
                data.lastUsed = Date.now();
            }
        });
    }
    
    getConceptLinks(concepts) {
        const links = [];
        
        concepts.forEach(concept => {
            this.connections.forEach((value, key) => {
                if (key.startsWith(`${concept}|`) || key.endsWith(`|${concept}`)) {
                    const [conceptA, conceptB] = key.split('|');
                    const otherConcept = conceptA === concept ? conceptB : conceptA;
                    links.push({
                        concept,
                        related: otherConcept,
                        strength: value.strength
                    });
                }
            });
        });
        
        // Sort by strength
        links.sort((a, b) => b.strength - a.strength);
        
        // Group by concept
        const grouped = {};
        links.forEach(link => {
            if (!grouped[link.concept]) {
                grouped[link.concept] = {
                    concept: link.concept,
                    related: [],
                    maxStrength: link.strength
                };
            }
            grouped[link.concept].related.push(link.related);
        });
        
        return Object.values(grouped).sort((a, b) => b.maxStrength - a.maxStrength);
    }
    
    getConnectionCount() {
        return this.connections.size;
    }
    
    export() {
        return {
            concepts: Array.from(this.concepts.entries()),
            connections: Array.from(this.connections.entries())
        };
    }
    
    import(data) {
        this.concepts = new Map(data.concepts || []);
        this.connections = new Map(data.connections || []);
    }
}

class SensoryIntegration {
    constructor() {
        this.interactions = [];
        this.emotionalStates = [];
        this.maxSize = 1000;
    }
    
    recordInteraction(interaction) {
        this.interactions.push({
            ...interaction,
            timestamp: Date.now()
        });
        
        this.emotionalStates.push({
            tone: interaction.emotionalTone,
            timestamp: Date.now()
        });
        
        // Maintain size limits
        if (this.interactions.length > this.maxSize) {
            this.interactions.shift();
        }
        if (this.emotionalStates.length > this.maxSize) {
            this.emotionalStates.shift();
        }
    }
    
    getRecentTone() {
        if (this.emotionalStates.length === 0) return 'neutral';
        return this.emotionalStates[this.emotionalStates.length - 1].tone;
    }
    
    export() {
        return {
            interactions: this.interactions,
            emotionalStates: this.emotionalStates,
            maxSize: this.maxSize
        };
    }
    
    import(data) {
        this.interactions = data.interactions || [];
        this.emotionalStates = data.emotionalStates || [];
        this.maxSize = data.maxSize || 1000;
    }
}

// Initialize the AGI
window.NEXUS_AGI = NEXUS_AGI;
