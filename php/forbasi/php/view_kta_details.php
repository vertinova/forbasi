<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail KTA</title>
    <link rel="icon" type="image/png" href="https://forbasi.or.id/forbasi/assets/LOGO-FORBASI.png">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 600px;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        .form-group input[type="text"],
        .form-group textarea {
            width: calc(100% - 20px);
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #e9e9e9;
            color: #333;
            font-size: 1em;
            box-sizing: border-box;
        }
        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }
        .form-group input[type="text"]:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #aaa;
        }
        .kta-logo {
            display: block;
            margin: 0 auto 20px;
            max-width: 150px;
            height: auto;
            border: 1px solid #eee;
            padding: 5px;
            border-radius: 5px;
        }
        .loading, .error {
            text-align: center;
            font-size: 1.1em;
            color: #666;
            margin-top: 20px;
        }
        .error {
            color: #d9534f;
            font-weight: bold;
        }
        .note {
            margin-top: 25px;
            padding: 10px;
            background-color: #eaf7ff;
            border: 1px solid #cce5ff;
            border-radius: 5px;
            color: #0056b3;
            font-size: 0.95em;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Detail Kartu Tanda Anggota</h1>
        <div id="kta-details">
            <div class="loading">Memuat data KTA...</div>
            </div>
        <div id="kta-note" class="note" style="display: none;"></div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const barcodeId = urlParams.get('barcode_id'); // Ambil barcode_id dari URL

            const ktaDetailsDiv = document.getElementById('kta-details');
            const ktaNoteDiv = document.getElementById('kta-note');

            if (!barcodeId) {
                ktaDetailsDiv.innerHTML = '<div class="error">ID Barcode tidak ditemukan di URL.</div>';
                return;
            }

            // Ganti URL ini dengan URL endpoint PHP Anda
            const API_URL = 'https://forbasi.or.id/forbasi/php/get_kta_data.php?barcode_id=' + encodeURIComponent(barcodeId);

            fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-cache'
            })
                .then(response => {
                    console.log('Response status:', response.status);
                    console.log('Response headers:', response.headers);
                    
                    if (!response.ok) {
                        throw new Error('HTTP error! Status: ' + response.status + ' ' + response.statusText);
                    }
                    
                    // Check if response is actually JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Response is not JSON. Content-Type: ' + contentType);
                    }
                    
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        const kta = data.data;
                        let logoHtml = '';
                        if (kta.full_logo_url) {
                            logoHtml = `<img src="${kta.full_logo_url}" alt="Logo Club" class="kta-logo">`;
                        }

                        ktaDetailsDiv.innerHTML = `
                            ${logoHtml}
                            <div class="form-group">
                                <label for="clubName">Nama Club</label>
                                <input type="text" id="clubName" value="${(kta.club_name || '-').toUpperCase()}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="schoolName">Nama Sekolah</label>
                                <input type="text" id="schoolName" value="${(kta.school_name || '-').toUpperCase()}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="clubAddress">Alamat Club</label>
                                <textarea id="clubAddress" rows="3" readonly>${(kta.club_address || '-').toUpperCase()}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="membershipType">Sebagai Anggota</label>
                                <input type="text" id="membershipType" value="BIASA" readonly>
                            </div>
                            <div class="form-group">
                                <label for="sinceDate">Sejak Tanggal</label>
                                <input type="text" id="sinceDate" value="${formatDate(kta.approved_at_pb)}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="memberNumber">Nomor Anggota</label>
                                <input type="text" id="memberNumber" value="${generateMemberNumber(kta)}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="userName">Nama Pelatih</label>
                                <input type="text" id="userName" value="${(kta.user_full_name || '-').toUpperCase()}" readonly>
                            </div>
                        `;
                        
                        if (kta.note_pb_release_date) {
                            ktaNoteDiv.textContent = kta.note_pb_release_date;
                            ktaNoteDiv.style.display = 'block';
                        }

                    } else {
                        ktaDetailsDiv.innerHTML = `<div class="error">${data.message || 'Terjadi kesalahan saat mengambil data KTA.'}</div>`;
                    }
                })
                .catch(error => {
                    console.error('Error fetching KTA data:', error);
                    ktaDetailsDiv.innerHTML = `<div class="error">
                        Gagal memuat data KTA.<br>
                        Error: ${error.message}<br>
                        <small>Periksa koneksi internet atau hubungi administrator.</small>
                    </div>`;
                });
        });

        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return date.toLocaleDateString('id-ID', options).toUpperCase();
        }

        // Fungsi ini harus mereplikasi logika di PHP Anda untuk Nomor Anggota
        function generateMemberNumber(ktaData) {
            const appId = ktaData.id || '0';
            const paddedAppId = String(appId).padStart(3, '0');
            const approvedDate = ktaData.approved_at_pb ? new Date(ktaData.approved_at_pb) : new Date();
            const tahunPersetujuan = approvedDate.getFullYear();
            const cityNameForAbbr = ktaData.city_name || 'N/A';
            const cityAbbr = getCityAbbreviation(cityNameForAbbr);
            return `0${paddedAppId}/FORBASI/${cityAbbr}/${tahunPersetujuan}`;
        }

        // Replikasi fungsi getCityAbbreviation dari PHP ke JavaScript
        function getCityAbbreviation(cityName) {
            const customAbbreviations = {
                'JAKARTA PUSAT': 'JKTP','JAKARTA SELATAN': 'JKTS','JAKARTA BARAT': 'JKTB','JAKARTA UTARA': 'JKTU','JAKARTA TIMUR': 'JKTT','KEPULAUAN SERIBU': 'KPS','BOGOR': 'BGR','BANDUNG': 'BDG','BANDUNG BARAT': 'BDB','DEPOK': 'DPK','BEKASI': 'BKS','CIREBON': 'CBN','SUKABUMI': 'SKB','TASIKMALAYA': 'TSK','GARUT': 'GRT','CIAMIS': 'CMS','KUNINGAN': 'KNG','INDRAMAYU': 'IDM','SUMEDANG': 'SMD','MAJALENGKA': 'MJL','SUBANG': 'SBG','PURWAKARTA': 'PWK','KARAWANG': 'KRW','CIMAHI': 'CMH','BANJAR': 'BJR','TANGERANG': 'TGR','TANGERANG SELATAN': 'TGSL','SERANG': 'SRG','CILEGON': 'CGL','LEBAK': 'LBK','PANDEGLANG': 'PDG','YOGYAKARTA': 'YK','BANTUL': 'BTL','SLEMAN': 'SLM','GUNUNGKIDUL': 'GNK','KULON PROGO': 'KLP','SEMARANG': 'SMG','SURAKARTA': 'SKT','SALATIGA': 'SLT','MAGELANG': 'MGL','CILACAP': 'CLP','PURBALINGGA': 'PBL','BANJARNEGARA': 'BNJ','KEBUMEN': 'KBM','PURWOREJO': 'PWR','WONOSOBO': 'WSB','TEMANGGUNG': 'TMG','KENDAL': 'KDL','DEMAK': 'DMK','GROBOGAN': 'GRB','BLORA': 'BLR','REMBANG': 'RBG','PATI': 'PTI','KUDUS': 'KDS','JEPARA': 'JPR','PEKALONGAN': 'PKL','BATANG': 'BTG','TEGAL': 'TGL','BREBES': 'BRB','KLATEN': 'KLT','BOYOLALI': 'BYL','SRAGEN': 'SGN','KARANGANYAR': 'KRY','WONOGIRI': 'WNG','SUKOHARJO': 'SKH','SURABAYA': 'SBY','MALANG': 'MLG','BATU': 'BTU','KEDIRI': 'KDR','BLITAR': 'BLT','MADIUN': 'MDN','NGANJUK': 'NJU','MAGETAN': 'MGT','PONOROGO': 'PNO','TRENGGALEK': 'TRG','TULUNGAGUNG': 'TLG','LUMAJANG': 'LMJ','JEMBER': 'JMB','BANYUWANGI': 'BYW','PROBOLINGGO': 'PBL','PASURUAN': 'PSR','SIDOARJO': 'SDA','MOJOKERTO': 'MJK','JOMBANG': 'JBG','LAMONGAN': 'LMG','TUBAN': 'TBN','BOJONEGORO': 'BJN','GRESIK': 'GRS','BANGKALAN': 'BKL','SAMPANG': 'SPG','PAMEKASAN': 'PMK','SUMENEP': 'SMP','BONDOWOSO': 'BND','SITUBONDO': 'STB','PACITAN': 'PCT','DENPASAR': 'DPS','BADUNG': 'BDNG','BANGLI': 'BGL','BULELENG': 'BLL','GIANYAR': 'GYR','JEMBRANA': 'JMBR','KARANGASEM': 'KGM','KLUNGKUNG': 'KLK','TABANAN': 'TBNN','MEDAN': 'MDN','DELI SERDANG': 'DLS','LANGKAT': 'LKT','SERDANG BEDAGAI': 'SDB','ASAHAN': 'ASH','KARO': 'KRO','PEMATANG SIANTAR': 'PSR','SIBBOLGA': 'SBL','TANJUNG BALAI': 'TJB','BINJAI': 'BNJ','TEBING TINGGI': 'TTG','PADANGSIDIMPUAN': 'PSP','NIAS': 'NIAS','LABUHANBATU': 'LBH','PALEMBANG': 'PLB','BANYUASIN': 'BYS','OGAN KOMERING ILIR': 'OKI','OGAN KOMERING ULU': 'OKU','LAHAT': 'LHT','MUSI BANYUASIN': 'MBS','MUSI RAWAS': 'MSR','MUARA ENIM': 'MRE','PRABUMULIH': 'PBLH','LUBUKLINGGAU': 'LLG','PAGAR ALAM': 'PGL','MAKASSAR': 'MKS','GOWA': 'GWA','MAROS': 'MRS','BONE': 'BNE','WAJO': 'WJO','LUWU': 'LWU','PAREPARE': 'PRP','PALOPO': 'PLP','BANDA ACEH': 'BCA','LHOKSEUMAWE': 'LSMW','LANGSA': 'LGS','SABANG': 'SBNG','ACEH BESAR': 'ACBSR','ACEH UTARA': 'ACU','ACEH TIMUR': 'ACT','ACEH TENGAH': 'ACN','PIDIE': 'PID','BIREUEN': 'BRN','PEKANBARU': 'PKBR','DUMAI': 'DMI','INDRAGIRI HULU': 'INH','INDRAGIRI HILIR': 'INHR','BENGKALIS': 'BKL','SIAK': 'SKK','JAMBI': 'JMB','MUARO JAMBI': 'MRJ','KERINCI': 'KRN','BANDAR LAMPUNG': 'BDL','METRO': 'MTR','LAMPUNG SELATAN': 'LPS','LAMPUNG TENGAH': 'LPT','SAMARINDA': 'SMD','BALIKPAPAN': 'BPN','KUTAI KARTANEGARA': 'KKG','BONTANG': 'BTG','BANJARMASIN': 'BJM','BANJARBARU': 'BJB','MATARAM': 'MTRM','LOMBOK BARAT': 'LKB','LOMBOK TENGAH': 'LKT','SUMBAWA': 'SMW','KUPANG': 'KPG','FLORES TIMUR': 'FLT','ALOR': 'ALR','JAYAPURA': 'JYP','MERAUKE': 'MRK','TIMIKA': 'TMC','SORONG': 'SRG','NABIRE': 'NBR','PADANG': 'PDG','MANADO': 'MND','PONTIANAK': 'PTK','PALANGKARAYA': 'PKY','TARAKAN': 'TRK','TERNATE': 'TTE','AMBON': 'AMB','GORONTALO': 'GRL','PALU': 'PLU','BATAM': 'BTM','PANGKALPINANG': 'PKP','TANJUNG PINANG': 'TPP','SOFIFI': 'SFF','MAMUJU': 'MJJ',
            };
            const originalCityName = (cityName || '').toUpperCase();
            let processedCityName = originalCityName;
            let prefix = '';

            if (processedCityName.startsWith('KABUPATEN ')) {
                prefix = 'KAB';
                processedCityName = processedCityName.substring('KABUPATEN '.length);
            } else if (processedCityName.startsWith('KOTA ')) {
                prefix = 'KOT';
                processedCityName = processedCityName.substring('KOTA '.length);
            }

            if (customAbbreviations[processedCityName]) {
                return prefix + customAbbreviations[processedCityName];
            }
            if (customAbbreviations[originalCityName]) {
                return customAbbreviations[originalCityName];
            }

            const parts = processedCityName.split(' ');
            let abbr = '';
            for (const part of parts) {
                if (part.length > 0) {
                    abbr += part.substring(0, 1);
                }
            }

            if (!abbr) {
                return prefix + (originalCityName.replace(/\s/g, '').substring(0, 3));
            }
            return prefix + abbr.substring(0, 5);
        }

    </script>
</body>
</html>