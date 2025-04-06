document.getElementById('glow-btn').addEventListener('click', () => {
    alert("Beacon sent to the System Admin. Await response.");
});

const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements[0].value;
    const functionType = form.elements[1].value;
    alert(`Program ${name} (${functionType}) registered. Welcome to the Grid.`);
    form.reset();
});
