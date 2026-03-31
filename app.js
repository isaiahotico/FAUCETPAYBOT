
// --- DATABASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Telegram WebApp Init
const tg = window.Telegram.WebApp;
tg.expand();

// User Data
let userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "guest_user_" + Math.floor(Math.random() * 1000);
let username = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : "Guest";
let userData = {};
const ADMIN_ID = 589427984313; // Set your TG ID here

// State
let adCount = 0;
let isWatching = false;
let timer;

// DOM Elements
const usernameDisplay = document.getElementById('tg-username');
const balanceDisplay = document.getElementById('user-balance');
const totalUsersDisplay = document.getElementById('total-users');
const onlineCountDisplay = document.getElementById('online-count');
const footerTime = document.getElementById('footer-date-time');

// 1. Initialize User
function initUser() {
    usernameDisplay.innerText = `@${username}`;
    
    db.ref('users/' + userId).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            // New User
            userData = {
                username: username,
                balance: 0,
                referrals: 0,
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referredBy: "",
                totalEarned: 0,
                clicks: 0,
                lastClick: 0
            };
            db.ref('users/' + userId).set(userData);
        } else {
            userData = snapshot.val();
        }
        updateUI();
        checkAdmin();
        trackOnline();
    });

    // Global stats
    db.ref('users').on('value', (snap) => {
        totalUsersDisplay.innerText = snap.numChildren();
    });
}

function updateUI() {
    balanceDisplay.innerText = userData.balance.toFixed(5);
    document.getElementById('my-ref-code').innerText = userData.refCode;
    document.getElementById('ref-count').innerText = userData.referrals;
    loadWithdrawHistory();
}

// 2. Ad Logic
function startAdTimer(type) {
    if (userData.clicks >= 10) {
        const now = Date.now();
        const diff = now - userData.lastClick;
        if (diff < 300000) { // 5 mins cooldown
            alert("Cooldown! Please wait 5 minutes after 10 ads.");
            return;
        } else {
            // Reset clicks after cooldown
            userData.clicks = 0;
            db.ref('users/' + userId).update({ clicks: 0 });
        }
    }

    // Show Interstitial Scripts provided
    if (typeof show_10555663 === "function") show_10555663();
    if (typeof show_10555746 === "function") show_10555746();

    // Open Direct Link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    // Start Timer UI
    isWatching = true;
    let timeLeft = 20;
    document.getElementById('ad-overlay').style.display = 'flex';
    document.getElementById('ad-title').innerText = "Watching " + type;

    const interval = setInterval(() => {
        if (!isWatching) {
            clearInterval(interval);
            return;
        }
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        document.getElementById('progress-bar').style.width = ((20 - timeLeft) / 20 * 100) + "%";

        if (timeLeft <= 0) {
            clearInterval(interval);
            claimReward();
        }
    }, 1000);
}

// Detect if user leaves page
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isWatching) {
        isWatching = false;
        document.getElementById('ad-overlay').style.display = 'none';
        alert("Ad paused because you left the screen. Open again!");
    }
});

function claimReward() {
    isWatching = false;
    const reward = 0.00014;
    document.getElementById('rewardSound').play();
    
    // Update User
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.clicks += 1;
    userData.lastClick = Date.now();

    // Update DB
    db.ref('users/' + userId).update({
        balance: userData.balance,
        totalEarned: userData.totalEarned,
        clicks: userData.clicks,
        lastClick: userData.lastClick
    });

    // Referral 12% Bonus to upline
    if (userData.referredBy) {
        const bonus = reward * 0.12;
        db.ref('users/' + userData.referredBy + '/balance').transaction(b => (b || 0) + bonus);
    }

    document.getElementById('ad-overlay').style.display = 'none';
    alert(`Congratulations! Reward 0.00014 USDT credited. Keep inviting!`);
    updateUI();
}

// 3. Referral Logic
function applyReferral() {
    const code = document.getElementById('referral-input').value.trim();
    if (userData.referredBy) return alert("You were already referred!");
    
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', (snap) => {
        if (snap.exists()) {
            const uplineId = Object.keys(snap.val())[0];
            if (uplineId === userId.toString()) return alert("Cannot refer yourself!");
            
            db.ref('users/' + userId).update({ referredBy: uplineId });
            db.ref('users/' + uplineId + '/referrals').transaction(r => (r || 0) + 1);
            alert("Referral applied successfully!");
        } else {
            alert("Invalid Code");
        }
    });
}

// 4. Withdrawal Logic
function requestWithdraw() {
    const method = document.getElementById('wd-method').value;
    const address = document.getElementById('wd-address').value;
    const amount = userData.balance;

    if (amount < 0.02) return alert("Minimum withdrawal is 0.02 USDT");
    if (!address) return alert("Enter address");

    const wdData = {
        userId: userId,
        username: username,
        method: method,
        address: address,
        amount: amount,
        status: 'pending',
        timestamp: Date.now()
    };

    const newWdKey = db.ref('withdrawals').push().key;
    db.ref('withdrawals/' + newWdKey).set(wdData);
    db.ref('users/' + userId).update({ balance: 0 });
    userData.balance = 0;
    updateUI();
    alert("Withdrawal requested! Please wait for admin approval.");
}

function loadWithdrawHistory() {
    db.ref('withdrawals').orderByChild('userId').equalTo(userId).on('value', (snap) => {
        const list = document.getElementById('wd-history');
        list.innerHTML = "";
        snap.forEach(child => {
            const wd = child.val();
            list.innerHTML += `
                <div class="flex justify-between border-b border-white/5 pb-1">
                    <span>${wd.method.toUpperCase()} - ${wd.amount.toFixed(4)}</span>
                    <span class="${wd.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}">${wd.status}</span>
                </div>
            `;
        });
    });
}

// 5. Admin Functionality
function checkAdmin() {
    if (userId == ADMIN_ID) {
        document.getElementById('admin-panel').classList.remove('hidden-section');
        loadAdminRequests();
    }
}

function loadAdminRequests() {
    db.ref('withdrawals').orderByChild('status').equalTo('pending').on('value', (snap) => {
        const container = document.getElementById('admin-requests');
        container.innerHTML = "";
        snap.forEach(child => {
            const req = child.val();
            container.innerHTML += `
                <div class="p-2 bg-white/5 rounded">
                    <p>User: ${req.username} | ${req.amount} USDT</p>
                    <p>Via: ${req.method} (${req.address})</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="processWd('${child.key}', 'approved')" class="bg-green-600 px-2 py-1 rounded">Approve</button>
                        <button onclick="processWd('${child.key}', 'denied')" class="bg-red-600 px-2 py-1 rounded">Deny</button>
                    </div>
                </div>
            `;
        });
    });
}

window.processWd = function(key, status) {
    if (status === 'denied') {
        db.ref('withdrawals/' + key).once('value', snap => {
            const wd = snap.val();
            db.ref('users/' + wd.userId + '/balance').transaction(b => (b || 0) + wd.amount);
        });
    }
    db.ref('withdrawals/' + key).update({ status: status });
};

// 6. Customization
function updateTheme() {
    const bg = document.getElementById('bg-color-picker').value;
    const accent = document.getElementById('accent-color-picker').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--accent-color', accent);
    // Apply accent to buttons
    document.getElementById('adBtn1').style.backgroundColor = accent;
}

// 7. Footer & Online Tracker
function updateClock() {
    const now = new Date();
    footerTime.innerText = now.toLocaleString();
}
setInterval(updateClock, 1000);

function trackOnline() {
    const onlineRef = db.ref('online/' + userId);
    onlineRef.set(true);
    onlineRef.onDisconnect().remove();
    
    db.ref('online').on('value', snap => {
        onlineCountDisplay.innerText = "Online: " + snap.numChildren();
    });
}

// Start App
initUser();
