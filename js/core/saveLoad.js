function saveGame() {
    localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
    
    // Сохраняем в облако если пользователь авторизован
    if (typeof auth !== 'undefined' && auth.currentUser) {
        const userId = auth.currentUser.uid;
        database.ref(`users/${userId}/gameData`).set(gameData).catch(e => console.log('Ошибка сохранения в облако:', e));
        console.log('☁️ Данные сохранены в облако');
    }
}

function loadGame() {
    const saved = localStorage.getItem("tamagochiPlannerFinal");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameData = { ...gameData, ...data };
            
            if (!gameData.purchasedAccessories) gameData.purchasedAccessories = [];
            if (!gameData.purchasedFurniture) gameData.purchasedFurniture = [];
            if (!gameData.purchasedDecor) gameData.purchasedDecor = [];
            if (!gameData.purchasedSmart) gameData.purchasedSmart = [];
            if (!gameData.taskStatuses) gameData.taskStatuses = {};
            if (!gameData.activeRight) gameData.activeRight = null;
            if (!gameData.activeLeft) gameData.activeLeft = null;
            if (!gameData.activeTop) gameData.activeTop = null;
            if (!gameData.petName) gameData.petName = "Мурка";
            if (!gameData.lastNameChange) gameData.lastNameChange = null;
            if (!gameData.parentCode) gameData.parentCode = "1234";
            if (gameData.parentModeActive === undefined) gameData.parentModeActive = false;
            if (gameData.notificationsEnabled === undefined) gameData.notificationsEnabled = false;
            if (gameData.currentLevel === undefined) gameData.currentLevel = 0;
            if (gameData.dailyBonusClaimed === undefined) gameData.dailyBonusClaimed = false;
            if (gameData.lastBonusDay === undefined) gameData.lastBonusDay = "";
            if (gameData.lastWeekLevelUp === undefined) gameData.lastWeekLevelUp = 0;
            
            if (!gameData.pet) gameData.pet = {};
            const defaultPet = {
                playBallCount: 0, playLaserCount: 0, playCandyCount: 0,
                milkCount: 0, brushCount: 0, giftCount: 0, sleepCount: 0,
                feedCount: 0, litterCount: 0, lastPetTime: 0,
                lastCleaned: Date.now(), needsLitter: 0, litterWarningSent: false,
                currentAccessory: null, sickUntil: null, sleepUntil: null,
                lastUpdateTime: Date.now(), feedLastTime: 0, milkLastTime: 0,
                sleepLastTime: 0, petLastTime: 0, playLastTime: 0,
                playBallLastTime: 0, playLaserLastTime: 0, playCandyLastTime: 0,
                brushLastTime: 0, batheLastTime: 0, giftLastTime: 0, litterLastTime: 0
            };
            for (let key in defaultPet) {
                if (gameData.pet[key] === undefined) gameData.pet[key] = defaultPet[key];
            }
        } catch (e) {
            console.log("Ошибка загрузки, сброс игры:", e);
            resetGame();
        }
    } else {
        resetGame();
    }
}

async function loadGameFromCloud(userId) {
    if (!userId) return;
    try {
        const snapshot = await database.ref(`users/${userId}/gameData`).once('value');
        if (snapshot.exists()) {
            const cloudData = snapshot.val();
            Object.assign(gameData, cloudData);
            localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
            if (typeof updateAllUI === 'function') updateAllUI();
            showMessage(`☁️ Данные загружены из облака`);
            console.log('📥 Облачные данные загружены');
        }
    } catch (e) {
        console.log('Ошибка загрузки из облака:', e);
    }
}

function resetGame() {
    const today = new Date().toDateString();
    const thisWeek = getWeekNumber();
    const thisMonth = new Date().getMonth() + "-" + new Date().getFullYear();
    
    gameData = {
        gems: 100,
        streak: 1,
        lastDate: today,
        lastWeek: thisWeek,
        lastMonth: thisMonth,
        taskStatuses: {},
        dailyChestCollected: false,
        parentCode: "1234",
        windowCount: 0,
        petName: "Мурка",
        lastNameChange: null,
        parentModeActive: false,
        purchasedAccessories: [],
        purchasedFurniture: [],
        purchasedDecor: [],
        purchasedSmart: [],
        activeRight: null,
        activeLeft: null,
        activeTop: null,
        currentLevel: 0,
        dailyBonusClaimed: false,
        lastBonusDay: "",
        lastWeekLevelUp: 0,
        pet: {
            hunger: 20, happiness: 50, energy: 70, clean: 80,
            lastUpdateTime: Date.now(), petCount: 0, playCount: 0,
            playBallCount: 0, playLaserCount: 0, playCandyCount: 0,
            batheCount: 0, milkCount: 0, brushCount: 0, giftCount: 0,
            sleepCount: 0, feedCount: 0, litterCount: 0,
            currentAccessory: null, sickUntil: null, sleepUntil: null,
            lastPetTime: 0, lastCleaned: Date.now(), needsLitter: 0,
            litterWarningSent: false, feedLastTime: 0, milkLastTime: 0,
            sleepLastTime: 0, petLastTime: 0, playLastTime: 0,
            playBallLastTime: 0, playLaserLastTime: 0, playCandyLastTime: 0,
            brushLastTime: 0, batheLastTime: 0, giftLastTime: 0, litterLastTime: 0
        },
        style: 0, smartStat: 0, cozy: 0, beauty: 0,
        notificationsEnabled: false
    };
    
    if (typeof ALL_TASKS !== 'undefined') {
        ALL_TASKS.daily.forEach(t => {
            gameData.taskStatuses[`daily_${t.id}`] = 'pending';
        });
        ALL_TASKS.weekly.forEach(t => {
            gameData.taskStatuses[`weekly_${t.id}`] = 'pending';
        });
        ALL_TASKS.monthly.forEach(t => {
            gameData.taskStatuses[`monthly_${t.id}`] = 'pending';
        });
    }
    
    saveGame();
    showMessage("🌸 Игра сброшена! Начинаем с чистого листа 🌸");
    
    if (typeof updateStreakUI === 'function') updateStreakUI();
    if (typeof renderLevelProgress === 'function') renderLevelProgress();
    if (typeof updateParentModeUI === 'function') updateParentModeUI();
    if (typeof updateNameUI === 'function') updateNameUI();
    if (typeof updateDateHeader === 'function') updateDateHeader();
    if (typeof updatePetStats === 'function') updatePetStats();
    if (typeof recalcStats === 'function') recalcStats();
    if (typeof updateAllUI === 'function') updateAllUI();
    if (typeof renderRoomModal === 'function') renderRoomModal();
    if (typeof updateChestUI === 'function') updateChestUI();
    if (typeof updateFreeNameButtonState === 'function') updateFreeNameButtonState();
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof updateActionLimitsDisplay === 'function') updateActionLimitsDisplay();
    if (typeof switchTab === 'function') switchTab('tasks');
}

// Следим за авторизацией
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log(`👤 Пользователь: ${user.email}`);
            await loadGameFromCloud(user.uid);
            if (typeof updateAllUI === 'function') updateAllUI();
            if (typeof renderTasks === 'function') renderTasks();
        }
    });
}