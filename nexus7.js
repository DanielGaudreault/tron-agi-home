export function getInputValues() {
    const input = parseFloat(document.getElementById('input').value) || 0;
    const target = parseFloat(document.getElementById('target').value) || input + 1; // Default target
    return { input, target };
}

export function displayResult(prediction) {
    document.getElementById('result').textContent = `Prediction: ${prediction.toFixed(2)}`;
}
