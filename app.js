
// --- FIREBASE CONFIG ---
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

let user = null;
let timer;
let count = 20;
const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// 150 Psychological Referral Quotes
const quotes = [
    "Invite others because humans are psychologically wired to earn more in tribes.",
    "People who share opportunities are perceived as high-value leaders by their peers.",
    "The 'Reciprocity Principle' means if you give someone a way to earn, they'll want to help you back.",
    "Studies show that community-based earning reduces stress and increases long-term wealth.",
    "Mirror neurons in the brain make your friends want to copy your success. Share your link!",
    "Success is a social phenomenon. Your network is quite literally your net worth.",
    "Inviting 5 friends triggers a dopamine release associated with social leadership.",
    "Financial freedom is reached 4x faster when achieved with a group of trusted partners.",
    "The psychology of abundance dictates that the more you share, the more you attract.",
    "Social proof is the strongest motivator. When your friends see you withdraw, they will follow."
];
for(let i=11; i<=150; i++) quotes.push(`Psych-Fact #${i}: Group earning environments create 300% more consistency than solo efforts.`);

// Initialize App
window.onload = () => {
    login();
    updateClock();
    setInterval(updateClock, 1000);
    initAutoAds();
    monitorOnlineUsers();
};

function initAutoAds() {
    try {
        // Auto-show in-app ads as per requirements
        show_10555746({ 
            type: 'inApp', 
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
        });
    } catch(e) {}
}

function login() {
    let tg = localStorage.getItem('tg_username') || prompt("Telegram Username:") || "User_" + Math.floor(Math.random()*9999);
    localStorage.setItem('tg_username', tg);
    const uid = tg.replace(/\W/g, '');

    db.ref('users/' + uid).on('value', snap => {
        if (!snap.exists()) {
            const newUser = {
                username: tg, balance: 0, clicks: 0, totalIncome: 0,
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referrals: 0, refEarned: 0, banned: false, lastSeen: Date.now()
            };
            db.ref('users/' + uid).set(newUser);
        } else {
            user = snap.val();
            user.id = uid;
            if(user.banned) document.body.innerHTML = "<div class='p-20 text-red-500 font-black text-center'>ACCOUNT BANNED</div>";
            updateUI();
        }
    });

    // Update last seen for Online List every 5 seconds
    setInterval(() => {
        if(user) db.ref('users/' + user.id).update({ lastSeen: Date.now() });
    }, 5000);
}

function monitorOnlineUsers() {
    db.ref('users').on('value', snap => {
        let total = snap.numChildren();
        let onlineCount = 0;
        let onlineListHtml = '';
        let globalIncome = 0;
        const now = Date.now();

        snap.forEach(child => {
            const d = child.val();
            globalIncome += (d.totalIncome || 0);
            if (now - d.lastSeen < 15000) { // Considered online if seen in last 15s
                onlineCount++;
                onlineListHtml += `<div class="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span class="text-xs font-bold text-slate-300">@${d.username}</span>
                    <span class="text-[8px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded uppercase">Live</span>
                </div>`;
            }
        });

        document.getElementById('totalUsers').innerText = total;
        document.getElementById('onlineUsersCount').innerText = onlineCount;
        document.getElementById('onlineListContainer').innerHTML = onlineListHtml || "None online";
        document.getElementById('totalGlobalIncome').innerText = globalIncome.toFixed(4) + " USDT";
    });
}

function updateUI() {
    document.getElementById('topUsername').innerText = "@" + user.username;
    document.getElementById('userBalance').innerText = user.balance.toFixed(5);
    document.getElementById('clickCount').innerText = user.clicks || 0;
    document.getElementById('myRefCode').innerText = user.refCode;
    document.getElementById('totalRefs').innerText = user.referrals || 0;
    document.getElementById('totalRefEarned').innerText = (user.refEarned || 0).toFixed(5);
}

function startAd(type) {
    if(user.clicks >= 3000) return alert("Daily limit reached!");
    
    // Show Interstitial and Direct Link together
    show_10555663().then(() => {});
    window.open('https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca', '_blank');

    document.getElementById('adModal').classList.remove('hidden');
    count = 20;
    document.getElementById('claimBox').classList.add('hidden');
    
    timer = setInterval(() => {
        count--;
        document.getElementById('timerDisplay').innerText = count;
        if(count <= 0) {
            clearInterval(timer);
            audio.play();
            document.getElementById('claimBox').classList.remove('hidden');
        }
    }, 1000);
}

function finalizeReward() {
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

function submitWithdraw() {
    const name = document.getElementById('wdName').value;
    const email = document.getElementById('wdEmail').value;
    const acc = document.getElementById('wdAccount').value;
    if(user.balance < 0.02) return alert("Min 0.02 required");
    if(!name || !email || !acc) return alert("Fill all fields");

    db.ref('payouts').push({
        uid: user.id, username: user.username, name, email, account: acc,
        amount: 0.02, method: document.getElementById('wdMethod').value,
        status: 'pending', timestamp: Date.now(), dateStr: new Date().toLocaleString()
    });
    db.ref('users/' + user.id).update({ balance: user.balance - 0.02 });
    alert("Request Sent!");
}

function accessAdmin() {
    if(prompt("Enter Admin Key:") === "Propetas12") {
        showSection('admin');
        loadAdmin();
    } else alert("Denied");
}

function loadAdmin() {
    db.ref('payouts').on('value', snap => {
        let h = '';
        snap.forEach(c => {
            let d = c.val();
            if(d.status === 'pending') {
                h += `<div class="bg-slate-900 p-4 rounded-xl border-l-4 border-red-500 text-[10px]">
                    <div class="flex justify-between font-bold text-red-400 mb-2">
                        <span>${d.amount} USDT</span> <span>${d.method}</span>
                    </div>
                    <p>User: @${d.username} (ID: ${d.uid})</p>
                    <p>Name: ${d.name}</p>
                    <p>Email: ${d.email}</p>
                    <p>Account: ${d.account}</p>
                    <p class="text-slate-500 mt-2">${d.dateStr}</p>
                    <div class="flex gap-2 mt-3">
                        <button onclick="approveWd('${c.key}')" class="flex-1 bg-green-600 py-2 rounded font-bold">APPROVE</button>
                        <button onclick="denyWd('${c.key}')" class="flex-1 bg-slate-700 py-2 rounded font-bold">DENY</button>
                    </div>
                </div>`;
            }
        });
        document.getElementById('adminWithdrawals').innerHTML = h || "No pending requests";
    });
}

function approveWd(key) { db.ref('payouts/' + key).update({ status: 'paid' }); }
function denyWd(key) { 
    db.ref('payouts/' + key).once('value', s => {
        db.ref('users/' + s.val().uid).transaction(u => { if(u) u.balance += 0.02; return u; });
        db.ref('payouts/' + key).update({ status: 'denied' });
    });
}

function banUser() {
    const id = document.getElementById('banId').value;
    if(id) db.ref('users/' + id).update({ banned: true });
}

function bindRef() {
    const code = document.getElementById('inputRef').value.trim().toUpperCase();
    if(code === user.refCode) return alert("Cannot use own code");
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', s => {
        if(s.exists()){
            const parentId = Object.keys(s.val())[0];
            db.ref('users/' + user.id).update({ refBy: parentId });
            db.ref('users/' + parentId).transaction(u => { if(u) u.referrals = (u.referrals || 0) + 1; return u; });
            alert("Referral Linked!");
        } else alert("Invalid Code");
    });
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function closeReward() { document.getElementById('rewardModal').classList.add('hidden'); showSection('home'); }
function showSection(id) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('section-active'));
    document.getElementById(id + 'Section').classList.add('section-active');
    toggleSidebar();
}
function updateColors() {
    const bg = document.getElementById('bgPicker').value;
    const ac = document.getElementById('accentPicker').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--accent', ac);
    document.body.style.backgroundColor = bg;
}
function updateClock() { document.getElementById('footerClock').innerText = new Date().toLocaleString(); }
