// ============================================
// FIREBASE КОНФИГУРАЦИЯ
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDcglHN5Z4gAVLhw89QHzPg2tOowNrp8po",
    authDomain: "murpaner.firebaseapp.com",
    databaseURL: "https://murpaner-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "murpaner",
    storageBucket: "murpaner.firebasestorage.app",
    messagingSenderId: "1068464058937",
    appId: "1:1068464058937:web:1ee38e6074c95ab7be53e8",
    measurementId: "G-0SV6QYZJHM"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();