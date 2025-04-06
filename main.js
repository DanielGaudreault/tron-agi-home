document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new UIController();
    
    // Add a subtle animation to the header
    const header = document.querySelector('.header');
    let floatDirection = 1;
    
    const floatAnimation = () => {
        const currentY = parseFloat(getComputedStyle(header).getPropertyValue('transform').split(',')[5]) || 0;
        
        if (Math.abs(currentY) > 3) {
            floatDirection *= -1;
        }
        
        header.style.transform = `translateY(${currentY + floatDirection * 0.1}px)`;
        requestAnimationFrame(floatAnimation);
    };
    
    // Start the animation after a delay
    setTimeout(() => {
        requestAnimationFrame(floatAnimation);
    }, 1000);
    
    // Add a scanline effect to the chat container
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.position = 'relative';
    chatContainer.style.overflow = 'hidden';
    
    const scanline = document.createElement('div');
    scanline.style.position = 'absolute';
    scanline.style.top = '0';
    scanline.style.left = '0';
    scanline.style.width = '100%';
    scanline.style.height = '100%';
    scanline.style.background = 'linear-gradient(to bottom, transparent 95%, rgba(0, 255, 255, 0.1) 100%)';
    scanline.style.backgroundSize = '100% 10px';
    scanline.style.animation = 'scanline 1s linear infinite';
    scanline.style.pointerEvents = 'none';
    scanline.style.zIndex = '10';
    chatContainer.appendChild(scanline);
    
    // Add click effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const x = e.clientX - this.getBoundingClientRect().left;
            const y = e.clientY - this.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
        });
    });
    
    // Add style for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            transform: translate(-50%, -50%);
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: rgba(0, 255, 255, 0.5);
            animation: rippleEffect 1s ease-out;
            pointer-events: none;
        }
        
        @keyframes rippleEffect {
            0% {
                width: 5px;
                height: 5px;
                opacity: 1;
            }
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter to submit
        if (e.ctrlKey && e.key === 'Enter') {
            app.handleSubmit();
        }
        
        // Esc to clear input
        if (e.key === 'Escape') {
            app.userInput.value = '';
            app.userInput.focus();
        }
    });
    
    // Log initial system info
    app.logToConsole(`System initialized at ${new Date().toLocaleString()}`);
    app.logToConsole(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    app.logToConsole(`User agent: ${navigator.userAgent}`);
});
