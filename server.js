const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'users.json');
const BANS_FILE = path.join(__dirname, 'banned_ips.json');

// Ensure JSON stores exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}
if (!fs.existsSync(BANS_FILE)) {
    fs.writeFileSync(BANS_FILE, JSON.stringify([]));
}

// Helper functions
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function getBannedIPs() {
    try {
        return JSON.parse(fs.readFileSync(BANS_FILE, 'utf8') || '[]');
    } catch (e) {
        return [];
    }
}

function saveBannedIPs(bans) {
    fs.writeFileSync(BANS_FILE, JSON.stringify(bans, null, 2));
}

// Middleware to check IP bans
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const bannedIps = getBannedIPs();
    if (bannedIps.includes(clientIp)) {
        return res.status(403).send('<h1>403 Forbidden - Your IP has been blocked from Phoenix.</h1>');
    }
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Music Client at /music
app.use('/music', express.static(path.join(__dirname, 'public')));

// Serve Accounts UI at /accounts
app.get('/accounts', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phoenix - Accounts</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { font-family: 'Roboto', sans-serif; background-color: #f5f5f5; }</style>
</head>
<body class="min-h-screen flex flex-col justify-between text-gray-800">
    <header class="bg-[#EF6C00] text-white p-4 shadow-md flex items-center justify-between">
        <div class="flex items-center space-x-2">
            <i class="material-icons text-3xl">play_circle_filled</i>
            <span class="text-xl font-light">Phoenix</span>
        </div>
        <span class="text-xs bg-orange-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Account Portal</span>
    </header>

    <main class="flex-1 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-gray-100">
            <div class="flex border-b border-gray-200 mb-6">
                <button id="tab-login" onclick="switchTab('login')" class="flex-1 py-3 text-center text-sm font-semibold text-[#EF6C00] border-b-2 border-[#EF6C00]">LOG IN</button>
                <button id="tab-signup" onclick="switchTab('signup')" class="flex-1 py-3 text-center text-sm font-semibold text-gray-400 border-b-2 border-transparent">REGISTER</button>
            </div>

            <form id="form-login" class="space-y-4">
                <div>
                    <label class="block text-xs font-medium text-gray-600 uppercase mb-1">Email</label>
                    <input type="email" id="login-email" required class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-[#EF6C00]">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 uppercase mb-1">Password</label>
                    <input type="password" id="login-password" required class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-[#EF6C00]">
                </div>
                <button type="submit" class="w-full py-2.5 bg-[#EF6C00] text-white font-medium rounded text-sm uppercase">Sign In</button>
            </form>

            <form id="form-signup" class="space-y-4 hidden">
                <div>
                    <label class="block text-xs font-medium text-gray-600 uppercase mb-1">Username / Display Name</label>
                    <input type="text" id="signup-name" required class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-[#EF6C00]">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 uppercase mb-1">Email</label>
                    <input type="email" id="signup-email" required class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-[#EF6C00]">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 uppercase mb-1">Password</label>
                    <input type="password" id="signup-password" required class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-[#EF6C00]">
                </div>
                <button type="submit" class="w-full py-2.5 bg-[#EF6C00] text-white font-medium rounded text-sm uppercase">Register Account</button>
            </form>
        </div>
    </main>

    <footer class="text-center py-4 text-xs text-gray-400">Phoenix &copy; 2026</footer>

    <script>
        function switchTab(t) {
            document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
            document.getElementById('form-signup').classList.toggle('hidden', t !== 'signup');
        }

        document.getElementById('form-signup').onsubmit = async (e) => {
            e.preventDefault();
            const res = await fetch('/accounts/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: document.getElementById('signup-name').value,
                    email: document.getElementById('signup-email').value,
                    password: document.getElementById('signup-password').value
                })
            });
            const d = await res.json();
            alert(res.ok ? 'Account created! Token: ' + d.token : (d.error || 'Error'));
            if (res.ok) switchTab('login');
        };

        document.getElementById('form-login').onsubmit = async (e) => {
            e.preventDefault();
            const res = await fetch('/accounts/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                })
            });
            const d = await res.json();
            if (res.ok) {
                alert('Welcome back ' + d.user.name + '! Token: ' + d.token);
                window.location.href = '/music';
            } else {
                alert(d.error || 'Login failed');
            }
        };
    </script>
</body>
</html>
    `);
});

// Admin Tokens Dashboard Endpoint at /accounts/adminlog
app.get('/accounts/adminlog', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Phoenix Admin - Tokens & Moderation</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen p-8">
    <div class="max-w-4xl mx-auto space-y-6">
        <h1 class="text-2xl font-bold text-orange-500">Phoenix - Token Inspector & Moderation</h1>
        
        <div class="bg-gray-800 p-4 rounded shadow border border-gray-700">
            <h2 class="text-lg font-semibold mb-2">Execute Command</h2>
            <p class="text-xs text-gray-400 mb-4">Type <code class="text-orange-400">BAN [TOKEN]</code> to invalidate the token, delete the session block, and IP ban the device.</p>
            
            <div class="flex space-x-2">
                <input type="text" id="command-input" placeholder="e.g. BAN tok_1710002821_a83f" class="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                <button onclick="runCommand()" class="bg-orange-600 hover:bg-orange-700 px-5 py-2 rounded text-sm font-medium">Execute</button>
            </div>
        </div>

        <div class="bg-gray-800 p-4 rounded shadow border border-gray-700">
            <h2 class="text-lg font-semibold mb-2">Active Anonymous Session Tokens</h2>
            <div id="tokens-list" class="space-y-2 text-xs font-mono">
                Loading active tokens...
            </div>
        </div>
    </div>

    <script>
        async function loadTokens() {
            const res = await fetch('/accounts/api/tokens');
            const data = await res.json();
            const list = document.getElementById('tokens-list');
            if (!data.length) {
                list.innerHTML = '<span class="text-gray-500">No active account tokens found.</span>';
                return;
            }
            list.innerHTML = data.map(t => `
                <div class="flex justify-between bg-gray-900 p-2 rounded border border-gray-700">
                    <div><span class="text-orange-400 font-bold">TOKEN:</span> ${t.token}</div>
                    <div><span class="text-gray-400">Created:</span> ${t.createdAt}</div>
                    <div><span class="text-gray-400">IP:</span> ${t.lastIp}</div>
                </div>
            `).join('');
        }

        async function runCommand() {
            const cmd = document.getElementById('command-input').value.trim();
            if (!cmd) return;

            const res = await fetch('/accounts/api/admin-action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ command: cmd })
            });
            const result = await res.json();
            alert(result.message || result.error);
            document.getElementById('command-input').value = '';
            loadTokens();
        }

        loadTokens();
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.post('/accounts/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Account already exists' });
    }

    const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newUser = {
        token,
        name,
        email: email.toLowerCase(),
        password,
        lastIp: clientIp,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    res.json({ message: 'Account created', token, user: { name: newUser.name } });
});

app.post('/accounts/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    saveUsers(users);

    res.json({ message: 'Login successful', token: user.token, user: { name: user.name } });
});

app.get('/accounts/api/tokens', (req, res) => {
    const users = getUsers();
    res.json(users.map(u => ({
        token: u.token,
        createdAt: u.createdAt,
        lastIp: u.lastIp
    })));
});

app.post('/accounts/api/admin-action', (req, res) => {
    const { command } = req.body;
    if (!command || !command.startsWith('BAN ')) {
        return res.status(400).json({ error: 'Invalid command. Format: BAN [TOKEN]' });
    }

    const tokenToBan = command.replace('BAN ', '').trim();
    let users = getUsers();
    const targetUser = users.find(u => u.token === tokenToBan);

    if (!targetUser) {
        return res.status(404).json({ error: 'Token not found.' });
    }

    const bannedIps = getBannedIPs();
    if (targetUser.lastIp && !bannedIps.includes(targetUser.lastIp)) {
        bannedIps.push(targetUser.lastIp);
        saveBannedIPs(bannedIps);
    }

    users = users.filter(u => u.token !== tokenToBan);
    saveUsers(users);

    res.json({ message: `Successfully deregistered token ${tokenToBan} and IP banned address ${targetUser.lastIp}` });
});

app.listen(PORT, () => console.log(`Phoenix server running on port ${PORT}`));
