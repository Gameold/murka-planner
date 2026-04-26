// ============================================
// ЛОГИКА ЗАДАНИЙ С СИСТЕМОЙ ПРОПУСКОВ
// ============================================

function checkAndResetTasks() {
    const today = new Date().toDateString();
    const thisWeek = getWeekNumber();
    const thisMonth = new Date().getMonth() + "-" + new Date().getFullYear();
    let newDay = false;
    
    // ========================================
    // ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
    // ========================================
    if (gameData.lastDate !== today) {
        const allRequiredCompleted = areAllRequiredTasksCompleted();
        
        if (allRequiredCompleted) {
            // ✅ ВСЕ обязательные задания выполнены
            gameData.streak = (gameData.streak || 0) + 1;
            gameData.consecutiveMissedDays = 0;  // Сбрасываем счётчик пропусков
            gameData.catIsDead = false;
            
            showMessage(`⭐ Отлично! Ты выполнила все обязательные дела вчера! День ${gameData.streak} ⭐`);
            playSound(880);
            startConfetti();
        } else {
            // ❌ НЕ ВЫПОЛНИЛ обязательные задания (неважно, заходил или нет)
            
            // Увеличиваем счётчик пропусков
            gameData.consecutiveMissedDays = (gameData.consecutiveMissedDays || 0) + 1;
            
            // streak НЕ МЕНЯЕТСЯ!
            
            // Проверяем, не пора ли Мурке "умереть"
            if (gameData.consecutiveMissedDays >= 3) {
                gameData.catIsDead = true;
                gameData.streak = 0;
                playSound(220);
                showCatDeathModal();
            } else {
                // Показываем модальное окно предупреждения
                const remaining = 3 - gameData.consecutiveMissedDays;
                if (remaining === 1) {
                    showDeathWarningModal(1);
                } else if (remaining === 2) {
                    showDeathWarningModal(2);
                } else {
                    // Первый пропуск - простое сообщение
                    showMessage(`⚠️ Пропуск ${gameData.consecutiveMissedDays}/3. Осталось ${remaining} дня без обязательных дел до потери ${gameData.petName}! Уровень: ${gameData.streak || 0} ⚠️`);
                    playSound(440);
                }
            }
        }
        
        // Сбрасываем ЕЖЕДНЕВНЫЕ задания в 'pending'
        ALL_TASKS.daily.forEach(t => {
            const id = `daily_${t.id}`;
            const currentStatus = gameData.taskStatuses[id];
            if (currentStatus !== 'pending_review') {
                gameData.taskStatuses[id] = 'pending';
            }
        });
        
        gameData.dailyChestCollected = false;
        gameData.lastDate = today;
        newDay = true;
        
        updateStreakUI();
        addDailyProgress();
        checkLevelUp();
        
        if (gameData.catIsDead) {
            blockPetActions();
        }
    }
    
    // ========================================
    // ЕЖЕНЕДЕЛЬНЫЕ ЗАДАНИЯ
    // ========================================
    if (gameData.lastWeek !== thisWeek) {
        const allWeeklyCompleted = ALL_TASKS.weekly.every(t => {
            const status = gameData.taskStatuses[`weekly_${t.id}`];
            return status === 'rewarded';
        });
        
        if (allWeeklyCompleted && gameData.lastWeek !== "") {
            gameData.streak = (gameData.streak || 0) + 1;
            gameData.consecutiveMissedDays = 0;
            showMessage(`📅 Ты выполнила все еженедельные дела! +1 к уровню! (${gameData.streak})`);
            playSound(880);
            startConfetti();
            updateStreakUI();
        } else if (gameData.lastWeek !== "") {
            showMessage(`😿 Ты не выполнила все еженедельные дела...`);
        }
        
        ALL_TASKS.weekly.forEach(t => {
            const id = `weekly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'pending_review') {
                gameData.taskStatuses[id] = 'pending';
            }
        });
        gameData.lastWeek = thisWeek;
    }
    
    // ========================================
    // ЕЖЕМЕСЯЧНЫЕ ЗАДАНИЯ
    // ========================================
    if (gameData.lastMonth !== thisMonth) {
        const allMonthlyCompleted = ALL_TASKS.monthly.every(t => {
            const status = gameData.taskStatuses[`monthly_${t.id}`];
            return status === 'rewarded';
        });
        
        if (allMonthlyCompleted && gameData.lastMonth !== "") {
            gameData.streak = (gameData.streak || 0) + 1;
            gameData.consecutiveMissedDays = 0;
            showMessage(`🌙 Ты выполнила все ежемесячные дела! +1 к уровню! (${gameData.streak})`);
            playSound(880);
            startConfetti();
            updateStreakUI();
        } else if (gameData.lastMonth !== "") {
            showMessage(`😿 Ты не выполнила все ежемесячные дела.Уровень прежний...`);
        }
        
        ALL_TASKS.monthly.forEach(t => {
            const id = `monthly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'pending_review') {
                gameData.taskStatuses[id] = 'pending';
            }
        });
        gameData.lastMonth = thisMonth;
    }
    
    if (newDay && !gameData.catIsDead) {
        resetDailyLimits();
        
        const levelBonus = getLevelBonus();
        const dailyBonus = Math.floor(5 * levelBonus);
        gameData.gems += dailyBonus;
        showMessage(`🌅 Новый день! +${dailyBonus}💎 за заботу о ${gameData.petName}!`);
        playSound(880);
        updateGemsUI();
        renderTasks();
    }
    saveGame();
}

// ========================================
// МОДАЛЬНОЕ ОКНО ПРЕДУПРЕЖДЕНИЯ О СМЕРТИ
// ========================================

function showDeathWarningModal(daysLeft) {
    let modal = document.getElementById('deathWarningModal');
    if (modal) modal.remove();
    
    const isLastDay = daysLeft === 1;
    const title = isLastDay ? "⚠️ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! ⚠️" : "⚠️ ВНИМАНИЕ! ${gameData.petName} В ОПАСНОСТИ! ⚠️";
    const icon = isLastDay ? "💀😿💀" : "⚠️😿⚠️";
    const borderColor = isLastDay ? "#ff0000" : "#ff8800";
    const bgGradient = isLastDay ? "linear-gradient(145deg, #3a1a1a, #2a0a0a)" : "linear-gradient(145deg, #2a2a1a, #1a1a0a)";
    const warningText = isLastDay 
        ? `ЭТО ПОСЛЕДНИЙ ДЕНЬ!<br><br>
           Если ты СЕГОДНЯ не выполнишь обязательные дела,<br>
           <span style="color: #ff4444; font-size: 20px; font-weight: bold;">МУРКА УСНЁТ НАВСЕГДА!</span>`
        : `Если ты завтра не выполнишь обязательные дела,<br>
           останется всего 1 день до того, как Мурка уснёт навсегда!<br><br>
           <span style="color: #ffaa44;">Пожалуйста, позаботься о ней!</span>`;
    
    modal = document.createElement('div');
    modal.id = 'deathWarningModal';
    modal.className = 'death-warning-modal';
    modal.innerHTML = `
        <div class="death-warning-content" style="border-color: ${borderColor}; background: ${bgGradient};">
            <div class="death-warning-header">
                <div class="death-warning-icon">${icon}</div>
                <button class="death-warning-close" id="deathWarningCloseBtn">✕</button>
            </div>
            <div class="death-warning-title">${title}</div>
            <div class="death-warning-text">
                ${warningText}
            </div>
            <div class="death-warning-counter">
                Пропущено дней: ${gameData.consecutiveMissedDays}/3
            </div>
            <div class="death-warning-streak">
                Текущая серия: ${gameData.streak || 0} дней
            </div>
            <button class="death-warning-ok-btn" id="deathWarningOkBtn">ПОНЯТНО, СПАСУ МУРКУ! ❤️</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = document.getElementById('deathWarningCloseBtn');
    const okBtn = document.getElementById('deathWarningOkBtn');
    
    const closeModal = () => {
        modal.remove();
        playSound(880);
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (okBtn) okBtn.onclick = closeModal;
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

// ========================================
// МОДАЛЬНОЕ ОКНО СМЕРТИ МУРКИ
// ========================================

function showCatDeathModal() {
    let modal = document.getElementById('catDeathModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'catDeathModal';
    modal.className = 'death-modal';
    modal.innerHTML = `
        <div class="death-content">
            <div class="death-icon">💀😿💀</div>
            <div class="death-title">${gameData.petName} УСНУЛА НАВСЕГДА</div>
            <div class="death-text">
                Ты не заботилась о ней ${gameData.consecutiveMissedDays} дня подряд.<br>
                Она не выдержала равнодушия...
            </div>
            <div class="death-count">Серия была: ${gameData.streak} дней</div>
            <button class="death-resurrect-btn" id="deathResurrectBtn">🌸 ВОСКРЕСИТЬ ${gameData.petName} 🌸</button>
            <div class="death-note">После воскрешения всё начнётся заново</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const resurrectBtn = document.getElementById('deathResurrectBtn');
    if (resurrectBtn) {
        resurrectBtn.onclick = () => {
            modal.remove();
            resurrectCat();
        };
    }
}

// ========================================
// ФУНКЦИЯ ВОСКРЕШЕНИЯ МУРКИ
// ========================================

function resurrectCat() {
    if (!gameData.catIsDead) return;
    
    if (confirm(`💀 ТЫ ХОЧЕШЬ ВОСКРЕСИТЬ ${gameData.petName.toUpperCase()}? 💀\n\nВсё начнётся заново:\n• Серия дней = 0\n• Уровень = Котёнок\n• Алмазы = 100\n• Все задания сбросятся\n\nПродолжить?`)) {
        // Сбрасываем игру, но сохраняем имя питомца
        const savedPetName = gameData.petName;
        resetGame();
        gameData.petName = savedPetName;
        gameData.catIsDead = false;
        gameData.consecutiveMissedDays = 0;
        saveGame();
        
        showMessage(`✨ ЧУДО! ${gameData.petName} воскресла! Заботиться о ней, чтобы она не уснула снова! ✨`);
        startConfetti();
        playSound(1046);
        
        if (typeof updateAllUI === 'function') updateAllUI();
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof updatePetBars === 'function') updatePetBars();
    }
}

// ========================================
// БЛОКИРОВКА ДЕЙСТВИЙ С ПИТОМЦЕМ
// ========================================

function blockPetActions() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    });
    
    const feedBtn = document.getElementById('actionFeed');
    if (feedBtn) feedBtn.style.pointerEvents = 'none';
    
    showMessage(`💀 ${gameData.petName} уснула навсегда! Воскреси её 💀`);
}

// ========================================
// ОСТАЛЬНЫЕ ФУНКЦИИ
// ========================================

function markTaskPendingReview(taskId, task, card, winCount = 0) {
    if (gameData.catIsDead) {
        showMessage(`💀 ${gameData.petName} уснула навсегда! Воскреси её в настройках 💀`);
        return;
    }
    if (gameData.taskStatuses[taskId] !== 'pending') {
        showMessage(`Уже ${gameData.taskStatuses[taskId] === 'rewarded' ? 'выполнено' : 'ждёт проверки'}!`);
        return;
    }
    showTaskAnimation(card);
    if (task.id === "w2") {
        gameData.taskStatuses[taskId] = { status: 'pending_review', winCount: winCount };
    } else {
        gameData.taskStatuses[taskId] = { status: 'pending_review' };
    }
    //showMessage(`✨ Задание отмечено! Появились песочные часы ⏳`);
    playSound(880);
    startConfetti();
    saveGame();
    renderTasks();
}

function parentUndoTask(taskId) {
    const state = gameData.taskStatuses[taskId];
    if (state && state.status === 'pending_review') {
        gameData.taskStatuses[taskId] = 'pending';
        //showMessage(`❌ Родитель отменил проверку задания`);
        playSound(660);
        saveGame();
        renderTasks();
    }
}

function childUndoTask(taskId) {
    const state = gameData.taskStatuses[taskId];
    if (state && state.status === 'pending_review') {
        gameData.taskStatuses[taskId] = 'pending';
        //showMessage(`❌ Задание отменено, можно отметить заново`);
        playSound(660);
        saveGame();
        renderTasks();
    }
}

function parentApproveTask(taskId, task) {
    const state = gameData.taskStatuses[taskId];
    if (!state || state.status !== 'pending_review') {
        //showMessage("Нет задания на проверку");
        return;
    }
    
    let reward = task.reward;
    if (task.id === "w2") {
        const winCount = state.winCount || 0;
        reward = winCount * 5;
        //showMessage(`🎉 Родитель подтвердил: +${reward}💎 за ${winCount} окна!`);
    } else {
        if (task.type === 'daily') reward = Math.floor(task.reward * getRewardBonus());
        //showMessage(`🎉 Родитель подтвердил "${task.name}"! Награда +${reward}💎`);
    }
    
    gameData.taskStatuses[taskId] = { status: 'parent_approved', rewardReady: reward };
    playSound(880);
    startConfetti();
    saveGame();
    renderTasks();
    updateChestUI();
}

function childCollectReward(taskId, task) {
    const state = gameData.taskStatuses[taskId];
    if (!state || state.status !== 'parent_approved') {
        showMessage("Нет доступных алмазов!");
        return;
    }
    
    const reward = state.rewardReady;
    gameData.gems += reward;
    gameData.taskStatuses[taskId] = 'rewarded';
    showMessage(`💎 +${reward} алмазов!`);
    playSound(1046);
    startConfetti();
    saveGame();
    renderTasks();
    updateGemsUI();
    updateMonthProgress();
    updatePetBars();
    updateChestUI();
}

function parentUndoApprovedTask(taskId) {
    const state = gameData.taskStatuses[taskId];
    if (!state || state.status !== 'parent_approved') {
        showMessage("Нет подтверждённого задания для отмены");
        return;
    }
    
    gameData.taskStatuses[taskId] = 'pending';
    //showMessage(`⏪ Родитель отменил подтверждение задания. Задание снова ожидает проверки.`);
    playSound(660);
    saveGame();
    renderTasks();
    updateChestUI();
}

function updateMonthProgress() {
    const monthly = ALL_TASKS.monthly;
    let c = 0;
    monthly.forEach(t => {
        if (gameData.taskStatuses[`monthly_${t.id}`] === 'rewarded') c++;
    });
    const monthProgress = document.getElementById('monthProgress');
    if (monthProgress) monthProgress.innerHTML = Math.round(c / monthly.length * 100) + '%';
}

function openRewardModal() {
    if (gameData.catIsDead) {
        showMessage(`💀 Сначала воскреси ${gameData.petName}! 💀`);
        return;
    }
    if (gameData.dailyChestCollected) {
        showMessage(`Сундучок уже получен! Завтра будет новый`);
        return;
    }
    if (!areAllRequiredTasksCompleted()) {
        showMessage(`Сначала выполни все обязательные дела! 🔒`);
        return;
    }
    
    gameData.dailyChestCollected = true;
    gameData.gems += 50;
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 15);
    gameData.consecutiveMissedDays = 0;
    saveGame();
    
    const rewardModal = document.getElementById('rewardModal');
    if (rewardModal) rewardModal.classList.add('active');
    startConfetti();
    playSound(1046);
    updateChestUI();
    updatePetBars();
    updateGemsUI();
}

function updateChestUI() {
    const chestDiv = document.getElementById('dailyChest');
    const chestStatusSpan = document.getElementById('chestStatus');
    const chestStatusShort = document.getElementById('chestStatusShort');
    const dayProgressShort = document.getElementById('dayProgressShort');
    
    const dailyRewarded = Object.keys(gameData.taskStatuses).filter(k => 
        k.startsWith('daily_') && gameData.taskStatuses[k] === 'rewarded'
    ).length;
    
    if (dayProgressShort) {
        dayProgressShort.innerHTML = `${dailyRewarded}/${ALL_TASKS.daily.length}`;
    }
    
    if (areAllRequiredTasksCompleted() && !gameData.dailyChestCollected && !gameData.catIsDead) {
        if (chestStatusSpan) chestStatusSpan.innerHTML = '🎁';
        if (chestStatusShort) chestStatusShort.innerHTML = '🎁';
        if (chestDiv) chestDiv.classList.add('chest-ready');
    } else if (gameData.dailyChestCollected) {
        if (chestStatusSpan) chestStatusSpan.innerHTML = '';
        if (chestStatusShort) chestStatusShort.innerHTML = '✅';
        if (chestDiv) chestDiv.classList.remove('chest-ready');
    } else {
        if (chestStatusSpan) chestStatusSpan.innerHTML = '🔒';
        if (chestStatusShort) chestStatusShort.innerHTML = '🔒';
        if (chestDiv) chestDiv.classList.remove('chest-ready');
    }
}

function addDailyProgress() {
    const today = new Date().toDateString();
    if (gameData.lastBonusDay !== today && !gameData.catIsDead) {
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
        
        saveGame();
    }
}

function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (gameData.dailyBonusClaimed !== today && gameData.streak > 0 && !gameData.catIsDead) {
        let bonus = 5;
        let message = `🔥 Ежедневный бонус за уровень ${gameData.streak} дней: `;
        
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