// ============================================
// АВТОРИЗАЦИЯ
// ============================================

// Показать окно входа
function showLoginModal() {
    // ЕСЛИ ПОЛЬЗОВАТЕЛЬ УЖЕ АВТОРИЗОВАН — НЕ ПОКАЗЫВАЕМ ОКНО!
    if (auth && auth.currentUser) {
        console.log('✅ Пользователь уже авторизован, окно входа не показываем');
        return;
    }
    
    let modal = document.getElementById('loginModal');
    if (!modal) {
        createLoginModal();
        modal = document.getElementById('loginModal');
    }
    modal.classList.add('active');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('active');
}

// Создать модальное окно
function createLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="login-content">
            <div class="login-close" id="loginCloseBtn">✕</div>
            <div class="login-icon">🐱</div>
            <h2>Мурка</h2>
            <p>Войдите, чтобы сохранить прогресс</p>
            <button id="googleLoginBtn" class="login-btn google-btn">🅶 Войти через Google</button>
            <div class="login-divider">или</div>
            <input type="email" id="loginEmail" class="login-input" placeholder="Email">
            <input type="password" id="loginPassword" class="login-input" placeholder="Пароль">
            <div class="login-buttons">
                <button id="doLoginBtn" class="login-btn small">Войти</button>
                <button id="doRegisterBtn" class="login-btn small register">Регистрация</button>
            </div>
            <div class="login-note">💡 Данные хранятся в облаке<br>Вы можете войти с любого устройства</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Стили
    const style = document.createElement('style');
    style.textContent = `
        .login-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 20000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        .login-modal.active { display: flex; }
        .login-content {
            background: linear-gradient(145deg, #fff5f0, #ffe8f0);
            border-radius: 48px;
            padding: 24px;
            max-width: 320px;
            width: 85%;
            text-align: center;
            position: relative;
            border: 2px solid #ffd700;
        }
        .login-close {
            position: absolute;
            top: 12px;
            right: 16px;
            font-size: 24px;
            cursor: pointer;
            color: #b87492;
        }
        .login-icon { font-size: 60px; margin-bottom: 8px; }
        .login-content h2 { color: #e890b0; margin-bottom: 4px; }
        .login-content p { color: #b87492; font-size: 12px; margin-bottom: 20px; }
        .login-btn {
            width: 100%;
            padding: 12px;
            border-radius: 40px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            margin: 8px 0;
            font-size: 14px;
        }
        .google-btn { background: #4285f4; color: white; }
        .login-input {
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            border: 2px solid #f0d8e4;
            border-radius: 30px;
            text-align: center;
        }
        .login-buttons { display: flex; gap: 8px; margin-top: 8px; }
        .login-btn.small { flex: 1; padding: 10px; background: #e890b0; color: white; }
        .login-btn.small.register { background: #8bc34a; }
        .login-divider { margin: 12px 0; color: #c284a3; font-size: 12px; }
        .login-note { margin-top: 16px; font-size: 10px; color: #a57388; background: rgba(255,255,255,0.5); padding: 8px; border-radius: 20px; }
    `;
    document.head.appendChild(style);
    
    // Обработчики
    document.getElementById('googleLoginBtn').onclick = loginWithGoogle;
    document.getElementById('doLoginBtn').onclick = () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (email && password) loginWithEmail(email, password);
        else showMessage('Введите email и пароль');
    };
    document.getElementById('doRegisterBtn').onclick = () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (email && password) registerWithEmail(email, password);
        else showMessage('Введите email и пароль');
    };
    document.getElementById('loginCloseBtn').onclick = closeLoginModal;
}

// Вход через Google
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        showMessage(`✅ Добро пожаловать, ${result.user.displayName || result.user.email}!`);
        closeLoginModal();
        // Перезагружаем страницу, чтобы обновить данные
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        showMessage(`❌ Ошибка: ${error.message}`);
    }
}

// Вход по email
async function loginWithEmail(email, password) {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        showMessage(`✅ Добро пожаловать, ${result.user.email}!`);
        closeLoginModal();
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        showMessage(`❌ Ошибка: ${error.message}`);
    }
}

// Регистрация
async function registerWithEmail(email, password) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        showMessage(`✅ Регистрация успешна! Добро пожаловать!`);
        closeLoginModal();
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        showMessage(`❌ Ошибка: ${error.message}`);
    }
}

// Выход
async function logout() {
    if (confirm("Выйти из аккаунта? Данные останутся на устройстве.")) {
        await auth.signOut();
        showMessage("👋 Вы вышли из аккаунта");
        setTimeout(() => location.reload(), 500);
    }
}

// Обновление кнопки в настройках
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async (user) => {
        const container = document.getElementById('parentActionContainer');
        if (!container) return;
        
        if (user) {
            // Пользователь вошёл — показываем кнопку выхода
            let logoutBtn = document.getElementById('logoutBtn');
            if (!logoutBtn) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.className = 'settings-btn';
                logoutBtn.style.background = '#ff6b6b';
                logoutBtn.style.marginTop = '12px';
                logoutBtn.innerHTML = '🚪 Выйти из аккаунта';
                logoutBtn.onclick = logout;
                container.appendChild(logoutBtn);
            }
            // Удаляем кнопку входа если она есть
            const loginBtn = document.getElementById('showLoginBtn');
            if (loginBtn) loginBtn.remove();
        } else {
            // Пользователь не вошёл — показываем кнопку входа
            let loginBtn = document.getElementById('showLoginBtn');
            if (!loginBtn) {
                const loginBtn = document.createElement('button');
                loginBtn.id = 'showLoginBtn';
                loginBtn.className = 'enter-parent-btn';
                loginBtn.innerHTML = '🔐 Войти / Зарегистрироваться';
                loginBtn.onclick = showLoginModal;
                container.appendChild(loginBtn);
            }
            // Удаляем кнопку выхода если она есть
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.remove();
        }
    });
}

// Проверка авторизации при загрузке страницы
window.addEventListener('load', function() {
    setTimeout(() => {
        if (typeof auth !== 'undefined') {
            const user = auth.currentUser;
            if (!user) {
                console.log('🔐 Пользователь не авторизован, показываем окно входа');
                showLoginModal();
            } else {
                console.log(`✅ Авторизован как: ${user.email}`);
            }
        }
    }, 500);
});

// Проверка при возврате на страницу
window.addEventListener('focus', function() {
    if (typeof auth !== 'undefined' && auth.currentUser === null) {
        const lastCheck = localStorage.getItem('lastLoginCheck');
        const now = Date.now();
        if (!lastCheck || (now - parseInt(lastCheck)) > 30000) {
            localStorage.setItem('lastLoginCheck', now);
            showLoginModal();
        }
    }
});