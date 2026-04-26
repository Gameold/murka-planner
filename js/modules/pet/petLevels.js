// Система уровней питомца

const LEVELS = [
    { minDays: 0, name: "Котёнок", emoji: "🐱", emojiBig: "🐱", bonusMultiplier: 0.7, unlockGames: ["yarn"] },
    { minDays: 3, name: "Подрос", emoji: "🐱‍👤", emojiBig: "😺", bonusMultiplier: 0.85, unlockGames: ["yarn", "ball"] },
    { minDays: 7, name: "Красавчик", emoji: "🐱‍🐉", emojiBig: "😸", bonusMultiplier: 1.0, unlockGames: ["yarn", "ball", "laser"] },
    { minDays: 14, name: "Королевский", emoji: "🐱‍👑", emojiBig: "😻", bonusMultiplier: 1.2, unlockGames: ["yarn", "ball", "laser", "candy"] },
    { minDays: 21, name: "Легендарный", emoji: "🐱‍🌟", emojiBig: "😺🌟", bonusMultiplier: 1.5, unlockGames: ["yarn", "ball", "laser", "candy"] }
];

function getCurrentLevel() {
    const days = gameData.streak || 0;
    let level = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (days >= LEVELS[i].minDays) {
            level = LEVELS[i];
            break;
        }
    }
    return level;
}

function getLevelBonus() {
    const level = getCurrentLevel();
    return level.bonusMultiplier;
}

function getCurrentLevelIndex() {
    const days = gameData.streak || 0;
    let levelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (days >= LEVELS[i].minDays) {
            levelIndex = i;
            break;
        }
    }
    return levelIndex;
}

function checkLevelUp() {
    const oldLevel = gameData.currentLevel || 0;
    const newLevelIndex = getCurrentLevelIndex();
    const newLevel = LEVELS[newLevelIndex];
    
    if (newLevelIndex > oldLevel) {
        gameData.currentLevel = newLevelIndex;
        
        const headerBlock = document.getElementById('headerLevelBlock');
        if (headerBlock) {
            headerBlock.style.transform = 'scale(1.02)';
            headerBlock.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                if (headerBlock) headerBlock.style.transform = 'scale(1)';
            }, 300);
        }
        
        showMessage(`🎉 УРА! ${gameData.petName} достигла уровня "${newLevel.name}"! 🎉`);
        
        const levelUpReward = 20 * (newLevelIndex + 1);
        gameData.gems += levelUpReward;
        gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 20);
        
        showMessage(`🎁 Подарок за уровень: +${levelUpReward}💎 и +20% счастья!`);
        startConfetti();
        playSound(1046);
        
        saveGame();
        updatePetBars();
        updateGemsUI();
        renderLevelProgress();
        updateGamesByLevel();
    }
}

function updatePetAvatarByLevel() {
    const level = getCurrentLevel();
    const av = document.getElementById('petAvatar');
    if (av && !isSleeping() && !isSick() && gameData.pet.hunger <= 100) {
        av.innerHTML = level.emojiBig;
    }
}

function isGameUnlocked(gameType) {
    const currentLevel = getCurrentLevel();
    return currentLevel.unlockGames.includes(gameType);
}

function updateGamesByLevel() {
    const currentLevel = getCurrentLevel();
    const allowedGames = currentLevel.unlockGames;
    
    const gameButtons = {
        yarn: document.getElementById('actionPlayYarn'),
        ball: document.getElementById('actionPlayBall'),
        laser: document.getElementById('actionPlayLaser'),
        candy: document.getElementById('actionPlayCandy')
    };
    
    Object.entries(gameButtons).forEach(([game, btn]) => {
        if (btn) {
            if (!allowedGames.includes(game)) {
                btn.classList.add('disabled');
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'auto';
                const gameName = { yarn: 'Клубок', ball: 'Мячик', laser: 'Лазер', candy: 'Фантик' }[game];
                btn.title = `🔒 Доступно на уровне "${currentLevel.name}"`;
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    showMessage(`🔒 Игра "${gameName}" откроется на уровне "${currentLevel.name}"!`);
                };
            } else {
                const cooldownKeys = {
                    yarn: 'playLastTime',
                    ball: 'playBallLastTime',
                    laser: 'playLaserLastTime',
                    candy: 'playCandyLastTime'
                };
                const cooldown = checkCooldown(cooldownKeys[game]);
                if (cooldown.canUse) {
                    btn.classList.remove('disabled');
                }
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
                btn.title = '';
                btn.onclick = () => playWithCat(game);
            }
        }
    });
}

function renderLevelProgress() {
    const currentLevelIndex = getCurrentLevelIndex();
    const currentLevel = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1];
    const days = gameData.streak || 0;
    
    const headerLevelIcon = document.getElementById('headerLevelIcon');
    const headerLevelName = document.getElementById('headerLevelName');
    const headerLevelProgressFill = document.getElementById('headerLevelProgressFill');
    const headerLevelNext = document.getElementById('headerLevelNext');
    
    if (headerLevelIcon) {
        if (currentLevelIndex >= 3) headerLevelIcon.innerHTML = '👑';
        else if (currentLevelIndex >= 1) headerLevelIcon.innerHTML = '⭐';
        else headerLevelIcon.innerHTML = '🍼';
    }
    
    if (headerLevelName) headerLevelName.innerHTML = currentLevel.name;
    
    if (typeof areAllRequiredTasksCompleted === 'function') {
        const completedRequired = REQUIRED_TASK_IDS.filter(id => 
            gameData.taskStatuses[`daily_${id}`] === 'rewarded'
        ).length;
        const totalRequired = REQUIRED_TASK_IDS.length;
        
        if (completedRequired < totalRequired && headerLevelNext) {
            headerLevelNext.innerHTML = `⚠️ Выполни ${totalRequired - completedRequired} обязательных дел для роста уровня ⚠️`;
            if (headerLevelProgressFill) headerLevelProgressFill.style.width = `${(completedRequired / totalRequired) * 100}%`;
        } else if (nextLevel && headerLevelNext) {
            const daysToNext = nextLevel.minDays - days;
            const progress = ((days - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100;
            
            if (headerLevelProgressFill) {
                headerLevelProgressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
            
            if (daysToNext > 0) {
                headerLevelNext.innerHTML = `До ${nextLevel.name}: ${daysToNext} ${getDaysWord(daysToNext)}`;
            } else {
                headerLevelNext.innerHTML = `✨ Макс. уровень! ✨`;
            }
        } else if (headerLevelNext) {
            if (headerLevelProgressFill) headerLevelProgressFill.style.width = '100%';
            headerLevelNext.innerHTML = `🌟 Легенда! 🌟`;
        }
    }
}

function updateStreakUI() {
    const streakElement = document.getElementById('streakCount');
    if (streakElement) {
        streakElement.innerText = gameData.streak || 0;
    }
    renderLevelProgress();
    updatePetAvatarByLevel();
    updateGamesByLevel();
}