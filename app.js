
// --- DATABASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDMGU5X7BBp-C6tIl34Uuu5N9MXAVFTn7c",
  authDomain: "paper-house-inc.firebaseapp.com",
  projectId: "paper-house-inc",
  storageBucket: "paper-house-inc.firebasestorage.app",
  messagingSenderId: "658389836376",
  appId: "1:658389836376:web:2ab1e2743c593f4ca8e02d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State Variables
let tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user || { id: "local_dev", username: "Dev_User" };
let userData = null;
let timerInterval = null;
let adClickCount = 0;
const REWARD = 0.00014;

// Initialize
function init() {
    document.getElementById('user-display').innerText = `@${user.username}`;
    
    // User Data Stream
    db.ref('users/' + user.id).on('value', (snap) => {
        if (!snap.exists()) {
            createNewUser();
        } else {
            userData = snap.val();
            renderUI();
        }
    });

    // Stats Stream
    db.ref('users').on('value', (snap) => {
        const users = snap.val() || {};
        const keys = Object.keys(users);
        document.getElementById('stat-total').innerText = keys.length;
        const onlineCount = keys.filter(k => Date.now() - (users[k].lastSeen || 0) < 300000).length;
        document.getElementById('stat-online').innerText = onlineCount;
    });

    // Heartbeat
    setInterval(() => {
        if(userData) db.ref('users/'+user.id).update({ lastSeen: Date.now() });
    }, 30000);

    // Footer Time
    setInterval(() => {
        const now = new Date();
        document.getElementById('footer-date').innerText = now.toLocaleDateString();
        document.getElementById('footer-time').innerText = now.toLocaleTimeString();
    }, 1000);
}

function createNewUser() {
    // 6-digit alphanumeric referral code
    const charSet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += charSet.charAt(Math.floor(Math.random() * charSet.length));

    const data = {
        id: user.id,
        username: user.username,
        balance: 0,
        totalEarned: 0,
        referrals: 0,
        myRefCode: code,
        referredBy: null,
        lastAdTime: 0,
        lastSeen: Date.now(),
        settings: { bg: '#0a0f1e', accent: '#3b82f6' }
    };
    db.ref('users/' + user.id).set(data);
}

// --- AD WORKFLOW ---
function startAdWorkflow(type) {
    const diff = Date.now() - (userData.lastAdTime || 0);
    if (adClickCount >= 10 && diff < 300000) {
        alert("Wait for 5 minute cooldown!");
        return;
    }

    // Trigger Adterra Interstitials
    try {
        if (typeof show_10555663 === 'function') show_10555663();
        if (typeof show_10555746 === 'function') show_10555746();
    } catch (e) { console.log("Ad Blocked or Script Error"); }

    // Open Direct Link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    // UI Timer
    document.getElementById('ad-overlay').style.display = 'flex';
    document.getElementById('claim-btn').classList.add('hidden');
    let timeLeft = 20;

    timerInterval = setInterval(() => {
        if (document.hidden) {
            document.getElementById('ad-status').innerText = "PAUSED! RETURN TO APP";
            return;
        }

        timeLeft--;
        document.getElementById('timer-num').innerText = timeLeft;
        document.getElementById('timer-bar').style.width = (timeLeft / 20 * 100) + "%";
        document.getElementById('ad-status').innerText = "Ad is Playing";

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('snd-success').play();
            document.getElementById('claim-btn').classList.remove('hidden');
            document.getElementById('ad-status').innerText = "Ad Complete!";
        }
    }, 1000);
}

function claimReward() {
    adClickCount++;
    document.getElementById('ad-overlay').style.display = 'none';

    // Transactional Update to ensure no balance loss
    const userRef = db.ref('users/' + user.id);
    userRef.transaction((current) => {
        if (current) {
            current.balance = (current.balance || 0) + REWARD;
            current.totalEarned = (current.totalEarned || 0) + REWARD;
            if (adClickCount >= 10) current.lastAdTime = Date.now();
        }
        return current;
    }, (error, committed) => {
        if (committed) {
            alert(`SUCCESS!\n0.00014 USDT credited.\nInvite friends to get 12% extra!`);
            handleReferralBonus();
        }
    });

    if (adClickCount >= 10) adClickCount = 0;
}

function handleReferralBonus() {
    if (userData.referredBy) {
        const bonus = REWARD * 0.12;
        const refRef = db.ref('users/' + userData.referredBy);
        refRef.transaction((u) => {
            if (u) {
                u.balance = (u.balance || 0) + bonus;
                u.totalEarned = (u.totalEarned || 0) + bonus;
            }
            return u;
        });
    }
}

// --- WITHDRAWALS ---
function submitWithdraw() {
    const address = document.getElementById('wd-address').value;
    const method = document.getElementById('wd-method').value;

    if (userData.balance < 0.02) return alert("Minimum balance 0.02 USDT required!");
    if (!address) return alert("Please enter wallet address!");

    const wdId = db.ref('withdrawals').push().key;
    const wdData = {
        id: wdId,
        uid: user.id,
        user: user.username,
        amount: 0.02,
        method: method,
        address: address,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref('withdrawals/' + wdId).set(wdData);
    db.ref('users/' + user.id).update({ balance: userData.balance - 0.02 });
    alert("Withdrawal request submitted!");
}

// --- ADMIN FUNCTIONS ---
function openAdmin() {
    const pass = prompt("Enter Admin Password:");
    if (pass === "Propetas12") {
        document.getElementById('admin-panel').classList.remove('hidden');
        loadAdminRecords();
    } else {
        alert("Access Denied");
    }
}

function closeAdmin() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function loadAdminRecords() {
    db.ref('withdrawals').on('value', (snap) => {
        const penDiv = document.getElementById('admin-pending');
        const appDiv = document.getElementById('admin-approved');
        penDiv.innerHTML = ""; appDiv.innerHTML = "";
        
        snap.forEach(child => {
            const w = child.val();
            const card = `
                <div class="bg-gray-900 p-4 rounded-xl text-[10px]">
                    <b>${w.user}</b> | ${w.method} | ${w.amount} USDT<br>
                    <span class="text-blue-500">${w.address}</span>
                    ${w.status === 'pending' ? `
                        <div class="mt-2 flex gap-2">
                            <button onclick="updateWithdraw('${w.id}', 'approved')" class="bg-green-600 px-3 py-1 rounded">Approve</button>
                            <button onclick="updateWithdraw('${w.id}', 'denied')" class="bg-red-600 px-3 py-1 rounded">Deny</button>
                        </div>
                    ` : ''}
                </div>`;
            
            if (w.status === 'pending') penDiv.innerHTML += card;
            else if (w.status === 'approved') appDiv.innerHTML += card;
        });
    });
}

window.updateWithdraw = function(id, status) {
    db.ref('withdrawals/' + id).update({ status: status });
    if (status === 'denied') {
        db.ref('withdrawals/' + id).once('value', s => {
            const data = s.val();
            db.ref('users/' + data.uid).transaction(u => {
                if(u) u.balance += data.amount;
                return u;
            });
        });
    }
};

// --- SYSTEM HELPERS ---
function applyRefCode() {
    const code = document.getElementById('ref-input').value.trim().toUpperCase();
    if (code === userData.myRefCode) return alert("Can't refer yourself!");
    if (userData.referredBy) return alert("Referral already applied!");

    db.ref('users').orderByChild('myRefCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const parentId = Object.keys(snap.val())[0];
            db.ref('users/' + user.id).update({ referredBy: parentId });
            db.ref('users/' + parentId).transaction(u => {
                if(u) u.referrals = (u.referrals || 0) + 1;
                return u;
            });
            alert("Referral Applied!");
        } else {
            alert("Invalid Code!");
        }
    });
}

function renderUI() {
    document.getElementById('balance').innerText = userData.balance.toFixed(5);
    document.getElementById('my-ref-code').innerText = userData.myRefCode;
    document.getElementById('total-refs').innerText = userData.referrals || 0;

    // Local History
    db.ref('withdrawals').orderByChild('uid').equalTo(user.id.toString()).limitToLast(3).once('value', snap => {
        const hist = document.getElementById('user-history');
        hist.innerHTML = "";
        snap.forEach(c => {
            const v = c.val();
            hist.innerHTML += `<div class="flex justify-between text-[10px] bg-white/5 p-2 rounded">
                <span>${v.method}</span>
                <span class="${v.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}">${v.status.toUpperCase()}</span>
            </div>`;
        });
    });

    // Cooldown UI
    const diff = Date.now() - (userData.lastAdTime || 0);
    if (diff < 300000) {
        document.getElementById('cooldown-box').classList.remove('hidden');
        const rem = Math.ceil((300000 - diff) / 1000);
        document.getElementById('cooldown-timer').innerText = `${Math.floor(rem/60)}:${(rem%60).toString().padStart(2,'0')}`;
    } else {
        document.getElementById('cooldown-box').classList.add('hidden');
    }

    if (userData.settings) {
        document.documentElement.style.setProperty('--bg-p', userData.settings.bg);
        document.documentElement.style.setProperty('--accent-p', userData.settings.accent);
    }
}

function updateColors() {
    const bg = document.getElementById('col-bg').value;
    const acc = document.getElementById('col-accent').value;
    db.ref('users/' + user.id + '/settings').set({ bg, accent: acc });
}

init();
