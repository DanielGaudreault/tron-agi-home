document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AGI
    initAGI();
    
    // Initialize Tron connection
    document.getElementById('connect-wallet').addEventListener('click', connectTronWallet);
    document.getElementById('get-balance').addEventListener('click', getTRXBalance);
    document.getElementById('get-smart-contracts').addEventListener('click', querySmartContracts);
    
    // Set up user input
    document.getElementById('send-btn').addEventListener('click', processUserInput);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processUserInput();
    });
    
    // Check if TronLink is installed
    if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
        updateWalletStatus(true, window.tronWeb.defaultAddress.base58);
    }
});

async function processUserInput() {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;
    
    // Add user input to AGI console
    addToOutput(`You: ${input}`, 'agi-output');
    
    // Clear input field
    document.getElementById('user-input').value = '';
    
    // Process with AGI
    const response = await processWithAGI(input);
    addToOutput(`AGI: ${response}`, 'agi-output');
    
    // Check if the input contains Tron-related queries
    if (input.toLowerCase().includes('tron') || input.toLowerCase().includes('blockchain')) {
        const tronResponse = await handleTronQuery(input);
        if (tronResponse) {
            addToOutput(`AGI (Tron): ${tronResponse}`, 'agi-output');
        }
    }
}

function addToOutput(message, elementId) {
    const output = document.getElementById(elementId);
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    output.appendChild(messageElement);
    output.scrollTop = output.scrollHeight;
}

function updateWalletStatus(connected, address = '') {
    const statusElement = document.getElementById('wallet-status');
    if (connected) {
        statusElement.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        statusElement.classList.add('connected');
        statusElement.classList.remove('disconnected');
    } else {
        statusElement.textContent = 'Wallet not connected';
        statusElement.classList.add('disconnected');
        statusElement.classList.remove('connected');
    }
}
