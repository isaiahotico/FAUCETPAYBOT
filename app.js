
// --- FIREBASE CONFIGURATION ---
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

// State
let tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user || { id: "0000", username: "Local_User" };
let localData = null;
let adTimer = null;
let currentAdCount = 0;
const REWARD_AMT = 0.00014;

// Initialization
function init() {
    document.getElementById('user-display').innerText = `@${user.username}`;
    
    // User Data Listener
    db.ref('users/' + user.id).on('value', (snap) => {
        if (!snap.exists()) {
            registerNewUser();
        } else {
            localData = snap.val();
            updateUI();
        }
    });

    // Global Stats Listener
    db.ref('users').on('value', (snap) => {
        const users = snap.val() || {};
        const allKeys = Object.keys(users);
        document.getElementById('stat-total').innerText = allKeys.length;
        
        const now = Date.now();
        const online = allKeys.filter(k => now - (users[k].lastSeen || 0) < 300000).length;
        document.getElementById('stat-online').innerText = online;
    });

    // Heartbeat for "Online" status
    setInterval(() => {
        if (localData) db.ref('users/' + user.id).update({ lastSeen: Date.now() });
    }, 30000);

    // Date Footer
    setInterval(() => {
        const d = new Date();
        document.getElementById('f-date').innerText = d.toLocaleDateString();
        document.getElementById('f-time').innerText = d.toLocaleTimeString();
    }, 1000);
}

function registerNewUser() {
    const code = Math.floor(100000 + Math.random() * 900000);
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
        colors: { bg: '#0f172a', accent: '#3b82f6' }
    };
    db.ref('users/' + user.id).set(data);
}

// --- AD LOGIC ---
function triggerAd(type) {
    const now = Date.now();
    if (localData.lastAdTime && now - localData.lastAdTime < 300000 && currentAdCount >= 10) {
        alert("Cooldown! Wait 5 minutes.");
        return;
    }

    // Adterra Script
    if (typeof show_10555663 === 'function') show_10555663();
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    startCounter();
}

function startCounter() {
    let timeLeft = 20;
    document.getElementById('ad-overlay').style.display = 'flex';
    document.getElementById('claim-btn').classList.add('hidden');
    document.getElementById('ad-hint').innerText = "Watching Advertisement...";
    
    adTimer = setInterval(() => {
        if (document.hidden) {
            document.getElementById('ad-hint').innerText = "PAUSED! RETURN TO APP";
            return;
        }

        timeLeft--;
        document.getElementById('timer-num').innerText = timeLeft;
        document.getElementById('ad-hint').innerText = "Watching Advertisement...";

        if (timeLeft <= 0) {
            clearInterval(adTimer);
            document.getElementById('snd-finish').play();
            document.getElementById('claim-btn').classList.remove('hidden');
            document.getElementById('ad-hint').innerText = "Ad Finished!";
        }
    }, 1000);
}

function processClaim() {
    const now = Date.now();
    currentAdCount++;
    
    // FIX: Manual path update to ensure balance credits
    const userRef = db.ref('users/' + user.id);
    userRef.once('value').then(snap => {
        const d = snap.val();
        let newBalance = (parseFloat(d.balance) || 0) + REWARD_AMT;
        let newTotal = (parseFloat(d.totalEarned) || 0) + REWARD_AMT;
        
        let updates = {
            balance: newBalance,
            totalEarned: newTotal
        };

        if (currentAdCount >= 10) {
            updates.lastAdTime = now;
            currentAdCount = 0;
        }

        userRef.update(updates).then(() => {
            document.getElementById('ad-overlay').style.display = 'none';
            alert(`CONGRATULATIONS!\n0.00014 USDT credited.\nKeep inviting to earn more!`);
            
            // Referral Bonus 12%
            if (d.referredBy) {
                const bonus = REWARD_AMT * 0.12;
                const refRef = db.ref('users/' + d.referredBy);
                refRef.once('value').then(rsnap => {
                    if (rsnap.exists()) {
                        refRef.update({
                            balance: (rsnap.val().balance || 0) + bonus,
                            totalEarned: (rsnap.val().totalEarned || 0) + bonus
                        });
                    }
                });
            }
        });
    });
}

// --- WITHDRAWALS ---
function requestWithdraw() {
    const addr = document.getElementById('wd-address').value;
    const meth = document.getElementById('wd-method').value;
    const min = 0.02;

    if (localData.balance < min) return alert("Min withdraw is 0.02 USDT");
    if (!addr) return alert("Enter address");

    const wdId = db.ref('withdrawals').push().key;
    const request = {
        id: wdId,
        uid: user.id,
        user: user.username,
        amount: min,
        method: meth,
        address: addr,
        status: 'pending',
        time: Date.now()
    };

    db.ref('withdrawals/' + wdId).set(request);
    db.ref('users/' + user.id).update({ balance: localData.balance - min });
    alert("Request sent for approval!");
}

// --- ADMIN ---
function showAdminPrompt() {
    const pw = prompt("Enter Admin Password:");
    if (pw === "Propetas12") {
        document.getElementById('admin-section').classList.remove('hidden');
        loadAdminData();
    } else {
        alert("Wrong Password");
    }
}

function loadAdminData() {
    db.ref('withdrawals').on('value', snap => {
        const penDiv = document.getElementById('admin-pending');
        const appDiv = document.getElementById('admin-approved');
        penDiv.innerHTML = "";
        appDiv.innerHTML = "";
        
        const data = snap.val();
        for (let key in data) {
            const w = data[key];
            const html = `
                <div class="glass p-3 rounded-lg text-[10px]">
                    ${w.user} | ${w.method} | ${w.amount} USDT<br>
                    <span class="text-blue-400">${w.address}</span>
                    ${w.status === 'pending' ? `
                        <div class="mt-2 flex gap-2">
                            <button onclick="handleWithdraw('${key}', 'approved')" class="bg-green-600 px-3 py-1 rounded">Approve</button>
                            <button onclick="handleWithdraw('${key}', 'denied')" class="bg-red-600 px-3 py-1 rounded">Deny</button>
                        </div>
                    ` : ''}
                </div>`;
            
            if (w.status === 'pending') penDiv.innerHTML += html;
            else if (w.status === 'approved') appDiv.innerHTML += html;
        }
    });
}

window.handleWithdraw = function(id, status) {
    db.ref('withdrawals/' + id).update({ status: status });
    if (status === 'denied') {
        db.ref('withdrawals/' + id).once('value', snap => {
            const w = snap.val();
            db.ref('users/' + w.uid).once('value', usnap => {
                db.ref('users/' + w.uid).update({ balance: (usnap.val().balance || 0) + w.amount });
            });
        });
    }
};

// --- HELPERS ---
function applyReferral() {
    const code = parseInt(document.getElementById('ref-input').value);
    if (code === localData.myRefCode) return alert("Cannot refer yourself");
    if (localData.referredBy) return alert("Already applied a code");

    db.ref('users').orderByChild('myRefCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const parentId = Object.keys(snap.val())[0];
            db.ref('users/' + user.id).update({ referredBy: parentId });
            db.ref('users/' + parentId).update({ referrals: (snap.val()[parentId].referrals || 0) + 1 });
            alert("Code applied!");
        } else {
            alert("Invalid code");
        }
    });
}

function updateUI() {
    document.getElementById('balance').innerText = localData.balance.toFixed(5);
    document.getElementById('my-ref-code').innerText = localData.myRefCode;
    document.getElementById('total-refs').innerText = localData.referrals || 0;
    
    // History
    db.ref('withdrawals').orderByChild('uid').equalTo(user.id.toString()).limitToLast(3).once('value', snap => {
        const hist = document.getElementById('user-history');
        hist.innerHTML = "";
        snap.forEach(c => {
            const v = c.val();
            hist.innerHTML += `<div class="flex justify-between border-b border-gray-800">
                <span>${v.method}</span>
                <span class="${v.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}">${v.status}</span>
            </div>`;
        });
    });

    if (localData.colors) {
        document.documentElement.style.setProperty('--bg-color', localData.colors.bg);
        document.documentElement.style.setProperty('--accent-color', localData.colors.accent);
    }
}

function saveColors() {
    const bg = document.getElementById('color-bg').value;
    const accent = document.getElementById('color-accent').value;
    db.ref('users/' + user.id + '/colors').set({ bg, accent });
}

init();
