const prisma = require('../lib/prisma');
const db = require('../lib/db-compat');
const KtaApplication = require('../models/KtaApplication');
const User = require('../models/User');

function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

// Admin dashboard stats (PB)
exports.getDashboardStats = async (req, res) => {
  try {
    const ktaStats = await KtaApplication.getStats();

    const userStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as anggota,
        SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as pengcab,
        SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) as pengda,
        SUM(CASE WHEN role_id = 4 THEN 1 ELSE 0 END) as pb
      FROM users
    `;

    const balanceStats = await prisma.$queryRaw`
      SELECT
        COALESCE(SUM(nominal_paid), 0) as total_saldo_masuk,
        COUNT(CASE WHEN nominal_paid > 0 THEN 1 END) as total_payments
      FROM kta_applications
      WHERE status IN ('approved_pb', 'kta_issued')
    `;

    return res.json({
      success: true,
      data: {
        kta: ktaStats,
        users: normBigInt(userStats[0]),
        balance: normBigInt(balanceStats[0]),
      }
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get balance / saldo report
exports.getBalanceReport = async (req, res) => {
  try {
    const { province_id, city_id, month, year, status } = req.query;

    let query = `
      SELECT ka.id, u.club_name, ka.nominal_paid, ka.status,
             ka.approved_at_pb, p.name as province_name, c.name as city_name
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ka.nominal_paid > 0
    `;
    const params = [];

    if (province_id) {
      query += ' AND ka.province_id = ?';
      params.push(parseInt(province_id));
    }
    if (city_id) {
      query += ' AND ka.city_id = ?';
      params.push(parseInt(city_id));
    }
    if (month) {
      query += ' AND MONTH(ka.approved_at_pb) = ?';
      params.push(parseInt(month));
    }
    if (year) {
      query += ' AND YEAR(ka.approved_at_pb) = ?';
      params.push(parseInt(year));
    }
    if (status) {
      query += ' AND ka.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ka.approved_at_pb DESC';

    const [rows] = await db.query(query, params);

    const totalSaldo = rows.reduce((sum, r) => sum + (parseFloat(r.nominal_paid) || 0), 0);

    return res.json({
      success: true,
      data: {
        records: rows,
        total: totalSaldo,
        count: rows.length
      }
    });
  } catch (err) {
    console.error('Get balance report error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export members to Excel
exports.exportMembers = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { province_id, city_id, status } = req.query;

    let query = `
      SELECT u.club_name, u.username, u.email, u.phone, u.address,
             p.name as province_name, c.name as city_name,
             ka.status, ka.coach_name, ka.manager_name, ka.kta_issued_at, ka.nominal_paid
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (province_id) {
      query += ' AND ka.province_id = ?';
      params.push(parseInt(province_id));
    }
    if (city_id) {
      query += ' AND ka.city_id = ?';
      params.push(parseInt(city_id));
    }
    if (status) {
      query += ' AND ka.status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.club_name ASC';

    const [rows] = await db.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Anggota');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 },
      { header: 'Pelatih', key: 'coach_name', width: 20 },
      { header: 'Manajer', key: 'manager_name', width: 20 },
      { header: 'Status KTA', key: 'status', width: 15 },
      { header: 'Tanggal KTA', key: 'kta_issued_at', width: 18 },
      { header: 'Nominal Bayar', key: 'nominal_paid', width: 15 }
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D3557' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=data_anggota_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export members error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};

// Export Saldo to Excel
exports.exportSaldo = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { province_id, month, year } = req.query;

    let query = `
      SELECT ka.id, u.club_name, ka.nominal_paid, ka.status,
             ka.approved_at_pb, p.name as province_name, c.name as city_name,
             u.bank_account_number
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ka.nominal_paid > 0
    `;
    const params = [];

    if (province_id) { query += ' AND ka.province_id = ?'; params.push(parseInt(province_id)); }
    if (month) { query += ' AND MONTH(ka.approved_at_pb) = ?'; params.push(parseInt(month)); }
    if (year) { query += ' AND YEAR(ka.approved_at_pb) = ?'; params.push(parseInt(year)); }

    query += ' ORDER BY ka.approved_at_pb DESC';
    const [rows] = await db.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Saldo');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 },
      { header: 'Nominal Bayar', key: 'nominal_paid', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tanggal Bayar', key: 'approved_at_pb', width: 18 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9500' } };

    let total = 0;
    rows.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
      total += parseFloat(row.nominal_paid) || 0;
    });

    const totalRow = sheet.addRow({ no: '', club_name: 'TOTAL', nominal_paid: total });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=saldo_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export saldo error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export saldo' });
  }
};

// Export Rekening to Excel
exports.exportRekening = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { province_id } = req.query;

    let query = `
      SELECT u.id, u.club_name, u.username, u.bank_account_number,
             p.name as province_name, c.name as city_name
      FROM users u
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.bank_account_number IS NOT NULL AND u.bank_account_number != ''
    `;
    const params = [];

    if (province_id) { query += ' AND u.province_id = ?'; params.push(parseInt(province_id)); }

    query += ' ORDER BY u.club_name ASC';
    const [rows] = await db.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekening');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'No. Rekening', key: 'bank_account_number', width: 25 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D3557' } };

    rows.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rekening_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export rekening error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export rekening' });
  }
};

// Pengcab: Get incoming balance from PB (via pb_payments_recap)
exports.getBalancePengcab = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_incoming_balance
       FROM pb_payments_recap
       WHERE recipient_type = 'pengcab' AND recipient_id = ?`,
      [req.user.id]
    );
    const [transactions] = await db.query(
      `SELECT pr.*, u.club_name as sender_name
       FROM pb_payments_recap pr
       LEFT JOIN users u ON pr.created_by = u.id
       WHERE pr.recipient_type = 'pengcab' AND pr.recipient_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: {
        total_incoming_balance: rows[0].total_incoming_balance,
        transactions
      }
    });
  } catch (err) {
    console.error('Get pengcab balance error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Pengda: Get incoming balance from PB (via pb_payments_recap)
exports.getBalancePengda = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_incoming_balance
       FROM pb_payments_recap
       WHERE recipient_type = 'pengda' AND recipient_id = ?`,
      [req.user.id]
    );
    const [transactions] = await db.query(
      `SELECT pr.*, u.club_name as sender_name
       FROM pb_payments_recap pr
       LEFT JOIN users u ON pr.created_by = u.id
       WHERE pr.recipient_type = 'pengda' AND pr.recipient_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: {
        total_incoming_balance: rows[0].total_incoming_balance,
        transactions
      }
    });
  } catch (err) {
    console.error('Get pengda balance error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get approved/generated KTA list (for Pengcab/Pengda tabs showing issued KTAs)
exports.getApprovedGeneratedKTA = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const currentUser = await User.findById(req.user.id);

    let query = `
      SELECT ka.*, u.club_name, u.email, u.phone,
             p.name as province_name, c.name as city_name
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ka.status IN ('approved_pb', 'kta_issued')
        AND ka.generated_kta_file_path_pb IS NOT NULL
    `;
    const params = [];

    if (req.user.role_id === 2) {
      query += ' AND ka.province_id = ? AND ka.city_id = ?';
      params.push(currentUser.province_id, currentUser.city_id);
    } else if (req.user.role_id === 3) {
      query += ' AND ka.province_id = ?';
      params.push(currentUser.province_id);
    }

    if (search) {
      query += ' AND (u.club_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countQuery = query.replace(/SELECT ka\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await db.query(countQuery, params);

    query += ' ORDER BY ka.kta_issued_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    return res.json({
      success: true,
      data: {
        applications: rows,
        pagination: {
          total: countRows[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countRows[0].total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('Get approved generated KTA error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
