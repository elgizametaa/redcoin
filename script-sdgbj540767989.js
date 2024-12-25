import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './Scripts/config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تعريف عناصر DOM
const uiElements = {
    balanceDisplay: document.getElementById('balanceAmount'),
    accountBalanceDisplay: document.getElementById('AccountnavbarBalanceDisplay'),
    taskBalanceDisplay: document.getElementById('tasknavbarBalanceDisplay'),
    puzzleBalanceDisplay: document.getElementById('puzzlenavbarBalanceDisplay'),
    boostBalanceDisplay: document.getElementById('BoostnavbarBalanceDisplay'),
    lvlBalanceDisplay: document.getElementById('lvlnavbarBalanceDisplay'),
    miningBalanceDisplay: document.getElementById('miningnavbarBalanceDisplay'),
    walletBalanceDisplay: document.getElementById('navbarBalanceDisplay'),
    settingsBalanceDisplay: document.getElementById('settingsBalanceDisplay'),
    gnavbarBalanceDisplay: document.getElementById('gnavbarBalanceDisplay'),
    leaderboardnavbarBalanceDisplay: document.getElementById('leaderboardnavbarBalanceDisplay'),
    energyBar: document.getElementById('energyBar'),
    energyInfo: document.getElementById('energyInfo'),
    languageBtn: document.getElementById('languageSwitchBtn'),
    boostLevelDisplay: document.getElementById('boostLevel'),
    multiplierDisplay: document.getElementById('clickMultiplier'),
    coinBoostLevelDisplay: document.getElementById('coinBoostLevel'),
    coinUpgradeCost: document.getElementById('coinUpgradeCost'),
    boostUpgradeCost: document.getElementById('boostUpgradeCost'),
    upgradeImage: document.getElementById('upgradeImage'),
    currentLevel: document.getElementById('currentLevel'),  
    currentCoins: document.getElementById('currentCoins'),  
    upgradeCost: document.getElementById('upgradeCost'),   
    purchaseNotification: document.getElementById('purchaseNotification'),
    copyInviteNotification: document.getElementById('copyInviteNotification'),
    clickableImg: document.getElementById('clickableImg'),
    navButtons: document.querySelectorAll('.menu button'),
    contentScreens: document.querySelectorAll('.screen-content'),
    splashScreen: document.querySelector('.splash-screen'),
    mainContainer: document.querySelector('.container'),
    levelFloatingBtn: document.getElementById('levelFloatingBtn'),
    confirmUpgradeBtn: document.getElementById('confirmUpgradeBtn'),
    cancelUpgradeBtn: document.getElementById('cancelUpgradeBtn'),
    upgradeModal: document.getElementById('upgradeConfirmation'),
    closeModal: document.getElementById('closeModal'),
    fillEnergyBtn: document.getElementById('fillEnergyBtn'),
    withdrawBtn: document.getElementById('withdrawBtn'),
    withdrawalForm: document.getElementById('withdrawalForm'),
    confirmWithdrawalBtn: document.getElementById('confirmWithdrawalBtn'),
    maxWithdrawBtn: document.getElementById('maxWithdrawBtn'),
    withdrawAmountInput: document.getElementById('withdrawAmount'),
    userTelegramNameDisplay: document.getElementById('userTelegramName'),
    userTelegramIdDisplay: document.getElementById('userTelegramId'),
    levelInfoDisplay: document.getElementById('currentLevelInfo') || { innerText: '' },
    friendsListDisplay: document.getElementById('friendsList') || { innerHTML: '' },
    displayedLevel: document.getElementById('displayedLevel'),
    currentLevelName: document.getElementById('currentLevelName'),    
    boostUpgradeBtn: document.getElementById('boostUpgradeBtn'),
    coinUpgradeBtn: document.getElementById('coinUpgradeBtn'),
    fillEnergyUpgradeBtn: document.getElementById('fillEnergyBtn'),
    inviteFriendsBtn: document.getElementById('inviteFriendsBtn'),
    copyInviteLinkBtn: document.getElementById('copyInviteLinkBtn'),

};

// حالة اللعبة
let gameState = {
    balance: 0,
    energy: 500,
    maxEnergy: 500,
    clickMultiplier: 1,
    boostLevel: 1,
    coinBoostLevel: 1,
    energyBoostLevel: 1,
    lastFillTime: Date.now(),
    friends: 0,
    invites: [],
    completedTasks: [],
    puzzlesprogress:[], 
};

//تحديث البيانت من الواجهه الي قاعده البيانات 
async function updateGameStateInDatabase(updatedData) {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updatedData) // البيانات الجديدة
            .eq('telegram_id', userId); // شرط التحديث

        if (error) {
            console.error('Error updating game state in Supabase:', error);
            return false;
        }

        console.log('Game state updated successfully in Supabase:', data);
        return true;
    } catch (err) {
        console.error('Unexpected error while updating game state:', err);
        return false;
    }
}



//تحديث قاعده البيانات 
async function loadGameState() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    try {
        console.log('Loading game state from Supabase...');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error loading game state from Supabase:', error.message);
            return;
        }

        if (data) {
            console.log('Loaded game state:', data); // عرض البيانات المحملة
            gameState = { ...gameState, ...data };
            updateUI();
        } else {
            console.warn('No game state found for this user.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}


// حفظ حالة اللعبة في LocalStorage وقاعدة البيانات
async function saveGameState() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    // إنشاء بيانات محدثة للحفظ
    const updatedData = {
        balance: gameState.balance,
        energy: gameState.energy,
        max_energy: gameState.maxEnergy,
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


async function restoreEnergy() {
    try {
        const lastFillTime = parseInt(localStorage.getItem('lastFillTime'), 10) || Date.now();
        const currentTime = Date.now();
        const timeDiff = currentTime - lastFillTime;

        // حساب عدد المرات التي يجب استعادة الطاقة فيها
        const recoverableTimes = Math.floor(timeDiff / (5 * 1000)); // كل 5 ثوانٍ
        const recoveredEnergy = recoverableTimes * 5;

        // استعادة الطاقة بدون تجاوز الحد الأقصى
        const currentEnergy = gameState.maxEnergy - localEnergyConsumed;
        gameState.energy = Math.min(gameState.maxEnergy, currentEnergy + recoveredEnergy);

        // تحديث وقت آخر استعادة
        gameState.lastFillTime = currentTime - (timeDiff % (5 * 1000)); // الاحتفاظ بالوقت المتبقي
        localStorage.setItem('lastFillTime', gameState.lastFillTime);

        updateEnergyUI();

        console.log('Energy restored successfully.');
    } catch (err) {
        console.error('Error restoring energy:', err.message);

        showNotificationWithStatus(
            uiElements.purchaseNotification,
            `Failed to restore energy. Please reload.`,
            'lose'
        );
    }
}


// الاستماع إلى التغييرات في قاعدة البيانات
//function listenToRealtimeChanges() {
  //  const userId = uiElements.userTelegramIdDisplay.innerText;

  //  supabase
     //   .channel('public:users')
      //  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `telegram_id=eq.${userId}` }, payload => {
        //    console.log('Change received!', payload);
         //   gameState = { ...gameState, ...payload.new };
          //  updateUI();
          //  saveGameState();
      //  })
      //  .subscribe();
//}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const isBanned = await checkAndHandleBan();
    if (isBanned) return; 
    await loadGameState();   
    await restoreEnergy();
    startEnergyRecovery();
    updateGameStateInDatabase(); 
    updateUI(); 
   // listenToRealtimeChanges();   
    await initializeApp();  
});


// دالة تهيئة التطبيق
async function initializeApp() {
    try {
        console.log('Initializing app...');

        // جلب بيانات المستخدم من Telegram وSupabase
        await fetchUserDataFromTelegram();

        // إخفاء شاشة البداية وعرض المحتوى الرئيسي
         setTimeout(() => {
       if (uiElements.splashScreen) uiElements.splashScreen.style.display = 'none';
       if (uiElements.mainContainer) uiElements.mainContainer.style.display = 'flex';
    }, 2000); // 10000 ميلي ثانية تعني 10 ثوانٍ

        
        // استمع إلى التغييرات في البيانات
        //listenToRealtimeChanges();

        // إعداد واجهة المستخدم
        updateUI();
        registerEventHandlers();
        startEnergyRecovery();
        
        console.log('App initialized successfully.');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification(uiElements.purchaseNotification, 'Failed to initialize app.');
        if (uiElements.splashScreen) uiElements.splashScreen.style.display = 'none';
        if (uiElements.mainContainer) uiElements.mainContainer.style.display = 'flex';
    }
}

// جلب البيانات تليجرام 
async function fetchUserDataFromTelegram() {
    const telegramApp = window.Telegram.WebApp;
    telegramApp.ready();

    // جلب بيانات المستخدم من Telegram
    const userTelegramId = telegramApp.initDataUnsafe.user?.id;
    const userTelegramName = telegramApp.initDataUnsafe.user?.username || `user_${userTelegramId}`;
    const isPremium = telegramApp.initDataUnsafe.user?.is_premium;

    if (!userTelegramId) {
       throw new Error("Failed to fetch Telegram user ID.");
    }

    // تحديث واجهة المستخدم
    uiElements.userTelegramIdDisplay.innerText = userTelegramId;
    uiElements.userTelegramNameDisplay.innerText = userTelegramName;
    
    // تحديث الرسالة لعرض الاسم فقط مع إضافة النقاط
    const userNameElement = document.getElementById("userName");

    if (userNameElement) {
      const maxLength = 4; // تحديد طول الاسم الذي تريد عرضه قبل النقاط
      const truncatedName = userTelegramName.length > maxLength ? userTelegramName.slice(0, maxLength) + "..." : userTelegramName;
      userNameElement.innerText = truncatedName;
    }
    
    // تحديث حالة الحساب (Premium)
    const premiumStatusElement = document.getElementById('userPremiumStatus');
    if (premiumStatusElement) {
        premiumStatusElement.innerHTML = isPremium
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-circle-dashed-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" /><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" /><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" /><path d="M8.56 20.31a9 9 0 0 0 3.44 .69" /><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" /><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" /><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" /><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" /><path d="M9 12l2 2l4 -4" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="Error-mark"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
    }

    
    // تحقق من المستخدم في قاعدة البيانات، سجل إذا لم يكن موجودًا
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', userTelegramId)
        .maybeSingle(); 

    if (error) {
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data');
    }

    if (data) {
        // المستخدم مسجل مسبقاً
        gameState = { ...gameState, ...data };
        saveGameState();
        loadFriendsList(); // تحميل قائمة الأصدقاء بعد جلب البيانات
    } else {
        // تسجيل مستخدم جديد
        await registerNewUser(userTelegramId, userTelegramName);
    }
}

// تسجيل مستخدم جديد في قاعدة البيانات
async function registerNewUser(userTelegramId, userTelegramName) {
    const { error } = await supabase
        .from('users')
        .insert([{ telegram_id: userTelegramId, username: userTelegramName, balance: gameState.balance }]);
    if (error) {
        console.error('Error inserting new user:', error);
        throw new Error('Failed to register new user');
   
     }
  }



function updateUI() {
    // تنسيق الرصيد: استخدام toLocaleString مع الفواصل المناسبة
    let formattedBalance = gameState.balance.toLocaleString("en-US", {
        minimumFractionDigits: 0,  // لا نريد عرض الفواصل العشرية إذا لم تكن ضرورية
        maximumFractionDigits: 0   // نفس الشيء هنا لإزالة الأصفار غير الضرورية
    });

    // تحديد الجزء الرئيسي والجزء الباقي بناءً على الحجم
    let mainDigits, remainingDigits;

    if (gameState.balance >= 1_000_000_000) {
        // مليارات: الرقم الأول كبير
        mainDigits = formattedBalance.split(",")[0]; // الرقم الأول فقط
        remainingDigits = formattedBalance.slice(mainDigits.length); // باقي الأرقام
    } else if (gameState.balance >= 1_000_000) {
        // ملايين: الرقم الأول أو أول رقمين كبير
        mainDigits = formattedBalance.split(",")[0]; // الرقم الأول فقط
        remainingDigits = formattedBalance.slice(mainDigits.length); // باقي الأرقام
    } else if (gameState.balance >= 1_000) {
        // آلاف: أول 3 أرقام كبيرة
        mainDigits = formattedBalance.split(",")[0]; // أول 3 أرقام
        remainingDigits = formattedBalance.slice(mainDigits.length); // باقي الأرقام
    } else {
        // أقل من ألف: الرقم بالكامل
        mainDigits = formattedBalance;
        remainingDigits = "";
    }

    // تحديث DOM
    const mainDigitsElement = document.getElementById("mainDigits");
    const remainingDigitsElement = document.getElementById("remainingDigits");

    if (mainDigitsElement && remainingDigitsElement) {
        mainDigitsElement.textContent = mainDigits;
        remainingDigitsElement.textContent = remainingDigits;
    }

    // تحديث باقي عناصر الرصيد في الواجهة
    const balanceElements = [
        uiElements.walletBalanceDisplay,
        uiElements.accountBalanceDisplay,
        uiElements.taskBalanceDisplay,
        uiElements.puzzleBalanceDisplay,
        uiElements.settingsBalanceDisplay,
        uiElements.boostBalanceDisplay,
        uiElements.lvlBalanceDisplay,
        uiElements.leaderboardnavbarBalanceDisplay,
        uiElements.gnavbarBalanceDisplay,
        uiElements.miningBalanceDisplay
    ];

     balanceElements.forEach(element => {
        if (element) {
            element.innerText = formattedBalance;
        }
    });

    // تحديث مضاعف النقرة
    if (uiElements.clickMultiplierDisplay) {
        uiElements.clickMultiplierDisplay.innerText = gameState.clickMultiplier;
    }

    // تحديث مستوى التعزيز
    if (uiElements.boostLevelDisplay) {
        uiElements.boostLevelDisplay.innerText = gameState.boostLevel;
    }

    // حفظ حالة اللعبة محليًا
    saveGameState();
    // تحديث شاشات التحسينات والمستويات
    updateBoostsDisplay();
    // إرسال البيانات الجديدة إلى قاعدة البيانات
    updateGameStateInDatabase({
        balance: gameState.balance,
    });
}


function formatNumber(value) {
    if (value >= 1_000_000_000_000) {
        return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`; // الملايين
    } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(2)}K`; // الآلاف
    } else {
        return value.toLocaleString();
    }
}

// تسجيل الأحداث للمستخدم
function registerEventHandlers() {
    if (uiElements.clickableImg) {
        uiElements.clickableImg.addEventListener('pointerdown', handleSingleTouch);
    }

    if (uiElements.navButtons) {
        uiElements.navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetScreen = button.getAttribute('data-target');
                navigateToScreen(targetScreen);
            });
        });
    }

    if (uiElements.levelFloatingBtn) {
        uiElements.levelFloatingBtn.addEventListener('click', () => {
            navigateToScreen('levelPage');
            if (uiElements.levelInfoDisplay) {
                uiElements.levelInfoDisplay.innerText = `Lvl number : ${gameState.currentLevel}`;
            }
            if (uiElements.displayedLevel) {
                uiElements.displayedLevel.innerText = gameState.currentLevel;
            }
        });
    }

    if (uiElements.confirmUpgradeBtn) {
        uiElements.confirmUpgradeBtn.addEventListener('click', confirmUpgradeAction);
    }

    if (uiElements.cancelUpgradeBtn) {
        uiElements.cancelUpgradeBtn.addEventListener('click', () => {
            if (uiElements.upgradeModal) uiElements.upgradeModal.style.display = 'none';
        });
    }

    if (uiElements.fillEnergyBtn) {
        uiElements.fillEnergyBtn.addEventListener('click', fillEnergyAction);
    }
    
    if (uiElements.fillEnergyUpgradeBtn) {
        uiElements.fillEnergyUpgradeBtn.addEventListener('click', () => {
            showUpgradeModal('energy');
        });
    }


    if (uiElements.confirmWithdrawalBtn) {
        uiElements.confirmWithdrawalBtn.addEventListener('click', () => {
            showNotification(uiElements.purchaseNotification, 'Coming Soon!');
        });
    }

    if (uiElements.languageBtn) {
        uiElements.languageBtn.addEventListener('click', () => {
            showNotification(uiElements.purchaseNotification, 'Language switch coming soon!');
        });
    }

    if (uiElements.inviteFriendsBtn) {
        uiElements.inviteFriendsBtn.addEventListener('click', () => {
            openTelegramChat();
        });
    }

    if (uiElements.copyInviteLinkBtn) {
        uiElements.copyInviteLinkBtn.addEventListener('click', copyInviteLink);
    }

    if (uiElements.maxWithdrawBtn) {
        uiElements.maxWithdrawBtn.addEventListener('click', () => {
            if (uiElements.withdrawAmountInput) {
                uiElements.withdrawAmountInput.value = gameState.balance;
            }
        });
    }
}

//////////////////////////


// عرض الإشعارات للمستخدم
function showNotification(notificationElement, message) {
    if (!notificationElement) return;
    notificationElement.innerText = message;
    notificationElement.classList.add('show');
    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 4000);
}

function showNotificationWithStatus(notificationElement, message, status = '') {
    if (!notificationElement) return;

    // مسح الفئات السابقة للفوز أو الخسارة أو الخطأ أو الرسالة
    notificationElement.classList.remove('win', 'lose', 'error', 'message');

    // إعداد رابط الصورة بناءً على الحالة
    let imageUrl = '';
    if (status === 'win') {
        notificationElement.classList.add('win');
        imageUrl = 'i/done.png'; // رابط الصورة لحالة الفوز

        // إضافة صورة الفرقعة للاحتفال
        showConfettiEffect();
    } else if (status === 'lose') {
        notificationElement.classList.add('lose');
        imageUrl = 'i/mistake.png'; // رابط الصورة لحالة الخسارة
    } else if (status === 'error') {
        notificationElement.classList.add('error');
        imageUrl = 'i/error.png'; // رابط الصورة لحالة الخطأ
    } else if (status === 'message') {
        notificationElement.classList.add('message');
        imageUrl = 'i/message.png'; // رابط الصورة للإشعار العادي
    }

    // إضافة الصورة مع الرسالة باستخدام innerHTML
    notificationElement.innerHTML = `<img src="${imageUrl}" class="notification-image" alt=""> ${message}`;

    // إظهار الإشعار
    notificationElement.classList.add('show');

    // إخفاء الإشعار بعد 4 ثوانٍ
    setTimeout(() => {
        notificationElement.classList.remove('show');
        hideConfettiEffect(); // إزالة تأثير الاحتفال بعد انتهاء الإشعار
    }, 4000);
}

// دالة لإظهار صورة الفرقعة
function showConfettiEffect() {
    // إنشاء العنصر للصورة
    const confetti = document.createElement('img');
    confetti.src = 'i/confetti.webp';
    confetti.className = 'confetti-effect';
    document.body.appendChild(confetti);
}

// دالة لإخفاء صورة الفرقعة
function hideConfettiEffect() {
    const confetti = document.querySelector('.confetti-effect');
    if (confetti) {
        confetti.remove();
    }
}



/////////////////////////////////////////


    // تحديد العناصر
const vibrationToggle = document.getElementById('vibrationToggle');
const vibrationText = document.getElementById('vibrationText');

// الحالة الافتراضية
let isVibrationEnabled = JSON.parse(localStorage.getItem('vibrationEnabled')) ?? true; 

// تحديث مظهر الزر
updateVibrationButton();

// التعامل مع الضغط على الزر لتغيير الحالة
vibrationToggle.addEventListener('click', () => {
    isVibrationEnabled = !isVibrationEnabled; // تبديل الحالة
    localStorage.setItem('vibrationEnabled', JSON.stringify(isVibrationEnabled)); // حفظ الحالة
    updateVibrationButton(); // تحديث المظهر
});

// تحديث النص ومظهر الزر
function updateVibrationButton() {
    if (isVibrationEnabled) {
        vibrationText.textContent = 'Vibration : On';
        vibrationToggle.classList.remove('inactive');
        vibrationToggle.classList.add('active');
    } else {
        vibrationText.textContent = 'Vibration : Off';
        vibrationToggle.classList.remove('active');
        vibrationToggle.classList.add('inactive');
    }
}


/////////////////////////////////////////


// استدعاء الصورة القابلة للنقر
const img = document.getElementById('clickableImg');
let localClickBalance = 0; // رصيد النقرات المحلي
let localEnergyConsumed = 0; // الطاقة المستهلكة محليًا
let lastDatabaseUpdateTime = Date.now(); // وقت آخر تحديث لقاعدة البيانات
const updateInterval = 30000; // الفاصل الزمني للتحديث (30 ثانية)
let isUpdatingDatabase = false; // منع التحديث المتكرر للبيانات

// تحميل البيانات المحلية عند بدء التطبيق
function loadLocalData() {
    const storedClicks = localStorage.getItem('clickBalance');
    const storedEnergy = localStorage.getItem('energyConsumed');
    localClickBalance = storedClicks ? parseInt(storedClicks, 10) : 0;
    localEnergyConsumed = storedEnergy ? parseInt(storedEnergy, 10) : 0;

    updateClickBalanceUI();
    updateEnergyUI();
}

// تحديث واجهة المستخدم لعرض رصيد النقرات
function updateClickBalanceUI() {
    const clickCountDisplay = document.getElementById('clickCountDisplay');
    if (clickCountDisplay) {
        clickCountDisplay.innerText = `${localClickBalance.toLocaleString()} $SAW`;
    }
}

// تحديث واجهة المستخدم لشريط الطاقة الدائري
function updateEnergyUI() {
    const energyBar = document.getElementById('energyBar'); // دائرة شريط الطاقة
    const energyInfo = document.getElementById('energyInfo'); // معلومات الطاقة

    const currentEnergy = gameState.maxEnergy - localEnergyConsumed;

    if (energyBar) {
        const radius = energyBar.r.baseVal.value; // نصف قطر الدائرة
        const circumference = 2 * Math.PI * radius; // محيط الدائرة
        const progress = (currentEnergy / gameState.maxEnergy) * circumference;

        energyBar.style.strokeDasharray = `${circumference}`; // إعداد المحيط الكلي
        energyBar.style.strokeDashoffset = `${circumference - progress}`; // الإزاحة حسب الطاقة المتبقية
    }

     if (energyInfo) {
      energyInfo.innerText = `${formatNumber(currentEnergy)}/${formatNumber(gameState.maxEnergy)}`;
   }
}

// التعامل مع النقر
img.addEventListener('pointerdown', (event) => {
   // event.preventDefault();
    handleSingleTouch(event);

    // تطبيق تأثير الإمالة
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -14;
    const rotateY = ((x / rect.width) - 0.5) * 14;
    img.style.transition = 'transform 0.1s ease-out';
    img.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    setTimeout(() => {
        img.style.transform = 'perspective(700px) rotateX(0) rotateY(0)';
    }, 300);
});


function handleSingleTouch(event) {
    event.preventDefault();

    if (event.touches && event.touches.length > 1) {
        console.warn('Multiple touch points detected. Ignoring extra touches.');
        return;
    }

    const clickValue = gameState.clickMultiplier || 1;
    const requiredEnergy = clickValue;
    const currentEnergy = gameState.maxEnergy - localEnergyConsumed;

    if (currentEnergy < requiredEnergy) {
        showNotification(uiElements.purchaseNotification, 'Not enough energy!');
        return;
    }

    localClickBalance += clickValue;
    localEnergyConsumed += requiredEnergy;

    localStorage.setItem('clickBalance', localClickBalance);
    localStorage.setItem('energyConsumed', localEnergyConsumed);

    updateClickBalanceUI();
    updateEnergyUI();
    createDiamondCoinEffect(event.pageX, event.pageY);

    if (isVibrationEnabled && navigator.vibrate) {
        navigator.vibrate(80);
    }

    // تحديث قاعدة البيانات بناءً على الوقت
    const currentTime = Date.now();
    if (currentTime - lastDatabaseUpdateTime >= updateInterval && !isUpdatingDatabase) {
        updateEnergyInDatabase();
        lastDatabaseUpdateTime = currentTime; // تحديث وقت آخر تحديث
    }
}


function createDiamondCoinEffect(x, y) {
    const diamondText = document.createElement('div');
    diamondText.classList.add('diamond-text');
    diamondText.textContent = `+${gameState.clickMultiplier}`;
    document.body.appendChild(diamondText);

    // وضع التأثير في مكان النقرة
    diamondText.style.left = `${x}px`;
    diamondText.style.top = `${y}px`;

    // تحريك النص نحو عرض الرصيد
    const balanceRect = uiElements.balanceDisplay.getBoundingClientRect();
    setTimeout(() => {
        diamondText.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
        diamondText.style.transform = `translate(${balanceRect.left - x}px, ${balanceRect.top - y}px) scale(0.5)`;
        diamondText.style.opacity = '0';
        setTimeout(() => diamondText.remove(), 800);
    }, 50);
}


async function updateEnergyInDatabase() {
    isUpdatingDatabase = true;

    try {
        const currentEnergy = gameState.maxEnergy - localEnergyConsumed;
        await updateGameStateInDatabase({ energy: currentEnergy });
        localEnergyConsumed = 0; // إعادة تعيين الطاقة المستهلكة
        localStorage.setItem('energyConsumed', localEnergyConsumed);
        console.log('Energy updated in database successfully.');
    } catch (error) {
        console.error('Error updating energy in database:', error);
    } finally {
        isUpdatingDatabase = false;
    }
}


// التعامل مع زر المطالبة
async function handleClaim() {
    if (localClickBalance === 0) {
        showNotification(uiElements.purchaseNotification, 'No clicks to claim.');
        return;
    }

    const totalReward = localClickBalance;

    try {
        await updateGameStateInDatabase({
            balance: gameState.balance + totalReward,
        });

        gameState.balance += totalReward;
        localClickBalance = 0;
        localStorage.setItem('clickBalance', localClickBalance);

        updateUI();
        updateClickBalanceUI();

        showNotificationWithStatus(uiElements.purchaseNotification, `You claimed ${totalReward} coins!`, 'win');
    } catch (error) {
        console.error('Error claiming clicks:', error);
        showNotification(uiElements.purchaseNotification, 'Failed to claim clicks. Try again later.');
    }
}


// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();

    const claimButton = document.getElementById('claimButton');
    if (claimButton) {
        claimButton.addEventListener('click', handleClaim);
    }
});


function startEnergyRecovery() {
    setInterval(() => {
        // حساب الطاقة الحالية بناءً على الطاقة المستهلكة
        const currentEnergy = gameState.maxEnergy - localEnergyConsumed;

        // التحقق إذا كانت الطاقة أقل من الحد الأقصى
        if (currentEnergy < gameState.maxEnergy) {
            // زيادة الطاقة بمقدار 5 إذا لم يتم تجاوز الحد الأقصى
            localEnergyConsumed = Math.max(localEnergyConsumed - 20, 0);

            // تحديث واجهة المستخدم
            updateEnergyUI();

            // تحديث البيانات المحلية
            localStorage.setItem('energyConsumed', localEnergyConsumed);
        }
    }, 5000); // تنفيذ الدالة كل 5 ثوانٍ
}



//////////////////////////////////////////////////



function navigateToScreen(screenId) {
    if (uiElements.contentScreens) {
        uiElements.contentScreens.forEach(screen => {
            screen.classList.remove('active');
        });
    }
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    // دائمًا إظهار القائمة السفلية بغض النظر عن الشاشة
    const footerMenu = document.querySelector('.menu'); // تحديد القائمة السفلية باستخدام الكلاس
    if (footerMenu) {
        footerMenu.style.display = 'flex'; // التأكد من أن القائمة السفلية تظهر دائمًا
    }
}

///////////////////////////////////////



 // تحسين عرض قائمة الأصدقاء مع حد أقصى 10 أصدقاء
async function loadFriendsList() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    if (!userId) {
        console.error("User ID is missing.");
        uiElements.friendsListDisplay.innerHTML = `<li>Error: Unable to load friends list. Please try again later.</li>`;
        return;
    }

    try {
        // جلب قائمة الأصدقاء من قاعدة البيانات
        const { data, error } = await supabase
            .from('users')
            .select('invites') // عمود الدعوات الذي يحتوي على قائمة المعرفات
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error fetching friends list:', error.message);
            uiElements.friendsListDisplay.innerHTML = `<li>Error: Unable to fetch friends at the moment.</li>`;
            return;
        }

        // التأكد من أن الدعوات تحتوي على معرّفات الأصدقاء
        if (data && data.invites && Array.isArray(data.invites) && data.invites.length > 0) {
            uiElements.friendsListDisplay.innerHTML = ''; // مسح القائمة القديمة

            // إزالة المعرّفات المكررة باستخدام Set
            const uniqueInvites = [...new Set(data.invites)];

            // تحديد الحد الأقصى إلى 10 أصدقاء فقط
            const limitedInvites = uniqueInvites.slice(0, 10);

            // جلب بيانات الأصدقاء بما في ذلك الرصيد لكل معرف
            const friendsPromises = limitedInvites.map(async (friendId) => {
                const { data: friendData, error: friendError } = await supabase
                    .from('users')
                    .select('telegram_id, balance')
                    .eq('telegram_id', friendId)
                    .single();

                if (friendError) {
                    console.error(`Error fetching data for friend ${friendId}:`, friendError.message);
                    return null;
                }

                return friendData; // إرجاع البيانات الخاصة بالصديق
            });

            // الانتظار حتى يتم جلب جميع بيانات الأصدقاء
            const friendsData = await Promise.all(friendsPromises);

            // عرض الأصدقاء مع رصيدهم
            friendsData.forEach((friend) => {
                if (friend) {
                    const li = document.createElement('li');
                    li.classList.add('friend-item'); // إضافة الـ CSS

                    // إنشاء عنصر الصورة الافتراضية
                    const img = document.createElement('img');
                    img.src = 'i/users.jpg'; // رابط الصورة الافتراضية
                    img.alt = `${friend.telegram_id} Avatar`;
                    img.classList.add('friend-avatar');

                    // إضافة معرّف الصديق
                    const span = document.createElement('span');
                    span.classList.add('friend-name');
                    span.textContent = `ID : ${friend.telegram_id}`;

                    // إنشاء عنصر لعرض الرصيد
                    const balanceSpan = document.createElement('span');
                    balanceSpan.classList.add('friend-balance');
                    balanceSpan.textContent = `${formatNumber(friend.balance)} $SAW`; // عرض الرصيد

                    // إنشاء div يحتوي على الصورة واسم الصديق
                    const friendInfoDiv = document.createElement('div');
                    friendInfoDiv.classList.add('friend-info');
                    friendInfoDiv.appendChild(img);
                    friendInfoDiv.appendChild(span);

                    // إضافة الصورة واسم الصديق إلى الـ li
                    li.appendChild(friendInfoDiv);

                    // إضافة الرصيد على اليمين
                    li.appendChild(balanceSpan);

                    // إضافة الصديق إلى القائمة
                    uiElements.friendsListDisplay.appendChild(li);
                }
            });

            // تحديث العدد الإجمالي للأصدقاء
            const totalFriendsCount = uniqueInvites.length;
            const invitedCountElement = document.getElementById('invitedCount');
            const settingsInvitedCountElement = document.getElementById('settingsInvitedCount');

            if (invitedCountElement) {
                invitedCountElement.innerText = totalFriendsCount; // عرض العدد الإجمالي للأصدقاء
            }
            if (settingsInvitedCountElement) {
                settingsInvitedCountElement.innerText = totalFriendsCount; // عرض العدد الإجمالي في الإعدادات
            }
        } else {
            uiElements.friendsListDisplay.innerHTML = '<li>No friends invited yet.</li>';

            const invitedCountElement = document.getElementById('invitedCount');
            const settingsInvitedCountElement = document.getElementById('settingsInvitedCount');

            if (invitedCountElement) {
                invitedCountElement.innerText = 0; // إذا لم يكن هناك أصدقاء مدعوون
            }
            if (settingsInvitedCountElement) {
                settingsInvitedCountElement.innerText = 0; // إذا لم يكن هناك أصدقاء مدعوون
            }
        }
    } catch (err) {
        console.error("Unexpected error loading friends list:", err);
        uiElements.friendsListDisplay.innerHTML = `<li>Error: Unexpected issue occurred while loading friends.</li>`;
    }
}


// نسخ رابط الدعوة
function copyInviteLink() {
    const inviteLink = `https://t.me/SAWCOIN_BOT?start=${uiElements.userTelegramIdDisplay?.innerText || ''}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        showNotification(uiElements.copyInviteNotification, 'Invite link copied!');
    }).catch(err => {
        showNotification(uiElements.purchaseNotification, 'Failed to copy invite link.');
    });
}

// مشاركة الدعوة عبر Telegram
function openTelegramChat() {
    const inviteLink = `https://t.me/share/url?text=Join Saw Token Game and earn 5,000 $SAW!&url=https://t.me/SAWCOIN_BOT?start=${uiElements.userTelegramIdDisplay?.innerText || ''}`;
    window.open(inviteLink, '_blank');
}


////////////////////////////////////////////////


document.addEventListener('DOMContentLoaded', () => {
    // تهيئة الإعلانات بعد تحميل الصفحة
    const AdController = window.Adsgram.init({ blockId: "int-6541" });
    const button = document.getElementById('ad');
    const purchaseNotification = uiElements.purchaseNotification; // تأكد من وجود هذا العنصر

    // تحقق من وجود العناصر
    if (!button || !purchaseNotification) {
        console.error('Elements not found');
        return;
    }

    // تعريف المكافأة (مثل 1000 عملة)
    const rewardAmount = 1000;

    button.addEventListener('click', () => {
        AdController.show().then((result) => {
            // المستخدم شاهد الإعلان حتى النهاية أو تفاعل معه
            // مكافأة المستخدم
            rewardUser(rewardAmount);
            showNotificationWithStatus(purchaseNotification, `You got me ${rewardAmount} $SWT for watching the ad`, 'win');
        }).catch((result) => {
            // معالجة الحالة إذا حدثت مشكلة في عرض الإعلان
            console.error('mistake ', result);
            showNotification(purchaseNotification, 'Sorry, an error occurred while viewing');
        });
    });

    // دالة مكافأة المستخدم
    function rewardUser(amount) {
        // إضافة المكافأة إلى رصيد المستخدم (تأكد من دمج هذا مع منطق اللعبة الحالي)
        gameState.balance += amount;

        updateUI();
        saveGameState();
        updateGameStateInDatabase({
            balance: gameState.balance,
        });
    }
});




//////////////////////////////////////


// القائمه السفليه
document.querySelectorAll('button[data-target]').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        document.querySelectorAll('.screen-content').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    });
});

// أولاً: الحصول على جميع الأزرار داخل القائمة
const buttons = document.querySelectorAll('.menu button');

// ثانياً: إضافة مستمع للأحداث (Event Listener) لكل زر بحيث يستمع للنقرات
buttons.forEach(button => {
    button.addEventListener('click', function() {
        // عند النقر على زر، يتم إزالة الصف "active" من جميع الأزرار
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // إضافة الصف "active" للزر الذي تم النقر عليه
        this.classList.add('active');
        
        // الحصول على اسم الصفحة أو القسم المستهدف من الزر الذي تم النقر عليه
        const targetPage = this.getAttribute('data-target');
        
        // عرض القسم المناسب
        document.querySelectorAll('.screen-content').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(targetPage).classList.add('active');
    });
});

// ثالثاً: تفعيل الزر الافتراضي (الصفحة الرئيسية)
window.addEventListener('DOMContentLoaded', () => {
    const defaultButton = document.querySelector('button[data-target="mainPage"]'); // افترض أن الصفحة الرئيسية لها data-target="mainPage"
    if (defaultButton) {
        defaultButton.classList.add('active'); // تفعيل الزر افتراضياً
        const defaultScreen = document.getElementById('mainPage'); // افترض أن الصفحة الرئيسية لها ID="mainPage"
        if (defaultScreen) {
            defaultScreen.classList.add('active'); // عرض الشاشة المرتبطة افتراضياً
        }
    }
});



///////////////////////////////////////////


// المهام 
document.addEventListener('DOMContentLoaded', async () => {
    const taskContainer = document.querySelector('#taskcontainer');
    if (!taskContainer) {
        console.error('Task container element not found.');
        return;
    }

    // جلب المهام المكتملة من قاعدة البيانات
    const userId = uiElements.userTelegramIdDisplay.innerText;
    let completedTasks = [];

    try {
        const { data, error } = await supabase
            .from('users')
            .select('completed_tasks')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error fetching completed tasks:', error);
        } else {
            completedTasks = data?.completed_tasks || [];
        }
    } catch (err) {
        console.error('Unexpected error while fetching completed tasks:', err);
    }

    // جلب قائمة المهام من ملف JSON
    fetch('json/tasks.json')
        .then(response => response.json())
        .then(tasks => {
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.classList.add('task-item');

                // صورة المهمة
                const img = document.createElement('img');
                img.src = task.image;
                img.alt = 'Task Image';
                img.classList.add('task-img');
                taskElement.appendChild(img);

                 // Create a container for description and reward
                const infoContainer = document.createElement('div');
                infoContainer.classList.add('info-task'); // This will hold both description and reward

                // Task Description
                const description = document.createElement('p');
                description.textContent = task.description;
                infoContainer.appendChild(description);

                 // Task Reward without Coin Image
                const rewardContainer = document.createElement('div');
                rewardContainer.classList.add('task-reward-container');
            
                const rewardText = document.createElement('span');
                rewardText.textContent = `+ ${task.reward} $SAW`;
                rewardText.classList.add('task-reward');
                rewardContainer.appendChild(rewardText);

                infoContainer.appendChild(rewardContainer); // Append reward below description

                taskElement.appendChild(infoContainer); // Append the info container to the task element

           
                // زر المهمة
                const button = document.createElement('button');
                 button.classList.add('task-button');
                 button.setAttribute('data-task-id', task.id);
                 button.setAttribute('data-reward', task.reward);

                 // تعيين نص الزر بناءً على حالة المهمة
                 if (completedTasks.includes(task.id)) {
                 // علامة الصح
                 button.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                   <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                 </svg>
                `;
                 button.disabled = true;
             } else {
                // السهم
                 button.innerHTML = `
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="arrow">
                     <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                   </svg>
                 `;
                }

               taskElement.appendChild(button);
               taskContainer.appendChild(taskElement);

                // التعامل مع النقر على الزر
                let taskProgress = 0;

                button.addEventListener('click', () => {
                    if (taskProgress === 0) {
                        showLoading(button);
                        openTaskLink(task.url, () => {
                            taskProgress = 1;
                            hideLoading(button, 'Verify');
                        });
                    } else if (taskProgress === 1) {
                        showLoading(button);
                        setTimeout(() => {
                            taskProgress = 2;
                            hideLoading(button, 'Claim');
                        }, 5000);
                    } else if (taskProgress === 2) {
                        claimTaskReward(task.id, task.reward, button);
                    }
                });
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
});

// استلام المكافأة وتحديث قاعدة البيانات
async function claimTaskReward(taskId, reward, button) {
    try {
        // التحقق إذا كانت المهمة مكتملة مسبقًا
        const userId = uiElements.userTelegramIdDisplay.innerText;
        const { data, error } = await supabase
            .from('users')
            .select('completed_tasks')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error fetching completed tasks:', error);
            return;
        }

        const completedTasks = data?.completed_tasks || [];
        if (completedTasks.includes(taskId)) {
            showNotification(uiElements.purchaseNotification, 'You have already claimed this reward.');
            return;
        }

        // إضافة المكافأة إلى الرصيد
        gameState.balance += reward;
        completedTasks.push(taskId);

        // تحديث واجهة المستخدم
        button.textContent = '✓';
        button.disabled = true;
        updateUI();
        showNotificationWithStatus(uiElements.purchaseNotification, `Successfully claimed ${reward} coins!`, 'win');

        // تحديث قاعدة البيانات
        const updatedData = {
            balance: gameState.balance,
            completed_tasks: completedTasks,
        };

        const { updateError } = await supabase
            .from('users')
            .update(updatedData)
            .eq('telegram_id', userId);

        if (updateError) {
            console.error('Error updating completed tasks:', updateError);
        }
    } catch (error) {
        console.error('Error claiming task reward:', error);
    }
}

// عرض التحميل
function showLoading(button) {
    button.innerHTML = `<span class="loading-spinner"></span>`;
    button.disabled = true;
}

function hideLoading(button, text) {
    button.disabled = false;
    button.innerHTML = text;
}

// فتح رابط المهمة
function openTaskLink(taskurl, callback) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openLink(taskurl, { try_instant_view: true });
        setTimeout(callback, 1000);
    } else {
        window.open(taskurl, '_blank');
        setTimeout(callback, 1000);
    }
}






/////////////////////////////////////


function initializeTelegramIntegration() {
    const telegramApp = window.Telegram.WebApp;

    // التأكد من أن التطبيق جاهز
    telegramApp.ready();

    // تعريف الصفحات
    const mainPageId = "mainPage"; // الصفحة الرئيسية
    const defaultHeaderColor = "#101010"; 
    const mainPages = ["mainPage"]; 

    // تحديث زر الرجوع بناءً على الصفحة الحالية
    function updateBackButton() {
        const currentPage = document.querySelector(".screen-content.active");
        if (currentPage && !mainPages.includes(currentPage.id)) {
            telegramApp.BackButton.show(); // إظهار زر الرجوع في الصفحات الفرعية
        } else {
            telegramApp.BackButton.hide(); // إخفاء زر الرجوع في الصفحات الرئيسية
        }
    }

    // تحديث الزر النشط بناءً على الصفحة النشطة
    function updateActiveButton(targetPageId) {
        document.querySelectorAll(".menu button").forEach(btn => {
            const target = btn.getAttribute("data-target");
            btn.classList.toggle("active", target === targetPageId);
        });
    }

    // تحديث لون الهيدر بناءً على الصفحة
     function updateHeaderColor() {
          telegramApp.setHeaderColor(defaultHeaderColor); // اللون الافتراضي لجميع الصفحات
    }

    // التنقل إلى صفحة معينة
    function navigateToPage(targetPageId) {
        // إزالة الصفحة النشطة الحالية
        document.querySelectorAll(".screen-content").forEach(page => page.classList.remove("active"));

        // تفعيل الصفحة المستهدفة
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            targetPage.classList.add("active");
        }

        // تحديث زر الرجوع والزر النشط ولون الهيدر
        updateBackButton();
        updateActiveButton(targetPageId);
        updateHeaderColor(); // تأكد من تحديث الهيدر بعد التفعيل
    }

    // تفعيل حدث زر الرجوع الخاص بـ Telegram
    telegramApp.BackButton.onClick(() => {
        const currentPage = document.querySelector(".screen-content.active");
        if (currentPage && !mainPages.includes(currentPage.id)) {
            navigateToPage(mainPageId); // العودة دائمًا إلى الصفحة الرئيسية من الصفحات الفرعية
        } else {
            telegramApp.close(); // إغلاق WebApp إذا كنت في الصفحة الرئيسية
        }
    });

    // إعداد التنقل بين الأقسام
    document.querySelectorAll("button[data-target]").forEach(button => {
        button.addEventListener("click", () => {
            const targetPageId = button.getAttribute("data-target");

            // تحديث التنقل
            navigateToPage(targetPageId);

            // تحديث سجل التنقل
            if (mainPages.includes(targetPageId)) {
                history.replaceState({ target: targetPageId }, "", `#${targetPageId}`);
            } else {
                history.pushState({ target: targetPageId }, "", `#${targetPageId}`);
            }
        });
    });

    // إدارة التنقل عند استخدام زر الرجوع في المتصفح
    window.addEventListener("popstate", (event) => {
        const targetPageId = event.state ? event.state.target : mainPageId;
        navigateToPage(targetPageId);
    });

    // فتح الصفحة الرئيسية عند تحميل التطبيق
    window.addEventListener("load", () => {
        const hash = window.location.hash.substring(1) || mainPageId;
        navigateToPage(hash);

        // تحديث لون الهيدر عند التحميل
        updateHeaderColor();

        // تحديث سجل التنقل
        history.replaceState({ target: hash }, "", `#${hash}`);
    });
}

// استدعاء التهيئة عند تحميل الصفحة
window.addEventListener("load", initializeTelegramIntegration); 
window.Telegram.WebApp.setHeaderColor('#101010');


///////////////////////////////


// تعريف عناصر DOM
const puzzlecloseModal = document.getElementById('puzzlecloseModal');
const puzzleCountdown = document.getElementById('puzzleCountdown');
const puzzleContainer = document.getElementById('puzzleContainer');
const openPuzzleBtn = document.getElementById('puzzle1');
const puzzleQuestion = document.getElementById('puzzleQuestion');
const puzzleOptions = document.getElementById('puzzleOptions');
const puzzleNotification = document.getElementById('puzzleNotification');
const puzzleHint = document.getElementById('puzzleHint');
const timerDisplay = document.getElementById('timer');
const remainingAttemptsDisplay = document.getElementById('attemptsDisplay');
const puzzleRewardDisplay = document.getElementById('puzzleRewardDisplay');

// تعريف حالة اللعبة
let currentPuzzle;
let attempts = 0;
let puzzleSolved = false;
let countdownInterval;
const maxAttempts = 3; 
const countdownDuration = 24 * 60 * 60 * 1000; 

// تحميل الأحاجي من ملف JSON
async function loadPuzzles() {
    try {
        const response = await fetch('json/puzzles.json');
        if (!response.ok) throw new Error('Failed to load puzzles');
        const data = await response.json();
        return data.puzzles;
    } catch (error) {
        console.error(error);
        showNotificationWithStatus(puzzleNotification, 'Error loading puzzle. Please try again later.', 'lose');
    }
}

// اختيار أحجية اليوم بناءً على التاريخ
function getTodaysPuzzle(puzzles) {
    const today = new Date().toDateString();
    return puzzles.find(p => new Date(p.availableDate).toDateString() === today);
}


// عرض مؤقت العد التنازلي في العنصر المخصص
function startCountdownOnButton(seconds) {
    openPuzzleBtn.disabled = true;

    // عرض العد التنازلي في العنصر puzzleCountdown
    const countdownDisplay = document.getElementById('puzzleCountdown');
    countdownDisplay.innerText = ` ${formatTime(seconds)}`;

    // استهداف العنصر المحدد فقط باستخدام الـ ID
    const puzzleItem = document.getElementById('puzzle1'); // استهداف العنصر حسب ID
    puzzleItem.classList.add('inactive'); // إضافة الفئة "inactive" لتفعيل تأثير الضباب والتوهج

    function updateCountdown() {
        if (seconds > 0) {
            seconds--;
            countdownDisplay.innerText = ` ${formatTime(seconds)}`;
            setTimeout(updateCountdown, 1000);
        } else {
            // عند انتهاء الوقت، إزالة التأثيرات
            countdownDisplay.innerText = 'Puzzle available now!';

            // إزالة الفئة "inactive" وإضافة الفئة "active"
            puzzleItem.classList.remove('inactive'); // إزالة الفئة "inactive"
            puzzleItem.classList.add('active'); // إضافة الفئة "active"

            openPuzzleBtn.disabled = false;
            openPuzzleBtn.innerText = 'Open Puzzle';
        }
    }

    updateCountdown();
}

// صياغة الوقت (الساعات:الدقائق:الثواني)
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


// عرض أحجية اليوم إذا كانت متاحة
async function displayTodaysPuzzle() {
    const puzzles = await loadPuzzles();
    currentPuzzle = getTodaysPuzzle(puzzles);
    const userTelegramId = uiElements.userTelegramIdDisplay.innerText;

    // جلب تقدم المستخدم من قاعدة البيانات
    const { data, error } = await supabase
        .from('users')
        .select('puzzles_progress')
        .eq('telegram_id', userTelegramId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching puzzle progress:', error);
        showNotification(puzzleNotification, 'Error loading puzzle progress. Please try again later.');
        return;
    }

    const puzzlesProgress = data?.puzzles_progress || {};
    const puzzleProgress = puzzlesProgress[currentPuzzle.id];

    // التحقق من انتهاء العد التنازلي لمدة 24 ساعة من قاعدة البيانات
    const lastSolvedTime = puzzleProgress?.last_solved_time;
    if (lastSolvedTime) {
        const timeElapsed = Date.now() - new Date(lastSolvedTime).getTime();
        if (timeElapsed < countdownDuration) {
            const remainingSeconds = Math.floor((countdownDuration - timeElapsed) / 1000);
            startCountdownOnButton(remainingSeconds);
            return;
        }
    }

    // عرض السؤال والتلميح والمكافأة
    puzzleQuestion.innerText = currentPuzzle.question;
    puzzleHint.innerText = `Hint : ${currentPuzzle.hint}`;
    puzzleRewardDisplay.innerText = `Reward ${currentPuzzle.reward} $SAW`;

    // عرض الخيارات كأزرار
    const optionsHtml = currentPuzzle.options.map(option => `<button class="option-btn">${option}</button>`).join('');
    puzzleOptions.innerHTML = optionsHtml;

    puzzleContainer.classList.remove('hidden');
    updateRemainingAttempts(puzzleProgress?.attempts || 0);
    startCountdown();
}

// تشغيل المؤقت
function startCountdown() {
    let timeLeft = 60.00;
    timerDisplay.innerText = timeLeft.toFixed(2);

    countdownInterval = setInterval(() => {
        timeLeft -= 0.01;
        timerDisplay.innerText = timeLeft.toFixed(2);

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            handlePuzzleTimeout();
        }
    }, 10);
}

// التعامل مع انتهاء الوقت
function handlePuzzleTimeout() {
    clearInterval(countdownInterval);
    showNotification(puzzleNotification, "Time's up! You failed to solve the puzzle.");
    updatePuzzleProgressInDatabase(currentPuzzle.id, false, maxAttempts); // تحديث التقدم
    startCountdownOnButton(24 * 60 * 60); // بدء العد التنازلي لعرض أحجية اليوم التالي
    closePuzzle();
}

// التحقق من إجابة المستخدم
function checkPuzzleAnswer(selectedOption) {
    const userAnswer = selectedOption.innerText.trim();

    if (attempts >= maxAttempts || puzzleSolved) {
        showNotification(puzzleNotification, 'You have already solved or failed today\'s puzzle.');
        return;
    }

    if (userAnswer === currentPuzzle.answer) {
        handlePuzzleSuccess();
    } else {
        handlePuzzleWrongAnswer();
    }
}

// التعامل مع الإجابة الصحيحة
function handlePuzzleSuccess() {
    clearInterval(countdownInterval);

    const puzzleReward = currentPuzzle.reward;
    showNotificationWithStatus(puzzleNotification, `Correct! You've earned ${puzzleReward} coins.`, 'win');
    updateBalance(puzzleReward);
    updatePuzzleProgressInDatabase(currentPuzzle.id, true, attempts); // تحديث التقدم في قاعدة البيانات
    
    puzzleSolved = true;
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
    startCountdownOnButton(24 * 60 * 60); // بدء العد التنازلي لعرض أحجية اليوم التالي
}

// التعامل مع الإجابة الخاطئة
function handlePuzzleWrongAnswer() {
    attempts++;
    updateRemainingAttempts(attempts);

    if (attempts === maxAttempts) {
        clearInterval(countdownInterval);
        showNotification(puzzleNotification, 'You have used all attempts. 500 $SWT have been deducted.');
        updatePuzzleProgressInDatabase(currentPuzzle.id, false, maxAttempts); // تسجيل المحاولة الفاشلة
        startCountdownOnButton(24 * 60 * 60); // بدء العد التنازلي
        closePuzzle();
    } else {
        showNotification(puzzleNotification, `Wrong answer. You have ${maxAttempts - attempts} attempts remaining.`);
    }
}

// تحديث تقدم الأحجية في قاعدة البيانات
async function updatePuzzleProgressInDatabase(puzzleId, solved, attempts) {
    const userTelegramId = uiElements.userTelegramIdDisplay.innerText;

    // جلب التقدم الحالي للمستخدم من قاعدة البيانات
    const { data, error } = await supabase
        .from('users')
        .select('puzzles_progress')
        .eq('telegram_id', userTelegramId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching puzzle progress:', error);
        return;
    }

    let puzzlesProgress = data?.puzzles_progress || {};

    // تحديث أو إضافة تقدم الأحجية الحالية
    puzzlesProgress[puzzleId] = {
        solved: solved,
        attempts: attempts,
        last_solved_time: solved ? new Date().toISOString() : null // تحديث وقت الحل الأخير
    };

    // تحديث البيانات في قاعدة البيانات
    const { updateError } = await supabase
        .from('users')
        .update({ puzzles_progress: puzzlesProgress })
        .eq('telegram_id', userTelegramId);

    if (updateError) {
        console.error('Error updating puzzle progress:', updateError);
    }
}

// تحديث عرض المحاولات المتبقية
function updateRemainingAttempts(attempts = 0) {
    remainingAttemptsDisplay.innerText = `${maxAttempts - attempts}/${maxAttempts}`;
}

// تحديث الرصيد
function updateBalance(amount) {
    gameState.balance += amount;
    updateUI(); // تحديث الواجهة
    saveGameState(); // حفظ حالة اللعبة
}

// إغلاق الأحجية
function closePuzzle() {
    clearInterval(countdownInterval); // إيقاف المؤقت عند الإغلاق
    puzzleContainer.classList.add('hidden');
    puzzleOptions.innerHTML = '';
    puzzleNotification.innerText = '';
    attempts = 0;
    puzzleSolved = false;
}

// مستمعات الأحداث
puzzleOptions.addEventListener('click', function (event) {
    if (event.target.classList.contains('option-btn')) {
        checkPuzzleAnswer(event.target);
    }
});
openPuzzleBtn.addEventListener('click', displayTodaysPuzzle);

document.getElementById('puzzlecloseModal').addEventListener('click', function() {
    document.getElementById('puzzleContainer').classList.add('hidden');
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('puzzle1').addEventListener('click', function() {
    document.getElementById('puzzleContainer').classList.remove('hidden');
    document.getElementById('overlay').style.display = 'block';
});



/////////////////////////////////////////////////


const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://sawcoin.vercel.app/json/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function connectToWallet() {
    const connectedWallet = await tonConnectUI.connectWallet();
    // يمكنك تنفيذ بعض العمليات باستخدام connectedWallet إذا لزم الأمر
    console.log(connectedWallet);
}

tonConnectUI.uiOptions = {
    twaReturnUrl: 'https://t.me/SAWCOIN_BOT/GAME'
};



/////////////////////////////////////////


// تحديثات الإعدادات

function updateAccountSummary() {
  // تحديث العناصر الأساسية
  const invitedCountElement = document.getElementById('invitedCount');

  // تحديث النسخ داخل لوحة الإعدادات
  const settingsInvitedCount = document.getElementById('settingsInvitedCount');

  if (invitedCountElement) invitedCountElement.innerText = gameState.invites.length;

  // تحديث النسخ في لوحة الإعدادات
  if (settingsInvitedCount) settingsInvitedCount.innerText = gameState.invites.length;
}

document.addEventListener('DOMContentLoaded', () => {
  loadGameState();
  updateAccountSummary();
});

///////////////////////////////////////////


function showContent(contentId) {
    // Hide all content sections
    document.getElementById('tasksContent').style.display = 'none';
    document.getElementById('gamesContent').style.display = 'none';

    // Remove active class from all switch buttons
    document.getElementById('tasksContentButton').classList.remove('active');
    document.getElementById('gamesContentButton').classList.remove('active');

    // Show selected content and add active class to corresponding button
    document.getElementById(contentId).style.display = 'block';
    if (contentId === 'tasksContent') {
        document.getElementById('tasksContentButton').classList.add('active');
    } else {
        document.getElementById('gamesContentButton').classList.add('active');
    }
}

///////////////////////////////////////



 document.getElementById('applyPromoCode')?.addEventListener('click', async () => {
    const applyButton = document.getElementById('applyPromoCode');
    const promoCodeInput = document.getElementById('promoCodeInput');
    if (!applyButton || !promoCodeInput) return;

    const enteredCode = promoCodeInput.value.trim();
    const AdController = window.Adsgram.init({ blockId: "int-6541" });

    // إخفاء نص الزر وعرض دائرة التحميل
    applyButton.innerHTML = '';
    applyButton.classList.add('loading');

    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    applyButton.appendChild(spinner);

    try {
        // تحميل البرومو كود من ملف JSON
        const response = await fetch('json/promocodes.json').catch(err => {
            console.error('Error loading promo codes:', err);
            return null;
        });
        if (!response) return;

        const promoData = await response.json();
        const promoCodes = promoData.promoCodes;

        // تحقق مما إذا كان البرومو كود مستخدمًا مسبقًا
        const alreadyUsed = checkIfPromoCodeUsed(enteredCode);

        if (alreadyUsed) {
            applyButton.innerHTML = '‼️';
            showNotification(uiElements.purchaseNotification, 'You have already used this promo code.');

            // عرض الإعلان
            showAd(AdController);

            setTimeout(() => {
                resetButton(applyButton, spinner);
            }, 3000);
            return;
        }

        if (promoCodes[enteredCode]) {
         const reward = promoCodes[enteredCode];

         // إضافة المكافأة لرصيد المستخدم
         gameState.balance += reward;
   
         // تحديث واجهة المستخدم
        updateUI();

       // حفظ الكود ككود مستخدم
        addPromoCodeToUsed(enteredCode);

        applyButton.innerHTML = '✔️';
         showNotificationWithStatus(uiElements.purchaseNotification, `Successfully added ${reward} $SAW to your balance!`, 'win');

         // عرض الإعلان
         showAd(AdController);

         // حفظ الحالة الحالية
         saveGameState();
         localStorage.setItem('balance', gameState.balance);

         // إغلاق نافذة البرومو كود
        closePromoModal();
    } else {
       applyButton.innerHTML = '❌';
       showNotification(uiElements.purchaseNotification, 'Invalid promo code.');

       // عرض الإعلان
       showAd(AdController);

       // إغلاق نافذة البرومو كود
       closePromoModal();
      }
    } catch (error) {
        console.error('Error processing promo code:', error);
        applyButton.innerHTML = 'Error';
    } finally {
        // مسح محتوى خانة الإدخال وإعادة النص العادي للزر بعد 3 ثوانٍ
        promoCodeInput.value = '';
        setTimeout(() => {
            resetButton(applyButton, spinner);
        }, 3000);
    }
});

// دالة للتحقق مما إذا كان البرومو كود مستخدمًا مسبقًا
function checkIfPromoCodeUsed(enteredCode) {
    const usedPromoCodes = JSON.parse(localStorage.getItem('usedPromoCodes')) || [];
    return usedPromoCodes.includes(enteredCode);
}

// دالة لإضافة البرومو كود إلى الأكواد المستخدمة
function addPromoCodeToUsed(enteredCode) {
    const usedPromoCodes = JSON.parse(localStorage.getItem('usedPromoCodes')) || [];
    if (!usedPromoCodes.includes(enteredCode)) {
        usedPromoCodes.push(enteredCode);
        localStorage.setItem('usedPromoCodes', JSON.stringify(usedPromoCodes));
    }
}

// دالة لعرض الإعلان
function showAd(adController) {
    setTimeout(() => {
        adController.show().then(() => {
            console.log("Ad viewed successfully");
        }).catch(err => {
            console.error("Error showing ad:", err);
        });
    }, 2000);
}

// دالة لإعادة تعيين الزر
function resetButton(button, spinner) {
    button.innerHTML = 'Apply';
    button.classList.remove('loading');
    spinner.remove();
}

// عند الضغط على زر برومو كود
document.getElementById('promocodeBtu').addEventListener('click', function () {
    document.getElementById('promoContainer').classList.remove('hidden');
    document.getElementById('promocodeoverlay').style.display = 'block'; // إظهار الشفافية
});

// إغلاق نافذة البرومو كود عند النقر على زر الإغلاق
document.getElementById('promocloseModal').addEventListener('click', () => {
    closePromoModal();
});

// إغلاق نافذة البرومو كود عند النقر على الشفافية (overlay)
document.getElementById('promocodeoverlay').addEventListener('click', () => {
    closePromoModal();
});

// دالة لإغلاق نافذة البرومو كود
function closePromoModal() {
    document.getElementById('promoContainer').classList.add('hidden');
    document.getElementById('promocodeoverlay').style.display = 'none'; // إخفاء الشفافية
}

/////////////////////////////////////////



document.addEventListener('DOMContentLoaded', () => {
    // عناصر DOM الضرورية
    const dailyButton = document.getElementById('daily2');
    const dailyCloseModal = document.getElementById('logindailycloseModal');
    const logindailyContainer = document.getElementById('logindailyContainer');
    const logindailyContent = document.querySelector('.logindaily-content');
    const logindailyOverlay = document.getElementById('logindailyOverlay'); 
    const loginClaimBtn = document.getElementById('loginclaimBtn');
    const loginNotification = document.getElementById('login');
    const dayElements = document.querySelectorAll('.daily-item');
    const rewardImages = document.querySelectorAll('.reward-image'); // صور المكافآت
    const dailyRewards = [100, 500, 2000, 5000, 8000, 15000, 30000, 50000, 100000];

    // الدالة الرئيسية لتسجيل الدخول اليومي
    function handleDailyLogin() {
        try {
            // جلب بيانات المستخدم من LocalStorage
            let localData = JSON.parse(localStorage.getItem('dailyLoginData')) || {};
            let { last_login_date, consecutive_days } = localData;

            consecutive_days = consecutive_days || 0; // تعيين قيمة افتراضية إذا كانت غير موجودة
            const today = new Date().toISOString().split('T')[0];

            // التحقق من حالة تسجيل الدخول اليومي
            if (last_login_date === today) {
                loginNotification.innerText = 'You have already claimed today\'s reward.';
                disableClaimButton();
                highlightRewardedDays(consecutive_days);
                showRewardImage(consecutive_days);
                return;
            }

            // التحقق من استمرارية الأيام المتتالية
            const lastLoginDateObj = new Date(last_login_date);
            const isConsecutive = (new Date(today).getDate() - lastLoginDateObj.getDate()) === 1 &&
                                  new Date(today).getMonth() === lastLoginDateObj.getMonth() &&
                                  new Date(today).getFullYear() === lastLoginDateObj.getFullYear();

            if (isConsecutive) {
                consecutive_days++;
                if (consecutive_days > dailyRewards.length) consecutive_days = dailyRewards.length;
            } else {
                consecutive_days = 1; // إعادة تعيين إلى اليوم الأول
            }

            // إضافة المكافأة
            const reward = dailyRewards[consecutive_days - 1];
            updateBalance(reward);

            // تحديث واجهة المستخدم
            loginNotification.innerText = `Day ${consecutive_days}: You've earned ${reward} $SWT!`;
            updateClaimButton(consecutive_days, reward);
            highlightRewardedDays(consecutive_days);

            // تحديث البيانات في LocalStorage
            localData = { last_login_date: today, consecutive_days };
            localStorage.setItem('dailyLoginData', JSON.stringify(localData));
        } catch (error) {
            console.error('Unexpected error in daily login:', error);
            loginNotification.innerText = 'Error processing your daily login. Please try again later.';
        }
    }

    // تحديث زر المطالبة بالمكافأة
    function updateClaimButton(day, reward) {
        loginClaimBtn.innerText = `day ${day} : ${reward} $S4W`;
        loginClaimBtn.disabled = false;
        loginClaimBtn.classList.remove('disabled');
    }

    // تعطيل الزر بعد المطالبة بالمكافأة
    function disableClaimButton() {
        loginClaimBtn.disabled = true;
        loginClaimBtn.classList.add('disabled');
    }

    // تحديث واجهة الأيام المتتالية
    function highlightRewardedDays(dayCount) {
        dayElements.forEach((el, index) => {
            if (index < dayCount) {
                el.classList.add('claimed');
                el.style.filter = 'blur(2px)';
            } else {
                el.classList.remove('claimed');
                el.style.filter = 'none';
            }
        });
    }
    
    // عرض الصورة الخاصة بكل يوم بعد المطالبة
    function showRewardImage(day) {
        rewardImages.forEach((img, index) => {
            if (index === day - 1) {
                img.src = 'i/done.png'; // تحديث مصدر الصورة
                img.classList.remove('hidden'); // إظهار الصورة
            } else {
                img.classList.add('hidden'); // إخفاء الصور الأخرى
            }
        });
    }

    // تحديث الرصيد
    function updateBalance(amount) {
        gameState.balance += amount;
        updateUI(); // تحديث واجهة المستخدم
        saveGameState(); 
        updateGameStateInDatabase();
    }

    // فتح نافذة تسجيل الدخول اليومي
    function openDailyLoginModal() {
        logindailyContainer.classList.remove('hidden');
        logindailyContent.classList.remove('hidden');
        logindailyOverlay.style.display = 'block'; // تأكد من إظهار الشفافية
        handleDailyLogin();
    }

    // إغلاق نافذة تسجيل الدخول اليومي عند النقر على زر الإغلاق
    dailyCloseModal.addEventListener('click', function () {
        closeDailyLoginModal();
    });

    // إغلاق النافذة عند النقر على الشفافية (overlay)
    logindailyOverlay.addEventListener('click', function () {
        closeDailyLoginModal();
    });

    // الدالة لإغلاق نافذة تسجيل الدخول اليومي
    function closeDailyLoginModal() {
        logindailyContainer.classList.add('hidden');
        logindailyContent.classList.add('hidden');
        logindailyOverlay.style.display = 'none'; // إخفاء الشفافية
    }

    // عند الضغط على زر المطالبة بالمكافأة
    loginClaimBtn.addEventListener('click', function () {
        handleDailyLogin();
        disableClaimButton();
    });

    // فتح النافذة عند دخول المستخدم
    dailyButton.addEventListener('click', function () {
        openDailyLoginModal();
    });
});





///////////////////////////////////////

// إظهار النافذة المنبثقة مع طبقة العتامة
async function showUpgradeModal(upgradeType) {
    if (!uiElements.upgradeModal) return;

    // إظهار النافذة المنبثقة وطبقة العتامة
    uiElements.upgradeModal.style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    uiElements.upgradeModal.setAttribute('data-upgrade-type', upgradeType);

    const upgrades = {
        boost: {
            cost: gameState.boostLevel * 10000 + 10000,
            icon: `
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon-boosts">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
                    <path d="M11 11.5v-2a1.5 1.5 0 0 1 3 0v2.5" />
                    <path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />
                    <path d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />
                    <path d="M5 3l-1 -1" />
                    <path d="M4 7h-1" />
                    <path d="M14 3l1 -1" />
                    <path d="M15 6h1" />
                </svg>
            `,
            title: "Hand Clicks",
            current: `Multiplier : ×${gameState.clickMultiplier}`,
        },
        coin: {
            cost: gameState.coinBoostLevel * 10000 + 10000,
            icon: `
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon-boosts">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
                </svg>
            `,
            title: "Energy Limits",
            current: `Max Coins : ${formatNumber(gameState.maxEnergy)}`,
        },
    };

    const upgrade = upgrades[upgradeType];
    if (!upgrade) return;

    // تحديث محتوى النافذة بناءً على الترقية
    document.getElementById('upgradeIconContainer').innerHTML = upgrade.icon;
    document.getElementById('upgradeTitle').innerText = upgrade.title;
    document.getElementById('currentLevel').innerText = upgrade.current;
    document.getElementById('upgradeCost').innerText = ` ${upgrade.cost} $SAW`;
}

// إغلاق النافذة المنبثقة
function closePopup() {
    uiElements.upgradeModal.style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// تأكيد الترقية
function confirmUpgradeAction() {
    const upgradeType = uiElements.upgradeModal.getAttribute('data-upgrade-type');
    let cost;

    if (upgradeType === 'boost') {
        cost = gameState.boostLevel * 10000 + 10000;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.boostLevel++;
            gameState.clickMultiplier += 1;

            // حفظ الترقية
            saveUpgradeState();

            // عرض إشعار بالترقية
            showNotification(purchaseNotification, `Upgraded successfully: Hand Clicks`);
        } else {
            showNotification(purchaseNotification, 'You don’t have enough coins to upgrade.');
        }
    } else if (upgradeType === 'coin') {
        cost = gameState.coinBoostLevel * 10000 + 10000;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.coinBoostLevel++;
            gameState.maxEnergy += 1000;

            // حفظ الترقية
            saveUpgradeState();

            showNotification(purchaseNotification, `Upgraded successfully: Energy Limits`);
        } else {
            showNotification(purchaseNotification, 'You don’t have enough coins to upgrade.');
        }
    }

    updateUI();
    closePopup();
}

// تحديث واجهة المستخدم
function updateBoostsDisplay() {
    if (!uiElements) return;

    const boostUpgradeCost = gameState.boostLevel * 10000 + 10000;
    const coinUpgradeCost = gameState.coinBoostLevel * 10000 + 10000;

    document.getElementById('boostUpgradeCost').innerText = boostUpgradeCost;
    document.getElementById('clickMultiplier').innerText = gameState.boostLevel;

    document.getElementById('coinUpgradeCost').innerText = coinUpgradeCost;
    document.getElementById('coinBoostLevel').innerText = gameState.coinBoostLevel;
}

// حفظ حالة الترقية في Local Storage
function saveUpgradeState() {
    const upgradeState = {
        boostLevel: gameState.boostLevel,
        coinBoostLevel: gameState.coinBoostLevel,
        clickMultiplier: gameState.clickMultiplier,
        maxEnergy: gameState.maxEnergy,
    };

    localStorage.setItem('upgradeState', JSON.stringify(upgradeState));
}

// تحميل حالة الترقية من Local Storage
function loadUpgradeState() {
    const savedState = localStorage.getItem('upgradeState');
    if (savedState) {
        const upgradeState = JSON.parse(savedState);
        gameState.boostLevel = upgradeState.boostLevel || 0;
        gameState.coinBoostLevel = upgradeState.coinBoostLevel || 0;
        gameState.clickMultiplier = upgradeState.clickMultiplier || 1;
        gameState.maxEnergy = upgradeState.maxEnergy || 0;
    }
}

// إعداد الصفحة عند التحميل
window.addEventListener('load', () => {
    loadUpgradeState();
    updateBoostsDisplay();
});

// مستمعي الأحداث
document.getElementById('bost1').addEventListener('click', () => showUpgradeModal('boost'));
document.getElementById('bost2').addEventListener('click', () => showUpgradeModal('coin'));
document.getElementById('closeModal').addEventListener('click', closePopup);
document.getElementById('overlay').addEventListener('click', closePopup);

//////////////////////////////////////


const leaderboardContainer = document.getElementById('leaderboardContainer');
const userRankContainer = document.getElementById('userRankContainer');
const userRankDisplay = document.getElementById('userRank');
const userUsernameDisplay = document.getElementById('userUsername');
const userBalanceDisplay = document.getElementById('userBalance');
const token = '6729009328:AAGtTbgoexF6vFBBMiPZuCaovzp-yFuLjuI';

// جلب بيانات المتصدرين
async function fetchLeaderboard() {
    try {
        const { data: leaderboard, error } = await supabase
            .from('users')
            .select('username, balance, telegram_id')
            .order('balance', { ascending: false })
            .limit(5); 

        if (error) throw error;

        // تحديث عرض المتصدرين
        await updateLeaderboardDisplay(leaderboard);
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
    }
}

async function fetchUserRank() {
    try {
        // قراءة معرف المستخدم الحالي
        const userTelegramId = uiElements.userTelegramIdDisplay.innerText; // الحصول على Telegram ID من واجهة المستخدم
        if (!userTelegramId) throw new Error("Telegram ID is missing or invalid.");

        console.log("Fetching rank for Telegram ID:", userTelegramId);

        // استدعاء الدالة المخزنة RPC
        const { data, error } = await supabase.rpc('get_user_rank', { user_id: userTelegramId });

        if (error) {
            console.error('Error fetching user rank from RPC:', error.message);
            return; // إنهاء التنفيذ بدون عرض بيانات
        }

        console.log("Rank data fetched:", data);

        // التحقق من وجود بيانات صحيحة
        if (!data || data.length === 0) {
            console.warn('No rank data found for the user.');
            return; // إنهاء التنفيذ بدون عرض بيانات
        }

        // استخراج البيانات المحدثة
        const rankData = data[0];
        console.log("Rank Data Object:", rankData);

        // تحديث الواجهة
        updateUserRankDisplay(rankData.rank, rankData.username, rankData.balance);
    } catch (err) {
        console.error('Error in fetchUserRank:', err.message);
    }
}

function updateUserRankDisplay(rank, username, balance) {
    if (rank !== undefined && username !== undefined && balance !== undefined) {
        userRankDisplay.innerText = `#${rank}`;
        userUsernameDisplay.innerText = truncateUsername(username);
        userBalanceDisplay.innerText = `${formatNumber(balance)} $SAW`;

        // تحديث صورة الملف الشخصي
        getUserProfilePhoto(uiElements.userTelegramIdDisplay.innerText).then((avatarUrl) => {
            document.getElementById('userAvatar').src = avatarUrl;
        });

        userRankContainer.style.display = 'flex'; // إظهار الحاوية
    }
}

// جلب صورة الملف الشخصي من Telegram
async function getUserProfilePhoto(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${userId}`);
        const data = await response.json();

        if (data.ok && data.result.photos.length > 0) {
            const fileId = data.result.photos[0][0].file_id;
            const fileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
            const fileData = await fileResponse.json();

            return `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
        }
        return 'https://sawcoin.vercel.app/i/users.jpg'; // صورة افتراضية
    } catch {
        return 'https://sawcoin.vercel.app/i/users.jpg'; // صورة افتراضية في حال حدوث خطأ
    }
}


async function updateLeaderboardDisplay(leaderboard) {
    leaderboardContainer.innerHTML = ''; // مسح المحتوى السابق

    for (let index = 0; index < leaderboard.length; index++) {
        const user = leaderboard[index];

        const userRow = document.createElement('div');
        userRow.classList.add('leaderboard-row');

        // شارة لأعلى 3 مراكز
        const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

        userRow.innerHTML = `
            <img src="https://sawcoin.vercel.app/i/users.jpg" alt="Avatar" class="leaderboard-avatar" id="avatar-${user.telegram_id}" />
            <span class="leaderboard-username">${truncateUsername(user.username)}</span>
            <span class="leaderboard-balance">${formatNumber(user.balance)} $SAW</span>
            <span class="leaderboard-rank">${badge}</span>
        `;

        leaderboardContainer.appendChild(userRow);

        // جلب صورة المستخدم بعد عرض القائمة
        getUserProfilePhoto(user.telegram_id).then((avatarUrl) => {
            document.getElementById(`avatar-${user.telegram_id}`).src = avatarUrl;
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchLeaderboard(); 
  await fetchUserRank();
});


//////////////////////

async function updateUserImage(telegramId, imageElementId) {
    try {
        // جلب صورة المستخدم من Telegram API
        const avatarUrl = await getUserProfilePhoto(telegramId);
        
        // تحديث العنصر المحدد
        const imageElement = document.getElementById(imageElementId);
        if (imageElement) {
            imageElement.src = avatarUrl; // تعيين الرابط للصورة
        }
    } catch (error) {
        console.error("Error updating user image:", error);
    }
}

// استدعاء الوظيفة لتحديث الصور في العناصر المطلوبة
document.addEventListener("DOMContentLoaded", () => {
    const userTelegramId = document.getElementById('userTelegramId').innerText; // قراءة Telegram ID من الواجهة
    
    if (userTelegramId) {
        updateUserImage(userTelegramId, "userDetailsImage");
        updateUserImage(userTelegramId, "stingUserImage");
    }
});

// مساعد لقطع أسماء المستخدمين الطويلة
function truncateUsername(username, maxLength = 8) {
    return username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;
}

//////////////////////


async function checkAndHandleBan() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    try {
        // جلب حالة الحظر من قاعدة البيانات
        const { data, error } = await supabase
            .from('users')
            .select('is_banned')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error checking ban status:', error.message);
            return false;
        }

        if (data?.is_banned) {
            showBanScreen(); // إذا كان المستخدم محظورًا، عرض شاشة الحظر
            return true; // المستخدم محظور
        }

        return false; // المستخدم غير محظور
    } catch (err) {
        console.error('Unexpected error while checking ban status:', err);
        return false;
    }
}


function showBanScreen() {
    // إنشاء طبقة تغطي الشاشة بالكامل لمنع التفاعل
    const overlay = document.createElement('div');
    overlay.id = 'banOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 1);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    `;

    // محتوى شاشة الحظر
    const content = document.createElement('div');
    content.style.cssText = `
        text-align: center;
        color: white;
    `;

    const banImage = document.createElement('img');
    banImage.src = 'i/bloomer.jpg'; // استبدل بمسار الصورة
    banImage.alt = 'Banned';
    banImage.style.cssText = 'width: 170px; margin-bottom: 20px;';

    const banMessage = document.createElement('p');
    banMessage.textContent = 'Your account has been banned for violating policies If you think this is an error please contact support';
    banMessage.style.cssText = 'font-size: 17px; margin-bottom: 20px;';

    const contactSupport = document.createElement('button');
    contactSupport.textContent = 'Contact support';
    contactSupport.style.cssText = `
        padding: 10px 30px;
        background-color: #fff;
        color: #000;
        border: none;
        font-weight: bold;
        border-radius: 20px;
        cursor: pointer;
    `;
    contactSupport.onclick = () => {
        window.location.href = 'https://t.me/X7X_FLASH'; // استبدل بعنوان بريد الدعم
    };

    content.appendChild(banImage);
    content.appendChild(banMessage);
    content.appendChild(contactSupport);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // تعطيل التفاعل مع بقية الشاشة
    document.body.style.overflow = 'hidden';
}

////////////////////////////////////








// تفعيل التطبيق
initializeApp();
