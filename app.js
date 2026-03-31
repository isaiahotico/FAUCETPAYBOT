
// --- DATABASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;
let adTimer;
let count = 20;
const rewardBeep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// 150 Psychology/Invite Quotes
const inviteQuotes = [
    "Invite others because humans are psychologically wired to earn more in tribes.",
    "People who share opportunities are perceived as high-value leaders by their peers.",
    "Social proof is the strongest motivator. When your friends see you withdraw, they will follow.",
    "Financial freedom is reached 4x faster when achieved with a community of partners.",
    "The psychology of abundance dictates that the more you share, the more you attract.",
    "Dopamine is released not just when we earn, but when we see progress in our network.",
    "Inviting 5 friends triggers a sense of social authority and belonging.",
    "Mirror neurons in the brain make your friends want to mimic your digital success.",
    "Wealth is not just what you earn, but how many people you help earn along the way.",
    "Shared successes create stronger neurological bonds than solo achievements."
];
for(let i=11; i<=155; i++) inviteQuotes.push(`Community Growth Tip #${i}: Sharing your invite code triggers the 'Law of Reciprocity' in your friends.`);

// App Startup
window.onload = () => {
    login();
    updateClock();
    setInterval(updateClock, 1000);
    handleInAppAds();
    setInterval(onlinePresenceTicker, 1000);
};

function onlinePresenceTicker() {
    if(currentUser) db.ref('users/' + currentUser.id).update({ lastSeen: Date.now() });
    updateOnlineList();
}

function login() {
    let tg = localStorage.getItem('tg_username') || prompt("Telegram Username:") || "User_" + Math.random().toString(36).substring(7);
    localStorage.setItem('tg_username', tg);
    const uid = tg.replace(/\W/g, '');

    db.ref('users/' + uid).on('value', snap => {
        if (!snap.exists()) {
            const newUser = {
                username: tg, balance: 0, clicks: 0, totalIncome: 0,
                refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referrals: 0, refEarned: 0, banned: false, lastSeen: Date.now(), lastBatch: 0
            };
            db.ref('users/' + uid).set(newUser);
        } else {
            currentUser = snap.val();
            currentUser.id = uid;
            if(currentUser.banned) document.body.innerHTML = "<h1 style='color:red; text-align:center; padding:100px;'>ACCOUNT BANNED</h1>";
            updateUI();
        }
    });

    db.ref('users').on('value', snap => {
        let total = snap.numChildren();
        let income = 0;
        snap.forEach(c => { income += (c.val().totalIncome || 0); });
        document.getElementById('totalUsers').innerText = total;
        document.getElementById('totalGlobalIncome').innerText = income.toFixed(4) + " USDT";
    });
}

function handleInAppAds() {
    const lastShow = localStorage.getItem('inAppLast');
    const now = Date.now();
    if (!lastShow || now - lastShow > 180000) { // 3 Minutes Cooldown
        // Show 2 ads
        setTimeout(() => {
            try { show_10555746(); } catch(e) { console.error("Ad SDK 1 failed:", e); }
        }, 5000);
        setTimeout(() => {
            try { show_10555727(); } catch(e) { console.error("Ad SDK 2 failed:", e); }
        }, 35000);
        localStorage.setItem('inAppLast', now);
    }
}

function updateUI() {
    document.getElementById('topUsername').innerText = "@" + currentUser.username;
    document.getElementById('userBalance').innerText = (currentUser.balance || 0).toFixed(5);
    document.getElementById('clickCount').innerText = currentUser.clicks || 0;
    document.getElementById('myRefCode').innerText = currentUser.refCode;
    document.getElementById('totalRefs').innerText = currentUser.referrals || 0;
    document.getElementById('totalRefEarned').innerText = (currentUser.refEarned || 0).toFixed(5);
    
    // Batch Cooldown Logic (10 clicks)
    if(currentUser.clicks > 0 && currentUser.clicks % 10 === 0) {
        let diff = Date.now() - currentUser.lastBatch;
        if(diff < 300000) { // 5 minutes cooldown
            document.getElementById('cooldownText').classList.remove('hidden');
        } else {
            document.getElementById('cooldownText').classList.add('hidden');
        }
    } else {
        document.getElementById('cooldownText').classList.add('hidden');
    }
    loadWithdrawHistory();
}

function startAd() {
    if(currentUser.clicks >= 3000) return alert("Daily limit reached!");
    
    // Check for the 10-click batch cooldown
    if (currentUser.clicks > 0 && currentUser.clicks % 10 === 0) {
        if (Date.now() - currentUser.lastBatch < 300000) { // 5 minutes cooldown
            return alert("Please wait a few minutes before starting the next batch.");
        }
    }

    // Random Interstitial Ad
    const adSDKs = [
        () => show_10555746(), // Zone 10555746
        () => show_10555727()  // Zone 10555727
    ];
    const randomAd = adSDKs[Math.floor(Math.random() * adSDKs.length)];
    try {
        randomAd(); // Execute the chosen ad function
    } catch (e) {
        console.error("Ad SDK execution failed:", e);
        // Optionally, handle the error or show a fallback message
    }

    // Open the direct link
    window.open('https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca', '_blank');

    document.getElementById('adModal').classList.remove('hidden');
    count = 20;
    document.getElementById('claimBtn').classList.add('hidden'); // Hide button initially
    document.getElementById('timerDisplay').innerText = count; // Ensure timer starts at 20

    adTimer = setInterval(() => {
        count--;
        document.getElementById('timerDisplay').innerText = count;
        if(count <= 0) {
            clearInterval(adTimer);
            rewardBeep.play();
            document.getElementById('claimBtn').classList.remove('hidden'); // Make button clickable
        }
    }, 1000);
}

function finishTask() {
    const reward = 0.00014;
    let newBatchTime = currentUser.lastBatch;
    const currentClicks = currentUser.clicks || 0;

    // Check if this click completes a batch of 10
    if ((currentClicks + 1) % 10 === 0) {
        newBatchTime = Date.now(); // Reset the batch timer
    }

    db.ref('users/' + currentUser.id).update({
        balance: (currentUser.balance || 0) + reward,
        totalIncome: (currentUser.totalIncome || 0) + reward,
        clicks: currentClicks + 1,
        lastBatch: newBatchTime
    });

    // Referral Bonus 12%
    if(currentUser.refBy) {
        db.ref('users/' + currentUser.refBy).once('value', s => {
            if(s.exists()){
                db.ref('users/' + currentUser.refBy).update({
                    balance: (s.val().balance || 0) + (reward * 0.12),
                    refEarned: (s.val().refEarned || 0) + (reward * 0.12),
                    totalIncome: (s.val().totalIncome || 0) + (reward * 0.12)
                });
            }
        });
    }

    document.getElementById('adModal').classList.add('hidden');
    document.getElementById('quoteText').innerText = inviteQuotes[Math.floor(Math.random()*inviteQuotes.length)];
    document.getElementById('quoteModal').classList.remove('hidden');
}

function updateOnlineList() {
    db.ref('users').once('value', snap => {
        let count = 0;
        let html = '';
        const now = Date.now();
        snap.forEach(c => {
            let u = c.val();
            // Consider user online if lastSeen is within the last 10 seconds
            if(now - (u.lastSeen || 0) < 10000) {
                count++;
                html += `<div class="flex items-center justify-between bg-black p-4 rounded-2xl border border-zinc-800">
                    <span class="text-xs font-bold">@${u.username}</span>
                    <span class="status-online"></span>
                </div>`;
            }
        });
        document.getElementById('onlineUsersCount').innerText = count;
        document.getElementById('onlineList').innerHTML = html;
    });
}

function requestWithdraw() {
    const name = document.getElementById('wdName').value;
    const email = document.getElementById('wdEmail').value;
    const acc = document.getElementById('wdAccount').value;
    if((currentUser.balance || 0) < 0.02) return alert("Insufficient balance (Min 0.02 USDT)");
    if(!name || !email || !acc) return alert("Please fill in all required fields");

    db.ref('payouts').push({
        uid: currentUser.id, user: currentUser.username, name, email, acc,
        amount: 0.02, method: document.getElementById('wdMethod').value,
        status: 'pending', time: Date.now(), date: new Date().toLocaleString()
    });
    db.ref('users/' + currentUser.id).update({ balance: (currentUser.balance || 0) - 0.02 });
    alert("Payout requested successfully!");
}

function loadWithdrawHistory() {
    db.ref('payouts').orderByChild('uid').equalTo(currentUser.id).on('value', snap => {
        let h = '';
        snap.forEach(c => {
            let d = c.val();
            h += `<div class="bg-zinc-900 p-3 rounded-xl flex justify-between text-[10px] border border-zinc-800">
                <span>${d.method} • 0.02 USDT</span>
                <span class="${d.status=='pending'?'text-yellow-500':'text-green-500'} font-bold uppercase">${d.status}</span>
            </div>`;
        });
        document.getElementById('wdHistory').innerHTML = h;
    });
}

// Admin Functions
function accessAdmin() {
    if(prompt("Enter Admin Key:") === "Propetas12") { // Replace "Propetas12" with your actual secure password
        showSection('admin');
        db.ref('payouts').on('value', snap => {
            let h = '';
            snap.forEach(c => {
                let d = c.val();
                if(d.status === 'pending') {
                    h += `<div class="bg-zinc-900 p-5 rounded-2xl border-l-4 border-red-600 text-[11px] space-y-1">
                        <div class="flex justify-between font-black text-white"><span>${d.amount} USDT</span><span>${d.method}</span></div>
                        <p>User: @${d.user} (ID: ${d.uid})</p>
                        <p>Name: ${d.name}</p><p>Email: ${d.email}</p><p>Account: ${d.acc}</p>
                        <p class="text-zinc-500 pt-2">${d.date}</p>
                        <div class="flex gap-2 pt-4">
                            <button onclick="updateWd('${c.key}', 'approved')" class="flex-1 bg-green-600 py-2 rounded-lg font-bold">APPROVE</button>
                            <button onclick="updateWd('${c.key}', 'denied')" class="flex-1 bg-zinc-800 py-2 rounded-lg font-bold">DENY</button>
                        </div>
                    </div>`;
                }
            });
            document.getElementById('adminList').innerHTML = h || "No pending requests found.";
        });
    } else {
        alert("Access Denied: Incorrect Key.");
    }
}

function updateWd(key, status) {
    if(status === 'denied') {
        // Return funds to user if denied
        db.ref('payouts/' + key).once('value', s => {
            db.ref('users/' + s.val().uid).transaction(u => { 
                if(u) u.balance = (u.balance || 0) + 0.02; 
                return u; 
            });
        });
    }
    db.ref('payouts/' + key).update({ status: status });
}

function banUser() {
    const id = document.getElementById('banId').value.trim();
    if(id) {
        if(confirm(`Are you sure you want to permanently ban user ID: ${id}?`)) {
            db.ref('users/' + id).update({ banned: true });
            alert("User banned successfully.");
        }
    } else {
        alert("Please enter a User ID to ban.");
    }
}

function bindReferral() {
    const code = document.getElementById('inputRef').value.trim().toUpperCase();
    if(code === currentUser.refCode) return alert("Cannot use your own referral code.");
    if(code.length !== 6) return alert("Referral code must be 6 characters long.");

    db.ref('users').orderByChild('refCode').equalTo(code).once('value', s => {
        if(s.exists()){
            const pid = Object.keys(s.val())[0];
            // Check if the user is already referred
            if(currentUser.refBy === pid) return alert("You are already referred by this user.");
            
            db.ref('users/' + currentUser.id).update({ refBy: pid });
            // Increment referral count for the parent user
            db.ref('users/' + pid).transaction(u => { 
                if(u) u.referrals = (u.referrals || 0) + 1; 
                return u; 
            });
            alert("Referral successfully linked!");
        } else {
            alert("Invalid referral code. Please double-check and try again.");
        }
    });
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function closeQuote() { document.getElementById('quoteModal').classList.add('hidden'); showSection('home'); }
function showSection(id) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('section-active'));
    document.getElementById(id + 'Section').classList.add('section-active');
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
}
function updateColors() {
    const bg = document.getElementById('bgCol').value;
    const accent = document.getElementById('accentCol').value;
    document.body.style.backgroundColor = bg;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--accent', accent);
}
function updateClock() { document.getElementById('fClock').innerText = new Date().toLocaleTimeString(); }
