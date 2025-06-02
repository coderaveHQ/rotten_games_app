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
    },
    progressGame: {
        barsCompleted: 0,
        activeBars: 1,
        clickPower: 1,
        baseSpeed: 0.2,
        speedMultiplier: 1,
        maxBars: 8,
        bars: [],
        upgrades: {
            speed: { owned: 0, cost: 3 },
            power: { owned: 0, cost: 5 },
            multi: { owned: 0, cost: 10 }
        }
    },
    dvdGame: {
        cornerHits: 0,
        totalBounces: 0,
        bestStreak: 0,
        currentStreak: 0,
        isPlaying: false,
        isPaused: false,
        dvd: {
            x: 400,
            y: 250,
            width: 80,
            height: 50,
            velocityX: 5,
            velocityY: 3
        },
        paddle: {
            x: 20,
            y: 210,
            width: 15,
            height: 80
        },
        gameArea: {
            width: 800,
            height: 500
        }
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
    } else if (screenId === 'progress-bar') {
        initProgressGame();
    } else if (screenId === 'dvd-bouncer') {
        initDVDGame();
    }
}

function showMainMenu() {
    // Stop DVD game if running
    if (gameState.dvdGame.isPlaying) {
        gameState.dvdGame.isPlaying = false;
        if (gameState.dvdGame.animationId) {
            cancelAnimationFrame(gameState.dvdGame.animationId);
        }
    }
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
    
    // Remove any existing event listeners to prevent duplicates
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', continueDrawing);
    canvas.removeEventListener('mouseup', finishDrawing);
    canvas.removeEventListener('mouseleave', finishDrawing);
    
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
    
    // Add selecting class for cursor change
    canvas.classList.add('selecting');
    
    // Clear previous rectangle
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Prevent text selection during drawing
    event.preventDefault();
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
    
    // Draw Windows-style selection rectangle
    drawWindowsSelectionRect(ctx, gameState.borderGame.startX, gameState.borderGame.startY, width, height);
    
    // Store current rectangle
    gameState.borderGame.currentRect = {
        x: gameState.borderGame.startX,
        y: gameState.borderGame.startY,
        width: width,
        height: height
    };
}

function drawWindowsSelectionRect(ctx, x, y, width, height) {
    // Windows-style selection rectangle
    // Fill with semi-transparent blue (Windows 10/11 selection color)
    ctx.fillStyle = 'rgba(0, 120, 215, 0.3)';
    ctx.fillRect(x, y, width, height);
    
    // Draw solid border like native Windows (not dotted)
    ctx.strokeStyle = '#0078d7'; // Windows blue
    ctx.lineWidth = 1;
    ctx.setLineDash([]); // Solid line, not dotted
    ctx.strokeRect(x, y, width, height);
}

function finishDrawing() {
    if (!gameState.borderGame.isDrawing) return;
    
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    gameState.borderGame.isDrawing = false;
    
    // Remove selecting class
    canvas.classList.remove('selecting');
    
    if (gameState.borderGame.currentRect) {
        // Calculate score first
        calculateScore();
        
        // Clear the selection immediately like Windows
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

// Progress Bar Filler Game Logic
function initProgressGame() {
    const progressState = gameState.progressGame;
    
    // Reset if needed
    if (progressState.bars.length === 0) {
        progressState.bars = [];
        for (let i = 0; i < progressState.activeBars; i++) {
            createProgressBar(i);
        }
    }
    
    updateProgressDisplay();
    updateProgressUpgradeButtons();
    renderProgressBars();
    
    // Start progress bar auto-fill
    if (!progressState.intervalId) {
        progressState.intervalId = setInterval(updateProgressBars, 100);
    }
}

function createProgressBar(id) {
    const bar = {
        id: id,
        progress: 0,
        speed: gameState.progressGame.baseSpeed * gameState.progressGame.speedMultiplier,
        completed: false,
        title: `Progress Bar ${id + 1}`,
        color: getProgressBarColor(id)
    };
    
    gameState.progressGame.bars.push(bar);
    return bar;
}

function getProgressBarColor(id) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    return colors[id % colors.length];
}

function renderProgressBars() {
    const container = document.getElementById('progress-container');
    container.innerHTML = '';
    
    gameState.progressGame.bars.forEach((bar, index) => {
        const barElement = createProgressBarElement(bar, index);
        container.appendChild(barElement);
    });
}

function createProgressBarElement(bar, index) {
    const barDiv = document.createElement('div');
    barDiv.className = 'progress-bar-item';
    barDiv.dataset.barId = bar.id;
    
    if (bar.completed) {
        barDiv.classList.add('completed');
    }
    
    barDiv.innerHTML = `
        <div class="progress-bar-header">
            <div class="progress-bar-title">${bar.title}</div>
            <div class="progress-bar-percentage">${Math.floor(bar.progress)}%</div>
        </div>
        <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${bar.progress}%; background: linear-gradient(90deg, ${bar.color}, ${adjustBrightness(bar.color, 0.3)}, ${bar.color});"></div>
        </div>
        <div class="progress-bar-effects"></div>
    `;
    
    barDiv.addEventListener('click', (event) => clickProgressBar(bar.id, event));
    
    return barDiv;
}

function adjustBrightness(hex, factor) {
    // Simple brightness adjustment for gradient effect
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * factor * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function clickProgressBar(barId, event) {
    const bar = gameState.progressGame.bars.find(b => b.id === barId);
    if (!bar || bar.completed) return;
    
    // Increase progress
    bar.progress += gameState.progressGame.clickPower;
    if (bar.progress > 100) bar.progress = 100;
    
    // Create click effect
    createProgressClickEffect(event);
    
    // Check completion
    if (bar.progress >= 100 && !bar.completed) {
        completeProgressBar(bar);
    }
    
    updateProgressDisplay();
}

function createProgressClickEffect(event) {
    const effect = document.createElement('div');
    effect.className = 'click-effect-progress';
    effect.textContent = `+${gameState.progressGame.clickPower}%`;
    
    const rect = event.target.getBoundingClientRect();
    effect.style.left = (event.clientX - rect.left) + 'px';
    effect.style.top = (event.clientY - rect.top) + 'px';
    
    const barElement = event.target.closest('.progress-bar-item');
    const effectsContainer = barElement.querySelector('.progress-bar-effects');
    effectsContainer.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 1000);
}

function completeProgressBar(bar) {
    bar.completed = true;
    gameState.progressGame.barsCompleted++;
    
    // Create celebration effect
    createCompletionCelebration(bar);
    
    // Check if we should unlock new bars
    if (gameState.progressGame.bars.length < gameState.progressGame.maxBars) {
        setTimeout(() => {
            const newBar = createProgressBar(gameState.progressGame.bars.length);
            renderProgressBars();
            
            // Add unlock animation
            const newBarElement = document.querySelector(`[data-bar-id="${newBar.id}"]`);
            newBarElement.classList.add('unlocking');
        }, 1000);
    }
    
    updateProgressDisplay();
    updateProgressUpgradeButtons();
}

function createCompletionCelebration(bar) {
    // Create particle explosion effect
    const barElement = document.querySelector(`[data-bar-id="${bar.id}"]`);
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 0.5 + 's';
        
        barElement.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1500);
    }
}

function updateProgressBars() {
    if (currentGame !== 'progress-bar') return;
    
    let needsUpdate = false;
    
    gameState.progressGame.bars.forEach(bar => {
        if (!bar.completed) {
            bar.progress += bar.speed;
            if (bar.progress > 100) {
                bar.progress = 100;
                if (!bar.completed) {
                    completeProgressBar(bar);
                    needsUpdate = true;
                }
            }
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        updateProgressDisplay();
        updateProgressBarVisuals();
    }
}

function updateProgressBarVisuals() {
    gameState.progressGame.bars.forEach(bar => {
        const barElement = document.querySelector(`[data-bar-id="${bar.id}"]`);
        if (barElement) {
            const fillElement = barElement.querySelector('.progress-bar-fill');
            const percentageElement = barElement.querySelector('.progress-bar-percentage');
            
            fillElement.style.width = bar.progress + '%';
            percentageElement.textContent = Math.floor(bar.progress) + '%';
            
            if (bar.completed && !fillElement.classList.contains('completed')) {
                fillElement.classList.add('completed');
                barElement.classList.add('completed');
            }
        }
    });
}

function updateProgressDisplay() {
    document.getElementById('bars-completed').textContent = gameState.progressGame.barsCompleted;
    document.getElementById('active-bars').textContent = gameState.progressGame.bars.filter(b => !b.completed).length;
    document.getElementById('progress-click-power').textContent = gameState.progressGame.clickPower + '%';
}

function buyProgressUpgrade(type) {
    const upgrade = gameState.progressGame.upgrades[type];
    const cost = upgrade.cost + (upgrade.owned * Math.floor(upgrade.cost * 0.5));
    
    if (gameState.progressGame.barsCompleted >= cost) {
        gameState.progressGame.barsCompleted -= cost;
        upgrade.owned++;
        
        // Apply upgrade effects
        if (type === 'speed') {
            gameState.progressGame.speedMultiplier += 0.5;
            gameState.progressGame.bars.forEach(bar => {
                bar.speed = gameState.progressGame.baseSpeed * gameState.progressGame.speedMultiplier;
            });
        } else if (type === 'power') {
            gameState.progressGame.clickPower += 1;
        } else if (type === 'multi') {
            if (gameState.progressGame.bars.length < gameState.progressGame.maxBars) {
                const newBar = createProgressBar(gameState.progressGame.bars.length);
                renderProgressBars();
            }
        }
        
        updateProgressDisplay();
        updateProgressUpgradeButtons();
    }
}

function updateProgressUpgradeButtons() {
    ['speed', 'power', 'multi'].forEach(type => {
        const upgrade = gameState.progressGame.upgrades[type];
        const button = document.getElementById(`${type}-upgrade`);
        const costElement = button.querySelector('.upgrade-cost');
        const descElement = button.querySelector('.upgrade-desc');
        
        const cost = upgrade.cost + (upgrade.owned * Math.floor(upgrade.cost * 0.5));
        costElement.textContent = `${cost} completions`;
        
        // Update descriptions with owned count
        if (upgrade.owned > 0) {
            if (type === 'speed') {
                descElement.textContent = `+50% fill speed (owned: ${upgrade.owned})`;
            } else if (type === 'power') {
                descElement.textContent = `+1% per click (owned: ${upgrade.owned})`;
            } else if (type === 'multi') {
                descElement.textContent = `+1 active bar (owned: ${upgrade.owned})`;
            }
        }
        
        if (gameState.progressGame.barsCompleted >= cost) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.5';
        }
    });
}

// DVD Logo Bouncer Game Logic
function initDVDGame() {
    const dvdState = gameState.dvdGame;
    
    // Reset DVD position and velocity with randomization
    const gameAreaDimensions = dvdState.gameArea;
    const dvdWidth = dvdState.dvd.width;
    const dvdHeight = dvdState.dvd.height;
    
    // Random starting position (avoid edges and corners)
    dvdState.dvd.x = 200 + Math.random() * (gameAreaDimensions.width - dvdWidth - 300);
    dvdState.dvd.y = 50 + Math.random() * (gameAreaDimensions.height - dvdHeight - 100);
    
    // Random starting velocity direction and speed
    const baseSpeed = 4;
    const speedVariation = 2;
    dvdState.dvd.velocityX = (Math.random() > 0.5 ? 1 : -1) * (baseSpeed + Math.random() * speedVariation);
    dvdState.dvd.velocityY = (Math.random() > 0.5 ? 1 : -1) * (baseSpeed + Math.random() * speedVariation);
    
    // Reset paddle position
    dvdState.paddle.y = 210;
    
    // Update display
    updateDVDDisplay();
    
    // Set up mouse movement for paddle
    const gameArea = document.getElementById('dvd-game-area');
    gameArea.addEventListener('mousemove', updatePaddlePosition);
    
    // Hide success display
    document.getElementById('dvd-success-display').classList.add('hidden');
    
    // Start game loop
    dvdState.isPlaying = true;
    dvdState.isPaused = false;
    updateDVDGame();
}

function updatePaddlePosition(event) {
    if (!gameState.dvdGame.isPlaying || gameState.dvdGame.isPaused) return;
    
    const gameArea = document.getElementById('dvd-game-area');
    const paddle = document.getElementById('paddle');
    const rect = gameArea.getBoundingClientRect();
    
    const mouseY = event.clientY - rect.top;
    const paddleHeight = gameState.dvdGame.paddle.height;
    const gameHeight = gameState.dvdGame.gameArea.height;
    
    // Keep paddle within game area
    let newY = mouseY - paddleHeight / 2;
    newY = Math.max(0, Math.min(newY, gameHeight - paddleHeight));
    
    gameState.dvdGame.paddle.y = newY;
    paddle.style.top = newY + 'px';
}

function updateDVDGame() {
    if (!gameState.dvdGame.isPlaying) return;
    
    if (!gameState.dvdGame.isPaused) {
        updateDVDPosition();
        checkCollisions();
        checkCornerHit();
        renderDVDPosition();
    }
    
    gameState.dvdGame.animationId = requestAnimationFrame(updateDVDGame);
}

function updateDVDPosition() {
    const dvd = gameState.dvdGame.dvd;
    const gameArea = gameState.dvdGame.gameArea;
    
    // Update position
    dvd.x += dvd.velocityX;
    dvd.y += dvd.velocityY;
    
    // Bounce off top and bottom walls
    if (dvd.y <= 0 || dvd.y >= gameArea.height - dvd.height) {
        dvd.velocityY = -dvd.velocityY;
        dvd.y = Math.max(0, Math.min(dvd.y, gameArea.height - dvd.height));
        gameState.dvdGame.totalBounces++;
        updateDVDDisplay();
    }
    
    // Bounce off right wall
    if (dvd.x >= gameArea.width - dvd.width) {
        dvd.velocityX = -dvd.velocityX;
        dvd.x = gameArea.width - dvd.width;
        gameState.dvdGame.totalBounces++;
        updateDVDDisplay();
    }
    
    // Reset if DVD goes off left side (missed by paddle)
    if (dvd.x < 0) {
        resetDVDPosition();
        gameState.dvdGame.currentStreak = 0;
    }
}

function checkCollisions() {
    const dvd = gameState.dvdGame.dvd;
    const paddle = gameState.dvdGame.paddle;
    
    // Check collision with paddle
    if (dvd.x <= paddle.x + paddle.width &&
        dvd.x + dvd.width >= paddle.x &&
        dvd.y <= paddle.y + paddle.height &&
        dvd.y + dvd.height >= paddle.y &&
        dvd.velocityX < 0) {
        
        // Calculate bounce angle based on where it hits the paddle
        const hitPosition = (dvd.y + dvd.height / 2) - (paddle.y + paddle.height / 2);
        const normalizedHit = hitPosition / (paddle.height / 2);
        
        // Reverse X direction and adjust Y direction based on hit position
        dvd.velocityX = Math.abs(dvd.velocityX);
        dvd.velocityY = normalizedHit * 4; // Max 4 pixels per frame vertical speed
        
        // Ensure minimum horizontal speed
        if (Math.abs(dvd.velocityX) < 4) {
            dvd.velocityX = 4;
        }
        
        // Move DVD away from paddle to prevent sticking
        dvd.x = paddle.x + paddle.width;
        
        // Add visual feedback
        const paddleElement = document.getElementById('paddle');
        paddleElement.classList.add('hit');
        setTimeout(() => paddleElement.classList.remove('hit'), 300);
        
        gameState.dvdGame.totalBounces++;
        gameState.dvdGame.currentStreak++;
        updateDVDDisplay();
    }
}

function checkCornerHit() {
    const dvd = gameState.dvdGame.dvd;
    const gameArea = gameState.dvdGame.gameArea;
    const tolerance = 5; // Pixel tolerance for corner hits
    
    const corners = [
        { x: 0, y: 0, class: 'top-left' },
        { x: gameArea.width - dvd.width, y: 0, class: 'top-right' },
        { x: 0, y: gameArea.height - dvd.height, class: 'bottom-left' },
        { x: gameArea.width - dvd.width, y: gameArea.height - dvd.height, class: 'bottom-right' }
    ];
    
    corners.forEach(corner => {
        if (Math.abs(dvd.x - corner.x) <= tolerance && Math.abs(dvd.y - corner.y) <= tolerance) {
            // Corner hit!
            cornerHitSuccess(corner.class);
        }
    });
}

function cornerHitSuccess(cornerClass) {
    gameState.dvdGame.cornerHits++;
    if (gameState.dvdGame.currentStreak > gameState.dvdGame.bestStreak) {
        gameState.dvdGame.bestStreak = gameState.dvdGame.currentStreak;
    }
    
    // Visual effects
    const cornerIndicator = document.querySelector(`.corner-indicator.${cornerClass}`);
    cornerIndicator.classList.add('hit');
    
    const dvdElement = document.getElementById('dvd-logo');
    dvdElement.classList.add('corner-hit');
    
    // Show success message
    document.getElementById('dvd-success-display').classList.remove('hidden');
    
    // Pause game
    gameState.dvdGame.isPaused = true;
    
    updateDVDDisplay();
    
    // Remove visual effects after animation
    setTimeout(() => {
        cornerIndicator.classList.remove('hit');
        dvdElement.classList.remove('corner-hit');
    }, 1000);
}

function renderDVDPosition() {
    const dvdElement = document.getElementById('dvd-logo');
    const dvd = gameState.dvdGame.dvd;
    
    dvdElement.style.left = dvd.x + 'px';
    dvdElement.style.top = dvd.y + 'px';
}

function resetDVDPosition() {
    const dvd = gameState.dvdGame.dvd;
    const gameAreaDimensions = gameState.dvdGame.gameArea;
    
    // Random starting position (avoid edges and corners)
    dvd.x = 200 + Math.random() * (gameAreaDimensions.width - dvd.width - 300);
    dvd.y = 50 + Math.random() * (gameAreaDimensions.height - dvd.height - 100);
    
    // Random starting velocity direction and speed
    const baseSpeed = 4;
    const speedVariation = 2;
    dvd.velocityX = (Math.random() > 0.5 ? 1 : -1) * (baseSpeed + Math.random() * speedVariation);
    dvd.velocityY = (Math.random() > 0.5 ? 1 : -1) * (baseSpeed + Math.random() * speedVariation);
}

function updateDVDDisplay() {
    document.getElementById('corner-hits').textContent = gameState.dvdGame.cornerHits;
    document.getElementById('total-bounces').textContent = gameState.dvdGame.totalBounces;
    document.getElementById('best-streak').textContent = gameState.dvdGame.bestStreak;
}

function resetDVDGame() {
    gameState.dvdGame.cornerHits = 0;
    gameState.dvdGame.totalBounces = 0;
    gameState.dvdGame.bestStreak = 0;
    gameState.dvdGame.currentStreak = 0;
    
    document.getElementById('dvd-success-display').classList.add('hidden');
    
    initDVDGame();
}

function toggleDVDGame() {
    const gameArea = document.getElementById('dvd-game-area');
    const pauseBtn = document.getElementById('pause-dvd-game');
    
    if (gameState.dvdGame.isPaused) {
        gameState.dvdGame.isPaused = false;
        gameArea.classList.remove('paused');
        pauseBtn.textContent = 'Pause';
    } else {
        gameState.dvdGame.isPaused = true;
        gameArea.classList.add('paused');
        pauseBtn.textContent = 'Resume';
    }
}

function continueAfterCornerHit() {
    document.getElementById('dvd-success-display').classList.add('hidden');
    resetDVDPosition();
    gameState.dvdGame.isPaused = false;
    gameState.dvdGame.currentStreak = 0;
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