// Утилитарные функции (звуки, анимации, сообщения)

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

function showMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message-popup';
    msg.innerText = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
}

function showEmotion(emoji) {
    const el = document.getElementById('petEmotion');
    el.innerHTML = emoji;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 1800);
}

function showTaskAnimation(card) {
    const div = document.createElement('div');
    div.className = 'stars-animation';
    div.innerHTML = '✨ ⭐ ✨';
    card.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

function updateDateHeader() {
    const now = new Date();
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    document.getElementById('weekdayLabel').innerHTML = weekdays[now.getDay()];
    document.getElementById('dateLabel').innerHTML = `${now.getDate()} ${months[now.getMonth()]}`;
}

function getWeekNumber() {
    const d = new Date();
    const date = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - date) / (24 * 3600 * 1000));
    return Math.ceil((days + date.getDay()) / 7);
}

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