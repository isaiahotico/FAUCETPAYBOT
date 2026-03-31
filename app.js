
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
tg.expand();

let userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "user_" + Math.floor(Math.random() * 9999);
let username = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : "Guest";
let userData = {};
let isWatching = false;
let adTimerInterval;
const ADMIN_ID = 589427984313; // Set your TG ID here

function initUser() {
    document.getElementById('tg-username').innerText = `@${username}`;
    
    db.ref('users/' + userId).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            userData = {
                username: username,
                balance: 0,
                referrals: 0,
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referredBy: "",
                clicks: 0,
                lastClick: 0,
                isBanned: false
            };
            db.ref('users/' + userId).set(userData);
        } else {
            userData = snapshot.val();
        }

        if (userData.isBanned) {
            document.getElementById('banned-screen').style.display = 'flex';
            return;
        }

        updateUI();
        if (userId == ADMIN_ID) {
            document.getElementById('nav-admin').classList.remove('hidden');
        }
    });

    db.ref('users').on('value', snap => {
        document.getElementById('total-users').innerText = snap.numChildren();
    });
    
    trackOnline();
}

// SECTION NAVIGATION
window.showSection = function(sectionId, btn) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('section-' + sectionId).classList.add('active');
    btn.classList.add('active');

    if (sectionId === 'admin') loadAdminPanel();
}

function updateUI() {
    document.getElementById('user-balance').innerText = (userData.balance || 0).toFixed(5);
    document.getElementById('my-ref-code').innerText = userData.refCode;
    document.getElementById('ref-count').innerText = userData.referrals || 0;
    loadWithdrawHistory();
}

// AD LOGIC
function handleAdClick(type) {
    const now = Date.now();
    if (userData.clicks >= 10 && (now - userData.lastClick) < 300000) {
        alert("Wait 5 minutes for cooldown!");
        return;
    }

    // Monetag Interstitial Logic
    if (Math.random() > 0.5) {
        if (typeof show_10555663 === 'function') show_10555663();
    } else {
        if (typeof show_10555746 === 'function') show_10555746();
    }

    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    isWatching = true;
    let timeLeft = 20;
    document.getElementById('ad-overlay').style.display = 'flex';
    document.getElementById('ad-timer-container').classList.remove('hidden');
    document.getElementById('claim-area').classList.add('hidden');
    
    adTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(adTimerInterval);
            document.getElementById('ad-timer-container').classList.add('hidden');
            document.getElementById('claim-area').classList.remove('hidden');
        }
    }, 1000);
}

function claimReward() {
    const reward = 0.00014;
    document.getElementById('rewardSound').play();
    
    let newClicks = (userData.clicks || 0) + 1;
    db.ref('users/' + userId).update({
        balance: (userData.balance || 0) + reward,
        clicks: newClicks,
        lastClick: Date.now()
    });

    if (userData.referredBy) {
        db.ref('users/' + userData.referredBy + '/balance').transaction(b => (b || 0) + (reward * 0.12));
    }

    document.getElementById('ad-overlay').style.display = 'none';
    isWatching = false;
    showSection('tasks', document.querySelectorAll('.nav-btn')[0]); // Back to tasks
}

// Security: Pause on minimize
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isWatching) {
        isWatching = false;
        clearInterval(adTimerInterval);
        document.getElementById('ad-overlay').style.display = 'none';
        alert("Ad paused. Start over!");
    }
});

// ADMIN PANEL LOGIC
function loadAdminPanel() {
    // Load Pending Withdrawals
    db.ref('withdrawals').orderByChild('status').equalTo('pending').on('value', snap => {
        const div = document.getElementById('admin-withdrawals');
        div.innerHTML = "";
        snap.forEach(c => {
            const r = c.val();
            div.innerHTML += `
                <div class="p-3 glass rounded-xl text-[11px]">
                    <p>User: @${r.username} | <b>${r.amount} USDT</b></p>
                    <p class="text-gray-400">Method: ${r.method} | Address: ${r.address}</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="processWd('${c.key}', 'approved')" class="bg-green-600 flex-1 py-1 rounded">Approve</button>
                        <button onclick="processWd('${c.key}', 'denied')" class="bg-red-600 flex-1 py-1 rounded">Deny</button>
                    </div>
                </div>`;
        });
    });

    // Load User Management
    db.ref('users').on('value', snap => {
        const div = document.getElementById('admin-users');
        div.innerHTML = "";
        snap.forEach(c => {
            const u = c.val();
            const uid = c.key;
            if (uid == ADMIN_ID) return;
            div.innerHTML += `
                <div class="flex justify-between items-center p-2 glass border-l-4 ${u.isBanned ? 'border-red-600' : 'border-green-600'} text-[10px]">
                    <span>@${u.username} | ${u.balance.toFixed(4)} USDT</span>
                    <button onclick="toggleBan('${uid}', ${u.isBanned})" class="${u.isBanned ? 'bg-green-600' : 'bg-red-600'} px-2 py-1 rounded">
                        ${u.isBanned ? 'UNBAN' : 'BAN'}
                    </button>
                </div>`;
        });
    });
}

window.processWd = (key, status) => {
    if (status === 'denied') {
        db.ref('withdrawals/' + key).once('value', s => {
            db.ref('users/' + s.val().userId + '/balance').transaction(b => b + s.val().amount);
        });
    }
    db.ref('withdrawals/' + key).update({ status });
};

window.toggleBan = (targetId, currentStatus) => {
    db.ref('users/' + targetId).update({ isBanned: !currentStatus });
};

// Wallet Functions
function requestWithdraw() {
    if (userData.balance < 0.02) return alert("Min 0.02 USDT required");
    const method = document.getElementById('wd-method').value;
    const address = document.getElementById('wd-address').value;
    if (!address) return alert("Enter address");

    const key = db.ref('withdrawals').push().key;
    db.ref('withdrawals/' + key).set({
        userId, username, method, address, amount: userData.balance, status: 'pending', timestamp: Date.now()
    });
    db.ref('users/' + userId + '/balance').set(0);
}

function loadWithdrawHistory() {
    db.ref('withdrawals').orderByChild('userId').equalTo(userId).on('value', snap => {
        const div = document.getElementById('wd-history');
        div.innerHTML = "";
        snap.forEach(c => {
            const w = c.val();
            div.innerHTML += `<div class="flex justify-between p-2 glass rounded mb-1"><span>${w.method} - ${w.amount.toFixed(4)}</span><b>${w.status.toUpperCase()}</b></div>`;
        });
    });
}

function applyReferral() {
    const code = document.getElementById('referral-input').value.trim();
    if (userData.referredBy) return alert("Already referred");
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const upline = Object.keys(snap.val())[0];
            if (upline === userId) return;
            db.ref('users/' + userId).update({ referredBy: upline });
            db.ref('users/' + upline + '/referrals').transaction(r => (r || 0) + 1);
            alert("Referral Applied!");
        }
    });
}

function updateTheme() {
    const bg = document.getElementById('bg-picker').value;
    const accent = document.getElementById('accent-picker').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--accent-color', accent);
}

function trackOnline() {
    const ref = db.ref('online/' + userId);
    ref.set(true); ref.onDisconnect().remove();
    db.ref('online').on('value', s => { document.getElementById('online-count').innerText = `Online: ${s.numChildren()}`; });
}

setInterval(() => { document.getElementById('footer-date-time').innerText = new Date().toLocaleString(); }, 1000);
initUser();
