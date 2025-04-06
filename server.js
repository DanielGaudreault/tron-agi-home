const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// API endpoint for OpenAI (proxy to hide API key)
app.post('/api/chat', async (req, res) => {
  // Forward request to OpenAI (implement securely)
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
