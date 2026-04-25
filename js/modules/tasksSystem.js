// Система заданий

function checkAndResetTasks() {
    const today = new Date().toDateString();
    const thisWeek = getWeekNumber();
    const thisMonth = new Date().getMonth() + "-" + new Date().getFullYear();
    let newDay = false;
    
    if (gameData.lastDate !== today) {
        // ПРОВЕРЯЕМ: были ли выполнены все обязательные задания ВЧЕРА
        const allRequiredCompleted = areAllRequiredTasksCompleted();
        
        if (allRequiredCompleted) {
            // Если всё выполнено - увеличиваем streak
            if (gameData.streak !== undefined) {
                gameData.streak++;
            } else {
                gameData.streak = 1;
            }
            showMessage(`⭐ Отлично! Ты выполнила все обязательные дела вчера! День ${gameData.streak} ⭐`);
            playSound(880);
            startConfetti();
        } else {
            // Если не выполнено - streak НЕ растёт
            showMessage(`😿 Вчера ты не сделала все обязательные дела. Серия дней не увеличилась...`);
            playSound(440);
        }
        
        // Сброс заданий на новый день
        ALL_TASKS.daily.forEach(t => {
            const id = `daily_${t.id}`;
            if (gameData.taskStatuses[id] !== 'rewarded' && gameData.taskStatuses[id] !== 'pending_review')
                gameData.taskStatuses[id] = 'pending';
        });
        gameData.dailyChestCollected = false;
        gameData.lastDate = today;
        newDay = true;
        
        updateStreakUI();
        addDailyProgress();
    }
    if (gameData.lastWeek !== thisWeek) {
        ALL_TASKS.weekly.forEach(t => {
            const id = `weekly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'rewarded') gameData.taskStatuses[id] = 'pending';
        });
        gameData.lastWeek = thisWeek;
    }
    if (gameData.lastMonth !== thisMonth) {
        ALL_TASKS.monthly.forEach(t => {
            const id = `monthly_${t.id}`;
            if (gameData.taskStatuses[id] !== 'rewarded') gameData.taskStatuses[id] = 'pending';
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
    }
    saveGame();
}

function markTaskPendingReview(taskId, task, card, winCount = 0) {
    if (gameData.taskStatuses[taskId] !== 'pending') {
        showMessage(`Уже ${gameData.taskStatuses[taskId] === 'rewarded' ? 'выполнено' : 'ждёт проверки'}!`);
        return;
    }
    showTaskAnimation(card);
    if (task.id === "w2") gameData.taskStatuses[taskId] = { status: 'pending_review', winCount: winCount };
    else gameData.taskStatuses[taskId] = { status: 'pending_review' };
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
    if (!state || state.status !== 'pending_review') { showMessage("Нет задания на проверку"); return; }
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
    if (!state || state.status !== 'parent_approved') { showMessage("Нет доступных алмазов!"); return; }
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

function allRequiredCompleted() {
    for (let reqId of REQUIRED_TASK_IDS) {
        const status = gameData.taskStatuses[`daily_${reqId}`];
        if (status !== 'rewarded') return false;
    }
    return true;
}

function updateMonthProgress() {
    const monthly = ALL_TASKS.monthly;
    let c = 0;
    monthly.forEach(t => { if (gameData.taskStatuses[`monthly_${t.id}`] === 'rewarded') c++; });
    document.getElementById('monthProgress').innerHTML = Math.round(c / monthly.length * 100) + '%';
}

function openRewardModal() {
    if (gameData.dailyChestCollected) { showMessage(`Сундучок уже получен! Завтра будет новый`); return; }
    if (!allRequiredCompleted()) { showMessage(`Сначала выполни все обязательные дела! 🔒`); return; }
    gameData.dailyChestCollected = true;
    gameData.gems += 50;
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 15);
    saveGame();
    document.getElementById('rewardModal').classList.add('active');
    startConfetti();
    playSound(1046);
    updateChestUI();
    updatePetBars();
    updateGemsUI();
}

function updateChestUI() {
    const chestDiv = document.getElementById('dailyChest');
    const chestStatusSpan = document.getElementById('chestStatus');
    if (allRequiredCompleted() && !gameData.dailyChestCollected) {
        chestStatusSpan.innerHTML = '🎁✨';
        chestDiv.classList.add('chest-ready');
    } else if (gameData.dailyChestCollected) {
        chestStatusSpan.innerHTML = '✅';
        chestDiv.classList.remove('chest-ready');
    } else {
        chestStatusSpan.innerHTML = '🔒';
        chestDiv.classList.remove('chest-ready');
    }
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