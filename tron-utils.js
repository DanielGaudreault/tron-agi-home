// TronWeb configuration
const tronWebConfig = {
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': 'your-api-key-here' }, // Get your own API key from TronGrid
    privateKey: '' // Never hardcode private keys in client-side code
};

let tronWeb;

async function connectTronWallet() {
    if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
        tronWeb = window.tronWeb;
        updateWalletStatus(true, tronWeb.defaultAddress.base58);
        addToOutput('Tron wallet connected successfully!', 'tron-output');
        return true;
    }
    
    try {
        if (window.tronLink) {
            const res = await window.tronLink.request({ method: 'tron_requestAccounts' });
            if (res.code === 200) {
                tronWeb = window.tronWeb;
                updateWalletStatus(true, tronWeb.defaultAddress.base58);
                addToOutput('Tron wallet connected successfully!', 'tron-output');
                return true;
            } else {
                addToOutput('Error connecting wallet: ' + res.message, 'tron-output');
                return false;
            }
        } else {
            addToOutput('TronLink extension not detected. Please install TronLink.', 'tron-output');
            return false;
        }
    } catch (error) {
        addToOutput('Error connecting wallet: ' + error.message, 'tron-output');
        return false;
    }
}

async function getTRXBalance() {
    if (!tronWeb) {
        const connected = await connectTronWallet();
        if (!connected) return null;
    }
    
    try {
        const balance = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58);
        const balanceInTRX = tronWeb.fromSun(balance);
        addToOutput(`TRX Balance: ${balanceInTRX} TRX`, 'tron-output');
        return balanceInTRX;
    } catch (error) {
        addToOutput('Error fetching balance: ' + error.message, 'tron-output');
        return null;
    }
}

async function querySmartContracts() {
    if (!tronWeb) {
        const connected = await connectTronWallet();
        if (!connected) return;
    }
    
    addToOutput('Querying smart contracts requires specific contract addresses and methods.', 'tron-output');
    addToOutput('This is a placeholder for actual smart contract interaction logic.', 'tron-output');
    
    // Example of how you might query a contract
    /*
    try {
        const contract = await tronWeb.contract().at('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
        const result = await contract.method().call();
        addToOutput('Contract result: ' + JSON.stringify(result), 'tron-output');
    } catch (error) {
        addToOutput('Error querying contract: ' + error.message, 'tron-output');
    }
    */
}

// Helper function for contract interactions
async function callContractMethod(contractAddress, methodName, parameters = []) {
    if (!tronWeb) {
        const connected = await connectTronWallet();
        if (!connected) return null;
    }
    
    try {
        const contract = await tronWeb.contract().at(contractAddress);
        const result = await contract[methodName](...parameters).call();
        addToOutput(`Contract ${methodName} result: ${JSON.stringify(result)}`, 'tron-output');
        return result;
    } catch (error) {
        addToOutput(`Error calling ${methodName}: ${error.message}`, 'tron-output');
        return null;
    }
}
