const prisma = require('../lib/prisma');

const AMOUNT_PER_KTA = {
  pengda: 35000,
  pengcab: 50000,
  developer: 5000,
  pb_net: 10000,
};

const PbPayment = {
  async getSaldoMasuk(filters = {}) {
    const conds = ['ka.nominal_paid > 0'];
    const args = [];
    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(filters.city_id); }
    if (filters.month) { conds.push('MONTH(ka.created_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(ka.created_at) = ?'); args.push(filters.year); }
    if (filters.status) { conds.push('ka.status = ?'); args.push(filters.status); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(ka.nominal_paid), 0) as total FROM kta_applications ka WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(rows[0].total);
  },

  async getSaldoKeluar(filters = {}) {
    const conds = ['pr.amount > 0'];
    const args = [];
    if (filters.province_id) { conds.push('u.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('u.city_id = ?'); args.push(filters.city_id); }
    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(pr.amount), 0) as total
       FROM pb_payments_recap pr
       JOIN users u ON pr.recipient_id = u.id
       WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(rows[0].total);
  },

  async getAmountToPay(recipientType, provinceId, cityId, month, year, status = 'kta_issued') {
    const conds = ['status = ?'];
    const args = [status];

    if (recipientType === 'pengda' && provinceId) {
      conds.push('province_id = ?', '(amount_pb_to_pengda IS NULL OR amount_pb_to_pengda = 0)');
      args.push(provinceId);
    } else if (recipientType === 'pengcab' && cityId) {
      conds.push('city_id = ?', '(amount_pb_to_pengcab IS NULL OR amount_pb_to_pengcab = 0)');
      args.push(cityId);
    }

    if (month) { conds.push('MONTH(kta_issued_at) = ?'); args.push(month); }
    if (year) { conds.push('YEAR(kta_issued_at) = ?'); args.push(year); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as kta_count FROM kta_applications WHERE ${conds.join(' AND ')}`,
      ...args
    );
    const amountPerKta = AMOUNT_PER_KTA[recipientType] || 0;
    return Number(rows[0].kta_count) * amountPerKta;
  },

  async getRecipientBankDetails(userId) {
    const rows = await prisma.$queryRaw`
      SELECT u.bank_account_number, u.club_name, r.role_name, u.province_id, u.city_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${userId} AND r.role_name IN ('Pengurus Daerah', 'Pengurus Cabang') LIMIT 1
    `;
    if (!rows.length) return null;
    const row = rows[0];
    return {
      bank_account_number: row.bank_account_number || 'Belum Disetel',
      recipient_name: row.club_name || 'Tidak Ditemukan',
      recipient_type: row.role_name === 'Pengurus Daerah' ? 'pengda' : 'pengcab',
      province_id: row.province_id,
      city_id: row.city_id,
    };
  },

  async createRecapPayment(data) {
    const { recap_date, recipient_type, recipient_id, amount, payment_proof_path, notes, processed_by_pb_id } = data;
    await prisma.$executeRaw`
      INSERT INTO pb_payments_recap (recap_date, recipient_type, recipient_id, amount, payment_proof_path, notes, paid_at, processed_by_pb_id)
      VALUES (${recap_date}, ${recipient_type}, ${recipient_id}, ${amount}, ${payment_proof_path || null}, ${notes || null}, NOW(), ${processed_by_pb_id})
    `;
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async markKtasPaidForRecap(recapId, recipientType, provinceId, cityId, month, year) {
    const conds = ["status = 'kta_issued'"];
    const args = [];

    if (recipientType === 'pengda') {
      conds.push('province_id = ?', '(amount_pb_to_pengda IS NULL OR amount_pb_to_pengda = 0)');
      args.push(provinceId);
    } else if (recipientType === 'pengcab') {
      conds.push('city_id = ?', '(amount_pb_to_pengcab IS NULL OR amount_pb_to_pengcab = 0)');
      args.push(cityId);
    }

    if (month) { conds.push('MONTH(kta_issued_at) = ?'); args.push(month); }
    if (year) { conds.push('YEAR(kta_issued_at) = ?'); args.push(year); }

    const ktaRows = await prisma.$queryRawUnsafe(
      `SELECT id FROM kta_applications WHERE ${conds.join(' AND ')}`,
      ...args
    );
    if (!ktaRows.length) return 0;

    const ktaIds = ktaRows.map(r => r.id);
    const amountCol = recipientType === 'pengda' ? 'amount_pb_to_pengda' : 'amount_pb_to_pengcab';
    const amountPerKta = AMOUNT_PER_KTA[recipientType] || 0;
    const placeholders = ktaIds.map(() => '?').join(',');

    await prisma.$executeRawUnsafe(
      `UPDATE kta_applications SET pb_payment_recap_id = ?, ${amountCol} = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      recapId, amountPerKta, ...ktaIds
    );
    return ktaIds.length;
  },

  async getPaymentHistory(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.recipient_type) { conds.push('pr.recipient_type = ?'); args.push(filters.recipient_type); }
    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }

    let sql = `
      SELECT pr.*, u.club_name as recipient_name, u.bank_account_number,
             p.name as province_name, c.name as city_name
      FROM pb_payments_recap pr
      JOIN users u ON pr.recipient_id = u.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE ${conds.join(' AND ')}
      ORDER BY pr.paid_at DESC
    `;
    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  async fetchTransactionsForExport(filters = {}) {
    const conds1 = ['ka.nominal_paid IS NOT NULL', 'ka.nominal_paid > 0'];
    const conds2 = ['pr.amount IS NOT NULL', 'pr.amount > 0'];
    const args1 = [], args2 = [];

    if (filters.province_id) {
      conds1.push('ka.province_id = ?'); args1.push(filters.province_id);
      conds2.push('u.province_id = ?'); args2.push(filters.province_id);
    }
    if (filters.city_id) {
      conds1.push('ka.city_id = ?'); args1.push(filters.city_id);
      conds2.push('u.city_id = ?'); args2.push(filters.city_id);
    }
    if (filters.month) {
      conds1.push('MONTH(ka.created_at) = ?'); args1.push(filters.month);
      conds2.push('MONTH(pr.paid_at) = ?'); args2.push(filters.month);
    }
    if (filters.year) {
      conds1.push('YEAR(ka.created_at) = ?'); args1.push(filters.year);
      conds2.push('YEAR(pr.paid_at) = ?'); args2.push(filters.year);
    }
    if (filters.status) { conds1.push('ka.status = ?'); args1.push(filters.status); }

    const sql = `
      (SELECT ka.id, ka.created_at AS transaction_date, 'Masuk' AS transaction_type,
          COALESCE(u.club_name, 'Pengguna Tidak Ditemukan') AS related_party_name,
          p.name AS province_name, c.name AS city_name, ka.nominal_paid AS amount,
          'Pembayaran KTA dari user' AS description, ka.status AS kta_status,
          u.bank_account_number AS user_bank_account_number,
          NULL AS recipient_bank_account_number
      FROM kta_applications ka
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      LEFT JOIN users u ON ka.user_id = u.id
      WHERE ${conds1.join(' AND ')})
      UNION ALL
      (SELECT pr.id, pr.paid_at AS transaction_date, 'Keluar' AS transaction_type,
          COALESCE(u.club_name, 'Pengurus Tidak Ditemukan') AS related_party_name,
          prov.name AS province_name, city.name AS city_name, pr.amount,
          COALESCE(pr.notes, 'Rekap pembayaran') AS description, 'N/A' AS kta_status,
          NULL AS user_bank_account_number,
          u.bank_account_number AS recipient_bank_account_number
      FROM pb_payments_recap pr
      JOIN users u ON pr.recipient_id = u.id
      LEFT JOIN provinces prov ON u.province_id = prov.id
      LEFT JOIN cities city ON u.city_id = city.id
      WHERE ${conds2.join(' AND ')})
      ORDER BY transaction_date DESC`;

    return prisma.$queryRawUnsafe(sql, ...args1, ...args2);
  },

  // Get total unpaid amounts (hutang) for each recipient type
  async getTotalUnpaidAmounts(filters = {}) {
    const baseConds = ["status = 'kta_issued'"];
    const args = [];

    if (filters.month) { baseConds.push('MONTH(kta_issued_at) = ?'); args.push(filters.month); }
    if (filters.year) { baseConds.push('YEAR(kta_issued_at) = ?'); args.push(filters.year); }

    // Unpaid to Pengda
    const pengdaConds = [...baseConds, '(amount_pb_to_pengda IS NULL OR amount_pb_to_pengda = 0)'];
    const pengdaResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as kta_count FROM kta_applications WHERE ${pengdaConds.join(' AND ')}`,
      ...args
    );
    const unpaidPengdaCount = Number(pengdaResult[0].kta_count);

    // Unpaid to Pengcab
    const pengcabConds = [...baseConds, '(amount_pb_to_pengcab IS NULL OR amount_pb_to_pengcab = 0)'];
    const pengcabResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as kta_count FROM kta_applications WHERE ${pengcabConds.join(' AND ')}`,
      ...args
    );
    const unpaidPengcabCount = Number(pengcabResult[0].kta_count);

    // Total issued KTA
    const totalIssuedResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as kta_count FROM kta_applications WHERE ${baseConds.join(' AND ')}`,
      ...args
    );
    const totalIssuedCount = Number(totalIssuedResult[0].kta_count);

    return {
      hutang_pengda: unpaidPengdaCount * AMOUNT_PER_KTA.pengda,
      hutang_pengcab: unpaidPengcabCount * AMOUNT_PER_KTA.pengcab,
      hutang_developer: totalIssuedCount * AMOUNT_PER_KTA.developer, // Developer is calculated from all issued KTAs
      pb_net: totalIssuedCount * AMOUNT_PER_KTA.pb_net,
      unpaid_kta_count_pengda: unpaidPengdaCount,
      unpaid_kta_count_pengcab: unpaidPengcabCount,
      total_issued_kta: totalIssuedCount,
      rates: AMOUNT_PER_KTA
    };
  },

  // Get list of issued KTAs with optional filters
  async getIssuedKtaList(filters = {}) {
    const conds = ["ka.status = 'kta_issued'", 'ka.generated_kta_file_path_pb IS NOT NULL'];
    const args = [];

    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(filters.city_id); }
    if (filters.month) { conds.push('MONTH(ka.kta_issued_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(ka.kta_issued_at) = ?'); args.push(filters.year); }
    if (filters.search) {
      const term = `%${filters.search}%`;
      conds.push('(ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)');
      args.push(term, term, term);
    }

    let sql = `
      SELECT ka.id, ka.club_name, ka.leader_name, ka.kta_barcode_unique_id, ka.kta_issued_at,
             ka.generated_kta_file_path_pb, ka.amount_pb_to_pengda, ka.amount_pb_to_pengcab,
             p.name AS province_name, c.name AS city_name
      FROM kta_applications ka
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ${conds.join(' AND ')}
      ORDER BY ka.kta_issued_at DESC
    `;

    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }
    if (filters.offset) { sql += ' OFFSET ?'; args.push(filters.offset); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  // Count issued KTAs
  async countIssuedKta(filters = {}) {
    const conds = ["ka.status = 'kta_issued'", 'ka.generated_kta_file_path_pb IS NOT NULL'];
    const args = [];

    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(filters.city_id); }
    if (filters.month) { conds.push('MONTH(ka.kta_issued_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(ka.kta_issued_at) = ?'); args.push(filters.year); }
    if (filters.search) {
      const term = `%${filters.search}%`;
      conds.push('(ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)');
      args.push(term, term, term);
    }

    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM kta_applications ka WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(result[0].total);
  },

  // Get balance summary for Pengda (from PB payments)
  async getPengdaBalanceSummary(adminId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(amount), 0) as total_balance
       FROM pb_payments_recap
       WHERE recipient_type = 'pengda' AND recipient_id = ?`,
      adminId
    );
    return Number(rows[0].total_balance || 0);
  },

  // Get balance transactions for Pengda
  async getPengdaBalanceTransactions(adminId, filters = {}) {
    const conds = ["pr.recipient_type = 'pengda'", 'pr.recipient_id = ?'];
    const args = [adminId];

    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }
    if (filters.search) {
      conds.push('(pr.notes LIKE ? OR u_pb.username LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term);
    }

    let sql = `
      SELECT pr.id, pr.amount, pr.notes, pr.payment_proof_path, pr.paid_at, pr.recap_date,
             (SELECT GROUP_CONCAT(DISTINCT ka.club_name SEPARATOR ', ')
              FROM kta_applications ka
              WHERE ka.pb_payment_recap_id = pr.id) AS associated_clubs,
             u_pb.username AS processed_by_username
      FROM pb_payments_recap pr
      LEFT JOIN users u_pb ON pr.processed_by_pb_id = u_pb.id
      WHERE ${conds.join(' AND ')}
      ORDER BY pr.paid_at DESC
    `;

    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }
    if (filters.offset) { sql += ' OFFSET ?'; args.push(filters.offset); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  // Count Pengda balance transactions
  async countPengdaTransactions(adminId, filters = {}) {
    const conds = ["pr.recipient_type = 'pengda'", 'pr.recipient_id = ?'];
    const args = [adminId];

    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }

    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM pb_payments_recap pr WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(result[0].total);
  },

  // Get balance summary for Pengcab (from PB payments)
  async getPengcabBalanceSummary(adminId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(amount), 0) as total_balance
       FROM pb_payments_recap
       WHERE recipient_type = 'pengcab' AND recipient_id = ?`,
      adminId
    );
    return Number(rows[0].total_balance || 0);
  },

  // Get balance transactions for Pengcab
  async getPengcabBalanceTransactions(adminId, filters = {}) {
    const conds = ["pr.recipient_type = 'pengcab'", 'pr.recipient_id = ?'];
    const args = [adminId];

    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }
    if (filters.search) {
      conds.push('(pr.notes LIKE ? OR u_pb.username LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term);
    }

    let sql = `
      SELECT pr.id, pr.amount, pr.notes, pr.payment_proof_path, pr.paid_at, pr.recap_date,
             (SELECT GROUP_CONCAT(DISTINCT ka.club_name SEPARATOR ', ')
              FROM kta_applications ka
              WHERE ka.pb_payment_recap_id = pr.id) AS associated_clubs,
             u_pb.username AS processed_by_username
      FROM pb_payments_recap pr
      LEFT JOIN users u_pb ON pr.processed_by_pb_id = u_pb.id
      WHERE ${conds.join(' AND ')}
      ORDER BY pr.paid_at DESC
    `;

    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }
    if (filters.offset) { sql += ' OFFSET ?'; args.push(filters.offset); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  // Count Pengcab balance transactions
  async countPengcabTransactions(adminId, filters = {}) {
    const conds = ["pr.recipient_type = 'pengcab'", 'pr.recipient_id = ?'];
    const args = [adminId];

    if (filters.month) { conds.push('MONTH(pr.paid_at) = ?'); args.push(filters.month); }
    if (filters.year) { conds.push('YEAR(pr.paid_at) = ?'); args.push(filters.year); }

    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM pb_payments_recap pr WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(result[0].total);
  },

  // Get Pengda bank account info for a specific province (for Pengcab to see)
  async getPengdaBankInfo(provinceId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT u.club_name, u.bank_account_number, u.email, u.phone
       FROM users u
       WHERE u.province_id = ? AND u.role_id = 3 LIMIT 1`,
      provinceId
    );
    if (!rows.length) return null;
    return rows[0];
  },

  AMOUNT_PER_KTA,
};

module.exports = PbPayment;
