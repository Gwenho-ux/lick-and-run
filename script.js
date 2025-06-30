/**
 * Lick It & Run - Main Game Script
 * A browser-based game built with vanilla JavaScript and OOP principles
 */

// Game Configuration
const CONFIG = {
    GAME_DURATION: 60, // seconds
    LICK_GOAL: 15, // seconds
    FLASH_WARNING_TIME: 0.2, // seconds before stare
    PULSE_START_TIME: 3, // last 3 seconds
    MIN_STARE_INTERVAL: 3, // minimum seconds between stares
    MAX_STARE_INTERVAL: 8, // maximum seconds between stares
    STARE_DURATION: 2, // how long character stares
    FAKE_ALERT_CHANCE: 0.4, // 40% chance of fake alert
    COUNTDOWN_DURATION: 3 // countdown seconds
};

/**
 * Player Class - Manages player data and state
 */
class Player {
    constructor(name, email = '') {
        this.name = name;
        this.email = email;
        this.lickingTime = 0;
        this.completionTime = 0;
        this.outcome = null; // 'win', 'caught', 'timeout'
    }

    reset() {
        this.lickingTime = 0;
        this.completionTime = 0;
        this.outcome = null;
    }

    updateLickingTime(deltaTime) {
        this.lickingTime += deltaTime;
    }

    setOutcome(outcome, completionTime) {
        this.outcome = outcome;
        this.completionTime = completionTime;
    }

    getProgress() {
        return Math.min((this.lickingTime / CONFIG.LICK_GOAL) * 100, 100);
    }

    hasWon() {
        return this.lickingTime >= CONFIG.LICK_GOAL;
    }

    toLeaderboardEntry() {
        return {
            name: this.name,
            email: this.email,
            lickingTime: this.lickingTime.toFixed(2),
            completionTime: this.completionTime,
            outcome: this.outcome,
            timestamp: Date.now()
        };
    }
}

/**
 * Timer Class - Manages game timing
 */
class Timer {
    constructor(duration, onUpdate, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
        this.isRunning = false;
        this.lastTime = null;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.update();
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        this.remaining = this.duration;
        this.isRunning = false;
        this.lastTime = null;
    }

    update() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.remaining = Math.max(0, this.remaining - deltaTime);
        
        if (this.onUpdate) {
            this.onUpdate(this.remaining, deltaTime);
        }

        if (this.remaining <= 0) {
            this.stop();
            if (this.onComplete) {
                this.onComplete();
            }
        } else {
            requestAnimationFrame(() => this.update());
        }
    }

    getElapsed() {
        return this.duration - this.remaining;
    }
}

/**
 * Character Class - Manages character behavior and stare mechanics
 */
class Character {
    constructor(onStare, onFakeAlert, onFlashWarning) {
        this.isStaring = false;
        this.isFakeAlert = false;
        this.onStare = onStare;
        this.onFakeAlert = onFakeAlert;
        this.onFlashWarning = onFlashWarning;
        this.nextEventTime = this.getRandomEventTime();
        this.eventScheduled = false;
    }

    reset() {
        this.isStaring = false;
        this.isFakeAlert = false;
        this.nextEventTime = this.getRandomEventTime();
        this.eventScheduled = false;
    }

    update(elapsedTime) {
        if (elapsedTime >= this.nextEventTime && !this.eventScheduled) {
            this.eventScheduled = true;
            
            // Flash warning before event
            setTimeout(() => {
                this.onFlashWarning();
            }, (this.nextEventTime - elapsedTime - CONFIG.FLASH_WARNING_TIME) * 1000);

            // Execute event
            setTimeout(() => {
                if (Math.random() < CONFIG.FAKE_ALERT_CHANCE) {
                    this.executeFakeAlert();
                } else {
                    this.executeStare();
                }
            }, (this.nextEventTime - elapsedTime) * 1000);
        }
    }

    executeStare() {
        this.isStaring = true;
        if (this.onStare) this.onStare();

        setTimeout(() => {
            this.isStaring = false;
            this.scheduleNextEvent();
        }, CONFIG.STARE_DURATION * 1000);
    }

    executeFakeAlert() {
        this.isFakeAlert = true;
        if (this.onFakeAlert) this.onFakeAlert();

        setTimeout(() => {
            this.isFakeAlert = false;
            this.scheduleNextEvent();
        }, 1000); // Fake alerts last 1 second
    }

    scheduleNextEvent() {
        this.nextEventTime += this.getRandomEventTime();
        this.eventScheduled = false;
    }

    getRandomEventTime() {
        return Math.random() * (CONFIG.MAX_STARE_INTERVAL - CONFIG.MIN_STARE_INTERVAL) + CONFIG.MIN_STARE_INTERVAL;
    }
}

/**
 * AudioManager Class - Handles all game audio
 */
class AudioManager {
    constructor() {
        // Placeholder audio references
        this.sounds = {
            hum: 'assets/audio/hum-loop.mp3',
            lick: 'assets/audio/lick-sfx.mp3',
            caught: 'assets/audio/caught-scream.mp3',
            fakeAlert: 'assets/audio/umm-voice.mp3',
            countdown: 'assets/audio/countdown-tick.mp3',
            victory: 'assets/audio/victory-sting.mp3',
            intensify: 'assets/audio/music-intense.mp3'
        };

        // In a real implementation, these would be Audio objects
        this.audioElements = {};
    }

    preload() {
        // Placeholder for audio preloading
        console.log('Audio preloading placeholder');
    }

    play(soundName, loop = false) {
        console.log(`Playing sound: ${soundName}${loop ? ' (looped)' : ''}`);
    }

    stop(soundName) {
        console.log(`Stopping sound: ${soundName}`);
    }

    stopAll() {
        console.log('Stopping all sounds');
    }

    setVolume(soundName, volume) {
        console.log(`Setting ${soundName} volume to ${volume}`);
    }
}

/**
 * LeaderboardManager Class - Manages high scores
 */
class LeaderboardManager {
    constructor() {
        // Mock leaderboard data
        this.entries = [
            { name: 'CandyMaster', lickingTime: '15.23', completionTime: 42, outcome: 'win' },
            { name: 'SugarRush', lickingTime: '15.67', completionTime: 48, outcome: 'win' },
            { name: 'LickWizard', lickingTime: '15.45', completionTime: 51, outcome: 'win' },
            { name: 'SpeedLicker', lickingTime: '15.12', completionTime: 39, outcome: 'win' },
            { name: 'CandyNinja', lickingTime: '15.89', completionTime: 55, outcome: 'win' }
        ];
    }

    addEntry(playerData) {
        if (playerData.outcome === 'win') {
            this.entries.push(playerData);
            this.entries.sort((a, b) => a.completionTime - b.completionTime);
            this.entries = this.entries.slice(0, 10); // Keep top 10
        }
    }

    getTopEntries(count = 5) {
        return this.entries.slice(0, count);
    }

    saveToStorage() {
        // In a real app, this would save to localStorage or a backend
        console.log('Saving leaderboard to storage');
    }

    loadFromStorage() {
        // In a real app, this would load from localStorage or a backend
        console.log('Loading leaderboard from storage');
    }
}

/**
 * UIManager Class - Handles all UI updates and screen transitions
 */
class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('startScreen'),
            countdown: document.getElementById('countdownScreen'),
            game: document.getElementById('gameScreen'),
            winScreen: document.getElementById('winScreen'),
            loseScreenCaught: document.getElementById('loseScreenCaught'),
            loseScreenTimeout: document.getElementById('loseScreenTimeout')
        };

        this.elements = {
            // Start screen
            playerName: document.getElementById('playerName'),
            playerEmail: document.getElementById('playerEmail'),
            playButton: document.getElementById('playButton'),

            // Countdown
            countdownNumber: document.getElementById('countdownNumber'),

            // Game screen
            characterImage: document.getElementById('characterImage'),
            speechBubble: document.getElementById('speechBubble'),
            candyArea: document.getElementById('candyArea'),
            documentMode: document.getElementById('documentMode'),
            flashWarning: document.getElementById('flashWarning'),
            lickProgressBar: document.getElementById('lickProgressBar'),
            lickProgressText: document.getElementById('lickProgressText'),
            timerBar: document.getElementById('timerBar'),
            timerText: document.getElementById('timerText'),
            gameContainer: document.querySelector('.game-container'),
            sparkleParticles: document.getElementById('sparkleParticles'),

            // Win screen
            winLickTime: document.getElementById('winLickTime'),
            winCompletionTime: document.getElementById('winCompletionTime'),

            // Lose screen
            timeoutProgress: document.getElementById('timeoutProgress'),

            // Leaderboard
            leaderboard: document.getElementById('leaderboard'),
            leaderboardList: document.getElementById('leaderboardList'),

            // Replay buttons
            replayButtons: document.querySelectorAll('.replay-button')
        };
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    updateTimer(remaining) {
        const percentage = (remaining / CONFIG.GAME_DURATION) * 100;
        this.elements.timerBar.style.width = `${percentage}%`;
        this.elements.timerText.textContent = `${Math.ceil(remaining)}s`;

        // Pulse effect for last 3 seconds
        if (remaining <= CONFIG.PULSE_START_TIME) {
            this.elements.gameContainer.classList.add('pulse');
        }
    }

    updateLickProgress(progress) {
        this.elements.lickProgressBar.style.width = `${progress}%`;
        this.elements.lickProgressText.textContent = `${Math.floor(progress)}%`;
    }

    showLicking(isLicking) {
        if (isLicking) {
            this.elements.candyArea.classList.add('active');
            this.elements.documentMode.classList.remove('active');
            this.createSparkles();
        } else {
            this.elements.candyArea.classList.remove('active');
            this.elements.documentMode.classList.add('active');
            this.clearSparkles();
        }
    }

    showCharacterStare(isStaring) {
        if (isStaring) {
            this.elements.characterImage.src = 'assets/character-stare.png';
        } else {
            this.elements.characterImage.src = 'assets/character-back.png';
        }
    }

    showFakeAlert() {
        this.elements.speechBubble.classList.add('show');
        setTimeout(() => {
            this.elements.speechBubble.classList.remove('show');
        }, 1000);
    }

    flashWarning() {
        this.elements.flashWarning.classList.add('active');
        setTimeout(() => {
            this.elements.flashWarning.classList.remove('active');
        }, 200);
    }

    updateCountdown(number) {
        this.elements.countdownNumber.textContent = number;
        this.elements.countdownNumber.style.animation = 'none';
        setTimeout(() => {
            this.elements.countdownNumber.style.animation = 'countdownPulse 1s ease';
        }, 10);
    }

    showWinScreen(player) {
        this.elements.winLickTime.textContent = `${player.lickingTime.toFixed(2)}s`;
        this.elements.winCompletionTime.textContent = `${player.completionTime}s`;
        this.showScreen('winScreen');
        this.showLeaderboard();
    }

    showLoseScreen(reason, player = null) {
        if (reason === 'caught') {
            this.showScreen('loseScreenCaught');
        } else if (reason === 'timeout') {
            if (player) {
                this.elements.timeoutProgress.textContent = `${Math.floor(player.getProgress())}%`;
            }
            this.showScreen('loseScreenTimeout');
        }
    }

    updateLeaderboard(entries) {
        this.elements.leaderboardList.innerHTML = '';
        entries.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-time">${entry.completionTime}s</span>
            `;
            this.elements.leaderboardList.appendChild(item);
        });
    }

    showLeaderboard() {
        this.elements.leaderboard.classList.add('show');
    }

    hideLeaderboard() {
        this.elements.leaderboard.classList.remove('show');
    }

    createSparkles() {
        // Create sparkle particle effects
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle-particle';
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.animationDelay = `${Math.random() * 2}s`;
                this.elements.sparkleParticles.appendChild(sparkle);
            }, i * 200);
        }
    }

    clearSparkles() {
        this.elements.sparkleParticles.innerHTML = '';
    }

    getPlayerInput() {
        return {
            name: this.elements.playerName.value.trim() || 'Anonymous',
            email: this.elements.playerEmail.value.trim()
        };
    }

    validatePlayerInput() {
        const name = this.elements.playerName.value.trim();
        return name.length > 0;
    }
}

/**
 * EventManager Class - Handles all user input and events
 */
class EventManager {
    constructor(game) {
        this.game = game;
        this.isLicking = false;
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            keyup: this.handleKeyUp.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            mouseup: this.handleMouseUp.bind(this),
            touchstart: this.handleTouchStart.bind(this),
            touchend: this.handleTouchEnd.bind(this),
            contextmenu: (e) => e.preventDefault()
        };
    }

    initialize() {
        // Start screen events
        this.game.ui.elements.playButton.addEventListener('click', () => {
            if (this.game.ui.validatePlayerInput()) {
                this.game.startGame();
            } else {
                this.game.ui.elements.playerName.focus();
            }
        });

        // Enter key on name input
        this.game.ui.elements.playerName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.game.ui.validatePlayerInput()) {
                this.game.startGame();
            }
        });

        // Replay buttons
        this.game.ui.elements.replayButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.game.resetToStart();
            });
        });
    }

    startGameControls() {
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
        document.addEventListener('mousedown', this.boundHandlers.mousedown);
        document.addEventListener('mouseup', this.boundHandlers.mouseup);
        document.addEventListener('touchstart', this.boundHandlers.touchstart);
        document.addEventListener('touchend', this.boundHandlers.touchend);
        document.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    }

    stopGameControls() {
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
        document.removeEventListener('mousedown', this.boundHandlers.mousedown);
        document.removeEventListener('mouseup', this.boundHandlers.mouseup);
        document.removeEventListener('touchstart', this.boundHandlers.touchstart);
        document.removeEventListener('touchend', this.boundHandlers.touchend);
        document.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
        this.isLicking = false;
    }

    handleKeyDown(e) {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            this.startLicking();
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.stopLicking();
        }
    }

    handleMouseDown(e) {
        if (e.button === 0) { // Left click only
            this.startLicking();
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            this.stopLicking();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.startLicking();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.stopLicking();
    }

    startLicking() {
        if (!this.isLicking && this.game.state === 'playing') {
            this.isLicking = true;
            this.game.onLickStart();
        }
    }

    stopLicking() {
        if (this.isLicking) {
            this.isLicking = false;
            this.game.onLickEnd();
        }
    }
}

/**
 * Game Class - Main game controller
 */
class Game {
    constructor() {
        this.state = 'start'; // start, countdown, playing, ended
        this.player = null;
        this.timer = null;
        this.character = null;
        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.leaderboard = new LeaderboardManager();
        this.events = new EventManager(this);
        this.isLicking = false;

        this.initialize();
    }

    initialize() {
        this.events.initialize();
        this.audio.preload();
        this.leaderboard.loadFromStorage();
        this.updateLeaderboard();
    }

    startGame() {
        const playerData = this.ui.getPlayerInput();
        this.player = new Player(playerData.name, playerData.email);
        
        this.state = 'countdown';
        this.ui.showScreen('countdown');
        this.runCountdown();
    }

    runCountdown() {
        let count = CONFIG.COUNTDOWN_DURATION;
        this.ui.updateCountdown(count);
        this.audio.play('countdown');

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.ui.updateCountdown(count);
                this.audio.play('countdown');
            } else {
                clearInterval(countdownInterval);
                this.startGameplay();
            }
        }, 1000);
    }

    startGameplay() {
        this.state = 'playing';
        this.ui.showScreen('game');
        this.ui.hideLeaderboard();
        
        // Initialize game components
        this.timer = new Timer(
            CONFIG.GAME_DURATION,
            (remaining, deltaTime) => this.onTimerUpdate(remaining, deltaTime),
            () => this.onTimerComplete()
        );

        this.character = new Character(
            () => this.onCharacterStare(),
            () => this.onFakeAlert(),
            () => this.ui.flashWarning()
        );

        // Start game
        this.events.startGameControls();
        this.timer.start();
        this.audio.play('hum', true);
        this.ui.showLicking(false);
    }

    onTimerUpdate(remaining, deltaTime) {
        this.ui.updateTimer(remaining);
        
        // Update character behavior
        this.character.update(this.timer.getElapsed());

        // Update licking progress if licking
        if (this.isLicking && !this.character.isStaring) {
            this.player.updateLickingTime(deltaTime);
            this.ui.updateLickProgress(this.player.getProgress());

            // Check win condition
            if (this.player.hasWon()) {
                this.endGame('win');
            }
        }

        // Intensify music in last 3 seconds
        if (remaining <= CONFIG.PULSE_START_TIME && remaining > CONFIG.PULSE_START_TIME - deltaTime) {
            this.audio.play('intensify', true);
        }
    }

    onTimerComplete() {
        if (!this.player.hasWon()) {
            this.endGame('timeout');
        }
    }

    onLickStart() {
        if (this.character.isStaring) {
            // Player got caught!
            this.endGame('caught');
        } else {
            this.isLicking = true;
            this.ui.showLicking(true);
            this.audio.play('lick', true);
        }
    }

    onLickEnd() {
        this.isLicking = false;
        this.ui.showLicking(false);
        this.audio.stop('lick');
    }

    onCharacterStare() {
        this.ui.showCharacterStare(true);
        
        // Check if player is currently licking
        if (this.isLicking) {
            this.endGame('caught');
        }

        // Reset character after stare duration
        setTimeout(() => {
            if (this.state === 'playing') {
                this.ui.showCharacterStare(false);
            }
        }, CONFIG.STARE_DURATION * 1000);
    }

    onFakeAlert() {
        this.ui.showFakeAlert();
        this.audio.play('fakeAlert');
    }

    endGame(outcome) {
        this.state = 'ended';
        this.timer.stop();
        this.events.stopGameControls();
        this.audio.stopAll();

        const completionTime = Math.floor(this.timer.getElapsed());
        this.player.setOutcome(outcome, completionTime);

        // Add to leaderboard if won
        if (outcome === 'win') {
            this.leaderboard.addEntry(this.player.toLeaderboardEntry());
            this.updateLeaderboard();
            this.leaderboard.saveToStorage();
            this.audio.play('victory');
        } else if (outcome === 'caught') {
            this.audio.play('caught');
        }

        // Show appropriate end screen
        setTimeout(() => {
            if (outcome === 'win') {
                this.ui.showWinScreen(this.player);
            } else {
                this.ui.showLoseScreen(outcome, this.player);
            }
        }, outcome === 'caught' ? 1000 : 500);
    }

    resetToStart() {
        this.state = 'start';
        this.player = null;
        this.timer = null;
        this.character = null;
        this.isLicking = false;
        
        this.ui.hideLeaderboard();
        this.ui.showScreen('start');
        this.ui.elements.playerName.value = '';
        this.ui.elements.playerEmail.value = '';
        this.ui.elements.playerName.focus();
        
        // Reset UI elements
        this.ui.updateTimer(CONFIG.GAME_DURATION);
        this.ui.updateLickProgress(0);
        this.ui.showCharacterStare(false);
        this.ui.elements.gameContainer.classList.remove('pulse');
    }

    updateLeaderboard() {
        const topEntries = this.leaderboard.getTopEntries();
        this.ui.updateLeaderboard(topEntries);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    console.log('Lick It & Run - Game Initialized');
});
