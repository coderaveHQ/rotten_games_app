// Game state management
let currentGame = 'main-menu';
let gameState = {
    cookies: 0,
    clickPower: 1,
    cookiesPerSecond: 0,
    upgrades: {
        cursor: { owned: 0, cost: 15, power: 1 },
        grandma: { owned: 0, cost: 100, cps: 1 },
        factory: { owned: 0, cost: 1200, cps: 8 }
    },
    borderGame: {
        bestScore: 0,
        lastScore: 0,
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentRect: null
    }
};

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentGame = screenId;
    
    // Initialize game-specific features
    if (screenId === 'logo-border') {
        initBorderGame();
    }
}

function showMainMenu() {
    showScreen('main-menu');
}

function startGame(gameType) {
    showScreen(gameType);
}

// Cookie Clicker Game Logic
function initCookieClicker() {
    updateCookieDisplay();
    updateUpgradeButtons();
    
    // Cookie click handler
    document.getElementById('cookie-btn').addEventListener('click', clickCookie);
    
    // Start cookie per second generation
    setInterval(generateCookies, 1000);
}

function clickCookie(event) {
    gameState.cookies += gameState.clickPower;
    updateCookieDisplay();
    updateUpgradeButtons();
    
    // Create click effect
    createClickEffect(event);
}

function createClickEffect(event) {
    const clickEffect = document.getElementById('click-effect');
    const number = document.createElement('div');
    number.className = 'click-number';
    number.textContent = `+${gameState.clickPower}`;
    
    // Random position around click
    const randomX = (Math.random() - 0.5) * 100;
    const randomY = (Math.random() - 0.5) * 100;
    
    number.style.left = `${randomX}px`;
    number.style.top = `${randomY}px`;
    
    clickEffect.appendChild(number);
    
    // Remove after animation
    setTimeout(() => {
        if (number.parentNode) {
            number.parentNode.removeChild(number);
        }
    }, 1000);
}

function generateCookies() {
    if (currentGame === 'cookie-clicker' && gameState.cookiesPerSecond > 0) {
        gameState.cookies += gameState.cookiesPerSecond;
        updateCookieDisplay();
        updateUpgradeButtons();
    }
}

function updateCookieDisplay() {
    document.getElementById('cookie-count').textContent = Math.floor(gameState.cookies);
    document.getElementById('click-power').textContent = gameState.clickPower;
    document.getElementById('cookies-per-second').textContent = gameState.cookiesPerSecond;
}

function buyUpgrade(type) {
    const upgrade = gameState.upgrades[type];
    
    if (gameState.cookies >= upgrade.cost) {
        gameState.cookies -= upgrade.cost;
        upgrade.owned++;
        
        // Update costs (exponential growth)
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        
        // Update game state based on upgrade type
        if (type === 'cursor') {
            gameState.clickPower += upgrade.power;
        } else if (type === 'grandma' || type === 'factory') {
            gameState.cookiesPerSecond += upgrade.cps;
        }
        
        updateCookieDisplay();
        updateUpgradeButtons();
    }
}

function updateUpgradeButtons() {
    Object.keys(gameState.upgrades).forEach(type => {
        const upgrade = gameState.upgrades[type];
        const button = document.getElementById(`${type}-upgrade`);
        const costElement = button.querySelector('.upgrade-cost');
        
        costElement.textContent = `${upgrade.cost} cookies`;
        
        if (gameState.cookies >= upgrade.cost) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.5';
        }
        
        // Update description with owned count
        const desc = button.querySelector('.upgrade-desc');
        if (upgrade.owned > 0) {
            if (type === 'cursor') {
                desc.textContent = `+${upgrade.power} per click (owned: ${upgrade.owned})`;
            } else {
                desc.textContent = `+${upgrade.cps} per second (owned: ${upgrade.owned})`;
            }
        }
    });
}

// Logo Border Game Logic
function initBorderGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset game state
    gameState.borderGame.isDrawing = false;
    gameState.borderGame.currentRect = null;
    
    // Update score display
    document.getElementById('best-score').textContent = `${gameState.borderGame.bestScore}%`;
    document.getElementById('last-score').textContent = `${gameState.borderGame.lastScore}%`;
    
    // Hide score display
    document.getElementById('score-display').classList.add('hidden');
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', continueDrawing);
    canvas.addEventListener('mouseup', finishDrawing);
    canvas.addEventListener('mouseleave', finishDrawing);
}

function startDrawing(event) {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    
    gameState.borderGame.isDrawing = true;
    gameState.borderGame.startX = event.clientX - rect.left;
    gameState.borderGame.startY = event.clientY - rect.top;
    
    // Clear previous rectangle
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function continueDrawing(event) {
    if (!gameState.borderGame.isDrawing) return;
    
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    // Clear canvas and redraw rectangle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = currentX - gameState.borderGame.startX;
    const height = currentY - gameState.borderGame.startY;
    
    // Draw rectangle
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(gameState.borderGame.startX, gameState.borderGame.startY, width, height);
    
    // Store current rectangle
    gameState.borderGame.currentRect = {
        x: gameState.borderGame.startX,
        y: gameState.borderGame.startY,
        width: width,
        height: height
    };
}

function finishDrawing() {
    if (!gameState.borderGame.isDrawing) return;
    
    gameState.borderGame.isDrawing = false;
    
    if (gameState.borderGame.currentRect) {
        calculateScore();
    }
}

function calculateScore() {
    const canvas = document.getElementById('game-canvas');
    const logoElement = document.querySelector('.windows-logo');
    const canvasRect = canvas.getBoundingClientRect();
    const logoRect = logoElement.getBoundingClientRect();
    
    // Calculate logo position relative to canvas
    const logoX = logoRect.left - canvasRect.left;
    const logoY = logoRect.top - canvasRect.top;
    const logoWidth = logoRect.width;
    const logoHeight = logoRect.height;
    
    // Perfect rectangle would be around the logo
    const perfectRect = {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight
    };
    
    const userRect = gameState.borderGame.currentRect;
    
    // Calculate accuracy based on overlap and precision
    const score = calculateRectangleAccuracy(userRect, perfectRect);
    
    gameState.borderGame.lastScore = score;
    if (score > gameState.borderGame.bestScore) {
        gameState.borderGame.bestScore = score;
    }
    
    // Update display
    document.getElementById('best-score').textContent = `${gameState.borderGame.bestScore}%`;
    document.getElementById('last-score').textContent = `${gameState.borderGame.lastScore}%`;
    document.getElementById('current-score').textContent = `${score}%`;
    
    // Show score message
    const message = getScoreMessage(score);
    document.getElementById('score-message').textContent = message;
    document.getElementById('score-display').classList.remove('hidden');
    
    // Draw perfect rectangle for comparison
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(perfectRect.x, perfectRect.y, perfectRect.width, perfectRect.height);
}

function calculateRectangleAccuracy(userRect, perfectRect) {
    // Calculate the overlap area
    const overlapX = Math.max(0, Math.min(userRect.x + userRect.width, perfectRect.x + perfectRect.width) - Math.max(userRect.x, perfectRect.x));
    const overlapY = Math.max(0, Math.min(userRect.y + userRect.height, perfectRect.y + perfectRect.height) - Math.max(userRect.y, perfectRect.y));
    const overlapArea = overlapX * overlapY;
    
    // Calculate areas
    const userArea = Math.abs(userRect.width * userRect.height);
    const perfectArea = Math.abs(perfectRect.width * perfectRect.height);
    
    // Calculate union area
    const unionArea = userArea + perfectArea - overlapArea;
    
    // Calculate accuracy as intersection over union
    const accuracy = unionArea > 0 ? (overlapArea / unionArea) * 100 : 0;
    
    return Math.round(Math.max(0, Math.min(100, accuracy)));
}

function getScoreMessage(score) {
    if (score >= 95) return "🎯 PERFECT! You're a rectangle master!";
    if (score >= 85) return "🔥 Excellent! Almost perfect!";
    if (score >= 75) return "👍 Great job! Very close!";
    if (score >= 60) return "😊 Good attempt! Getting there!";
    if (score >= 40) return "🤔 Not bad! Keep practicing!";
    if (score >= 20) return "😅 Room for improvement!";
    return "💀 Brain rot level: Maximum! Try again!";
}

function resetBorderGame() {
    initBorderGame();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initCookieClicker();
    showMainMenu();
});

// Add some fun easter eggs
document.addEventListener('keydown', function(event) {
    // Konami code easter egg
    if (event.code === 'KeyC' && event.altKey && currentGame === 'cookie-clicker') {
        gameState.cookies += 1000;
        updateCookieDisplay();
        updateUpgradeButtons();
        
        // Create rainbow effect
        const cookieBtn = document.getElementById('cookie-btn');
        cookieBtn.style.filter = 'hue-rotate(360deg) drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))';
        setTimeout(() => {
            cookieBtn.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))';
        }, 1000);
    }
});

// Add some particle effects for extra brain rot
function createParticleEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * 2 * Math.PI;
        const velocity = Math.random() * 100 + 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let opacity = 1;
        const gravity = 200;
        let vy_current = vy;
        
        const startTime = Date.now();
        
        function animateParticle() {
            const elapsed = (Date.now() - startTime) / 1000;
            const newX = x + vx * elapsed;
            const newY = y + vy_current * elapsed + 0.5 * gravity * elapsed * elapsed;
            
            opacity -= 0.02;
            
            particle.style.left = newX + 'px';
            particle.style.top = newY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                document.body.removeChild(particle);
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
} 