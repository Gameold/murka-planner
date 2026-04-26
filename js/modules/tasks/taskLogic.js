function checkAndResetTasks() {
    const today = new Date().toDateString();
    const thisWeek = getWeekNumber();
    const thisMonth = new Date().getMonth() + "-" + new Date().getFullYear();
    let newDay = false;
    
    // ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
    if (gameData.lastDate !== today) {
        const allRequiredCompleted = areAllRequiredTasksCompleted();
        
        if (allRequiredCompleted) {
            gameData.streak = (gameData.streak || 0) + 1;
            showMessage(`⭐ Отлично! Ты выполнила все обязательные дела вчера! День ${gameData.streak} ⭐`);
            playSound(880);
            startConfetti();
        } else {
            showMessage(`😿 Вчера ты не сделала все обязательные дела. Серия дней не увеличилась...`);
            playSound(440);
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
    }
    
    // ЕЖЕНЕДЕЛЬНЫЕ ЗАДАНИЯ
    if (gameData.lastWeek !== thisWeek) {
        // Проверяем, были ли выполнены ВСЕ еженедельные задания (статус 'rewarded')
        const allWeeklyCompleted = ALL_TASKS.weekly.every(t => {
            const status = gameData.taskStatuses[`weekly_${t.id}`];
            return status === 'rewarded';
        });
        
        if (allWeeklyCompleted && gameData.lastWeek !== "") {
            gameData.streak = (gameData.streak || 0) + 1;
            showMessage(`📅 Отлично! Ты выполнила все еженедельные дела! +1 день к серии! (${gameData.streak})`);
            playSound(880);
            startConfetti();
            updateStreakUI();
        } else if (gameData.lastWeek !== "") {
            showMessage(`😿 Ты не выполнила все еженедельные дела. Серия не увеличилась...`);
        }
        
        // Сбрасываем ЕЖЕНЕДЕЛЬНЫЕ задания в 'pending' (ВСЕГДА)
        ALL_TASKS.weekly.forEach(t => {
            const id = `weekly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'pending_review') {
                gameData.taskStatuses[id] = 'pending';
            }
        });
        gameData.lastWeek = thisWeek;
    }
    
    // ЕЖЕМЕСЯЧНЫЕ ЗАДАНИЯ
    if (gameData.lastMonth !== thisMonth) {
        // Проверяем, были ли выполнены ВСЕ ежемесячные задания
        const allMonthlyCompleted = ALL_TASKS.monthly.every(t => {
            const status = gameData.taskStatuses[`monthly_${t.id}`];
            return status === 'rewarded';
        });
        
        if (allMonthlyCompleted && gameData.lastMonth !== "") {
            gameData.streak = (gameData.streak || 0) + 1;
            showMessage(`🌙 Отлично! Ты выполнила все ежемесячные дела! +1 день к серии! (${gameData.streak})`);
            playSound(880);
            startConfetti();
            updateStreakUI();
        } else if (gameData.lastMonth !== "") {
            showMessage(`😿 Ты не выполнила все ежемесячные дела. Серия не увеличилась...`);
        }
        
        // Сбрасываем ЕЖЕМЕСЯЧНЫЕ задания в 'pending' (ВСЕГДА)
        ALL_TASKS.monthly.forEach(t => {
            const id = `monthly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'pending_review') {
                gameData.taskStatuses[id] = 'pending';
            }
        });
        gameData.lastMonth = thisMonth;
    }
    
    if (newDay) {
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

function markTaskPendingReview(taskId, task, card, winCount = 0) {
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
    showMessage(`✨ Задание отмечено! Появились песочные часы ⏳`);
    playSound(880);
    startConfetti();
    saveGame();
    renderTasks();
}

function parentUndoTask(taskId) {
    const state = gameData.taskStatuses[taskId];
    if (state && state.status === 'pending_review') {
        gameData.taskStatuses[taskId] = 'pending';
        showMessage(`❌ Родитель отменил проверку задания`);
        playSound(660);
        saveGame();
        renderTasks();
    }
}

function childUndoTask(taskId) {
    const state = gameData.taskStatuses[taskId];
    if (state && state.status === 'pending_review') {
        gameData.taskStatuses[taskId] = 'pending';
        showMessage(`❌ Задание отменено, можно отметить заново`);
        playSound(660);
        saveGame();
        renderTasks();
    }
}

function parentApproveTask(taskId, task) {
    const state = gameData.taskStatuses[taskId];
    if (!state || state.status !== 'pending_review') {
        showMessage("Нет задания на проверку");
        return;
    }
    
    let reward = task.reward;
    if (task.id === "w2") {
        const winCount = state.winCount || 0;
        reward = winCount * 5;
        showMessage(`🎉 Родитель подтвердил: +${reward}💎 за ${winCount} окна!`);
    } else {
        if (task.type === 'daily') reward = Math.floor(task.reward * getRewardBonus());
        showMessage(`🎉 Родитель подтвердил "${task.name}"! Награда +${reward}💎`);
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
    showMessage(`💎 +${reward} алмазов! Задание выполнено.`);
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
    showMessage(`⏪ Родитель отменил подтверждение задания. Задание снова ожидает проверки.`);
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
    
    if (areAllRequiredTasksCompleted() && !gameData.dailyChestCollected) {
        if (chestStatusSpan) chestStatusSpan.innerHTML = '🎁';
        if (chestStatusShort) chestStatusShort.innerHTML = '🎁';
        if (chestDiv) chestDiv.classList.add('chest-ready');
    } else if (gameData.dailyChestCollected) {
        if (chestStatusSpan) chestStatusSpan.innerHTML = '✅';
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
        
        saveGame();
    }
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