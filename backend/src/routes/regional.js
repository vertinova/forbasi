const router = require('express').Router();
const db = require('../lib/db-compat');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Regional API configurations
const REGIONAL_CONFIGS = {
  jabar: { province_id: 12, api_key_env: 'API_KEY_JABAR', name: 'Jawa Barat' },
  jakarta: { province_id: 11, api_key_env: 'API_KEY_JAKARTA', name: 'DKI Jakarta' },
  kalbar: { province_id: 20, api_key_env: 'API_KEY_KALBAR', name: 'Kalimantan Barat' }
};

// API key middleware for regional endpoints
const validateApiKey = (region) => (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const config = REGIONAL_CONFIGS[region];
  if (!config) {
    return res.status(404).json({ success: false, message: 'Region tidak ditemukan' });
  }
  const expectedKey = process.env[config.api_key_env] || `forbasi_${region}_2024`;
  if (apiKey !== expectedKey) {
    return res.status(401).json({ success: false, message: 'API key tidak valid' });
  }
  req.regionConfig = config;
  next();
};

// Regional JWT middleware
const authenticateRegional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'forbasi_jwt_secret_2024');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// Create routes for each region
Object.keys(REGIONAL_CONFIGS).forEach(region => {
  const config = REGIONAL_CONFIGS[region];

  // Ping
  router.get(`/${region}/ping`, validateApiKey(region), (req, res) => {
    res.json({ success: true, message: `API ${config.name} aktif`, timestamp: new Date().toISOString() });
  });

  // Login
  router.post(`/${region}/login`, validateApiKey(region), async (req, res) => {
    try {
      const { username, password } = req.body;
      const [users] = await db.query(
        'SELECT * FROM users WHERE username = ? AND province_id = ?',
        [username, config.province_id]
      );
      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
      }
      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
      }
      const token = jwt.sign(
        { id: user.id, role_id: user.role_id, province_id: user.province_id },
        process.env.JWT_SECRET || 'forbasi_jwt_secret_2024',
        { expiresIn: '24h' }
      );
      res.json({ success: true, token, user: { id: user.id, club_name: user.club_name, username: user.username } });
    } catch (err) {
      console.error(`Regional ${region} login error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Get accounts list
  router.get(`/${region}/accounts`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let query = `
        SELECT u.id, u.club_name, u.username, u.email, u.phone, u.address,
               c.name as city_name, ka.status as kta_status, ka.kta_barcode_unique_id
        FROM users u
        LEFT JOIN kta_applications ka ON u.id = ka.user_id
        LEFT JOIN cities c ON u.city_id = c.id
        WHERE u.province_id = ? AND u.role_id = 1
      `;
      const params = [config.province_id];

      if (search) {
        query += ' AND (u.club_name LIKE ? OR u.username LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s);
      }

      query += ' ORDER BY u.club_name ASC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [rows] = await db.query(query, params);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error(`Regional ${region} accounts error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Get single account
  router.get(`/${region}/accounts/:id`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT u.*, p.name as province_name, c.name as city_name,
                ka.status as kta_status, ka.kta_barcode_unique_id, ka.coach_name, ka.manager_name
         FROM users u
         LEFT JOIN kta_applications ka ON u.id = ka.user_id
         LEFT JOIN provinces p ON u.province_id = p.id
         LEFT JOIN cities c ON u.city_id = c.id
         WHERE u.id = ? AND u.province_id = ?`,
        [parseInt(req.params.id), config.province_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
      }
      const user = rows[0];
      delete user.password;
      delete user.reset_token;
      delete user.reset_token_expires_at;
      res.json({ success: true, data: user });
    } catch (err) {
      console.error(`Regional ${region} account detail error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Get KTA data for region
  router.get(`/${region}/kta`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const { status, search } = req.query;
      let query = `
        SELECT ka.*, u.club_name, u.username, c.name as city_name
        FROM kta_applications ka
        JOIN users u ON ka.user_id = u.id
        LEFT JOIN cities c ON ka.city_id = c.id
        WHERE ka.province_id = ?
      `;
      const params = [config.province_id];

      if (status) {
        query += ' AND ka.status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND u.club_name LIKE ?';
        params.push(`%${search}%`);
      }

      query += ' ORDER BY ka.created_at DESC';
      const [rows] = await db.query(query, params);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error(`Regional ${region} KTA error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Update profile
  router.put(`/${region}/profile`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const { club_name, email, phone, address, city_id } = req.body;
      const updateData = {};
      if (club_name) updateData.club_name = club_name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (city_id) updateData.city_id = city_id;

      const fields = Object.keys(updateData);
      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data untuk diperbarui' });
      }

      const sets = fields.map(f => `${f} = ?`).join(', ');
      await db.query(`UPDATE users SET ${sets} WHERE id = ? AND province_id = ?`,
        [...Object.values(updateData), req.user.id, config.province_id]);

      res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (err) {
      console.error(`Regional ${region} update profile error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Change password
  router.put(`/${region}/change-password`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const { old_password, new_password } = req.body;
      if (!old_password || !new_password || new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
      }

      const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }

      const isValid = await bcrypt.compare(old_password, users[0].password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Password lama salah' });
      }

      const hashed = await bcrypt.hash(new_password, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
      res.json({ success: true, message: 'Password berhasil diubah' });
    } catch (err) {
      console.error(`Regional ${region} change password error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });

  // Sync data
  router.get(`/${region}/sync`, validateApiKey(region), authenticateRegional, async (req, res) => {
    try {
      const [users] = await db.query(
        'SELECT COUNT(*) as total_users FROM users WHERE province_id = ? AND role_id = 1', [config.province_id]
      );
      const [kta] = await db.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'kta_issued\' THEN 1 ELSE 0 END) as issued FROM kta_applications WHERE province_id = ?',
        [config.province_id]
      );
      res.json({
        success: true,
        data: {
          region: config.name,
          province_id: config.province_id,
          total_users: users[0].total_users,
          kta_total: kta[0].total,
          kta_issued: kta[0].issued,
          synced_at: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error(`Regional ${region} sync error:`, err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  });
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

