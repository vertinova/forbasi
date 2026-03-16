const PbPayment = require('../models/PbPayment');
const path = require('path');
const fs = require('fs');

// Get saldo summary (masuk, keluar, sisa)
exports.getSaldoSummary = async (req, res) => {
  try {
    const { province_id, city_id, month, year, status } = req.query;
    const filters = {};
    if (province_id) filters.province_id = parseInt(province_id);
    if (city_id) filters.city_id = parseInt(city_id);
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (status) filters.status = status;

    const saldoMasuk = await PbPayment.getSaldoMasuk(filters);
    const saldoKeluar = await PbPayment.getSaldoKeluar(filters);

    return res.json({
      success: true,
      data: {
        saldo_masuk: saldoMasuk,
        saldo_keluar: saldoKeluar,
        saldo_sisa: saldoMasuk - saldoKeluar
      }
    });
  } catch (err) {
    console.error('Get saldo summary error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get recipient bank details + amount to pay
exports.getRecipientDetails = async (req, res) => {
  try {
    const { recipient_id, month, year } = req.query;
    if (!recipient_id) {
      return res.status(400).json({ success: false, message: 'recipient_id wajib diisi' });
    }

    const bankDetails = await PbPayment.getRecipientBankDetails(parseInt(recipient_id));
    if (!bankDetails) {
      return res.status(404).json({ success: false, message: 'Penerima tidak ditemukan' });
    }

    const amountToPay = await PbPayment.getAmountToPay(
      bankDetails.recipient_type,
      bankDetails.province_id,
      bankDetails.city_id,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    return res.json({
      success: true,
      data: {
        ...bankDetails,
        amount_to_pay: amountToPay
      }
    });
  } catch (err) {
    console.error('Get recipient details error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Process recap payment
exports.processRecapPayment = async (req, res) => {
  try {
    const { recipient_user_id, recipient_type, recap_month, recap_year, amount_paid, notes } = req.body;

    if (!recipient_user_id || !recipient_type || !['pengda', 'pengcab'].includes(recipient_type)) {
      return res.status(400).json({ success: false, message: 'Parameter pembayaran tidak valid' });
    }
    const parsedAmount = parseFloat(String(amount_paid).replace(/\./g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal harus lebih dari nol' });
    }
    if (!recap_year) {
      return res.status(400).json({ success: false, message: 'Periode rekap tidak valid' });
    }

    // Payment proof file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Bukti transfer wajib diunggah' });
    }

    // Get recipient region
    const bankDetails = await PbPayment.getRecipientBankDetails(parseInt(recipient_user_id));
    if (!bankDetails) {
      return res.status(404).json({ success: false, message: 'Penerima tidak ditemukan' });
    }

    const month = recap_month ? parseInt(recap_month) : null;
    const year = parseInt(recap_year);
    const lastDay = month ? new Date(year, month, 0).getDate() : 31;
    const recapDate = month ? `${year}-${String(month).padStart(2, '0')}-${lastDay}` : `${year}-12-31`;

    const recapId = await PbPayment.createRecapPayment({
      recap_date: recapDate,
      recipient_type,
      recipient_id: parseInt(recipient_user_id),
      amount: parsedAmount,
      payment_proof_path: req.file.filename,
      notes: notes || null,
      processed_by_pb_id: req.user.id
    });

    // Mark KTA applications
    const updatedCount = await PbPayment.markKtasPaidForRecap(
      recapId, recipient_type,
      bankDetails.province_id, bankDetails.city_id,
      month, year
    );

    return res.json({
      success: true,
      message: 'Pembayaran rekap berhasil disimpan',
      data: { recap_id: recapId, kta_updated: updatedCount }
    });
  } catch (err) {
    console.error('Process recap payment error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const { recipient_type, month, year, limit = 50 } = req.query;
    const filters = {};
    if (recipient_type) filters.recipient_type = recipient_type;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    filters.limit = parseInt(limit);

    const history = await PbPayment.getPaymentHistory(filters);
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('Get payment history error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export full saldo (masuk+keluar) to Excel
exports.exportFullSaldo = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { province_id, city_id, month, year, status } = req.query;
    const filters = {};
    if (province_id) filters.province_id = parseInt(province_id);
    if (city_id) filters.city_id = parseInt(city_id);
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (status) filters.status = status;

    const transactions = await PbPayment.fetchTransactionsForExport(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Keuangan PB');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'transaction_date', width: 18 },
      { header: 'Tipe', key: 'transaction_type', width: 10 },
      { header: 'Pihak Terkait', key: 'related_party_name', width: 25 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 },
      { header: 'Nominal (Rp)', key: 'amount', width: 18 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Status KTA', key: 'kta_status', width: 15 },
      { header: 'No. Rekening', key: 'bank_account', width: 25 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };

    let totalMasuk = 0;
    let totalKeluar = 0;

    transactions.forEach(row => {
      const amount = parseFloat(row.amount) || 0;
      const bankAccount = row.transaction_type === 'Masuk'
        ? (row.user_bank_account_number || 'N/A')
        : (row.recipient_bank_account_number || 'N/A');

      if (row.transaction_type === 'Masuk') totalMasuk += amount;
      else totalKeluar += amount;

      sheet.addRow({ ...row, bank_account: bankAccount });
    });

    // Summary rows
    const emptyRow = sheet.addRow({});
    const masukRow = sheet.addRow({ city_name: 'Total Saldo Masuk', amount: totalMasuk });
    masukRow.font = { bold: true };
    const keluarRow = sheet.addRow({ city_name: 'Total Saldo Keluar', amount: totalKeluar });
    keluarRow.font = { bold: true };
    const sisaRow = sheet.addRow({ city_name: 'Saldo Akhir', amount: totalMasuk - totalKeluar });
    sisaRow.font = { bold: true };

    let filename = 'Laporan_Keuangan_PB';
    if (year) filename += `_${year}`;
    if (month) filename += `_${month}`;
    filename += `_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export full saldo error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export laporan keuangan' });
  }
};

// Get total unpaid amounts (hutang) for Pengda and Pengcab
exports.getTotalUnpaidAmounts = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filters = {};
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);

    const data = await PbPayment.getTotalUnpaidAmounts(filters);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get total unpaid amounts error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get list of issued KTAs
exports.getIssuedKtaList = async (req, res) => {
  try {
    const { province_id, city_id, month, year, search, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (province_id) filters.province_id = parseInt(province_id);
    if (city_id) filters.city_id = parseInt(city_id);
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (search) filters.search = search;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    filters.limit = limitNum;
    filters.offset = (pageNum - 1) * limitNum;

    const [ktaList, totalCount] = await Promise.all([
      PbPayment.getIssuedKtaList(filters),
      PbPayment.countIssuedKta(filters)
    ]);

    return res.json({
      success: true,
      data: {
        issued_ktas: ktaList,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get issued KTA list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export issued KTAs to Excel
exports.exportIssuedKta = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { province_id, city_id, month, year, search } = req.query;
    const filters = {};
    if (province_id) filters.province_id = parseInt(province_id);
    if (city_id) filters.city_id = parseInt(city_id);
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (search) filters.search = search;

    const ktaList = await PbPayment.getIssuedKtaList(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('KTA Terbit');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Klub', key: 'club_name', width: 30 },
      { header: 'Ketua', key: 'leader_name', width: 25 },
      { header: 'Barcode', key: 'kta_barcode_unique_id', width: 25 },
      { header: 'Provinsi (Pengda)', key: 'province_name', width: 22 },
      { header: 'Kota/Kab (Pengcab)', key: 'city_name', width: 22 },
      { header: 'Nominal Bayar (Rp)', key: 'nominal_paid', width: 20 },
      { header: 'Tanggal Pengajuan', key: 'created_at', width: 22 },
      { header: 'Tanggal Terbit', key: 'kta_issued_at', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

    ktaList.forEach((kta, i) => {
      sheet.addRow({
        no: i + 1,
        club_name: kta.club_name || '',
        leader_name: kta.leader_name || '',
        kta_barcode_unique_id: kta.kta_barcode_unique_id || '',
        province_name: kta.province_name || '',
        city_name: kta.city_name || '',
        nominal_paid: kta.nominal_paid ? Number(kta.nominal_paid) : 0,
        created_at: fmtDate(kta.created_at),
        kta_issued_at: fmtDate(kta.kta_issued_at),
      });
    });

    sheet.addRow({});
    const totalRow = sheet.addRow({ club_name: `Total: ${ktaList.length} KTA` });
    totalRow.font = { bold: true };

    let filename = 'KTA_Terbit';
    if (year) filename += `_${year}`;
    if (month) filename += `_${month}`;
    filename += `_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export issued KTA error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export data KTA terbit' });
  }
};

// ============ PENGDA BALANCE ENDPOINTS ============

// Get balance summary for Pengda
exports.getPengdaBalanceSummary = async (req, res) => {
  try {
    const totalBalance = await PbPayment.getPengdaBalanceSummary(req.user.id);
    return res.json({
      success: true,
      data: {
        total_balance: totalBalance,
        total_balance_formatted: `Rp ${totalBalance.toLocaleString('id-ID')}`
      }
    });
  } catch (err) {
    console.error('Get Pengda balance summary error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get balance transactions for Pengda
exports.getPengdaBalanceTransactions = async (req, res) => {
  try {
    const { month, year, search, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (search) filters.search = search;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    filters.limit = limitNum;
    filters.offset = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      PbPayment.getPengdaBalanceTransactions(req.user.id, filters),
      PbPayment.countPengdaTransactions(req.user.id, filters)
    ]);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get Pengda balance transactions error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ============ PENGCAB BALANCE ENDPOINTS ============

// Get balance summary for Pengcab
exports.getPengcabBalanceSummary = async (req, res) => {
  try {
    const totalBalance = await PbPayment.getPengcabBalanceSummary(req.user.id);
    return res.json({
      success: true,
      data: {
        total_balance: totalBalance,
        total_balance_formatted: `Rp ${totalBalance.toLocaleString('id-ID')}`
      }
    });
  } catch (err) {
    console.error('Get Pengcab balance summary error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get balance transactions for Pengcab
exports.getPengcabBalanceTransactions = async (req, res) => {
  try {
    const { month, year, search, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (search) filters.search = search;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    filters.limit = limitNum;
    filters.offset = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      PbPayment.getPengcabBalanceTransactions(req.user.id, filters),
      PbPayment.countPengcabTransactions(req.user.id, filters)
    ]);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get Pengcab balance transactions error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get Pengda bank info for Pengcab
exports.getPengdaBankInfo = async (req, res) => {
  try {
    const User = require('../models/User');
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.province_id) {
      return res.status(400).json({ success: false, message: 'Province tidak ditemukan' });
    }

    const pengdaInfo = await PbPayment.getPengdaBankInfo(currentUser.province_id);
    if (!pengdaInfo) {
      return res.status(404).json({ success: false, message: 'Pengurus Daerah tidak ditemukan' });
    }

    return res.json({
      success: true,
      data: pengdaInfo
    });
  } catch (err) {
    console.error('Get Pengda bank info error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
