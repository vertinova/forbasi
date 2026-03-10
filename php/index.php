<?php
// forbasi/index.php

// Sertakan file konfigurasi database
include_once 'forbasi/php/db_config.php';

// Inisialisasi array untuk menyimpan data anggota
$officialMembers = [];
$totalOfficialMembers = 0; // Total anggota dengan KTA terbit

// Base path untuk logo (relatif dari index.php)
$logoBasePath = 'forbasi/php/uploads/';

// --- Bagian Koneksi dan Pengambilan Data dari Database ---
if ($conn->connect_error) {
    error_log("Koneksi database gagal di index.php: " . $conn->connect_error);
} else {
    try {
        // Query untuk menghitung TOTAL anggota dengan status 'kta_issued'
        $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM kta_applications WHERE status = ?");
        $status = 'kta_issued';
        $countStmt->bind_param("s", $status);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $countRow = $countResult->fetch_assoc();
        $totalOfficialMembers = (int)$countRow['total'];
        $countStmt->close();
        
        // Query untuk mengambil SEMUA data klub dengan status 'kta_issued' (tanpa LIMIT)
        // Agar user bisa mencari semua anggota yang ada
        $stmt = $conn->prepare("SELECT club_name, club_address, coach_name, manager_name, logo_path 
                                FROM kta_applications 
                                WHERE status = ? 
                                ORDER BY kta_issued_at DESC");
        $stmt->bind_param("s", $status);

        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $officialMembers[] = $row;
        }
        $stmt->close();

    } catch (Exception $e) {
        error_log("Error fetching official members: " . $e->getMessage());
    } finally {
        if ($conn) {
            $conn->close();
        }
    }
}
// --- Akhir Bagian Koneksi dan Pengambilan Data dari Database ---
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Forum Baris Indonesia</title>
    
    <!-- PWA Meta Tags -->
    <meta name="description" content="FORBASI - Federasi Olahraga Baris Berbaris Seluruh Indonesia. Sistem Manajemen KTA, Kejurnas, dan Administrasi">
    <meta name="theme-color" content="#0d9500">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="FORBASI">
    
    <!-- Preload Critical Resources -->
    <link rel="preload" href="style.css" as="style">
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" as="style">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="forbasi/manifest.json">
    
    <!-- PWA Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="forbasi/assets/icon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="forbasi/assets/icon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="forbasi/assets/icon-192x192.png">
    <link rel="mask-icon" href="forbasi/assets/LOGO-FORBASI.png" color="#0d9500">
    
    <!-- Critical CSS -->
    <link rel="stylesheet" href="style.css">
    
    <!-- Deferred CSS -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" media="print" onload="this.media='all'">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
    
    <noscript>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </noscript>
</head>
<body>
    <nav class="navbar animate__animated animate__fadeInDown">
        <div class="nav">
            <div class="navbar-brand">
                <img src="forbasi/assets/indonesia-flag.png" alt="FORBASI Logo" class="logo">
            </div>
            <div class="navbar-links">
                <a href="#hero" class="nav-link active" data-title="Beranda"><i class="fas fa-home"></i></a>
                <a href="#what" class="nav-link" data-title="Tentang"><i class="fas fa-info-circle"></i></a>
                <a href="#program" class="nav-link" data-title="Program"><i class="fas fa-calendar-alt"></i></a>
                <a href="#lisensi" class="nav-link" data-title="Lisensi"><i class="fas fa-certificate"></i></a>
                <a href="#product" class="nav-link" data-title="Produk"><i class="fas fa-tshirt"></i></a>
                <a href="#members" class="nav-link" data-title="Anggota"><i class="fas fa-users"></i></a>
                <a href="#competition" class="nav-link" data-title="Kompetisi"><i class="fas fa-trophy"></i></a>
            </div>
            <a href="forbasi/php/login.php">
                <!--<a href="forbasi/suspend.php">-->
                <button class="login-btn">
                    <p>login</p>
                </button>
            </a>
        </div>
    </nav>

    <section id="hero" class="hero-section">
        <div class="video-background">
            <video autoplay loop muted playsinline loading="lazy" poster="forbasi/assets/LOGO-FORBASI.png">
                <source src="forbasi/assets/forbasi.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        <div class="hero-content">
            </div>
        <div class="scroll-indicator">
            <div class="mouse">
                <div class="scroller"></div>
            </div>
            <span>Scroll Down</span>
        </div>
    </section>

    <section id="what" class="about-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Tentang FORBASI</h2>
                <div class="divider"></div>
            </div>
            <div class="about-content">
                <div class="about-text">
                    <p>FORBASI (Forum Baris Indonesia) adalah organisasi yang membina, mengembangkan, dan memasyarakatkan olahraga baris-berbaris di Indonesia. Kami berkomitmen untuk membentuk generasi muda yang disiplin, tangguh, dan berkarakter melalui berbagai program pelatihan dan kompetisi.</p>
                    <p>Dengan jaringan di seluruh Indonesia, FORBASI menjadi wadah bagi para pecinta baris-berbaris untuk mengembangkan bakat, meningkatkan keterampilan, dan berprestasi di tingkat nasional maupun internasional.</p>
                </div>
                <div class="about-logos">
                    <div class="logo-card">
                        <img src="forbasi/assets/LOGO-FORBASI.png" alt="FORBASI Logo" class="logo-img">
                    </div>
                    <div class="logo-card">
                        <img src="forbasi/assets/kormi.png" alt="KORMI Logo" class="logo-img">
                        <div class="badge">Anggota KORMI</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="program" class="programs-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Program Kami</h2>
                <div class="divider"></div>
                <p class="section-description">Berbagai program unggulan untuk pengembangan olahraga baris-berbaris di Indonesia</p>
            </div>
            <div class="programs-grid">
                <div class="program-card" data-aos="fade-up">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/3050/3050541.png" alt="Kompetisi" loading="lazy">
                    </div>
                    <h3>Komite Kompetisi</h3>
                    <p>Menyelenggarakan berbagai kompetisi baris-berbaris dari tingkat daerah hingga nasional untuk mengembangkan bakat dan prestasi.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card" data-aos="fade-up" data-aos-delay="100">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/1570/1570887.png" alt="Keanggotaan" loading="lazy">
                    </div>
                    <h3>Komite Keanggotaan</h3>
                    <p>Mengelola keanggotaan FORBASI di seluruh Indonesia dan membangun jaringan antar anggota.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card" data-aos="fade-up" data-aos-delay="200">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/2936/2936886.png" alt="Pelatihan" loading="lazy">
                    </div>
                    <h3>Komite Kepelatihan</h3>
                    <p>Menyelenggarakan pelatihan dan pembinaan untuk meningkatkan kualitas pelatih baris-berbaris.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card" data-aos="fade-up" data-aos-delay="300">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/3176/3176272.png" alt="Sertifikasi" loading="lazy">
                    </div>
                    <h3>Sertifikasi Juri & Pelatih</h3>
                    <p>Melaksanakan program sertifikasi untuk menjamin kualitas juri dan pelatih baris-berbaris.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card" data-aos="fade-up" data-aos-delay="400">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="Anggota" loading="lazy">
                    </div>
                    <h3>Daftar Anggota</h3>
                    <p>Lihat daftar lengkap anggota FORBASI dari seluruh Indonesia dan bergabung dengan komunitas kami.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card highlight" data-aos="fade-up" data-aos-delay="500">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/2989/2989988.png" alt="Semua Program" loading="lazy">
                    </div>
                    <h3>Semua Program</h3>
                    <p>Temukan lebih banyak program menarik dari FORBASI untuk pengembangan baris-berbaris di Indonesia.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- License Registration Section -->
    <section id="lisensi" class="license-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-certificate"></i> Lisensi Pelatih & Juri</h2>
                <div class="divider"></div>
                <p class="section-description">Daftarkan diri Anda untuk mengikuti program sertifikasi lisensi pelatih atau juri FORBASI</p>
            </div>

            <!-- Event Info Card -->
            <div class="license-event-card">
                <div class="event-badge">
                    <i class="fas fa-calendar-star"></i> Jadwal Terbaru
                </div>
                <h3>Lisensi Pelatih dan Juri (Muda & Madya)</h3>
                <div class="license-event-details">
                    <div class="event-detail">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Minggu, 12 April 2026</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-clock"></i>
                        <span>08.00 WIB s/d selesai</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Semarang, Jawa Tengah</span>
                    </div>
                </div>
            </div>

            <!-- License Cards -->
            <div class="license-cards-container">
                <!-- Pelatih Card -->
                <div class="license-card pelatih-card" data-aos="fade-up">
                    <div class="license-card-header">
                        <div class="license-icon">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        <h3>Lisensi Pelatih</h3>
                    </div>
                    <div class="license-card-body">
                        <div class="license-price">
                            <span class="price-label">Investasi</span>
                            <span class="price-value">Rp 750.000</span>
                        </div>
                        <a href="forbasi/php/register_lisensi.php" class="license-btn pelatih-btn">
                            <i class="fas fa-user-plus"></i> Daftar Sekarang
                        </a>
                    </div>
                </div>

                <!-- Juri Card -->
                <div class="license-card juri-card" data-aos="fade-up" data-aos-delay="100">
                    <div class="license-card-header">
                        <div class="license-icon">
                            <i class="fas fa-gavel"></i>
                        </div>
                        <h3>Lisensi Juri</h3>
                        <span class="license-badge">Muda & Madya</span>
                    </div>
                    <div class="license-card-body">
                        <div class="license-price">
                            <span class="price-label">Investasi</span>
                            <span class="price-value">Rp 2.000.000</span>
                        </div>
                        <a href="forbasi/php/register_lisensi.php" class="license-btn juri-btn">
                            <i class="fas fa-user-plus"></i> Daftar Sekarang
                        </a>
                    </div>
                </div>
            </div>

            <!-- Registration Steps -->
            <div class="license-steps">
                <h4><i class="fas fa-list-ol"></i> Langkah Pendaftaran</h4>
                <div class="steps-container">
                    <div class="step-item" data-aos="fade-up">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h5>Buat Akun</h5>
                            <p>Daftar akun sebagai Pelatih atau Juri dengan username dan password</p>
                        </div>
                    </div>
                    <div class="step-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="step-item" data-aos="fade-up" data-aos-delay="100">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h5>Lengkapi Data</h5>
                            <p>Isi formulir dan upload dokumen persyaratan yang diperlukan</p>
                        </div>
                    </div>
                    <div class="step-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="step-item" data-aos="fade-up" data-aos-delay="200">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h5>Verifikasi PB</h5>
                            <p>Pengajuan akan diverifikasi oleh PB FORBASI</p>
                        </div>
                    </div>
                    <div class="step-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="step-item" data-aos="fade-up" data-aos-delay="300">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h5>Selesai</h5>
                            <p>Lisensi disetujui dan Anda siap mengikuti pelatihan</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="product" class="products-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Merchandise</h2>
                <div class="divider"></div>
                <p class="section-description">Dapatkan merchandise resmi FORBASI untuk mendukung kegiatan kami</p>
            </div>
            <div class="products-grid">
                <div class="product-card" data-aos="zoom-in">
                    <div class="product-image">
                        <img src="forbasi/assets/kemeja.png" alt="Kemeja Forbasi" loading="lazy" width="280" height="280">
                    </div>
                    <div class="product-info">
                        <h3>Kemeja Forbasi</h3>
                        <div class="price">Rp 150.000</div>
                        <a href="#" class="buy-button">Beli Sekarang</a>
                    </div>
                </div>
                <div class="product-card" data-aos="zoom-in" data-aos-delay="100">
                    <div class="product-image">
                        <img src="forbasi/assets/jersey.png" alt="Jersey Forbasi" loading="lazy" width="280" height="280">
                    </div>
                    <div class="product-info">
                        <h3>Jersey Forbasi</h3>
                        <div class="price">Rp 170.000</div>
                        <a href="#" class="buy-button">Beli Sekarang</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="members" class="members-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Anggota Resmi FORBASI</h2>
                <div class="divider"></div>
                <p class="section-description">Daftar klub yang telah menjadi anggota resmi FORBASI dengan KTA terbit.</p>
            </div>
            
            <!-- Members Count Display with Animation -->
            <div class="members-count-container">
                <div class="members-count-card">
                    <div class="count-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="count-content">
                        <div class="count-number" data-target="<?php echo $totalOfficialMembers; ?>">0</div>
                        <div class="count-label">Total Anggota Resmi</div>
                    </div>
                </div>
            </div>
            
            <!-- Search Box -->
            <div class="search-container">
                <div class="search-box">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="memberSearch" placeholder="Cari nama klub, pelatih, atau manajer..." autocomplete="off">
                    <button id="clearSearch" class="clear-search" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="searchResultCount" class="search-result-count" style="display: none;"></div>
            </div>
            
            <div class="members-grid" id="membersGrid">
                <?php if (!empty($officialMembers)): ?>
                    <?php 
                    // Hanya tampilkan 4 anggota pertama saat load awal untuk performa lebih baik
                    // Sisa anggota akan di-load secara dinamis via JavaScript (lazy loading)
                    // Ini memastikan page load tetap cepat meskipun total anggota banyak
                    $initialDisplayCount = 4;
                    $membersToDisplay = array_slice($officialMembers, 0, $initialDisplayCount);
                    ?>
                    <?php foreach ($membersToDisplay as $index => $member): ?>
                        <div class="member-card" data-index="<?php echo $index; ?>"
                             data-club-name="<?php echo strtolower(htmlspecialchars($member['club_name'])); ?>"
                             data-coach-name="<?php echo strtolower(htmlspecialchars($member['coach_name'])); ?>"
                             data-manager-name="<?php echo strtolower(htmlspecialchars($member['manager_name'])); ?>"
                             data-address="<?php echo strtolower(htmlspecialchars($member['club_address'])); ?>"
                             style="display: none; opacity: 0;">
                            <div class="member-image-container">
                                <?php
                                $logoFileName = htmlspecialchars($member['logo_path']);
                                $fullLogoPathOnServer = __DIR__ . '/' . $logoBasePath . $logoFileName;
                                $publicWebPath = $logoBasePath . $logoFileName;
                                ?>
                                <?php
                                if (file_exists($fullLogoPathOnServer) && !empty($member['logo_path'])):
                                ?>
                                    <img src="<?php echo $publicWebPath; ?>"
                                         alt="Logo <?php echo htmlspecialchars($member['club_name']); ?>"
                                         class="member-logo"
                                         loading="lazy"
                                         width="120"
                                         height="120"
                                         onerror="this.onerror=null;this.src='forbasi/assets/default-club-logo.png';this.classList.add('default-logo');"
                                    >
                                <?php else: ?>
                                    <img src="forbasi/assets/default-club-logo.png" alt="Logo Default" class="member-logo default-logo" loading="lazy" width="120" height="120">
                                <?php endif; ?>
                            </div>
                            <div class="member-badge">ANGGOTA RESMI FORBASI</div>
                            <h3><?php echo htmlspecialchars($member['club_name']); ?></h3>
                            <p><strong>Alamat:</strong> <?php echo htmlspecialchars($member['club_address']); ?></p>
                            <p><strong>Pelatih:</strong> <?php echo htmlspecialchars($member['coach_name']); ?></p>
                            <p><strong>Manajer:</strong> <?php echo htmlspecialchars($member['manager_name']); ?></p>
                        </div>
                    <?php endforeach; ?>
                    
                    <?php 
                    // Simpan sisa data dalam JavaScript untuk lazy loading pagination
                    if (count($officialMembers) > $initialDisplayCount):
                        $remainingMembers = array_slice($officialMembers, $initialDisplayCount);
                    ?>
                    <script>
                        // Data anggota yang tersisa untuk pagination
                        window.remainingMembersData = <?php echo json_encode($remainingMembers); ?>;
                        window.logoBasePath = '<?php echo $logoBasePath; ?>';
                    </script>
                    <?php endif; ?>
                    
                <?php else: ?>
                    <p class="no-members-message animate__animated animate__fadeIn">Belum ada anggota resmi yang terdaftar saat ini.</p>
                <?php endif; ?>
            </div>

            <?php if (!empty($officialMembers) && count($officialMembers) > 4): ?>
            <div class="pagination-container">
                <button id="prevPageBtn" class="pagination-btn" disabled>
                    <i class="fas fa-chevron-left"></i> Sebelumnya
                </button>
                <div class="pagination-info">
                    <span id="pageInfo">Halaman <span id="currentPage">1</span> dari <span id="totalPages">1</span></span>
                    <span class="page-size-info" style="font-size: 0.9rem; color: #666; margin-top: 5px;">(Menampilkan 4 anggota per halaman)</span>
                </div>
                <button id="nextPageBtn" class="pagination-btn">
                    Selanjutnya <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <?php endif; ?>

        </div>
    </section>

    <!-- Kejurnas Competition Teams Section -->
    <section id="competition" class="competition-section">
        <div class="competition-container">
            <div class="section-header animate__animated animate__fadeInUp">
                <h2 class="section-title">
                    <i class="fas fa-trophy"></i>
                    Tim Kompetisi Kejurnas
                </h2>
                <p class="section-subtitle">Tim-tim terbaik yang telah lolos seleksi untuk mengikuti kompetisi nasional</p>
            </div>

            <!-- Statistics Overview -->
            <div class="competition-stats" id="competition-stats">
                <div class="stat-card animate__animated animate__fadeInUp" style="animation-delay: 0.1s">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="total-teams">0</h3>
                        <p>Total Tim</p>
                    </div>
                </div>
                
                <div class="stat-card animate__animated animate__fadeInUp" style="animation-delay: 0.2s">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="rukibra-teams">0</h3>
                        <p>Rukibra</p>
                    </div>
                </div>
                
                <div class="stat-card animate__animated animate__fadeInUp" style="animation-delay: 0.3s">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);">
                        <i class="fas fa-drum"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="baris-teams">0</h3>
                        <p>Baris Berbaris</p>
                    </div>
                </div>
                
                <div class="stat-card animate__animated animate__fadeInUp" style="animation-delay: 0.4s">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="varfor-teams">0</h3>
                        <p>Varfor Musik</p>
                    </div>
                </div>
            </div>

            <!-- Search and Filter Container -->
            <div class="competition-search-filter animate__animated animate__fadeInUp">
                <!-- Search Box -->
                <div class="competition-search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="competitionSearch" placeholder="Cari nama klub, provinsi, atau pengda..." autocomplete="off">
                    <button id="clearCompSearch" class="clear-comp-search" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Level Filter Dropdown -->
                <div class="level-filter-container">
                    <label for="levelFilter" class="filter-label">
                        <i class="fas fa-graduation-cap"></i> Tingkat:
                    </label>
                    <select id="levelFilter" class="level-filter-select">
                        <option value="all">Semua Tingkat</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="Purna">Purna</option>
                    </select>
                </div>
            </div>

            <!-- Search Result Info -->
            <div id="compSearchResult" class="comp-search-result" style="display: none;"></div>

            <!-- Category Filter Tabs -->
            <div class="competition-filters animate__animated animate__fadeInUp">
                <button class="filter-btn active" data-category="all">
                    <i class="fas fa-th"></i> <span class="filter-text">Semua</span>
                </button>
                <button class="filter-btn" data-category="rukibra">
                    <i class="fas fa-flag"></i> <span class="filter-text">Rukibra</span>
                </button>
                <button class="filter-btn" data-category="baris_berbaris">
                    <i class="fas fa-person-military-rifle"></i> <span class="filter-text">Baris Berbaris</span>
                </button>
                <button class="filter-btn" data-category="varfor_musik">
                    <i class="fas fa-drum"></i> <span class="filter-text">Varfor Musik</span>
                </button>
            </div>

            <!-- Teams Grid -->
            <div class="teams-grid" id="teams-grid">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Memuat data tim...</p>
                </div>
            </div>

            <!-- Pagination Controls -->
            <div class="competition-pagination" id="competition-pagination" style="display: none;">
                <button class="pagination-btn" id="comp-prev-btn" disabled>
                    <i class="fas fa-chevron-left"></i> Sebelumnya
                </button>
                <div class="pagination-info">
                    <span>Halaman <span id="comp-current-page">1</span> dari <span id="comp-total-pages">1</span></span>
                    <span class="page-size-info">Menampilkan <span id="comp-showing">0</span> dari <span id="comp-total-items">0</span> tim</span>
                </div>
                <button class="pagination-btn" id="comp-next-btn">
                    Selanjutnya <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Load More Button (Alternative to pagination) -->
            <div class="load-more-container" id="load-more-container" style="display: none;">
                <button class="btn-load-more" id="load-more-btn">
                    <i class="fas fa-plus-circle"></i> Muat Lebih Banyak Tim
                </button>
                <p class="load-more-info">Menampilkan <span id="loaded-count">0</span> dari <span id="total-count">0</span> tim</p>
            </div>
        </div>
    </section>

    <footer id="footer" class="footer">
        <div class="footer">
            <!-- Website Statistics Section -->
            <div class="footer-stats">
                <div class="footer-stats-container">
                    <div class="stat-item-footer">
                        <div class="stat-icon-footer">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="stat-content-footer">
                            <div class="stat-number-footer visitor-count-number" data-target="0">0</div>
                            <div class="stat-label-footer">Total Kunjungan</div>
                        </div>
                    </div>
                    <div class="stat-item-footer">
                        <div class="stat-icon-footer">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content-footer">
                            <div class="stat-number-footer" data-target="<?php echo $totalOfficialMembers; ?>">0</div>
                            <div class="stat-label-footer">Anggota Resmi</div>
                        </div>
                    </div>
                    <div class="stat-item-footer">
                        <div class="stat-icon-footer">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content-footer">
                            <div class="stat-number-footer competition-count" data-target="0">0</div>
                            <div class="stat-label-footer">Tim Kompetisi</div>
                        </div>
                    </div>
                    <div class="stat-item-footer">
                        <div class="stat-icon-footer">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-content-footer">
                            <div class="stat-number-footer">2025</div>
                            <div class="stat-label-footer">Sejak Tahun</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer-content">
                <div class="footer-logo">
                    <img src="forbasi/assets/LOGO-FORBASI.png" alt="FORBASI Logo">
                    <p>Forum Baris Indonesia</p>
                </div>
                <div class="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="#hero">Beranda</a></li>
                        <li><a href="#what">Tentang</a></li>
                        <li><a href="#program">Program</a></li>
                        <li><a href="#lisensi">Lisensi</a></li>
                        <li><a href="#product">Produk</a></li>
                        <li><a href="#members">Anggota Resmi</a></li>
                        <li><a href="#competition">Kompetisi</a></li>
                    </ul>
                </div>
                <div class="footer-newsletter">
                    <h3>Newsletter</h3>
                    <p>Daftar untuk mendapatkan informasi terbaru dari FORBASI</p>
                    <form class="newsletter-form">
                        <input type="email" placeholder="Email Anda">
                        <button type="submit"><i class="fas fa-paper-plane"></i></button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 FORBASI. All Rights Reserved.</p>
                <div class="legal-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Version Update Popup -->
    <div id="version-update-popup" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;align-items:center;justify-content:center;">
        <div style="background:#fff;padding:30px 40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:400px;width:90%;text-align:center;animation:popIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55);">
            <div style="width:70px;height:70px;background:linear-gradient(135deg,#0d9500 0%,#0a7300 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <i class="fas fa-sync-alt" style="font-size:30px;color:#fff;"></i>
            </div>
            <h3 style="margin:0 0 10px 0;font-size:1.5em;color:#1d3557;font-weight:700;">Pembaruan Tersedia!</h3>
            <p style="margin:0 0 25px 0;color:#666;font-size:0.95em;line-height:1.5;">Versi terbaru FORBASI telah tersedia. Perbarui sekarang untuk mendapatkan fitur dan perbaikan terbaru.</p>
            <button onclick="hardRefresh()" style="background:linear-gradient(135deg,#0d9500 0%,#0a7300 100%);color:#fff;border:none;padding:14px 35px;border-radius:10px;font-weight:700;cursor:pointer;font-size:1em;box-shadow:0 5px 20px rgba(13,149,0,0.3);transition:all 0.3s;width:100%;">
                <i class="fas fa-download"></i> Perbarui Sekarang
            </button>
            <p style="margin-top:15px;font-size:0.8em;color:#999;">Versi saat ini: <span id="current-version">-</span> → <span id="new-version">-</span></p>
        </div>
    </div>
    
    <style>
        @keyframes popIn {
            0% { opacity:0; transform:scale(0.8); }
            60% { transform:scale(1.05); }
            100% { opacity:1; transform:scale(1); }
        }
        #version-update-popup button:hover { transform:translateY(-2px); box-shadow:0 8px 25px rgba(13,149,0,0.4); }
        #version-update-popup button:active { transform:translateY(0); }
    </style>

    <!-- Main Scripts - Deferred for better performance -->
    <script defer>
    // Counter Animation Function
    function animateCounter(element, target, duration = 2000) {
        // Clear any existing interval
        if (element.counterInterval) {
            clearInterval(element.counterInterval);
        }
        
        const start = 0;
        const increment = target / (duration / 16); // 60fps
        let current = start;
        
        element.counterInterval = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(element.counterInterval);
                element.counterInterval = null;
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Intersection Observer for Members Count Animation
    const observeCounterAnimation = () => {
        const countElement = document.querySelector('.count-number');
        const countContainer = document.querySelector('.members-count-container');
        
        if (!countElement || !countContainer) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class to container
                    countContainer.classList.add('visible');
                    
                    // Start counter animation after container is visible
                    setTimeout(() => {
                        // Animate members count
                        const target = parseInt(countElement.dataset.target);
                        animateCounter(countElement, target, 2000);
                    }, 300);
                } else {
                    // Reset when out of view (untuk repeat animation)
                    setTimeout(() => {
                        countElement.textContent = '0';
                        countContainer.classList.remove('visible');
                    }, 500);
                }
            });
        }, {
            threshold: 0.5, // Trigger when 50% of element is visible
            rootMargin: '0px'
        });
        
        observer.observe(countElement);
    };

    // Intersection Observer for Footer Stats Animation
    const observeFooterStatsAnimation = () => {
        const footerStats = document.querySelectorAll('.stat-number-footer');
        
        if (footerStats.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    const target = parseInt(entry.target.dataset.target);
                    if (!isNaN(target)) {
                        animateCounter(entry.target, target, 2000);
                    }
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px'
        });
        
        footerStats.forEach(stat => observer.observe(stat));
    };

    // Load and track visitor count
    async function loadVisitorCount() {
        try {
            const response = await fetch('forbasi/php/track_visitor.php');
            const data = await response.json();
            
            if (data.success) {
                const visitorCountElement = document.querySelector('.visitor-count-number');
                if (visitorCountElement) {
                    visitorCountElement.dataset.target = data.data.total_visits;
                }
            }
        } catch (error) {
            console.error('Error loading visitor count:', error);
        }
    }

    // Load competition team count for footer stats
    async function loadCompetitionCount() {
        try {
            const response = await fetch('forbasi/php/get_approved_teams.php');
            const data = await response.json();
            
            if (data.success) {
                const compCountElement = document.querySelector('.competition-count');
                if (compCountElement) {
                    compCountElement.dataset.target = data.data.total_teams || 0;
                }
            }
        } catch (error) {
            console.error('Error loading competition count:', error);
        }
    }

    // Optimized member pagination and search with dynamic card loading
    document.addEventListener('DOMContentLoaded', () => {
        // Load visitor count and competition count
        loadVisitorCount();
        loadCompetitionCount();
        
        // Initialize counter animation observers
        observeCounterAnimation();
        observeFooterStatsAnimation();
        
        const membersGrid = document.getElementById('membersGrid');
        let allMembersData = []; // Will store all member data
        
        // Get initial cards from PHP
        const initialCards = Array.from(document.querySelectorAll('.member-card'));
        
        // Load remaining members data if available
        if (window.remainingMembersData && window.remainingMembersData.length > 0) {
            // Create card elements for remaining members
            window.remainingMembersData.forEach((member, idx) => {
                const card = createMemberCard(member, initialCards.length + idx);
                membersGrid.appendChild(card);
            });
        }
        
        // Now get all cards (initial + dynamically created)
        const memberCards = Array.from(document.querySelectorAll('.member-card'));
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const currentPageSpan = document.getElementById('currentPage');
        const totalPagesSpan = document.getElementById('totalPages');
        const searchInput = document.getElementById('memberSearch');
        const clearSearchBtn = document.getElementById('clearSearch');
        const searchResultCount = document.getElementById('searchResultCount');
        
        let currentPage = 1;
        let cardsPerPage = 4; // Tampilkan hanya 4 anggota per halaman
        let filteredCards = [...memberCards];
        let totalPages = Math.ceil(filteredCards.length / cardsPerPage);

        // Function to create member card from data
        function createMemberCard(member, index) {
            const card = document.createElement('div');
            card.className = 'member-card';
            card.dataset.index = index;
            card.dataset.clubName = member.club_name.toLowerCase();
            card.dataset.coachName = member.coach_name.toLowerCase();
            card.dataset.managerName = member.manager_name.toLowerCase();
            card.dataset.address = member.club_address.toLowerCase();
            card.style.display = 'none';
            card.style.opacity = '0';
            
            const logoPath = member.logo_path && member.logo_path !== '' 
                ? window.logoBasePath + member.logo_path 
                : 'forbasi/assets/default-club-logo.png';
            
            const logoClass = member.logo_path && member.logo_path !== '' ? 'member-logo' : 'member-logo default-logo';
            
            card.innerHTML = `
                <div class="member-image-container">
                    <img src="${logoPath}"
                         alt="Logo ${member.club_name}"
                         class="${logoClass}"
                         loading="lazy"
                         width="120"
                         height="120"
                         onerror="this.onerror=null;this.src='forbasi/assets/default-club-logo.png';this.classList.add('default-logo');">
                </div>
                <div class="member-badge">ANGGOTA RESMI FORBASI</div>
                <h3>${member.club_name}</h3>
                <p><strong>Alamat:</strong> ${member.club_address}</p>
                <p><strong>Pelatih:</strong> ${member.coach_name}</p>
                <p><strong>Manajer:</strong> ${member.manager_name}</p>
            `;
            
            return card;
        }

        // Optimized card display with RAF and lazy loading
        const displayCards = (cardsToShow) => {
            // Hide all cards first
            memberCards.forEach(card => {
                card.style.display = 'none';
                card.style.opacity = '0';
            });
            
            // Show cards one by one with stagger animation
            cardsToShow.forEach((card, idx) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        card.style.cssText = 'display:flex;opacity:0;transform:translateY(30px) scale(0.95)';
                        
                        // Lazy load images inside the card
                        const img = card.querySelector('img[loading="lazy"]');
                        if (img && !img.complete) {
                            img.addEventListener('load', () => {
                                // Image loaded, continue animation
                            });
                        }
                        
                        // Animate in
                        requestAnimationFrame(() => {
                            card.style.cssText += ';transition:all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);opacity:1;transform:translateY(0) scale(1)';
                        });
                    }, idx * 150); // Stagger by 150ms for smoother appearance
                });
            });
        };

        const showPage = (page) => {
            const startIndex = (page - 1) * cardsPerPage;
            const cardsToShow = filteredCards.slice(startIndex, startIndex + cardsPerPage);
            displayCards(cardsToShow);
            if (currentPageSpan) currentPageSpan.textContent = page;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = page === totalPages || totalPages === 0;
            if (page > 1) document.getElementById('members')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        // Debounced search
        let searchTimeout;
        const performSearch = () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const term = searchInput.value.toLowerCase().trim();
                filteredCards = term === '' ? [...memberCards] : memberCards.filter(card => 
                    ['data-club-name', 'data-coach-name', 'data-manager-name', 'data-address']
                    .some(attr => (card.getAttribute(attr) || '').includes(term))
                );
                if (clearSearchBtn) clearSearchBtn.style.display = term === '' ? 'none' : 'flex';
                if (searchResultCount) {
                    searchResultCount.style.display = term === '' ? 'none' : 'block';
                    searchResultCount.textContent = `Ditemukan ${filteredCards.length} hasil dari ${memberCards.length} anggota`;
                }
                totalPages = Math.ceil(filteredCards.length / cardsPerPage);
                currentPage = 1;
                showPage(1);
            }, 300);
        };

        searchInput?.addEventListener('input', performSearch);
        searchInput?.addEventListener('keydown', (e) => e.key === 'Escape' && (searchInput.value = '', performSearch()));
        clearSearchBtn?.addEventListener('click', () => (searchInput.value = '', performSearch(), searchInput.focus()));
        prevBtn?.addEventListener('click', () => currentPage > 1 && showPage(--currentPage));
        nextBtn?.addEventListener('click', () => currentPage < totalPages && showPage(++currentPage));

        // Responsive resize handler - Keep it at 4 for all screen sizes
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Always use 4 cards per page
                const newCardsPerPage = 4;
                if (newCardsPerPage !== cardsPerPage) {
                    cardsPerPage = newCardsPerPage;
                    totalPages = Math.ceil(filteredCards.length / cardsPerPage);
                    currentPage = Math.min(currentPage, totalPages || 1);
                    showPage(currentPage);
                }
            }, 250);
        });

        // Initialize - show first page
        if (memberCards.length > 0) {
            showPage(1);
        }

        // Smooth navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Active section tracking
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                    });
                }
            });
        }, { threshold: 0.3 });
        sections.forEach(section => observer.observe(section));
    });
    </script>
    
    <!-- Version Checking & Service Worker Scripts -->
    <script defer>
    // Version Configuration
    const APP_VERSION = '1.0.1'; // Update this when deploying new version
    const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds
    
    // Version Checking System
    async function checkForUpdates() {
        try {
            // Fetch version from server with cache-busting
            const response = await fetch('forbasi/version.json?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            const serverVersion = data.version;
            const storedVersion = localStorage.getItem('forbasi_version') || APP_VERSION;
            
            // Compare versions
            if (serverVersion && serverVersion !== storedVersion) {
                showUpdatePopup(storedVersion, serverVersion);
            } else {
                // Store current version
                localStorage.setItem('forbasi_version', APP_VERSION);
            }
        } catch (error) {
            console.log('[Version Check] Error:', error);
        }
    }
    
    function showUpdatePopup(currentVer, newVer) {
        document.getElementById('current-version').textContent = currentVer;
        document.getElementById('new-version').textContent = newVer;
        document.getElementById('version-update-popup').style.display = 'flex';
    }
    
    function hardRefresh() {
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // Clear localStorage version to force re-check
        localStorage.removeItem('forbasi_version');
        
        // Unregister service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            });
        }
        
        // Hard refresh with cache clear
        location.reload(true);
    }
    
    // Check for updates on page load and periodically
    document.addEventListener('DOMContentLoaded', () => {
        // Initial check after 2 seconds
        setTimeout(checkForUpdates, 2000);
        
        // Periodic check
        setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
    });
    
    // Service Worker for caching (without install prompt)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('forbasi/service-worker.js')
                .then(reg => {
                    console.log('[SW] Service Worker registered');
                    
                    // Initialize push notifications
                    initializePushNotifications(reg);
                    
                    // Check for SW updates
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Show version update popup instead of confirm dialog
                                showUpdatePopup(APP_VERSION, 'Terbaru');
                            }
                        });
                    });
                })
                .catch(err => console.log('[SW] Service Worker registration failed:', err));
            navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
        });
    }
    
    // Push Notification Functions
    async function initializePushNotifications(registration) {
        try {
            // Check if push is supported
            if (!('PushManager' in window)) {
                console.log('[Push] Push notifications not supported');
                return;
            }
            
            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('[Push] Already subscribed');
                return;
            }
            
            // Ask for permission after 3 seconds (user-friendly timing)
            setTimeout(() => {
                requestNotificationPermission(registration);
            }, 3000);
            
        } catch (error) {
            console.error('[Push] Initialization error:', error);
        }
    }
    
    async function requestNotificationPermission(registration) {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('[Push] Notification permission granted');
                subscribeToPushNotifications(registration);
            } else if (permission === 'denied') {
                console.log('[Push] Notification permission denied');
            } else {
                console.log('[Push] Notification permission dismissed');
            }
        } catch (error) {
            console.error('[Push] Permission request error:', error);
        }
    }
    
    async function subscribeToPushNotifications(registration) {
        try {
            // Get VAPID public key from server
            const keyResponse = await fetch('forbasi/php/get_vapid_key.php');
            const keyData = await keyResponse.json();
            
            if (!keyData.success) {
                console.error('[Push] Failed to get VAPID key:', keyData.error);
                return;
            }
            
            // Convert VAPID key to Uint8Array
            const vapidPublicKey = urlBase64ToUint8Array(keyData.publicKey);
            
            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidPublicKey
            });
            
            console.log('[Push] Subscribed successfully');
            
            // Send subscription to server
            await saveSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('[Push] Subscription error:', error);
        }
    }
    
    async function saveSubscriptionToServer(subscription) {
        try {
            const response = await fetch('forbasi/php/subscribe_push.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                        auth: arrayBufferToBase64(subscription.getKey('auth'))
                    },
                    userType: 'guest' // Can be changed based on user role
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('[Push] Subscription saved to server');
                
                // Show welcome notification
                showLocalNotification();
            } else {
                console.error('[Push] Failed to save subscription:', data.error);
            }
        } catch (error) {
            console.error('[Push] Save subscription error:', error);
        }
    }
    
    // Helper function to convert VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    // Helper function to convert ArrayBuffer to Base64
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    
    // Show local welcome notification
    function showLocalNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('👋 Selamat Datang di FORBASI!', {
                body: 'Terima kasih telah mengaktifkan notifikasi. Anda akan menerima update terbaru tentang KTA dan kompetisi!',
                icon: 'forbasi/assets/icon-192x192.png',
                badge: 'forbasi/assets/icon-72x72.png',
                tag: 'welcome-notification',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });
        }
    }
    </script>
    
    <!-- Competition Teams Script -->
    <script defer>
    let allTeams = [], currentCategory = 'all', currentLevel = 'all', searchTerm = '';
    let currentPage = 1, teamsPerPage = 12; // Show 12 teams per page
    let loadedTeams = 12; // For "Load More" functionality
    const usePagination = true; // Toggle between pagination (true) or load more (false)

    async function loadCompetitionTeams() {
        try {
            const response = await fetch('forbasi/php/get_approved_teams.php');
            const data = await response.json();
            if (data.success) {
                allTeams = data.data.teams;
                updateStatistics(data.data);
                displayTeamsWithPagination(getFilteredTeams());
            } else showEmptyState('Gagal memuat data tim');
        } catch (error) {
            console.error('Error loading teams:', error);
            showEmptyState('Terjadi kesalahan saat memuat data');
        }
    }

    // Get filtered teams based on category, level, and search
    function getFilteredTeams() {
        let filtered = allTeams;
        
        // Filter by category
        if (currentCategory !== 'all') {
            filtered = filtered.filter(team => team.category_name === currentCategory);
        }
        
        // Filter by level
        if (currentLevel !== 'all') {
            filtered = filtered.filter(team => team.level === currentLevel);
        }
        
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(team => 
                team.club_name.toLowerCase().includes(term) ||
                team.province_name.toLowerCase().includes(term) ||
                team.pengda_name.toLowerCase().includes(term)
            );
        }
        
        // Update search result info
        updateSearchResultInfo(filtered.length);
        
        return filtered;
    }

    function updateSearchResultInfo(count) {
        const resultDiv = document.getElementById('compSearchResult');
        if (searchTerm || currentLevel !== 'all') {
            resultDiv.style.display = 'block';
            let text = `Menampilkan ${count} tim`;
            if (searchTerm) text += ` untuk pencarian "${searchTerm}"`;
            if (currentLevel !== 'all') text += ` tingkat ${currentLevel}`;
            if (currentCategory !== 'all') {
                const catNames = { rukibra: 'Rukibra', baris_berbaris: 'Baris Berbaris', varfor_musik: 'Varfor Musik' };
                text += ` kategori ${catNames[currentCategory]}`;
            }
            resultDiv.textContent = text;
        } else {
            resultDiv.style.display = 'none';
        }
    }

    function updateStatistics(data) {
        const stats = data.statistics || {};
        document.getElementById('total-teams').textContent = data.total_teams || 0;
        document.getElementById('rukibra-teams').textContent = stats.rukibra?.total_teams || 0;
        document.getElementById('baris-teams').textContent = stats.baris_berbaris?.total_teams || 0;
        document.getElementById('varfor-teams').textContent = stats.varfor_musik?.total_teams || 0;
        animateNumbers();
    }

    function animateNumbers() {
        document.querySelectorAll('.stat-content h3').forEach(num => {
            const target = parseInt(num.textContent), increment = target / 30;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    num.textContent = target;
                    clearInterval(timer);
                } else num.textContent = Math.floor(current);
            }, 50);
        });
    }

    function displayTeamsWithPagination(teams) {
        const grid = document.getElementById('teams-grid');
        const pagination = document.getElementById('competition-pagination');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (!teams || teams.length === 0) {
            pagination.style.display = 'none';
            loadMoreContainer.style.display = 'none';
            return showEmptyState('Belum ada tim yang disetujui');
        }

        // Calculate pagination
        const totalPages = Math.ceil(teams.length / teamsPerPage);
        const startIndex = (currentPage - 1) * teamsPerPage;
        const endIndex = startIndex + teamsPerPage;
        const teamsToShow = teams.slice(startIndex, endIndex);

        // Clear grid
        grid.innerHTML = '';

        // Display teams with stagger animation
        teamsToShow.forEach((team, idx) => {
            setTimeout(() => {
                const card = createTeamCard(team, idx);
                grid.appendChild(card);
                
                // Intersection Observer for scroll animations
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(card);
            }, idx * 50); // Stagger by 50ms
        });

        // Show/hide pagination or load more
        if (usePagination) {
            pagination.style.display = 'flex';
            loadMoreContainer.style.display = 'none';
            updatePaginationControls(currentPage, totalPages, teams.length, teamsToShow.length);
        } else {
            pagination.style.display = 'none';
            loadMoreContainer.style.display = loadedTeams < teams.length ? 'block' : 'none';
            updateLoadMoreInfo(loadedTeams, teams.length);
        }

        // Smooth scroll to competition section if not on first page
        if (currentPage > 1) {
            document.getElementById('competition')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updatePaginationControls(page, totalPages, totalItems, showingItems) {
        document.getElementById('comp-current-page').textContent = page;
        document.getElementById('comp-total-pages').textContent = totalPages;
        document.getElementById('comp-total-items').textContent = totalItems;
        document.getElementById('comp-showing').textContent = showingItems;

        const prevBtn = document.getElementById('comp-prev-btn');
        const nextBtn = document.getElementById('comp-next-btn');
        
        prevBtn.disabled = page === 1;
        nextBtn.disabled = page === totalPages;
    }

    function updateLoadMoreInfo(loaded, total) {
        document.getElementById('loaded-count').textContent = loaded;
        document.getElementById('total-count').textContent = total;
    }

    function displayTeamsLoadMore(teams) {
        const grid = document.getElementById('teams-grid');
        const teamsToShow = teams.slice(0, loadedTeams);
        
        grid.innerHTML = '';
        teamsToShow.forEach((team, idx) => {
            const card = createTeamCard(team, idx);
            grid.appendChild(card);
        });

        const loadMoreContainer = document.getElementById('load-more-container');
        loadMoreContainer.style.display = loadedTeams < teams.length ? 'block' : 'none';
        updateLoadMoreInfo(loadedTeams, teams.length);
    }

    function createTeamCard(team, index) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        card.dataset.category = team.category_name;
        
        const logoUrl = team.logo_path ? `forbasi/php/uploads/${team.logo_path}` : 'forbasi/assets/LOGO-FORBASI.png';
        const categoryNames = { rukibra: 'Rukibra', baris_berbaris: 'Baris Berbaris', varfor_musik: 'Varfor Musik' };
        // Icon yang lebih sesuai untuk kategori paskibraka
        const categoryIcons = { 
            rukibra: 'fa-flag', // Bendera untuk regu kibar bendera
            baris_berbaris: 'fa-person-military-rifle', // Militer untuk baris berbaris
            varfor_musik: 'fa-drum' // Drum untuk variasi formasi musik
        };
        const categoryDisplay = categoryNames[team.category_name] || team.category_name;
        const categoryIcon = categoryIcons[team.category_name] || 'fa-trophy';

        card.innerHTML = `
            <div class="team-card-header">
                <div class="team-logo">
                    <img src="${logoUrl}" alt="${team.club_name}" loading="lazy" width="120" height="120" onerror="this.src='forbasi/assets/LOGO-FORBASI.png'">
                </div>
            </div>
            <div class="team-card-body">
                <h3 class="team-name">${team.club_name}</h3>
                <div class="team-info">
                    <div class="info-row">
                        <i class="fas fa-layer-group"></i>
                        <span class="category-badge category-${team.category_name}">
                            <i class="fas ${categoryIcon}"></i> ${categoryDisplay}
                        </span>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-graduation-cap"></i>
                        <span class="info-label">Tingkat:</span>
                        <span class="level-badge">${team.level}</span>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="info-label">Provinsi:</span>
                        <span>${team.province_name}</span>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-building"></i>
                        <span class="info-label">Pengda:</span>
                        <span>${team.pengda_name}</span>
                    </div>
                </div>
            </div>
            <div class="team-footer">
                <div class="team-stats">
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <strong>${team.total_members}</strong> Anggota
                    </div>
                </div>
                <div class="approval-badge">
                    <i class="fas fa-check-circle"></i> Disetujui
                </div>
            </div>
        `;
        return card;
    }

    function filterTeams(category) {
        currentCategory = category;
        currentPage = 1; // Reset to first page
        loadedTeams = teamsPerPage; // Reset loaded teams
        
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.filter-btn').classList.add('active');
        
        const filteredTeams = getFilteredTeams(); // Use multi-criteria filter
        
        // Fade out animation
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, idx) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
            }, idx * 20);
        });

        // Display filtered teams after animation
        setTimeout(() => {
            displayTeamsWithPagination(filteredTeams);
            updateSearchResultInfo(filteredTeams.length);
        }, cards.length * 20 + 300);
    }

    // Debounce function untuk search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Handle search input
    const handleSearch = debounce(() => {
        searchTerm = document.getElementById('competitionSearch').value.trim();
        currentPage = 1;
        loadedTeams = teamsPerPage;
        
        const filteredTeams = getFilteredTeams();
        
        // Fade out animation
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, idx) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
            }, idx * 20);
        });

        // Display filtered teams after animation
        setTimeout(() => {
            displayTeamsWithPagination(filteredTeams);
            updateSearchResultInfo(filteredTeams.length);
        }, cards.length * 20 + 300);
    }, 300);

    // Handle level filter change
    function handleLevelFilter() {
        currentLevel = document.getElementById('levelFilter').value;
        currentPage = 1;
        loadedTeams = teamsPerPage;
        
        const filteredTeams = getFilteredTeams();
        
        // Fade out animation
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, idx) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
            }, idx * 20);
        });

        // Display filtered teams after animation
        setTimeout(() => {
            displayTeamsWithPagination(filteredTeams);
            updateSearchResultInfo(filteredTeams.length);
        }, cards.length * 20 + 300);
    }

    // Clear search
    function clearSearch() {
        document.getElementById('competitionSearch').value = '';
        searchTerm = '';
        currentPage = 1;
        loadedTeams = teamsPerPage;
        
        const filteredTeams = getFilteredTeams();
        
        // Fade out animation
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, idx) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
            }, idx * 20);
        });

        // Display filtered teams after animation
        setTimeout(() => {
            displayTeamsWithPagination(filteredTeams);
            updateSearchResultInfo(filteredTeams.length);
        }, cards.length * 20 + 300);
    }

    function showEmptyState(message) {
        document.getElementById('teams-grid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Tidak Ada Data</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Pagination navigation
    function goToPage(page) {
        currentPage = page;
        const filteredTeams = getFilteredTeams(); // Use multi-criteria filter
        displayTeamsWithPagination(filteredTeams);
    }

    // Load more functionality
    function loadMoreTeams() {
        loadedTeams += teamsPerPage;
        const filteredTeams = getFilteredTeams(); // Use multi-criteria filter
        displayTeamsLoadMore(filteredTeams);
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => filterTeams(btn.dataset.category));
        });

        // Search input event listener
        const searchInput = document.getElementById('competitionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            searchInput.addEventListener('keyup', (e) => {
                // Show/hide clear button
                const clearBtn = document.getElementById('clearCompSearch');
                if (clearBtn) {
                    clearBtn.style.opacity = e.target.value ? '1' : '0';
                    clearBtn.style.pointerEvents = e.target.value ? 'auto' : 'none';
                }
            });
        }

        // Level filter dropdown event listener
        const levelFilter = document.getElementById('levelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', handleLevelFilter);
        }

        // Clear search button event listener
        const clearSearchBtn = document.getElementById('clearCompSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', clearSearch);
        }

        // Pagination buttons
        document.getElementById('comp-prev-btn')?.addEventListener('click', () => {
            if (currentPage > 1) goToPage(currentPage - 1);
        });

        document.getElementById('comp-next-btn')?.addEventListener('click', () => {
            const filteredTeams = getFilteredTeams(); // Use multi-criteria filter
            const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
            if (currentPage < totalPages) goToPage(currentPage + 1);
        });

        // Load more button
        document.getElementById('load-more-btn')?.addEventListener('click', loadMoreTeams);

        // Initial load
        loadCompetitionTeams();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 1) {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight') {
                const filteredTeams = getFilteredTeams(); // Use multi-criteria filter
                const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
                if (currentPage < totalPages) goToPage(currentPage + 1);
            }
        });
    });
    </script>
</body>
</html>
