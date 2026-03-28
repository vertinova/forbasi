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

// Get members with KTA status (for Pengda/Pengcab dashboards)
exports.getMembersWithKtaStatus = async (req, res) => {
  try {
    const { role_id, search, kta_status, city_id, page = 1, limit = 10 } = req.query;
    const filters = {};

    // Valid kta_status values
    const validKtaStatuses = ['all', 'issued', 'expired', 'not_issued', 'not_applied'];

    // Auto-filter by region based on user role
    const currentUser = await User.findById(req.user.id);
    if (req.user.role_id === 2) {
      // Pengcab: filter by city
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      // Pengda: filter by province
      filters.province_id = currentUser.province_id;
      // Optionally filter by city within province
      if (city_id) filters.city_id = parseInt(city_id);
    }

    if (role_id) filters.role_id = parseInt(role_id);
    if (search) filters.search = search;
    // Only apply kta_status if it's a valid value
    if (kta_status && validKtaStatuses.includes(kta_status)) {
      filters.kta_status = kta_status;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    filters.limit = limitNum;
    filters.offset = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      User.getMembersWithKtaStatus(filters),
      User.countMembersWithKtaStatus(filters)
    ]);

    return res.json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get members with KTA status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export members with KTA status to Excel (for Pengda/Pengcab)
exports.exportMembersWithKta = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { search, kta_status, city_id } = req.query;
    const filters = { limit: 10000, offset: 0 };

    // Valid kta_status values
    const validKtaStatuses = ['all', 'issued', 'expired', 'not_issued', 'not_applied'];

    // Auto-filter by region based on user role
    const currentUser = await User.findById(req.user.id);
    if (req.user.role_id === 2) {
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      filters.province_id = currentUser.province_id;
      if (city_id) filters.city_id = parseInt(city_id);
    }

    if (search) filters.search = search;
    // Only apply kta_status if it's a valid value
    if (kta_status && validKtaStatuses.includes(kta_status)) {
      filters.kta_status = kta_status;
    }

    const members = await User.getMembersWithKtaStatus(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Anggota KTA');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 },
      { header: 'Role', key: 'role_name', width: 15 },
      { header: 'Status KTA', key: 'kta_status_label', width: 20 },
      { header: 'Tanggal Terbit KTA', key: 'kta_issued_at', width: 20 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    members.forEach((m, idx) => {
      const issuedAt = m.kta_issued_at ? new Date(m.kta_issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
      sheet.addRow({
        no: idx + 1,
        club_name: m.club_name || '-',
        username: m.username || '-',
        email: m.email || '-',
        phone: m.phone || '-',
        province_name: m.province_name || '-',
        city_name: m.city_name || '-',
        role_name: m.role_name || '-',
        kta_status_label: m.kta_status_label || '-',
        kta_issued_at: issuedAt,
      });
    });

    // Auto size columns - use header length as base
    sheet.columns.forEach(column => {
      const headerLength = column.header ? column.header.length : 10;
      column.width = Math.min(headerLength + 2, 40);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Data_Anggota_KTA_${new Date().toISOString().slice(0, 10)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export members error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get issued KTA members (for Pengda/Pengcab to view their issued KTAs)
exports.getIssuedKtaMembers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const filters = {};

    // Auto-filter by region based on user role
    const currentUser = await User.findById(req.user.id);
    if (req.user.role_id === 2) {
      // Pengcab: filter by city
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      // Pengda: filter by province
      filters.province_id = currentUser.province_id;
    }

    if (search) filters.search = search;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    filters.limit = limitNum;
    filters.offset = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      User.getIssuedKtaMembers(filters),
      User.countIssuedKtaMembers(filters)
    ]);

    return res.json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get issued KTA members error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get cities in admin's province (for Pengda member filtering)
exports.getCitiesInProvince = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.province_id) {
      return res.status(400).json({ success: false, message: 'Province tidak ditemukan' });
    }

    const cities = await City.findByProvinceId(currentUser.province_id);
    return res.json({ success: true, data: cities });
  } catch (err) {
    console.error('Get cities in province error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
