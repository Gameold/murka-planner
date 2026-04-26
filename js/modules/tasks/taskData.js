// Данные заданий

const REQUIRED_TASK_IDS = ["d1", "d2", "d4", "d9", "d12-2", "d14"];

const ALL_TASKS = {
    daily: [
        { id: "d1", name: "Заправить постель", icon: "🛏️", reward: 8, required: true },
        { id: "d2", name: "Убрать одежду", icon: "👗", reward: 8, required: true },
        { id: "d4", name: "Собрать рюкзак", icon: "🎒", reward: 8, required: true },
        { id: "d9", name: "Покормить Мурку", icon: "🐾", reward: 10, required: true },
        { id: "d12-2", name: "Почистить зубы (вечер)", icon: "🪥", reward: 5, required: true },
        { id: "d14", name: "Сделать уроки", icon: "✍️", reward: 12, required: true },
        { id: "d3", name: "Приготовить себе завтрак", icon: "🍳", reward: 10, required: false },
        { id: "d5", name: "Убрать со стола после еды", icon: "🍽️", reward: 10, required: false },
        { id: "d6", name: "Помыть посуду / загрузить посудомойку", icon: "🧼", reward: 10, required: false },
        { id: "d7", name: "Убрать в комнате", icon: "🧹", reward: 10, required: false },
        { id: "d8", name: "Протереть листья растений", icon: "🪴", reward: 8, required: false },
        { id: "d10", name: "Вынести мусор", icon: "🗑️", reward: 8, required: false },
        { id: "d11", name: "Сделать зарядку", icon: "🤸", reward: 8, required: false },
        { id: "d12-1", name: "Почистить зубы (утро)", icon: "🪥", reward: 5, required: false },
        { id: "d13", name: "Прочитать книгу (5 стр)", icon: "📖", reward: 10, required: false },
        { id: "d15", name: "Сказать спасибо + показать результат", icon: "🙏", reward: 5, required: false },
        { id: "d16", name: "Помыть руки перед едой", icon: "🧴", reward: 5, required: false }
    ],
    weekly: [
        { id: "w1", name: "Пропылесосить или подмести", icon: "🧹", reward: 20 },
        { id: "w2", name: "Помыть окна", icon: "🪟", reward: 0, isWindow: true },
        { id: "w3", name: "Помочь с ужином", icon: "🍕", reward: 20 },
        { id: "w4", name: "Сходить в магазин с мамой", icon: "🛒", reward: 20 },
        { id: "w5", name: "Приготовить десерт", icon: "🍪", reward: 25 },
        { id: "w6", name: "Разобрать письменный стол", icon: "📚", reward: 20 },
        { id: "w7", name: "Погладить одежду", icon: "👚", reward: 20 }
    ],
    monthly: [
        { id: "m1", name: "Разобрать шкаф с одеждой", icon: "🗄️", reward: 50 },
        { id: "m2", name: "Генеральная уборка", icon: "🧹✨", reward: 50 },
        { id: "m3", name: "Помыть холодильник", icon: "🧊", reward: 45 },
        { id: "m4", name: "Отсортировать игрушки", icon: "🧸", reward: 35 },
        { id: "m5", name: "Приготовить семейный ужин", icon: "🍕", reward: 50 }
    ]
};

function areAllRequiredTasksCompleted() {
    for (let reqId of REQUIRED_TASK_IDS) {
        const status = gameData.taskStatuses[`daily_${reqId}`];
        if (status !== 'rewarded') return false;
    }
    return true;
}

function getAllTasksArray() {
    return [
        ...ALL_TASKS.daily.map(t => ({ ...t, type: 'daily' })),
        ...ALL_TASKS.weekly.map(t => ({ ...t, type: 'weekly' })),
        ...ALL_TASKS.monthly.map(t => ({ ...t, type: 'monthly' }))
    ];
}