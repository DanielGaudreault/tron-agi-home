import AGI from './agi.js';
import { getInputValues, displayResult } from './nexus7.js';
import { initThreeTron } from './three-tron.js';

// Initialize AGI
const agi = new AGI();

// Train and predict function
window.trainAndPredict = function() {
    const { input, target } = getInputValues();
    const prediction = agi.train(input, target);
    displayResult(prediction);
};

// Initialize Three.js visuals
initThreeTron();
