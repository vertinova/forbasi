const User = require('../models/User');
const { Province, City } = require('../models/Common');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    delete user.password;
    delete user.reset_token;
    delete user.reset_token_expires_at;
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { club_name, email, phone, address, province_id, city_id } = req.body;
    const updateData = {};

    if (club_name) updateData.club_name = club_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (province_id) updateData.province_id = province_id;
    if (city_id) updateData.city_id = city_id;

    await User.update(req.user.id, updateData);
    return res.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role_id, province_id, city_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filters = { limit: parseInt(limit), offset };
    if (role_id) filters.role_id = parseInt(role_id);
    if (province_id) filters.province_id = parseInt(province_id);
    if (city_id) filters.city_id = parseInt(city_id);
    if (search) filters.search = search;

    // Restrict access: pengcab sees only their city, pengda sees their province
    if (req.user.role_id === 2) {
      const currentUser = await User.findById(req.user.id);
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      const currentUser = await User.findById(req.user.id);
      filters.province_id = currentUser.province_id;
    }

    const [users, total] = await Promise.all([
      User.findAll(filters),
      User.count(filters)
    ]);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.getProvinces = async (req, res) => {
  try {
    const provinces = await Province.findAll();
    return res.json({ success: true, data: provinces });
  } catch (err) {
    console.error('Get provinces error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.getCities = async (req, res) => {
  try {
    const { province_id } = req.params;
    const cities = await City.findByProvinceId(parseInt(province_id));
    return res.json({ success: true, data: cities });
  } catch (err) {
    console.error('Get cities error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Download club logo
exports.downloadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));
    if (!user || !user.logo_path) {
      return res.status(404).json({ success: false, message: 'Logo tidak ditemukan' });
    }

    const logoPath = path.join(__dirname, '../../uploads', user.logo_path);
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ success: false, message: 'File logo tidak ditemukan' });
    }

    res.download(logoPath);
  } catch (err) {
    console.error('Download logo error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Suspend / unsuspend user
exports.toggleSuspend = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const newStatus = user.is_suspended ? 0 : 1;
    await User.update(parseInt(id), { is_suspended: newStatus });

    return res.json({
      success: true,
      message: newStatus ? 'User telah disuspend' : 'User telah diaktifkan kembali',
      data: { is_suspended: newStatus }
    });
  } catch (err) {
    console.error('Toggle suspend error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Update bank account number
exports.updateBankAccount = async (req, res) => {
  try {
    const { bank_account_number } = req.body;
    await User.update(req.user.id, { bank_account_number: bank_account_number || '' });
    return res.json({ success: true, message: 'No. Rekening berhasil diperbarui' });
  } catch (err) {
    console.error('Update bank account error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Change own password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await User.update(req.user.id, { password: hashed });
    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB Admin: Reset any user's password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await User.update(parseInt(id), { password: hashed });
    return res.json({ success: true, message: `Password ${user.club_name || user.username} berhasil direset` });
  } catch (err) {
    console.error('Reset user password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB Admin: Delete user (with KTA dependency check)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../lib/db-compat');
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Check KTA dependencies
    const [ktaRows] = await db.query(
      'SELECT COUNT(*) as count FROM kta_applications WHERE user_id = ?', [parseInt(id)]
    );
    if (ktaRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `User memiliki ${ktaRows[0].count} pengajuan KTA. Hapus pengajuan KTA terlebih dahulu atau suspend user.`
      });
    }

    await db.query('DELETE FROM users WHERE id = ?', [parseInt(id)]);
    return res.json({ success: true, message: `User ${user.club_name || user.username} berhasil dihapus` });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

