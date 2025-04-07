// ===== AI AGENT (TensorFlow.js) =====
class NeuralAgent {
    constructor() {
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 16, inputShape: [4], activation: "relu" }));
        this.model.add(tf.layers.dense({ units: 8, activation: "relu" }));
        this.model.add(tf.layers.dense({ units: 4, activation: "softmax" }));
        this.model.compile({ optimizer: "adam", loss: "meanSquaredError" });
    }
    predict(state) {
        return tf.tidy(() => {
            const input = tf.tensor2d([state]);
            return this.model.predict(input).dataSync();
        });
    }
}

// Example: Use this to control an ISO
// const aiAgent = new NeuralAgent();
// const action = aiAgent.predict([iso.x, iso.y, user.x, user.y]);
