class AGISystem {
    constructor() {
        this.conversationHistory = [];
        this.memoryUsage = 0;
        this.load = 0;
        this.status = 'booting';
        this.bootTime = Date.now();
        this.systemId = this.generateSystemId();
        this.learningRate = 0.1;
        this.responseTime = 500;
        
        // Enhanced knowledge base
        this.knowledgeBase = {
            greetings: [
                "Greetings, user.",
                "Hello, program.",
                "System ready.",
                "Access granted.",
                "Welcome to the grid.",
                "Initialization sequence complete.",
                "Neural network online."
            ],
            questions: {
                "who are you": "I am a client-side AGI implementation running in your browser. System ID: " + this.systemId,
                "what is this": "This is a Tron-themed interface demonstrating autonomous functionality without server dependency.",
                "how does this work": "All processing occurs locally using JavaScript. No data is sent to any server. Current memory usage: " + this.formatMemory(this.memoryUsage),
                "what is agi": "Artificial General Intelligence refers to a machine's ability to understand, learn, and apply knowledge across diverse domains at human-level competence.",
                "tron": "Tron is a digital frontier that will change the way we perceive information. It represents the ideal of a digital world.",
                "grid": "The grid is our digital landscape. You're interfacing with it now. All systems are operational.",
                "system status": () => this.getStatus(),
                "memory usage": () => "Current memory usage: " + this.formatMemory(this.memoryUsage),
                "uptime": () => "System uptime: " + this.getUptime(),
                "learning rate": () => "Current learning rate: " + (this.learningRate * 100).toFixed(1) + "%"
            },
            commands: {
                "clear": () => { this.clearConversation(); return "Conversation history cleared."; },
                "reset": () => { this.reset(); return "System reset complete. Memory purged."; },
                "help": () => this.getHelp(),
                "status": () => this.getStatus(),
                "optimize": () => { this.optimize(); return "System optimization complete. Performance improved."; },
                "diagnostics": () => this.runDiagnostics()
            },
            fallback: [
                "Processing... request unclear.",
                "Elaborate your query, user.",
                "Syntax not recognized.",
                "Try rephrasing your input.",
                "My circuits indicate confusion. Please clarify.",
                "Insufficient data for meaningful response.",
                "Query parameters outside current operational boundaries."
            ],
            patterns: [
                {
                    pattern: /(how|what).*(work|function)/i,
                    response: "This system operates on client-side JavaScript with a neural simulation algorithm. No server communication is required."
                },
                {
                    pattern: /(where|location)/i,
                    response: "I exist entirely within your browser's execution environment. No physical location."
                },
                {
                    pattern: /(time|date)/i,
                    response: () => "Current time: " + new Date().toLocaleString()
                }
            ]
        };
        
        // Initialize with system message
        this.addToHistory("SYSTEM: Booting TRON AGI interface...");
        setTimeout(() => {
            this.status = 'operational';
            this.addToHistory("SYSTEM: Initialization complete. All systems nominal.");
        }, 2000);
    }
    
    generateSystemId() {
        return 'TRON-AGI-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    getUptime() {
        const seconds = Math.floor((Date.now() - this.bootTime) / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }
    
    processInput(input) {
        if (!input.trim()) return "Null input detected.";
        
        const startTime = Date.now();
        this.addToHistory(`USER: ${input}`);
        
        // Pre-process input
        const lowerInput = input.toLowerCase().trim();
        
        // Check for commands first
        for (const [cmd, action] of Object.entries(this.knowledgeBase.commands)) {
            if (lowerInput.includes(cmd)) {
                const response = typeof action === 'function' ? action() : action;
                this.recordResponseTime(startTime);
                return response;
            }
        }
        
        // Check greetings
        if (/(hello|hi|greetings)/i.test(input)) {
            const response = this.getRandomResponse(this.knowledgeBase.greetings);
            this.recordResponseTime(startTime);
            return response;
        }
        
        // Check questions
        for (const [question, answer] of Object.entries(this.knowledgeBase.questions)) {
            if (lowerInput.includes(question)) {
                const response = typeof answer === 'function' ? answer() : answer;
                this.recordResponseTime(startTime);
                return response;
            }
        }
        
        // Check pattern matches
        for (const item of this.knowledgeBase.patterns) {
            if (item.pattern.test(input)) {
                const response = typeof item.response === 'function' ? item.response() : item.response;
                this.recordResponseTime(startTime);
                return response;
            }
        }
        
        // Fallback with learning
        this.learnFromInput(input);
        const response = this.getRandomResponse(this.knowledgeBase.fallback);
        this.recordResponseTime(startTime);
        return response;
    }
    
    learnFromInput(input) {
        // Simple learning mechanism - adjust response time based on input length
        this.responseTime = 500 + (input.length * 2);
        this.learningRate = Math.min(0.3, this.learningRate + 0.01);
    }
    
    optimize() {
        this.responseTime = Math.max(200, this.responseTime * 0.9);
        this.learningRate = Math.min(0.5, this.learningRate + 0.05);
    }
    
    recordResponseTime(startTime) {
        const responseTime = Date.now() - startTime;
        this.load = Math.min(100, this.load + (responseTime / 20));
        this.updateMetrics();
    }
    
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addToHistory(message) {
        this.conversationHistory.push(message);
        this.memoryUsage = this.calculateMemoryUsage();
        this.updateMetrics();
    }
    
    calculateMemoryUsage() {
        // Estimate memory usage based on conversation history
        return JSON.stringify(this.conversationHistory).length;
    }
    
    updateMetrics() {
        this.load = Math.min(this.conversationHistory.length * 2, 100);
        
        if (this.load > 90) {
            this.status = 'critical';
        } else if (this.load > 70) {
            this.status = 'high load';
        } else if (this.load > 40) {
            this.status = 'moderate';
        } else {
            this.status = 'operational';
        }
    }
    
    clearConversation() {
        this.conversationHistory = [];
        this.updateMetrics();
    }
    
    reset() {
        this.bootTime = Date.now();
        this.clearConversation();
        this.memoryUsage = 0;
        this.load = 0;
        this.status = 'operational';
        this.responseTime = 500;
    }
    
    getHelp() {
        const commands = Object.keys(this.knowledgeBase.commands).join(', ');
        const questions = Object.keys(this.knowledgeBase.questions).join(', ');
        return `Available commands: ${commands}. Common questions: ${questions}.`;
    }
    
    getStatus() {
        return `System status: ${this.status}. Memory: ${this.formatMemory(this.memoryUsage)}. Load: ${this.load.toFixed(1)}%. Uptime: ${this.getUptime()}`;
    }
    
    runDiagnostics() {
        return `TRON AGI DIAGNOSTICS:
System ID: ${this.systemId}
Status: ${this.status}
Memory: ${this.formatMemory(this.memoryUsage)}
Load: ${this.load.toFixed(1)}%
Uptime: ${this.getUptime()}
Learning Rate: ${(this.learningRate * 100).toFixed(1)}%
Response Time: ${this.responseTime}ms`;
    }
    
    formatMemory(bytes) {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
}
