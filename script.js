document.addEventListener('DOMContentLoaded', function() {
    const tronGrid = document.querySelector('.tron-grid');

    // Generate Tron grid cells dynamically
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        tronGrid.appendChild(cell);
    }
});
