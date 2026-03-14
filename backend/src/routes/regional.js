const router = require('express').Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const API_VERSION = '3.0';
const ROLE_USER = 1, ROLE_PENGCAB = 2, ROLE_PENGDA = 3;
const ALLOWED_ROLES = [ROLE_USER, ROLE_PENGCAB, ROLE_PENGDA];
const EDITABLE_FIELDS = ['club_name', 'email', 'phone', 'address', 'school_name'];
const DEFAULT_PER_PAGE = 50, MAX_PER_PAGE = 200;

// Regional API configurations
const REGIONAL_CONFIGS = {
  jabar:   { province_id: 12, api_key: 'fbsi-jabar-2026-S3cur3K3y!',   name: 'Jawa Barat' },
  jakarta: { province_id: 11, api_key: 'fbsi-jakarta-2026-S3cur3K3y!', name: 'DKI Jakarta' },
  kalbar:  { province_id: 20, api_key: 'fbsi-kalbar-2026-S3cur3K3y!',  name: 'Kalimantan Barat' },
};

// Helpers
function getRoleLabel(role_id) {
  const map = { [ROLE_USER]: 'User', [ROLE_PENGCAB]: 'Pengcab', [ROLE_PENGDA]: 'Pengda' };
  return map[role_id] || 'Unknown';
}

function getKtaStatusLabel(status) {
  const map = {
    pending: 'Menunggu Persetujuan Pengcab',
    approved_pengcab: 'Disetujui Pengcab, Menunggu Pengda',
    approved_pengda: 'Disetujui Pengda, Menunggu PB',
    approved_pb: 'Disetujui PB, Menunggu Cetak',
    kta_issued: 'KTA Terbit',
    rejected_pengcab: 'Ditolak Pengcab',
    rejected_pengda: 'Ditolak Pengda',
    rejected_pb: 'Ditolak PB',
    pending_pengda_resubmit: 'Menunggu Pengajuan Ulang ke Pengda',
  };
  return map[status] || status;
}

function buildBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function buildLogoUrl(req, logoPath) {
  if (!logoPath) return null;
  const base = buildBaseUrl(req);
  if (logoPath.startsWith('kta_files/') || logoPath.startsWith('uploads/')) return `${base}/${logoPath}`;
  return `${base}/uploads/${logoPath}`;
}

function formatAccount(row, req, includeAddress = false) {
  const account = {
    id: row.id,
    club_name: row.club_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: getRoleLabel(row.role_id),
    role_id: row.role_id,
    logo_url: buildLogoUrl(req, row.user_logo_path),
    province_id: row.province_id || null,
    city_id: row.city_id || null,
    province_name: row.province_name || null,
    city_name: row.city_name || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includeAddress) {
    account.address = row.address || null;
    account.school_name = row.school_name || null;
  }
  return account;
}

function formatKta(row, req) {
  const base = buildBaseUrl(req);
  const kta = {
    kta_id: row.kta_id,
    status: row.kta_status,
    status_label: getKtaStatusLabel(row.kta_status),
    club_name: row.kta_club_name,
    school_name: row.kta_school_name || null,
    leader_name: row.leader_name,
    coach_name: row.coach_name,
    manager_name: row.manager_name,
    club_address: row.club_address,
    province: row.kta_province || null,
    regency: row.kta_regency || null,
    barcode_id: row.kta_barcode_unique_id || null,
    kta_issued_at: row.kta_issued_at || null,
    created_at: row.kta_created_at,
    nominal_paid: row.nominal_paid ? Number(row.nominal_paid) : null,
    logo_url: row.kta_logo_path ? buildLogoUrl(req, row.kta_logo_path) : null,
    kta_pdf_url: row.generated_kta_file_path_pb ? `${base}/${row.generated_kta_file_path_pb}` : null,
    kta_detail_url: row.kta_barcode_unique_id ? `${base}/api/public/verify-kta/${row.kta_barcode_unique_id}` : null,
  };
  return kta;
}

async function getUserKtaData(conn, userId, req) {
  const [rows] = await conn.query(
    `SELECT ka.id AS kta_id, ka.status AS kta_status, ka.club_name AS kta_club_name,
            ka.school_name AS kta_school_name, ka.leader_name, ka.coach_name, ka.manager_name,
            ka.club_address, ka.province AS kta_province, ka.regency AS kta_regency,
            ka.logo_path AS kta_logo_path, ka.kta_barcode_unique_id, ka.generated_kta_file_path_pb,
            ka.kta_issued_at, ka.nominal_paid, ka.created_at AS kta_created_at
     FROM kta_applications ka WHERE ka.user_id = ? ORDER BY ka.id DESC`,
    [userId]
  );
  return rows.map(r => formatKta(r, req));
}

// API key middleware — supports header, query param, and Bearer token
function validateApiKey(req, res, next) {
  const region = req.params.region;
  const config = REGIONAL_CONFIGS[region];
  if (!config) return res.status(404).json({ success: false, error: 'Region tidak ditemukan' });

  let key = req.headers['x-api-key'] || '';
  if (!key) key = req.query.api_key || req.body?.api_key || '';
  if (!key) {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) key = m[1];
  }

  const expectedKey = process.env[`API_KEY_${region.toUpperCase()}`] || config.api_key;
  if (!key || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expectedKey))) {
    return res.status(401).json({ success: false, error: 'Unauthorized. API key tidak valid.' });
  }

  req.regionConfig = config;
  next();
}

// User query helper
const USER_SELECT = `SELECT u.id, u.club_name, u.username, u.email, u.phone,
       u.role_id, u.province_id, u.city_id, u.address, u.school_name,
       p.name AS province_name, c.name AS city_name,
       u.created_at, u.updated_at,
       (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
FROM users u
LEFT JOIN provinces p ON u.province_id = p.id
LEFT JOIN cities c ON u.city_id = c.id`;

// ============================================================
// REGIONAL ROUTES — /:region/:action
// Compatible with PHP api_pengcab_*.php endpoints
// ============================================================

// Default info / API docs
router.get('/:region', validateApiKey, (req, res) => {
  const { regionConfig: config } = req;
  res.json({
    success: true,
    message: `FORBASI ${config.name} Realtime API`,
    version: API_VERSION,
    region: config.name,
    endpoints: {
      'POST /:region/login':           'Login realtime (body: username, password)',
      'GET  /:region/accounts':        'Daftar semua akun (filter: role, search, page, per_page)',
      'GET  /:region/account?id=x':    'Detail akun by ID atau username (termasuk data KTA)',
      'GET  /:region/kta?user_id=x':   'Data KTA user (download link, status, detail)',
      'POST /:region/update-profile':  'Edit profil (body: id, fields...)',
      'POST /:region/change-password': 'Ganti password (body: id, old_password, new_password)',
      'GET  /:region/sync?since=...':  'Akun berubah sejak timestamp',
      'GET  /:region/ping':            'Health check & statistik',
    },
    auth: 'Header X-API-Key, parameter api_key, atau Authorization: Bearer <key>',
    editable_fields: EDITABLE_FIELDS,
  });
});

// Ping / health check with stats
router.get('/:region/ping', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const rolesIn = ALLOWED_ROLES.join(',');

    const [stats] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as total_user,
              SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as total_pengcab,
              SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) as total_pengda,
              MAX(updated_at) as last_updated
       FROM users WHERE role_id IN (${rolesIn}) AND province_id = ?`,
      [cfg.province_id]
    );

    const [ktaStats] = await db.query(
      `SELECT COUNT(*) as total_kta,
              SUM(CASE WHEN ka.status = 'kta_issued' THEN 1 ELSE 0 END) as kta_issued,
              SUM(CASE WHEN ka.status = 'pending' THEN 1 ELSE 0 END) as kta_pending,
              SUM(CASE WHEN ka.status LIKE 'approved%' THEN 1 ELSE 0 END) as kta_in_process,
              SUM(CASE WHEN ka.status LIKE 'rejected%' THEN 1 ELSE 0 END) as kta_rejected
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       WHERE u.province_id = ? AND u.role_id IN (${rolesIn})`,
      [cfg.province_id]
    );

    const s = stats[0], k = ktaStats[0];
    res.json({
      success: true, status: 'online', version: API_VERSION, region: cfg.name,
      server_time: new Date().toISOString(),
      total_accounts: s.total, total_user: s.total_user,
      total_pengcab: s.total_pengcab, total_pengda: s.total_pengda,
      last_updated: s.last_updated,
      kta_stats: {
        total: k.total_kta || 0, issued: k.kta_issued || 0,
        pending: k.kta_pending || 0, in_process: k.kta_in_process || 0,
        rejected: k.kta_rejected || 0,
      },
    });
  } catch (err) {
    console.error('Regional ping error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Login — realtime authentication
router.post('/:region/login', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });

    const rolesIn = ALLOWED_ROLES.join(',');
    const [users] = await db.query(
      `${USER_SELECT} WHERE u.username = ? AND u.role_id IN (${rolesIn}) AND u.province_id = ?`,
      [username.trim(), cfg.province_id]
    );

    if (!users.length) return res.status(401).json({ success: false, error: `Akun tidak ditemukan di wilayah Pengda ${cfg.name}.` });
    const user = users[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Password salah.' });

    const account = formatAccount(user, req, true);
    account.kta = await getUserKtaData(db, user.id, req);

    res.json({ success: true, message: 'Login berhasil.', timestamp: new Date().toISOString(), user: account });
  } catch (err) {
    console.error('Regional login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Accounts list with filters & pagination
router.get('/:region/accounts', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const roleFilter = (req.query.role || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(req.query.per_page) || DEFAULT_PER_PAGE));
    const offset = (page - 1) * perPage;

    const roleMap = { user: ROLE_USER, pengcab: ROLE_PENGCAB, pengda: ROLE_PENGDA };
    const whereRole = roleMap[roleFilter]
      ? `u.role_id = ${roleMap[roleFilter]}`
      : `u.role_id IN (${ALLOWED_ROLES.join(',')})`;

    let searchWhere = '';
    const params = [cfg.province_id];
    if (search) {
      searchWhere = 'AND (u.club_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users u WHERE ${whereRole} AND u.province_id = ? ${searchWhere}`, params
    );

    const [rows] = await db.query(
      `${USER_SELECT} WHERE ${whereRole} AND u.province_id = ? ${searchWhere} ORDER BY u.role_id ASC, u.club_name ASC LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const summary = { user: 0, pengcab: 0, pengda: 0 };
    const accounts = rows.map(r => {
      const key = getRoleLabel(r.role_id).toLowerCase();
      if (summary[key] !== undefined) summary[key]++;
      return formatAccount(r, req);
    });

    res.json({
      success: true, timestamp: new Date().toISOString(), region: cfg.name,
      total, page, per_page: perPage, total_pages: Math.ceil(total / perPage),
      summary, data: accounts,
    });
  } catch (err) {
    console.error('Regional accounts error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Account detail by id or username
router.get('/:region/account', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const username = (req.query.username || '').trim();
    const id = parseInt(req.query.id) || 0;

    if (!username && id <= 0) return res.status(400).json({ success: false, error: 'Parameter username atau id wajib diisi.' });

    const rolesIn = ALLOWED_ROLES.join(',');
    let query, params;
    if (username) {
      query = `${USER_SELECT} WHERE u.username = ? AND u.role_id IN (${rolesIn}) AND u.province_id = ?`;
      params = [username, cfg.province_id];
    } else {
      query = `${USER_SELECT} WHERE u.id = ? AND u.role_id IN (${rolesIn}) AND u.province_id = ?`;
      params = [id, cfg.province_id];
    }

    const [users] = await db.query(query, params);
    if (!users.length) return res.status(404).json({ success: false, error: `Akun tidak ditemukan di wilayah ${cfg.name}.` });

    const account = formatAccount(users[0], req, true);
    account.kta = await getUserKtaData(db, users[0].id, req);

    res.json({ success: true, timestamp: new Date().toISOString(), data: account });
  } catch (err) {
    console.error('Regional account detail error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// KTA data by user_id or username
router.get('/:region/kta', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const userId = parseInt(req.query.user_id) || 0;
    const username = (req.query.username || '').trim();

    if (userId <= 0 && !username) return res.status(400).json({ success: false, error: 'Parameter user_id atau username wajib diisi.' });

    const rolesIn = ALLOWED_ROLES.join(',');
    let query, params;
    if (userId > 0) {
      query = `SELECT id, club_name, username, role_id FROM users WHERE id = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      params = [userId, cfg.province_id];
    } else {
      query = `SELECT id, club_name, username, role_id FROM users WHERE username = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      params = [username, cfg.province_id];
    }

    const [users] = await db.query(query, params);
    if (!users.length) return res.status(404).json({ success: false, error: `Akun tidak ditemukan di wilayah ${cfg.name}.` });

    const user = users[0];
    const ktaList = await getUserKtaData(db, user.id, req);

    res.json({
      success: true, timestamp: new Date().toISOString(),
      user: { id: user.id, username: user.username, club_name: user.club_name, role: getRoleLabel(user.role_id) },
      total_kta: ktaList.length, kta: ktaList,
    });
  } catch (err) {
    console.error('Regional KTA error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update profile
router.post('/:region/update-profile', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const id = parseInt(req.body.id) || 0;
    const usernameInput = (req.body.username || '').trim();

    if (id <= 0 && !usernameInput) return res.status(400).json({ success: false, error: 'Parameter id atau username wajib diisi.' });

    const rolesIn = ALLOWED_ROLES.join(',');
    let findQuery, findParams;
    if (id > 0) {
      findQuery = `SELECT id, username FROM users WHERE id = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      findParams = [id, cfg.province_id];
    } else {
      findQuery = `SELECT id, username FROM users WHERE username = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      findParams = [usernameInput, cfg.province_id];
    }

    const [found] = await db.query(findQuery, findParams);
    if (!found.length) return res.status(404).json({ success: false, error: `Akun tidak ditemukan di wilayah ${cfg.name}.` });
    const userId = found[0].id;

    const updates = [], values = [];
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        const val = String(req.body[field]).trim();
        if (field === 'email' && val) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
          const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [val, userId]);
          if (dup.length) return res.status(400).json({ success: false, error: 'Email sudah digunakan oleh akun lain.' });
        }
        if (field === 'phone' && val && !/^[0-9+\-\s]{8,20}$/.test(val)) {
          return res.status(400).json({ success: false, error: 'Format nomor telepon tidak valid.' });
        }
        updates.push(`\`${field}\` = ?`);
        values.push(val);
      }
    }

    if (!updates.length) return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate. Field: ' + EDITABLE_FIELDS.join(', ') });

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [freshRows] = await db.query(`${USER_SELECT} WHERE u.id = ?`, [userId]);

    res.json({
      success: true, message: 'Profil berhasil diupdate.',
      timestamp: new Date().toISOString(),
      data: formatAccount(freshRows[0], req, true),
    });
  } catch (err) {
    console.error('Regional update-profile error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change password
router.post('/:region/change-password', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const id = parseInt(req.body.id) || 0;
    const usernameInput = (req.body.username || '').trim();
    const { old_password, new_password } = req.body;

    if (id <= 0 && !usernameInput) return res.status(400).json({ success: false, error: 'Parameter id atau username wajib diisi.' });
    if (!old_password || !new_password) return res.status(400).json({ success: false, error: 'old_password dan new_password wajib diisi.' });
    if (new_password.length < 6) return res.status(400).json({ success: false, error: 'Password baru minimal 6 karakter.' });

    const rolesIn = ALLOWED_ROLES.join(',');
    let query, params;
    if (id > 0) {
      query = `SELECT id, username, password FROM users WHERE id = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      params = [id, cfg.province_id];
    } else {
      query = `SELECT id, username, password FROM users WHERE username = ? AND role_id IN (${rolesIn}) AND province_id = ?`;
      params = [usernameInput, cfg.province_id];
    }

    const [users] = await db.query(query, params);
    if (!users.length) return res.status(404).json({ success: false, error: `Akun tidak ditemukan di wilayah ${cfg.name}.` });

    const user = users[0];
    const valid = await bcrypt.compare(old_password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Password lama salah.' });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);

    res.json({
      success: true, message: 'Password berhasil diubah.',
      timestamp: new Date().toISOString(),
      user_id: user.id, username: user.username,
    });
  } catch (err) {
    console.error('Regional change-password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Sync — accounts changed since timestamp
router.get('/:region/sync', validateApiKey, async (req, res) => {
  try {
    const { regionConfig: cfg } = req;
    const since = (req.query.since || '').trim();
    if (!since) return res.status(400).json({ success: false, error: 'Parameter since wajib diisi (format: 2026-01-01T00:00:00).' });

    const ts = new Date(since);
    if (isNaN(ts.getTime())) return res.status(400).json({ success: false, error: 'Format since tidak valid. Gunakan format ISO 8601.' });

    const sinceFormatted = ts.toISOString().replace('T', ' ').replace('Z', '');
    const rolesIn = ALLOWED_ROLES.join(',');

    const [rows] = await db.query(
      `${USER_SELECT} WHERE u.role_id IN (${rolesIn}) AND u.province_id = ? AND u.updated_at > ? ORDER BY u.updated_at DESC`,
      [cfg.province_id, sinceFormatted]
    );

    res.json({
      success: true, timestamp: new Date().toISOString(),
      since: sinceFormatted, total_changed: rows.length,
      data: rows.map(r => formatAccount(r, req)),
    });
  } catch (err) {
    console.error('Regional sync error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Public: Approved teams API (for Kejurnas)
router.get('/approved-teams', async (req, res) => {
  try {
    const { event_id, category_id, region } = req.query;
    let query = `
      SELECT kr.id, kr.club_name, kr.coach_name, kr.manager_name, kr.region,
             kc.category_name, p.name as province_name, kr.status
      FROM kejurnas_registrations kr
      JOIN kejurnas_categories kc ON kr.category_id = kc.id
      LEFT JOIN provinces p ON kr.province_id = p.id
      WHERE kr.status = 'approved'
    `;
    const params = [];

    if (event_id) { query += ' AND kr.event_id = ?'; params.push(parseInt(event_id)); }
    if (category_id) { query += ' AND kr.category_id = ?'; params.push(parseInt(category_id)); }
    if (region) { query += ' AND kr.region = ?'; params.push(region); }

    query += ' ORDER BY kr.club_name ASC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Approved teams error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;

