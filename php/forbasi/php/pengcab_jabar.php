<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI Jabar API v3 - Docs & Testing</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);min-height:100vh;color:#e0e0e0}
        code,pre,.mono{font-family:'JetBrains Mono',monospace}
        .header{background:rgba(255,255,255,.05);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.1);padding:16px 30px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .header-left{display:flex;align-items:center;gap:14px}
        .header-left .logo{width:40px;height:40px;background:linear-gradient(135deg,#00c853,#00bfa5);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#fff}
        .header-left h1{font-size:18px;font-weight:600;color:#fff}
        .header-left h1 span{color:#00e676}
        .badge-ver{background:rgba(255,255,255,.1);color:#aaa;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:600}
        .badge-live{background:rgba(0,200,83,.2);color:#00e676;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:6px}
        .badge-live::before{content:'';width:8px;height:8px;background:#00e676;border-radius:50%;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .container{max-width:960px;margin:0 auto;padding:30px 20px}
        .auth-section{max-width:440px;margin:60px auto;padding:0 20px}
        .auth-card{background:rgba(255,255,255,.07);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:36px 30px}
        .auth-card h2{text-align:center;font-size:20px;margin-bottom:6px;color:#fff}
        .auth-card .sub{text-align:center;font-size:13px;color:#aaa;margin-bottom:24px}
        .form-group{margin-bottom:16px}
        .form-group label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#ccc}
        .form-group input,.form-group select,.form-group textarea{width:100%;padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:14px;font-family:'Poppins',sans-serif}
        .form-group textarea{resize:vertical;min-height:60px}
        .form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:#00e676}
        .form-group input::placeholder,.form-group textarea::placeholder{color:#666}
        .hint{font-size:11px;color:#777;margin-top:4px}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:10px;border:none;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
        .btn-primary{background:linear-gradient(135deg,#00c853,#00bfa5);color:#fff;width:100%}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,200,83,.3)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .btn-secondary{background:rgba(255,255,255,.08);color:#ccc;border:1px solid rgba(255,255,255,.12)}
        .btn-secondary:hover{background:rgba(255,255,255,.14);color:#fff}
        .btn-sm{padding:8px 16px;font-size:12px}
        .btn-danger{background:rgba(244,67,54,.15);color:#ff5252;border:1px solid rgba(244,67,54,.2)}
        .error-msg{background:rgba(244,67,54,.12);border:1px solid rgba(244,67,54,.3);color:#ff5252;padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;display:none;align-items:center;gap:8px}
        .error-msg.show{display:flex}
        .auth-section.hidden{display:none}
        .dashboard{display:none}
        .dashboard.active{display:block}
        .info-banner{background:rgba(0,200,83,.08);border:1px solid rgba(0,200,83,.2);border-radius:14px;padding:20px 24px;margin-bottom:24px}
        .info-banner h3{font-size:15px;color:#00e676;margin-bottom:8px;display:flex;align-items:center;gap:8px}
        .info-banner p{font-size:13px;color:#aaa;line-height:1.6}
        .info-banner strong{color:#fff}
        .stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
        .stat-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px}
        .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
        .stat-icon.green{background:rgba(0,200,83,.15);color:#00e676}
        .stat-icon.blue{background:rgba(33,150,243,.15);color:#42a5f5}
        .stat-icon.purple{background:rgba(156,39,176,.15);color:#ce93d8}
        .stat-icon.orange{background:rgba(255,152,0,.15);color:#ffb74d}
        .stat-icon.cyan{background:rgba(0,188,212,.15);color:#4dd0e1}
        .stat-info h3{font-size:20px;color:#fff;font-weight:700}
        .stat-info p{font-size:11px;color:#999}
        .sc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:24px;margin-bottom:20px}
        .sc h3{font-size:16px;color:#fff;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .sc .desc{font-size:13px;color:#999;margin-bottom:16px;line-height:1.5}
        .endpoint-list{display:flex;flex-direction:column;gap:8px}
        .ep{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .mb{padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace}
        .mb.post{background:rgba(255,152,0,.2);color:#ffb74d}
        .mb.get{background:rgba(33,150,243,.2);color:#42a5f5}
        .ep-path{font-family:'JetBrains Mono',monospace;font-size:13px;color:#e0e0e0}
        .ep-desc{font-size:12px;color:#888;width:100%;margin-top:2px}
        .tf{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .tf .form-group{margin-bottom:0;flex:1;min-width:140px}
        .tf .btn{height:44px;min-width:120px}
        .rb{margin-top:16px;display:none}
        .rb.show{display:block}
        .rh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .rs{font-size:12px;font-weight:600}
        .rs.ok{color:#00e676}
        .rs.err{color:#ff5252}
        .rt{font-size:11px;color:#888}
        .rp{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px;overflow-x:auto;font-size:12px;line-height:1.5;color:#ccc;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}
        .rw{position:relative}
        .cb{position:absolute;top:8px;right:8px;background:rgba(255,255,255,.1);border:none;color:#aaa;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px}
        .cb:hover{background:rgba(255,255,255,.2);color:#fff}
        .tabs{display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap}
        .tab{padding:6px 14px;border-radius:8px;border:none;background:rgba(255,255,255,.06);color:#888;font-size:12px;cursor:pointer;font-family:'Poppins',sans-serif}
        .tab.active{background:rgba(0,200,83,.15);color:#00e676}
        .code-block{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px;overflow-x:auto;font-size:12px;line-height:1.5;color:#ccc;display:none;white-space:pre-wrap}
        .code-block.active{display:block}
        .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .toast{position:fixed;bottom:30px;right:30px;background:rgba(0,200,83,.9);color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;display:none;z-index:9999}
        .toast.show{display:flex;align-items:center;gap:8px}
        .field-row{display:flex;gap:10px;flex-wrap:wrap}
        .field-row .form-group{flex:1;min-width:200px}
        @media(max-width:640px){
            .header{padding:12px 16px}.header-left h1{font-size:15px}
            .stats-row{grid-template-columns:1fr 1fr}
            .tf{flex-direction:column}.tf .btn{width:100%}
            .field-row{flex-direction:column}.field-row .form-group{min-width:100%}
        }
    </style>
</head>
<body>

<div class="header">
    <div class="header-left">
        <div class="logo">F</div>
        <h1>FORBASI <span>Jabar API</span></h1>
        <span class="badge-ver">v3.0</span>
    </div>
    <div id="headerRight" style="display:none">
        <div style="display:flex;align-items:center;gap:12px">
            <div class="badge-live" id="statusBadge">Realtime</div>
            <button class="btn btn-danger btn-sm" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Keluar</button>
        </div>
    </div>
</div>

<!-- AUTH -->
<div class="auth-section" id="authSection">
    <div class="auth-card">
        <h2><i class="fas fa-bolt" style="color:#00e676"></i> Realtime API v3</h2>
        <p class="sub">Masukkan API Key untuk akses dokumentasi & testing</p>
        <div class="error-msg" id="authError"><i class="fas fa-exclamation-circle"></i><span id="authErrorText"></span></div>
        <form onsubmit="doAuth(event)">
            <div class="form-group">
                <label>API Key</label>
                <input type="password" id="apiKeyInput" placeholder="Masukkan API Key..." required autocomplete="off">
            </div>
            <button type="submit" class="btn btn-primary" id="authBtn"><i class="fas fa-arrow-right"></i> Masuk</button>
        </form>
    </div>
</div>

<!-- DASHBOARD -->
<div class="dashboard" id="dashboard">
<div class="container">

    <div class="info-banner">
        <h3><i class="fas fa-bolt"></i> API Realtime — User, Pengcab & Pengda</h3>
        <p>
            API ini <strong>langsung terhubung ke database FORBASI</strong>. 
            Semua verifikasi login, edit profil, dan ganti password dilakukan secara <strong>realtime</strong>. 
            Mendukung ketiga role: <strong>User</strong>, <strong>Pengcab</strong>, <strong>Pengda</strong> wilayah Jawa Barat.
        </p>
    </div>

    <!-- Stats -->
    <div class="stats-row" id="statsRow">
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><h3 id="sTotal">-</h3><p>Total Akun</p></div></div>
        <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-user"></i></div><div class="stat-info"><h3 id="sUser">-</h3><p>Users</p></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-sitemap"></i></div><div class="stat-info"><h3 id="sPengcab">-</h3><p>Pengcab</p></div></div>
        <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-building"></i></div><div class="stat-info"><h3 id="sPengda">-</h3><p>Pengda</p></div></div>
        <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-id-card"></i></div><div class="stat-info"><h3 id="sKta">-</h3><p>KTA Terbit</p></div></div>
    </div>

    <!-- Endpoints -->
    <div class="sc">
        <h3><i class="fas fa-plug" style="color:#42a5f5"></i> Endpoints</h3>
        <div class="endpoint-list">
            <div class="ep"><span class="mb post">POST</span><span class="ep-path">?action=login</span><div class="ep-desc"><i class="fas fa-star" style="color:#ffb74d;font-size:10px"></i> Login realtime. Body: <code>{"username","password"}</code>. Semua role.</div></div>
            <div class="ep"><span class="mb get">GET</span><span class="ep-path">?action=accounts</span><div class="ep-desc">Daftar akun. Filter: <code>&role=user|pengcab|pengda</code>, <code>&search=keyword</code>, <code>&page=1&per_page=50</code></div></div>
            <div class="ep"><span class="mb get">GET</span><span class="ep-path">?action=account&username=xxx</span><div class="ep-desc">Detail akun by username atau <code>&id=123</code> (termasuk data KTA)</div></div>
            <div class="ep"><span class="mb get">GET</span><span class="ep-path">?action=kta&user_id=123</span><div class="ep-desc"><i class="fas fa-id-card" style="color:#4dd0e1;font-size:10px"></i> Data KTA user. Download link PDF, status, detail. Juga: <code>&username=xxx</code></div></div>
            <div class="ep"><span class="mb post">POST</span><span class="ep-path">?action=update_profile</span><div class="ep-desc">Edit profil. Body: <code>{"id", "club_name", "email", "phone", "address", "school_name"}</code></div></div>
            <div class="ep"><span class="mb post">POST</span><span class="ep-path">?action=change_password</span><div class="ep-desc">Ganti password. Body: <code>{"id/username", "old_password", "new_password"}</code></div></div>
            <div class="ep"><span class="mb get">GET</span><span class="ep-path">?action=sync&since=...</span><div class="ep-desc">Akun berubah (password/profil) sejak timestamp</div></div>
            <div class="ep"><span class="mb get">GET</span><span class="ep-path">?action=ping</span><div class="ep-desc">Health check & statistik</div></div>
        </div>
    </div>

    <!-- Test: Login -->
    <div class="sc">
        <h3><i class="fas fa-sign-in-alt" style="color:#ffb74d"></i> Tes Login Realtime</h3>
        <p class="desc">Verifikasi username & password (User, Pengcab, atau Pengda Jabar)</p>
        <form onsubmit="testLogin(event)">
            <div class="tf">
                <div class="form-group"><label>Username</label><input type="text" id="lUser" placeholder="admin_pengcab_bandung" required></div>
                <div class="form-group"><label>Password</label><input type="password" id="lPass" placeholder="Password..." required></div>
                <button type="submit" class="btn btn-primary" id="lBtn"><i class="fas fa-bolt"></i> Login</button>
            </div>
        </form>
        <div class="rb" id="lRes"><div class="rh"><span class="rs" id="lSt"></span><span class="rt" id="lTm"></span></div><div class="rw"><pre class="rp" id="lOut"></pre><button class="cb" onclick="copyEl('lOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Test: Accounts -->
    <div class="sc">
        <h3><i class="fas fa-list" style="color:#42a5f5"></i> Tes Daftar Akun</h3>
        <p class="desc">Ambil daftar akun dari database FORBASI secara realtime. Mendukung filter, search, dan pagination.</p>
        <div class="tf">
            <div class="form-group"><label>Role</label>
                <select id="aRole"><option value="">Semua</option><option value="user">User</option><option value="pengcab">Pengcab</option><option value="pengda">Pengda</option></select>
            </div>
            <div class="form-group"><label>Search</label><input type="text" id="aSearch" placeholder="Nama/username..."></div>
            <div class="form-group" style="max-width:80px"><label>Page</label><input type="number" id="aPage" value="1" min="1"></div>
            <button class="btn btn-primary" onclick="testAccounts()" id="aBtn"><i class="fas fa-download"></i> Ambil</button>
        </div>
        <div class="rb" id="aRes"><div class="rh"><span class="rs" id="aSt"></span><span class="rt" id="aTm"></span></div><div class="rw"><pre class="rp" id="aOut"></pre><button class="cb" onclick="copyEl('aOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Test: KTA -->
    <div class="sc">
        <h3><i class="fas fa-id-card" style="color:#4dd0e1"></i> Tes Data KTA</h3>
        <p class="desc">Ambil data KTA user termasuk link download PDF dan halaman verifikasi. Login juga otomatis menyertakan data KTA.</p>
        <div class="tf">
            <div class="form-group"><label>User ID atau Username</label><input type="text" id="ktaId" placeholder="123 atau username" required></div>
            <button class="btn btn-primary" onclick="testKta()" id="ktaBtn"><i class="fas fa-id-card"></i> Ambil KTA</button>
        </div>
        <div class="rb" id="ktaRes"><div class="rh"><span class="rs" id="ktaSt"></span><span class="rt" id="ktaTm"></span></div><div class="rw"><pre class="rp" id="ktaOut"></pre><button class="cb" onclick="copyEl('ktaOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Test: Update Profile -->
    <div class="sc">
        <h3><i class="fas fa-edit" style="color:#ce93d8"></i> Tes Edit Profil</h3>
        <p class="desc">Update profil akun. Identifikasi pakai ID atau username. Field kosong tidak akan diupdate.</p>
        <form onsubmit="testUpdateProfile(event)">
            <div class="field-row">
                <div class="form-group"><label>ID atau Username *</label><input type="text" id="upId" placeholder="123 atau admin_pengcab_bandung" required></div>
            </div>
            <div class="field-row">
                <div class="form-group"><label>Club Name</label><input type="text" id="upClub" placeholder="Nama baru..."></div>
                <div class="form-group"><label>Email</label><input type="email" id="upEmail" placeholder="email@baru.com"></div>
            </div>
            <div class="field-row">
                <div class="form-group"><label>Phone</label><input type="text" id="upPhone" placeholder="08xxxxxxxxxx"></div>
                <div class="form-group"><label>School Name</label><input type="text" id="upSchool" placeholder="Nama sekolah..."></div>
            </div>
            <div class="form-group"><label>Address</label><textarea id="upAddr" placeholder="Alamat baru..."></textarea></div>
            <button type="submit" class="btn btn-primary" id="upBtn" style="width:auto;min-width:200px"><i class="fas fa-save"></i> Update Profil</button>
        </form>
        <div class="rb" id="upRes"><div class="rh"><span class="rs" id="upSt"></span><span class="rt" id="upTm"></span></div><div class="rw"><pre class="rp" id="upOut"></pre><button class="cb" onclick="copyEl('upOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Test: Change Password -->
    <div class="sc">
        <h3><i class="fas fa-key" style="color:#ffb74d"></i> Tes Ganti Password</h3>
        <p class="desc">Ganti password akun. Password baru langsung berlaku di semua aplikasi yang terhubung API ini.</p>
        <form onsubmit="testChangePassword(event)">
            <div class="tf">
                <div class="form-group"><label>ID / Username *</label><input type="text" id="cpId" placeholder="123 atau username" required></div>
                <div class="form-group"><label>Password Lama *</label><input type="password" id="cpOld" placeholder="Password lama..." required></div>
                <div class="form-group"><label>Password Baru *</label><input type="password" id="cpNew" placeholder="Min 6 karakter..." required></div>
                <button type="submit" class="btn btn-primary" id="cpBtn"><i class="fas fa-key"></i> Ganti</button>
            </div>
        </form>
        <div class="rb" id="cpRes"><div class="rh"><span class="rs" id="cpSt"></span><span class="rt" id="cpTm"></span></div><div class="rw"><pre class="rp" id="cpOut"></pre><button class="cb" onclick="copyEl('cpOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Test: Sync -->
    <div class="sc">
        <h3><i class="fas fa-sync-alt" style="color:#4dd0e1"></i> Tes Sync</h3>
        <p class="desc">Cek akun yang berubah sejak timestamp tertentu. Jalankan periodik via cron job untuk mirror data.</p>
        <div class="tf">
            <div class="form-group"><label>Sejak</label><input type="text" id="syncSince" placeholder="2026-01-01T00:00:00"><div class="hint">Format ISO 8601</div></div>
            <button class="btn btn-primary" onclick="testSync()" id="syncBtn"><i class="fas fa-sync-alt"></i> Cek</button>
        </div>
        <div class="rb" id="syncRes"><div class="rh"><span class="rs" id="syncSt"></span><span class="rt" id="syncTm"></span></div><div class="rw"><pre class="rp" id="syncOut"></pre><button class="cb" onclick="copyEl('syncOut')"><i class="fas fa-copy"></i></button></div></div>
    </div>

    <!-- Code Examples -->
    <div class="sc">
        <h3><i class="fas fa-code" style="color:#00e676"></i> Contoh Implementasi</h3>
        <p class="desc">Copy-paste ke aplikasi kamu.</p>
        <div class="tabs">
            <button class="tab active" onclick="showTab('php',this)">PHP Login</button>
            <button class="tab" onclick="showTab('sync',this)">PHP Sync</button>
            <button class="tab" onclick="showTab('edit',this)">PHP Edit</button>
            <button class="tab" onclick="showTab('kta',this)">PHP KTA</button>
            <button class="tab" onclick="showTab('js',this)">JavaScript</button>
            <button class="tab" onclick="showTab('flow',this)">Alur Kerja</button>
        </div>
        <pre class="code-block active" id="tab-php"><code>&lt;?php
// Login via FORBASI Realtime API
define('FORBASI_API', 'https://forbasi.or.id/forbasi/php/api_pengcab_jabar.php');
define('FORBASI_KEY', 'API_KEY_KAMU');

function forbasi_login($username, $password) {
    $ch = curl_init(FORBASI_API . '?action=login');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . FORBASI_KEY,
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'username' => $username,
            'password' => $password,
        ]),
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    
    if ($res['success']) {
        // $res['user'] berisi: id, username, club_name, email, 
        // phone, role ("User"/"Pengcab"/"Pengda"), dll.
        return $res['user'];
    }
    return false; // $res['error'] berisi pesan error
}

// Contoh:
$user = forbasi_login('admin_pengcab_bandung', 'PENGCABFORBASI');
if ($user) {
    echo $user['club_name'] . ' (' . $user['role'] . ')';
    // Simpan session...
}
?&gt;</code></pre>
        <pre class="code-block" id="tab-sync"><code>&lt;?php
// Sync periodik - jalankan via cron setiap 5-10 menit
// Deteksi akun yang berubah (ganti password, edit profil, dll)

$last_sync = get_last_sync_time(); // Ambil dari DB lokal kamu

$url = FORBASI_API . '?action=sync'
     . '&amp;since=' . urlencode($last_sync)
     . '&amp;api_key=' . urlencode(FORBASI_KEY);

$data = json_decode(file_get_contents($url), true);

if ($data['success'] && $data['total_changed'] > 0) {
    foreach ($data['data'] as $account) {
        // Update data lokal kamu
        update_local_account($account['id'], [
            'club_name' => $account['club_name'],
            'email'     => $account['email'],
            'phone'     => $account['phone'],
            'role'      => $account['role'],
            'city_name' => $account['city_name'],
        ]);
    }
    save_last_sync_time($data['timestamp']);
    echo "Synced {$data['total_changed']} accounts";
} else {
    echo "No changes";
}
?&gt;</code></pre>
        <pre class="code-block" id="tab-edit"><code>&lt;?php
// Edit profil via API
function forbasi_update_profile($id, $fields) {
    $body = array_merge(['id' => $id], $fields);
    
    $ch = curl_init(FORBASI_API . '?action=update_profile');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . FORBASI_KEY,
        ],
        CURLOPT_POSTFIELDS => json_encode($body),
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
}

// Contoh: edit club_name & phone
$result = forbasi_update_profile(1671, [
    'club_name' => 'FORBASI Bandung Raya',
    'phone'     => '081234567890',
]);

// Ganti password
function forbasi_change_password($username, $old, $new) {
    $ch = curl_init(FORBASI_API . '?action=change_password');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . FORBASI_KEY,
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'username'     => $username,
            'old_password' => $old,
            'new_password' => $new,
        ]),
    ]);
    return json_decode(curl_exec($ch), true);
}
?&gt;</code></pre>
        <pre class="code-block" id="tab-kta"><code>&lt;?php
// Ambil data KTA user via API
function forbasi_get_kta($user_id) {
    $url = FORBASI_API . '?action=kta'
         . '&amp;user_id=' . intval($user_id)
         . '&amp;api_key=' . urlencode(FORBASI_KEY);
    
    $data = json_decode(file_get_contents($url), true);
    
    if ($data['success'] && $data['total_kta'] > 0) {
        foreach ($data['kta'] as $kta) {
            echo "Status: " . $kta['status_label'] . "\n";
            
            // Download KTA PDF
            if ($kta['kta_pdf_url']) {
                echo "Download: " . $kta['kta_pdf_url'] . "\n";
                // Redirect user ke PDF:
                // header('Location: ' . $kta['kta_pdf_url']);
            }
            
            // Halaman verifikasi KTA (QR code target)
            if ($kta['kta_detail_url']) {
                echo "Detail: " . $kta['kta_detail_url'] . "\n";
            }
            
            // Logo club
            if ($kta['logo_url']) {
                echo "&lt;img src='" . $kta['logo_url'] . "'&gt;\n";
            }
        }
    } else {
        echo "User belum punya KTA";
    }
}

// Contoh: tampilkan KTA setelah login
$login = forbasi_login('username', 'password');
if ($login) {
    // KTA sudah ada di response login!
    foreach ($login['kta'] as $kta) {
        if ($kta['status'] === 'kta_issued') {
            echo "&lt;a href='" . $kta['kta_pdf_url'] . "'&gt;Download KTA&lt;/a&gt;";
        }
    }
}
?&gt;</code></pre>
        <pre class="code-block" id="tab-js"><code>// JavaScript - Login, List, Edit, Change Password

const API = 'https://forbasi.or.id/forbasi/php/api_pengcab_jabar.php';
const KEY = 'API_KEY_KAMU';

// Login
async function login(username, password) {
    const r = await fetch(API + '?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': KEY },
        body: JSON.stringify({ username, password }),
    });
    return await r.json();
}

// Daftar akun (dengan filter & pagination)
async function getAccounts(role='', search='', page=1) {
    let url = `${API}?action=accounts&api_key=${KEY}&page=${page}`;
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return (await fetch(url)).json();
}

// Edit profil
async function updateProfile(id, fields) {
    const r = await fetch(API + '?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': KEY },
        body: JSON.stringify({ id, ...fields }),
    });
    return await r.json();
}

// Ganti password
async function changePassword(username, oldPw, newPw) {
    const r = await fetch(API + '?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': KEY },
        body: JSON.stringify({ username, old_password: oldPw, new_password: newPw }),
    });
    return await r.json();
}

// Ambil KTA user
async function getKta(userId) {
    const url = `${API}?action=kta&user_id=${userId}&api_key=${KEY}`;
    const data = await (await fetch(url)).json();
    if (data.success && data.kta.length > 0) {
        data.kta.forEach(kta => {
            if (kta.kta_pdf_url) window.open(kta.kta_pdf_url); // download
            if (kta.kta_detail_url) console.log('Verify:', kta.kta_detail_url);
        });
    }
    return data;
}</code></pre>
        <pre class="code-block" id="tab-flow"><code>
 ALUR KERJA API REALTIME FORBASI v3
 ===================================

 ┌──────────────┐   POST /login    ┌──────────────┐
 │  App Kamu    │ ───────────────→  │  FORBASI API │
 │              │   user + pass     │  (Realtime)  │
 │  User login  │ ←───────────────  │              │
 │  Edit profil │   data / error    └──────┬───────┘
 │  Ganti pass  │                          │ Query langsung
 └──────────────┘                   ┌──────▼───────┐
                                    │  DB FORBASI  │
                                    │  (users)     │
                                    └──────────────┘

 ROLE YANG DIDUKUNG:
 • User     (role_id=1) — 922 akun Jabar
 • Pengcab  (role_id=2) — 29 akun Jabar
 • Pengda   (role_id=3) — 1 akun Jabar

 MENGAPA REALTIME?
 Password & profil TIDAK di-cache. Setiap panggilan API
 langsung cek ke database FORBASI.
 → Ganti password di FORBASI = otomatis berlaku di app kamu
 → Edit profil di app kamu = langsung tersimpan di FORBASI

 ENDPOINT EDIT:
 • update_profile — edit club_name, email, phone, address, school_name
 • change_password — ganti password (harus tahu password lama)

 ENDPOINT KTA:
 • kta — ambil data KTA user (status, PDF download, verifikasi, logo)
 • Response login &amp; account otomatis menyertakan data KTA
 • kta_pdf_url → link langsung download PDF KTA
 • kta_detail_url → halaman verifikasi (QR code target)

 SYNC PERIODIK (OPSIONAL):
 Jalankan cron setiap 5-10 menit:
   GET ?action=sync&since=TIMESTAMP
 Untuk mirror metadata (nama, email, phone) ke DB lokal kamu.
 Untuk LOGIN, tidak perlu sync — langsung panggil ?action=login.
</code></pre>
    </div>

</div>
</div>

<div class="toast" id="toast"><i class="fas fa-check-circle"></i> <span id="toastText"></span></div>

<script>
let API_BASE='', API_KEY='';
if(!API_BASE){const d=location.pathname.substring(0,location.pathname.lastIndexOf('/')+1);API_BASE=location.origin+d+'api_pengcab_jabar.php'}

function doAuth(e){
    e.preventDefault();
    const k=document.getElementById('apiKeyInput').value.trim();if(!k)return;
    const b=document.getElementById('authBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    document.getElementById('authError').classList.remove('show');
    apiFetch('ping').then(d=>{
        if(d.success){API_KEY=k;sessionStorage.setItem('fk',k);showDash(d)}
        else showAErr(d.error||'Key tidak valid')
    }).catch(e=>showAErr('Gagal: '+e.message)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-arrow-right"></i> Masuk'});
    function apiFetch(action){return fetch(API_BASE+'?action='+action+'&api_key='+encodeURIComponent(k)).then(r=>r.json())}
}
function showAErr(m){document.getElementById('authErrorText').textContent=m;document.getElementById('authError').classList.add('show')}
function showDash(d){
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('headerRight').style.display='block';
    upStats(d);
}
function upStats(d){
    document.getElementById('sTotal').textContent=d.total_accounts||0;
    document.getElementById('sUser').textContent=d.total_user||0;
    document.getElementById('sPengcab').textContent=d.total_pengcab||0;
    document.getElementById('sPengda').textContent=d.total_pengda||0;
    if(d.kta_stats){document.getElementById('sKta').textContent=d.kta_stats.issued||0}
}
function doLogout(){API_KEY='';sessionStorage.removeItem('fk');document.getElementById('authSection').classList.remove('hidden');document.getElementById('dashboard').classList.remove('active');document.getElementById('headerRight').style.display='none';document.getElementById('apiKeyInput').value=''}
(function(){const s=sessionStorage.getItem('fk');if(s){API_KEY=s;document.getElementById('apiKeyInput').value=s;fetch(API_BASE+'?action=ping&api_key='+encodeURIComponent(s)).then(r=>r.json()).then(d=>{if(d.success)showDash(d)}).catch(()=>{})}})();

// API helper
function apiCall(action,opts={}){
    const t0=Date.now();
    let url=API_BASE+'?action='+action;
    if(opts.params)Object.entries(opts.params).forEach(([k,v])=>{if(v!==''&&v!=null)url+='&'+k+'='+encodeURIComponent(v)});
    const fetchOpts={method:opts.method||'GET',headers:{'X-API-Key':API_KEY}};
    if(opts.body){fetchOpts.method='POST';fetchOpts.headers['Content-Type']='application/json';fetchOpts.body=JSON.stringify(opts.body)}
    if(!opts.body&&fetchOpts.method==='GET')url+='&api_key='+encodeURIComponent(API_KEY);
    return fetch(url,fetchOpts).then(r=>r.json().then(d=>({status:r.status,data:d,ms:Date.now()-t0}))).catch(e=>({status:0,data:{error:e.message},ms:Date.now()-t0}));
}
function showRes(p,r){
    document.getElementById(p+'Res').classList.add('show');
    const ok=r.status>=200&&r.status<300;
    document.getElementById(p+'St').textContent=(ok?'✓ ':'✗ ')+(r.status||'Error');
    document.getElementById(p+'St').className='rs '+(ok?'ok':'err');
    document.getElementById(p+'Tm').textContent=r.ms+'ms';
    document.getElementById(p+'Out').textContent=JSON.stringify(r.data,null,2);
}

// Test login
function testLogin(e){
    e.preventDefault();
    const b=document.getElementById('lBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    apiCall('login',{body:{username:document.getElementById('lUser').value.trim(),password:document.getElementById('lPass').value}})
    .then(r=>showRes('l',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-bolt"></i> Login'});
}

// Test accounts
function testAccounts(){
    const b=document.getElementById('aBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    apiCall('accounts',{params:{role:document.getElementById('aRole').value,search:document.getElementById('aSearch').value.trim(),page:document.getElementById('aPage').value}})
    .then(r=>showRes('a',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-download"></i> Ambil'});
}

// Test KTA
function testKta(){
    const v=document.getElementById('ktaId').value.trim();if(!v){showToast('Masukkan user ID atau username!');return}
    const b=document.getElementById('ktaBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    const params=/^\d+$/.test(v)?{user_id:v}:{username:v};
    apiCall('kta',{params}).then(r=>showRes('kta',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-id-card"></i> Ambil KTA'});
}

// Test update profile
function testUpdateProfile(e){
    e.preventDefault();
    const b=document.getElementById('upBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    const idVal=document.getElementById('upId').value.trim();
    const body={};
    if(/^\d+$/.test(idVal))body.id=parseInt(idVal);else body.username=idVal;
    const fields={club_name:'upClub',email:'upEmail',phone:'upPhone',school_name:'upSchool',address:'upAddr'};
    Object.entries(fields).forEach(([k,el])=>{const v=document.getElementById(el).value.trim();if(v)body[k]=v});
    apiCall('update_profile',{body}).then(r=>showRes('up',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-save"></i> Update Profil'});
}

// Test change password
function testChangePassword(e){
    e.preventDefault();
    const b=document.getElementById('cpBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    const idVal=document.getElementById('cpId').value.trim();
    const body={old_password:document.getElementById('cpOld').value,new_password:document.getElementById('cpNew').value};
    if(/^\d+$/.test(idVal))body.id=parseInt(idVal);else body.username=idVal;
    apiCall('change_password',{body}).then(r=>showRes('cp',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-key"></i> Ganti'});
}

// Test sync
function testSync(){
    const s=document.getElementById('syncSince').value.trim();
    if(!s){showToast('Masukkan timestamp!');return}
    const b=document.getElementById('syncBtn');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    apiCall('sync',{params:{since:s}}).then(r=>showRes('sync',r)).finally(()=>{b.disabled=false;b.innerHTML='<i class="fas fa-sync-alt"></i> Cek'});
}

// Utils
function copyEl(id){navigator.clipboard.writeText(document.getElementById(id).textContent).then(()=>showToast('Copied!'))}
function showTab(t,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.code-block').forEach(c=>c.classList.remove('active'));el.classList.add('active');document.getElementById('tab-'+t).classList.add('active')}
function showToast(m){const e=document.getElementById('toast');document.getElementById('toastText').textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),3000)}
</script>
</body>
</html>
