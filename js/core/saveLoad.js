// ============================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ
// ============================================

function saveGame() {
    // Сохраняем локально
    localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
    
    // Сохраняем в облако с русскими ключами
    if (typeof auth !== 'undefined' && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const userEmail = auth.currentUser.email;
        const userName = auth.currentUser.displayName || userEmail.split('@')[0];
        const now = new Date().toISOString().split('T')[0];
        
        database.ref(`users/${userId}/информация/дата_регистрации`).once('value').then(snapshot => {
            const createdAt = snapshot.val() || now;
            
            database.ref(`users/${userId}`).set({
                "информация": {
                    "email": userEmail,
                    "имя": userName,
                    "дата_регистрации": createdAt,
                    "последний_вход": now
                },
                "игра": {
                    "алмазы": gameData.gems,
                    "серия_дней": gameData.streak,
                    "текущий_уровень": gameData.currentLevel,
                    "имя_питомца": gameData.petName
                },
                "статы": {
                    "стиль": gameData.style,
                    "ум": gameData.smartStat,
                    "уют": gameData.cozy,
                    "красота": gameData.beauty
                },
                "питомец": {
                    "сытость": gameData.pet.hunger,
                    "счастье": gameData.pet.happiness,
                    "энергия": gameData.pet.energy,
                    "чистота": gameData.pet.clean,
                    "спит_до": gameData.pet.sleepUntil,
                    "болен_до": gameData.pet.sickUntil,
                    "счётчики": {
                        "кормление": gameData.pet.feedCount,
                        "молоко": gameData.pet.milkCount,
                        "сон": gameData.pet.sleepCount,
                        "гладить": gameData.pet.petCount,
                        "игры": {
                            "клубок": gameData.pet.playCount,
                            "мячик": gameData.pet.playBallCount,
                            "лазер": gameData.pet.playLaserCount,
                            "фантик": gameData.pet.playCandyCount
                        },
                        "расчёсывание": gameData.pet.brushCount,
                        "купание": gameData.pet.batheCount,
                        "подарок": gameData.pet.giftCount,
                        "лоток": gameData.pet.litterCount
                    }
                },
                "задания": {
                    "ежедневные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('daily_'))
                    ),
                    "еженедельные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('weekly_'))
                    ),
                    "ежемесячные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('monthly_'))
                    )
                },
                "настройки": {
                    "уведомления": gameData.notificationsEnabled,
                    "код_родителя": gameData.parentCode,
                    "режим_родителя": gameData.parentModeActive
                },
                "покупки": {
                    "аксессуары": gameData.purchasedAccessories,
                    "мебель": gameData.purchasedFurniture,
                    "декор": gameData.purchasedDecor,
                    "умные_вещи": gameData.purchasedSmart
                },
                "активные_предметы": {
                    "справа": gameData.activeRight,
                    "слева": gameData.activeLeft,
                    "сверху": gameData.activeTop,
                    "аксессуар": gameData.pet.currentAccessory
                },
                "последнее_сохранение": now
            });
        });
        
        console.log('Облачное сохранение выполнено');
    }
}

// ============================================
// ЗАГРУЗКА ИЗ ОБЛАКА
// ============================================

async function loadGameFromCloud(userId) {
    if (!userId) return;
    try {
        const snapshot = await database.ref(`users/${userId}`).once('value');
        if (snapshot.exists()) {
            const cloudData = snapshot.val();
            
            // Проверяем, есть ли русская структура
            if (cloudData["игра"]) {
                gameData.gems = cloudData["игра"]["алмазы"] || 100;
                gameData.streak = cloudData["игра"]["серия_дней"] || 0;
                gameData.currentLevel = cloudData["игра"]["текущий_уровень"] || 0;
                gameData.petName = cloudData["игра"]["имя_питомца"] || "Мурка";
            }
            
            if (cloudData["статы"]) {
                gameData.style = cloudData["статы"]["стиль"] || 0;
                gameData.smartStat = cloudData["статы"]["ум"] || 0;
                gameData.cozy = cloudData["статы"]["уют"] || 0;
                gameData.beauty = cloudData["статы"]["красота"] || 0;
            }
            
            if (cloudData["питомец"]) {
                gameData.pet.hunger = cloudData["питомец"]["сытость"] || 20;
                gameData.pet.happiness = cloudData["питомец"]["счастье"] || 50;
                gameData.pet.energy = cloudData["питомец"]["энергия"] || 70;
                gameData.pet.clean = cloudData["питомец"]["чистота"] || 80;
                gameData.pet.sleepUntil = cloudData["питомец"]["спит_до"] || null;
                gameData.pet.sickUntil = cloudData["питомец"]["болен_до"] || null;
                
                if (cloudData["питомец"]["счётчики"]) {
                    const c = cloudData["питомец"]["счётчики"];
                    gameData.pet.feedCount = c["кормление"] || 0;
                    gameData.pet.milkCount = c["молоко"] || 0;
                    gameData.pet.sleepCount = c["сон"] || 0;
                    gameData.pet.petCount = c["гладить"] || 0;
                    if (c["игры"]) {
                        gameData.pet.playCount = c["игры"]["клубок"] || 0;
                        gameData.pet.playBallCount = c["игры"]["мячик"] || 0;
                        gameData.pet.playLaserCount = c["игры"]["лазер"] || 0;
                        gameData.pet.playCandyCount = c["игры"]["фантик"] || 0;
                    }
                    gameData.pet.brushCount = c["расчёсывание"] || 0;
                    gameData.pet.batheCount = c["купание"] || 0;
                    gameData.pet.giftCount = c["подарок"] || 0;
                    gameData.pet.litterCount = c["лоток"] || 0;
                }
            }
            
            if (cloudData["задания"]) {
                if (cloudData["задания"]["ежедневные"]) {
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["ежедневные"]);
                }
                if (cloudData["задания"]["еженедельные"]) {
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["еженедельные"]);
                }
                if (cloudData["задания"]["ежемесячные"]) {
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["ежемесячные"]);
                }
            }
            
            if (cloudData["настройки"]) {
                gameData.notificationsEnabled = cloudData["настройки"]["уведомления"] || false;
                gameData.parentCode = cloudData["настройки"]["код_родителя"] || "1234";
                gameData.parentModeActive = cloudData["настройки"]["режим_родителя"] || false;
            }
            
            if (cloudData["покупки"]) {
                gameData.purchasedAccessories = cloudData["покупки"]["аксессуары"] || [];
                gameData.purchasedFurniture = cloudData["покупки"]["мебель"] || [];
                gameData.purchasedDecor = cloudData["покупки"]["декор"] || [];
                gameData.purchasedSmart = cloudData["покупки"]["умные_вещи"] || [];
            }
            
            if (cloudData["активные_предметы"]) {
                gameData.activeRight = cloudData["активные_предметы"]["справа"] || null;
                gameData.activeLeft = cloudData["активные_предметы"]["слева"] || null;
                gameData.activeTop = cloudData["активные_предметы"]["сверху"] || null;
                gameData.pet.currentAccessory = cloudData["активные_предметы"]["аксессуар"] || null;
            }
            
            // Сохраняем в localStorage
            localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
            
            if (typeof updateAllUI === 'function') updateAllUI();
            if (typeof renderTasks === 'function') renderTasks();
            
            showMessage("Данные загружены из облака");
            console.log("Облачные данные загружены");
        }
    } catch (e) {
        console.log("Ошибка загрузки из облака:", e);
    }
}

// ============================================
// ЗАГРУЗКА ЛОКАЛЬНЫХ ДАННЫХ
// ============================================

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

// ============================================
// СБРОС ИГРЫ
// ============================================

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
    
    if (typeof ALL_TASKS !== "undefined") {
        ALL_TASKS.daily.forEach(t => {
            gameData.taskStatuses[`daily_${t.id}`] = "pending";
        });
        ALL_TASKS.weekly.forEach(t => {
            gameData.taskStatuses[`weekly_${t.id}`] = "pending";
        });
        ALL_TASKS.monthly.forEach(t => {
            gameData.taskStatuses[`monthly_${t.id}`] = "pending";
        });
    }
    
    saveGame();
    showMessage("Игра сброшена! Начинаем с чистого листа");
    
    if (typeof updateStreakUI === "function") updateStreakUI();
    if (typeof renderLevelProgress === "function") renderLevelProgress();
    if (typeof updateParentModeUI === "function") updateParentModeUI();
    if (typeof updateNameUI === "function") updateNameUI();
    if (typeof updateDateHeader === "function") updateDateHeader();
    if (typeof updatePetStats === "function") updatePetStats();
    if (typeof recalcStats === "function") recalcStats();
    if (typeof updateAllUI === "function") updateAllUI();
    if (typeof renderRoomModal === "function") renderRoomModal();
    if (typeof updateChestUI === "function") updateChestUI();
    if (typeof updateFreeNameButtonState === "function") updateFreeNameButtonState();
    if (typeof renderTasks === "function") renderTasks();
    if (typeof updateActionLimitsDisplay === "function") updateActionLimitsDisplay();
    if (typeof switchTab === "function") switchTab("tasks");
}

// ============================================
// АВТОРИЗАЦИЯ И ЗАГРУЗКА ИЗ ОБЛАКА
// ============================================

if (typeof auth !== "undefined") {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Пользователь:", user.email);
            await loadGameFromCloud(user.uid);
            if (typeof updateAllUI === "function") updateAllUI();
            if (typeof renderTasks === "function") renderTasks();
        }
    });
}