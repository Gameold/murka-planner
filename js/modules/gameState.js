// Глобальное состояние игры
let gameData = {
    gems: 100, streak: 0, lastDate: "", lastWeek: "", lastMonth: "", taskStatuses: {}, dailyChestCollected: false,
    parentCode: "1234", windowCount: 0, petName: "Мурка", lastNameChange: null, parentModeActive: false,
    purchasedAccessories: [], purchasedFurniture: [], purchasedDecor: [], purchasedSmart: [],
    activeRight: null, activeLeft: null, activeTop: null,
    currentLevel: 0,
    dailyBonusClaimed: false,
    lastBonusDay: "",
    lastWeekLevelUp: 0,
    pet: {
        hunger: 20, happiness: 50, energy: 70, clean: 80, lastUpdateTime: Date.now(),
        petCount: 0, playCount: 0, playBallCount: 0, playLaserCount: 0, playCandyCount: 0,
        batheCount: 0, milkCount: 0, brushCount: 0, giftCount: 0, sleepCount: 0,
        feedCount: 0, litterCount: 0,
        currentAccessory: null, sickUntil: null, sleepUntil: null, lastPetTime: 0,
        lastCleaned: Date.now(), needsLitter: 0, litterWarningSent: false,
        feedLastTime: 0, milkLastTime: 0, sleepLastTime: 0, petLastTime: 0,
        playLastTime: 0, playBallLastTime: 0, playLaserLastTime: 0, playCandyLastTime: 0,
        brushLastTime: 0, batheLastTime: 0, giftLastTime: 0, litterLastTime: 0
    },
    style: 0, smartStat: 0, cozy: 0, beauty: 0, notificationsEnabled: false
};

// Переменные состояния UI
let currentFilter = "daily";
let audioCtx = null, confettiActive = false, hungerNotifSent = false;

// Функции сохранения/загрузки
function saveGame() {
    localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
}

function loadGame() {
    const saved = localStorage.getItem("tamagochiPlannerFinal");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameData = { ...gameData, ...data };
            
            // Инициализация недостающих полей gameData
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
            
            // Инициализация недостающих полей pet
            if (!gameData.pet) gameData.pet = {};
            if (gameData.pet.playBallCount === undefined) gameData.pet.playBallCount = 0;
            if (gameData.pet.playLaserCount === undefined) gameData.pet.playLaserCount = 0;
            if (gameData.pet.playCandyCount === undefined) gameData.pet.playCandyCount = 0;
            if (gameData.pet.milkCount === undefined) gameData.pet.milkCount = 0;
            if (gameData.pet.brushCount === undefined) gameData.pet.brushCount = 0;
            if (gameData.pet.giftCount === undefined) gameData.pet.giftCount = 0;
            if (gameData.pet.sleepCount === undefined) gameData.pet.sleepCount = 0;
            if (gameData.pet.feedCount === undefined) gameData.pet.feedCount = 0;
            if (gameData.pet.litterCount === undefined) gameData.pet.litterCount = 0;
            if (gameData.pet.lastPetTime === undefined) gameData.pet.lastPetTime = 0;
            if (gameData.pet.lastCleaned === undefined) gameData.pet.lastCleaned = Date.now();
            if (gameData.pet.needsLitter === undefined) gameData.pet.needsLitter = 0;
            if (gameData.pet.litterWarningSent === undefined) gameData.pet.litterWarningSent = false;
            if (gameData.pet.currentAccessory === undefined) gameData.pet.currentAccessory = null;
            if (gameData.pet.sickUntil === undefined) gameData.pet.sickUntil = null;
            if (gameData.pet.sleepUntil === undefined) gameData.pet.sleepUntil = null;
            if (gameData.pet.lastUpdateTime === undefined) gameData.pet.lastUpdateTime = Date.now();
            if (gameData.pet.feedLastTime === undefined) gameData.pet.feedLastTime = 0;
            if (gameData.pet.milkLastTime === undefined) gameData.pet.milkLastTime = 0;
            if (gameData.pet.sleepLastTime === undefined) gameData.pet.sleepLastTime = 0;
            if (gameData.pet.petLastTime === undefined) gameData.pet.petLastTime = 0;
            if (gameData.pet.playLastTime === undefined) gameData.pet.playLastTime = 0;
            if (gameData.pet.playBallLastTime === undefined) gameData.pet.playBallLastTime = 0;
            if (gameData.pet.playLaserLastTime === undefined) gameData.pet.playLaserLastTime = 0;
            if (gameData.pet.playCandyLastTime === undefined) gameData.pet.playCandyLastTime = 0;
            if (gameData.pet.brushLastTime === undefined) gameData.pet.brushLastTime = 0;
            if (gameData.pet.batheLastTime === undefined) gameData.pet.batheLastTime = 0;
            if (gameData.pet.giftLastTime === undefined) gameData.pet.giftLastTime = 0;
            if (gameData.pet.litterLastTime === undefined) gameData.pet.litterLastTime = 0;
            
        } catch (e) {
            console.log("Ошибка загрузки, сброс игры:", e);
            resetGame();
        }
    } else {
        resetGame();
    }
}

function resetGame() {
    gameData = {
        gems: 100, 
        streak: 0, 
        lastDate: "", 
        lastWeek: "", 
        lastMonth: "", 
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
            hunger: 20, 
            happiness: 50, 
            energy: 70, 
            clean: 80, 
            lastUpdateTime: Date.now(),
            petCount: 0, 
            playCount: 0, 
            playBallCount: 0, 
            playLaserCount: 0, 
            playCandyCount: 0,
            batheCount: 0, 
            milkCount: 0, 
            brushCount: 0, 
            giftCount: 0, 
            sleepCount: 0,
            feedCount: 0,
            litterCount: 0,
            currentAccessory: null, 
            sickUntil: null, 
            sleepUntil: null, 
            lastPetTime: 0,
            lastCleaned: Date.now(), 
            needsLitter: 0, 
            litterWarningSent: false,
            feedLastTime: 0,
            milkLastTime: 0,
            sleepLastTime: 0,
            petLastTime: 0,
            playLastTime: 0,
            playBallLastTime: 0,
            playLaserLastTime: 0,
            playCandyLastTime: 0,
            brushLastTime: 0,
            batheLastTime: 0,
            giftLastTime: 0,
            litterLastTime: 0
        },
        style: 0, 
        smartStat: 0, 
        cozy: 0, 
        beauty: 0, 
        notificationsEnabled: false
    };
    
    gameData.parentModeActive = false;
    
    const today = new Date().toDateString();
    const thisWeek = getWeekNumber();
    const thisMonth = new Date().getMonth() + "-" + new Date().getFullYear();
    
    gameData.lastDate = today;
    gameData.lastWeek = thisWeek;
    gameData.lastMonth = thisMonth;
    gameData.streak = 1;
    
    ALL_TASKS.daily.forEach(t => {
        gameData.taskStatuses[`daily_${t.id}`] = 'pending';
    });
    ALL_TASKS.weekly.forEach(t => {
        gameData.taskStatuses[`weekly_${t.id}`] = 'pending';
    });
    ALL_TASKS.monthly.forEach(t => {
        gameData.taskStatuses[`monthly_${t.id}`] = 'pending';
    });
    
    saveGame();
    
    updateStreakUI();
    renderLevelProgress();
    renderLitterButton();
    updateParentModeUI();
    updateNameUI();
    updatePetBars();
    updateGemsUI();
    renderTasks();
    renderShop();
    renderRoomModal();
    updateChestUI();
    
    currentFilter = "daily";
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length) {
        filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'daily') btn.classList.add('active');
        });
    }
    
    showMessage("🌸 Игра сброшена! Начинаем с чистого листа 🌸");
}