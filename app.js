
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

// State
let tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user || { id: "test_user", username: "Guest_User" };
const ADMIN_ID = 589427984313; // Set your TG ID here

let userData = {};
let timeLeft = 20;
let timerId = null;
let adCount = 0;
const REWARD = 0.00014;
const AD_URL = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

// Elements
const balanceEl = document.getElementById('balance');
const timerDisplay = document.getElementById('timer-display');
const adOverlay = document.getElementById('ad-overlay');
const claimBtn = document.getElementById('claim-btn');

// --- INITIALIZATION ---
function init() {
    document.getElementById('user-display').innerText = `@${user.username}`;
    
    // Load User Data
    db.ref('users/' + user.id).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            registerUser();
        } else {
            userData = snapshot.val();
            updateUI();
        }
    });

    // Admin Access
    if (user.id == ADMIN_ID) {
        document.getElementById('admin-panel').classList.remove('hidden');
        loadAdminData();
    }

    // Date/Time Footer
    setInterval(updateDateTime, 1000);
}

function registerUser() {
    const refCode = Math.floor(100000 + Math.random() * 900000);
    const newUser = {
        id: user.id,
        username: user.username,
        balance: 0,
        totalEarned: 0,
        referrals: 0,
        myRefCode: refCode,
        referredBy: null,
        adClicks: 0,
        lastAdTime: 0,
        settings: { bg: '#1a1a1a', accent: '#3b82f6' }
    };
    db.ref('users/' + user.id).set(newUser);
}

// --- AD LOGIC ---
function startAdProcess(type) {
    if (adCount >= 10 && Date.now() - userData.lastAdTime < 300000) {
        alert("Cooldown active. Please wait 5 minutes.");
        return;
    }

    // Trigger Adterra Reward Interstitial
    if (typeof show_10555663 === 'function') {
        show_10555663().then(() => { console.log("Ad 1 Done"); });
    }
    
    // Open Direct Link in New Tab
    window.open(AD_URL, '_blank');

    // Show Overlay Timer
    adOverlay.style.display = 'flex';
    timeLeft = 20;
    timerDisplay.innerText = timeLeft;
    claimBtn.classList.add('hidden');
    
    startTimer();
}

function startTimer() {
    timerId = setInterval(() => {
        if (document.hidden) {
            document.getElementById('ad-status').innerText = "PAUSED! Return to app";
            return;
        }
        
        document.getElementById('ad-status').innerText = "Keep this window open!";
        timeLeft--;
        timerDisplay.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerId);
            document.getElementById('finish-sound').play();
            claimBtn.classList.remove('hidden');
            document.getElementById('ad-status').innerText = "Reward Ready!";
        }
    }, 1000);
}

function claimReward() {
    adOverlay.style.display = 'none';
    adCount++;
    
    let updates = {
        balance: userData.balance + REWARD,
        totalEarned: userData.totalEarned + REWARD,
        adClicks: (userData.adClicks || 0) + 1
    };

    if (adCount >= 10) {
        updates.lastAdTime = Date.now();
        adCount = 0;
    }

    db.ref('users/' + user.id).update(updates);

    // Referral Bonus (12%)
    if (userData.referredBy) {
        db.ref('users/' + userData.referredBy).once('value', (snap) => {
            if (snap.exists()) {
                let bonus = REWARD * 0.12;
                db.ref('users/' + userData.referredBy).update({
                    balance: snap.val().balance + bonus,
                    totalEarned: snap.val().totalEarned + bonus
                });
            }
        });
    }

    alert(`Congratulations! 0.00014 USDT credited. Keep inviting!`);
}

// --- WITHDRAWAL ---
function requestWithdrawal() {
    const amount = 0.02; // Min
    const method = document.getElementById('withdraw-method').value;
    const address = document.getElementById('withdraw-address').value;

    if (userData.balance < amount) return alert("Insufficient balance! Min 0.02 USDT");
    if (!address) return alert("Enter address!");

    const requestId = db.ref('withdrawals').push().key;
    const requestData = {
        id: requestId,
        userId: user.id,
        username: user.username,
        amount: amount,
        method: method,
        address: address,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref('withdrawals/' + requestId).set(requestData);
    db.ref('users/' + user.id).update({ balance: userData.balance - amount });
    alert("Withdrawal Requested!");
}

// --- REFERRAL SYSTEM ---
function applyReferral() {
    const code = parseInt(document.getElementById('referral-input').value);
    if (userData.referredBy) return alert("Already referred!");
    if (code == userData.myRefCode) return alert("Can't refer yourself!");

    db.ref('users').orderByChild('myRefCode').equalTo(code).once('value', (snap) => {
        if (snap.exists()) {
            const parentId = Object.keys(snap.val())[0];
            db.ref('users/' + user.id).update({ referredBy: parentId });
            db.ref('users/' + parentId).update({ referrals: (snap.val()[parentId].referrals || 0) + 1 });
            alert("Referral applied successfully!");
        } else {
            alert("Invalid code!");
        }
    });
}

// --- ADMIN FUNCTIONS ---
function loadAdminData() {
    db.ref('withdrawals').on('value', (snap) => {
        const div = document.getElementById('pending-requests');
        div.innerHTML = "";
        const data = snap.val();
        for (let key in data) {
            if (data[key].status === 'pending') {
                div.innerHTML += `
                    <div class="bg-gray-800 p-2 rounded text-xs">
                        ${data[key].username} | ${data[key].amount} | ${data[key].method}
                        <br>${data[key].address}
                        <div class="mt-1">
                            <button onclick="updateWithdrawStatus('${key}', 'approved')" class="bg-green-600 px-2 py-1 rounded">Approve</button>
                            <button onclick="updateWithdrawStatus('${key}', 'denied')" class="bg-red-600 px-2 py-1 rounded">Deny</button>
                        </div>
                    </div>
                `;
            }
        }
    });
}

window.updateWithdrawStatus = function(id, status) {
    db.ref('withdrawals/' + id).update({ status: status });
    if (status === 'denied') {
        // Refund user
        db.ref('withdrawals/' + id).once('value', (snap) => {
            const req = snap.val();
            db.ref('users/' + req.userId).once('value', (uSnap) => {
                db.ref('users/' + req.userId).update({ balance: uSnap.val().balance + req.amount });
            });
        });
    }
};

// --- UI UPDATES ---
function updateUI() {
    balanceEl.innerText = userData.balance.toFixed(5);
    document.getElementById('my-ref-code').innerText = userData.myRefCode;
    document.getElementById('total-refs').innerText = userData.referrals || 0;
    
    // Update Cooldown UI
    if (userData.lastAdTime) {
        const diff = Date.now() - userData.lastAdTime;
        if (diff < 300000) {
            document.getElementById('cooldown-box').classList.remove('hidden');
            const remaining = Math.ceil((300000 - diff) / 1000);
            document.getElementById('cooldown-timer').innerText = `${Math.floor(remaining/60)}:${(remaining%60).toString().padStart(2, '0')}`;
        } else {
            document.getElementById('cooldown-box').classList.add('hidden');
        }
    }

    // Update History
    db.ref('withdrawals').orderByChild('userId').equalTo(user.id.toString()).limitToLast(5).once('value', (snap) => {
        const hist = document.getElementById('withdraw-history');
        hist.innerHTML = "";
        snap.forEach(child => {
            const w = child.val();
            hist.innerHTML += `<div class="flex justify-between border-b border-gray-800 pb-1">
                <span>${w.method} - ${w.amount}</span>
                <span class="${w.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}">${w.status.toUpperCase()}</span>
            </div>`;
        });
    });

    // Apply saved colors
    if (userData.settings) {
        document.documentElement.style.setProperty('--bg-color', userData.settings.bg);
        document.documentElement.style.setProperty('--accent-color', userData.settings.accent);
    }
}

function updateColors() {
    const bg = document.getElementById('color-bg').value;
    const accent = document.getElementById('color-accent').value;
    db.ref('users/' + user.id + '/settings').set({ bg, accent });
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('footer-date').innerText = now.toLocaleDateString();
    document.getElementById('footer-time').innerText = now.toLocaleTimeString();
}

// Start app
init();
