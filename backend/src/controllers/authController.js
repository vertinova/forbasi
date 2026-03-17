const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { LicenseUser } = require('../models/License');
const { SuperAdmin } = require('../models/Common');
const { sendEmail } = require('../utils/emailSender');
const prisma = require('../lib/prisma');

// Generate tokens
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
};

const getRoleName = (roleId) => {
  const roles = { 1: 'anggota', 2: 'pengcab', 3: 'pengda', 4: 'pb', 5: 'penyelenggara' };
  return roles[roleId] || 'unknown';
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    // 1. Check super_admins
    const superAdmin = await SuperAdmin.findByUsername(username);
    if (superAdmin) {
      const match = await bcrypt.compare(password, superAdmin.password);
      if (match) {
        await SuperAdmin.updateLastLogin(superAdmin.id);
        const tokenPayload = {
          id: superAdmin.id,
          username: superAdmin.username,
          role_id: 99,
          role: 'super_admin',
          user_type: 'super_admin'
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        return res.json({
          success: true,
          message: 'Login berhasil',
          data: {
            user: { id: superAdmin.id, username: superAdmin.username, full_name: superAdmin.full_name, role: 'super_admin', user_type: 'super_admin' },
            accessToken,
            refreshToken
          }
        });
      }
    }

    // 2. Check license_users
    const licenseUser = await LicenseUser.findByUsername(username);
    if (licenseUser) {
      const match = await bcrypt.compare(password, licenseUser.password);
      if (match) {
        await LicenseUser.updateLastLogin(licenseUser.id);
        const tokenPayload = {
          id: licenseUser.id,
          username: licenseUser.username,
          role_id: 0,
          role: licenseUser.role,
          user_type: 'license_user'
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        return res.json({
          success: true,
          message: 'Login berhasil',
          data: {
            user: { id: licenseUser.id, username: licenseUser.username, email: licenseUser.email, role: licenseUser.role, user_type: 'license_user' },
            accessToken,
            refreshToken
          }
        });
      }
    }

    // 3. Check users
    const user = await User.findByUsername(username);
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const tokenPayload = {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          role: getRoleName(user.role_id),
          user_type: 'user'
        };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Fetch logo_path from latest KTA application
        const latestKta = await prisma.kta_applications.findFirst({
          where: { user_id: user.id },
          orderBy: { id: 'desc' },
          select: { logo_path: true }
        });

        return res.json({
          success: true,
          message: 'Login berhasil',
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              club_name: user.club_name,
              role_id: user.role_id,
              role: getRoleName(user.role_id),
              province_id: user.province_id,
              city_id: user.city_id,
              user_type: 'user',
              logo_path: latestKta?.logo_path || null
            },
            accessToken,
            refreshToken
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

/**
 * Regional Login - Login via regional subdomain (e.g., jabar.forbasi.or.id)
 * Only allows users (role 1/2/3) from the specified province
 * PB (role 4), super_admin, and license_users cannot login via regional
 */
exports.loginRegional = async (req, res) => {
  try {
    const { username, password, region } = req.body;
    const { getRegion } = require('../config/regions');

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    if (!region) {
      return res.status(400).json({ success: false, message: 'Region tidak valid' });
    }

    // Validate region code
    const regionConfig = getRegion(region);
    if (!regionConfig) {
      return res.status(400).json({ success: false, message: `Region '${region}' tidak terdaftar` });
    }

    // Only check users table (not super_admin or license_users)
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    // Reject PB (role 4) - they must use main domain
    if (user.role_id === 4) {
      return res.status(403).json({ 
        success: false, 
        message: 'Akun PB tidak dapat login melalui subdomain regional. Silakan gunakan domain utama.' 
      });
    }

    // Validate user belongs to the region (province_id must match)
    if (user.province_id !== regionConfig.province_id) {
      return res.status(403).json({ 
        success: false, 
        message: `Akun Anda tidak terdaftar di wilayah ${regionConfig.name}` 
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role: getRoleName(user.role_id),
      user_type: 'user',
      region: region // Include region in token for tracking
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Fetch logo_path from latest KTA application
    const latestKta = await prisma.kta_applications.findFirst({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
      select: { logo_path: true }
    });

    // Determine redirect path based on role
    const redirectPaths = {
      1: '/anggota',   // Anggota -> AnggotaDashboard
      2: '/pengcab',   // Pengcab -> PengcabDashboard
      3: '/pengda',    // Pengda -> PengdaDashboard
    };

    return res.json({
      success: true,
      message: `Login berhasil via ${regionConfig.name}`,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          club_name: user.club_name,
          role_id: user.role_id,
          role: getRoleName(user.role_id),
          province_id: user.province_id,
          city_id: user.city_id,
          user_type: 'user',
          logo_path: latestKta?.logo_path || null,
          region: regionConfig.name
        },
        accessToken,
        refreshToken,
        redirect: redirectPaths[user.role_id] || '/dashboard'
      }
    });
  } catch (err) {
    console.error('Regional login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get available regions for login
 * Public endpoint - no auth required
 */
exports.getRegions = async (req, res) => {
  try {
    const { getAllRegions } = require('../config/regions');
    return res.json({
      success: true,
      data: getAllRegions()
    });
  } catch (err) {
    console.error('Get regions error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token diperlukan' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenPayload = {
      id: decoded.id,
      username: decoded.username,
      role_id: decoded.role_id,
      role: decoded.role,
      user_type: decoded.user_type
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    return res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token tidak valid' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { id, user_type } = req.user;
    let userData;

    if (user_type === 'super_admin') {
      userData = await SuperAdmin.findById(id);
      if (userData) {
        delete userData.password;
        userData.user_type = 'super_admin';
        userData.role = 'super_admin';
      }
    } else if (user_type === 'license_user') {
      userData = await LicenseUser.findById(id);
      if (userData) {
        delete userData.password;
        userData.user_type = 'license_user';
      }
    } else {
      userData = await User.findById(id);
      if (userData) {
        delete userData.password;
        delete userData.reset_token;
        delete userData.reset_token_expires_at;
        userData.user_type = 'user';
        userData.role = getRoleName(userData.role_id);

        // Fetch logo_path from latest KTA application
        const latestKta = await prisma.kta_applications.findFirst({
          where: { user_id: id },
          orderBy: { id: 'desc' },
          select: { logo_path: true }
        });
        userData.logo_path = latestKta?.logo_path || null;
      }
    }

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    return res.json({ success: true, data: userData });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    let user;
    if (req.user.user_type === 'user') {
      user = await User.findById(userId);
    } else if (req.user.user_type === 'license_user') {
      user = await LicenseUser.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    if (req.user.user_type === 'user') {
      await User.update(userId, { password: hashed });
    } else {
      const db = require('../lib/db-compat');
      await db.query('UPDATE license_users SET password = ? WHERE id = ?', [hashed, userId]);
    }

    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { club_name, username, email, phone, address, password, confirm_password, province_id, city_id } = req.body;

    if (!club_name || !username || !email || !password || !confirm_password || !province_id || !city_id) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Password dan konfirmasi tidak cocok' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username sudah terdaftar' });
    }
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await User.create({
      club_name, username, email, phone: phone || null, address: address || null,
      password: hashedPassword, role_id: 1, province_id, city_id
    });

    return res.status(201).json({ success: true, message: 'Pendaftaran berhasil! Silakan login.', data: { id: userId } });
  } catch (err) {
    console.error('Register user error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.registerLicenseUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation with specific error messages
    const errors = [];
    if (!username || username.trim().length === 0) errors.push('Username wajib diisi');
    if (!email || email.trim().length === 0) errors.push('Email wajib diisi');
    if (!password) errors.push('Password wajib diisi');
    if (!role) errors.push('Jenis akun wajib dipilih');
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', '), errors });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }

    // Username validation
    if (username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username minimal 3 karakter' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ success: false, message: 'Username hanya boleh huruf, angka, dan underscore' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    if (!['pelatih', 'juri'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Jenis akun tidak valid. Pilih Pelatih atau Juri' });
    }

    // Check existing username
    const existingUser = await LicenseUser.findByUsername(username.trim());
    if (existingUser) {
      return res.status(400).json({ success: false, message: `Username "${username}" sudah digunakan. Silakan pilih username lain.` });
    }

    // Check existing email
    const existingEmail = await LicenseUser.findByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ success: false, message: `Email "${email}" sudah terdaftar. Gunakan email lain atau login dengan akun yang sudah ada.` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await LicenseUser.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      data: { id: userId }
    });
  } catch (err) {
    console.error('Register license user error:', err);
    
    // Handle Prisma unique constraint errors
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      if (field === 'username') {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' });
      }
      if (field === 'email') {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Gunakan email lain.' });
      }
      return res.status(400).json({ success: false, message: `${field} sudah digunakan` });
    }
    
    // Handle database connection errors
    if (err.code === 'P1001' || err.code === 'P1002') {
      return res.status(503).json({ success: false, message: 'Koneksi database gagal. Silakan coba beberapa saat lagi.' });
    }
    
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
  }
};

exports.registerPenyelenggara = async (req, res) => {
  try {
    const { nama_organisasi, username, email, phone, address, password, confirm_password, province_id, city_id } = req.body;

    if (!nama_organisasi || !username || !email || !password || !confirm_password || !province_id || !city_id) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Password dan konfirmasi tidak cocok' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username sudah terdaftar' });
    }
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await User.create({
      club_name: nama_organisasi, username, email, phone: phone || null, address: address || null,
      password: hashedPassword, role_id: 5, province_id: parseInt(province_id), city_id: parseInt(city_id)
    });

    return res.status(201).json({ success: true, message: 'Pendaftaran penyelenggara berhasil! Silakan login.', data: { id: userId } });
  } catch (err) {
    console.error('Register penyelenggara error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ====== SSO (Single Sign-On) dari Regional ======

// In-memory store untuk SSO tokens (sekali pakai, TTL 60 detik)
const ssoTokenStore = new Map();

// Bersihkan expired tokens setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of ssoTokenStore.entries()) {
    if (now > data.expiresAt) ssoTokenStore.delete(token);
  }
}, 5 * 60 * 1000);

// POST /api/auth/sso-exchange — dipanggil oleh backend regional via API Key
exports.ssoExchange = async (req, res) => {
  try {
    const { forbasiId, role_id, role, user_type, region } = req.body;

    if (!forbasiId) {
      return res.status(400).json({ success: false, message: 'forbasiId wajib diisi.' });
    }

    // Verifikasi user ada di database Pusat
    const user = await User.findById(forbasiId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan di Pusat.' });
    }

    // Tentukan redirect path berdasarkan role
    const REDIRECT_MAP = { 1: '/anggota', 2: '/pengcab', 3: '/pengda', 4: '/pb', 5: '/penyelenggara' };
    const redirectPath = REDIRECT_MAP[role_id] || '/anggota';

    // Buat one-time SSO token
    const ssoToken = crypto.randomBytes(32).toString('hex');

    ssoTokenStore.set(ssoToken, {
      userId: user.id,
      username: user.username,
      role_id: role_id,
      role: role,
      user_type: user_type || 'user',
      region: region,
      redirectPath,
      expiresAt: Date.now() + 60 * 1000,
    });

    res.json({ success: true, ssoToken, redirectPath });
  } catch (error) {
    console.error('[SSO Exchange] Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat SSO token.' });
  }
};

// POST /api/auth/sso-verify — dipanggil oleh frontend Pusat untuk tukar SSO token → JWT
exports.ssoVerify = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token wajib diisi.' });
    }

    const data = ssoTokenStore.get(token);
    if (!data) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
    }

    // Hapus token (sekali pakai)
    ssoTokenStore.delete(token);

    if (Date.now() > data.expiresAt) {
      return res.status(401).json({ success: false, message: 'Token sudah expired.' });
    }

    // Buat JWT Pusat
    const payload = {
      id: data.userId,
      username: data.username,
      role_id: data.role_id,
      role: data.role,
      user_type: data.user_type,
      region: data.region,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Ambil user data lengkap
    const user = await User.findById(data.userId);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.club_name,
          role_id: data.role_id,
          role: data.role,
          user_type: data.user_type,
          province_id: user.province_id,
        },
        redirectPath: data.redirectPath,
      }
    });
  } catch (error) {
    console.error('[SSO Verify] Error:', error);
    res.status(500).json({ success: false, message: 'Gagal verifikasi SSO token.' });
  }
};

