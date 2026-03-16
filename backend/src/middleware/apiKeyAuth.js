/**
 * External API Key Authentication Middleware
 * Validates X-API-Key header and checks permissions
 */
const crypto = require('crypto');
const db = require('../lib/db-compat');

/**
 * Authenticate API key from X-API-Key header
 * Sets req.apiKey with key info (id, key_name, region, province_id, permissions)
 */
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'API key diperlukan (header X-API-Key)' });
  }

  // Look up key in database
  db.query(
    'SELECT id, key_name, api_key, region, province_id, permissions, is_active, expires_at FROM external_api_keys WHERE api_key = ?',
    [apiKey]
  ).then(([rows]) => {
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'API key tidak valid' });
    }

    const keyData = rows[0];

    if (!keyData.is_active) {
      return res.status(403).json({ success: false, message: 'API key tidak aktif' });
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(403).json({ success: false, message: 'API key sudah expired' });
    }

    // Parse permissions
    let permissions = [];
    try {
      permissions = typeof keyData.permissions === 'string'
        ? JSON.parse(keyData.permissions)
        : keyData.permissions;
    } catch { permissions = []; }

    req.apiKey = {
      id: keyData.id,
      key_name: keyData.key_name,
      region: keyData.region,
      province_id: keyData.province_id,
      permissions
    };

    // Update last_used_at (fire and forget)
    db.query('UPDATE external_api_keys SET last_used_at = NOW() WHERE id = ?', [keyData.id]).catch(() => {});

    next();
  }).catch(err => {
    console.error('API key auth error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  });
}

/**
 * Check if API key has required permission
 * @param {string} permission - e.g. 'landing:read', 'pengcab:write'
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ success: false, message: 'API key tidak ditemukan' });
    }

    const perms = req.apiKey.permissions || [];

    // Check for wildcard or specific permission
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }

    // Check module-level wildcard (e.g. 'landing:*' covers 'landing:read')
    const [module] = permission.split(':');
    if (perms.includes(`${module}:*`)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission '${permission}' diperlukan`
    });
  };
}

/**
 * Generate a secure random API key
 * @param {string} prefix - e.g. 'fbsi'
 */
function generateApiKey(prefix = 'fbsi') {
  return `${prefix}_${crypto.randomBytes(32).toString('hex')}`;
}

module.exports = {
  authenticateApiKey,
  requirePermission,
  generateApiKey
};
