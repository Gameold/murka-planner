function openNameModal() {
    const nameInput = document.getElementById('newNameInput');
    if (nameInput) {
        nameInput.value = '';
        nameInput.placeholder = 'Введите новое имя';
    }
    
    updateFreeNameButtonState();
    const nameModal = document.getElementById('nameModal');
    if (nameModal) nameModal.classList.add('active');
}

function closeNameModal() {
    const nameModal = document.getElementById('nameModal');
    if (nameModal) nameModal.classList.remove('active');
    const nameInput = document.getElementById('newNameInput');
    if (nameInput) {
        nameInput.value = '';
        nameInput.placeholder = 'Введите новое имя';
    }
}

function updateFreeNameButtonState() {
    const freeBtn = document.getElementById('freeNameBtn');
    if (!freeBtn) return;
    
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    const lastChange = gameData.lastNameChange;
    
    if (lastChange && (now - lastChange) < monthInMs) {
        const daysLeft = Math.ceil((monthInMs - (now - lastChange)) / (24 * 60 * 60 * 1000));
        freeBtn.style.display = 'none';
        
        let timerText = document.getElementById('freeNameTimer');
        if (!timerText) {
            timerText = document.createElement('div');
            timerText.id = 'freeNameTimer';
            timerText.className = 'name-timer';
            const nameNote = document.getElementById('nameChangeNote');
            if (nameNote && nameNote.parentNode) {
                nameNote.parentNode.insertBefore(timerText, nameNote.nextSibling);
            }
        }
        timerText.innerHTML = `⏳ Бесплатная смена имени будет доступна через ${daysLeft} ${getDaysWord(daysLeft)}`;
        timerText.style.display = 'block';
    } else {
        freeBtn.style.display = 'block';
        const timerText = document.getElementById('freeNameTimer');
        if (timerText) timerText.style.display = 'none';
    }
}

function changeNameFree() {
    const newNameInput = document.getElementById('newNameInput');
    if (!newNameInput) return;
    const newName = newNameInput.value.trim();
    
    if (!newName) {
        showMessage(`❌ Введите имя!`);
        newNameInput.placeholder = 'Введите новое имя';
        newNameInput.focus();
        return;
    }
    
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    
    if (gameData.lastNameChange && (now - gameData.lastNameChange) < monthInMs) {
        const daysLeft = Math.ceil((monthInMs - (now - gameData.lastNameChange)) / (24 * 60 * 60 * 1000));
        showMessage(`❌ Бесплатно можно сменить только через ${daysLeft} ${getDaysWord(daysLeft)}!`);
        return;
    }
    
    gameData.petName = newName;
    gameData.lastNameChange = now;
    updateNameUI();
    saveGame();
    showMessage(`✅ Теперь питомицу зовут ${newName}!`);
    playSound(880);
    closeNameModal();
}

function changeNamePaid() {
    const newNameInput = document.getElementById('newNameInput');
    if (!newNameInput) return;
    const newName = newNameInput.value.trim();
    
    if (!newName) {
        showMessage(`❌ Введите имя!`);
        newNameInput.placeholder = 'Введите новое имя';
        newNameInput.focus();
        return;
    }
    
    const price = 100;
    if (gameData.gems >= price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nТы хочешь потратить ${price}💎 чтобы сменить имя питомца на "${newName}"?\n\nНа счету: ${gameData.gems}💎`);
        
        if (confirmed) {
            gameData.gems -= price;
            gameData.petName = newName;
            updateNameUI();
            saveGame();
            showMessage(`✅ Теперь питомицу зовут ${newName}! (-${price}💎)`);
            playSound(880);
            startConfetti();
            closeNameModal();
            updateGemsUI();
        } else {
            showMessage(`❌ Смена имени отменена`);
        }
    } else {
        showMessage(`💔 Нужно ${price}💎 для смены имени! У тебя ${gameData.gems}💎`);
    }
}

function openLevelsModal() {
    const modal = document.getElementById('levelsModal');
    if (!modal) return;
    renderLevelsList();
    modal.classList.add('active');
}

function closeLevelsModal() {
    const modal = document.getElementById('levelsModal');
    if (modal) modal.classList.remove('active');
}

function openLevelDetail(levelIndex) {
    const level = LEVELS[levelIndex];
    const currentDays = gameData.streak || 0;
    const isCurrent = levelIndex === getCurrentLevelIndex();
    const isUnlocked = currentDays >= level.minDays;
    
    const modal = document.getElementById('levelDetailModal');
    if (!modal) return;
    
    const detailIcon = document.getElementById('levelDetailIcon');
    const detailName = document.getElementById('levelDetailName');
    const detailDays = document.getElementById('levelDetailDays');
    const detailBonus = document.getElementById('levelDetailBonus');
    const detailGames = document.getElementById('levelDetailGames');
    const detailStatus = document.getElementById('levelDetailStatus');
    const detailNext = document.getElementById('levelDetailNext');
    
    if (detailIcon) detailIcon.innerHTML = level.emojiBig || level.emoji;
    if (detailName) detailName.innerHTML = level.name;
    if (detailDays) detailDays.innerHTML = level.minDays === 0 ? 'Старт' : `${level.minDays} день`;
    
    let bonusText = '';
    if (level.bonusMultiplier === 0.7) bonusText = '−30% к расходу статов';
    else if (level.bonusMultiplier === 0.85) bonusText = '−15% к расходу статов';
    else if (level.bonusMultiplier === 1.0) bonusText = 'Стандартный режим';
    else if (level.bonusMultiplier === 1.2) bonusText = '+20% к эффективности';
    else if (level.bonusMultiplier === 1.5) bonusText = '+50% к эффективности';
    if (detailBonus) detailBonus.innerHTML = bonusText;
    
    const gameNames = {
        'yarn': '🧶 Клубок',
        'ball': '⚽ Мячик',
        'laser': '🔴 Лазер',
        'candy': '🍬 Фантик'
    };
    
    if (detailGames) {
        detailGames.innerHTML = '';
        level.unlockGames.forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'level-detail-game';
            gameEl.innerHTML = gameNames[game] || game;
            detailGames.appendChild(gameEl);
        });
    }
    
    if (detailStatus) {
        if (isCurrent) {
            detailStatus.innerHTML = '⭐ ТЕКУЩИЙ УРОВЕНЬ ⭐';
            detailStatus.className = 'level-detail-status current';
        } else if (isUnlocked) {
            detailStatus.innerHTML = '✅ УРОВЕНЬ ПРОЙДЕН ✅';
            detailStatus.className = 'level-detail-status unlocked';
        } else {
            const daysToUnlock = level.minDays - currentDays;
            detailStatus.innerHTML = `🔒 Откроется через ${daysToUnlock} ${getDaysWord(daysToUnlock)}`;
            detailStatus.className = 'level-detail-status locked';
        }
    }
    
    const nextLevel = LEVELS[levelIndex + 1];
    if (detailNext) {
        if (nextLevel && !isCurrent) {
            detailNext.innerHTML = `✨ Следующий уровень: ${nextLevel.name} (${nextLevel.minDays} дней) ✨`;
        } else if (isCurrent && nextLevel) {
            const daysToNext = nextLevel.minDays - currentDays;
            if (daysToNext > 0) {
                detailNext.innerHTML = `📈 До ${nextLevel.name}: ${daysToNext} ${getDaysWord(daysToNext)}`;
            } else {
                detailNext.innerHTML = `🌟 Ты достигла максимального уровня! 🌟`;
            }
        } else {
            detailNext.innerHTML = `👑 Ты покорила все уровни! 👑`;
        }
    }
    
    modal.classList.add('active');
}

function closeLevelDetail() {
    const modal = document.getElementById('levelDetailModal');
    if (modal) modal.classList.remove('active');
}

function renderLevelsList() {
    const container = document.getElementById('levelsList');
    if (!container) return;
    
    const currentDays = gameData.streak || 0;
    const currentLevelIndex = getCurrentLevelIndex();
    container.innerHTML = '';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'levels-header-with-help';
    headerDiv.innerHTML = `<div class="levels-help-btn" id="levelsHelpBtn">❓ Как повысить уровень?</div>`;
    container.appendChild(headerDiv);
    
    LEVELS.forEach((level, index) => {
        const isCurrent = index === currentLevelIndex;
        const isUnlocked = currentDays >= level.minDays;
        const daysToUnlock = isUnlocked ? 0 : level.minDays - currentDays;
        
        const gameNames = {
            'yarn': '🧶 Клубок',
            'ball': '⚽ Мячик',
            'laser': '🔴 Лазер',
            'candy': '🍬 Фантик'
        };
        
        const gamesList = level.unlockGames.map(g => gameNames[g] || g).join(', ');
        
        const card = document.createElement('div');
        card.className = `level-card ${isCurrent ? 'current' : ''}`;
        card.style.cursor = 'pointer';
        
        let bonusText = '';
        if (level.bonusMultiplier === 0.7) bonusText = '−30% к расходу статов';
        else if (level.bonusMultiplier === 0.85) bonusText = '−15% к расходу статов';
        else if (level.bonusMultiplier === 1.0) bonusText = 'Стандартный режим';
        else if (level.bonusMultiplier === 1.2) bonusText = '+20% к эффективности';
        else if (level.bonusMultiplier === 1.5) bonusText = '+50% к эффективности';
        
        card.innerHTML = `
            <div class="level-header">
                <div class="level-icon">${level.emojiBig || level.emoji}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-days">${level.minDays === 0 ? 'Старт' : `${level.minDays} дн.`}</div>
            </div>
            <div class="level-bonus">
                <span>🎁 Бонус:</span>
                <span>${bonusText}</span>
            </div>
            <div class="level-games">
                <span>🎮 Игры:</span>
                <span class="games-icons">${gamesList || '🧶 Клубок'}</span>
            </div>
            ${!isUnlocked ? `<div class="current-badge" style="background:#e0d0dc; color:#a57388;">🔒 Откроется через ${daysToUnlock} ${getDaysWord(daysToUnlock)}</div>` : ''}
            ${isCurrent ? '<div class="current-badge">⭐ ТЕКУЩИЙ ⭐</div>' : ''}
        `;
        
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            openLevelDetail(index);
        });
        
        container.appendChild(card);
    });
    
    const helpBtn = document.getElementById('levelsHelpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLevelInstruction();
        });
    }
}

function openLevelInstruction() {
    const modal = document.getElementById('levelInstructionModal');
    if (modal) modal.classList.add('active');
}

function closeLevelInstruction() {
    const modal = document.getElementById('levelInstructionModal');
    if (modal) modal.classList.remove('active');
}

function onCatClick() {
    playMeow();
}