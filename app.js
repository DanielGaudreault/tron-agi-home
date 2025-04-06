// Replace processWithAGI with:
async function processWithAGI(input) {
    try {
        const response = await agi.processInput(input);
        addToOutput(`AGI: ${response}`, 'agi-output');
        
        // Check if response suggests blockchain action
        if (response.includes('query') || response.includes('Tron blockchain')) {
            const tronResponse = await handleTronQuery(input);
            if (tronResponse) {
                addToOutput(`AGI (Tron): ${tronResponse}`, 'agi-output');
            }
        }
        
        return response;
    } catch (error) {
        console.error("AGI Error:", error);
        return "I encountered an error processing your request. Please try again.";
    }
}
