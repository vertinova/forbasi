/**
 * KTA PDF Generator — matches PHP generate_kta_pdf.php exactly.
 *
 * Role behaviour (mirrors PHP):
 *  pengcab → A4 portrait, 1 signature block (Pengcab, centered)
 *  pengda  → A4 portrait, 2 signature blocks (left=Pengda, right=Pengcab)
 *  pb      → A4 portrait, 3 signature blocks (left=Pengda, right=Pengcab, bottom-right=PB)
 *            + QR code bottom-left + club logo next to QR + expiry footer
 *
 * Config is read from the per-role tables:
 *   pengcab_kta_configs, pengda_kta_configs, pb_kta_configs
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const db = require('../config/database');

const UPLOADS = path.join(__dirname, '../../uploads');

// City abbreviations — mirrors PHP getCityAbbreviation()
const CITY_ABBR = {
  // DKI Jakarta
  'JAKARTA PUSAT': 'JKTP', 'JAKARTA SELATAN': 'JKTS', 'JAKARTA BARAT': 'JKTB',
  'JAKARTA UTARA': 'JKTU', 'JAKARTA TIMUR': 'JKTT', 'KEPULAUAN SERIBU': 'KPS',
  // Jawa Barat
  'BOGOR': 'BGR', 'BANDUNG': 'BDG', 'BANDUNG BARAT': 'BDB', 'DEPOK': 'DPK',
  'BEKASI': 'BKS', 'CIREBON': 'CBN', 'SUKABUMI': 'SKB', 'TASIKMALAYA': 'TSK',
  'GARUT': 'GRT', 'CIAMIS': 'CMS', 'KUNINGAN': 'KNG', 'INDRAMAYU': 'IDM',
  'SUMEDANG': 'SMD', 'MAJALENGKA': 'MJL', 'SUBANG': 'SBG', 'PURWAKARTA': 'PWK',
  'KARAWANG': 'KRW', 'CIMAHI': 'CMH', 'BANJAR': 'BJR',
  // Banten
  'TANGERANG': 'TGR', 'TANGERANG SELATAN': 'TGSL', 'SERANG': 'SRG',
  'CILEGON': 'CGL', 'LEBAK': 'LBK', 'PANDEGLANG': 'PDG',
  // DI Yogyakarta
  'YOGYAKARTA': 'YK', 'BANTUL': 'BTL', 'SLEMAN': 'SLM',
  'GUNUNGKIDUL': 'GNK', 'KULON PROGO': 'KLP',
  // Jawa Tengah
  'SEMARANG': 'SMG', 'SURAKARTA': 'SKT', 'SALATIGA': 'SLT', 'MAGELANG': 'MGL',
  'CILACAP': 'CLP', 'PURBALINGGA': 'PBL', 'BANJARNEGARA': 'BNJ', 'KEBUMEN': 'KBM',
  'PURWOREJO': 'PWR', 'WONOSOBO': 'WSB', 'TEMANGGUNG': 'TMG', 'KENDAL': 'KDL',
  'DEMAK': 'DMK', 'GROBOGAN': 'GRB', 'BLORA': 'BLR', 'REMBANG': 'RBG',
  'PATI': 'PTI', 'KUDUS': 'KDS', 'JEPARA': 'JPR', 'PEKALONGAN': 'PKL',
  'BATANG': 'BTG', 'TEGAL': 'TGL', 'BREBES': 'BRB', 'KLATEN': 'KLT',
  'BOYOLALI': 'BYL', 'SRAGEN': 'SGN', 'KARANGANYAR': 'KRY', 'WONOGIRI': 'WNG',
  'SUKOHARJO': 'SKH',
  // Jawa Timur
  'SURABAYA': 'SBY', 'MALANG': 'MLG', 'BATU': 'BTU', 'KEDIRI': 'KDR',
  'BLITAR': 'BLT', 'MADIUN': 'MDN', 'NGANJUK': 'NJU', 'MAGETAN': 'MGT',
  'PONOROGO': 'PNO', 'TRENGGALEK': 'TRG', 'TULUNGAGUNG': 'TLG', 'LUMAJANG': 'LMJ',
  'JEMBER': 'JMB', 'BANYUWANGI': 'BYW', 'PROBOLINGGO': 'PBL', 'PASURUAN': 'PSR',
  'SIDOARJO': 'SDA', 'MOJOKERTO': 'MJK', 'JOMBANG': 'JBG', 'LAMONGAN': 'LMG',
  'TUBAN': 'TBN', 'BOJONEGORO': 'BJN', 'GRESIK': 'GRS', 'BANGKALAN': 'BKL',
  'SAMPANG': 'SPG', 'PAMEKASAN': 'PMK', 'SUMENEP': 'SMP', 'BONDOWOSO': 'BND',
  'SITUBONDO': 'STB', 'PACITAN': 'PCT',
  // Bali
  'DENPASAR': 'DPS', 'BADUNG': 'BDNG', 'BANGLI': 'BGL', 'BULELENG': 'BLL',
  'GIANYAR': 'GYR', 'JEMBRANA': 'JMBR', 'KARANGASEM': 'KGM', 'KLUNGKUNG': 'KLK',
  'TABANAN': 'TBNN',
  // Sumatra Utara
  'MEDAN': 'MDN', 'DELI SERDANG': 'DLS', 'LANGKAT': 'LKT', 'SERDANG BEDAGAI': 'SDB',
  'ASAHAN': 'ASH', 'KARO': 'KRO', 'PEMATANG SIANTAR': 'PSR', 'SIBBOLGA': 'SBL',
  'TANJUNG BALAI': 'TJB', 'BINJAI': 'BNJ', 'TEBING TINGGI': 'TTG',
  'PADANGSIDIMPUAN': 'PSP', 'NIAS': 'NIAS', 'LABUHANBATU': 'LBH',
  'SIMALUNGUN': 'SMGN', 'TAPANULI UTARA': 'TPU', 'TAPANULI TENGAH': 'TPT',
  'TAPANULI SELATAN': 'TPS', 'TOBA SAMOSIR': 'TOS', 'BATU BARA': 'BBR',
  'DAIRI': 'DRI', 'HUMBANG HASUNDUTAN': 'HSD', 'SAMOSIR': 'SMS', 'TOBA': 'TBA',
  'PAKPAK BHARAT': 'PKB', 'LABUHANBATU SELATAN': 'LBS', 'LABUHANBATU UTARA': 'LBU',
  'GUNUNGSITOLI': 'GNS', 'NIAS UTARA': 'NSU', 'NIAS SELATAN': 'NSS', 'NIAS BARAT': 'NSB',
  // Sumatra Barat
  'PADANG': 'PDG', 'PADANG PARIAMAN': 'PDP', 'PESISIR SELATAN': 'PSS',
  'PASAMAN': 'PSM', 'PASAMAN BARAT': 'PSB', 'AGAM': 'AGM', 'TANAH DATAR': 'TND',
  'LIMA PULUH KOTA': 'LPK', 'PADANG PANJANG': 'PDPG', 'BUKITTINGGI': 'BKTG',
  'SAWAHLUNTO': 'SWL', 'SOLOK': 'SLK', 'SOLOK SELATAN': 'SLS', 'SIJUNJUNG': 'SJJ',
  'DHARMASRAYA': 'DHR', 'KEPULAUAN MENTAWAI': 'KPMT', 'PAYAKUMBUH': 'PYK',
  'PADANG SIDEMPUAN': 'PSP', 'PADANG LAWAS': 'PDL', 'PADANG LAWAS UTARA': 'PLU',
  'MANDAILING NATAL': 'MNDL',
  // Sumatra Selatan
  'PALEMBANG': 'PLB', 'BANYUASIN': 'BYS', 'OGAN KOMERING ILIR': 'OKI',
  'OGAN KOMERING ULU': 'OKU', 'LAHAT': 'LHT', 'MUSI BANYUASIN': 'MBS',
  'MUSI RAWAS': 'MSR', 'MUARA ENIM': 'MRE', 'PRABUMULIH': 'PBLH',
  'LUBUKLINGGAU': 'LLG', 'PAGAR ALAM': 'PGL',
  // Aceh
  'BANDA ACEH': 'BCA', 'LHOKSEUMAWE': 'LSMW', 'LANGSA': 'LGS', 'SABANG': 'SBNG',
  'ACEH BESAR': 'ACBSR', 'ACEH UTARA': 'ACU', 'ACEH TIMUR': 'ACT',
  'ACEH TENGAH': 'ACN', 'PIDIE': 'PID', 'BIREUEN': 'BRN', 'ACEH JAYA': 'ACJ',
  'ACEH TAMIANG': 'ACTM', 'GAYO LUES': 'GLL', 'ACEH TENGGARA': 'ACTG',
  'ACEH SINGKIL': 'ASL', 'ACEH BARAT': 'ACB', 'ACEH BARAT DAYA': 'ABD',
  'ACEH SELATAN': 'ACS', 'SUBULUSSALAM': 'SBLS', 'SIMEULUE': 'SML',
  'NAGAN RAYA': 'NGR', 'BENER MERIAH': 'BNM', 'PIDIE JAYA': 'PDJ',
  // Riau
  'PEKANBARU': 'PKBR', 'DUMAI': 'DMI', 'INDRAGIRI HULU': 'INH',
  'INDRAGIRI HILIR': 'INHR', 'BENGKALIS': 'BKL', 'SIAK': 'SKK',
  'PELALAWAN': 'PLW', 'ROKAN HULU': 'RKH', 'ROKAN HILIR': 'RKL',
  'KUANTAN SINGINGI': 'KTS', 'KEPULAUAN MERANTI': 'KPM',
  // Jambi
  'JAMBI': 'JMB', 'MUARO JAMBI': 'MRJ', 'KERINCI': 'KRN', 'TEBO': 'TBO',
  'BUNGO': 'BGO', 'TANJUNG JABUNG BARAT': 'TJB', 'TANJUNG JABUNG TIMUR': 'TJT',
  'SAROLANGUN': 'SRL', 'MERANGIN': 'MRG', 'SUNGAI PENUH': 'SPNH',
  // Lampung
  'BANDAR LAMPUNG': 'BDL', 'METRO': 'MTR', 'LAMPUNG SELATAN': 'LPS',
  'LAMPUNG TENGAH': 'LPT', 'LAMPUNG BARAT': 'LPB', 'LAMPUNG TIMUR': 'LPTM',
  'LAMPUNG UTARA': 'LPU', 'PESAWARAN': 'PSW', 'PRINGSEWU': 'PRW',
  'TANGGAMUS': 'TGM', 'WAY KANAN': 'WYK', 'MESUJI': 'MSJ', 'PESISIR BARAT': 'PSB',
  // Kepulauan Riau
  'BATAM': 'BTM', 'TANJUNG PINANG': 'TPP', 'BINTAN': 'BTN', 'KARIMUN': 'KRM',
  'LINGGA': 'LNG', 'NATUNA': 'NTN', 'KEPULAUAN ANAMBAS': 'KPA',
  // Bangka Belitung
  'PANGKALPINANG': 'PKP', 'BANGKA': 'BKA', 'BANGKA BARAT': 'BKB',
  'BANGKA SELATAN': 'BKS', 'BANGKA TENGAH': 'BKT', 'BELITUNG': 'BLT',
  'BELITUNG TIMUR': 'BLTT',
  // Bengkulu
  'BENGKULU': 'BKL', 'BENGKULU UTARA': 'BKU', 'BENGKULU TENGAH': 'BKTG',
  'BENGKULU SELATAN': 'BKS', 'KEPAHIANG': 'KPH', 'MUKOMUKO': 'MKM',
  'REJANG LEBONG': 'RLB', 'SELUMA': 'SLM', 'LEBONG': 'LBNG',
  // Sulawesi Selatan
  'MAKASSAR': 'MKS', 'GOWA': 'GWA', 'MAROS': 'MRS', 'BONE': 'BNE',
  'WAJO': 'WJO', 'LUWU': 'LWU', 'PAREPARE': 'PRP', 'PALOPO': 'PLP',
  // Sulawesi lainnya
  'MANADO': 'MND', 'GORONTALO': 'GRL', 'PALU': 'PLU', 'KENDARI': 'KDI',
  'MAMUJU': 'MJJ',
  // Kalimantan Timur
  'SAMARINDA': 'SMD', 'BALIKPAPAN': 'BPN', 'KUTAI KARTANEGARA': 'KKG',
  'BONTANG': 'BTG', 'KUTAI BARAT': 'KBB', 'KUTAI TIMUR': 'KTM',
  'BERAU': 'BRA', 'PASER': 'PSR', 'PENAJAM PASER UTARA': 'PPU',
  'MAHAKAM ULU': 'MHL',
  // Kalimantan Utara
  'TARAKAN': 'TRK', 'NUNUKAN': 'NNK', 'MALINAU': 'MLN',
  'BULUNGAN': 'BLG', 'TANA TIDUNG': 'TTD',
  // Kalimantan Selatan
  'BANJARMASIN': 'BJM', 'BANJARBARU': 'BJB', 'KOTABARU': 'KTB',
  'TANAH LAUT': 'TNL', 'TAPIN': 'TPN', 'HULU SUNGAI SELATAN': 'HSS',
  'HULU SUNGAI TENGAH': 'HST', 'HULU SUNGAI UTARA': 'HSU', 'TABALONG': 'TBL',
  'TANAH BUMBU': 'TBU', 'BALANGAN': 'BLG', 'BARITO KUALA': 'BRK',
  // Kalimantan Barat
  'PONTIANAK': 'PTK', 'SINGKAWANG': 'SKW', 'KAYONG UTARA': 'KYU',
  'KUBU RAYA': 'KBR', 'LANDAK': 'LND', 'KETAPANG': 'KTP', 'SANGGAU': 'SGU',
  'SINTANG': 'STG', 'KAPUAS HULU': 'KPH', 'BENGKAYANG': 'BKY',
  'SAMBAS': 'SMB', 'MEMPAWAH': 'MPW', 'SEKADAU': 'SKD', 'MELAWAI': 'MLW',
  // Kalimantan Tengah
  'PALANGKARAYA': 'PKY', 'BARITO SELATAN': 'BRS', 'BARITO TIMUR': 'BRT',
  'BARITO UTARA': 'BRU', 'KATINGAN': 'KTN', 'KOTAWARINGIN BARAT': 'KOB',
  'KOTAWARINGIN TIMUR': 'KOT', 'LAMANDAU': 'LMD', 'MURUNG RAYA': 'MRR',
  'PULANG PISAU': 'PLP', 'SUKAMARA': 'SKM', 'SERUYAN': 'SRY',
  // NTB
  'MATARAM': 'MTRM', 'LOMBOK BARAT': 'LKB', 'LOMBOK TENGAH': 'LKT',
  'LOMBOK TIMUR': 'LKT', 'SUMBAWA': 'SMW', 'DOMPU': 'DMP', 'BIMA': 'BMA',
  'LOMBOK UTARA': 'LKU',
  // NTT
  'KUPANG': 'KPG', 'FLORES TIMUR': 'FLT', 'ALOR': 'ALR',
  'SUMBA BARAT': 'SMB', 'SUMBA TIMUR': 'SMT', 'SUMBA TENGAH': 'SMH',
  'SUMBA BARAT DAYA': 'SBD', 'NGADA': 'NGD', 'ENDE': 'END', 'SIKKA': 'SKK',
  'NAGEKEO': 'NGK', 'MANGGARAI': 'MGR', 'MANGGARAI BARAT': 'MGB',
  'MANGGARAI TIMUR': 'MGT', 'ROTE NDAO': 'RND', 'SABU RAIJUA': 'SRJ',
  'TIMOR TENGAH SELATAN': 'TTS', 'TIMOR TENGAH UTARA': 'TTU',
  'BELU': 'BLU', 'MALAKA': 'MLK',
  // Maluku
  'AMBON': 'AMB', 'TERNATE': 'TTE', 'SOFIFI': 'SFF',
  'SERAM BAGIAN BARAT': 'SBB', 'SERAM BAGIAN TIMUR': 'SBT',
  'KEPULAUAN ARU': 'KPA', 'BURU': 'BRU', 'KEPULAUAN TANIMBAR': 'KPT',
  'MALUKU TENGGARA': 'MLT', 'MALUKU TENGAH': 'MLH', 'MALUKU BARAT DAYA': 'MBD',
  'MALUKU TENGGARA BARAT': 'MTB', 'TUAL': 'TUL',
  // Papua
  'JAYAPURA': 'JYP', 'MERAUKE': 'MRK', 'TIMIKA': 'TMC', 'SORONG': 'SRG',
  'NABIRE': 'NBR', 'MANOKWARI': 'MKW', 'FAKFAK': 'FKF', 'BINTUNI': 'BTN',
  'WASIOR': 'WSR',
};

// Mirrors PHP getCityAbbreviation(): strips KABUPATEN/KOTA prefix, looks up map, 
// falls back to first-letter-of-each-word abbreviation (up to 5 chars).
const getCityAbbr = (cityName) => {
  if (!cityName) return 'XXX';
  const original = cityName.toUpperCase().trim();
  let prefix = '';
  let processed = original;
  if (processed.startsWith('KABUPATEN ')) { prefix = 'KAB'; processed = processed.slice(10); }
  else if (processed.startsWith('KOTA ')) { prefix = 'KOT'; processed = processed.slice(5); }
  if (CITY_ABBR[processed]) return prefix + CITY_ABBR[processed];
  if (CITY_ABBR[original]) return CITY_ABBR[original];
  // Fallback: first letter of each word, up to 5 chars
  const parts = processed.split(' ').filter(Boolean);
  const abbr = parts.map(p => p[0]).join('').slice(0, 5);
  return prefix + (abbr || processed.replace(/\s/g, '').slice(0, 3));
};

const ID_MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatDateID = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${String(fallback.getDate()).padStart(2, '0')} ${ID_MONTHS[fallback.getMonth() + 1]} ${fallback.getFullYear()}`;
  }
  return `${String(d.getDate()).padStart(2, '0')} ${ID_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
};

const safeYear = (dateStr) => {
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
};

// mm → PDFKit points (72 dpi, 1 inch = 25.4mm)
const mm = (v) => v * 72 / 25.4;

// Load per-role KTA config from the correct table
const loadRoleConfig = async (tableName, userId) => {
  if (!userId) return null;
  try {
    const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  } catch { return null; }
};

// Resolve file path relative to UPLOADS, return null if not found
// Also checks PHP legacy uploads path and downloads from production as fallback
const PHP_UPLOADS = path.join(__dirname, '../../../php/forbasi/php/uploads');
const PROD_UPLOADS_URL = 'https://forbasi.or.id/forbasi/php/uploads';

const downloadFileSync = (url, destPath) => {
  try {
    const { execSync } = require('child_process');
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Cross-platform download: try curl first (Linux/Mac/Win10+), fallback to powershell (Windows)
    try {
      execSync(`curl -fsSL -o "${destPath}" "${url}"`, { timeout: 15000, stdio: 'pipe' });
    } catch {
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${destPath}' -UseBasicParsing -ErrorAction Stop"`, { timeout: 15000, stdio: 'pipe' });
    }
    return fs.existsSync(destPath) && fs.statSync(destPath).size > 0;
  } catch {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    return false;
  }
};

const resolveUploadPath = (relPath) => {
  if (!relPath) return null;
  const full = path.join(UPLOADS, relPath);
  if (fs.existsSync(full)) return full;
  // Fallback: check PHP legacy uploads directory
  const phpFull = path.join(PHP_UPLOADS, relPath);
  if (fs.existsSync(phpFull)) return phpFull;
  // Fallback: download from production server and cache locally
  const prodUrl = `${PROD_UPLOADS_URL}/${relPath.replace(/\\/g, '/')}`;
  console.log(`[KTA PDF] Attempting download: ${prodUrl} -> ${full}`);
  if (downloadFileSync(prodUrl, full)) {
    console.log(`[KTA PDF] Successfully cached: ${full}`);
    return full;
  }
  console.warn(`[KTA PDF] File not found locally or on production: ${relPath}`);
  return null;
};

// Draw a scaled image centred in a box (maintains aspect ratio, fits within maxW×maxH)
const drawImageFit = (doc, imgPath, cx, y, maxW, maxH) => {
  if (!imgPath || !fs.existsSync(imgPath)) return;
  try {
    const buf = fs.readFileSync(imgPath);
    const { width: iw, height: ih } = imageSize(buf);
    if (!iw || !ih) return;
    let w = maxW, h = (ih / iw) * maxW;
    if (h > maxH) { h = maxH; w = (iw / ih) * maxH; }
    doc.image(imgPath, cx - w / 2, y, { width: w, height: h });
  } catch {
    try { doc.image(imgPath, cx - maxW / 2, y, { width: maxW }); } catch {}
  }
};

/**
 * Main export. Called from ktaController after each approval.
 *
 * @param {object} application  — row from kta_applications JOIN users/provinces/cities
 * @param {object} options      — { role: 'pengcab'|'pengda'|'pb', adminId: number }
 */
const generateKtaPdf = async (application, options = {}) => {
  // Determine caller role from options or infer from application status
  const role = options.role || (() => {
    const s = application.status;
    if (s === 'approved_pb' || s === 'kta_issued') return 'pb';
    if (s === 'approved_pengda') return 'pengda';
    return 'pengcab';
  })();

  const adminId = options.adminId || (() => {
    if (role === 'pb') return application.approved_by_pb_id;
    if (role === 'pengda') return application.approved_by_pengda_id;
    return application.approved_by_pengcab_id;
  })();

  // ── Output paths ──────────────────────────────────────────────────
  const subDir = role === 'pb' ? 'generated_kta_pb' : role === 'pengda' ? 'generated_kta_pengda' : 'generated_kta';
  const outputDir = path.join(UPLOADS, subDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const safeName = (application.club_name || 'club').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s/g, '_');
  const prefix = role === 'pb' ? 'KTA_PB_' : role === 'pengda' ? 'KTA_Pengda_' : 'KTA_Pengcab_';
  const filename = `${prefix}${safeName}_${application.id}.pdf`;
  const outputPath = path.join(outputDir, filename);

  // ── Load configs ──────────────────────────────────────────────────
  const callerConfig = await loadRoleConfig(
    role === 'pb' ? 'pb_kta_configs' : role === 'pengda' ? 'pengda_kta_configs' : 'pengcab_kta_configs',
    adminId
  );

  // For Pengda PDF: also load Pengcab config
  // For PB PDF:     also load Pengcab + Pengda configs
  const pengcabConfig = (role === 'pengda' || role === 'pb')
    ? await loadRoleConfig('pengcab_kta_configs', application.approved_by_pengcab_id)
    : null;

  const pengdaConfig = (role === 'pb')
    ? await loadRoleConfig('pengda_kta_configs', application.approved_by_pengda_id)
    : null;

  // ── Barcode ───────────────────────────────────────────────────────
  const barcodeId = application.kta_barcode_unique_id
    || `FORBASI${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}${String(application.id).padStart(5, '0')}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  // ── Build PDF ─────────────────────────────────────────────────────
  return new Promise(async (resolve, reject) => {
    // A4 portrait in points
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    doc.addPage();

    const PW = doc.page.width;   // ~595 pt
    const PH = doc.page.height;  // ~842 pt

    // Mirrors PHP: $vh_to_mm = GetPageHeight() / 170  (A4 ≈ 297mm)
    const PH_mm = PH * 25.4 / 72;
    const vhToMm = PH_mm / 170;
    const offset8vh = mm(8 * vhToMm);        // PHP: $offset_8vh  ≈ 13.977mm
    const offsetMinus3vh = mm(-3 * vhToMm);  // PHP: $offset_min_3vh ≈ -5.241mm

    // Background template - check local first, then download from production if missing
    const bgRelPath = 'config/kta_template_bg.png';
    let bgPath = path.join(UPLOADS, bgRelPath);
    if (!fs.existsSync(bgPath)) {
      // Try to download from production backend uploads
      const prodBgUrl = `https://forbasi.or.id/uploads/${bgRelPath}`;
      console.log(`[KTA PDF] Background not found locally, downloading from: ${prodBgUrl}`);
      if (downloadFileSync(prodBgUrl, bgPath)) {
        console.log(`[KTA PDF] Background downloaded successfully: ${bgPath}`);
      } else {
        // Try PHP legacy path as fallback
        const phpBgUrl = `${PROD_UPLOADS_URL}/${bgRelPath}`;
        console.log(`[KTA PDF] Trying PHP legacy path: ${phpBgUrl}`);
        downloadFileSync(phpBgUrl, bgPath);
      }
    }
    if (fs.existsSync(bgPath)) {
      try { doc.image(bgPath, 0, 0, { width: PW, height: PH }); } catch (e) {
        console.warn('[KTA PDF] Failed to load background image:', e.message);
        doc.rect(0, 0, PW, PH).fill('#ffffff');
      }
    } else {
      // Fallback solid background
      console.warn('[KTA PDF] Background image not found locally or remotely, using white background');
      doc.rect(0, 0, PW, PH).fill('#ffffff');
    }

    // ── Title text is part of the background image — not drawn programmatically ──

    // ── Member info block ─────────────────────────────────────────
    const infoStartY = mm(108);
    const infoX = mm(55);
    const labelW = mm(45);
    const valueX = infoX + labelW + mm(5);
    const lineH = mm(8);

    // Club name – centred, bold, uppercase
    doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
      .text((application.club_name || '').toUpperCase(), 0, infoStartY, { align: 'center', width: PW });

    let curY = infoStartY + lineH + mm(5); // extra Ln(5) from PHP

    const infoRow = (label, value) => {
      doc.font('Helvetica').fontSize(11).fillColor('black');
      doc.text(label, infoX, curY, { width: labelW, continued: false });
      doc.text(`: ${value}`, valueX, curY, { width: PW - valueX - mm(30) });
      curY += lineH;
    };

    infoRow('NAMA SEKOLAH', (application.school_name || '-').toUpperCase());

    // ALAMAT - may wrap
    doc.font('Helvetica').fontSize(11).fillColor('black');
    doc.text('ALAMAT', infoX, curY, { width: labelW, continued: false });
    const addrText = `: ${(application.club_address || '-').toUpperCase()}`;
    const addrHeight = doc.heightOfString(addrText, { width: PW - valueX - mm(30) });
    doc.text(addrText, valueX, curY, { width: PW - valueX - mm(30) });
    curY += Math.max(lineH, addrHeight);

    infoRow('SEBAGAI ANGGOTA', 'BIASA');

    // SEJAK TANGGAL
    const approvedDateCol = role === 'pb' ? application.approved_at_pb
      : role === 'pengda' ? application.approved_at_pengda
      : application.approved_at_pengcab;
    infoRow('SEJAK TANGGAL', formatDateID(approvedDateCol).toUpperCase());

    // NOMOR ANGGOTA
    const approvedYear = safeYear(approvedDateCol);
    const cityAbbr = getCityAbbr(application.city_name || '');
    const memberNum = `0${String(application.id).padStart(3, '0')}/FORBASI/${cityAbbr}/${approvedYear}`;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
    doc.text('NOMOR ANGGOTA', infoX, curY, { width: labelW, continued: false });
    doc.text(`: ${memberNum}`, valueX, curY, { width: PW - valueX - mm(30) });
    curY += lineH;

    // ── Signature block constants (same as PHP) ────────────────────
    const SIG_W = mm(45);  // sig_image_width
    const SIG_H = mm(27);  // sig_image_height
    const STAMP_W = mm(52.5);
    const STAMP_H = mm(30);
    const COL_W = mm(80);
    const SIG_BLOCK_Y = mm(175);
    const OFFSET_MINUS_3VH = offsetMinus3vh;  // PHP: -3 * $vh_to_mm ≈ -5.241mm
    const LINE_SIG = mm(5);

    // Draw one signature column
    const drawSigBlock = (x, blockY, orgLine1, orgLine2, orgLine3, sigImgPath, stampImgPath, signerName, role_label) => {
      doc.font('Helvetica').fontSize(10).fillColor('black');
      doc.text(orgLine1, x, blockY, { width: COL_W, align: 'center' });
      doc.text(orgLine2, x, blockY + LINE_SIG, { width: COL_W, align: 'center' });
      if (orgLine3) doc.text(orgLine3, x, blockY + LINE_SIG * 2, { width: COL_W, align: 'center' });

      const sigStartY = blockY + (orgLine3 ? LINE_SIG * 3 : LINE_SIG * 2);
      const cx = x + COL_W / 2;

      if (sigImgPath) drawImageFit(doc, sigImgPath, cx, sigStartY, SIG_W, SIG_H);
      if (stampImgPath) drawImageFit(doc, stampImgPath, cx - mm(10), sigStartY - mm(5), STAMP_W, STAMP_H);

      const nameY = sigStartY + SIG_H + mm(2);
      doc.font('Helvetica').fontSize(11).fillColor('black');
      // underline via a line drawn manually
      const nameStr = (signerName || '___________________________').toUpperCase();
      const nameW = doc.widthOfString(nameStr, { fontSize: 11 });
      const nameX = x + (COL_W - nameW) / 2;
      doc.text(nameStr, x, nameY, { width: COL_W, align: 'center', underline: true });
      doc.font('Helvetica').fontSize(10);
      doc.text(role_label === 'pb' ? 'Ketua Umum' : 'Ketua', x, nameY + LINE_SIG, { width: COL_W, align: 'center' });
    };

    if (role === 'pengcab') {
      // Single centred block
      const cx = PW / 2 - COL_W / 2;
      drawSigBlock(
        cx, SIG_BLOCK_Y,
        'PENGURUS CABANG', 'FORUM BARIS INDONESIA', (application.city_name || '').toUpperCase(),
        resolveUploadPath(callerConfig?.signature_image_path ? `pengcab_kta_configs/${callerConfig.signature_image_path}` : null),
        null,
        callerConfig?.ketua_umum_name,
        'pengcab'
      );

    } else if (role === 'pengda') {
      // Left = Pengda, Right = Pengcab
      const leftX = mm(25);
      const rightX = PW - COL_W - mm(25);
      const blockY = SIG_BLOCK_Y + OFFSET_MINUS_3VH;

      drawSigBlock(
        leftX, blockY,
        'PENGURUS DAERAH', 'FORUM BARIS INDONESIA', (application.province_name || '').toUpperCase(),
        resolveUploadPath(callerConfig?.signature_image_path ? `pengda_kta_configs/${callerConfig.signature_image_path}` : null),
        resolveUploadPath(callerConfig?.stamp_image_path ? `pengda_kta_configs/${callerConfig.stamp_image_path}` : null),
        callerConfig?.ketua_umum_name,
        'pengda'
      );
      drawSigBlock(
        rightX, blockY,
        'PENGURUS CABANG', 'FORUM BARIS INDONESIA', (application.city_name || '').toUpperCase(),
        resolveUploadPath(pengcabConfig?.signature_image_path ? `pengcab_kta_configs/${pengcabConfig.signature_image_path}` : null),
        null,
        pengcabConfig?.ketua_umum_name,
        'pengcab'
      );

    } else if (role === 'pb') {
      // Left = Pengda, Right = Pengcab (same as Pengda PDF)
      const leftX = mm(25);
      const rightX = PW - COL_W - mm(25);
      const blockY = SIG_BLOCK_Y + OFFSET_MINUS_3VH;

      drawSigBlock(
        leftX, blockY,
        'PENGURUS DAERAH', 'FORUM BARIS INDONESIA', (application.province_name || '').toUpperCase(),
        resolveUploadPath(pengdaConfig?.signature_image_path ? `pengda_kta_configs/${pengdaConfig.signature_image_path}` : null),
        resolveUploadPath(pengdaConfig?.stamp_image_path ? `pengda_kta_configs/${pengdaConfig.stamp_image_path}` : null),
        pengdaConfig?.ketua_umum_name,
        'pengda'
      );
      drawSigBlock(
        rightX, blockY,
        'PENGURUS CABANG', 'FORUM BARIS INDONESIA', (application.city_name || '').toUpperCase(),
        resolveUploadPath(pengcabConfig?.signature_image_path ? `pengcab_kta_configs/${pengcabConfig.signature_image_path}` : null),
        null,
        pengcabConfig?.ketua_umum_name,
        'pengcab'
      );

      // PB block: bottom-right area (mirrors $pb_y_text_start = PH - 65mm, shifted left by 3vh)
      const pbBlockY = PH - mm(65);
      const pbApprovedDate = application.approved_at_pb || new Date().toISOString();
      const pbDateStr = `Jakarta, ${formatDateID(pbApprovedDate)}`;
      // PHP: $offset_3vh = 3 * $vh_to_mm; $pb_x_start = GetPageWidth() - col_width - (15 + offset_3vh)
      const offset3vhPt = mm(3 * vhToMm);
      const pbX = PW - COL_W - mm(15) - offset3vhPt;

      doc.font('Helvetica').fontSize(10).fillColor('black')
        .text(pbDateStr, pbX, pbBlockY - mm(6), { width: COL_W, align: 'center' });

      drawSigBlock(
        pbX, pbBlockY,
        'PENGURUS BESAR', 'FORUM BARIS INDONESIA', null,
        resolveUploadPath(callerConfig?.signature_image_path ? `pb_kta_configs/${callerConfig.signature_image_path}` : null),
        resolveUploadPath(callerConfig?.stamp_image_path ? `pb_kta_configs/${callerConfig.stamp_image_path}` : null),
        callerConfig?.ketua_umum_name,
        'pb'
      );

      // QR Code — bottom-left (same as PHP: x=15mm, y = PH – qrSize – 30mm)
      const qrMM = 30;
      const qrPt = mm(qrMM);
      const qrX = mm(15);
      const qrY = PH - qrPt - mm(30);
      const verifyUrl = `${process.env.FRONTEND_URL || 'https://forbasi.or.id'}/verify/${barcodeId}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
        const qrBuf = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        doc.image(qrBuf, qrX, qrY, { width: qrPt, height: qrPt });
        doc.font('Helvetica').fontSize(7).fillColor('black')
          .text(barcodeId, qrX, qrY + qrPt + mm(1), { width: qrPt, align: 'center' });
      } catch {}

      // Club logo — right of QR code (same as PHP)
      const logoRelPath = application.logo_path;
      const logoPath = logoRelPath ? path.join(UPLOADS, logoRelPath) : null;
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, qrX + qrPt + mm(5), qrY, { width: qrPt, height: qrPt });
        } catch {}
      }

      // Expiry footer
      const pbYear = safeYear(pbApprovedDate);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#646464')
        .text(`KTA ini berlaku sampai dengan 31 Desember ${pbYear}`, 0, PH - mm(15), { align: 'center', width: PW });
    }

    doc.end();

    stream.on('finish', () => {
      resolve({
        filename,
        filepath: `${subDir}/${filename}`,
        barcode_id: barcodeId
      });
    });
    stream.on('error', reject);
  });
};

// Batch regenerate KTA PDFs for a specific year
const batchRegenerateKta = async (year) => {
  const [apps] = await db.query(
    `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
     FROM kta_applications ka
     JOIN users u ON ka.user_id = u.id
     LEFT JOIN provinces p ON ka.province_id = p.id
     LEFT JOIN cities c ON ka.city_id = c.id
     WHERE ka.status = 'kta_issued' AND YEAR(ka.kta_issued_at) = ?`,
    [year]
  );
  const results = [];
  for (const app of apps) {
    try {
      const result = await generateKtaPdf(app, { role: 'pb' });
      await db.query('UPDATE kta_applications SET generated_kta_file_path_pb = ? WHERE id = ?', [result.filepath, app.id]);
      results.push({ id: app.id, success: true, filepath: result.filepath });
    } catch (err) {
      results.push({ id: app.id, success: false, error: err.message });
    }
  }
  return results;
};

module.exports = { generateKtaPdf, batchRegenerateKta };

