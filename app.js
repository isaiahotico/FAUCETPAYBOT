
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
let userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "guest_" + Math.floor(1000 + Math.random() * 9000);
let username = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : "GuestUser";
let userData = {};
const ADMIN_ID = 589427984313;

// State Variables
let isWatching = false;
let adTimerInterval;

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

    db.ref('users').on('value', snap => {
        document.getElementById('total-users').innerText = snap.numChildren();
    });
}

function updateUI() {
    document.getElementById('user-balance').innerText = (userData.balance || 0).toFixed(5);
    document.getElementById('my-ref-code').innerText = userData.refCode;
    document.getElementById('ref-count').innerText = userData.referrals || 0;
    loadWithdrawHistory();
}

// AD LOGIC
function startAdTimer(type) {
    const now = Date.now();
    if (userData.clicks >= 10 && (now - userData.lastClick) < 300000) {
        const remaining = Math.ceil((300000 - (now - userData.lastClick)) / 1000 / 60);
        const cdMsg = document.getElementById('cooldown-timer');
        cdMsg.innerText = `Cooldown: Please wait ${remaining} minutes`;
        cdMsg.classList.remove('hidden');
        return;
    }

    // Direct Ad Link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");
    
    // Trigger Script Ads
    if(typeof show_10555663 === 'function') show_10555663();
    if(typeof show_10555746 === 'function') show_10555746();

    // Reset Overlay
    document.getElementById('ad-timer-container').classList.remove('hidden');
    document.getElementById('claim-area').classList.add('hidden');
    document.getElementById('ad-overlay').style.display = 'flex';
    document.getElementById('ad-title').innerText = type;

    isWatching = true;
    let timeLeft = 20;
    const circle = document.getElementById('progress-circle');

    adTimerInterval = setInterval(() => {
        if (!isWatching) {
            clearInterval(adTimerInterval);
            return;
        }
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        
        // Update Circle Progress
        const offset = 440 - (timeLeft / 20) * 440;
        circle.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            clearInterval(adTimerInterval);
            showClaimButton();
        }
    }, 1000);
}

function showClaimButton() {
    document.getElementById('ad-timer-container').classList.add('hidden');
    document.getElementById('claim-area').classList.remove('hidden');
}

function claimReward() {
    const reward = 0.00014;
    document.getElementById('rewardSound').play();

    // Increment clicks, update time
    let newClicks = (userData.clicks || 0) + 1;
    if (newClicks > 10) newClicks = 1; // Reset after cooldown cycle

    db.ref('users/' + userId).update({
        balance: (userData.balance || 0) + reward,
        totalEarned: (userData.totalEarned || 0) + reward,
        clicks: newClicks,
        lastClick: Date.now()
    });

    // Referral 12%
    if (userData.referredBy) {
        db.ref('users/' + userData.referredBy + '/balance').transaction(b => (b || 0) + (reward * 0.12));
    }

    // Close and Return
    document.getElementById('ad-overlay').style.display = 'none';
    alert("Congratulations! 0.00014 USDT added to balance. Keep inviting!");
    isWatching = false;
}

// Pause if user leaves
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isWatching) {
        isWatching = false;
        clearInterval(adTimerInterval);
        document.getElementById('ad-overlay').style.display = 'none';
        alert("Task paused. Please keep the app open to earn.");
    }
});

// Withdrawal & Admin Functions
function requestWithdraw() {
    const method = document.getElementById('wd-method').value;
    const address = document.getElementById('wd-address').value;
    const amount = userData.balance;

    if (amount < 0.02) return alert("Minimum 0.02 USDT");
    if (!address) return alert("Enter valid address");

    const wdKey = db.ref('withdrawals').push().key;
    db.ref('withdrawals/' + wdKey).set({
        userId, username, method, address, amount, status: 'pending', timestamp: Date.now()
    });
    db.ref('users/' + userId + '/balance').set(0);
}

function loadWithdrawHistory() {
    db.ref('withdrawals').orderByChild('userId').equalTo(userId).on('value', snap => {
        const div = document.getElementById('wd-history');
        div.innerHTML = "";
        snap.forEach(c => {
            const w = c.val();
            div.innerHTML += `<div class="flex justify-between p-2 bg-white/5 rounded-lg border-l-2 ${w.status === 'pending' ? 'border-yellow-500' : 'border-green-500'}">
                <span>${w.method} - ${w.amount.toFixed(4)}</span>
                <span class="font-bold">${w.status.toUpperCase()}</span>
            </div>`;
        });
    });
}

function applyReferral() {
    const code = document.getElementById('referral-input').value.trim();
    if (userData.referredBy) return alert("Already referred");
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const upline = Object.keys(snap.val())[0];
            if (upline === userId) return alert("Cannot refer self");
            db.ref('users/' + userId).update({ referredBy: upline });
            db.ref('users/' + upline + '/referrals').transaction(r => (r || 0) + 1);
            alert("Referral Code Linked!");
        }
    });
}

function checkAdmin() {
    if (userId == ADMIN_ID) {
        document.getElementById('admin-panel').classList.remove('hidden-section');
        db.ref('withdrawals').orderByChild('status').equalTo('pending').on('value', snap => {
            const container = document.getElementById('admin-requests');
            container.innerHTML = "";
            snap.forEach(c => {
                const r = c.val();
                container.innerHTML += `<div class="bg-white/10 p-3 rounded-lg">
                    <p>${r.username} (${r.method}): ${r.amount} USDT</p>
                    <p class="text-gray-400">${r.address}</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="updateWd('${c.key}','approved')" class="bg-green-600 px-3 py-1 rounded">Approve</button>
                        <button onclick="updateWd('${c.key}','denied')" class="bg-red-600 px-3 py-1 rounded">Deny</button>
                    </div>
                </div>`;
            });
        });
    }
}

window.updateWd = (key, status) => {
    if (status === 'denied') {
        db.ref('withdrawals/' + key).once('value', s => {
            db.ref('users/' + s.val().userId + '/balance').transaction(b => b + s.val().amount);
        });
    }
    db.ref('withdrawals/' + key).update({ status });
};

// UI Extras
function updateTheme() {
    const bg = document.getElementById('bg-color-picker').value;
    const accent = document.getElementById('accent-color-picker').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--accent-color', accent);
}

function trackOnline() {
    const o = db.ref('online/' + userId);
    o.set(true); o.onDisconnect().remove();
    db.ref('online').on('value', s => { document.getElementById('online-count').innerText = `Online: ${s.numChildren()}`; });
}

setInterval(() => { document.getElementById('footer-date-time').innerText = new Date().toLocaleString(); }, 1000);

initUser();
