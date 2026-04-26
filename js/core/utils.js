// ============================================
// НАСТРОЙКИ СООБЩЕНИЙ (можно менять)
// ============================================
const MESSAGE_SETTINGS = {
    baseDuration: 2500,      // базовая длительность в мс (1.5 сек)
    charBonus: 50,           // +50мс за каждый символ сверх лимита
    charLimit: 40,           // после скольки символов начинаем добавлять время
    lineBonus: 300,          // +300мс за каждую строку (перенос)
    maxDuration: 5000,       // максимум 5 секунд
    queueDelay: 300          // задержка между сообщениями в очереди
};

// ============================================
// ФУНКЦИИ АУДИО
// ============================================

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { }
}

function playSound(freq = 880) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.12;
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
    } catch (e) { }
}

function playMeow() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.45);
        osc.start();
        osc.stop(now + 0.45);
    } catch (e) { }
}

// ============================================
// ОЧЕРЕДЬ СООБЩЕНИЙ С ДИНАМИЧЕСКОЙ ДЛИТЕЛЬНОСТЬЮ
// ============================================

let messageQueue = [];
let isMessageShowing = false;

// Функция расчёта длительности сообщения
function getMessageDuration(text) {
    let duration = MESSAGE_SETTINGS.baseDuration;
    
    // Добавляем время за длинные слова/символы
    if (text.length > MESSAGE_SETTINGS.charLimit) {
        const extraChars = text.length - MESSAGE_SETTINGS.charLimit;
        duration += extraChars * MESSAGE_SETTINGS.charBonus;
    }
    
    // Добавляем время за переносы строк
    const lines = (text.match(/\n/g) || []).length;
    duration += lines * MESSAGE_SETTINGS.lineBonus;
    
    // Ограничиваем максимумом
    return Math.min(duration, MESSAGE_SETTINGS.maxDuration);
}

function showMessage(text) {
    messageQueue.push(text);
    if (!isMessageShowing) {
        showNextMessage();
    }
}

function showNextMessage() {
    if (messageQueue.length === 0) {
        isMessageShowing = false;
        return;
    }
    
    isMessageShowing = true;
    const text = messageQueue.shift();
    const duration = getMessageDuration(text);
    
    const msg = document.createElement('div');
    msg.className = 'message-popup';
    msg.innerText = text;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.remove();
        setTimeout(() => {
            showNextMessage();
        }, MESSAGE_SETTINGS.queueDelay);
    }, duration);
}

// Быстрое сообщение (без очереди, для срочных уведомлений)
function showMessageSimple(text) {
    const msg = document.createElement('div');
    msg.className = 'message-popup';
    msg.innerText = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
}

// ============================================
// ЭМОЦИИ И АНИМАЦИИ
// ============================================

function showEmotion(emoji) {
    const el = document.getElementById('petEmotion');
    if (!el) return;
    el.innerHTML = emoji;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, CONFIG.PET_EMOTION_DURATION);
}

function showTaskAnimation(card) {
    const div = document.createElement('div');
    div.className = 'stars-animation';
    div.innerHTML = '✨ ⭐ ✨';
    card.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

// ============================================
// ДАТА И ВРЕМЯ
// ============================================

function updateDateHeader() {
    const now = new Date();
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    const weekdayEl = document.getElementById('weekdayLabel');
    const dateEl = document.getElementById('dateLabel');
    if (weekdayEl) weekdayEl.innerHTML = weekdays[now.getDay()];
    if (dateEl) dateEl.innerHTML = `${now.getDate()} ${months[now.getMonth()]}`;
}

function getWeekNumber() {
    const d = new Date();
    const date = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - date) / (24 * 3600 * 1000));
    return Math.ceil((days + date.getDay()) / 7);
}

// ============================================
// БОНУСЫ И РАСЧЁТЫ
// ============================================

function getDecayBonus(stat, maxBonus = 0.7) {
    return Math.min(maxBonus, gameData[stat] / 100);
}

function getHappinessDecayBonus() { return getDecayBonus('style', 0.7); }
function getHungerDecayBonus() { return getDecayBonus('cozy', 0.7); }
function getCleanDecayBonus() { return getDecayBonus('beauty', 0.7); }
function getRewardBonus() { return 1 + (gameData.smartStat / 200); }

function getStatName(statType) {
    const names = { style: 'стилю', smart: 'уму', cozy: 'уюту', beauty: 'красоте' };
    return names[statType] || 'характеристике';
}

function getDaysWord(days) {
    if (days >= 11 && days <= 19) return 'дней';
    const lastDigit = days % 10;
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}

// ============================================
// КОНФЕТТИ
// ============================================

function resizeCanvas() {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    resizeCanvas();
    let particles = [];
    const colors = ['#ff99cc', '#ffcc99', '#99ffcc', '#ffb3ba', '#c5e99b'];
    
    for (let i = 0; i < 70; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 5,
            size: Math.random() * 8 + 3,
            speedY: -Math.random() * 7 - 4,
            speedX: (Math.random() - 0.5) * 3.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            spin: (Math.random() - 0.5) * 12
        });
    }
    
    if (confettiActive) return;
    confettiActive = true;
    
    function animate() {
        if (!confettiActive || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        
        for (let p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.2;
            p.rot += p.spin;
            if (p.y < canvas.height + 50 && p.y > -50) alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
        
        if (alive) {
            requestAnimationFrame(animate);
        } else {
            confettiActive = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    requestAnimationFrame(animate);
    setTimeout(() => {
        confettiActive = false;
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, CONFIG.CONFETTI_DURATION);
}