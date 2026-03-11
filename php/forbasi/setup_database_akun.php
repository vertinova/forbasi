<?php
// setup_database.php

// Database connection configuration
$db_host = '127.0.0.1';
$db_name = 'forbasi_db';
$db_user = 'root'; // Change to your database username
$db_pass = '';     // Change to your database password

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Koneksi database berhasil. Memulai setup...\n";

    // --- 1. Create 'users' table if not exists (Ensure it has role_id, province_id, city_id) ---
    $sql_create_users = "
    CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        club_name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL DEFAULT 1, -- 1: users, 2: admin_pengcab, 3: admin_pengda, 4: admin_pb
        province_id INT NULL,
        city_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($sql_create_users);
    echo "Tabel 'users' telah dibuat atau sudah ada.\n";

    // --- 2. Create 'provinces' table if not exists ---
    $sql_create_provinces = "
    CREATE TABLE IF NOT EXISTS provinces (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE
    );";
    $pdo->exec($sql_create_provinces);
    echo "Tabel 'provinces' telah dibuat atau sudah ada.\n";

    // --- 3. Create 'cities' table if not exists ---
    $sql_create_cities = "
    CREATE TABLE IF NOT EXISTS cities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        province_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (province_id) REFERENCES provinces(id)
    );";
    $pdo->exec($sql_create_cities);
    echo "Tabel 'cities' telah dibuat atau sudah ada.\n";

    // --- 4. Create 'kta_applications' table if not exists (WITH province_id and city_id) ---
    $sql_create_kta_applications = "
    CREATE TABLE IF NOT EXISTS kta_applications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        coach_name VARCHAR(255) NOT NULL,
        manager_name VARCHAR(255) NOT NULL,
        province VARCHAR(100) NOT NULL,
        regency VARCHAR(100) NOT NULL,
        club_address TEXT NOT NULL,
        logo_path VARCHAR(255) NOT NULL,
        ad_file_path VARCHAR(255) DEFAULT NULL,
        art_file_path VARCHAR(255) NOT NULL,
        sk_file_path VARCHAR(255) NOT NULL,
        payment_proof_path VARCHAR(255) NOT NULL,
        pergetA_payment_proof_path VARCHAR(255) DEFAULT NULL,
        status ENUM('pending','approved_pengcab','approved_pengda','approved_pb','rejected','kta_issued') DEFAULT 'pending',
        approved_by_pengcab_id INT(11) DEFAULT NULL,
        approved_at_pengcab TIMESTAMP NULL DEFAULT NULL,
        notes_pengcab TEXT DEFAULT NULL,
        pengcab_payment_proof_path VARCHAR(255) DEFAULT NULL,
        approved_by_pengda_id INT(11) DEFAULT NULL,
        approved_at_pengda TIMESTAMP NULL DEFAULT NULL,
        notes_pengda TEXT DEFAULT NULL,
        pengda_payment_proof_path VARCHAR(255) DEFAULT NULL,
        approved_by_pb_id INT(11) DEFAULT NULL,
        approved_at_pb TIMESTAMP NULL DEFAULT NULL,
        notes_pb TEXT DEFAULT NULL,
        kta_file_path VARCHAR(255) DEFAULT NULL,
        kta_issued_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        province_id INT NULL, -- Added column
        city_id INT NULL,     -- Added column
        PRIMARY KEY (`id`),
        KEY `user_id` (`user_id`),
        KEY `idx_kta_applications_status` (`status`),
        KEY `idx_kta_applications_user_id` (`user_id`),
        CONSTRAINT `fk_kta_applications_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_kta_applications_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`), -- Added FK
        CONSTRAINT `fk_kta_applications_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) -- Added FK
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($sql_create_kta_applications);
    echo "Tabel 'kta_applications' telah dibuat atau sudah ada (termasuk province_id dan city_id).\n";

    // --- 5. Create 'kta_application_history' table if not exists ---
    $sql_create_kta_history = "
    CREATE TABLE IF NOT EXISTS kta_application_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        status ENUM('pending','approved_pengcab','approved_pengda','approved_pb','rejected','kta_issued') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES kta_applications(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_create_kta_history);
    echo "Tabel 'kta_application_history' telah dibuat atau sudah ada.\n";


    // --- 6. Populate 'provinces' table ---
    $stmt = $pdo->query("SELECT COUNT(*) FROM provinces");
    if ($stmt->fetchColumn() == 0) {
        echo "Mengisi data provinsi...\n";
        $pdo->beginTransaction();
        $sql_insert_provinces = "
        INSERT IGNORE INTO provinces (name) VALUES
        ('Aceh'), ('Sumatera Utara'), ('Sumatera Barat'), ('Riau'), ('Jambi'),
        ('Sumatera Selatan'), ('Bengkulu'), ('Lampung'), ('Kepulauan Bangka Belitung'), ('Kepulauan Riau'),
        ('DKI Jakarta'), ('Jawa Barat'), ('Jawa Tengah'), ('DI Yogyakarta'), ('Jawa Timur'), ('Banten'),
        ('Bali'), ('Nusa Tenggara Barat'), ('Nusa Tenggara Timur'),
        ('Kalimantan Barat'), ('Kalimantan Tengah'), ('Kalimantan Selatan'), ('Kalimantan Timur'), ('Kalimantan Utara'),
        ('Sulawesi Utara'), ('Sulawesi Tengah'), ('Sulawesi Selatan'), ('Sulawesi Tenggara'), ('Gorontalo'), ('Sulawesi Barat'),
        ('Maluku'), ('Maluku Utara'),
        ('Papua'), ('Papua Barat Daya'), ('Papua Barat'), ('Papua Tengah'), ('Papua Pegunungan'), ('Papua Selatan');
        ";
        $pdo->exec($sql_insert_provinces);
        $pdo->commit();
        echo "Data provinsi berhasil diisi.\n";
    } else {
        echo "Data provinsi sudah ada, dilewati.\n";
    }

    // Fetch province IDs for cities and admin_pengda accounts
    $provinces = [];
    $stmt = $pdo->query("SELECT id, name FROM provinces");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $provinces[$row['name']] = $row['id'];
    }

    // --- 7. Populate 'cities' table ---
    // Check if cities already exist (e.g., check for a known city, but ensure it's not a partial insert)
    $stmt = $pdo->query("SELECT COUNT(*) FROM cities WHERE name = 'Jakarta Pusat'");
    if ($stmt->fetchColumn() == 0) {
        echo "Mengisi data kabupaten/kota...\n";
        $pdo->beginTransaction();
        $city_values = [];

        // --- Data Kabupaten/Kota Lengkap ---
        // ACEH (id: 1)
        $id_aceh = $provinces['Aceh'];
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Barat')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Barat Daya')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Besar')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Jaya')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Selatan')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Singkil')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Tamiang')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Tengah')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Tenggara')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Timur')";
        $city_values[] = "($id_aceh, 'Kabupaten Aceh Utara')";
        $city_values[] = "($id_aceh, 'Kabupaten Bener Meriah')";
        $city_values[] = "($id_aceh, 'Kabupaten Bireuen')";
        $city_values[] = "($id_aceh, 'Kabupaten Gayo Lues')";
        $city_values[] = "($id_aceh, 'Kabupaten Nagan Raya')";
        $city_values[] = "($id_aceh, 'Kabupaten Pidie')";
        $city_values[] = "($id_aceh, 'Kabupaten Pidie Jaya')";
        $city_values[] = "($id_aceh, 'Kabupaten Simeulue')";
        $city_values[] = "($id_aceh, 'Kota Banda Aceh')";
        $city_values[] = "($id_aceh, 'Kota Langsa')";
        $city_values[] = "($id_aceh, 'Kota Lhokseumawe')";
        $city_values[] = "($id_aceh, 'Kota Sabang')";
        $city_values[] = "($id_aceh, 'Kota Subulussalam')";

        // SUMATERA UTARA
        $id_sumut = $provinces['Sumatera Utara'];
        $city_values[] = "($id_sumut, 'Kabupaten Asahan')";
        $city_values[] = "($id_sumut, 'Kabupaten Batubara')";
        $city_values[] = "($id_sumut, 'Kabupaten Dairi')";
        $city_values[] = "($id_sumut, 'Kabupaten Deli Serdang')";
        $city_values[] = "($id_sumut, 'Kabupaten Humbang Hasundutan')";
        $city_values[] = "($id_sumut, 'Kabupaten Karo')";
        $city_values[] = "($id_sumut, 'Kabupaten Labuhanbatu')";
        $city_values[] = "($id_sumut, 'Kabupaten Labuhanbatu Selatan')";
        $city_values[] = "($id_sumut, 'Kabupaten Labuhanbatu Utara')";
        $city_values[] = "($id_sumut, 'Kabupaten Langkat')";
        $city_values[] = "($id_sumut, 'Kabupaten Mandailing Natal')";
        $city_values[] = "($id_sumut, 'Kabupaten Nias')";
        $city_values[] = "($id_sumut, 'Kabupaten Nias Barat')";
        $city_values[] = "($id_sumut, 'Kabupaten Nias Selatan')";
        $city_values[] = "($id_sumut, 'Kabupaten Nias Utara')";
        $city_values[] = "($id_sumut, 'Kabupaten Padang Lawas')";
        $city_values[] = "($id_sumut, 'Kabupaten Padang Lawas Utara')";
        $city_values[] = "($id_sumut, 'Kabupaten Pakpak Bharat')";
        $city_values[] = "($id_sumut, 'Kabupaten Samosir')";
        $city_values[] = "($id_sumut, 'Kabupaten Serdang Bedagai')";
        $city_values[] = "($id_sumut, 'Kabupaten Simalungun')";
        $city_values[] = "($id_sumut, 'Kabupaten Tapanuli Selatan')";
        $city_values[] = "($id_sumut, 'Kabupaten Tapanuli Tengah')";
        $city_values[] = "($id_sumut, 'Kabupaten Tapanuli Utara')";
        $city_values[] = "($id_sumut, 'Kabupaten Toba')";
        $city_values[] = "($id_sumut, 'Kota Binjai')";
        $city_values[] = "($id_sumut, 'Kota Gunungsitoli')";
        $city_values[] = "($id_sumut, 'Kota Medan')";
        $city_values[] = "($id_sumut, 'Kota Padangsidimpuan')";
        $city_values[] = "($id_sumut, 'Kota Pematangsiantar')";
        $city_values[] = "($id_sumut, 'Kota Sibolga')";
        $city_values[] = "($id_sumut, 'Kota Tanjungbalai')";
        $city_values[] = "($id_sumut, 'Kota Tebing Tinggi')";

        // SUMATERA BARAT
        $id_sumbar = $provinces['Sumatera Barat'];
        $city_values[] = "($id_sumbar, 'Kabupaten Agam')";
        $city_values[] = "($id_sumbar, 'Kabupaten Dharmasraya')";
        $city_values[] = "($id_sumbar, 'Kabupaten Kepulauan Mentawai')";
        $city_values[] = "($id_sumbar, 'Kabupaten Lima Puluh Kota')";
        $city_values[] = "($id_sumbar, 'Kabupaten Padang Pariaman')";
        $city_values[] = "($id_sumbar, 'Kabupaten Pasaman')";
        $city_values[] = "($id_sumbar, 'Kabupaten Pasaman Barat')";
        $city_values[] = "($id_sumbar, 'Kabupaten Pesisir Selatan')";
        $city_values[] = "($id_sumbar, 'Kabupaten Sijunjung')";
        $city_values[] = "($id_sumbar, 'Kabupaten Solok')";
        $city_values[] = "($id_sumbar, 'Kabupaten Solok Selatan')";
        $city_values[] = "($id_sumbar, 'Kabupaten Tanah Datar')";
        $city_values[] = "($id_sumbar, 'Kota Bukittinggi')";
        $city_values[] = "($id_sumbar, 'Kota Padang')";
        $city_values[] = "($id_sumbar, 'Kota Padangpanjang')";
        $city_values[] = "($id_sumbar, 'Kota Pariaman')";
        $city_values[] = "($id_sumbar, 'Kota Payakumbuh')";
        $city_values[] = "($id_sumbar, 'Kota Sawahlunto')";
        $city_values[] = "($id_sumbar, 'Kota Solok')";

        // RIAU
        $id_riau = $provinces['Riau'];
        $city_values[] = "($id_riau, 'Kabupaten Bengkalis')";
        $city_values[] = "($id_riau, 'Kabupaten Indragiri Hilir')";
        $city_values[] = "($id_riau, 'Kabupaten Indragiri Hulu')";
        $city_values[] = "($id_riau, 'Kabupaten Kampar')";
        $city_values[] = "($id_riau, 'Kabupaten Kuantan Singingi')";
        $city_values[] = "($id_riau, 'Kabupaten Pelalawan')";
        $city_values[] = "($id_riau, 'Kabupaten Rokan Hilir')";
        $city_values[] = "($id_riau, 'Kabupaten Rokan Hulu')";
        $city_values[] = "($id_riau, 'Kabupaten Siak')";
        $city_values[] = "($id_riau, 'Kabupaten Kepulauan Meranti')";
        $city_values[] = "($id_riau, 'Kota Dumai')";
        $city_values[] = "($id_riau, 'Kota Pekanbaru')";

        // JAMBI
        $id_jambi = $provinces['Jambi'];
        $city_values[] = "($id_jambi, 'Kabupaten Batanghari')";
        $city_values[] = "($id_jambi, 'Kabupaten Bungo')";
        $city_values[] = "($id_jambi, 'Kabupaten Kerinci')";
        $city_values[] = "($id_jambi, 'Kabupaten Merangin')";
        $city_values[] = "($id_jambi, 'Kabupaten Muaro Jambi')";
        $city_values[] = "($id_jambi, 'Kabupaten Sarolangun')";
        $city_values[] = "($id_jambi, 'Kabupaten Tanjung Jabung Barat')";
        $city_values[] = "($id_jambi, 'Kabupaten Tanjung Jabung Timur')";
        $city_values[] = "($id_jambi, 'Kabupaten Tebo')";
        $city_values[] = "($id_jambi, 'Kota Jambi')";
        $city_values[] = "($id_jambi, 'Kota Sungai Penuh')";

        // SUMATERA SELATAN
        $id_sumsel = $provinces['Sumatera Selatan'];
        $city_values[] = "($id_sumsel, 'Kabupaten Banyuasin')";
        $city_values[] = "($id_sumsel, 'Kabupaten Empat Lawang')";
        $city_values[] = "($id_sumsel, 'Kabupaten Lahat')";
        $city_values[] = "($id_sumsel, 'Kabupaten Muara Enim')";
        $city_values[] = "($id_sumsel, 'Kabupaten Musi Banyuasin')";
        $city_values[] = "($id_sumsel, 'Kabupaten Musi Rawas')";
        $city_values[] = "($id_sumsel, 'Kabupaten Musi Rawas Utara')";
        $city_values[] = "($id_sumsel, 'Kabupaten Ogan Ilir')";
        $city_values[] = "($id_sumsel, 'Kabupaten Ogan Komering Ilir')";
        $city_values[] = "($id_sumsel, 'Kabupaten Ogan Komering Ulu')";
        $city_values[] = "($id_sumsel, 'Kabupaten Ogan Komering Ulu Selatan')";
        $city_values[] = "($id_sumsel, 'Kabupaten Ogan Komering Ulu Timur')";
        $city_values[] = "($id_sumsel, 'Kabupaten Penukal Abab Lematang Ilir')";
        $city_values[] = "($id_sumsel, 'Kota Lubuklinggau')";
        $city_values[] = "($id_sumsel, 'Kota Pagar Alam')";
        $city_values[] = "($id_sumsel, 'Kota Palembang')";
        $city_values[] = "($id_sumsel, 'Kota Prabumulih')";

        // BENGKULU
        $id_bengkulu = $provinces['Bengkulu'];
        $city_values[] = "($id_bengkulu, 'Kabupaten Bengkulu Selatan')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Bengkulu Tengah')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Bengkulu Utara')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Kaur')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Kepahiang')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Lebong')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Mukomuko')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Rejang Lebong')";
        $city_values[] = "($id_bengkulu, 'Kabupaten Seluma')";
        $city_values[] = "($id_bengkulu, 'Kota Bengkulu')";

        // LAMPUNG
        $id_lampung = $provinces['Lampung'];
        $city_values[] = "($id_lampung, 'Kabupaten Lampung Barat')";
        $city_values[] = "($id_lampung, 'Kabupaten Lampung Selatan')";
        $city_values[] = "($id_lampung, 'Kabupaten Lampung Tengah')";
        $city_values[] = "($id_lampung, 'Kabupaten Lampung Timur')";
        $city_values[] = "($id_lampung, 'Kabupaten Lampung Utara')";
        $city_values[] = "($id_lampung, 'Kabupaten Mesuji')";
        $city_values[] = "($id_lampung, 'Kabupaten Pesawaran')";
        $city_values[] = "($id_lampung, 'Kabupaten Pesisir Barat')";
        $city_values[] = "($id_lampung, 'Kabupaten Pringsewu')";
        $city_values[] = "($id_lampung, 'Kabupaten Tanggamus')";
        $city_values[] = "($id_lampung, 'Kabupaten Tulang Bawang')";
        $city_values[] = "($id_lampung, 'Kabupaten Tulang Bawang Barat')";
        $city_values[] = "($id_lampung, 'Kabupaten Way Kanan')";
        $city_values[] = "($id_lampung, 'Kota Bandar Lampung')";
        $city_values[] = "($id_lampung, 'Kota Metro')";

        // KEPULAUAN BANGKA BELITUNG
        $id_babel = $provinces['Kepulauan Bangka Belitung'];
        $city_values[] = "($id_babel, 'Kabupaten Bangka')";
        $city_values[] = "($id_babel, 'Kabupaten Bangka Barat')";
        $city_values[] = "($id_babel, 'Kabupaten Bangka Selatan')";
        $city_values[] = "($id_babel, 'Kabupaten Bangka Tengah')";
        $city_values[] = "($id_babel, 'Kabupaten Belitung')";
        $city_values[] = "($id_babel, 'Kabupaten Belitung Timur')";
        $city_values[] = "($id_babel, 'Kota Pangkal Pinang')";

        // KEPULAUAN RIAU
        $id_kepri = $provinces['Kepulauan Riau'];
        $city_values[] = "($id_kepri, 'Kabupaten Bintan')";
        $city_values[] = "($id_kepri, 'Kabupaten Karimun')";
        $city_values[] = "($id_kepri, 'Kabupaten Kepulauan Anambas')";
        $city_values[] = "($id_kepri, 'Kabupaten Lingga')";
        $city_values[] = "($id_kepri, 'Kabupaten Natuna')";
        $city_values[] = "($id_kepri, 'Kota Batam')";
        $city_values[] = "($id_kepri, 'Kota Tanjungpinang')";

        // DKI JAKARTA
        $id_jakarta = $provinces['DKI Jakarta'];
        $city_values[] = "($id_jakarta, 'Kota Jakarta Pusat')";
        $city_values[] = "($id_jakarta, 'Kota Jakarta Barat')";
        $city_values[] = "($id_jakarta, 'Kota Jakarta Selatan')";
        $city_values[] = "($id_jakarta, 'Kota Jakarta Timur')";
        $city_values[] = "($id_jakarta, 'Kota Jakarta Utara')";
        $city_values[] = "($id_jakarta, 'Kabupaten Kepulauan Seribu')";

        // JAWA BARAT
        $id_jabar = $provinces['Jawa Barat'];
        $city_values[] = "($id_jabar, 'Kabupaten Bandung')";
        $city_values[] = "($id_jabar, 'Kabupaten Bandung Barat')";
        $city_values[] = "($id_jabar, 'Kabupaten Bekasi')";
        $city_values[] = "($id_jabar, 'Kabupaten Bogor')";
        $city_values[] = "($id_jabar, 'Kabupaten Ciamis')";
        $city_values[] = "($id_jabar, 'Kabupaten Cianjur')";
        $city_values[] = "($id_jabar, 'Kabupaten Cirebon')";
        $city_values[] = "($id_jabar, 'Kabupaten Garut')";
        $city_values[] = "($id_jabar, 'Kabupaten Indramayu')";
        $city_values[] = "($id_jabar, 'Kabupaten Karawang')";
        $city_values[] = "($id_jabar, 'Kabupaten Kuningan')";
        $city_values[] = "($id_jabar, 'Kabupaten Majalengka')";
        $city_values[] = "($id_jabar, 'Kabupaten Pangandaran')";
        $city_values[] = "($id_jabar, 'Kabupaten Purwakarta')";
        $city_values[] = "($id_jabar, 'Kabupaten Subang')";
        $city_values[] = "($id_jabar, 'Kabupaten Sukabumi')";
        $city_values[] = "($id_jabar, 'Kabupaten Sumedang')";
        $city_values[] = "($id_jabar, 'Kabupaten Tasikmalaya')";
        $city_values[] = "($id_jabar, 'Kota Bandung')";
        $city_values[] = "($id_jabar, 'Kota Banjar')";
        $city_values[] = "($id_jabar, 'Kota Bekasi')";
        $city_values[] = "($id_jabar, 'Kota Bogor')";
        $city_values[] = "($id_jabar, 'Kota Cimahi')";
        $city_values[] = "($id_jabar, 'Kota Cirebon')";
        $city_values[] = "($id_jabar, 'Kota Depok')";
        $city_values[] = "($id_jabar, 'Kota Sukabumi')";
        $city_values[] = "($id_jabar, 'Kota Tasikmalaya')";

        // JAWA TENGAH
        $id_jateng = $provinces['Jawa Tengah'];
        $city_values[] = "($id_jateng, 'Kabupaten Banjarnegara')";
        $city_values[] = "($id_jateng, 'Kabupaten Banyumas')";
        $city_values[] = "($id_jateng, 'Kabupaten Batang')";
        $city_values[] = "($id_jateng, 'Kabupaten Blora')";
        $city_values[] = "($id_jateng, 'Kabupaten Boyolali')";
        $city_values[] = "($id_jateng, 'Kabupaten Brebes')";
        $city_values[] = "($id_jateng, 'Kabupaten Cilacap')";
        $city_values[] = "($id_jateng, 'Kabupaten Demak')";
        $city_values[] = "($id_jateng, 'Kabupaten Grobogan')";
        $city_values[] = "($id_jateng, 'Kabupaten Jepara')";
        $city_values[] = "($id_jateng, 'Kabupaten Karanganyar')";
        $city_values[] = "($id_jateng, 'Kabupaten Kebumen')";
        $city_values[] = "($id_jateng, 'Kabupaten Kendal')";
        $city_values[] = "($id_jateng, 'Kabupaten Klaten')";
        $city_values[] = "($id_jateng, 'Kabupaten Kudus')";
        $city_values[] = "($id_jateng, 'Kabupaten Magelang')";
        $city_values[] = "($id_jateng, 'Kabupaten Pati')";
        $city_values[] = "($id_jateng, 'Kabupaten Pekalongan')";
        $city_values[] = "($id_jateng, 'Kabupaten Pemalang')";
        $city_values[] = "($id_jateng, 'Kabupaten Purbalingga')";
        $city_values[] = "($id_jateng, 'Kabupaten Purworejo')";
        $city_values[] = "($id_jateng, 'Kabupaten Rembang')";
        $city_values[] = "($id_jateng, 'Kabupaten Semarang')";
        $city_values[] = "($id_jateng, 'Kabupaten Sragen')";
        $city_values[] = "($id_jateng, 'Kabupaten Sukoharjo')";
        $city_values[] = "($id_jateng, 'Kabupaten Tegal')";
        $city_values[] = "($id_jateng, 'Kabupaten Temanggung')";
        $city_values[] = "($id_jateng, 'Kabupaten Wonogiri')";
        $city_values[] = "($id_jateng, 'Kabupaten Wonosobo')";
        $city_values[] = "($id_jateng, 'Kota Magelang')";
        $city_values[] = "($id_jateng, 'Kota Pekalongan')";
        $city_values[] = "($id_jateng, 'Kota Salatiga')";
        $city_values[] = "($id_jateng, 'Kota Semarang')";
        $city_values[] = "($id_jateng, 'Kota Surakarta')";
        $city_values[] = "($id_jateng, 'Kota Tegal')";

        // DI YOGYAKARTA
        $id_diy = $provinces['DI Yogyakarta'];
        $city_values[] = "($id_diy, 'Kabupaten Bantul')";
        $city_values[] = "($id_diy, 'Kabupaten Gunungkidul')";
        $city_values[] = "($id_diy, 'Kabupaten Kulon Progo')";
        $city_values[] = "($id_diy, 'Kabupaten Sleman')";
        $city_values[] = "($id_diy, 'Kota Yogyakarta')";

        // JAWA TIMUR
        $id_jatim = $provinces['Jawa Timur'];
        $city_values[] = "($id_jatim, 'Kabupaten Bangkalan')";
        $city_values[] = "($id_jatim, 'Kabupaten Banyuwangi')";
        $city_values[] = "($id_jatim, 'Kabupaten Blitar')";
        $city_values[] = "($id_jatim, 'Kabupaten Bojonegoro')";
        $city_values[] = "($id_jatim, 'Kabupaten Bondowoso')";
        $city_values[] = "($id_jatim, 'Kabupaten Gresik')";
        $city_values[] = "($id_jatim, 'Kabupaten Jember')";
        $city_values[] = "($id_jatim, 'Kabupaten Jombang')";
        $city_values[] = "($id_jatim, 'Kabupaten Kediri')";
        $city_values[] = "($id_jatim, 'Kabupaten Lamongan')";
        $city_values[] = "($id_jatim, 'Kabupaten Lumajang')";
        $city_values[] = "($id_jatim, 'Kabupaten Madiun')";
        $city_values[] = "($id_jatim, 'Kabupaten Magetan')";
        $city_values[] = "($id_jatim, 'Kabupaten Malang')";
        $city_values[] = "($id_jatim, 'Kabupaten Mojokerto')";
        $city_values[] = "($id_jatim, 'Kabupaten Nganjuk')";
        $city_values[] = "($id_jatim, 'Kabupaten Ngawi')";
        $city_values[] = "($id_jatim, 'Kabupaten Pacitan')";
        $city_values[] = "($id_jatim, 'Kabupaten Pamekasan')";
        $city_values[] = "($id_jatim, 'Kabupaten Pasuruan')";
        $city_values[] = "($id_jatim, 'Kabupaten Ponorogo')";
        $city_values[] = "($id_jatim, 'Kabupaten Probolinggo')";
        $city_values[] = "($id_jatim, 'Kabupaten Sampang')";
        $city_values[] = "($id_jatim, 'Kabupaten Sidoarjo')";
        $city_values[] = "($id_jatim, 'Kabupaten Situbondo')";
        $city_values[] = "($id_jatim, 'Kabupaten Sumenep')";
        $city_values[] = "($id_jatim, 'Kabupaten Trenggalek')";
        $city_values[] = "($id_jatim, 'Kabupaten Tuban')";
        $city_values[] = "($id_jatim, 'Kabupaten Tulungagung')";
        $city_values[] = "($id_jatim, 'Kota Batu')";
        $city_values[] = "($id_jatim, 'Kota Blitar')";
        $city_values[] = "($id_jatim, 'Kota Kediri')";
        $city_values[] = "($id_jatim, 'Kota Madiun')";
        $city_values[] = "($id_jatim, 'Kota Malang')";
        $city_values[] = "($id_jatim, 'Kota Mojokerto')";
        $city_values[] = "($id_jatim, 'Kota Pasuruan')";
        $city_values[] = "($id_jatim, 'Kota Probolinggo')";
        $city_values[] = "($id_jatim, 'Kota Surabaya')";

        // BANTEN
        $id_banten = $provinces['Banten'];
        $city_values[] = "($id_banten, 'Kabupaten Lebak')";
        $city_values[] = "($id_banten, 'Kabupaten Pandeglang')";
        $city_values[] = "($id_banten, 'Kabupaten Serang')";
        $city_values[] = "($id_banten, 'Kabupaten Tangerang')";
        $city_values[] = "($id_banten, 'Kota Cilegon')";
        $city_values[] = "($id_banten, 'Kota Serang')";
        $city_values[] = "($id_banten, 'Kota Tangerang')";
        $city_values[] = "($id_banten, 'Kota Tangerang Selatan')";

        // BALI
        $id_bali = $provinces['Bali'];
        $city_values[] = "($id_bali, 'Kabupaten Badung')";
        $city_values[] = "($id_bali, 'Kabupaten Bangli')";
        $city_values[] = "($id_bali, 'Kabupaten Buleleng')";
        $city_values[] = "($id_bali, 'Kabupaten Gianyar')";
        $city_values[] = "($id_bali, 'Kabupaten Jembrana')";
        $city_values[] = "($id_bali, 'Kabupaten Karangasem')";
        $city_values[] = "($id_bali, 'Kabupaten Klungkung')";
        $city_values[] = "($id_bali, 'Kabupaten Tabanan')";
        $city_values[] = "($id_bali, 'Kota Denpasar')";

        // NUSA TENGGARA BARAT
        $id_ntb = $provinces['Nusa Tenggara Barat'];
        $city_values[] = "($id_ntb, 'Kabupaten Bima')";
        $city_values[] = "($id_ntb, 'Kabupaten Dompu')";
        $city_values[] = "($id_ntb, 'Kabupaten Lombok Barat')";
        $city_values[] = "($id_ntb, 'Kabupaten Lombok Tengah')";
        $city_values[] = "($id_ntb, 'Kabupaten Lombok Timur')";
        $city_values[] = "($id_ntb, 'Kabupaten Lombok Utara')";
        $city_values[] = "($id_ntb, 'Kabupaten Sumbawa')";
        $city_values[] = "($id_ntb, 'Kabupaten Sumbawa Barat')";
        $city_values[] = "($id_ntb, 'Kota Bima')";
        $city_values[] = "($id_ntb, 'Kota Mataram')";

        // NUSA TENGGARA TIMUR
        $id_ntt = $provinces['Nusa Tenggara Timur'];
        $city_values[] = "($id_ntt, 'Kabupaten Alor')";
        $city_values[] = "($id_ntt, 'Kabupaten Belu')";
        $city_values[] = "($id_ntt, 'Kabupaten Ende')";
        $city_values[] = "($id_ntt, 'Kabupaten Flores Timur')";
        $city_values[] = "($id_ntt, 'Kabupaten Kupang')";
        $city_values[] = "($id_ntt, 'Kabupaten Lembata')";
        $city_values[] = "($id_ntt, 'Kabupaten Malaka')";
        $city_values[] = "($id_ntt, 'Kabupaten Manggarai')";
        $city_values[] = "($id_ntt, 'Kabupaten Manggarai Barat')";
        $city_values[] = "($id_ntt, 'Kabupaten Manggarai Timur')";
        $city_values[] = "($id_ntt, 'Kabupaten Nagekeo')";
        $city_values[] = "($id_ntt, 'Kabupaten Ngada')";
        $city_values[] = "($id_ntt, 'Kabupaten Rote Ndao')";
        $city_values[] = "($id_ntt, 'Kabupaten Sabu Raijua')";
        $city_values[] = "($id_ntt, 'Kabupaten Sikka')";
        $city_values[] = "($id_ntt, 'Kabupaten Sumba Barat')";
        $city_values[] = "($id_ntt, 'Kabupaten Sumba Barat Daya')";
        $city_values[] = "($id_ntt, 'Kabupaten Sumba Tengah')";
        $city_values[] = "($id_ntt, 'Kabupaten Sumba Timur')";
        $city_values[] = "($id_ntt, 'Kabupaten Timor Tengah Selatan')";
        $city_values[] = "($id_ntt, 'Kabupaten Timor Tengah Utara')";
        $city_values[] = "($id_ntt, 'Kota Kupang')";

        // KALIMANTAN BARAT
        $id_kalbar = $provinces['Kalimantan Barat'];
        $city_values[] = "($id_kalbar, 'Kabupaten Bengkayang')";
        $city_values[] = "($id_kalbar, 'Kabupaten Kapuas Hulu')";
        $city_values[] = "($id_kalbar, 'Kabupaten Kayong Utara')";
        $city_values[] = "($id_kalbar, 'Kabupaten Ketapang')";
        $city_values[] = "($id_kalbar, 'Kabupaten Kubu Raya')";
        $city_values[] = "($id_kalbar, 'Kabupaten Landak')";
        $city_values[] = "($id_kalbar, 'Kabupaten Melawi')";
        $city_values[] = "($id_kalbar, 'Kabupaten Mempawah')";
        $city_values[] = "($id_kalbar, 'Kabupaten Sambas')";
        $city_values[] = "($id_kalbar, 'Kabupaten Sanggau')";
        $city_values[] = "($id_kalbar, 'Kabupaten Sekadau')";
        $city_values[] = "($id_kalbar, 'Kabupaten Sintang')";
        $city_values[] = "($id_kalbar, 'Kota Pontianak')";
        $city_values[] = "($id_kalbar, 'Kota Singkawang')";

        // KALIMANTAN TENGAH
        $id_kalteng = $provinces['Kalimantan Tengah'];
        $city_values[] = "($id_kalteng, 'Kabupaten Barito Selatan')";
        $city_values[] = "($id_kalteng, 'Kabupaten Barito Timur')";
        $city_values[] = "($id_kalteng, 'Kabupaten Barito Utara')";
        $city_values[] = "($id_kalteng, 'Kabupaten Gunung Mas')";
        $city_values[] = "($id_kalteng, 'Kabupaten Kapuas')";
        $city_values[] = "($id_kalteng, 'Kabupaten Katingan')";
        $city_values[] = "($id_kalteng, 'Kabupaten Kotawaringin Barat')";
        $city_values[] = "($id_kalteng, 'Kabupaten Kotawaringin Timur')";
        $city_values[] = "($id_kalteng, 'Kabupaten Lamandau')";
        $city_values[] = "($id_kalteng, 'Kabupaten Murung Raya')";
        $city_values[] = "($id_kalteng, 'Kabupaten Pulang Pisau')";
        $city_values[] = "($id_kalteng, 'Kabupaten Seruyan')";
        $city_values[] = "($id_kalteng, 'Kabupaten Sukamara')";
        $city_values[] = "($id_kalteng, 'Kota Palangka Raya')";

        // KALIMANTAN SELATAN
        $id_kalsel = $provinces['Kalimantan Selatan'];
        $city_values[] = "($id_kalsel, 'Kabupaten Balangan')";
        $city_values[] = "($id_kalsel, 'Kabupaten Banjar')";
        $city_values[] = "($id_kalsel, 'Kabupaten Barito Kuala')";
        $city_values[] = "($id_kalsel, 'Kabupaten Hulu Sungai Selatan')";
        $city_values[] = "($id_kalsel, 'Kabupaten Hulu Sungai Tengah')";
        $city_values[] = "($id_kalsel, 'Kabupaten Hulu Sungai Utara')";
        $city_values[] = "($id_kalsel, 'Kabupaten Kotabaru')";
        $city_values[] = "($id_kalsel, 'Kabupaten Tabalong')";
        $city_values[] = "($id_kalsel, 'Kabupaten Tanah Bumbu')";
        $city_values[] = "($id_kalsel, 'Kabupaten Tanah Laut')";
        $city_values[] = "($id_kalsel, 'Kabupaten Tapin')";
        $city_values[] = "($id_kalsel, 'Kota Banjarbaru')";
        $city_values[] = "($id_kalsel, 'Kota Banjarmasin')";

        // KALIMANTAN TIMUR
        $id_kaltim = $provinces['Kalimantan Timur'];
        $city_values[] = "($id_kaltim, 'Kabupaten Berau')";
        $city_values[] = "($id_kaltim, 'Kabupaten Kutai Barat')";
        $city_values[] = "($id_kaltim, 'Kabupaten Kutai Kartanegara')";
        $city_values[] = "($id_kaltim, 'Kabupaten Kutai Timur')";
        $city_values[] = "($id_kaltim, 'Kabupaten Mahakam Ulu')";
        $city_values[] = "($id_kaltim, 'Kabupaten Paser')";
        $city_values[] = "($id_kaltim, 'Kabupaten Penajam Paser Utara')";
        $city_values[] = "($id_kaltim, 'Kota Balikpapan')";
        $city_values[] = "($id_kaltim, 'Kota Bontang')";
        $city_values[] = "($id_kaltim, 'Kota Samarinda')";

        // KALIMANTAN UTARA
        $id_kalut = $provinces['Kalimantan Utara'];
        $city_values[] = "($id_kalut, 'Kabupaten Bulungan')";
        $city_values[] = "($id_kalut, 'Kabupaten Malinau')";
        $city_values[] = "($id_kalut, 'Kabupaten Nunukan')";
        $city_values[] = "($id_kalut, 'Kabupaten Tana Tidung')";
        $city_values[] = "($id_kalut, 'Kota Tarakan')";

        // SULAWESI UTARA
        $id_sulut = $provinces['Sulawesi Utara'];
        $city_values[] = "($id_sulut, 'Kabupaten Bolaang Mongondow')";
        $city_values[] = "($id_sulut, 'Kabupaten Bolaang Mongondow Selatan')";
        $city_values[] = "($id_sulut, 'Kabupaten Bolaang Mongondow Timur')";
        $city_values[] = "($id_sulut, 'Kabupaten Bolaang Mongondow Utara')";
        $city_values[] = "($id_sulut, 'Kabupaten Kepulauan Sangihe')";
        $city_values[] = "($id_sulut, 'Kabupaten Kepulauan Siau Tagulandang Biaro')";
        $city_values[] = "($id_sulut, 'Kabupaten Kepulauan Talaud')";
        $city_values[] = "($id_sulut, 'Kabupaten Minahasa')";
        $city_values[] = "($id_sulut, 'Kabupaten Minahasa Selatan')";
        $city_values[] = "($id_sulut, 'Kabupaten Minahasa Tenggara')";
        $city_values[] = "($id_sulut, 'Kabupaten Minahasa Utara')";
        $city_values[] = "($id_sulut, 'Kota Bitung')";
        $city_values[] = "($id_sulut, 'Kota Kotamobagu')";
        $city_values[] = "($id_sulut, 'Kota Manado')";
        $city_values[] = "($id_sulut, 'Kota Tomohon')";

        // SULAWESI TENGAH
        $id_sulteng = $provinces['Sulawesi Tengah'];
        $city_values[] = "($id_sulteng, 'Kabupaten Banggai')";
        $city_values[] = "($id_sulteng, 'Kabupaten Banggai Kepulauan')";
        $city_values[] = "($id_sulteng, 'Kabupaten Banggai Laut')";
        $city_values[] = "($id_sulteng, 'Kabupaten Buol')";
        $city_values[] = "($id_sulteng, 'Kabupaten Donggala')";
        $city_values[] = "($id_sulteng, 'Kabupaten Morowali')";
        $city_values[] = "($id_sulteng, 'Kabupaten Morowali Utara')";
        $city_values[] = "($id_sulteng, 'Kabupaten Parigi Moutong')";
        $city_values[] = "($id_sulteng, 'Kabupaten Poso')";
        $city_values[] = "($id_sulteng, 'Kabupaten Sigi')";
        $city_values[] = "($id_sulteng, 'Kabupaten Tojo Una-Una')";
        $city_values[] = "($id_sulteng, 'Kabupaten Tolitoli')";
        $city_values[] = "($id_sulteng, 'Kota Palu')";

        // SULAWESI SELATAN
        $id_sulsel = $provinces['Sulawesi Selatan'];
        $city_values[] = "($id_sulsel, 'Kabupaten Bantaeng')";
        $city_values[] = "($id_sulsel, 'Kabupaten Barru')";
        $city_values[] = "($id_sulsel, 'Kabupaten Bone')";
        $city_values[] = "($id_sulsel, 'Kabupaten Bulukumba')";
        $city_values[] = "($id_sulsel, 'Kabupaten Enrekang')";
        $city_values[] = "($id_sulsel, 'Kabupaten Gowa')";
        $city_values[] = "($id_sulsel, 'Kabupaten Jeneponto')";
        $city_values[] = "($id_sulsel, 'Kabupaten Kepulauan Selayar')";
        $city_values[] = "($id_sulsel, 'Kabupaten Luwu')";
        $city_values[] = "($id_sulsel, 'Kabupaten Luwu Timur')";
        $city_values[] = "($id_sulsel, 'Kabupaten Luwu Utara')";
        $city_values[] = "($id_sulsel, 'Kabupaten Maros')";
        $city_values[] = "($id_sulsel, 'Kabupaten Pangkajene dan Kepulauan')";
        $city_values[] = "($id_sulsel, 'Kabupaten Pinrang')";
        $city_values[] = "($id_sulsel, 'Kabupaten Sidenreng Rappang')";
        $city_values[] = "($id_sulsel, 'Kabupaten Sinjai')";
        $city_values[] = "($id_sulsel, 'Kabupaten Soppeng')";
        $city_values[] = "($id_sulsel, 'Kabupaten Takalar')";
        $city_values[] = "($id_sulsel, 'Kabupaten Tana Toraja')";
        $city_values[] = "($id_sulsel, 'Kabupaten Toraja Utara')";
        $city_values[] = "($id_sulsel, 'Kabupaten Wajo')";
        $city_values[] = "($id_sulsel, 'Kota Makassar')";
        $city_values[] = "($id_sulsel, 'Kota Palopo')";
        $city_values[] = "($id_sulsel, 'Kota Parepare')";

        // SULAWESI TENGGARA
        $id_sultra = $provinces['Sulawesi Tenggara'];
        $city_values[] = "($id_sultra, 'Kabupaten Bombana')";
        $city_values[] = "($id_sultra, 'Kabupaten Buton')";
        $city_values[] = "($id_sultra, 'Kabupaten Buton Selatan')";
        $city_values[] = "($id_sultra, 'Kabupaten Buton Tengah')";
        $city_values[] = "($id_sultra, 'Kabupaten Buton Utara')";
        $city_values[] = "($id_sultra, 'Kabupaten Kolaka')";
        $city_values[] = "($id_sultra, 'Kabupaten Kolaka Timur')";
        $city_values[] = "($id_sultra, 'Kabupaten Kolaka Utara')";
        $city_values[] = "($id_sultra, 'Kabupaten Konawe')";
        $city_values[] = "($id_sultra, 'Kabupaten Konawe Kepulauan')";
        $city_values[] = "($id_sultra, 'Kabupaten Konawe Selatan')";
        $city_values[] = "($id_sultra, 'Kabupaten Konawe Utara')";
        $city_values[] = "($id_sultra, 'Kabupaten Muna')";
        $city_values[] = "($id_sultra, 'Kabupaten Muna Barat')";
        $city_values[] = "($id_sultra, 'Kabupaten Wakatobi')";
        $city_values[] = "($id_sultra, 'Kota Baubau')";
        $city_values[] = "($id_sultra, 'Kota Kendari')";

        // GORONTALO
        $id_gorontalo = $provinces['Gorontalo'];
        $city_values[] = "($id_gorontalo, 'Kabupaten Boalemo')";
        $city_values[] = "($id_gorontalo, 'Kabupaten Bone Bolango')";
        $city_values[] = "($id_gorontalo, 'Kabupaten Gorontalo')";
        $city_values[] = "($id_gorontalo, 'Kabupaten Gorontalo Utara')";
        $city_values[] = "($id_gorontalo, 'Kabupaten Pohuwato')";
        $city_values[] = "($id_gorontalo, 'Kota Gorontalo')";

        // SULAWESI BARAT
        $id_sulbar = $provinces['Sulawesi Barat'];
        $city_values[] = "($id_sulbar, 'Kabupaten Majene')";
        $city_values[] = "($id_sulbar, 'Kabupaten Mamasa')";
        $city_values[] = "($id_sulbar, 'Kabupaten Mamuju')";
        $city_values[] = "($id_sulbar, 'Kabupaten Mamuju Tengah')";
        $city_values[] = "($id_sulbar, 'Kabupaten Pasangkayu')";
        $city_values[] = "($id_sulbar, 'Kabupaten Polewali Mandar')";

        // MALUKU
        $id_maluku = $provinces['Maluku'];
        $city_values[] = "($id_maluku, 'Kabupaten Buru')";
        $city_values[] = "($id_maluku, 'Kabupaten Buru Selatan')";
        $city_values[] = "($id_maluku, 'Kabupaten Kepulauan Aru')";
        $city_values[] = "($id_maluku, 'Kabupaten Kepulauan Tanimbar')";
        $city_values[] = "($id_maluku, 'Kabupaten Maluku Tengah')";
        $city_values[] = "($id_maluku, 'Kabupaten Maluku Tenggara')";
        $city_values[] = "($id_maluku, 'Kabupaten Maluku Barat Daya')";
        $city_values[] = "($id_maluku, 'Kabupaten Seram Bagian Barat')";
        $city_values[] = "($id_maluku, 'Kabupaten Seram Bagian Timur')";
        $city_values[] = "($id_maluku, 'Kota Ambon')";
        $city_values[] = "($id_maluku, 'Kota Tual')";

        // MALUKU UTARA
        $id_malut = $provinces['Maluku Utara'];
        $city_values[] = "($id_malut, 'Kabupaten Halmahera Barat')";
        $city_values[] = "($id_malut, 'Kabupaten Halmahera Selatan')";
        $city_values[] = "($id_malut, 'Kabupaten Halmahera Tengah')";
        $city_values[] = "($id_malut, 'Kabupaten Halmahera Timur')";
        $city_values[] = "($id_malut, 'Kabupaten Halmahera Utara')";
        $city_values[] = "($id_malut, 'Kabupaten Kepulauan Sula')";
        $city_values[] = "($id_malut, 'Kabupaten Pulau Morotai')";
        $city_values[] = "($id_malut, 'Kabupaten Pulau Taliabu')";
        $city_values[] = "($id_malut, 'Kota Ternate')";
        $city_values[] = "($id_malut, 'Kota Tidore Kepulauan')";

        // PAPUA
        $id_papua = $provinces['Papua'];
        $city_values[] = "($id_papua, 'Kabupaten Biak Numfor')";
        $city_values[] = "($id_papua, 'Kabupaten Jayapura')";
        $city_values[] = "($id_papua, 'Kabupaten Keerom')";
        $city_values[] = "($id_papua, 'Kabupaten Sarmi')";
        $city_values[] = "($id_papua, 'Kabupaten Supiori')";
        $city_values[] = "($id_papua, 'Kabupaten Waropen')";
        $city_values[] = "($id_papua, 'Kota Jayapura')";

        // PAPUA BARAT DAYA
        $id_pbd = $provinces['Papua Barat Daya'];
        $city_values[] = "($id_pbd, 'Kabupaten Maybrat')";
        $city_values[] = "($id_pbd, 'Kabupaten Raja Ampat')";
        $city_values[] = "($id_pbd, 'Kabupaten Sorong')";
        $city_values[] = "($id_pbd, 'Kabupaten Sorong Selatan')";
        $city_values[] = "($id_pbd, 'Kabupaten Tambrauw')";
        $city_values[] = "($id_pbd, 'Kota Sorong')";

        // PAPUA BARAT
        $id_pb_province = $provinces['Papua Barat']; // Renamed to avoid conflict with admin_pb
        $city_values[] = "($id_pb_province, 'Kabupaten Fakfak')";
        $city_values[] = "($id_pb_province, 'Kabupaten Kaimana')";
        $city_values[] = "($id_pb_province, 'Kabupaten Manokwari')";
        $city_values[] = "($id_pb_province, 'Kabupaten Manokwari Selatan')";
        $city_values[] = "($id_pb_province, 'Kabupaten Pegunungan Arfak')";
        $city_values[] = "($id_pb_province, 'Kabupaten Teluk Bintuni')";
        $city_values[] = "($id_pb_province, 'Kabupaten Teluk Wondama')";

        // PAPUA TENGAH
        $id_pt = $provinces['Papua Tengah'];
        $city_values[] = "($id_pt, 'Kabupaten Deiyai')";
        $city_values[] = "($id_pt, 'Kabupaten Dogiyai')";
        $city_values[] = "($id_pt, 'Kabupaten Intan Jaya')";
        $city_values[] = "($id_pt, 'Kabupaten Mimika')";
        $city_values[] = "($id_pt, 'Kabupaten Nabire')";
        $city_values[] = "($id_pt, 'Kabupaten Paniai')";
        $city_values[] = "($id_pt, 'Kabupaten Puncak')";
        $city_values[] = "($id_pt, 'Kabupaten Puncak Jaya')";

        // PAPUA PEGUNUNGAN
        $id_pp = $provinces['Papua Pegunungan'];
        $city_values[] = "($id_pp, 'Kabupaten Jayawijaya')";
        $city_values[] = "($id_pp, 'Kabupaten Lanny Jaya')";
        $city_values[] = "($id_pp, 'Kabupaten Mamberamo Tengah')";
        $city_values[] = "($id_pp, 'Kabupaten Nduga')";
        $city_values[] = "($id_pp, 'Kabupaten Pegunungan Bintang')";
        $city_values[] = "($id_pp, 'Kabupaten Tolikara')";
        $city_values[] = "($id_pp, 'Kabupaten Yahukimo')";
        $city_values[] = "($id_pp, 'Kabupaten Yalimo')";

        // PAPUA SELATAN
        $id_ps = $provinces['Papua Selatan'];
        $city_values[] = "($id_ps, 'Kabupaten Asmat')";
        $city_values[] = "($id_ps, 'Kabupaten Boven Digoel')";
        $city_values[] = "($id_ps, 'Kabupaten Mappi')";
        $city_values[] = "($id_ps, 'Kabupaten Merauke')";


        $sql_insert_cities = "INSERT IGNORE INTO cities (province_id, name) VALUES ";
        $sql_insert_cities .= implode(",\n", $city_values) . ";";
        $pdo->exec($sql_insert_cities);
        $pdo->commit();
        echo "Data kabupaten/kota berhasil diisi.\n";
    } else {
        echo "Data kabupaten/kota sudah ada, dilewati.\n";
    }

    // Fetch all cities for admin_pengcab accounts
    $cities = [];
    $stmt = $pdo->query("SELECT id, name, province_id FROM cities");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cities[] = $row;
    }

    // --- 8. Create Admin Accounts ---
    $hashed_password = password_hash('forbasi123', PASSWORD_DEFAULT); // Default password for all admins

    // --- Admin PB (Pusat) - role_id = 4 ---
    $admin_pb_username = 'admin_pb';
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$admin_pb_username]);
    if ($stmt->rowCount() == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (club_name, username, email, phone, address, password, role_id, province_id, city_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['FORBASI Pusat', $admin_pb_username, 'admin.pb@forbasi.org', '081112223333', 'Jl. PB Pusat No. 1 Jakarta', $hashed_password, 4, NULL, NULL]);
        echo "Akun admin PB ('{$admin_pb_username}') berhasil dibuat.\n";
    } else {
        echo "Akun admin PB ('{$admin_pb_username}') sudah ada, dilewati.\n";
    }

    // --- Admin Pengda (Provinsi) - role_id = 3 ---
    echo "Membuat akun admin Pengda (Provinsi)...\n";
    $stmt_insert_pengda = $pdo->prepare("INSERT INTO users (club_name, username, email, phone, address, password, role_id, province_id, city_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($provinces as $province_name => $province_id) {
        $pengda_username = 'admin_pengda_' . strtolower(str_replace(' ', '_', $province_name));
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$pengda_username]);
        if ($stmt->rowCount() == 0) {
            $club_name = 'FORBASI ' . $province_name;
            $email = 'admin.pengda.' . strtolower(str_replace([' ', '/'], ['', '_'], $province_name)) . '@forbasi.org';
            $address = 'Kantor ' . $province_name;
            $stmt_insert_pengda->execute([$club_name, $pengda_username, $email, '0812' . rand(1000, 9999) . rand(1000, 9999), $address, $hashed_password, 3, $province_id, NULL]);
            echo "Akun admin Pengda '{$pengda_username}' untuk {$province_name} berhasil dibuat.\n";
        } else {
            echo "Akun admin Pengda '{$pengda_username}' sudah ada, dilewati.\n";
        }
    }

    // --- Admin Pengcab (Kabupaten/Kota) - role_id = 2 ---
    echo "Membuat akun admin Pengcab (Kabupaten/Kota)...\n";
    $stmt_insert_pengcab = $pdo->prepare("INSERT INTO users (club_name, username, email, phone, address, password, role_id, province_id, city_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($cities as $city) {
        $city_name_clean = strtolower(str_replace([' ', 'Kabupaten ', 'Kota ', '-', '.'], ['_', '', '', '_', ''], $city['name']));
        $pengcab_username = 'admin_pengcab_' . $city_name_clean;
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$pengcab_username]);
        if ($stmt->rowCount() == 0) {
            $club_name = 'FORBASI ' . $city['name'];
            $email = 'admin.pengcab.' . $city_name_clean . '@forbasi.org';
            $address = 'Kantor ' . $city['name'];
            $stmt_insert_pengcab->execute([$club_name, $pengcab_username, $email, '0813' . rand(1000, 9999) . rand(1000, 9999), $address, $hashed_password, 2, $city['province_id'], $city['id']]);
            echo "Akun admin Pengcab '{$pengcab_username}' untuk {$city['name']} berhasil dibuat.\n";
        } else {
            echo "Akun admin Pengcab '{$pengcab_username}' sudah ada, dilewati.\n";
        }
    }


    echo "\nSetup database selesai dengan sukses!\n";

} catch (PDOException $e) {
    die("Setup database gagal: " . $e->getMessage());
}
?>