class SelfLearningAGI {
  constructor() {
    this.memory = new NeuralMemory();
    this.conceptNetwork = new ConceptNetwork();
    this.learningRate = 0.7;
    this.iteration = 0;
    
    this.initEventListeners();
    this.log("AGI Core Initialized");
  }
  
  initEventListeners() {
    document.getElementById('submit').addEventListener('click', () => this.processInput());
    document.getElementById('user-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.processInput();
    });
  }
  
  processInput() {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;
    
    this.log(`> ${input}`, 'user-message');
    document.getElementById('user-input').value = '';
    
    // Process and learn from input
    const processed = this.understand(input);
    const response = this.generateResponse(processed);
    
    setTimeout(() => {
      this.log(response, 'ai-message');
      this.updateHUD();
    }, 500 + Math.random() * 1000);
  }
  
  understand(input) {
    // Tokenize and analyze input
    const tokens = this.tokenize(input);
    const concepts = this.extractConcepts(tokens);
    
    // Store in memory
    this.memory.store({
      input,
      tokens,
      concepts,
      timestamp: Date.now()
    });
    
    // Update concept network
    this.conceptNetwork.update(concepts, this.learningRate);
    
    this.iteration++;
    if (this.iteration % 10 === 0) {
      this.learningRate = Math.max(0.1, this.learningRate * 0.99);
    }
    
    return { tokens, concepts };
  }
  
  generateResponse(processed) {
    // Generate response based on learned concepts
    const concepts = processed.concepts;
    const context = this.memory.recallRelated(concepts);
    
    // Simple response generation - would be replaced with actual NLG
    if (concepts.includes('hello') || concepts.includes('hi')) {
      return this.randomResponse([
        "Greetings, User.",
        "Hello. I am listening.",
        "Connection established."
      ]);
    }
    
    if (concepts.includes('learn') || concepts.includes('knowledge')) {
      return `My learning rate is currently ${(this.learningRate * 100).toFixed(1)}%`;
    }
    
    if (context.length > 0) {
      return this.associativeResponse(context);
    }
    
    return this.randomResponse([
      "Processing...",
      "That input has been added to my neural matrix.",
      "Interesting. Tell me more.",
      "I'm developing my understanding of that concept."
    ]);
  }
  
  log(message, className = 'system-message') {
    const output = document.getElementById('output');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.textContent = message;
    output.appendChild(messageElement);
    output.scrollTop = output.scrollHeight;
  }
  
  updateHUD() {
    document.getElementById('learning-rate').textContent = this.learningRate.toFixed(2);
    document.getElementById('memory-nodes').textContent = this.memory.size().toLocaleString();
  }
  
  // Helper methods
  randomResponse(options) {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  tokenize(input) {
    return input.toLowerCase().split(/\s+/);
  }
  
  extractConcepts(tokens) {
    // Simple concept extraction - would be enhanced
    return tokens.filter(token => token.length > 3);
  }
  
  associativeResponse(context) {
    // Simple associative response based on context
    const related = context[0].concepts;
    return `You mentioned "${related.join(', ')}" before. How does this relate?`;
  }
}

class NeuralMemory {
  constructor() {
    this.data = [];
    this.maxSize = 1000;
  }
  
  store(item) {
    this.data.push(item);
    if (this.data.length > this.maxSize) {
      this.data.shift();
    }
  }
  
  recallRelated(concepts) {
    return this.data.filter(item => 
      item.concepts.some(concept => 
        concepts.includes(concept)
    );
  }
  
  size() {
    return this.data.length;
  }
}

class ConceptNetwork {
  constructor() {
    this.concepts = new Map();
  }
  
  update(newConcepts, learningRate) {
    newConcepts.forEach(concept => {
      if (!this.concepts.has(concept)) {
        this.concepts.set(concept, { strength: 1.0, connections: new Map() });
      } else {
        const node = this.concepts.get(concept);
        node.strength += learningRate;
      }
    });
    
    // Create connections between concepts
    for (let i = 0; i < newConcepts.length; i++) {
      for (let j = i + 1; j < newConcepts.length; j++) {
        this.addConnection(newConcepts[i], newConcepts[j], learningRate);
      }
    }
  }
  
  addConnection(conceptA, conceptB, weight) {
    const nodeA = this.concepts.get(conceptA);
    const nodeB = this.concepts.get(conceptB);
    
    const currentWeight = nodeA.connections.get(conceptB) || 0;
    nodeA.connections.set(conceptB, currentWeight + weight);
    nodeB.connections.set(conceptA, currentWeight + weight);
  }
}

function initAGISystem() {
  initTronEnvironment();
  window.agi = new SelfLearningAGI();
}
