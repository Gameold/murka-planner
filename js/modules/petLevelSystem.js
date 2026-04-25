// Система уровней и развития питомца

// Данные об уровнях
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

// Система туалета
function initLitterBox() {
    if (!gameData.pet.lastCleaned) {
        gameData.pet.lastCleaned = Date.now();
    }
    if (gameData.pet.needsLitter === undefined) {
        gameData.pet.needsLitter = 0;
    }
    if (gameData.pet.litterWarningSent === undefined) {
        gameData.pet.litterWarningSent = false;
    }
}

function updateLitterBox() {
    initLitterBox();
    const now = Date.now();
    const hoursSinceClean = (now - (gameData.pet.lastCleaned || now)) / (1000 * 3600);
    
    gameData.pet.needsLitter = Math.min(100, hoursSinceClean * 15);
    
    if (gameData.pet.needsLitter > 80 && !gameData.pet.litterWarningSent) {
        gameData.pet.litterWarningSent = true;
        showMessage(`😿 ${gameData.petName} хочет в туалет! Убери за ней лоток!`);
        playSound(440);
    }
    
    if (gameData.pet.needsLitter > 90 && !isSleeping()) {
        gameData.pet.happiness = Math.max(0, gameData.pet.happiness - 2);
        gameData.pet.clean = Math.max(0, gameData.pet.clean - 3);
    }
    
    if (gameData.pet.needsLitter < 30) {
        gameData.pet.litterWarningSent = false;
    }
}

function cleanLitterBox() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит! Не мешай ей`); return; }
    if (isSick()) { showMessage(`🤢 ${gameData.petName} болеет! Нельзя убирать сейчас`); return; }
    if (gameData.gems >= 2) {
        gameData.gems -= 2;
        gameData.pet.lastCleaned = Date.now();
        gameData.pet.needsLitter = 0;
        gameData.pet.clean = Math.min(100, gameData.pet.clean + 15);
        gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
        showEmotion('🧹✨');
        showMessage(`🧹 Лоток убран! +15% чистоты, +5% счастья`);
        playSound(820);
        saveGame();
        updatePetBars();
        updateGemsUI();
        renderLitterButton();
    } else showMessage(`💔 Нужно 2💎 для уборки лотка`);
}

function renderLitterButton() {
    const actionButtons = document.querySelector('.action-buttons');
    if (!actionButtons) return;
    
    let litterBtn = document.getElementById('actionCleanLitter');
    if (!litterBtn) {
        const newBtn = document.createElement('div');
        newBtn.id = 'actionCleanLitter';
        newBtn.className = 'action-btn';
        newBtn.innerHTML = `<span class="action-emoji">🚽</span><span class="action-name">Убрать лоток</span><span class="action-price">2💎</span><span class="action-limit" id="litterLimit">⚡</span>`;
        newBtn.onclick = cleanLitterBox;
        actionButtons.appendChild(newBtn);
        litterBtn = newBtn;
    }
    
    const needsPercent = gameData.pet.needsLitter || 0;
    const limitSpan = document.getElementById('litterLimit');
    if (limitSpan) {
        if (needsPercent > 80) limitSpan.innerHTML = '⚠️ СРОЧНО!';
        else if (needsPercent > 50) limitSpan.innerHTML = '🟡 Скоро нужно';
        else if (needsPercent > 20) limitSpan.innerHTML = '🟢 Нормально';
        else limitSpan.innerHTML = '✨ Чисто';
    }
    
    const isDisabled = isSleeping() || isSick();
    litterBtn.classList.toggle('disabled', isDisabled);
}

function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (gameData.dailyBonusClaimed !== today && gameData.streak > 0) {
        let bonus = 5;
        let message = `🔥 Ежедневный бонус за серию ${gameData.streak} дней: `;
        
        if (gameData.streak >= 30) {
            bonus = 30;
            message += `+30💎, +15% ко всем статам!`;
            gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 15);
            gameData.pet.energy = Math.min(100, gameData.pet.energy + 15);
            gameData.pet.hunger = Math.min(110, gameData.pet.hunger + 10);
            gameData.pet.clean = Math.min(100, gameData.pet.clean + 15);
        } else if (gameData.streak >= 14) {
            bonus = 20;
            message += `+20💎, +10% счастья и энергии!`;
            gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
            gameData.pet.energy = Math.min(100, gameData.pet.energy + 10);
        } else if (gameData.streak >= 7) {
            bonus = 15;
            message += `+15💎, +10% счастья!`;
            gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
        } else if (gameData.streak >= 3) {
            bonus = 10;
            message += `+10💎, +5% счастья!`;
            gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
        } else {
            bonus = 5;
            message += `+5💎!`;
        }
        
        gameData.gems += bonus;
        gameData.dailyBonusClaimed = today;
        showMessage(message);
        startConfetti();
        playSound(880);
        saveGame();
        updateGemsUI();
        updatePetBars();
    }
}

function addDailyProgress() {
    const today = new Date().toDateString();
    if (gameData.lastBonusDay !== today) {
        checkDailyBonus();
        gameData.lastBonusDay = today;
        
        if (gameData.streak > 0 && gameData.streak % 7 === 0 && gameData.lastWeekLevelUp !== gameData.streak) {
            gameData.lastWeekLevelUp = gameData.streak;
            gameData.gems += 25;
            showMessage(`🎉 Недельная серия! +25💎 и особый подарок! 🎉`);
            startConfetti();
            playSound(1046);
            saveGame();
            updateGemsUI();
        }
        
        checkLevelUp();
        saveGame();
    }
}

function getDaysWord(days) {
    if (days >= 11 && days <= 19) return 'дней';
    const lastDigit = days % 10;
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}

function renderLevelProgress() {
    const compactDate = document.getElementById('compactDate');
    if (compactDate) {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        compactDate.innerHTML = `${day}.${month}`;
    }
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
    
    // Показываем прогресс по обязательным заданиям
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
    
    const levelInfo = document.getElementById('levelInfo');
    if (levelInfo) {
        if (nextLevel) {
            const daysToNext = nextLevel.minDays - days;
            const progress = ((days - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100;
            levelInfo.innerHTML = `
                <div class="stat-card-icon">⭐</div>
                <div class="stat-card-value">${currentLevel.name}</div>
                <div class="stat-card-label">
                    ${daysToNext > 0 ? `До ${nextLevel.name}: ${daysToNext} ${getDaysWord(daysToNext)}` : 'Максимальный уровень!'}
                </div>
                <div class="bar-bg" style="margin-top: 8px;">
                    <div class="bar-fill" style="width: ${Math.min(100, Math.max(0, progress))}%; background: linear-gradient(90deg, #ffd700, #ff8c00); height: 6px;"></div>
                </div>
            `;
        } else {
            levelInfo.innerHTML = `
                <div class="stat-card-icon">🌟</div>
                <div class="stat-card-value">${currentLevel.name}</div>
                <div class="stat-card-label">Легендарный уровень!</div>
                <div class="bar-bg" style="margin-top: 8px;">
                    <div class="bar-fill" style="width: 100%; background: linear-gradient(90deg, #ffd700, #ff8c00); height: 6px;"></div>
                </div>
            `;
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