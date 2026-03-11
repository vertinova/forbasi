<?php
// forbasi/index.php

// Sertakan file konfigurasi database
include_once 'forbasi/php/db_config.php';

// Inisialisasi array untuk menyimpan data anggota
$officialMembers = [];

// Base path untuk logo (relatif dari index.php)
$logoBasePath = 'forbasi/php/uploads/';

// --- Bagian Koneksi dan Pengambilan Data dari Database ---
if ($conn->connect_error) {
    error_log("Koneksi database gagal di index.php: " . $conn->connect_error);
} else {
    try {
        // Query untuk mengambil semua data klub dengan status 'kta_issued'
        // Diurutkan berdasarkan kta_issued_at DESC untuk mendapatkan yang terbaru
        $stmt = $conn->prepare("SELECT club_name, club_address, coach_name, manager_name, logo_path FROM kta_applications WHERE status = ? ORDER BY kta_issued_at DESC");
        $status = 'kta_issued';
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Forum Baris Indonesia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="style.css">
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
                <a href="#product" class="nav-link" data-title="Produk"><i class="fas fa-tshirt"></i></a>
                <a href="#members" class="nav-link" data-title="Anggota"><i class="fas fa-users"></i></a>
                <a href="#contact" class="nav-link" data-title="Kontak"><i class="fas fa-envelope"></i></a>
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
            <video autoplay loop muted playsinline>
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
                <div class="program-card">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/3050/3050541.png" alt="Kompetisi">
                    </div>
                    <h3>Komite Kompetisi</h3>
                    <p>Menyelenggarakan berbagai kompetisi baris-berbaris dari tingkat daerah hingga nasional untuk mengembangkan bakat dan prestasi.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/1570/1570887.png" alt="Keanggotaan">
                    </div>
                    <h3>Komite Keanggotaan</h3>
                    <p>Mengelola keanggotaan FORBASI di seluruh Indonesia dan membangun jaringan antar anggota.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/2936/2936886.png" alt="Pelatihan">
                    </div>
                    <h3>Komite Kepelatihan</h3>
                    <p>Menyelenggarakan pelatihan dan pembinaan untuk meningkatkan kualitas pelatih baris-berbaris.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/3176/3176272.png" alt="Sertifikasi">
                    </div>
                    <h3>Sertifikasi Juri & Pelatih</h3>
                    <p>Melaksanakan program sertifikasi untuk menjamin kualitas juri dan pelatih baris-berbaris.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="Anggota">
                    </div>
                    <h3>Daftar Anggota</h3>
                    <p>Lihat daftar lengkap anggota FORBASI dari seluruh Indonesia dan bergabung dengan komunitas kami.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="program-card highlight">
                    <div class="program-icon">
                        <img src="https://cdn-icons-png.flaticon.com/512/2989/2989988.png" alt="Semua Program">
                    </div>
                    <h3>Semua Program</h3>
                    <p>Temukan lebih banyak program menarik dari FORBASI untuk pengembangan baris-berbaris di Indonesia.</p>
                    <a href="#" class="program-link">Selengkapnya <i class="fas fa-arrow-right"></i></a>
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
                <div class="product-card">
                    <div class="product-image">
                        <img src="forbasi/assets/kemeja.png" alt="Kemeja Forbasi">
                    </div>
                    <div class="product-info">
                        <h3>Kemeja Forbasi</h3>
                        <div class="price">Rp 150.000</div>
                        <a href="#" class="buy-button">Beli Sekarang</a>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <img src="forbasi/assets/jersey.png" alt="Jersey Forbasi">
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
            <div class="members-grid">
                <?php if (!empty($officialMembers)): ?>
                    <?php
                    $initialCount = 3; // Jumlah anggota yang ditampilkan di awal
                    $memberCount = count($officialMembers);

                    foreach ($officialMembers as $index => $member):
                        $isVisible = ($index < $initialCount) ? '' : ' hidden-member'; // Sembunyikan jika lebih dari 3
                    ?>
                        <div class="member-card animate__animated animate__fadeInUp<?php echo $isVisible; ?>" data-index="<?php echo $index; ?>">
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
                                         onerror="this.onerror=null;this.src='forbasi/assets/default-club-logo.png';this.classList.add('default-logo');"
                                    >
                                <?php else: ?>
                                    <img src="forbasi/assets/default-club-logo.png" alt="Logo Default" class="member-logo default-logo">
                                <?php endif; ?>
                            </div>
                            <div class="member-badge">ANGGOTA RESMI FORBASI</div>
                            <h3><?php echo htmlspecialchars($member['club_name']); ?></h3>
                            <p><strong>Alamat:</strong> <?php echo htmlspecialchars($member['club_address']); ?></p>
                            <p><strong>Pelatih:</strong> <?php echo htmlspecialchars($member['coach_name']); ?></p>
                            <p><strong>Manajer:</strong> <?php echo htmlspecialchars($member['manager_name']); ?></p>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="no-members-message animate__animated animate__fadeIn">Belum ada anggota resmi yang terdaftar saat ini.</p>
                <?php endif; ?>
            </div>

            <?php if (!empty($officialMembers) && count($officialMembers) > $initialCount): ?>
            <div class="view-more-container">
                <button id="viewMoreMembersBtn" class="btn btn-primary">Lihat Semua Anggota Resmi <i class="fas fa-arrow-down"></i></button>
            </div>
            <?php endif; ?>

        </div>
    </section>

    <section id="contact" class="contact-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Hubungi Kami</h2>
                <div class="divider"></div>
            </div>
            <div class="contact-content">
                <div class="contact-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <p>Jl. Olahraga No. 123, Jakarta Pusat, Indonesia</p>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone-alt"></i>
                        <p>+62 21 1234 5678</p>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-envelope"></i>
                        <p>info@forbasi.org</p>
                    </div>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <form class="contact-form">
                    <div class="form-group">
                        <input type="text" placeholder="Nama Anda" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email Anda" required>
                    </div>
                    <div class="form-group">
                        <input type="text" placeholder="Subjek" required>
                    </div>
                    <div class="form-group">
                        <textarea placeholder="Pesan Anda" required></textarea>
                    </div>
                    <button type="submit" class="submit-button">Kirim Pesan</button>
                </form>
            </div>
        </div>
    </section>

    <footer id="footer" class="footer">
        <div class="footer">
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
                        <li><a href="#product">Produk</a></li>
                        <li><a href="#members">Anggota Resmi</a></li>
                        <li><a href="#contact">Kontak</a></li>
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

    <script>
        // JavaScript untuk animasi "Lihat Semua Anggota Resmi"
        document.addEventListener('DOMContentLoaded', function() {
            const viewMoreBtn = document.getElementById('viewMoreMembersBtn');
            const hiddenMembers = document.querySelectorAll('.member-card.hidden-member');
            const initialMembersCount = 3; // Harus sesuai dengan $initialCount di PHP

            if (viewMoreBtn) {
                viewMoreBtn.addEventListener('click', function() {
                    let delay = 0;
                    hiddenMembers.forEach((member, index) => {
                        setTimeout(() => {
                            member.classList.remove('hidden-member');
                            member.classList.add('animate__fadeInUp'); // Re-apply animation for newly visible cards
                        }, delay);
                        delay += 100; // Delay each card by 100ms for staggered effect
                    });
                    viewMoreBtn.style.display = 'none'; // Sembunyikan tombol setelah semua ditampilkan
                });
            }

            // Fungsi untuk mengamati ketika section 'members' masuk viewport
            // dan memulai animasi untuk 3 kartu pertama
            const membersSection = document.getElementById('members');
            if (membersSection) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const initialVisibleMembers = document.querySelectorAll('.members-grid .member-card:not(.hidden-member)');
                            initialVisibleMembers.forEach((card, index) => {
                                // Pastikan animate__fadeInUp hanya diterapkan sekali atau saat masuk viewport
                                card.classList.add('animate__animated', 'animate__fadeInUp');
                                card.style.animationDelay = `${index * 0.15}s`; // Stagger initial animation
                            });
                            observer.disconnect(); // Stop observing once initial animation is done
                        }
                    });
                }, { threshold: 0.1 }); // Trigger when 10% of the section is visible

                observer.observe(membersSection);
            }
        });
    </script>
</body>
</html>
