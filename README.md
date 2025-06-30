# 🍭 Lick It & Run

A modern, browser-based timing game built with vanilla JavaScript, HTML, and CSS. Features a clean object-oriented architecture and sci-fi cartoon aesthetics.

## 🎮 Game Overview

**Objective**: Accumulate 15 seconds of candy-licking time within 60 seconds without getting caught!

**How to Play**:
- Hold `SPACEBAR` or `CLICK` to lick the candy
- Release immediately when you see the red flash warning
- Stop licking if the character turns around
- Watch out for fake alerts - the character might say "Umm...?" without turning
- Win by reaching 15 seconds of total licking time

## 🚀 Quick Start

1. Open `index.html` in any modern web browser
2. Enter your name (email optional)
3. Click "START GAME"
4. Follow the on-screen instructions

No installation or server required - it's a standalone web game!

## 🎨 Features

### Game Mechanics
- **Dynamic Stare System**: Character randomly looks back with warning flash
- **Fake Alerts**: Sometimes the character makes sounds without turning
- **Progress Tracking**: Visual progress bar shows licking percentage
- **Timer System**: 60-second countdown with visual timer bar
- **Intensity Mode**: Last 3 seconds feature pulsing screen effects

### Visual Design
- Modern sci-fi cartoon aesthetic
- Purple, blue, and pink gradient color scheme
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Glowing effects and particle systems

### Technical Features
- **Object-Oriented Architecture**: Clean, modular code structure
- **No Dependencies**: Pure vanilla JavaScript
- **Responsive Design**: Works on all screen sizes
- **Leaderboard System**: Track top players (currently local)
- **Audio Manager**: Placeholder system for sound effects

## 📁 Project Structure

```
lick-it-and-run/
├── index.html          # Main game HTML
├── style.css           # All game styling
├── script.js           # Game logic (OOP)
├── README.md           # This file
└── assets/            # Asset folder (images/audio)
    └── README.md      # Asset requirements
```

## 🏗️ Architecture

The game uses a clean OOP structure with the following main classes:

- **Game**: Main controller coordinating all game systems
- **Player**: Manages player data and progress
- **Timer**: Handles game timing and countdowns
- **Character**: Controls stare behavior and fake alerts
- **UIManager**: Manages all UI updates and screen transitions
- **EventManager**: Handles user input (keyboard, mouse, touch)
- **AudioManager**: Placeholder for sound management
- **LeaderboardManager**: Tracks and displays high scores

## 🎯 Game States

1. **Start Screen**: Player registration and instructions
2. **Countdown**: 3-2-1 countdown before game starts
3. **Playing**: Main gameplay with licking/dodging mechanics
4. **End Screens**: Win/Lose screens with stats and replay option

## 📱 Responsive Design

- Desktop: 750x500px game canvas
- Mobile: Scales to fit screen with adapted controls
- Touch support for mobile devices

## 🔧 Configuration

Edit the `CONFIG` object in `script.js` to adjust:
- Game duration
- Licking goal time
- Stare intervals
- Warning flash timing
- Other gameplay parameters

## 🎵 Assets

The game works without assets but is designed to support:
- Character sprites (facing back/staring)
- Candy image
- Sound effects and music
- See `assets/README.md` for full asset requirements

## 🌟 Future Enhancements

- Online leaderboard system
- Multiple difficulty levels
- Power-ups and special candies
- Achievement system
- More character variations
- Actual audio implementation

## 🎮 Controls

- **Desktop**: `SPACEBAR` or `LEFT CLICK`
- **Mobile**: Touch and hold anywhere on screen

## 📝 License

This game was created as a demonstration of modern web game development using vanilla JavaScript with OOP principles.

---

Have fun playing **Lick It & Run**! 🍭✨ 