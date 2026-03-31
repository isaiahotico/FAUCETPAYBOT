
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
const auth = firebase.auth();

// App State
let currentUser = null;
let timer = 20;
let adInterval;
let isAdmin = false;

// Beep Audio
const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// 1. Initialization
window.onload = () => {
    loginUser();
    updateFooterTime();
    setInterval(updateFooterTime, 1000);
    loadGlobalStats();
};

function loginUser() {
    // Simulating Telegram Username (In real TG apps, get from window.Telegram.WebApp)
    let tgUser = localStorage.getItem('tgUser') || prompt("Enter Telegram Username:") || "Guest";
    localStorage.setItem('tgUser', tgUser);
    
    // Simple ID generation for demo
    const userId = tgUser.replace(/[^a-zA-Z0-9]/g, '');
    
    db.ref('users/' + userId).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            const newUser = {
                username: tgUser,
                balance: 0,
                clicks: 0,
                lastClick: 0,
                referrals: 0,
                refEarned: 0,
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                banned: false,
                role: (tgUser === 'Admin_Paperhouse' ? 'admin' : 'user')
            };
            db.ref('users/' + userId).set(newUser);
        } else {
            currentUser = snapshot.val();
            currentUser.id = userId;
            updateUI();
            checkBanned();
        }
    });
}

function updateUI() {
    document.getElementById('topUsername').innerText = "@" + currentUser.username;
    document.getElementById('userBalance').innerText = currentUser.balance.toFixed(5) + " USDT";
    document.getElementById('clickCount').innerText = currentUser.clicks || 0;
    document.getElementById('myRefCode').innerText = currentUser.refCode;
    document.getElementById('totalRefs').innerText = currentUser.referrals || 0;
    document.getElementById('totalRefEarned').innerText = (currentUser.refEarned || 0).toFixed(5);
    
    if(currentUser.role === 'admin') {
        isAdmin = true;
        document.getElementById('adminBtn').classList.remove('hidden');
        loadAdminData();
    }
    
    loadWithdrawHistory();
}

function updateFooterTime() {
    const now = new Date();
    document.getElementById('footerDateTime').innerText = now.toLocaleString();
}

// 2. Navigation
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden-section'));
    document.getElementById(sectionId + 'Section').classList.remove('hidden-section');
    toggleSidebar();
}

// 3. Ad System Logic
function startTask(type) {
    if (currentUser.clicks >= 10) {
        const diff = Date.now() - (currentUser.lastClickTime || 0);
        if (diff < 300000) { // 5 minutes
            alert("Cooldown active! Please wait.");
            return;
        } else {
            db.ref('users/' + currentUser.id).update({ clicks: 0 });
        }
    }

    // Show AdTerra/Monetag Randomly
    show_10555663().then(() => { console.log("Ad 1 Loaded"); });
    window.open('https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca', '_blank');

    // Start Timer
    document.getElementById('adModal').classList.remove('hidden');
    timer = 20;
    document.getElementById('timerDisplay').innerText = timer;
    document.getElementById('claimBtn').classList.add('hidden');

    adInterval = setInterval(() => {
        timer--;
        document.getElementById('timerDisplay').innerText = timer;
        if (timer <= 0) {
            clearInterval(adInterval);
            beep.play();
            document.getElementById('claimBtn').classList.remove('hidden');
        }
    }, 1000);
}

function claim() {
    const reward = 0.00014;
    const newBalance = (currentUser.balance || 0) + reward;
    const newClicks = (currentUser.clicks || 0) + 1;
    
    const updateData = {
        balance: newBalance,
        clicks: newClicks,
        lastClickTime: Date.now()
    };

    db.ref('users/' + currentUser.id).update(updateData);
    
    // Handle Referral Bonus (12%)
    if(currentUser.referredBy) {
        db.ref('users/' + currentUser.referredBy).once('value', snap => {
            if(snap.exists()){
                let bonus = reward * 0.12;
                db.ref('users/' + currentUser.referredBy).update({
                    balance: snap.val().balance + bonus,
                    refEarned: (snap.val().refEarned || 0) + bonus
                });
            }
        });
    }

    document.getElementById('adModal').classList.add('hidden');
    alert(`Congratulations! You earned ${reward} USDT. Keep inviting to earn more!`);
    showSection('home');
}

// 4. Withdrawal System
function requestWithdraw() {
    const amount = 0.02; // Minimum
    const method = document.getElementById('wdMethod').value;
    const account = document.getElementById('wdAccount').value;

    if (currentUser.balance < amount) return alert("Insufficient Balance!");
    if (!account) return alert("Enter account details!");

    const request = {
        userId: currentUser.id,
        username: currentUser.username,
        amount: amount,
        method: method,
        account: account,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref('withdrawals').push(request);
    db.ref('users/' + currentUser.id).update({ balance: currentUser.balance - amount });
    alert("Request Sent!");
}

function loadWithdrawHistory() {
    db.ref('withdrawals').orderByChild('userId').equalTo(currentUser.id).on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const data = child.val();
            html += `<div class="flex justify-between border-b border-gray-700 py-1">
                <span>${data.method}</span>
                <span class="${data.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}">${data.status}</span>
            </div>`;
        });
        document.getElementById('wdHistory').innerHTML = html || 'No history yet';
    });
}

// 5. Admin Functionality
function loadAdminData() {
    db.ref('withdrawals').on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const data = child.val();
            if(data.status === 'pending') {
                html += `<div class="bg-gray-800 p-2 rounded text-xs">
                    <p>User: ${data.username} (${data.amount} USDT)</p>
                    <p>To: ${data.method} - ${data.account}</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="approveWd('${child.key}')" class="bg-green-600 px-2 rounded">Approve</button>
                        <button onclick="denyWd('${child.key}')" class="bg-red-600 px-2 rounded">Deny</button>
                    </div>
                </div>`;
            }
        });
        document.getElementById('adminWithdrawals').innerHTML = html || 'No pending requests';
    });
}

function approveWd(key) { db.ref('withdrawals/' + key).update({ status: 'approved' }); }
function denyWd(key) { 
    db.ref('withdrawals/' + key).once('value', snap => {
        const data = snap.val();
        db.ref('users/' + data.userId).transaction(user => {
            if(user) user.balance += data.amount;
            return user;
        });
        db.ref('withdrawals/' + key).update({ status: 'denied' });
    });
}

function banUser() {
    const id = document.getElementById('banUserId').value;
    if(id) db.ref('users/' + id).update({ banned: true });
}

function checkBanned() {
    if(currentUser.banned) {
        document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:50px;'>YOU ARE BANNED</h1>";
    }
}

// 6. Stats & Referrals
function loadGlobalStats() {
    db.ref('users').on('value', snap => {
        document.getElementById('totalUsers').innerText = snap.numChildren();
        document.getElementById('onlineUsers').innerText = Math.floor(snap.numChildren() * 0.3) + 1;
    });
}

function submitReferral() {
    const code = document.getElementById('inputRef').value.toUpperCase();
    if(code === currentUser.refCode) return alert("Can't use own code");

    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if(snap.exists()) {
            const parentId = Object.keys(snap.val())[0];
            db.ref('users/' + currentUser.id).update({ referredBy: parentId });
            db.ref('users/' + parentId).transaction(user => {
                if(user) user.referrals = (user.referrals || 0) + 1;
                return user;
            });
            alert("Referral bound!");
        } else {
            alert("Invalid Code");
        }
    });
}

// 7. Customization
function updateTheme() {
    const bg = document.getElementById('bgColorPicker').value;
    const accent = document.getElementById('accentColorPicker').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.body.style.backgroundColor = bg;
    document.querySelectorAll('.ad-btn').forEach(b => b.style.backgroundColor = accent);
}
