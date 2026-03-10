const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { LicenseUser } = require('../models/License');
const { SuperAdmin } = require('../models/Common');
const { sendEmail } = require('../utils/emailSender');

// Generate tokens
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
};

const getRoleName = (roleId) => {
  const roles = { 1: 'anggota', 2: 'pengcab', 3: 'pengda', 4: 'pb' };
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
              user_type: 'user'
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

    await User.setResetToken(email, token, expiresAt);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset Password FORBASI',
      html: `
        <h2>Reset Password</h2>
        <p>Klik link berikut untuk mereset password Anda:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0d9500;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
        <p>Link berlaku selama 1 jam.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      `
    });

    return res.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token dan password baru wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.update(user.id, { password: hashedPassword });
    await User.clearResetToken(user.id);

    return res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    console.error('Reset password error:', err);
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

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    if (!['pelatih', 'juri'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }

    // Check existing
    const existingUser = await LicenseUser.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    }

    const existingEmail = await LicenseUser.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await LicenseUser.create({
      username,
      email,
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
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

