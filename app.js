
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

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let user = null;
let adTimer;
let count = 20;
const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// 150 Psychological Quotes
const quotes = [
    "Wealth is the ability to fully experience life.",
    "Small consistent wins lead to massive financial freedom.",
    "Group psychology shows that sharing opportunities triples retention rates.",
    "Dopamine is released not just when we earn, but when we see progress.",
    "Your network represents your future net worth.",
    "Financial success is 80% behavior and 20% knowledge.",
    "Consistency creates the momentum that poverty cannot stop.",
    "The mind once stretched by a new idea never returns to its original dimensions.",
    "Don't work for money; make money work for your network.",
    "Invite others. Success is sweeter when shared with a community."
];
for(let i=11; i<=150; i++) quotes.push(`Earning Fact #${i}: People who invite 5 friends are 400% more likely to reach their first withdrawal.`);

// App Initialization
window.onload = () => {
    loginUser();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
    initAdScripts();
    updateOnlineCounter();
};

function initAdScripts() {
    try {
        show_10555746({ 
            type: 'inApp', 
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
        });
    } catch(e) {}
}

function loginUser() {
    let tg = localStorage.getItem('tg_user') || prompt("Telegram Username:") || "Guest";
    localStorage.setItem('tg_user', tg);
    const uid = tg.replace(/\W/g, '');

    db.ref('users/' + uid).on('value', snap => {
        if (!snap.exists()) {
            const data = {
                username: tg, balance: 0, clicks: 0, 
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referrals: 0, refEarned: 0, banned: false, totalIncome: 0
            };
            db.ref('users/' + uid).set(data);
        } else {
            user = snap.val();
            user.id = uid;
            if(user.banned) document.body.innerHTML = "<h1 style='color:red; text-align:center; padding:100px;'>ACCOUNT BANNED</h1>";
            updateUI();
        }
    });

    // Global Stats
    db.ref('users').on('value', snap => {
        let totalUsers = snap.numChildren();
        let globalIncome = 0;
        snap.forEach(c => { globalIncome += (c.val().totalIncome || 0); });
        
        document.getElementById('totalUsers').innerText = totalUsers.toLocaleString();
        document.getElementById('totalGlobalIncome').innerText = globalIncome.toFixed(4) + " USDT";
    });
}

function updateOnlineCounter() {
    setInterval(() => {
        // Simulating real-time movement based on total users
        let base = parseInt(document.getElementById('totalUsers').innerText) || 10;
        let online = Math.floor(base * 0.1) + Math.floor(Math.random() * 10);
        document.getElementById('onlineUsers').innerText = online;
    }, 1000);
}

function updateUI() {
    document.getElementById('topUsername').innerText = "@" + user.username;
    document.getElementById('userBalance').innerText = user.balance.toFixed(5);
    document.getElementById('clickCount').innerText = user.clicks || 0;
    document.getElementById('myRefCode').innerText = user.refCode;
    document.getElementById('totalRefs').innerText = user.referrals || 0;
    document.getElementById('totalRefEarned').innerText = (user.refEarned || 0).toFixed(5);
    loadWithdrawHistory();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

function showSection(id) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('section-active'));
    document.getElementById(id + 'Section').classList.add('section-active');
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
}

function accessAdmin() {
    if(prompt("System Password:") === "Propetas12") {
        showSection('admin');
        loadAdminPanel();
    } else alert("Invalid Credentials");
}

// Tasks & Ads
function startTask(type) {
    if(user.clicks >= 3000) return alert("Daily limit of 3000 reached!");
    
    show_10555663().then(() => {}); 
    window.open('https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca', '_blank');

    document.getElementById('adModal').classList.remove('hidden');
    count = 20;
    document.getElementById('claimContainer').classList.add('hidden');
    
    adTimer = setInterval(() => {
        count--;
        document.getElementById('timerDisplay').innerText = count;
        if(count <= 0) {
            clearInterval(adTimer);
            beep.play();
            document.getElementById('claimContainer').classList.remove('hidden');
            document.getElementById('timerRing').style.animation = "none";
        }
    }, 1000);
}

function claimReward() {
    const reward = 0.00014;
    db.ref('users/' + user.id).update({
        balance: user.balance + reward,
        totalIncome: (user.totalIncome || 0) + reward,
        clicks: user.clicks + 1
    });

    if(user.refBy) {
        db.ref('users/' + user.refBy).once('value', s => {
            if(s.exists()){
                db.ref('users/' + user.refBy).update({
                    balance: s.val().balance + (reward * 0.12),
                    refEarned: (s.val().refEarned || 0) + (reward * 0.12),
                    totalIncome: (s.val().totalIncome || 0) + (reward * 0.12)
                });
            }
        });
    }

    document.getElementById('adModal').classList.add('hidden');
    document.getElementById('quoteText').innerText = quotes[Math.floor(Math.random()*quotes.length)];
    document.getElementById('rewardModal').classList.remove('hidden');
}

function closeReward() {
    document.getElementById('rewardModal').classList.add('hidden');
    showSection('home');
}

// Withdrawals
function requestWithdraw() {
    const amt = 0.02;
    const name = document.getElementById('wdName').value;
    const email = document.getElementById('wdEmail').value;
    const acc = document.getElementById('wdAccount').value;
    
    if(user.balance < amt) return alert("Minimum 0.02 USDT required!");
    if(!name || !email || !acc) return alert("Please fill all fields!");

    db.ref('payouts').push({
        uid: user.id, username: user.username,
        fullName: name, email: email,
        amount: amt, method: document.getElementById('wdMethod').value,
        account: acc, status: 'pending', date: new Date().toLocaleString()
    });

    db.ref('users/' + user.id).update({ balance: user.balance - amt });
    alert("Withdrawal Requested Successfully!");
}

function loadWithdrawHistory() {
    db.ref('payouts').orderByChild('uid').equalTo(user.id).on('value', snap => {
        let html = '';
        snap.forEach(c => {
            let d = c.val();
            html += `<div class="bg-slate-900 p-3 rounded-xl flex justify-between border border-slate-800 text-[10px]">
                <span>${d.method} - ${d.amount} USDT</span>
                <span class="${d.status=='pending'?'text-yellow-500':'text-green-500'} font-bold uppercase">${d.status}</span>
            </div>`;
        });
        document.getElementById('wdHistory').innerHTML = html;
    });
}

// Admin Operations
function loadAdminPanel() {
    db.ref('payouts').on('value', snap => {
        let html = '';
        snap.forEach(c => {
            let d = c.val();
            if(d.status === 'pending') {
                html += `<div class="admin-card p-4 rounded-2xl text-xs space-y-1">
                    <div class="flex justify-between font-black text-red-400">
                        <span>${d.amount} USDT</span>
                        <span>${d.method}</span>
                    </div>
                    <p><b>Name:</b> ${d.fullName}</p>
                    <p><b>Email:</b> ${d.email}</p>
                    <p><b>Account:</b> ${d.account}</p>
                    <p><b>User:</b> @${d.username} (ID: ${d.uid})</p>
                    <p class="text-[9px] text-slate-500">${d.date}</p>
                    <div class="flex gap-2 mt-3">
                        <button onclick="manageWd('${c.key}', 'approved')" class="flex-1 bg-green-600 py-2 rounded-lg font-bold">APPROVE</button>
                        <button onclick="manageWd('${c.key}', 'denied')" class="flex-1 bg-slate-700 py-2 rounded-lg font-bold">DENY</button>
                    </div>
                </div>`;
            }
        });
        document.getElementById('adminWithdrawals').innerHTML = html || "No pending requests.";
    });
}

function manageWd(key, status) {
    if(status === 'denied') {
        db.ref('payouts/' + key).once('value', s => {
            db.ref('users/' + s.val().uid).transaction(u => {
                if(u) u.balance += s.val().amount;
                return u;
            });
        });
    }
    db.ref('payouts/' + key).update({ status: status });
}

function processBan() {
    const bid = document.getElementById('banId').value;
    if(bid) {
        db.ref('users/' + bid).update({ banned: true });
        alert("Target Banned!");
    }
}

// Helper Functions
function submitReferral() {
    const code = document.getElementById('inputRef').value.trim().toUpperCase();
    if(code === user.refCode) return alert("Self-referral not allowed!");
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', s => {
        if(s.exists()){
            const parent = Object.keys(s.val())[0];
            db.ref('users/' + user.id).update({ refBy: parent });
            db.ref('users/' + parent).transaction(u => {
                if(u) u.referrals = (u.referrals || 0) + 1;
                return u;
            });
            alert("Referral Linked!");
        } else alert("Invalid Referral Code");
    });
}

function updateLiveClock() {
    document.getElementById('footerClock').innerText = new Date().toLocaleTimeString();
}
