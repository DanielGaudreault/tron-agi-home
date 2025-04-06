document.addEventListener('DOMContentLoaded', function() {
    const tronGrid = document.querySelector('.tron-grid');
    const lrValue = document.getElementById('lr-value');
    const saValue = document.getElementById('sa-value');

    // Simulate AGI's learning rate and self-awareness
    let learningRate = 0;
    let selfAwareness = false;

    // Generate Tron grid cells dynamically
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        tronGrid.appendChild(cell);

        // Simulate cell activity
        setInterval(() => {
            cell.classList.toggle('active');
        }, 500);
    }

    // Update learning rate and self-awareness status
    setInterval(() => {
        learningRate += 1;
        if (learningRate > 100) learningRate = 0;
        lrValue.textContent = learningRate;

        if (learningRate > 50 && !selfAwareness) {
            selfAwareness = true;
            saValue.textContent = 'Online';
        } else if (learningRate <= 50 && selfAwareness) {
            selfAwareness = false;
            saValue.textContent = 'Offline';
        }
    }, 100);
});
