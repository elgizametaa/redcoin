const uiElements = {
    balanceDisplay: document.getElementById('balanceAmount'),
    settingsBalanceDisplay: document.getElementById('settingsBalanceDisplay'),    
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
};

//تحديث البيانت من الواجهه الي قاعده البيانات 
async function updateGameStateInDatabase(updatedData) {
    const userId = uiElements.userTelegramIdDisplay.innerText;
    // منع تحديث الرصيد بـ 0 إذا لم يكن القصد ذلك
    if (updatedData.balance === 0 && gameState.balance !== 0) {
        console.warn('Skipping update: balance is 0 but the current gameState balance is not.');
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('telegram_id', userId)
            .select();

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
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', userId)
            .single();

        if (data) {
            gameState = {
                ...gameState,
                ...data,
                balance: data.balance ?? gameState.balance, // دمج الرصيد مع البيانات الحالية
            };
            updateUI();
        }
    } catch (err) {
        console.error('Error loading game state:', err);
    }
}

let saveTimeout;
function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveGameState();
    }, 4000); // حفظ بعد 5 ثوانٍ
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

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const isBanned = await checkAndHandleBan();
    if (isBanned) return; 
    await loadGameState();   
    await restoreEnergy();
    startEnergyRecovery(); 
    updateUI();  
    loadFriendsList(); 
    await fetchLeaderboard();
    await fetchUserRank();
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

// جلب بيانات المستخدم من Telegram
async function fetchUserDataFromTelegram() {
    try {
        const telegramApp = window.Telegram.WebApp;
        telegramApp.ready();

        const userTelegramId = telegramApp.initDataUnsafe.user?.id;
        const userTelegramName = telegramApp.initDataUnsafe.user?.username || `user_${userTelegramId}`;
        const isPremium = telegramApp.initDataUnsafe.user?.is_premium;

        if (!userTelegramId) {
            throw new Error("Failed to fetch Telegram user ID.");
        }

        // تحديث واجهة المستخدم
        uiElements.userTelegramIdDisplay.innerText = userTelegramId;
        uiElements.userTelegramNameDisplay.innerText = userTelegramName;

        // عرض الاسم المختصر
        const userNameElement = document.getElementById("userName");
        if (userNameElement) {
            const maxLength = 8;
            const truncatedName = userTelegramName.length > maxLength
                ? userTelegramName.slice(0, maxLength) + "..."
                : userTelegramName;
            userNameElement.innerText = truncatedName;
        }

        // عرض حالة Premium
        const premiumStatusElement = document.getElementById('userPremiumStatus');
        if (premiumStatusElement) {
            premiumStatusElement.innerHTML = isPremium
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-circle-dashed-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" /><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" /><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" /><path d="M8.56 20.31a9 9 0 0 0 3.44 .69" /><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" /><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" /><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" /><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" /><path d="M9 12l2 2l4 -4" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="Error-mark"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
        }

        // التحقق من تسجيل المستخدم
        await ensureUserAuthenticationAndDatabase(userTelegramId, userTelegramName);
    } catch (error) {
        console.error("Error fetching Telegram user data:", error.message);
    }
}

// وظيفة التحقق أو تسجيل المستخدم في المصادقة وقاعدة البيانات
async function ensureUserAuthenticationAndDatabase(telegramId, userName) {
    try {
        const email = `${telegramId}@SawToken.coin`;
        const password = `password_${telegramId}`;

        // 1. التحقق من وجود المستخدم في نظام المصادقة
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (loginError) {
            console.log("User not found in auth system. Registering...");
            // تسجيل المستخدم في المصادقة إذا لم يكن موجودًا
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) throw new Error(`Failed to register user: ${signUpError.message}`);
            console.log("User registered in auth system:", signUpData.user.id);
        } else {
            console.log("User logged in successfully:", loginData.user.id);
        }

        // 2. التحقق من وجود المستخدم في قاعدة البيانات
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("telegram_id", telegramId)
            .maybeSingle();

        if (userError) throw new Error(`Error fetching user data: ${userError.message}`);

        // إضافة المستخدم إذا لم يكن موجودًا في قاعدة البيانات
        if (!userData) {
            console.log("User not found in database. Adding user...");
            const { error: insertError } = await supabase
                .from("users")
                .insert({ telegram_id: telegramId, username: userName, balance: 0 });
            if (insertError) throw new Error(`Failed to insert user data: ${insertError.message}`);
            console.log("User added to database successfully.");
        } else {
            console.log("User already exists in database.");
        }

    } catch (error) {
        console.error("Error ensuring user authentication and database:", error.message);
        throw error;
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
    
    const balanceElements = [
        uiElements.settingsBalanceDisplay
    ];

     balanceElements.forEach(element => {
    if (element) {
        element.innerText = formatNumber(gameState.balance);
      }
   });
    
    // تحديث شريط الطاقة
  //  const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
   // if (uiElements.energyBar) {
     //   uiElements.energyBar.style.width = `${energyPercent}%`;
  //  }

    // تحديث معلومات الطاقة
  //  if (uiElements.energyInfo) {
     //   uiElements.energyInfo.innerText = `${formatNumber(gameState.energy)}/${formatNumber(gameState.maxEnergy)}⚡`;
  //  }

    // تحديث مضاعف النقرة
    if (uiElements.clickMultiplierDisplay) {
        uiElements.clickMultiplierDisplay.innerText = gameState.clickMultiplier;
    }

    // تحديث مستوى التعزيز
    if (uiElements.boostLevelDisplay) {
        uiElements.boostLevelDisplay.innerText = gameState.boostLevel;
    }

    // حفظ حالة اللعبة محليًا
    debounceSave(); 
    updateBoostsDisplay();
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

        // إضافة تأثير القصاصات الورقية للاحتفال
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
    }, 4000);
}

// دالة لإظهار تأثير القصاصات الورقية
function showConfettiEffect() {
    const duration = 2 * 1000; // مدة التأثير (2 ثانية)
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 8, // عدد الجزيئات في كل دفعة
            angle: 90,        // زاوية التساقط (عمودية)
            spread: 160,      // زاوية الانتشار
            startVelocity: 40, // سرعة البداية
            gravity: 1,     // الجاذبية
            origin: {
                x: Math.random(), // انطلاق من أماكن عشوائية
                y: 0              // البداية من أعلى الشاشة
            },
            colors: ['#1F1F1F', '#3A3A3A', '#2D83EC', '#A6B1E1', '#6272A4']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
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

// دالة التعامل مع النقر
async function handleSingleTouch(event) {
    event.preventDefault();

    // تأثير الإمالة
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

    // معالجة النقرة
    const clickValue = gameState.clickMultiplier || 0;
    const requiredEnergy = clickValue;
    const currentEnergy = gameState.maxEnergy - gameState.energy;

    if (currentEnergy < requiredEnergy) {
        showNotification(uiElements.purchaseNotification, 'Not enough energy!');
        return;
    }

    // تحديث الرصيد والطاقة
    gameState.balance += clickValue;
    gameState.energy += requiredEnergy;

    // تحديث واجهة المستخدم
    updateUI();
    debounceSave(); 
    updateEnergyUI();

    // تأثير النقرة
    createDiamondCoinEffect(event.pageX, event.pageY);

    // تنفيذ الاهتزاز عند التفعيل
    if (isVibrationEnabled && navigator.vibrate) {
        navigator.vibrate(80);
    }
}

// تحديث واجهة المستخدم لشريط الطاقة الدائري
function updateEnergyUI() {
    const energyBar = document.getElementById('energyBar');
    const energyInfo = document.getElementById('energyInfo');

    const currentEnergy = gameState.maxEnergy - gameState.energy;

    if (energyBar) {
        const radius = energyBar.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const progress = (currentEnergy / gameState.maxEnergy) * circumference;

        energyBar.style.strokeDasharray = `${circumference}`;
        energyBar.style.strokeDashoffset = `${circumference - progress}`;
    }

    if (energyInfo) {
        energyInfo.innerText = `${currentEnergy}/${gameState.maxEnergy}`;
    }
}

// إنشاء تأثير النقرة
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


// استعادة الطاقة بشكل دوري
function startEnergyRecovery() {
    setInterval(() => {
        const currentEnergy = gameState.maxEnergy - gameState.energy;

        // التحقق إذا كانت الطاقة أقل من الحد الأقصى
        if (currentEnergy < gameState.maxEnergy) {
            // استعادة الطاقة بمقدار 20 نقطة إذا لم يتم تجاوز الحد الأقصى
            gameState.energy = Math.max(gameState.energy - 20, 0);

            // تحديث واجهة المستخدم
            updateEnergyUI();

            console.log('Energy recovered successfully.');
        }
    }, 5000); // تنفيذ الدالة كل 5 ثوانٍ
}

// استعادة الطاقة عند بدء التطبيق
async function restoreEnergy() {
    try {
        const lastFillTime = parseInt(localStorage.getItem('lastFillTime'), 10) || Date.now();
        const currentTime = Date.now();
        const timeDiff = currentTime - lastFillTime;

        // حساب عدد المرات التي يجب استعادة الطاقة فيها
        const recoverableTimes = Math.floor(timeDiff / (5 * 1000)); // كل 5 ثوانٍ
        const recoveredEnergy = recoverableTimes * 5;

        // استعادة الطاقة بدون تجاوز الحد الأقصى
        const currentEnergy = gameState.maxEnergy - gameState.energy;
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



async function loadFriendsList() {
    const userId = uiElements.userTelegramIdDisplay.innerText;
    const noFriendsMessage = document.getElementById('noFriendsMessage');
    const friendsListDisplay = uiElements.friendsListDisplay;

    if (!userId) {
        console.error("User ID is missing.");
        friendsListDisplay.innerHTML = `<li>Error: Unable to load friends list. Please try again later.</li>`;
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('invites')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error fetching friends list:', error.message);
            friendsListDisplay.innerHTML = `<li>Error: Unable to fetch friends at the moment.</li>`;
            return;
        }

        if (data && data.invites && Array.isArray(data.invites) && data.invites.length > 0) {
            friendsListDisplay.innerHTML = '';
            noFriendsMessage.style.display = 'none';

            const uniqueInvites = [...new Set(data.invites)];
            const limitedInvites = uniqueInvites.slice(0, 10);

            const friendsPromises = limitedInvites.map(async (friendId) => {
                const { data: friendData, error: friendError } = await supabase
                    .from('users')
                    .select('telegram_id, username, balance')
                    .eq('telegram_id', friendId)
                    .single();

                if (friendError) {
                    console.error(`Error fetching data for friend ${friendId}:`, friendError.message);
                    return null;
                }

                return friendData;
            });

            const friendsData = await Promise.all(friendsPromises);

            friendsData.forEach((friend) => {
                if (friend) {
                    const li = document.createElement('li');
                    li.classList.add('friend-item');

                    const img = document.createElement('img');
                    img.src = friend.username
                        ? `https://t.me/i/userpic/320/${friend.username}.svg`
                        : 'i/users.jpg';
                    img.alt = `${friend.telegram_id} Avatar`;
                    img.classList.add('friend-avatar');

                    const span = document.createElement('span');
                    span.classList.add('friend-name');
                    span.textContent = `ID : ${friend.telegram_id}`;

                    const balanceSpan = document.createElement('span');
                    balanceSpan.classList.add('friend-balance');
                    balanceSpan.textContent = `${formatNumber(friend.balance)} $RED`;

                    const friendInfoDiv = document.createElement('div');
                    friendInfoDiv.classList.add('friend-info');
                    friendInfoDiv.appendChild(img);
                    friendInfoDiv.appendChild(span);

                    li.appendChild(friendInfoDiv);
                    li.appendChild(balanceSpan);
                    friendsListDisplay.appendChild(li);
                }
            });

            const totalFriendsCount = uniqueInvites.length;
            document.getElementById('invitedCount').innerText = totalFriendsCount || 0;
            document.getElementById('settingsInvitedCount').innerText = totalFriendsCount || 0;
        } else {
            friendsListDisplay.innerHTML = '';
            noFriendsMessage.style.display = 'block';
        }
    } catch (err) {
        console.error("Unexpected error loading friends list:", err);
        friendsListDisplay.innerHTML = `<li>Error: Unexpected issue occurred while loading friends.</li>`;
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


import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './Scripts/config.js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// مشاركة الدعوة عبر Telegram
function openTelegramChat() {
    const inviteLink = `https://t.me/share/url?text=Join Saw Token Game and earn 5,000 $SAW!&url=https://t.me/SAWCOIN_BOT?start=${uiElements.userTelegramIdDisplay?.innerText || ''}`;
    window.open(inviteLink, '_blank');
}


////////////////////////////////////////////////


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


                document.addEventListener('DOMContentLoaded', async () => {
    const mainTaskContainer = document.querySelector('#main-task-container');
    const partnersTaskContainer = document.querySelector('#partners-task-container');

    if (!mainTaskContainer || !partnersTaskContainer) {
        console.error('Task container elements not found.');
        return;
    }

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
                const taskElement = createTaskElement(task, completedTasks);

                // تحديد الحاوية المناسبة بناءً على الفئة
                if (task.category === 'Main') {
                    mainTaskContainer.appendChild(taskElement);
                } else if (task.category === 'Partners') {
                    partnersTaskContainer.appendChild(taskElement);
                }
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
});

// إنشاء عنصر المهمة
function createTaskElement(task, completedTasks) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item');

    // صورة المهمة
    const img = document.createElement('img');
    img.src = task.image;
    img.alt = 'Task Image';
    img.classList.add('task-img');
    taskElement.appendChild(img);

    // وصف ومكافأة المهمة
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-task');
    const description = document.createElement('p');
    description.textContent = task.description;
    infoContainer.appendChild(description);

    const rewardContainer = document.createElement('div');
    rewardContainer.classList.add('task-reward-container');
    const rewardText = document.createElement('span');
    rewardText.textContent = `+ ${task.reward} $SAW`;
    rewardText.classList.add('task-reward');
    rewardContainer.appendChild(rewardText);
    infoContainer.appendChild(rewardContainer);

    taskElement.appendChild(infoContainer);

    // زر المهمة
    const button = document.createElement('button');
    button.classList.add('task-button');
    button.setAttribute('data-task-id', task.id);
    button.setAttribute('data-reward', task.reward);

    if (completedTasks.includes(task.id)) {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>`;
        button.disabled = true;
    } else {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="arrow">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>`;
    }

    button.addEventListener('click', () => handleTaskButtonClick(task, button, completedTasks));
    taskElement.appendChild(button);

    return taskElement;
}

function handleTaskButtonClick(task, button, completedTasks) {
    // الحصول على حالة المهمة الحالية من الزر
    let taskProgress = button.getAttribute('data-progress') || "0";

    if (taskProgress === "0") {
        // الخطوة الأولى: الدخول إلى رابط المهمة
        showLoading(button);
        openTaskLink(task.url, () => {
            taskProgress = "1";
            button.setAttribute('data-progress', taskProgress);
            hideLoading(button, 'Verify');
        });
    } else if (taskProgress === "1") {
        // الخطوة الثانية: التحقق من المهمة
        showLoading(button);
        setTimeout(() => {
            taskProgress = "2";
            button.setAttribute('data-progress', taskProgress);
            hideLoading(button, 'Claim');
        }, 5000); // محاكاة التحقق لمدة 5 ثوانٍ
    } else if (taskProgress === "2") {
        // الخطوة الثالثة: استلام المكافأة
        claimTaskReward(task.id, task.reward, button, completedTasks);
    }
}


// استلام المكافأة وتحديث المهام المكتملة فقط
async function claimTaskReward(taskId, reward, button, completedTasks) {
    try {
        if (completedTasks.includes(taskId)) {
            showNotification(uiElements.purchaseNotification, 'You have already claimed this reward.');
            return;
        }

        // تحديث المهام المكتملة
        completedTasks.push(taskId);
        button.textContent = '✓';
        button.disabled = true;
        showNotificationWithStatus(uiElements.purchaseNotification, `Successfully claimed ${reward} coins!`, 'win');

        // تحديث قاعدة البيانات للمهام فقط
        const userId = uiElements.userTelegramIdDisplay.innerText;
        const { error } = await supabase
            .from('users')
            .update({ completed_tasks: completedTasks })
            .eq('telegram_id', userId);

        if (error) {
            console.error('Error updating completed tasks:', error);
        }

        // تحديث الرصيد بشكل منفصل
        gameState.balance += reward;
        updateUI();
        debounceSave();
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
    const defaultHeaderColor = "#000000"; 
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
window.Telegram.WebApp.setHeaderColor('#000000');



/////////////////////////////////////////////////
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

/////////////////////////////////////////

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
            cost: gameState.boostLevel * 50000 + 50000,
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
            cost: gameState.coinBoostLevel * 50000 + 50000,
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
    document.getElementById('upgradeCost').innerText = ` ${formatNumber(upgrade.cost)} $RED`;
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
        cost = gameState.boostLevel * 50000 + 50000;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.boostLevel++;
            gameState.clickMultiplier += 1;

            // حفظ الترقية
            saveUpgradeState();

            // عرض إشعار بالترقية
            showNotificationWithStatus(purchaseNotification, `Upgraded successfully : Hand Clicks`, 'win');
        } else {
            showNotification(purchaseNotification, 'You don’t have enough coins to upgrade.');
        }
    } else if (upgradeType === 'coin') {
        cost = gameState.coinBoostLevel * 50000 + 50000;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.coinBoostLevel++;
            gameState.maxEnergy += 1000;

            // حفظ الترقية
            saveUpgradeState();

            showNotificationWithStatus(purchaseNotification, `Upgraded successfully : Energy Limits`, 'win');
        } else {
            showNotification(purchaseNotification, 'You don’t have enough coins to upgrade.');
        }
    }

    updateUI();
    closePopup();
}

function updateBoostsDisplay() {
    if (!uiElements) return;

    const boostUpgradeCost = gameState.boostLevel * 50000 + 50000;
    const coinUpgradeCost = gameState.coinBoostLevel * 50000 + 50000;

    document.getElementById('boostUpgradeCost').innerText = formatNumber(boostUpgradeCost);
    document.getElementById('clickMultiplier').innerText = gameState.boostLevel;

    document.getElementById('coinUpgradeCost').innerText = formatNumber(coinUpgradeCost);
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

// جلب بيانات المتصدرين
async function fetchLeaderboard() {
    try {
        const { data: leaderboard, error } = await supabase
            .from('users')
            .select('username, balance, telegram_id')
            .order('balance', { ascending: false })
            .limit(50);

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
        const userTelegramId = Telegram.WebApp.initDataUnsafe.user.id;
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
        userBalanceDisplay.innerText = `${formatNumber(balance)} $RED`;

        // تحديث صورة الملف الشخصي
        updateUserImage("userAvatar");

        userRankContainer.style.display = 'flex'; // إظهار الحاوية
    }
}

async function updateLeaderboardDisplay(leaderboard) {
    // تفريغ الحاوية الرئيسية للمتصدرين الآخرين
//   document.getElementById('leaderboardContainer').innerHTML = '';

    for (let index = 0; index < leaderboard.length; index++) {
        const user = leaderboard[index];
        const avatar = user.username
            ? `https://t.me/i/userpic/320/${user.username}.svg`
            : 'https://sawcoin.vercel.app/i/users.jpg';

        const badge = `#${index + 1}`;

        if (index === 0) {
            // المتصدر الأول
            renderTopLeader(
                'firstPlaceImg',
                'firstPlaceName',
                'firstPlaceBalance',
                'firstPlaceRank',
                avatar,
                user.username,
                user.balance,
                badge,
                'gold'
            );
        } else if (index === 1) {
            // المتصدر الثاني
            renderTopLeader(
                'secondPlaceImg',
                'secondPlaceName',
                'secondPlaceBalance',
                'secondPlaceRank',
                avatar,
                user.username,
                user.balance,
                badge,
                'silver'
            );
        } else if (index === 2) {
            // المتصدر الثالث
            renderTopLeader(
                'thirdPlaceImg',
                'thirdPlaceName',
                'thirdPlaceBalance',
                'thirdPlaceRank',
                avatar,
                user.username,
                user.balance,
                badge,
                'bronze'
            );
        } else if (index >= 3 && index <= 6) {
            // المتصدرون الرابع إلى السابع
            const leaderIds = [
                'fourthPlace',
                'fifthPlace',
                'sixthPlace',
                'seventhPlace',
            ];

            const leaderPrefix = leaderIds[index - 3]; // تحديد معرف القائد بناءً على الترتيب
            renderTopLeader(
                `${leaderPrefix}Img`,
                `${leaderPrefix}Name`,
                `${leaderPrefix}Balance`,
                `${leaderPrefix}Rank`,
                avatar,
                user.username,
                user.balance,
                badge,
                '#181818' // لون افتراضي
            );
        } else {
            // باقي المتصدرين
            const userRow = document.createElement('div');
            userRow.classList.add('leaderboard-row');

            userRow.innerHTML = `
                <img src="${avatar}" alt="Avatar" class="leaderboard-avatar" 
                    onerror="this.src='https://sawcoin.vercel.app/i/users.jpg';" />
                <span class="leaderboard-rank">${badge}</span>
                <span class="leaderboard-username">${truncateUsername(user.username)}</span>
                <span class="leaderboard-balance">${formatNumber(user.balance)} $RED</span>
            `;

            document.getElementById('leaderboardContainer').appendChild(userRow);
        }
    }
}

// وظيفة لتحديث المتصدرين الفرديين
function renderTopLeader(imageId, nameId, balanceId, rankId, avatar, username, balance, rank, color) {
    const imageElement = document.getElementById(imageId);
    const nameElement = document.getElementById(nameId);
    const balanceElement = document.getElementById(balanceId);
    const rankElement = document.getElementById(rankId);

    if (imageElement) imageElement.src = avatar;
    if (nameElement) nameElement.innerText = truncateUsername(username);
    if (balanceElement) balanceElement.innerText = `${formatNumber(balance)} $RED`;
    if (rankElement) rankElement.innerText = rank;

    // تغيير لون الحدود (إذا كان هناك حاجة لتخصيص ألوان)
    if (imageElement) {
        imageElement.style.borderColor = color;
    }
}

// مساعد لقطع أسماء المستخدمين الطويلة
function truncateUsername(username, maxLength = 10) {
    return username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;
}

async function updateUserImage(imageElementId) {
    try {
        // جلب photo_url مباشرة من Telegram
        const avatarUrl = Telegram.WebApp.initDataUnsafe.user.photo_url || 'https://sawcoin.vercel.app/i/users.jpg';

        const imageElement = document.getElementById(imageElementId);
        if (imageElement) {
            imageElement.src = avatarUrl; // تعيين الرابط للصورة
            imageElement.onerror = function () {
                this.src = 'https://sawcoin.vercel.app/i/users.jpg';
            };
        }
    } catch (error) {
        console.error("Error updating user image:", error);
    }
}


// استدعاء الوظيفة لتحديث الصور في العناصر المطلوبة
document.addEventListener("DOMContentLoaded", () => {
    updateUserImage("userDetailsImage"); // صورة التفاصيل
    updateUserImage("stingUserImage");   // صورة الإعدادات
});


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


const overlay = document.getElementById('UsersettingsOverlay');
const settingsContainer = document.getElementById('UsersettingsContainer');
const closeButton = document.getElementById('closeSettingsButton');

// تأكد أن النافذة مخفية عند التحميل
window.addEventListener('DOMContentLoaded', () => {
  settingsContainer.classList.add('hidden');
  overlay.style.display = 'none';
});

// فتح النافذة
document.getElementById('openSettingsButton').addEventListener('click', () => {
  overlay.style.display = 'block';
  settingsContainer.classList.remove('hidden');
});

// إغلاق النافذة
closeButton.addEventListener('click', () => {
  overlay.style.display = 'none';
  settingsContainer.classList.add('hidden');
});

overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
  settingsContainer.classList.add('hidden');
});

/////////////////////////////
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://sawcoin.vercel.app/json/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

tonConnectUI.uiOptions = {
    twaReturnUrl: 'https://t.me/SAWCOIN_BOT/GAME'
};

let walletAddress = null; // لتخزين عنوان المحفظة
async function connectToWallet() {
    try {
        const connectedWallet = await tonConnectUI.connectWallet();
        walletAddress = connectedWallet.account.address;
        localStorage.setItem("walletAddress", walletAddress);
        showNotification("Wallet connected successfully!", "success");
    } catch (error) {
        console.error("Error connecting to wallet:", error.message);
        showNotification("Failed to connect wallet: " + error.message, "error");
    }
}

// إجراء الدفع
async function makePremiumPayment() {
    try {
        const amount = "1000000000"; // 1 TON (بالنانوتون)
        const recipientAddress = "UQCpMg6TV_zE34ao-Ii2iz5M6s5Qp8OIVWa3YbsB9KwxzwCJ";

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // صالح لمدة 10 دقائق
            messages: [{ address: recipientAddress, amount }],
        };

        await tonConnectUI.sendTransaction(transaction);

        // تحديث حالة المستخدم في قاعدة البيانات
        await updatePremiumStatus();

        // إخفاء زر الدفع وإظهار حالة الاشتراك
        document.getElementById("subscribeButton").classList.add("hidden");
        document.querySelector(".premium-features").classList.add("hidden");
        document.getElementById("premiumStatus").classList.remove("hidden");

        showNotification("Subscription successful!", "success");
    } catch (error) {
        console.error("Error making payment:", error.message);
        showNotification(`Payment failed: ${error.message}`, "error");
    }
}

// تحديث حالة الاشتراك في قاعدة البيانات
async function updatePremiumStatus() {
    const telegramApp = window.Telegram.WebApp;
    const telegramId = telegramApp.initDataUnsafe.user?.id;

    try {
        const { error } = await supabase
            .from("users")
            .update({ premium_status: true })
            .eq("telegram_id", telegramId);

        if (error) throw new Error(error.message);
        console.log("Premium status updated in database.");
    } catch (error) {
        console.error("Error updating premium status:", error.message);
        showNotification("Failed to update premium status.", "error");
    }
}

// ربط الأزرار بالأحداث
document.getElementById("subscribeButton").addEventListener("click", makePremiumPayment);

///////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    // الحصول على العناصر
    const mainButton = document.getElementById('main-button');
    const partnersButton = document.getElementById('partners-button');
    const dailyButton = document.getElementById('daily-button');
    
    const mainTaskContainer = document.getElementById('main-task-container');
    const partnersTaskContainer = document.getElementById('partners-task-container');
    const dailyTaskContainer = document.getElementById('daily-task-container');

    // دالة لإظهار الحاوية المخفية
    function showContainer(containerToShow) {
        // إخفاء جميع الحاويات
        mainTaskContainer.style.display = 'none';
        partnersTaskContainer.style.display = 'none';
        dailyTaskContainer.style.display = 'none';

        // عرض الحاوية المحددة
        containerToShow.style.display = 'block';

        // تحديث الحالة النشطة للأزرار
        mainButton.classList.toggle('active', containerToShow === mainTaskContainer);
        partnersButton.classList.toggle('active', containerToShow === partnersTaskContainer);
        dailyButton.classList.toggle('active', containerToShow === dailyTaskContainer);
    }

    // إضافة مستمعات الأحداث للأزرار
    mainButton.addEventListener('click', () => showContainer(mainTaskContainer));
    partnersButton.addEventListener('click', () => showContainer(partnersTaskContainer));
    dailyButton.addEventListener('click', () => showContainer(dailyTaskContainer));

    // إظهار الحاوية الرئيسية بشكل افتراضي عند تحميل الصفحة
    showContainer(mainTaskContainer);
});

/////////////////////////





// تفعيل التطبيق
initializeApp();
