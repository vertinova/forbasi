<?php
// File: create_all_pengcab_accounts.php
// Jalankan di terminal: php create_all_pengcab_accounts.php

// Konfigurasi database
$dbConfig = [
    'host' => '127.0.0.1',
    'username' => 'root', // Ganti dengan username database Anda
    'password' => '', // Ganti dengan password database Anda
    'database' => 'forbasi_db'
];

// Daftar LENGKAP semua provinsi dan kabupaten/kota di Indonesia
$provinsiKota = [
    // Nanggroe Aceh Darussalam (23)
    'Aceh' => [
        'Aceh Selatan', 'Aceh Tenggara', 'Aceh Timur', 'Aceh Tengah', 'Aceh Barat', 
        'Aceh Besar', 'Pidie', 'Aceh Utara', 'Simeulue', 'Aceh Singkil', 
        'Bireuen', 'Aceh Barat Daya', 'Gayo Lues', 'Aceh Jaya', 'Nagan Raya', 
        'Aceh Tamiang', 'Bener Meriah', 'Pidie Jaya', 'Banda Aceh', 'Sabang', 
        'Langsa', 'Lhokseumawe', 'Subulussalam'
    ],
    
    // Sumatera Utara (33)
    'Sumatera Utara' => [
        'Asahan', 'Batubara', 'Dairi', 'Deli Serdang', 'Humbang Hasundutan', 
        'Karo', 'Labuhanbatu', 'Labuhanbatu Selatan', 'Labuhanbatu Utara', 
        'Langkat', 'Mandailing Natal', 'Nias', 'Nias Barat', 'Nias Selatan', 
        'Nias Utara', 'Padang Lawas', 'Padang Lawas Utara', 'Pakpak Bharat', 
        'Samosir', 'Serdang Bedagai', 'Simalungun', 'Tapanuli Selatan', 
        'Tapanuli Tengah', 'Tapanuli Utara', 'Toba Samosir', 'Binjai', 
        'Gunungsitoli', 'Medan', 'Padangsidempuan', 'Pematangsiantar', 
        'Sibolga', 'Tanjungbalai', 'Tebing Tinggi'
    ],
    
    // Sumatera Barat (19)
    'Sumatera Barat' => [
        'Agam', 'Dharmasraya', 'Kepulauan Mentawai', 'Lima Puluh Kota', 'Padang Pariaman',
        'Pasaman', 'Pasaman Barat', 'Pesisir Selatan', 'Sijunjung', 'Solok',
        'Solok Selatan', 'Tanah Datar', 'Bukittinggi', 'Padang', 'Padang Panjang',
        'Pariaman', 'Payakumbuh', 'Sawahlunto', 'Solok'
    ],
    
    // Riau (12)
    'Riau' => [
        'Bengkalis', 'Indragiri Hilir', 'Indragiri Hulu', 'Kampar', 'Kepulauan Meranti',
        'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir', 'Rokan Hulu', 'Siak',
        'Dumai', 'Pekanbaru'
    ],
    
    // Kepulauan Riau (7)
    'Kepulauan Riau' => [
        'Bintan', 'Karimun', 'Kepulauan Anambas', 'Lingga', 'Natuna',
        'Batam', 'Tanjung Pinang'
    ],
    
    // Jambi (11)
    'Jambi' => [
        'Batanghari', 'Bungo', 'Kerinci', 'Merangin', 'Muaro Jambi',
        'Sarolangun', 'Tanjung Jabung Barat', 'Tanjung Jabung Timur', 'Tebo',
        'Jambi', 'Sungai Penuh'
    ],
    
    // Sumatera Selatan (17)
    'Sumatera Selatan' => [
        'Banyuasin', 'Empat Lawang', 'Lahat', 'Muara Enim', 'Musi Banyuasin',
        'Musi Rawas', 'Musi Rawas Utara', 'Ogan Ilir', 'Ogan Komering Ilir',
        'Ogan Komering Ulu', 'Ogan Komering Ulu Selatan', 'Ogan Komering Ulu Timur',
        'Penukal Abab Lematang Ilir', 'Palembang', 'Prabumulih', 'Lubuklinggau',
        'Pagar Alam'
    ],
    
    // Bengkulu (10)
    'Bengkulu' => [
        'Bengkulu Selatan', 'Bengkulu Tengah', 'Bengkulu Utara', 'Kaur', 'Kepahiang',
        'Lebong', 'Mukomuko', 'Rejang Lebong', 'Seluma', 'Bengkulu'
    ],
    
    // Lampung (15)
    'Lampung' => [
        'Lampung Barat', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur',
        'Lampung Utara', 'Mesuji', 'Pesawaran', 'Pesisir Barat', 'Pringsewu',
        'Tanggamus', 'Tulang Bawang', 'Tulang Bawang Barat', 'Way Kanan',
        'Bandar Lampung', 'Metro'
    ],
    
    // Bangka Belitung (7)
    'Bangka Belitung' => [
        'Bangka', 'Bangka Barat', 'Bangka Selatan', 'Bangka Tengah', 'Belitung',
        'Belitung Timur', 'Pangkal Pinang'
    ],
    
    // DKI Jakarta (6)
    'DKI Jakarta' => [
        'Jakarta Barat', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur',
        'Jakarta Utara', 'Kepulauan Seribu'
    ],
    
    // Jawa Barat (27)
    'Jawa Barat' => [
        'Bandung', 'Bandung Barat', 'Bekasi', 'Bogor', 'Ciamis', 'Cianjur',
        'Cirebon', 'Garut', 'Indramayu', 'Karawang', 'Kuningan', 'Majalengka',
        'Pangandaran', 'Purwakarta', 'Subang', 'Sukabumi', 'Sumedang', 'Tasikmalaya',
        'Banjar', 'Bekasi', 'Bogor', 'Cimahi', 'Cirebon', 'Depok', 'Sukabumi',
        'Tasikmalaya', 'Bandung'
    ],
    
    // Banten (8)
    'Banten' => [
        'Lebak', 'Pandeglang', 'Serang', 'Tangerang', 'Cilegon', 'Serang',
        'Tangerang', 'Tangerang Selatan'
    ],
    
    // Jawa Tengah (35)
    'Jawa Tengah' => [
        'Banjarnegara', 'Banyumas', 'Batang', 'Blora', 'Boyolali', 'Brebes',
        'Cilacap', 'Demak', 'Grobogan', 'Jepara', 'Karanganyar', 'Kebumen',
        'Kendal', 'Klaten', 'Kudus', 'Magelang', 'Pati', 'Pekalongan',
        'Pemalang', 'Purbalingga', 'Purworejo', 'Rembang', 'Semarang',
        'Sragen', 'Sukoharjo', 'Tegal', 'Temanggung', 'Wonogiri', 'Wonosobo',
        'Magelang', 'Pekalongan', 'Salatiga', 'Semarang', 'Surakarta', 'Tegal'
    ],
    
    // DI Yogyakarta (5)
    'DI Yogyakarta' => [
        'Bantul', 'Gunungkidul', 'Kulon Progo', 'Sleman', 'Yogyakarta'
    ],
    
    // Jawa Timur (38)
    'Jawa Timur' => [
        'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso',
        'Gresik', 'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang',
        'Madiun', 'Magetan', 'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi',
        'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 'Probolinggo',
        'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek',
        'Tuban', 'Tulungagung', 'Batu', 'Blitar', 'Kediri', 'Madiun',
        'Malang', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Surabaya'
    ],
    
    // Bali (9)
    'Bali' => [
        'Badung', 'Bangli', 'Buleleng', 'Gianyar', 'Jembrana',
        'Karangasem', 'Klungkung', 'Tabanan', 'Denpasar'
    ],
    
    // Nusa Tenggara Barat (10)
    'Nusa Tenggara Barat' => [
        'Bima', 'Dompu', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur',
        'Lombok Utara', 'Sumbawa', 'Sumbawa Barat', 'Bima', 'Mataram'
    ],
    
    // Nusa Tenggara Timur (22)
    'Nusa Tenggara Timur' => [
        'Alor', 'Belu', 'Ende', 'Flores Timur', 'Kupang', 'Lembata',
        'Malaka', 'Manggarai', 'Manggarai Barat', 'Manggarai Timur',
        'Nagekeo', 'Ngada', 'Rote Ndao', 'Sabu Raijua', 'Sikka',
        'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 'Sumba Timur',
        'Timor Tengah Selatan', 'Timor Tengah Utara', 'Kupang'
    ],
    
    // Kalimantan Barat (14)
    'Kalimantan Barat' => [
        'Bengkayang', 'Kapuas Hulu', 'Kayong Utara', 'Ketapang', 'Kubu Raya',
        'Landak', 'Melawi', 'Mempawah', 'Sambas', 'Sanggau', 'Sekadau',
        'Sintang', 'Pontianak', 'Singkawang'
    ],
    
    // Kalimantan Tengah (14)
    'Kalimantan Tengah' => [
        'Barito Selatan', 'Barito Timur', 'Barito Utara', 'Gunung Mas',
        'Kapuas', 'Katingan', 'Kotawaringin Barat', 'Kotawaringin Timur',
        'Lamandau', 'Murung Raya', 'Pulang Pisau', 'Seruyan', 'Sukamara',
        'Palangka Raya'
    ],
    
    // Kalimantan Selatan (13)
    'Kalimantan Selatan' => [
        'Balangan', 'Banjar', 'Barito Kuala', 'Hulu Sungai Selatan',
        'Hulu Sungai Tengah', 'Hulu Sungai Utara', 'Kotabaru', 'Tabalong',
        'Tanah Bumbu', 'Tanah Laut', 'Tapin', 'Banjarbaru', 'Banjarmasin'
    ],
    
    // Kalimantan Timur (10)
    'Kalimantan Timur' => [
        'Berau', 'Kutai Barat', 'Kutai Kartanegara', 'Kutai Timur',
        'Mahakam Ulu', 'Paser', 'Penajam Paser Utara', 'Balikpapan',
        'Bontang', 'Samarinda'
    ],
    
    // Kalimantan Utara (5)
    'Kalimantan Utara' => [
        'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung', 'Tarakan'
    ],
    
    // Sulawesi Utara (15)
    'Sulawesi Utara' => [
        'Bolaang Mongondow', 'Bolaang Mongondow Selatan', 'Bolaang Mongondow Timur',
        'Bolaang Mongondow Utara', 'Kepulauan Sangihe', 'Kepulauan Siau Tagulandang Biaro',
        'Kepulauan Talaud', 'Minahasa', 'Minahasa Selatan', 'Minahasa Tenggara',
        'Minahasa Utara', 'Bitung', 'Kotamobagu', 'Manado', 'Tomohon'
    ],
    
    // Gorontalo (6)
    'Gorontalo' => [
        'Boalemo', 'Bone Bolango', 'Gorontalo', 'Gorontalo Utara', 'Pohuwato',
        'Gorontalo'
    ],
    
    // Sulawesi Tengah (13)
    'Sulawesi Tengah' => [
        'Banggai', 'Banggai Kepulauan', 'Banggai Laut', 'Buol', 'Donggala',
        'Morowali', 'Morowali Utara', 'Parigi Moutong', 'Poso', 'Sigi',
        'Tojo Una-Una', 'Tolitoli', 'Palu'
    ],
    
    // Sulawesi Barat (6)
    'Sulawesi Barat' => [
        'Majene', 'Mamasa', 'Mamuju', 'Mamuju Tengah', 'Mamuju Utara', 'Polewali Mandar'
    ],
    
    // Sulawesi Selatan (24)
    'Sulawesi Selatan' => [
        'Bantaeng', 'Barru', 'Bone', 'Bulukumba', 'Enrekang', 'Gowa',
        'Jeneponto', 'Kepulauan Selayar', 'Luwu', 'Luwu Timur', 'Luwu Utara',
        'Maros', 'Pangkajene dan Kepulauan', 'Pinrang', 'Sidenreng Rappang',
        'Sinjai', 'Soppeng', 'Takalar', 'Tana Toraja', 'Toraja Utara',
        'Wajo', 'Makassar', 'Palopo', 'Parepare'
    ],
    
    // Sulawesi Tenggara (17)
    'Sulawesi Tenggara' => [
        'Bombana', 'Buton', 'Buton Selatan', 'Buton Tengah', 'Buton Utara',
        'Kolaka', 'Kolaka Timur', 'Kolaka Utara', 'Konawe', 'Konawe Kepulauan',
        'Konawe Selatan', 'Konawe Utara', 'Muna', 'Muna Barat', 'Wakatobi',
        'Bau-Bau', 'Kendari'
    ],
    
    // Maluku (11)
    'Maluku' => [
        'Buru', 'Buru Selatan', 'Kepulauan Aru', 'Maluku Barat Daya',
        'Maluku Tengah', 'Maluku Tenggara', 'Maluku Tenggara Barat',
        'Seram Bagian Barat', 'Seram Bagian Timur', 'Ambon', 'Tual'
    ],
    
    // Maluku Utara (10)
    'Maluku Utara' => [
        'Halmahera Barat', 'Halmahera Tengah', 'Halmahera Utara', 'Halmahera Selatan',
        'Halmahera Timur', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu',
        'Ternate', 'Tidore Kepulauan'
    ],
    
    // Papua (29)
    'Papua' => [
        'Asmat', 'Biak Numfor', 'Boven Digoel', 'Deiyai', 'Dogiyai',
        'Intan Jaya', 'Jayapura', 'Jayawijaya', 'Keerom', 'Kepulauan Yapen',
        'Lanny Jaya', 'Mamberamo Raya', 'Mamberamo Tengah', 'Mappi',
        'Merauke', 'Mimika', 'Nabire', 'Nduga', 'Paniai', 'Pegunungan Bintang',
        'Puncak', 'Puncak Jaya', 'Sarmi', 'Supiori', 'Tolikara',
        'Waropen', 'Yahukimo', 'Yalimo', 'Jayapura'
    ],
    
    // Papua Barat (13)
    'Papua Barat' => [
        'Fakfak', 'Kaimana', 'Manokwari', 'Manokwari Selatan', 'Maybrat',
        'Pegunungan Arfak', 'Raja Ampat', 'Sorong', 'Sorong Selatan',
        'Tambrauw', 'Teluk Bintuni', 'Teluk Wondama', 'Sorong'
    ]
];

try {
    // Buat koneksi ke database
    $conn = new mysqli($dbConfig['host'], $dbConfig['username'], $dbConfig['password'], $dbConfig['database']);
    
    // Cek koneksi
    if ($conn->connect_error) {
        throw new Exception("Koneksi gagal: " . $conn->connect_error);
    }
    
    echo "============================================\n";
    echo " MEMBUAT AKUN ADMIN PENGCAB SELURUH INDONESIA\n";
    echo "============================================\n\n";
    echo "Terhubung ke database dengan sukses.\n";
    
    // Set role_id untuk admin_pengcab (diasumsikan 2 berdasarkan data roles)
    $role_id = 2;
    $password_default = 'PENGCABFORBASI';
    $hashed_password = password_hash($password_default, PASSWORD_DEFAULT);
    
    // Hitung total kota/kabupaten
    $total_kota = 0;
    foreach ($provinsiKota as $provinsi => $kotas) {
        $total_kota += count($kotas);
    }
    
    echo "\nTotal kabupaten/kota di Indonesia: {$total_kota}\n";
    echo "Memulai proses membuat akun...\n\n";
    
    $created_count = 0;
    $skipped_count = 0;
    $error_count = 0;
    
    // Loop untuk setiap provinsi dan kota/kabupaten
    foreach ($provinsiKota as $provinsi => $kotas) {
        echo "Provinsi: {$provinsi}\n";
        echo "--------------------------------\n";
        
        foreach ($kotas as $kota) {
            // Format username: nama kota/kabupaten (lowercase, tanpa spasi, ganti 'dan' dengan '_')
            $username = strtolower(str_replace([' ', 'dan'], ['_', '_'], $kota));
            
            // Periksa apakah username sudah ada
            $check_query = "SELECT id FROM users WHERE username = ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("s", $username);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                echo "[-] Akun untuk {$kota} sudah ada (username: {$username})\n";
                $skipped_count++;
                continue;
            }
            
            // Buat akun baru
            $insert_query = "INSERT INTO users 
                            (club_name, username, password, role_id, is_active, created_at, updated_at) 
                            VALUES (?, ?, ?, ?, 1, NOW(), NOW())";
            $insert_stmt = $conn->prepare($insert_query);
            $insert_stmt->bind_param("sssi", $kota, $username, $hashed_password, $role_id);
            
            if ($insert_stmt->execute()) {
                $user_id = $conn->insert_id;
                
                // Buat admin profile
                $profile_query = "INSERT INTO admin_profiles 
                                (user_id, level, region, phone, additional_info) 
                                VALUES (?, 'Pengcab', ?, NULL, NULL)";
                $profile_stmt = $conn->prepare($profile_query);
                $profile_stmt->bind_param("is", $user_id, $provinsi);
                
                if ($profile_stmt->execute()) {
                    echo "[+] Berhasil membuat akun untuk {$kota} (username: {$username}, password: {$password_default})\n";
                    $created_count++;
                } else {
                    echo "[!] Gagal membuat profil admin untuk {$kota}: " . $conn->error . "\n";
                    $error_count++;
                    // Hapus user yang sudah dibuat jika profil gagal
                    $conn->query("DELETE FROM users WHERE id = $user_id");
                }
            } else {
                echo "[!] Gagal membuat akun untuk {$kota}: " . $conn->error . "\n";
                $error_count++;
            }
        }
        echo "\n";
    }
    
    echo "\n================================\n";
    echo " LAPORAN AKHIR\n";
    echo "================================\n";
    echo "Total kabupaten/kota: {$total_kota}\n";
    echo "Akun berhasil dibuat: {$created_count}\n";
    echo "Akun yang sudah ada: {$skipped_count}\n";
    echo "Akun gagal dibuat: {$error_count}\n";
    echo "--------------------------------\n";
    
    if ($error_count > 0) {
        echo "PERHATIAN: Terdapat {$error_count} kesalahan dalam proses pembuatan akun.\n";
        echo "Silakan periksa log di atas untuk detailnya.\n";
    }
    
    if ($created_count + $skipped_count === $total_kota) {
        echo "SUKSES: Semua kabupaten/kota di Indonesia telah diproses!\n";
    } else {
        echo "PERHATIAN: Beberapa kabupaten/kota mungkin terlewat!\n";
    }
    
    // Tutup koneksi
    $conn->close();
    
} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);