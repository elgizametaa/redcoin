// استيراد المفاتيح من ملف config.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './Scripts/config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// إنشاء اتصال بـ Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تعريف حالة اللعبة
let gameState = {
    balance: 0,
    energy: 500,
    maxEnergy: 500,
    fillEnergyCount: 0,
    lastFillTime: Date.now(),
    autClickCount: 0,    // عدد محاولات النقر التلقائي
    lastAutClickTime: Date.now(),  // آخر وقت تم فيه استخدام النقر التلقائي
};

// استيراد العناصر من DOM
const uiElements = {
    purchaseNotification: document.getElementById('purchaseNotification'),
    energyBar: document.getElementById('energyBar'),
    energyInfo: document.getElementById('energyInfo'),
    fillEnergyButton: document.getElementById('fillEnergyButton'),
    closePopupButton: document.getElementById('closePopupButton'),
    energyAttemptsText: document.getElementById('energyAttemptsText'),
    energyPopup: document.getElementById('energyPopup'),
    free1: document.getElementById('free1'), // زر تعبئة الطاقة

    autClickButton: document.getElementById('AutoclickButton'),
    autClickAttemptsText: document.getElementById('AutoclickAttemptsText'),
    autClickPopup: document.getElementById('AutoclickPopup'),
    clickableImg: document.getElementById('clickableImg'),
    mainPage: document.getElementById('mainPage'),
    free2Element: document.getElementById('free2'), // زر النقر التلقائي
    updateAttemptsElement: document.getElementById('UpdateAttempts'),
    closeAutoclick: document.getElementById('closeAutoclick'),
};

// *** دوال إدارة الطاقة ***

// فتح نافذة الطاقة
uiElements.free1.addEventListener('click', openEnergyPopup);

function openEnergyPopup() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 ساعة بالميلي ثانية

    // تحديث المحاولات
    uiElements.energyAttemptsText.innerText = `Attempts: ${gameState.fillEnergyCount}/2`;

    // عرض النافذة
    uiElements.energyPopup.style.display = 'block';

    // منطق زر تعبئة الطاقة
    if (gameState.fillEnergyCount < 2) {
        uiElements.fillEnergyButton.textContent = 'Fill Energy';
        uiElements.fillEnergyButton.disabled = false;
        uiElements.fillEnergyButton.addEventListener('click', fillEnergyAction);
    } else {
        if (currentTime - gameState.lastFillTime < twentyFourHours) {
            const remainingTime = Math.floor((twentyFourHours - (currentTime - gameState.lastFillTime)) / 1000);
            uiElements.fillEnergyButton.textContent = `Wait ${formatTime(remainingTime)} before refilling`;
            uiElements.fillEnergyButton.disabled = true;
        } else {
            uiElements.fillEnergyButton.textContent = 'Refill Energy';
            uiElements.fillEnergyButton.disabled = false;
            uiElements.fillEnergyButton.addEventListener('click', fillEnergyAction);
        }
    }

    uiElements.closePopupButton.addEventListener('click', closeEnergyPopup);
}

// إغلاق نافذة الطاقة
function closeEnergyPopup() {
    uiElements.energyPopup.style.display = 'none';
}

// تعبئة الطاقة
async function fillEnergyAction() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (gameState.fillEnergyCount < 2) {
        gameState.energy = gameState.maxEnergy;
        gameState.fillEnergyCount += 1;
        gameState.lastFillTime = currentTime;

        // تحديث واجهة المستخدم
        updateEnergyUI();
        showNotification('Energy filled!');
    } else if (currentTime - gameState.lastFillTime >= twentyFourHours) {
        gameState.fillEnergyCount = 0;
        gameState.lastFillTime = currentTime;
        showNotification('You can refill energy again!');
    } else {
        const remainingTime = Math.floor((twentyFourHours - (currentTime - gameState.lastFillTime)) / 1000);
        showNotification(`Wait ${formatTime(remainingTime)} before refilling.`);
    }

    // تحديث قاعدة البيانات
    updateUserData();
}

// تحديث واجهة الطاقة
function updateEnergyUI() {
    const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
}

// *** دوال النقر التلقائي ***

uiElements.free2Element.addEventListener('click', openAutoclickPopup);

// فتح نافذة النقر التلقائي
function openAutoclickPopup() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    uiElements.updateAttemptsElement.innerText = `${gameState.autClickCount}/2`;

    if (gameState.autClickCount < 2) {
        uiElements.autClickButton.textContent = 'Activate Auto Click';
        uiElements.autClickButton.disabled = false;
        uiElements.autClickButton.addEventListener('click', activateAutoclick);
    } else {
        if (currentTime - gameState.lastAutClickTime < twentyFourHours) {
            const remainingTime = Math.floor((twentyFourHours - (currentTime - gameState.lastAutClickTime)) / 1000);
            uiElements.autClickButton.textContent = `Wait ${formatTime(remainingTime)} before using again`;
            uiElements.autClickButton.disabled = true;
        } else {
            uiElements.autClickButton.textContent = 'Activate Auto Click';
            uiElements.autClickButton.disabled = false;
            uiElements.autClickButton.addEventListener('click', activateAutoclick);
        }
    }

    uiElements.autClickPopup.style.display = 'block';
    uiElements.closeAutoclick.addEventListener('click', closeAutoclickPopup);
}

// إغلاق نافذة النقر التلقائي
function closeAutoclickPopup() {
    uiElements.autClickPopup.style.display = 'none';
}

// تفعيل النقر التلقائي
async function activateAutoclick() {
    const clickDuration = 30 * 1000; // 30 ثانية
    const startTime = Date.now();

    function clickElement() {
        const currentTime = Date.now();
        if (currentTime - startTime < clickDuration) {
            uiElements.clickableImg.click();
            createClickEffect(
                Math.random() * uiElements.clickableImg.offsetWidth,
                Math.random() * uiElements.clickableImg.offsetHeight
            );
            setTimeout(clickElement, 100); // تكرار النقر
        } else {
            navigateToMainPage();
        }
    }

    clickElement();
    gameState.autClickCount += 1;
    gameState.lastAutClickTime = Date.now();
    uiElements.updateAttemptsElement.innerText = `${gameState.autClickCount}/2`;

    // تحديث قاعدة البيانات
    updateUserData();
}

// إنشاء تأثير النقر
function createClickEffect(x, y) {
    const clickEffect = document.createElement('div');
    clickEffect.classList.add('click-effect');
    clickEffect.style.left = `${x}px`;
    clickEffect.style.top = `${y}px`;
    document.body.appendChild(clickEffect);
    setTimeout(() => clickEffect.remove(), 500);
}

// الانتقال إلى الصفحة الرئيسية
function navigateToMainPage() {
    uiElements.mainPage.classList.add('active');
}

// صياغة الوقت
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// عرض إشعار
function showNotification(message) {
    if (!uiElements.purchaseNotification) return;
    uiElements.purchaseNotification.innerText = message;
    uiElements.purchaseNotification.classList.add('show');
    setTimeout(() => uiElements.purchaseNotification.classList.remove('show'), 4000);
}

// تحديث البيانات في قاعدة البيانات
async function updateUserData() {
    const updatedData = {
        balance: gameState.balance,
        energy: gameState.energy,
        fillEnergyCount: gameState.fillEnergyCount,
        lastFillTime: gameState.lastFillTime,
        autClickCount: gameState.autClickCount,
        lastAutClickTime: gameState.lastAutClickTime,
    };

    try {
        const { error } = await supabase
            .from('users') // تأكد أن اسم الجدول في قاعدة البيانات هو "users"
            .update(updatedData)
            .eq('telegram_id', gameState.userId); // استخدم معرف المستخدم لتحديث البيانات

        if (error) {
            console.error('Error updating user data:', error);
        }
    } catch (err) {
        console.error('Unexpected error while updating user data:', err);
    }
}

// تحميل حالة اللعبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // استيراد بيانات المستخدم من قاعدة البيانات
    const { data, error } = await supabase
        .from('users') // تأكد أن اسم الجدول هو "users"
        .select('*')
        .eq('telegram_id', gameState.userId) // استخدم معرف المستخدم
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
    } else if (data) {
        gameState = { ...gameState, ...data };
        updateEnergyUI();
        uiElements.updateAttemptsElement.innerText = `${gameState.autClickCount}/2`;
    }
});


//////////////////////////////////


// حفظ حالة اللعبة في LocalStorage وقاعدة البيانات
async function saveGameState() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    // إنشاء بيانات محدثة للحفظ
    const updatedData = {
        balance: gameState.balance,
        energy: gameState.energy,
        max_energy: gameState.maxEnergy,
        click_multiplier: gameState.clickMultiplier,
        boost_level: gameState.boostLevel,
        coin_boost_level: gameState.coinBoostLevel,
        energy_boost_level: gameState.energyBoostLevel,
        caesar_puzzles_progress: gameState.caesarPuzzleProgress, 
        
    };

    try {
        // حفظ البيانات في قاعدة البيانات
        const { error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('telegram_id', userId);

        if (error) {
            throw new Error(`Error saving game state: ${error.message}`);
        }

        console.log('Game state updated successfully.');
    } catch (err) {
        console.error(err.message);
    }
}




//////////////////////////////




const AdController = window.Adsgram.init({ blockId: "int-5511" });
const button = document.getElementById('ad');

const rewardAmount = 5000;

button.addEventListener('click', () => {
    AdController.show().then((result) => {
        // User watched the ad till the end or interacted with it
        // Reward the user
        rewardUser(rewardAmount);
        showNotification('You have earned ' + rewardAmount + ' coins for watching the ad!');
    }).catch((result) => {
        // Handle the case where there was an issue with showing the ad
        console.error('Error showing ad: ', result);
        showNotification('Sorry, there was an error showing the ad. Please try again.');
    });
});

// Function to reward the user
function rewardUser(amount) {
    // Add the reward to the user's balance (make sure to integrate this with your existing game logic)
    gameState.balance += amount;

    // Save the updated game state (if necessary)
    saveGameState();
}
