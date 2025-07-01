/**
 * Lick It & Run - Main Game Script
 * A browser-based game built with vanilla JavaScript and OOP principles
 */

// Game Configuration
const CONFIG = {
    GAME_DURATION: 60, // seconds
    LICK_GOAL: 15, // seconds - reverted to original goal for better gameplay
    FLASH_WARNING_TIME: 0.8, // seconds before stare (decreased from 1.0 for less reaction time)
    PULSE_START_TIME: 3, // last 3 seconds
    MIN_STARE_INTERVAL: 4, // minimum seconds between stares (decreased from 5 - more frequent checks)
    MAX_STARE_INTERVAL: 12, // maximum seconds between stares (decreased from 15 - more frequent checks)
    MIN_STARE_DURATION: 1.5, // minimum stare duration (increased from 1.0)
    MAX_STARE_DURATION: 2.5, // maximum stare duration (increased from 2.0)
    FAKE_ALERT_CHANCE: 0.25, // 25% chance of fake alert (increased from 20%)
    COUNTDOWN_DURATION: 3, // countdown seconds
    PROGRESS_UPDATE_INTERVAL: 50, // milliseconds between progress updates (20 FPS for UI)
    SPARKLE_COUNT: 5 // reduced sparkle particles for better performance
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
        this.isAngry = false;
        this.onStare = onStare;
        this.onFakeAlert = onFakeAlert;
        this.onFlashWarning = onFlashWarning;
        this.nextEventTime = this.getRandomEventTime();
        this.eventScheduled = false;
        this.moveAnimationInterval = null;
        this.currentMoveImage = 1; // 1 or 2 for character-move.png and character-move-2.png
        this.characterImage = document.getElementById('characterImage');
        
        // Start the random movement animation
        this.startMoveAnimation();
    }

    reset() {
        this.isStaring = false;
        this.isFakeAlert = false;
        this.isAngry = false;
        this.nextEventTime = this.getRandomEventTime();
        this.eventScheduled = false;
        this.stopMoveAnimation();
        this.startMoveAnimation();
        this.showNormalState();
    }

    startMoveAnimation() {
        // Randomly switch between character-move.png and character-move-2.png
        this.moveAnimationInterval = setInterval(() => {
            if (!this.isStaring && !this.isAngry) {
                this.currentMoveImage = this.currentMoveImage === 1 ? 2 : 1;
                this.characterImage.src = `assets/Images/charactor/character-move${this.currentMoveImage === 2 ? '-2' : ''}.png`;
            }
        }, 500 + Math.random() * 1000); // Random interval between 0.5-1.5 seconds (50% faster)
    }

    stopMoveAnimation() {
        if (this.moveAnimationInterval) {
            clearInterval(this.moveAnimationInterval);
            this.moveAnimationInterval = null;
        }
    }

    showNormalState() {
        this.characterImage.src = `assets/Images/charactor/character-move.png`;
        this.currentMoveImage = 1;
    }

    showStareState() {
        this.characterImage.src = 'assets/Images/charactor/character-stare.png';
    }

    showAngryState() {
        this.isAngry = true;
        this.characterImage.src = 'assets/Images/charactor/character-angry.png';
    }

    update(elapsedTime) {
        // Check if it's time to show warning
        if (elapsedTime >= (this.nextEventTime - CONFIG.FLASH_WARNING_TIME) && !this.eventScheduled) {
            this.eventScheduled = true;
            
            // Show warning immediately
            this.onFlashWarning();

            // Execute event after warning time
            setTimeout(() => {
                if (Math.random() < CONFIG.FAKE_ALERT_CHANCE) {
                    this.executeFakeAlert();
                } else {
                    this.executeStare();
                }
            }, CONFIG.FLASH_WARNING_TIME * 1000);
        }
    }

    executeStare() {
        this.isStaring = true;
        this.showStareState();
        
        // Stop humming when character stares
        if (window.game && window.game.audio) {
            window.game.audio.stop('humming');
        }
        
        if (this.onStare) this.onStare();

        // Variable stare duration
        const stareDuration = Math.random() * (CONFIG.MAX_STARE_DURATION - CONFIG.MIN_STARE_DURATION) + CONFIG.MIN_STARE_DURATION;

        // Check immediately if player is not licking when stare starts
        if (window.game && window.game.state === 'playing' && !window.game.isLicking) {
            const messages = ["Attaboy!", "Working hard, huh?", "Keep it up!", "Good job!", "Nice work!"];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            // Hide warning bubble first
            const warningBubble = document.getElementById('warningBubble');
            if (warningBubble) {
                warningBubble.classList.remove('show');
            }
            
            // Show the message in speech bubble
            const speechBubble = document.getElementById('speechBubble');
            const speechText = speechBubble.querySelector('.speech-text');
            if (speechText && speechBubble) {
                speechText.textContent = randomMessage;
                speechBubble.classList.add('show');
                
                // Play happy sound
                if (window.game && window.game.audio) {
                    window.game.audio.play('happy');
                }
                
                // Hide speech bubble after 1.5 seconds or before stare ends
                const hideTime = Math.min(1500, (stareDuration * 1000) - 500);
                setTimeout(() => {
                    speechBubble.classList.remove('show');
                }, hideTime);
            }
        }

        setTimeout(() => {
            this.isStaring = false;
            this.showNormalState();
            this.scheduleNextEvent();
            
            // Resume humming after stare ends
            if (window.game && window.game.audio && window.game.state === 'playing') {
                window.game.audio.play('humming', true);
            }
        }, stareDuration * 1000);
    }

    executeFakeAlert() {
        this.isFakeAlert = true;
        if (this.onFakeAlert) this.onFakeAlert();

        setTimeout(() => {
            this.isFakeAlert = false;
            this.scheduleNextEvent();
        }, 1000); // Fake alerts last 1 second
    }

    // Called when player is caught licking
    onCaught() {
        this.stopMoveAnimation();
        this.showAngryState();
        
        // Show angry for 1 second, then the game will handle the transition to fail screen
        // The game controller will handle the delay and screen transition
    }

    scheduleNextEvent() {
        this.nextEventTime += this.getRandomEventTime();
        this.eventScheduled = false;
    }

    getRandomEventTime() {
        return Math.random() * (CONFIG.MAX_STARE_INTERVAL - CONFIG.MIN_STARE_INTERVAL) + CONFIG.MIN_STARE_INTERVAL;
    }

    destroy() {
        this.stopMoveAnimation();
        this.isStaring = false;
        this.isFakeAlert = false;
        this.isAngry = false;
        this.eventScheduled = false;
    }
}

/**
 * CandyManager Class - Manages candy progression through 5 states
 */
class CandyManager {
    constructor() {
        this.candyImage = document.getElementById('candyImage');
        this.currentState = 1; // Start with candy_1.png (biggest)
        this.maxState = 5; // candy_5.png is success state
    }

    reset() {
        this.currentState = 1;
        this.updateCandyImage();
    }

    updateProgress(progressPercentage) {
        // Calculate which candy state to show based on progress
        // 0-20% = candy_1, 20-40% = candy_2, 40-60% = candy_3, 60-80% = candy_4, 80-100% = candy_5
        const newState = Math.min(Math.floor(progressPercentage / 20) + 1, this.maxState);
        
        if (newState !== this.currentState) {
            this.currentState = newState;
            this.updateCandyImage();
        }
    }

    updateCandyImage() {
        this.candyImage.src = `assets/Images/candy/candy_${this.currentState}.png`;
    }

    isSuccess() {
        return this.currentState >= this.maxState;
    }
}

/**
 * AudioManager Class - Handles all game audio
 */
class AudioManager {
    constructor() {
        // Define all sound files
        this.sounds = {
            background: 'assets/audio/background.mp3',
            humming: 'assets/audio/humming.mp3',
            click: 'assets/audio/click.mp3',
            lick: 'assets/audio/lick.mp3',
            switch: 'assets/audio/switch.mp3',
            win: 'assets/audio/win.mp3',
            lose: 'assets/audio/lose.mp3',
            warning: 'assets/audio/warning.mp3',
            happy: 'assets/audio/happy.mp3'
        };

        // Create Audio objects for each sound
        this.audioElements = {};
        this.isInitialized = false;
        
        // Mute states
        this.musicMuted = false;
        this.sfxMuted = false;
        
        // Track which sounds are music vs sfx
        this.musicSounds = ['background'];
        this.sfxSounds = ['humming', 'click', 'lick', 'switch', 'win', 'lose', 'warning', 'happy'];
        
        // Track if background music has been started
        this.backgroundMusicStarted = false;
    }

    preload() {
        // Create Audio objects for all sounds
        Object.entries(this.sounds).forEach(([name, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            // Set up looping for specific sounds
            if (name === 'background' || name === 'humming' || name === 'lick') {
                audio.loop = true;
            }
            
            // Set volumes
            if (name === 'background') {
                audio.volume = 0.1; // Background music quieter
            } else if (name === 'humming') {
                audio.volume = 0.3;
            } else if (name === 'click' || name === 'lick' || name === 'win' || name === 'lose') {
                audio.volume = 1.0;
            } else if (name === 'switch') {
                audio.volume = 0.3;
            } else if (name === 'warning') {
                audio.volume = 0.7;
            } else if (name === 'happy') {
                audio.volume = 0.8;
            } else {
                audio.volume = 0.7;
            }
            
            this.audioElements[name] = audio;
        });
        
        this.isInitialized = true;
    }

    play(soundName, loop = false) {
        if (!this.isInitialized) {
            this.preload();
        }
        
        // Check if sound should be muted
        if (this.musicSounds.includes(soundName) && this.musicMuted) return;
        if (this.sfxSounds.includes(soundName) && this.sfxMuted) return;
        
        const audio = this.audioElements[soundName];
        if (audio) {
            // Reset the audio to start
            audio.currentTime = 0;
            
            // Set loop if specified
            if (loop !== undefined) {
                audio.loop = loop;
            }
            
            // Track if background music has started
            if (soundName === 'background') {
                this.backgroundMusicStarted = true;
            }
            
            // Play the sound
            audio.play().catch(error => {
                console.warn(`Failed to play sound: ${soundName}`, error);
            });
        }
    }

    stop(soundName) {
        const audio = this.audioElements[soundName];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    stopAll() {
        Object.values(this.audioElements).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    setVolume(soundName, volume) {
        const audio = this.audioElements[soundName];
        if (audio) {
            audio.volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    // Fade out a sound over duration milliseconds
    fadeOut(soundName, duration = 1000) {
        const audio = this.audioElements[soundName];
        if (audio && !audio.paused) {
            const startVolume = audio.volume;
            const fadeInterval = 50; // Update every 50ms
            const fadeSteps = duration / fadeInterval;
            const volumeStep = startVolume / fadeSteps;
            
            const fade = setInterval(() => {
                if (audio.volume > volumeStep) {
                    audio.volume -= volumeStep;
                } else {
                    audio.volume = 0;
                    audio.pause();
                    audio.volume = startVolume; // Reset volume for next play
                    clearInterval(fade);
                }
            }, fadeInterval);
        }
    }
    
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        
        // Stop music if muted
        if (this.musicMuted) {
            this.musicSounds.forEach(soundName => {
                const audio = this.audioElements[soundName];
                if (audio && !audio.paused) {
                    audio.pause();
                }
            });
        } else {
            // Resume background music if it was previously started
            if (this.backgroundMusicStarted) {
                this.play('background', true);
            }
        }
        
        return this.musicMuted;
    }
    
    toggleSFX() {
        this.sfxMuted = !this.sfxMuted;
        
        // Stop all sfx if muted
        if (this.sfxMuted) {
            this.sfxSounds.forEach(soundName => {
                const audio = this.audioElements[soundName];
                if (audio && !audio.paused) {
                    audio.pause();
                }
            });
        }
        
        return this.sfxMuted;
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
            warningBubble: document.getElementById('warningBubble'),
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
        // Only update the text, no progress bar animation
        this.elements.timerText.textContent = `⏰ ${Math.ceil(remaining)}s`;

        // Red frame effect for last 5 seconds
        if (remaining <= 5 && !this.elements.gameContainer.classList.contains('critical-time')) {
            this.elements.gameContainer.classList.add('critical-time');
        }

        // Pulse effect for last 3 seconds
        if (remaining <= CONFIG.PULSE_START_TIME) {
            this.elements.gameContainer.classList.add('pulse');
        }
    }

    updateLickProgress(progress) {
        this.elements.lickProgressBar.style.width = `${progress}%`;
        this.elements.lickProgressText.textContent = `${Math.floor(progress)}%`;
        
        // Also update the new candy progress bar
        const candyProgressBar = document.getElementById('candyProgressBar');
        const candyProgressText = document.getElementById('candyProgressText');
        if (candyProgressBar && candyProgressText) {
            candyProgressBar.style.width = `${progress}%`;
            candyProgressText.textContent = `${Math.floor(progress)}%`;
        }
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

    showFakeAlert() {
        // Fake alerts now use the same warning as real stares
        // The warning already shows via flashWarning()
    }

    flashWarning() {
        // Hide any existing speech bubble first
        this.elements.speechBubble.classList.remove('show');
        
        // Show exclamation mark in warning bubble (red/orange)
        const warningText = this.elements.warningBubble.querySelector('.warning-text');
        if (warningText) {
            warningText.textContent = '!';
        }
        this.elements.warningBubble.classList.add('show');
        
        // Play warning sound
        if (window.game && window.game.audio) {
            window.game.audio.play('warning');
        }
        
        // Hide after 1.5 seconds
        setTimeout(() => {
            this.elements.warningBubble.classList.remove('show');
        }, 1500);
    }

    updateCountdown(number) {
        this.elements.countdownNumber.textContent = number;
        this.elements.countdownNumber.style.animation = 'none';
        setTimeout(() => {
            this.elements.countdownNumber.style.animation = 'countdownPulse 1s ease';
        }, 10);
    }

    showWinScreen(player) {
        // Hide the licking time stat item since we're not showing it
        const lickTimeStatItem = this.elements.winLickTime.closest('.stat-item');
        if (lickTimeStatItem) {
            lickTimeStatItem.style.display = 'none';
        }
        
        // Format completion time with decimal places
        this.elements.winCompletionTime.textContent = `${player.completionTime.toFixed(2)}s`;
        this.showScreen('winScreen');
        this.showLeaderboard();
    }

    showLoseScreen(reason, player = null) {
        if (reason === 'caught') {
            if (player) {
                const caughtProgress = document.getElementById('caughtProgress');
                if (caughtProgress) {
                    caughtProgress.textContent = `${Math.floor(player.getProgress())}%`;
                }
            }
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
            const timeFormatted = typeof entry.completionTime === 'number' 
                ? `${entry.completionTime.toFixed(2)}s` 
                : `${entry.completionTime}s`;
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-time">${timeFormatted}</span>
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
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle-particle';
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.animationDelay = `${Math.random() * 2}s`;
                // Add some variation in size (20% smaller)
                const scale = 0.64 + Math.random() * 0.32; // 0.64 to 0.96
                sparkle.style.transform = `scale(${scale})`;
                this.elements.sparkleParticles.appendChild(sparkle);
            }, i * 100);
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
        this.isMobileDevice = this.detectMobileDevice();
        this.mobileLickButton = null;
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            keyup: this.handleKeyUp.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            mouseup: this.handleMouseUp.bind(this),
            touchstart: this.handleTouchStart.bind(this),
            touchend: this.handleTouchEnd.bind(this),
            contextmenu: (e) => e.preventDefault(),
            mobileLickStart: this.handleMobileLickStart.bind(this),
            mobileLickEnd: this.handleMobileLickEnd.bind(this)
        };
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }

    initialize() {
        // Get mobile lick button reference
        this.mobileLickButton = document.getElementById('mobileLickButton');
        
        // Start screen events
        this.game.ui.elements.playButton.addEventListener('click', () => {
            this.game.audio.play('click'); // Play click sound
            if (this.game.ui.validatePlayerInput()) {
                this.game.startGame();
            } else {
                this.game.ui.elements.playerName.focus();
            }
        });

        // Enter key on name input
        this.game.ui.elements.playerName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.game.ui.validatePlayerInput()) {
                this.game.audio.play('click'); // Play click sound
                this.game.startGame();
            }
        });

        // Replay buttons
        this.game.ui.elements.replayButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.game.audio.play('click'); // Play click sound
                this.game.resetToStart();
            });
        });
        
        // Audio toggle buttons
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                const isMuted = this.game.audio.toggleMusic();
                musicToggle.classList.toggle('music-off', isMuted);
                musicToggle.classList.toggle('music-on', !isMuted);
            });
        }
        
        if (sfxToggle) {
            sfxToggle.addEventListener('click', () => {
                const isMuted = this.game.audio.toggleSFX();
                sfxToggle.classList.toggle('sfx-off', isMuted);
                sfxToggle.classList.toggle('sfx-on', !isMuted);
                // Play a click sound to test if sfx is on (won't play if just muted)
                this.game.audio.play('click');
            });
        }
    }

    startGameControls() {
        // On mobile devices, only listen to the mobile button
        if (this.isMobileDevice && this.mobileLickButton) {
            this.mobileLickButton.addEventListener('touchstart', this.boundHandlers.mobileLickStart);
            this.mobileLickButton.addEventListener('touchend', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.addEventListener('touchcancel', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.addEventListener('mousedown', this.boundHandlers.mobileLickStart);
            this.mobileLickButton.addEventListener('mouseup', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.addEventListener('mouseleave', this.boundHandlers.mobileLickEnd);
        } else {
            // Desktop controls
            document.addEventListener('keydown', this.boundHandlers.keydown);
            document.addEventListener('keyup', this.boundHandlers.keyup);
            
            // Attach mouse events only to game container on desktop
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.addEventListener('mousedown', this.boundHandlers.mousedown);
                gameContainer.addEventListener('mouseup', this.boundHandlers.mouseup);
                gameContainer.addEventListener('touchstart', this.boundHandlers.touchstart);
                gameContainer.addEventListener('touchend', this.boundHandlers.touchend);
            }
        }
        document.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    }

    stopGameControls() {
        // Remove mobile button listeners
        if (this.isMobileDevice && this.mobileLickButton) {
            this.mobileLickButton.removeEventListener('touchstart', this.boundHandlers.mobileLickStart);
            this.mobileLickButton.removeEventListener('touchend', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.removeEventListener('touchcancel', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.removeEventListener('mousedown', this.boundHandlers.mobileLickStart);
            this.mobileLickButton.removeEventListener('mouseup', this.boundHandlers.mobileLickEnd);
            this.mobileLickButton.removeEventListener('mouseleave', this.boundHandlers.mobileLickEnd);
        } else {
            // Desktop controls
            document.removeEventListener('keydown', this.boundHandlers.keydown);
            document.removeEventListener('keyup', this.boundHandlers.keyup);
            
            // Remove mouse events from game container on desktop
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.removeEventListener('mousedown', this.boundHandlers.mousedown);
                gameContainer.removeEventListener('mouseup', this.boundHandlers.mouseup);
                gameContainer.removeEventListener('touchstart', this.boundHandlers.touchstart);
                gameContainer.removeEventListener('touchend', this.boundHandlers.touchend);
            }
        }
        document.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
        this.isLicking = false;
    }

    handleMobileLickStart(e) {
        e.preventDefault();
        if (this.game.state === 'playing') {
            this.startLicking();
        }
    }

    handleMobileLickEnd(e) {
        e.preventDefault();
        if (this.game.state === 'playing') {
            this.stopLicking();
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault(); // Always prevent default spacebar behavior
            if (!e.repeat && this.game.state === 'playing') {
                this.startLicking();
            }
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            e.preventDefault(); // Always prevent default spacebar behavior
            if (this.game.state === 'playing') {
                this.stopLicking();
            }
        }
    }

    handleMouseDown(e) {
        if (e.button === 0 && this.game.state === 'playing') { // Left click only during gameplay
            // Ignore clicks on UI elements (timer, audio controls, etc.)
            const clickedElement = e.target;
            const isUIElement = clickedElement.closest('.timer-bar') || 
                              clickedElement.closest('.audio-controls') ||
                              clickedElement.closest('.leaderboard');
            
            if (!isUIElement) {
                this.startLicking();
            }
        }
    }

    handleMouseUp(e) {
        if (e.button === 0 && this.game.state === 'playing') {
            this.stopLicking();
        }
    }

    handleTouchStart(e) {
        if (this.game.state === 'playing') {
            e.preventDefault();
            this.startLicking();
        }
    }

    handleTouchEnd(e) {
        if (this.game.state === 'playing') {
            e.preventDefault();
            this.stopLicking();
        }
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
        this.candyManager = new CandyManager();
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
        
        // Start playing background music on first user interaction
        this.musicStarted = false;
        
        // Global spacebar prevention - prevent spacebar from triggering any default behavior
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        // Add event listener for first user interaction to start background music
        const startMusicOnInteraction = (e) => {
            // Ignore spacebar key to prevent interference with game controls
            if (e && e.type === 'keydown' && e.code === 'Space') {
                return;
            }
            
            if (!this.musicStarted && !this.audio.musicMuted) {
                this.audio.play('background', true);
                this.musicStarted = true;
                // Remove the event listeners after first interaction
                document.removeEventListener('click', startMusicOnInteraction);
                document.removeEventListener('touchstart', startMusicOnInteraction);
                document.removeEventListener('keydown', startMusicOnInteraction);
            }
        };
        
        // Listen for any user interaction to start background music
        document.addEventListener('click', startMusicOnInteraction);
        document.addEventListener('touchstart', startMusicOnInteraction);
        document.addEventListener('keydown', startMusicOnInteraction);
        
        // Store the function reference for manual calls
        this.startBackgroundMusic = () => {
            if (!this.musicStarted && !this.audio.musicMuted) {
                this.audio.play('background', true);
                this.musicStarted = true;
            }
        };
    }

    startGame() {
        const playerData = this.ui.getPlayerInput();
        this.player = new Player(playerData.name, playerData.email);
        
        // Start background music when game starts
        this.startBackgroundMusic();
        
        this.state = 'countdown';
        this.ui.showScreen('countdown');
        this.runCountdown();
    }

    runCountdown() {
        let count = CONFIG.COUNTDOWN_DURATION;
        this.ui.updateCountdown(count);
        // Remove click sound from initial countdown
        this.audio.play('humming', true); // Start humming during countdown

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.ui.updateCountdown(count);
                // Remove click sound from countdown updates
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
        
        // Humming already playing from countdown, background music from initialization
        
        this.ui.showLicking(false);
    }

    onTimerUpdate(remaining, deltaTime) {
        this.ui.updateTimer(remaining);
        
        // Update character behavior
        this.character.update(this.timer.getElapsed());

        // Update licking progress if licking
        if (this.isLicking && !this.character.isStaring) {
            this.player.updateLickingTime(deltaTime);
            const progress = this.player.getProgress();
            this.ui.updateLickProgress(progress);
            
            // Update candy progression
            this.candyManager.updateProgress(progress);

            // Check win condition
            if (this.player.hasWon() && this.state === 'playing') {
                this.endGame('win');
            }
        }

        // Play warning sound in last 3 seconds
        if (remaining <= CONFIG.PULSE_START_TIME && remaining > CONFIG.PULSE_START_TIME - deltaTime) {
            this.audio.play('warning');
        }
    }

    onTimerComplete() {
        // Only trigger timeout if game is still playing and player hasn't won
        if (this.state === 'playing' && !this.player.hasWon()) {
            // Show angry face for timeout as well
            if (this.character) {
                this.character.onCaught();
            }
            this.endGame('timeout');
        }
    }

    onLickStart() {
        if (this.character.isStaring) {
            // Player got caught!
            this.character.onCaught();
            this.endGame('caught');
        } else {
            this.isLicking = true;
            this.ui.showLicking(true);
            this.audio.play('switch'); // Play switch sound when changing to candy
            this.audio.play('lick', true);
        }
    }

    onLickEnd() {
        this.isLicking = false;
        this.ui.showLicking(false);
        this.audio.stop('lick');
        this.audio.play('switch'); // Play switch sound when changing to folder
    }

    onCharacterStare() {
        // Check if player is currently licking
        if (this.isLicking) {
            this.character.onCaught();
            this.endGame('caught');
        }
    }

    onFakeAlert() {
        this.ui.showFakeAlert();
        this.audio.play('warning'); // Play warning sound for fake alerts too
    }

    endGame(outcome) {
        // Prevent multiple endGame calls
        if (this.state === 'ended') {
            return;
        }
        
        // Calculate completion time BEFORE stopping the timer
        const completionTime = this.timer ? this.timer.getElapsed() : 0;
        console.log('Game ending - completion time:', completionTime);
        
        this.state = 'ended';
        if (this.timer) {
            this.timer.stop();
        }
        this.events.stopGameControls();
        
        // Stop game sounds but keep background music
        this.audio.stop('lick');
        this.audio.stop('humming');

        this.player.setOutcome(outcome, completionTime);

        // Add to leaderboard if won
        if (outcome === 'win') {
            this.leaderboard.addEntry(this.player.toLeaderboardEntry());
            this.updateLeaderboard();
            this.leaderboard.saveToStorage();
            this.audio.play('win');
        } else if (outcome === 'caught' || outcome === 'timeout') {
            this.audio.play('lose');
        }

        // Show appropriate end screen
        // For fail cases, ensure angry face is shown for 2 seconds
        setTimeout(() => {
            if (outcome === 'win') {
                this.ui.showWinScreen(this.player);
            } else {
                this.ui.showLoseScreen(outcome, this.player);
            }
        }, outcome === 'caught' ? 2000 : (outcome === 'timeout' ? 2000 : 500));
    }

    resetToStart() {
        // Ensure we're not in an ended state that might cause issues
        if (this.state === 'ended') {
            this.state = 'resetting';
        }
        
        this.state = 'start';
        this.player = null;
        this.timer = null;
        
        // Clean up character
        if (this.character) {
            this.character.destroy();
            this.character = null;
        }
        
        this.isLicking = false;
        
        this.ui.hideLeaderboard();
        this.ui.showScreen('start');
        this.ui.elements.playerName.value = '';
        this.ui.elements.playerEmail.value = '';
        this.ui.elements.playerName.focus();
        
        // Reset UI elements
        this.ui.updateTimer(CONFIG.GAME_DURATION);
        this.ui.updateLickProgress(0);
        this.candyManager.reset();
        this.ui.elements.gameContainer.classList.remove('pulse');
        this.ui.elements.gameContainer.classList.remove('critical-time');
        this.ui.elements.timerBar.classList.remove('timer-green', 'timer-yellow', 'timer-red');
        
        // Hide any lingering bubbles
        this.ui.elements.speechBubble.classList.remove('show');
        this.ui.elements.warningBubble.classList.remove('show');
        
        // Reset character image to normal state
        const characterImage = document.getElementById('characterImage');
        if (characterImage) {
            characterImage.src = 'assets/Images/charactor/character-move.png';
        }
        
        // Reset win screen stat visibility
        const lickTimeStatItem = this.ui.elements.winLickTime?.closest('.stat-item');
        if (lickTimeStatItem) {
            lickTimeStatItem.style.display = '';
        }
    }

    updateLeaderboard() {
        const topEntries = this.leaderboard.getTopEntries();
        this.ui.updateLeaderboard(topEntries);
    }

    updateInstructionText() {
        const gameInstruction = document.querySelector('.game-instruction p');
        const startInstruction = document.querySelector('.lick-instruction');
        
        if (this.events.isMobileDevice) {
            if (gameInstruction) {
                gameInstruction.innerHTML = 'Click and hold the button<br>to lick the candy';
            }
            if (startInstruction) {
                startInstruction.innerHTML = 'Click and hold the <strong>BUTTON</strong><br>to lick the candy';
            }
        } else {
            if (gameInstruction) {
                gameInstruction.innerHTML = 'Hold <strong>SPACEBAR</strong> or <strong>CLICK</strong> to lick the candy';
            }
            if (startInstruction) {
                startInstruction.innerHTML = 'Hold <strong>SPACEBAR</strong> or <strong>CLICK</strong> to lick the candy';
            }
        }
    }


}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.updateInstructionText();
    console.log('Lick It & Run - Game Initialized');
});
