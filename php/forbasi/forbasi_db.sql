-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 06, 2025 at 01:09 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `forbasi_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `self_idx` varchar(50) NOT NULL,
  `activity_type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `application_id` int(11) DEFAULT NULL COMMENT 'ID pengajuan KTA jika aktivitas terkait pengajuan',
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by_pergetA_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`id`, `user_id`, `user_role`, `self_idx`, `activity_type`, `description`, `application_id`, `old_status`, `new_status`, `created_at`, `approved_by_pergetA_id`) VALUES
(1, 121, '', '', 'Update KTA Application Status', 'Memperbarui status pengajuan KTA ID 10 dari \'pending\' menjadi \'approved_pengcab\'. Catatan: ', 10, '0', 'approved_pengcab', '2025-06-06 07:32:31', NULL),
(2, 10, 'Pengurus Daerah', '', 'Update KTA Application Status', 'Memperbarui status pengajuan KTA ID 10 dari \'approved_pengcab\' menjadi \'approved_pengda\'. Catatan: ', 10, 'approved_pengcab', 'approved_pengda', '2025-06-06 07:33:26', NULL),
(3, 121, '', '', 'Update KTA Application Status', 'Memperbarui status pengajuan KTA ID 11 dari \'pending\' menjadi \'approved_pengcab\'. Catatan: ', 11, '0', 'approved_pengcab', '2025-06-06 07:38:23', NULL),
(4, 10, 'Pengurus Daerah', '', 'Update KTA Application Status', 'Memperbarui status pengajuan KTA ID 11 dari \'approved_pengcab\' menjadi \'approved_pengda\'. Catatan: ', 11, 'approved_pengcab', 'approved_pengda', '2025-06-06 07:41:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `level` varchar(50) DEFAULT NULL COMMENT 'Pengcab, Pengda, PB',
  `region` varchar(100) DEFAULT NULL COMMENT 'Wilayah administrasi',
  `phone` varchar(20) DEFAULT NULL,
  `additional_info` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` int(11) NOT NULL,
  `province_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `province_id`, `name`) VALUES
(1, 1, 'Kabupaten Aceh Barat'),
(2, 1, 'Kabupaten Aceh Barat Daya'),
(3, 1, 'Kabupaten Aceh Besar'),
(4, 1, 'Kabupaten Aceh Jaya'),
(5, 1, 'Kabupaten Aceh Selatan'),
(6, 1, 'Kabupaten Aceh Singkil'),
(7, 1, 'Kabupaten Aceh Tamiang'),
(8, 1, 'Kabupaten Aceh Tengah'),
(9, 1, 'Kabupaten Aceh Tenggara'),
(10, 1, 'Kabupaten Aceh Timur'),
(11, 1, 'Kabupaten Aceh Utara'),
(12, 1, 'Kabupaten Bener Meriah'),
(13, 1, 'Kabupaten Bireuen'),
(14, 1, 'Kabupaten Gayo Lues'),
(15, 1, 'Kabupaten Nagan Raya'),
(16, 1, 'Kabupaten Pidie'),
(17, 1, 'Kabupaten Pidie Jaya'),
(18, 1, 'Kabupaten Simeulue'),
(19, 1, 'Kota Banda Aceh'),
(20, 1, 'Kota Langsa'),
(21, 1, 'Kota Lhokseumawe'),
(22, 1, 'Kota Sabang'),
(23, 1, 'Kota Subulussalam'),
(24, 2, 'Kabupaten Asahan'),
(25, 2, 'Kabupaten Batubara'),
(26, 2, 'Kabupaten Dairi'),
(27, 2, 'Kabupaten Deli Serdang'),
(28, 2, 'Kabupaten Humbang Hasundutan'),
(29, 2, 'Kabupaten Karo'),
(30, 2, 'Kabupaten Labuhanbatu'),
(31, 2, 'Kabupaten Labuhanbatu Selatan'),
(32, 2, 'Kabupaten Labuhanbatu Utara'),
(33, 2, 'Kabupaten Langkat'),
(34, 2, 'Kabupaten Mandailing Natal'),
(35, 2, 'Kabupaten Nias'),
(36, 2, 'Kabupaten Nias Barat'),
(37, 2, 'Kabupaten Nias Selatan'),
(38, 2, 'Kabupaten Nias Utara'),
(39, 2, 'Kabupaten Padang Lawas'),
(40, 2, 'Kabupaten Padang Lawas Utara'),
(41, 2, 'Kabupaten Pakpak Bharat'),
(42, 2, 'Kabupaten Samosir'),
(43, 2, 'Kabupaten Serdang Bedagai'),
(44, 2, 'Kabupaten Simalungun'),
(45, 2, 'Kabupaten Tapanuli Selatan'),
(46, 2, 'Kabupaten Tapanuli Tengah'),
(47, 2, 'Kabupaten Tapanuli Utara'),
(48, 2, 'Kabupaten Toba'),
(49, 2, 'Kota Binjai'),
(50, 2, 'Kota Gunungsitoli'),
(51, 2, 'Kota Medan'),
(52, 2, 'Kota Padangsidimpuan'),
(53, 2, 'Kota Pematangsiantar'),
(54, 2, 'Kota Sibolga'),
(55, 2, 'Kota Tanjungbalai'),
(56, 2, 'Kota Tebing Tinggi'),
(57, 3, 'Kabupaten Agam'),
(58, 3, 'Kabupaten Dharmasraya'),
(59, 3, 'Kabupaten Kepulauan Mentawai'),
(60, 3, 'Kabupaten Lima Puluh Kota'),
(61, 3, 'Kabupaten Padang Pariaman'),
(62, 3, 'Kabupaten Pasaman'),
(63, 3, 'Kabupaten Pasaman Barat'),
(64, 3, 'Kabupaten Pesisir Selatan'),
(65, 3, 'Kabupaten Sijunjung'),
(66, 3, 'Kabupaten Solok'),
(67, 3, 'Kabupaten Solok Selatan'),
(68, 3, 'Kabupaten Tanah Datar'),
(69, 3, 'Kota Bukittinggi'),
(70, 3, 'Kota Padang'),
(71, 3, 'Kota Padangpanjang'),
(72, 3, 'Kota Pariaman'),
(73, 3, 'Kota Payakumbuh'),
(74, 3, 'Kota Sawahlunto'),
(75, 3, 'Kota Solok'),
(76, 4, 'Kabupaten Bengkalis'),
(77, 4, 'Kabupaten Indragiri Hilir'),
(78, 4, 'Kabupaten Indragiri Hulu'),
(79, 4, 'Kabupaten Kampar'),
(85, 4, 'Kabupaten Kepulauan Meranti'),
(80, 4, 'Kabupaten Kuantan Singingi'),
(81, 4, 'Kabupaten Pelalawan'),
(82, 4, 'Kabupaten Rokan Hilir'),
(83, 4, 'Kabupaten Rokan Hulu'),
(84, 4, 'Kabupaten Siak'),
(86, 4, 'Kota Dumai'),
(87, 4, 'Kota Pekanbaru'),
(88, 5, 'Kabupaten Batanghari'),
(89, 5, 'Kabupaten Bungo'),
(90, 5, 'Kabupaten Kerinci'),
(91, 5, 'Kabupaten Merangin'),
(92, 5, 'Kabupaten Muaro Jambi'),
(93, 5, 'Kabupaten Sarolangun'),
(94, 5, 'Kabupaten Tanjung Jabung Barat'),
(95, 5, 'Kabupaten Tanjung Jabung Timur'),
(96, 5, 'Kabupaten Tebo'),
(97, 5, 'Kota Jambi'),
(98, 5, 'Kota Sungai Penuh'),
(99, 6, 'Kabupaten Banyuasin'),
(100, 6, 'Kabupaten Empat Lawang'),
(101, 6, 'Kabupaten Lahat'),
(102, 6, 'Kabupaten Muara Enim'),
(103, 6, 'Kabupaten Musi Banyuasin'),
(104, 6, 'Kabupaten Musi Rawas'),
(105, 6, 'Kabupaten Musi Rawas Utara'),
(106, 6, 'Kabupaten Ogan Ilir'),
(107, 6, 'Kabupaten Ogan Komering Ilir'),
(108, 6, 'Kabupaten Ogan Komering Ulu'),
(109, 6, 'Kabupaten Ogan Komering Ulu Selatan'),
(110, 6, 'Kabupaten Ogan Komering Ulu Timur'),
(111, 6, 'Kabupaten Penukal Abab Lematang Ilir'),
(112, 6, 'Kota Lubuklinggau'),
(113, 6, 'Kota Pagar Alam'),
(114, 6, 'Kota Palembang'),
(115, 6, 'Kota Prabumulih'),
(116, 7, 'Kabupaten Bengkulu Selatan'),
(117, 7, 'Kabupaten Bengkulu Tengah'),
(118, 7, 'Kabupaten Bengkulu Utara'),
(119, 7, 'Kabupaten Kaur'),
(120, 7, 'Kabupaten Kepahiang'),
(121, 7, 'Kabupaten Lebong'),
(122, 7, 'Kabupaten Mukomuko'),
(123, 7, 'Kabupaten Rejang Lebong'),
(124, 7, 'Kabupaten Seluma'),
(125, 7, 'Kota Bengkulu'),
(126, 8, 'Kabupaten Lampung Barat'),
(127, 8, 'Kabupaten Lampung Selatan'),
(128, 8, 'Kabupaten Lampung Tengah'),
(129, 8, 'Kabupaten Lampung Timur'),
(130, 8, 'Kabupaten Lampung Utara'),
(131, 8, 'Kabupaten Mesuji'),
(132, 8, 'Kabupaten Pesawaran'),
(133, 8, 'Kabupaten Pesisir Barat'),
(134, 8, 'Kabupaten Pringsewu'),
(135, 8, 'Kabupaten Tanggamus'),
(136, 8, 'Kabupaten Tulang Bawang'),
(137, 8, 'Kabupaten Tulang Bawang Barat'),
(138, 8, 'Kabupaten Way Kanan'),
(139, 8, 'Kota Bandar Lampung'),
(140, 8, 'Kota Metro'),
(141, 9, 'Kabupaten Bangka'),
(142, 9, 'Kabupaten Bangka Barat'),
(143, 9, 'Kabupaten Bangka Selatan'),
(144, 9, 'Kabupaten Bangka Tengah'),
(145, 9, 'Kabupaten Belitung'),
(146, 9, 'Kabupaten Belitung Timur'),
(147, 9, 'Kota Pangkal Pinang'),
(148, 10, 'Kabupaten Bintan'),
(149, 10, 'Kabupaten Karimun'),
(150, 10, 'Kabupaten Kepulauan Anambas'),
(151, 10, 'Kabupaten Lingga'),
(152, 10, 'Kabupaten Natuna'),
(153, 10, 'Kota Batam'),
(154, 10, 'Kota Tanjungpinang'),
(160, 11, 'Kabupaten Kepulauan Seribu'),
(156, 11, 'Kota Jakarta Barat'),
(155, 11, 'Kota Jakarta Pusat'),
(157, 11, 'Kota Jakarta Selatan'),
(158, 11, 'Kota Jakarta Timur'),
(159, 11, 'Kota Jakarta Utara'),
(161, 12, 'Kabupaten Bandung'),
(162, 12, 'Kabupaten Bandung Barat'),
(163, 12, 'Kabupaten Bekasi'),
(164, 12, 'Kabupaten Bogor'),
(165, 12, 'Kabupaten Ciamis'),
(166, 12, 'Kabupaten Cianjur'),
(167, 12, 'Kabupaten Cirebon'),
(168, 12, 'Kabupaten Garut'),
(169, 12, 'Kabupaten Indramayu'),
(170, 12, 'Kabupaten Karawang'),
(171, 12, 'Kabupaten Kuningan'),
(172, 12, 'Kabupaten Majalengka'),
(173, 12, 'Kabupaten Pangandaran'),
(174, 12, 'Kabupaten Purwakarta'),
(175, 12, 'Kabupaten Subang'),
(176, 12, 'Kabupaten Sukabumi'),
(177, 12, 'Kabupaten Sumedang'),
(178, 12, 'Kabupaten Tasikmalaya'),
(179, 12, 'Kota Bandung'),
(180, 12, 'Kota Banjar'),
(181, 12, 'Kota Bekasi'),
(182, 12, 'Kota Bogor'),
(183, 12, 'Kota Cimahi'),
(184, 12, 'Kota Cirebon'),
(185, 12, 'Kota Depok'),
(186, 12, 'Kota Sukabumi'),
(187, 12, 'Kota Tasikmalaya'),
(188, 13, 'Kabupaten Banjarnegara'),
(189, 13, 'Kabupaten Banyumas'),
(190, 13, 'Kabupaten Batang'),
(191, 13, 'Kabupaten Blora'),
(192, 13, 'Kabupaten Boyolali'),
(193, 13, 'Kabupaten Brebes'),
(194, 13, 'Kabupaten Cilacap'),
(195, 13, 'Kabupaten Demak'),
(196, 13, 'Kabupaten Grobogan'),
(197, 13, 'Kabupaten Jepara'),
(198, 13, 'Kabupaten Karanganyar'),
(199, 13, 'Kabupaten Kebumen'),
(200, 13, 'Kabupaten Kendal'),
(201, 13, 'Kabupaten Klaten'),
(202, 13, 'Kabupaten Kudus'),
(203, 13, 'Kabupaten Magelang'),
(204, 13, 'Kabupaten Pati'),
(205, 13, 'Kabupaten Pekalongan'),
(206, 13, 'Kabupaten Pemalang'),
(207, 13, 'Kabupaten Purbalingga'),
(208, 13, 'Kabupaten Purworejo'),
(209, 13, 'Kabupaten Rembang'),
(210, 13, 'Kabupaten Semarang'),
(211, 13, 'Kabupaten Sragen'),
(212, 13, 'Kabupaten Sukoharjo'),
(213, 13, 'Kabupaten Tegal'),
(214, 13, 'Kabupaten Temanggung'),
(215, 13, 'Kabupaten Wonogiri'),
(216, 13, 'Kabupaten Wonosobo'),
(217, 13, 'Kota Magelang'),
(218, 13, 'Kota Pekalongan'),
(219, 13, 'Kota Salatiga'),
(220, 13, 'Kota Semarang'),
(221, 13, 'Kota Surakarta'),
(222, 13, 'Kota Tegal'),
(223, 14, 'Kabupaten Bantul'),
(224, 14, 'Kabupaten Gunungkidul'),
(225, 14, 'Kabupaten Kulon Progo'),
(226, 14, 'Kabupaten Sleman'),
(227, 14, 'Kota Yogyakarta'),
(228, 15, 'Kabupaten Bangkalan'),
(229, 15, 'Kabupaten Banyuwangi'),
(230, 15, 'Kabupaten Blitar'),
(231, 15, 'Kabupaten Bojonegoro'),
(232, 15, 'Kabupaten Bondowoso'),
(233, 15, 'Kabupaten Gresik'),
(234, 15, 'Kabupaten Jember'),
(235, 15, 'Kabupaten Jombang'),
(236, 15, 'Kabupaten Kediri'),
(237, 15, 'Kabupaten Lamongan'),
(238, 15, 'Kabupaten Lumajang'),
(239, 15, 'Kabupaten Madiun'),
(240, 15, 'Kabupaten Magetan'),
(241, 15, 'Kabupaten Malang'),
(242, 15, 'Kabupaten Mojokerto'),
(243, 15, 'Kabupaten Nganjuk'),
(244, 15, 'Kabupaten Ngawi'),
(245, 15, 'Kabupaten Pacitan'),
(246, 15, 'Kabupaten Pamekasan'),
(247, 15, 'Kabupaten Pasuruan'),
(248, 15, 'Kabupaten Ponorogo'),
(249, 15, 'Kabupaten Probolinggo'),
(250, 15, 'Kabupaten Sampang'),
(251, 15, 'Kabupaten Sidoarjo'),
(252, 15, 'Kabupaten Situbondo'),
(253, 15, 'Kabupaten Sumenep'),
(254, 15, 'Kabupaten Trenggalek'),
(255, 15, 'Kabupaten Tuban'),
(256, 15, 'Kabupaten Tulungagung'),
(257, 15, 'Kota Batu'),
(258, 15, 'Kota Blitar'),
(259, 15, 'Kota Kediri'),
(260, 15, 'Kota Madiun'),
(261, 15, 'Kota Malang'),
(262, 15, 'Kota Mojokerto'),
(263, 15, 'Kota Pasuruan'),
(264, 15, 'Kota Probolinggo'),
(265, 15, 'Kota Surabaya'),
(266, 16, 'Kabupaten Lebak'),
(267, 16, 'Kabupaten Pandeglang'),
(268, 16, 'Kabupaten Serang'),
(269, 16, 'Kabupaten Tangerang'),
(270, 16, 'Kota Cilegon'),
(271, 16, 'Kota Serang'),
(272, 16, 'Kota Tangerang'),
(273, 16, 'Kota Tangerang Selatan'),
(274, 17, 'Kabupaten Badung'),
(275, 17, 'Kabupaten Bangli'),
(276, 17, 'Kabupaten Buleleng'),
(277, 17, 'Kabupaten Gianyar'),
(278, 17, 'Kabupaten Jembrana'),
(279, 17, 'Kabupaten Karangasem'),
(280, 17, 'Kabupaten Klungkung'),
(281, 17, 'Kabupaten Tabanan'),
(282, 17, 'Kota Denpasar'),
(283, 18, 'Kabupaten Bima'),
(284, 18, 'Kabupaten Dompu'),
(285, 18, 'Kabupaten Lombok Barat'),
(286, 18, 'Kabupaten Lombok Tengah'),
(287, 18, 'Kabupaten Lombok Timur'),
(288, 18, 'Kabupaten Lombok Utara'),
(289, 18, 'Kabupaten Sumbawa'),
(290, 18, 'Kabupaten Sumbawa Barat'),
(291, 18, 'Kota Bima'),
(292, 18, 'Kota Mataram'),
(293, 19, 'Kabupaten Alor'),
(294, 19, 'Kabupaten Belu'),
(295, 19, 'Kabupaten Ende'),
(296, 19, 'Kabupaten Flores Timur'),
(297, 19, 'Kabupaten Kupang'),
(298, 19, 'Kabupaten Lembata'),
(299, 19, 'Kabupaten Malaka'),
(300, 19, 'Kabupaten Manggarai'),
(301, 19, 'Kabupaten Manggarai Barat'),
(302, 19, 'Kabupaten Manggarai Timur'),
(303, 19, 'Kabupaten Nagekeo'),
(304, 19, 'Kabupaten Ngada'),
(305, 19, 'Kabupaten Rote Ndao'),
(306, 19, 'Kabupaten Sabu Raijua'),
(307, 19, 'Kabupaten Sikka'),
(308, 19, 'Kabupaten Sumba Barat'),
(309, 19, 'Kabupaten Sumba Barat Daya'),
(310, 19, 'Kabupaten Sumba Tengah'),
(311, 19, 'Kabupaten Sumba Timur'),
(312, 19, 'Kabupaten Timor Tengah Selatan'),
(313, 19, 'Kabupaten Timor Tengah Utara'),
(314, 19, 'Kota Kupang'),
(315, 20, 'Kabupaten Bengkayang'),
(316, 20, 'Kabupaten Kapuas Hulu'),
(317, 20, 'Kabupaten Kayong Utara'),
(318, 20, 'Kabupaten Ketapang'),
(319, 20, 'Kabupaten Kubu Raya'),
(320, 20, 'Kabupaten Landak'),
(321, 20, 'Kabupaten Melawi'),
(322, 20, 'Kabupaten Mempawah'),
(323, 20, 'Kabupaten Sambas'),
(324, 20, 'Kabupaten Sanggau'),
(325, 20, 'Kabupaten Sekadau'),
(326, 20, 'Kabupaten Sintang'),
(327, 20, 'Kota Pontianak'),
(328, 20, 'Kota Singkawang'),
(329, 21, 'Kabupaten Barito Selatan'),
(330, 21, 'Kabupaten Barito Timur'),
(331, 21, 'Kabupaten Barito Utara'),
(332, 21, 'Kabupaten Gunung Mas'),
(333, 21, 'Kabupaten Kapuas'),
(334, 21, 'Kabupaten Katingan'),
(335, 21, 'Kabupaten Kotawaringin Barat'),
(336, 21, 'Kabupaten Kotawaringin Timur'),
(337, 21, 'Kabupaten Lamandau'),
(338, 21, 'Kabupaten Murung Raya'),
(339, 21, 'Kabupaten Pulang Pisau'),
(340, 21, 'Kabupaten Seruyan'),
(341, 21, 'Kabupaten Sukamara'),
(342, 21, 'Kota Palangka Raya'),
(343, 22, 'Kabupaten Balangan'),
(344, 22, 'Kabupaten Banjar'),
(345, 22, 'Kabupaten Barito Kuala'),
(346, 22, 'Kabupaten Hulu Sungai Selatan'),
(347, 22, 'Kabupaten Hulu Sungai Tengah'),
(348, 22, 'Kabupaten Hulu Sungai Utara'),
(349, 22, 'Kabupaten Kotabaru'),
(350, 22, 'Kabupaten Tabalong'),
(351, 22, 'Kabupaten Tanah Bumbu'),
(352, 22, 'Kabupaten Tanah Laut'),
(353, 22, 'Kabupaten Tapin'),
(354, 22, 'Kota Banjarbaru'),
(355, 22, 'Kota Banjarmasin'),
(356, 23, 'Kabupaten Berau'),
(357, 23, 'Kabupaten Kutai Barat'),
(358, 23, 'Kabupaten Kutai Kartanegara'),
(359, 23, 'Kabupaten Kutai Timur'),
(360, 23, 'Kabupaten Mahakam Ulu'),
(361, 23, 'Kabupaten Paser'),
(362, 23, 'Kabupaten Penajam Paser Utara'),
(363, 23, 'Kota Balikpapan'),
(364, 23, 'Kota Bontang'),
(365, 23, 'Kota Samarinda'),
(366, 24, 'Kabupaten Bulungan'),
(367, 24, 'Kabupaten Malinau'),
(368, 24, 'Kabupaten Nunukan'),
(369, 24, 'Kabupaten Tana Tidung'),
(370, 24, 'Kota Tarakan'),
(371, 25, 'Kabupaten Bolaang Mongondow'),
(372, 25, 'Kabupaten Bolaang Mongondow Selatan'),
(373, 25, 'Kabupaten Bolaang Mongondow Timur'),
(374, 25, 'Kabupaten Bolaang Mongondow Utara'),
(375, 25, 'Kabupaten Kepulauan Sangihe'),
(376, 25, 'Kabupaten Kepulauan Siau Tagulandang Biaro'),
(377, 25, 'Kabupaten Kepulauan Talaud'),
(378, 25, 'Kabupaten Minahasa'),
(379, 25, 'Kabupaten Minahasa Selatan'),
(380, 25, 'Kabupaten Minahasa Tenggara'),
(381, 25, 'Kabupaten Minahasa Utara'),
(382, 25, 'Kota Bitung'),
(383, 25, 'Kota Kotamobagu'),
(384, 25, 'Kota Manado'),
(385, 25, 'Kota Tomohon'),
(386, 26, 'Kabupaten Banggai'),
(387, 26, 'Kabupaten Banggai Kepulauan'),
(388, 26, 'Kabupaten Banggai Laut'),
(389, 26, 'Kabupaten Buol'),
(390, 26, 'Kabupaten Donggala'),
(391, 26, 'Kabupaten Morowali'),
(392, 26, 'Kabupaten Morowali Utara'),
(393, 26, 'Kabupaten Parigi Moutong'),
(394, 26, 'Kabupaten Poso'),
(395, 26, 'Kabupaten Sigi'),
(396, 26, 'Kabupaten Tojo Una-Una'),
(397, 26, 'Kabupaten Tolitoli'),
(398, 26, 'Kota Palu'),
(399, 27, 'Kabupaten Bantaeng'),
(400, 27, 'Kabupaten Barru'),
(401, 27, 'Kabupaten Bone'),
(402, 27, 'Kabupaten Bulukumba'),
(403, 27, 'Kabupaten Enrekang'),
(404, 27, 'Kabupaten Gowa'),
(405, 27, 'Kabupaten Jeneponto'),
(406, 27, 'Kabupaten Kepulauan Selayar'),
(407, 27, 'Kabupaten Luwu'),
(408, 27, 'Kabupaten Luwu Timur'),
(409, 27, 'Kabupaten Luwu Utara'),
(410, 27, 'Kabupaten Maros'),
(411, 27, 'Kabupaten Pangkajene dan Kepulauan'),
(412, 27, 'Kabupaten Pinrang'),
(413, 27, 'Kabupaten Sidenreng Rappang'),
(414, 27, 'Kabupaten Sinjai'),
(415, 27, 'Kabupaten Soppeng'),
(416, 27, 'Kabupaten Takalar'),
(417, 27, 'Kabupaten Tana Toraja'),
(418, 27, 'Kabupaten Toraja Utara'),
(419, 27, 'Kabupaten Wajo'),
(420, 27, 'Kota Makassar'),
(421, 27, 'Kota Palopo'),
(422, 27, 'Kota Parepare'),
(423, 28, 'Kabupaten Bombana'),
(424, 28, 'Kabupaten Buton'),
(425, 28, 'Kabupaten Buton Selatan'),
(426, 28, 'Kabupaten Buton Tengah'),
(427, 28, 'Kabupaten Buton Utara'),
(428, 28, 'Kabupaten Kolaka'),
(429, 28, 'Kabupaten Kolaka Timur'),
(430, 28, 'Kabupaten Kolaka Utara'),
(431, 28, 'Kabupaten Konawe'),
(432, 28, 'Kabupaten Konawe Kepulauan'),
(433, 28, 'Kabupaten Konawe Selatan'),
(434, 28, 'Kabupaten Konawe Utara'),
(435, 28, 'Kabupaten Muna'),
(436, 28, 'Kabupaten Muna Barat'),
(437, 28, 'Kabupaten Wakatobi'),
(438, 28, 'Kota Baubau'),
(439, 28, 'Kota Kendari'),
(440, 29, 'Kabupaten Boalemo'),
(441, 29, 'Kabupaten Bone Bolango'),
(442, 29, 'Kabupaten Gorontalo'),
(443, 29, 'Kabupaten Gorontalo Utara'),
(444, 29, 'Kabupaten Pohuwato'),
(445, 29, 'Kota Gorontalo'),
(446, 30, 'Kabupaten Majene'),
(447, 30, 'Kabupaten Mamasa'),
(448, 30, 'Kabupaten Mamuju'),
(449, 30, 'Kabupaten Mamuju Tengah'),
(450, 30, 'Kabupaten Pasangkayu'),
(451, 30, 'Kabupaten Polewali Mandar'),
(452, 31, 'Kabupaten Buru'),
(453, 31, 'Kabupaten Buru Selatan'),
(454, 31, 'Kabupaten Kepulauan Aru'),
(455, 31, 'Kabupaten Kepulauan Tanimbar'),
(458, 31, 'Kabupaten Maluku Barat Daya'),
(456, 31, 'Kabupaten Maluku Tengah'),
(457, 31, 'Kabupaten Maluku Tenggara'),
(459, 31, 'Kabupaten Seram Bagian Barat'),
(460, 31, 'Kabupaten Seram Bagian Timur'),
(461, 31, 'Kota Ambon'),
(462, 31, 'Kota Tual'),
(463, 32, 'Kabupaten Halmahera Barat'),
(464, 32, 'Kabupaten Halmahera Selatan'),
(465, 32, 'Kabupaten Halmahera Tengah'),
(466, 32, 'Kabupaten Halmahera Timur'),
(467, 32, 'Kabupaten Halmahera Utara'),
(468, 32, 'Kabupaten Kepulauan Sula'),
(469, 32, 'Kabupaten Pulau Morotai'),
(470, 32, 'Kabupaten Pulau Taliabu'),
(471, 32, 'Kota Ternate'),
(472, 32, 'Kota Tidore Kepulauan'),
(473, 33, 'Kabupaten Biak Numfor'),
(474, 33, 'Kabupaten Jayapura'),
(475, 33, 'Kabupaten Keerom'),
(476, 33, 'Kabupaten Sarmi'),
(477, 33, 'Kabupaten Supiori'),
(478, 33, 'Kabupaten Waropen'),
(479, 33, 'Kota Jayapura'),
(480, 34, 'Kabupaten Maybrat'),
(481, 34, 'Kabupaten Raja Ampat'),
(482, 34, 'Kabupaten Sorong'),
(483, 34, 'Kabupaten Sorong Selatan'),
(484, 34, 'Kabupaten Tambrauw'),
(485, 34, 'Kota Sorong'),
(486, 35, 'Kabupaten Fakfak'),
(487, 35, 'Kabupaten Kaimana'),
(488, 35, 'Kabupaten Manokwari'),
(489, 35, 'Kabupaten Manokwari Selatan'),
(490, 35, 'Kabupaten Pegunungan Arfak'),
(491, 35, 'Kabupaten Teluk Bintuni'),
(492, 35, 'Kabupaten Teluk Wondama'),
(493, 36, 'Kabupaten Deiyai'),
(494, 36, 'Kabupaten Dogiyai'),
(495, 36, 'Kabupaten Intan Jaya'),
(496, 36, 'Kabupaten Mimika'),
(497, 36, 'Kabupaten Nabire'),
(498, 36, 'Kabupaten Paniai'),
(499, 36, 'Kabupaten Puncak'),
(500, 36, 'Kabupaten Puncak Jaya'),
(501, 37, 'Kabupaten Jayawijaya'),
(502, 37, 'Kabupaten Lanny Jaya'),
(503, 37, 'Kabupaten Mamberamo Tengah'),
(504, 37, 'Kabupaten Nduga'),
(505, 37, 'Kabupaten Pegunungan Bintang'),
(506, 37, 'Kabupaten Tolikara'),
(507, 37, 'Kabupaten Yahukimo'),
(508, 37, 'Kabupaten Yalimo'),
(509, 38, 'Kabupaten Asmat'),
(510, 38, 'Kabupaten Boven Digoel'),
(511, 38, 'Kabupaten Mappi'),
(512, 38, 'Kabupaten Merauke');

-- --------------------------------------------------------

--
-- Table structure for table `kta_applications`
--

CREATE TABLE `kta_applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `club_name` varchar(255) NOT NULL,
  `leader_name` varchar(255) NOT NULL,
  `coach_name` varchar(255) NOT NULL,
  `manager_name` varchar(255) NOT NULL,
  `province` varchar(100) NOT NULL,
  `regency` varchar(100) NOT NULL,
  `club_address` text NOT NULL,
  `province_id` int(11) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `logo_path` varchar(255) NOT NULL,
  `ad_file_path` varchar(255) DEFAULT NULL,
  `art_file_path` varchar(255) NOT NULL,
  `sk_file_path` varchar(255) NOT NULL,
  `payment_proof_path` varchar(255) NOT NULL,
  `pergetA_payment_proof_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved_pengcab','approved_pengda','approved_pb','rejected','kta_issued') DEFAULT 'pending',
  `approved_by_pengcab_id` int(11) DEFAULT NULL,
  `approved_at_pengcab` timestamp NULL DEFAULT NULL,
  `notes_pengcab` text DEFAULT NULL,
  `pengcab_payment_proof_path` varchar(255) DEFAULT NULL,
  `approved_by_pengda_id` int(11) DEFAULT NULL,
  `approved_at_pengda` timestamp NULL DEFAULT NULL,
  `notes_pengda` text DEFAULT NULL,
  `pengda_payment_proof_path` varchar(255) DEFAULT NULL,
  `approved_by_pb_id` int(11) DEFAULT NULL,
  `approved_at_pb` timestamp NULL DEFAULT NULL,
  `notes_pb` text DEFAULT NULL,
  `kta_file_path` varchar(255) DEFAULT NULL,
  `kta_issued_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kta_applications`
--

INSERT INTO `kta_applications` (`id`, `user_id`, `club_name`, `leader_name`, `coach_name`, `manager_name`, `province`, `regency`, `club_address`, `province_id`, `city_id`, `logo_path`, `ad_file_path`, `art_file_path`, `sk_file_path`, `payment_proof_path`, `pergetA_payment_proof_path`, `status`, `approved_by_pengcab_id`, `approved_at_pengcab`, `notes_pengcab`, `pengcab_payment_proof_path`, `approved_by_pengda_id`, `approved_at_pengda`, `notes_pengda`, `pengda_payment_proof_path`, `approved_by_pb_id`, `approved_at_pb`, `notes_pb`, `kta_file_path`, `kta_issued_at`, `created_at`) VALUES
(11, 1658, 'rajawali', 'tees', 'tessss', 'tesssss', 'Jawa Barat', 'Kabupaten Bogor', 'testingg', 12, 164, 'kta_logo_68429ad681ff4_kta_68426233914c6_kemeja__3_.jpg', 'kta_ad_68429ad686aaa_SURAT_PRESTASI_merged.pdf', 'kta_art_68429ad6881bd_SURAT_PRESTASI_merged.pdf', 'kta_sk_68429ad689196_sppd_megamendung.pdf', 'kta_payment_68429ad68aeee_ChatGPT_Image_Jun_2__2025__08_30_08_PM.png', NULL, 'kta_issued', 121, '2025-06-06 07:38:23', '', 'uploads/pengcab_payment_proofs/pengcab_payment_68429aefd13f7.jpg', 10, '2025-06-06 07:41:59', '', 'uploads/pengda_payment_proofs/pengda_payment_68429bc7d592e.png', 1, '2025-06-06 07:42:18', '', 'kta_68429be860cd4_ter.jpg', '2025-06-06 07:42:32', '2025-06-06 07:37:58');

-- --------------------------------------------------------

--
-- Table structure for table `kta_application_history`
--

CREATE TABLE `kta_application_history` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kta_application_history`
--

INSERT INTO `kta_application_history` (`id`, `application_id`, `status`, `notes`, `created_at`) VALUES
(3, 11, 'approved_pengcab', '', '2025-06-06 07:38:23'),
(4, 11, 'approved_pengda', '', '2025-06-06 07:41:59'),
(5, 11, 'approved_pb', '', '2025-06-06 07:42:18'),
(6, 11, 'kta_issued', 'KTA telah diterbitkan oleh PB', '2025-06-06 07:42:32');

-- --------------------------------------------------------

--
-- Table structure for table `provinces`
--

CREATE TABLE `provinces` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `provinces`
--

INSERT INTO `provinces` (`id`, `name`) VALUES
(1, 'Aceh'),
(17, 'Bali'),
(16, 'Banten'),
(7, 'Bengkulu'),
(14, 'DI Yogyakarta'),
(11, 'DKI Jakarta'),
(29, 'Gorontalo'),
(5, 'Jambi'),
(12, 'Jawa Barat'),
(13, 'Jawa Tengah'),
(15, 'Jawa Timur'),
(20, 'Kalimantan Barat'),
(22, 'Kalimantan Selatan'),
(21, 'Kalimantan Tengah'),
(23, 'Kalimantan Timur'),
(24, 'Kalimantan Utara'),
(9, 'Kepulauan Bangka Belitung'),
(10, 'Kepulauan Riau'),
(8, 'Lampung'),
(31, 'Maluku'),
(32, 'Maluku Utara'),
(18, 'Nusa Tenggara Barat'),
(19, 'Nusa Tenggara Timur'),
(33, 'Papua'),
(35, 'Papua Barat'),
(34, 'Papua Barat Daya'),
(37, 'Papua Pegunungan'),
(38, 'Papua Selatan'),
(36, 'Papua Tengah'),
(4, 'Riau'),
(30, 'Sulawesi Barat'),
(27, 'Sulawesi Selatan'),
(26, 'Sulawesi Tengah'),
(28, 'Sulawesi Tenggara'),
(25, 'Sulawesi Utara'),
(3, 'Sumatera Barat'),
(6, 'Sumatera Selatan'),
(2, 'Sumatera Utara');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `created_at`) VALUES
(1, 'users', 'User biasa - anggota club', '2025-06-03 02:13:09'),
(2, 'admin_pengcab', 'Admin Pengurus Cabang', '2025-06-03 02:13:09'),
(3, 'admin_pengda', 'Admin Pengurus Daerah', '2025-06-03 02:13:09'),
(4, 'admin_pb', 'Admin Pengurus Besar', '2025-06-03 02:13:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `club_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `province_id` int(11) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `club_name`, `email`, `phone`, `address`, `username`, `password`, `role_id`, `is_active`, `created_at`, `updated_at`, `province_id`, `city_id`) VALUES
(1, 'FORBASI Pusat', 'admin.pb@forbasi.org', '081112223333', 'Jl. PB Pusat No. 1 Jakarta', 'admin_pb', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 4, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', NULL, NULL),
(2, 'FORBASI Aceh', 'admin.pengda.aceh@forbasi.org', '081244554529', 'Kantor Aceh', 'admin_pengda_aceh', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 1, NULL),
(3, 'FORBASI Bali', 'admin.pengda.bali@forbasi.org', '081217403522', 'Kantor Bali', 'admin_pengda_bali', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 17, NULL),
(4, 'FORBASI Banten', 'admin.pengda.banten@forbasi.org', '081286974904', 'Kantor Banten', 'admin_pengda_banten', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 16, NULL),
(5, 'FORBASI Bengkulu', 'admin.pengda.bengkulu@forbasi.org', '081249173720', 'Kantor Bengkulu', 'admin_pengda_bengkulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 7, NULL),
(6, 'FORBASI DI Yogyakarta', 'admin.pengda.diyogyakarta@forbasi.org', '081273554984', 'Kantor DI Yogyakarta', 'admin_pengda_di_yogyakarta', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 14, NULL),
(7, 'FORBASI DKI Jakarta', 'admin.pengda.dkijakarta@forbasi.org', '081273156064', 'Kantor DKI Jakarta', 'admin_pengda_dki_jakarta', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 11, NULL),
(8, 'FORBASI Gorontalo', 'admin.pengda.gorontalo@forbasi.org', '081213317689', 'Kantor Gorontalo', 'admin_pengda_gorontalo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 29, NULL),
(9, 'FORBASI Jambi', 'admin.pengda.jambi@forbasi.org', '081232913427', 'Kantor Jambi', 'admin_pengda_jambi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 5, NULL),
(10, 'FORBASI Jawa Barat', 'admin.pengda.jawabarat@forbasi.org', '081243356598', 'Kantor Jawa Barat', 'admin_pengda_jawa_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 12, NULL),
(11, 'FORBASI Jawa Tengah', 'admin.pengda.jawatengah@forbasi.org', '081291738000', 'Kantor Jawa Tengah', 'admin_pengda_jawa_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 13, NULL),
(12, 'FORBASI Jawa Timur', 'admin.pengda.jawatimur@forbasi.org', '081295348464', 'Kantor Jawa Timur', 'admin_pengda_jawa_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 15, NULL),
(13, 'FORBASI Kalimantan Barat', 'admin.pengda.kalimantanbarat@forbasi.org', '081285873719', 'Kantor Kalimantan Barat', 'admin_pengda_kalimantan_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 20, NULL),
(14, 'FORBASI Kalimantan Selatan', 'admin.pengda.kalimantanselatan@forbasi.org', '081251022960', 'Kantor Kalimantan Selatan', 'admin_pengda_kalimantan_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 22, NULL),
(15, 'FORBASI Kalimantan Tengah', 'admin.pengda.kalimantantengah@forbasi.org', '081212090751', 'Kantor Kalimantan Tengah', 'admin_pengda_kalimantan_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 21, NULL),
(16, 'FORBASI Kalimantan Timur', 'admin.pengda.kalimantantimur@forbasi.org', '081254566420', 'Kantor Kalimantan Timur', 'admin_pengda_kalimantan_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 23, NULL),
(17, 'FORBASI Kalimantan Utara', 'admin.pengda.kalimantanutara@forbasi.org', '081287087426', 'Kantor Kalimantan Utara', 'admin_pengda_kalimantan_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 24, NULL),
(18, 'FORBASI Kepulauan Bangka Belitung', 'admin.pengda.kepulauanbangkabelitung@forbasi.org', '081229448339', 'Kantor Kepulauan Bangka Belitung', 'admin_pengda_kepulauan_bangka_belitung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 9, NULL),
(19, 'FORBASI Kepulauan Riau', 'admin.pengda.kepulauanriau@forbasi.org', '081271860561', 'Kantor Kepulauan Riau', 'admin_pengda_kepulauan_riau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 10, NULL),
(20, 'FORBASI Lampung', 'admin.pengda.lampung@forbasi.org', '081279113012', 'Kantor Lampung', 'admin_pengda_lampung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 8, NULL),
(21, 'FORBASI Maluku', 'admin.pengda.maluku@forbasi.org', '081241585516', 'Kantor Maluku', 'admin_pengda_maluku', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 31, NULL),
(22, 'FORBASI Maluku Utara', 'admin.pengda.malukuutara@forbasi.org', '081297344688', 'Kantor Maluku Utara', 'admin_pengda_maluku_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 32, NULL),
(23, 'FORBASI Nusa Tenggara Barat', 'admin.pengda.nusatenggarabarat@forbasi.org', '081291650787', 'Kantor Nusa Tenggara Barat', 'admin_pengda_nusa_tenggara_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:14', '2025-06-06 07:29:14', 18, NULL),
(24, 'FORBASI Nusa Tenggara Timur', 'admin.pengda.nusatenggaratimur@forbasi.org', '081267814980', 'Kantor Nusa Tenggara Timur', 'admin_pengda_nusa_tenggara_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 19, NULL),
(25, 'FORBASI Papua', 'admin.pengda.papua@forbasi.org', '081225568123', 'Kantor Papua', 'admin_pengda_papua', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 33, NULL),
(26, 'FORBASI Papua Barat', 'admin.pengda.papuabarat@forbasi.org', '081284216713', 'Kantor Papua Barat', 'admin_pengda_papua_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 35, NULL),
(27, 'FORBASI Papua Barat Daya', 'admin.pengda.papuabaratdaya@forbasi.org', '081294653777', 'Kantor Papua Barat Daya', 'admin_pengda_papua_barat_daya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 34, NULL),
(28, 'FORBASI Papua Pegunungan', 'admin.pengda.papuapegunungan@forbasi.org', '081224526531', 'Kantor Papua Pegunungan', 'admin_pengda_papua_pegunungan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 37, NULL),
(29, 'FORBASI Papua Selatan', 'admin.pengda.papuaselatan@forbasi.org', '081283583151', 'Kantor Papua Selatan', 'admin_pengda_papua_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 38, NULL),
(30, 'FORBASI Papua Tengah', 'admin.pengda.papuatengah@forbasi.org', '081286026262', 'Kantor Papua Tengah', 'admin_pengda_papua_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 36, NULL),
(31, 'FORBASI Riau', 'admin.pengda.riau@forbasi.org', '081265154849', 'Kantor Riau', 'admin_pengda_riau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 4, NULL),
(32, 'FORBASI Sulawesi Barat', 'admin.pengda.sulawesibarat@forbasi.org', '081251294102', 'Kantor Sulawesi Barat', 'admin_pengda_sulawesi_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 30, NULL),
(33, 'FORBASI Sulawesi Selatan', 'admin.pengda.sulawesiselatan@forbasi.org', '081233830612', 'Kantor Sulawesi Selatan', 'admin_pengda_sulawesi_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 27, NULL),
(34, 'FORBASI Sulawesi Tengah', 'admin.pengda.sulawesitengah@forbasi.org', '081239076476', 'Kantor Sulawesi Tengah', 'admin_pengda_sulawesi_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 26, NULL),
(35, 'FORBASI Sulawesi Tenggara', 'admin.pengda.sulawesitenggara@forbasi.org', '081210941910', 'Kantor Sulawesi Tenggara', 'admin_pengda_sulawesi_tenggara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 28, NULL),
(36, 'FORBASI Sulawesi Utara', 'admin.pengda.sulawesiutara@forbasi.org', '081266236225', 'Kantor Sulawesi Utara', 'admin_pengda_sulawesi_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 25, NULL),
(37, 'FORBASI Sumatera Barat', 'admin.pengda.sumaterabarat@forbasi.org', '081298375617', 'Kantor Sumatera Barat', 'admin_pengda_sumatera_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 3, NULL),
(38, 'FORBASI Sumatera Selatan', 'admin.pengda.sumateraselatan@forbasi.org', '081248086266', 'Kantor Sumatera Selatan', 'admin_pengda_sumatera_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 6, NULL),
(39, 'FORBASI Sumatera Utara', 'admin.pengda.sumaterautara@forbasi.org', '081212525151', 'Kantor Sumatera Utara', 'admin_pengda_sumatera_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 3, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 2, NULL),
(40, 'FORBASI Kabupaten Aceh Barat', 'admin.pengcab.kabupatenacehbarat@forbasi.org', '081324133159', 'Kantor Kabupaten Aceh Barat', 'admin_pengcab_kabupaten_aceh_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 1),
(41, 'FORBASI Kabupaten Aceh Barat Daya', 'admin.pengcab.kabupatenacehbaratdaya@forbasi.org', '081332575609', 'Kantor Kabupaten Aceh Barat Daya', 'admin_pengcab_kabupaten_aceh_barat_daya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 2),
(42, 'FORBASI Kabupaten Aceh Besar', 'admin.pengcab.kabupatenacehbesar@forbasi.org', '081378790107', 'Kantor Kabupaten Aceh Besar', 'admin_pengcab_kabupaten_aceh_besar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 3),
(43, 'FORBASI Kabupaten Aceh Jaya', 'admin.pengcab.kabupatenacehjaya@forbasi.org', '081346968793', 'Kantor Kabupaten Aceh Jaya', 'admin_pengcab_kabupaten_aceh_jaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 4),
(44, 'FORBASI Kabupaten Aceh Selatan', 'admin.pengcab.kabupatenacehselatan@forbasi.org', '081359484754', 'Kantor Kabupaten Aceh Selatan', 'admin_pengcab_kabupaten_aceh_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 5),
(45, 'FORBASI Kabupaten Aceh Singkil', 'admin.pengcab.kabupatenacehsingkil@forbasi.org', '081368058952', 'Kantor Kabupaten Aceh Singkil', 'admin_pengcab_kabupaten_aceh_singkil', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 6),
(46, 'FORBASI Kabupaten Aceh Tamiang', 'admin.pengcab.kabupatenacehtamiang@forbasi.org', '081379923914', 'Kantor Kabupaten Aceh Tamiang', 'admin_pengcab_kabupaten_aceh_tamiang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 7),
(47, 'FORBASI Kabupaten Aceh Tengah', 'admin.pengcab.kabupatenacehtengah@forbasi.org', '081360464951', 'Kantor Kabupaten Aceh Tengah', 'admin_pengcab_kabupaten_aceh_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 8),
(48, 'FORBASI Kabupaten Aceh Tenggara', 'admin.pengcab.kabupatenacehtenggara@forbasi.org', '081392345098', 'Kantor Kabupaten Aceh Tenggara', 'admin_pengcab_kabupaten_aceh_tenggara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 9),
(49, 'FORBASI Kabupaten Aceh Timur', 'admin.pengcab.kabupatenacehtimur@forbasi.org', '081356206877', 'Kantor Kabupaten Aceh Timur', 'admin_pengcab_kabupaten_aceh_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 10),
(50, 'FORBASI Kabupaten Aceh Utara', 'admin.pengcab.kabupatenacehutara@forbasi.org', '081363645441', 'Kantor Kabupaten Aceh Utara', 'admin_pengcab_kabupaten_aceh_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 11),
(51, 'FORBASI Kabupaten Bener Meriah', 'admin.pengcab.kabupatenbenermeriah@forbasi.org', '081366233937', 'Kantor Kabupaten Bener Meriah', 'admin_pengcab_kabupaten_bener_meriah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 12),
(52, 'FORBASI Kabupaten Bireuen', 'admin.pengcab.kabupatenbireuen@forbasi.org', '081365798780', 'Kantor Kabupaten Bireuen', 'admin_pengcab_kabupaten_bireuen', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 13),
(53, 'FORBASI Kabupaten Gayo Lues', 'admin.pengcab.kabupatengayolues@forbasi.org', '081376793458', 'Kantor Kabupaten Gayo Lues', 'admin_pengcab_kabupaten_gayo_lues', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 14),
(54, 'FORBASI Kabupaten Nagan Raya', 'admin.pengcab.kabupatennaganraya@forbasi.org', '081376470981', 'Kantor Kabupaten Nagan Raya', 'admin_pengcab_kabupaten_nagan_raya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 15),
(55, 'FORBASI Kabupaten Pidie', 'admin.pengcab.kabupatenpidie@forbasi.org', '081329235802', 'Kantor Kabupaten Pidie', 'admin_pengcab_kabupaten_pidie', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 16),
(56, 'FORBASI Kabupaten Pidie Jaya', 'admin.pengcab.kabupatenpidiejaya@forbasi.org', '081363989444', 'Kantor Kabupaten Pidie Jaya', 'admin_pengcab_kabupaten_pidie_jaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 17),
(57, 'FORBASI Kabupaten Simeulue', 'admin.pengcab.kabupatensimeulue@forbasi.org', '081362370335', 'Kantor Kabupaten Simeulue', 'admin_pengcab_kabupaten_simeulue', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 18),
(58, 'FORBASI Kota Banda Aceh', 'admin.pengcab.kotabandaaceh@forbasi.org', '081366681124', 'Kantor Kota Banda Aceh', 'admin_pengcab_kota_banda_aceh', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 19),
(59, 'FORBASI Kota Langsa', 'admin.pengcab.kotalangsa@forbasi.org', '081368148569', 'Kantor Kota Langsa', 'admin_pengcab_kota_langsa', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 20),
(60, 'FORBASI Kota Lhokseumawe', 'admin.pengcab.kotalhokseumawe@forbasi.org', '081317144708', 'Kantor Kota Lhokseumawe', 'admin_pengcab_kota_lhokseumawe', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 21),
(61, 'FORBASI Kota Sabang', 'admin.pengcab.kotasabang@forbasi.org', '081378808791', 'Kantor Kota Sabang', 'admin_pengcab_kota_sabang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 22),
(62, 'FORBASI Kota Subulussalam', 'admin.pengcab.kotasubulussalam@forbasi.org', '081367454599', 'Kantor Kota Subulussalam', 'admin_pengcab_kota_subulussalam', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 1, 23),
(63, 'FORBASI Kabupaten Badung', 'admin.pengcab.kabupatenbadung@forbasi.org', '081385815290', 'Kantor Kabupaten Badung', 'admin_pengcab_kabupaten_badung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 274),
(64, 'FORBASI Kabupaten Bangli', 'admin.pengcab.kabupatenbangli@forbasi.org', '081394623452', 'Kantor Kabupaten Bangli', 'admin_pengcab_kabupaten_bangli', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 275),
(65, 'FORBASI Kabupaten Buleleng', 'admin.pengcab.kabupatenbuleleng@forbasi.org', '081384339197', 'Kantor Kabupaten Buleleng', 'admin_pengcab_kabupaten_buleleng', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 276),
(66, 'FORBASI Kabupaten Gianyar', 'admin.pengcab.kabupatengianyar@forbasi.org', '081316980686', 'Kantor Kabupaten Gianyar', 'admin_pengcab_kabupaten_gianyar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 277),
(67, 'FORBASI Kabupaten Jembrana', 'admin.pengcab.kabupatenjembrana@forbasi.org', '081346220351', 'Kantor Kabupaten Jembrana', 'admin_pengcab_kabupaten_jembrana', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 278),
(68, 'FORBASI Kabupaten Karangasem', 'admin.pengcab.kabupatenkarangasem@forbasi.org', '081320439304', 'Kantor Kabupaten Karangasem', 'admin_pengcab_kabupaten_karangasem', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 279),
(69, 'FORBASI Kabupaten Klungkung', 'admin.pengcab.kabupatenklungkung@forbasi.org', '081320672945', 'Kantor Kabupaten Klungkung', 'admin_pengcab_kabupaten_klungkung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 280),
(70, 'FORBASI Kabupaten Tabanan', 'admin.pengcab.kabupatentabanan@forbasi.org', '081342744220', 'Kantor Kabupaten Tabanan', 'admin_pengcab_kabupaten_tabanan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 281),
(71, 'FORBASI Kota Denpasar', 'admin.pengcab.kotadenpasar@forbasi.org', '081369327547', 'Kantor Kota Denpasar', 'admin_pengcab_kota_denpasar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 17, 282),
(72, 'FORBASI Kabupaten Lebak', 'admin.pengcab.kabupatenlebak@forbasi.org', '081370578444', 'Kantor Kabupaten Lebak', 'admin_pengcab_kabupaten_lebak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 266),
(73, 'FORBASI Kabupaten Pandeglang', 'admin.pengcab.kabupatenpandeglang@forbasi.org', '081391000659', 'Kantor Kabupaten Pandeglang', 'admin_pengcab_kabupaten_pandeglang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 267),
(74, 'FORBASI Kabupaten Serang', 'admin.pengcab.kabupatenserang@forbasi.org', '081353535424', 'Kantor Kabupaten Serang', 'admin_pengcab_kabupaten_serang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 268),
(75, 'FORBASI Kabupaten Tangerang', 'admin.pengcab.kabupatentangerang@forbasi.org', '081378113952', 'Kantor Kabupaten Tangerang', 'admin_pengcab_kabupaten_tangerang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 269),
(76, 'FORBASI Kota Cilegon', 'admin.pengcab.kotacilegon@forbasi.org', '081330746050', 'Kantor Kota Cilegon', 'admin_pengcab_kota_cilegon', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 270),
(77, 'FORBASI Kota Serang', 'admin.pengcab.kotaserang@forbasi.org', '081314827679', 'Kantor Kota Serang', 'admin_pengcab_kota_serang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 271),
(78, 'FORBASI Kota Tangerang', 'admin.pengcab.kotatangerang@forbasi.org', '081321003521', 'Kantor Kota Tangerang', 'admin_pengcab_kota_tangerang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 272),
(79, 'FORBASI Kota Tangerang Selatan', 'admin.pengcab.kotatangerangselatan@forbasi.org', '081344744052', 'Kantor Kota Tangerang Selatan', 'admin_pengcab_kota_tangerang_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 16, 273),
(80, 'FORBASI Kabupaten Bengkulu Selatan', 'admin.pengcab.kabupatenbengkuluselatan@forbasi.org', '081334869054', 'Kantor Kabupaten Bengkulu Selatan', 'admin_pengcab_kabupaten_bengkulu_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 116),
(81, 'FORBASI Kabupaten Bengkulu Tengah', 'admin.pengcab.kabupatenbengkulutengah@forbasi.org', '081327741720', 'Kantor Kabupaten Bengkulu Tengah', 'admin_pengcab_kabupaten_bengkulu_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 117),
(82, 'FORBASI Kabupaten Bengkulu Utara', 'admin.pengcab.kabupatenbengkuluutara@forbasi.org', '081313875992', 'Kantor Kabupaten Bengkulu Utara', 'admin_pengcab_kabupaten_bengkulu_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 118),
(83, 'FORBASI Kabupaten Kaur', 'admin.pengcab.kabupatenkaur@forbasi.org', '081316300225', 'Kantor Kabupaten Kaur', 'admin_pengcab_kabupaten_kaur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 119),
(84, 'FORBASI Kabupaten Kepahiang', 'admin.pengcab.kabupatenkepahiang@forbasi.org', '081310468438', 'Kantor Kabupaten Kepahiang', 'admin_pengcab_kabupaten_kepahiang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 120),
(85, 'FORBASI Kabupaten Lebong', 'admin.pengcab.kabupatenlebong@forbasi.org', '081357164500', 'Kantor Kabupaten Lebong', 'admin_pengcab_kabupaten_lebong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 121),
(86, 'FORBASI Kabupaten Mukomuko', 'admin.pengcab.kabupatenmukomuko@forbasi.org', '081361224704', 'Kantor Kabupaten Mukomuko', 'admin_pengcab_kabupaten_mukomuko', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 122),
(87, 'FORBASI Kabupaten Rejang Lebong', 'admin.pengcab.kabupatenrejanglebong@forbasi.org', '081326470414', 'Kantor Kabupaten Rejang Lebong', 'admin_pengcab_kabupaten_rejang_lebong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 123),
(88, 'FORBASI Kabupaten Seluma', 'admin.pengcab.kabupatenseluma@forbasi.org', '081340343295', 'Kantor Kabupaten Seluma', 'admin_pengcab_kabupaten_seluma', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 124),
(89, 'FORBASI Kota Bengkulu', 'admin.pengcab.kotabengkulu@forbasi.org', '081337533017', 'Kantor Kota Bengkulu', 'admin_pengcab_kota_bengkulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 7, 125),
(90, 'FORBASI Kabupaten Bantul', 'admin.pengcab.kabupatenbantul@forbasi.org', '081348994174', 'Kantor Kabupaten Bantul', 'admin_pengcab_kabupaten_bantul', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 14, 223),
(91, 'FORBASI Kabupaten Gunungkidul', 'admin.pengcab.kabupatengunungkidul@forbasi.org', '081390447237', 'Kantor Kabupaten Gunungkidul', 'admin_pengcab_kabupaten_gunungkidul', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 14, 224),
(92, 'FORBASI Kabupaten Kulon Progo', 'admin.pengcab.kabupatenkulonprogo@forbasi.org', '081367299445', 'Kantor Kabupaten Kulon Progo', 'admin_pengcab_kabupaten_kulon_progo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 14, 225),
(93, 'FORBASI Kabupaten Sleman', 'admin.pengcab.kabupatensleman@forbasi.org', '081345816365', 'Kantor Kabupaten Sleman', 'admin_pengcab_kabupaten_sleman', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 14, 226),
(94, 'FORBASI Kota Yogyakarta', 'admin.pengcab.kotayogyakarta@forbasi.org', '081391330205', 'Kantor Kota Yogyakarta', 'admin_pengcab_kota_yogyakarta', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 14, 227),
(95, 'FORBASI Kabupaten Kepulauan Seribu', 'admin.pengcab.kabupatenkepulauanseribu@forbasi.org', '081382286676', 'Kantor Kabupaten Kepulauan Seribu', 'admin_pengcab_kabupaten_kepulauan_seribu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 160),
(96, 'FORBASI Kota Jakarta Barat', 'admin.pengcab.kotajakartabarat@forbasi.org', '081376544312', 'Kantor Kota Jakarta Barat', 'admin_pengcab_kota_jakarta_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 156),
(97, 'FORBASI Kota Jakarta Pusat', 'admin.pengcab.kotajakartapusat@forbasi.org', '081386740537', 'Kantor Kota Jakarta Pusat', 'admin_pengcab_kota_jakarta_pusat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 155),
(98, 'FORBASI Kota Jakarta Selatan', 'admin.pengcab.kotajakartaselatan@forbasi.org', '081361275735', 'Kantor Kota Jakarta Selatan', 'admin_pengcab_kota_jakarta_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 157),
(99, 'FORBASI Kota Jakarta Timur', 'admin.pengcab.kotajakartatimur@forbasi.org', '081327108597', 'Kantor Kota Jakarta Timur', 'admin_pengcab_kota_jakarta_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 158),
(100, 'FORBASI Kota Jakarta Utara', 'admin.pengcab.kotajakartautara@forbasi.org', '081380012507', 'Kantor Kota Jakarta Utara', 'admin_pengcab_kota_jakarta_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 11, 159),
(101, 'FORBASI Kabupaten Boalemo', 'admin.pengcab.kabupatenboalemo@forbasi.org', '081350037304', 'Kantor Kabupaten Boalemo', 'admin_pengcab_kabupaten_boalemo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 440),
(102, 'FORBASI Kabupaten Bone Bolango', 'admin.pengcab.kabupatenbonebolango@forbasi.org', '081367193498', 'Kantor Kabupaten Bone Bolango', 'admin_pengcab_kabupaten_bone_bolango', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 441),
(103, 'FORBASI Kabupaten Gorontalo', 'admin.pengcab.kabupatengorontalo@forbasi.org', '081383672396', 'Kantor Kabupaten Gorontalo', 'admin_pengcab_kabupaten_gorontalo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 442),
(104, 'FORBASI Kabupaten Gorontalo Utara', 'admin.pengcab.kabupatengorontaloutara@forbasi.org', '081376150395', 'Kantor Kabupaten Gorontalo Utara', 'admin_pengcab_kabupaten_gorontalo_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 443),
(105, 'FORBASI Kabupaten Pohuwato', 'admin.pengcab.kabupatenpohuwato@forbasi.org', '081315245721', 'Kantor Kabupaten Pohuwato', 'admin_pengcab_kabupaten_pohuwato', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 444),
(106, 'FORBASI Kota Gorontalo', 'admin.pengcab.kotagorontalo@forbasi.org', '081331692172', 'Kantor Kota Gorontalo', 'admin_pengcab_kota_gorontalo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 29, 445),
(107, 'FORBASI Kabupaten Batanghari', 'admin.pengcab.kabupatenbatanghari@forbasi.org', '081395954532', 'Kantor Kabupaten Batanghari', 'admin_pengcab_kabupaten_batanghari', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 88),
(108, 'FORBASI Kabupaten Bungo', 'admin.pengcab.kabupatenbungo@forbasi.org', '081396576031', 'Kantor Kabupaten Bungo', 'admin_pengcab_kabupaten_bungo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 89),
(109, 'FORBASI Kabupaten Kerinci', 'admin.pengcab.kabupatenkerinci@forbasi.org', '081398023412', 'Kantor Kabupaten Kerinci', 'admin_pengcab_kabupaten_kerinci', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 90),
(110, 'FORBASI Kabupaten Merangin', 'admin.pengcab.kabupatenmerangin@forbasi.org', '081373853773', 'Kantor Kabupaten Merangin', 'admin_pengcab_kabupaten_merangin', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 91),
(111, 'FORBASI Kabupaten Muaro Jambi', 'admin.pengcab.kabupatenmuarojambi@forbasi.org', '081375278965', 'Kantor Kabupaten Muaro Jambi', 'admin_pengcab_kabupaten_muaro_jambi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 92),
(112, 'FORBASI Kabupaten Sarolangun', 'admin.pengcab.kabupatensarolangun@forbasi.org', '081385579504', 'Kantor Kabupaten Sarolangun', 'admin_pengcab_kabupaten_sarolangun', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 93),
(113, 'FORBASI Kabupaten Tanjung Jabung Barat', 'admin.pengcab.kabupatentanjungjabungbarat@forbasi.org', '081388064552', 'Kantor Kabupaten Tanjung Jabung Barat', 'admin_pengcab_kabupaten_tanjung_jabung_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 94),
(114, 'FORBASI Kabupaten Tanjung Jabung Timur', 'admin.pengcab.kabupatentanjungjabungtimur@forbasi.org', '081362096361', 'Kantor Kabupaten Tanjung Jabung Timur', 'admin_pengcab_kabupaten_tanjung_jabung_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 95),
(115, 'FORBASI Kabupaten Tebo', 'admin.pengcab.kabupatentebo@forbasi.org', '081369530438', 'Kantor Kabupaten Tebo', 'admin_pengcab_kabupaten_tebo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 96),
(116, 'FORBASI Kota Jambi', 'admin.pengcab.kotajambi@forbasi.org', '081388950396', 'Kantor Kota Jambi', 'admin_pengcab_kota_jambi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 97),
(117, 'FORBASI Kota Sungai Penuh', 'admin.pengcab.kotasungaipenuh@forbasi.org', '081311468862', 'Kantor Kota Sungai Penuh', 'admin_pengcab_kota_sungai_penuh', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 5, 98),
(118, 'FORBASI Kabupaten Bandung', 'admin.pengcab.kabupatenbandung@forbasi.org', '081311904291', 'Kantor Kabupaten Bandung', 'admin_pengcab_kabupaten_bandung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 161),
(119, 'FORBASI Kabupaten Bandung Barat', 'admin.pengcab.kabupatenbandungbarat@forbasi.org', '081317858002', 'Kantor Kabupaten Bandung Barat', 'admin_pengcab_kabupaten_bandung_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 162),
(120, 'FORBASI Kabupaten Bekasi', 'admin.pengcab.kabupatenbekasi@forbasi.org', '081346090007', 'Kantor Kabupaten Bekasi', 'admin_pengcab_kabupaten_bekasi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 163),
(121, 'FORBASI Kabupaten Bogor', 'admin.pengcab.kabupatenbogor@forbasi.org', '081333918486', 'Kantor Kabupaten Bogor', 'admin_pengcab_kabupaten_bogor', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 164),
(122, 'FORBASI Kabupaten Ciamis', 'admin.pengcab.kabupatenciamis@forbasi.org', '081395016484', 'Kantor Kabupaten Ciamis', 'admin_pengcab_kabupaten_ciamis', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 165),
(123, 'FORBASI Kabupaten Cianjur', 'admin.pengcab.kabupatencianjur@forbasi.org', '081313196602', 'Kantor Kabupaten Cianjur', 'admin_pengcab_kabupaten_cianjur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 166),
(124, 'FORBASI Kabupaten Cirebon', 'admin.pengcab.kabupatencirebon@forbasi.org', '081393608621', 'Kantor Kabupaten Cirebon', 'admin_pengcab_kabupaten_cirebon', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 167),
(125, 'FORBASI Kabupaten Garut', 'admin.pengcab.kabupatengarut@forbasi.org', '081368598833', 'Kantor Kabupaten Garut', 'admin_pengcab_kabupaten_garut', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 168),
(126, 'FORBASI Kabupaten Indramayu', 'admin.pengcab.kabupatenindramayu@forbasi.org', '081367897106', 'Kantor Kabupaten Indramayu', 'admin_pengcab_kabupaten_indramayu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 169),
(127, 'FORBASI Kabupaten Karawang', 'admin.pengcab.kabupatenkarawang@forbasi.org', '081347777819', 'Kantor Kabupaten Karawang', 'admin_pengcab_kabupaten_karawang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 170),
(128, 'FORBASI Kabupaten Kuningan', 'admin.pengcab.kabupatenkuningan@forbasi.org', '081365448645', 'Kantor Kabupaten Kuningan', 'admin_pengcab_kabupaten_kuningan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 171),
(129, 'FORBASI Kabupaten Majalengka', 'admin.pengcab.kabupatenmajalengka@forbasi.org', '081320027321', 'Kantor Kabupaten Majalengka', 'admin_pengcab_kabupaten_majalengka', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 172),
(130, 'FORBASI Kabupaten Pangandaran', 'admin.pengcab.kabupatenpangandaran@forbasi.org', '081333398751', 'Kantor Kabupaten Pangandaran', 'admin_pengcab_kabupaten_pangandaran', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 173),
(131, 'FORBASI Kabupaten Purwakarta', 'admin.pengcab.kabupatenpurwakarta@forbasi.org', '081384324608', 'Kantor Kabupaten Purwakarta', 'admin_pengcab_kabupaten_purwakarta', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 174),
(132, 'FORBASI Kabupaten Subang', 'admin.pengcab.kabupatensubang@forbasi.org', '081339232616', 'Kantor Kabupaten Subang', 'admin_pengcab_kabupaten_subang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 175),
(133, 'FORBASI Kabupaten Sukabumi', 'admin.pengcab.kabupatensukabumi@forbasi.org', '081379528263', 'Kantor Kabupaten Sukabumi', 'admin_pengcab_kabupaten_sukabumi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 176),
(134, 'FORBASI Kabupaten Sumedang', 'admin.pengcab.kabupatensumedang@forbasi.org', '081370685639', 'Kantor Kabupaten Sumedang', 'admin_pengcab_kabupaten_sumedang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 177),
(135, 'FORBASI Kabupaten Tasikmalaya', 'admin.pengcab.kabupatentasikmalaya@forbasi.org', '081384596114', 'Kantor Kabupaten Tasikmalaya', 'admin_pengcab_kabupaten_tasikmalaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 178),
(136, 'FORBASI Kota Bandung', 'admin.pengcab.kotabandung@forbasi.org', '081346158747', 'Kantor Kota Bandung', 'admin_pengcab_kota_bandung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 179),
(137, 'FORBASI Kota Banjar', 'admin.pengcab.kotabanjar@forbasi.org', '081369671081', 'Kantor Kota Banjar', 'admin_pengcab_kota_banjar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 180),
(138, 'FORBASI Kota Bekasi', 'admin.pengcab.kotabekasi@forbasi.org', '081322636204', 'Kantor Kota Bekasi', 'admin_pengcab_kota_bekasi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 181),
(139, 'FORBASI Kota Bogor', 'admin.pengcab.kotabogor@forbasi.org', '081374664045', 'Kantor Kota Bogor', 'admin_pengcab_kota_bogor', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 182),
(140, 'FORBASI Kota Cimahi', 'admin.pengcab.kotacimahi@forbasi.org', '081351617943', 'Kantor Kota Cimahi', 'admin_pengcab_kota_cimahi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 183),
(141, 'FORBASI Kota Cirebon', 'admin.pengcab.kotacirebon@forbasi.org', '081339131647', 'Kantor Kota Cirebon', 'admin_pengcab_kota_cirebon', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 184),
(142, 'FORBASI Kota Depok', 'admin.pengcab.kotadepok@forbasi.org', '081332250321', 'Kantor Kota Depok', 'admin_pengcab_kota_depok', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 185),
(143, 'FORBASI Kota Sukabumi', 'admin.pengcab.kotasukabumi@forbasi.org', '081345616898', 'Kantor Kota Sukabumi', 'admin_pengcab_kota_sukabumi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 186),
(144, 'FORBASI Kota Tasikmalaya', 'admin.pengcab.kotatasikmalaya@forbasi.org', '081374513858', 'Kantor Kota Tasikmalaya', 'admin_pengcab_kota_tasikmalaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 12, 187),
(145, 'FORBASI Kabupaten Banjarnegara', 'admin.pengcab.kabupatenbanjarnegara@forbasi.org', '081373059910', 'Kantor Kabupaten Banjarnegara', 'admin_pengcab_kabupaten_banjarnegara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 188),
(146, 'FORBASI Kabupaten Banyumas', 'admin.pengcab.kabupatenbanyumas@forbasi.org', '081360485182', 'Kantor Kabupaten Banyumas', 'admin_pengcab_kabupaten_banyumas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 189),
(147, 'FORBASI Kabupaten Batang', 'admin.pengcab.kabupatenbatang@forbasi.org', '081369602143', 'Kantor Kabupaten Batang', 'admin_pengcab_kabupaten_batang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 190),
(148, 'FORBASI Kabupaten Blora', 'admin.pengcab.kabupatenblora@forbasi.org', '081323900428', 'Kantor Kabupaten Blora', 'admin_pengcab_kabupaten_blora', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 191),
(149, 'FORBASI Kabupaten Boyolali', 'admin.pengcab.kabupatenboyolali@forbasi.org', '081392108949', 'Kantor Kabupaten Boyolali', 'admin_pengcab_kabupaten_boyolali', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 192),
(150, 'FORBASI Kabupaten Brebes', 'admin.pengcab.kabupatenbrebes@forbasi.org', '081367392645', 'Kantor Kabupaten Brebes', 'admin_pengcab_kabupaten_brebes', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 193),
(151, 'FORBASI Kabupaten Cilacap', 'admin.pengcab.kabupatencilacap@forbasi.org', '081390958688', 'Kantor Kabupaten Cilacap', 'admin_pengcab_kabupaten_cilacap', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 194),
(152, 'FORBASI Kabupaten Demak', 'admin.pengcab.kabupatendemak@forbasi.org', '081378968138', 'Kantor Kabupaten Demak', 'admin_pengcab_kabupaten_demak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 195),
(153, 'FORBASI Kabupaten Grobogan', 'admin.pengcab.kabupatengrobogan@forbasi.org', '081315837054', 'Kantor Kabupaten Grobogan', 'admin_pengcab_kabupaten_grobogan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 196),
(154, 'FORBASI Kabupaten Jepara', 'admin.pengcab.kabupatenjepara@forbasi.org', '081357140386', 'Kantor Kabupaten Jepara', 'admin_pengcab_kabupaten_jepara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 197),
(155, 'FORBASI Kabupaten Karanganyar', 'admin.pengcab.kabupatenkaranganyar@forbasi.org', '081389655875', 'Kantor Kabupaten Karanganyar', 'admin_pengcab_kabupaten_karanganyar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 198),
(156, 'FORBASI Kabupaten Kebumen', 'admin.pengcab.kabupatenkebumen@forbasi.org', '081315715537', 'Kantor Kabupaten Kebumen', 'admin_pengcab_kabupaten_kebumen', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 199),
(157, 'FORBASI Kabupaten Kendal', 'admin.pengcab.kabupatenkendal@forbasi.org', '081338114482', 'Kantor Kabupaten Kendal', 'admin_pengcab_kabupaten_kendal', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 200),
(158, 'FORBASI Kabupaten Klaten', 'admin.pengcab.kabupatenklaten@forbasi.org', '081318766817', 'Kantor Kabupaten Klaten', 'admin_pengcab_kabupaten_klaten', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 201),
(159, 'FORBASI Kabupaten Kudus', 'admin.pengcab.kabupatenkudus@forbasi.org', '081362856310', 'Kantor Kabupaten Kudus', 'admin_pengcab_kabupaten_kudus', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 202),
(160, 'FORBASI Kabupaten Magelang', 'admin.pengcab.kabupatenmagelang@forbasi.org', '081365255094', 'Kantor Kabupaten Magelang', 'admin_pengcab_kabupaten_magelang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 203),
(161, 'FORBASI Kabupaten Pati', 'admin.pengcab.kabupatenpati@forbasi.org', '081325368042', 'Kantor Kabupaten Pati', 'admin_pengcab_kabupaten_pati', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 204),
(162, 'FORBASI Kabupaten Pekalongan', 'admin.pengcab.kabupatenpekalongan@forbasi.org', '081344220394', 'Kantor Kabupaten Pekalongan', 'admin_pengcab_kabupaten_pekalongan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 205),
(163, 'FORBASI Kabupaten Pemalang', 'admin.pengcab.kabupatenpemalang@forbasi.org', '081355483011', 'Kantor Kabupaten Pemalang', 'admin_pengcab_kabupaten_pemalang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 206),
(164, 'FORBASI Kabupaten Purbalingga', 'admin.pengcab.kabupatenpurbalingga@forbasi.org', '081365820407', 'Kantor Kabupaten Purbalingga', 'admin_pengcab_kabupaten_purbalingga', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 207),
(165, 'FORBASI Kabupaten Purworejo', 'admin.pengcab.kabupatenpurworejo@forbasi.org', '081352803154', 'Kantor Kabupaten Purworejo', 'admin_pengcab_kabupaten_purworejo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 208),
(166, 'FORBASI Kabupaten Rembang', 'admin.pengcab.kabupatenrembang@forbasi.org', '081393055707', 'Kantor Kabupaten Rembang', 'admin_pengcab_kabupaten_rembang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 209),
(167, 'FORBASI Kabupaten Semarang', 'admin.pengcab.kabupatensemarang@forbasi.org', '081338216548', 'Kantor Kabupaten Semarang', 'admin_pengcab_kabupaten_semarang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 210),
(168, 'FORBASI Kabupaten Sragen', 'admin.pengcab.kabupatensragen@forbasi.org', '081327823229', 'Kantor Kabupaten Sragen', 'admin_pengcab_kabupaten_sragen', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 211),
(169, 'FORBASI Kabupaten Sukoharjo', 'admin.pengcab.kabupatensukoharjo@forbasi.org', '081313058340', 'Kantor Kabupaten Sukoharjo', 'admin_pengcab_kabupaten_sukoharjo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 212),
(170, 'FORBASI Kabupaten Tegal', 'admin.pengcab.kabupatentegal@forbasi.org', '081343351895', 'Kantor Kabupaten Tegal', 'admin_pengcab_kabupaten_tegal', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 213),
(171, 'FORBASI Kabupaten Temanggung', 'admin.pengcab.kabupatentemanggung@forbasi.org', '081328543405', 'Kantor Kabupaten Temanggung', 'admin_pengcab_kabupaten_temanggung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 214),
(172, 'FORBASI Kabupaten Wonogiri', 'admin.pengcab.kabupatenwonogiri@forbasi.org', '081345781993', 'Kantor Kabupaten Wonogiri', 'admin_pengcab_kabupaten_wonogiri', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 215),
(173, 'FORBASI Kabupaten Wonosobo', 'admin.pengcab.kabupatenwonosobo@forbasi.org', '081316159386', 'Kantor Kabupaten Wonosobo', 'admin_pengcab_kabupaten_wonosobo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 216),
(174, 'FORBASI Kota Magelang', 'admin.pengcab.kotamagelang@forbasi.org', '081399658325', 'Kantor Kota Magelang', 'admin_pengcab_kota_magelang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 217),
(175, 'FORBASI Kota Pekalongan', 'admin.pengcab.kotapekalongan@forbasi.org', '081396634545', 'Kantor Kota Pekalongan', 'admin_pengcab_kota_pekalongan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 218),
(176, 'FORBASI Kota Salatiga', 'admin.pengcab.kotasalatiga@forbasi.org', '081312632429', 'Kantor Kota Salatiga', 'admin_pengcab_kota_salatiga', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 219),
(177, 'FORBASI Kota Semarang', 'admin.pengcab.kotasemarang@forbasi.org', '081358114272', 'Kantor Kota Semarang', 'admin_pengcab_kota_semarang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 220);
INSERT INTO `users` (`id`, `club_name`, `email`, `phone`, `address`, `username`, `password`, `role_id`, `is_active`, `created_at`, `updated_at`, `province_id`, `city_id`) VALUES
(178, 'FORBASI Kota Surakarta', 'admin.pengcab.kotasurakarta@forbasi.org', '081336609735', 'Kantor Kota Surakarta', 'admin_pengcab_kota_surakarta', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 221),
(179, 'FORBASI Kota Tegal', 'admin.pengcab.kotategal@forbasi.org', '081328976770', 'Kantor Kota Tegal', 'admin_pengcab_kota_tegal', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 13, 222),
(180, 'FORBASI Kabupaten Bangkalan', 'admin.pengcab.kabupatenbangkalan@forbasi.org', '081337162111', 'Kantor Kabupaten Bangkalan', 'admin_pengcab_kabupaten_bangkalan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 228),
(181, 'FORBASI Kabupaten Banyuwangi', 'admin.pengcab.kabupatenbanyuwangi@forbasi.org', '081370416747', 'Kantor Kabupaten Banyuwangi', 'admin_pengcab_kabupaten_banyuwangi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 229),
(182, 'FORBASI Kabupaten Blitar', 'admin.pengcab.kabupatenblitar@forbasi.org', '081360699700', 'Kantor Kabupaten Blitar', 'admin_pengcab_kabupaten_blitar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 230),
(183, 'FORBASI Kabupaten Bojonegoro', 'admin.pengcab.kabupatenbojonegoro@forbasi.org', '081337969735', 'Kantor Kabupaten Bojonegoro', 'admin_pengcab_kabupaten_bojonegoro', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 231),
(184, 'FORBASI Kabupaten Bondowoso', 'admin.pengcab.kabupatenbondowoso@forbasi.org', '081321789606', 'Kantor Kabupaten Bondowoso', 'admin_pengcab_kabupaten_bondowoso', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 232),
(185, 'FORBASI Kabupaten Gresik', 'admin.pengcab.kabupatengresik@forbasi.org', '081340851459', 'Kantor Kabupaten Gresik', 'admin_pengcab_kabupaten_gresik', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 233),
(186, 'FORBASI Kabupaten Jember', 'admin.pengcab.kabupatenjember@forbasi.org', '081318437719', 'Kantor Kabupaten Jember', 'admin_pengcab_kabupaten_jember', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 234),
(187, 'FORBASI Kabupaten Jombang', 'admin.pengcab.kabupatenjombang@forbasi.org', '081387140725', 'Kantor Kabupaten Jombang', 'admin_pengcab_kabupaten_jombang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 235),
(188, 'FORBASI Kabupaten Kediri', 'admin.pengcab.kabupatenkediri@forbasi.org', '081376572639', 'Kantor Kabupaten Kediri', 'admin_pengcab_kabupaten_kediri', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 236),
(189, 'FORBASI Kabupaten Lamongan', 'admin.pengcab.kabupatenlamongan@forbasi.org', '081325849427', 'Kantor Kabupaten Lamongan', 'admin_pengcab_kabupaten_lamongan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 237),
(190, 'FORBASI Kabupaten Lumajang', 'admin.pengcab.kabupatenlumajang@forbasi.org', '081343198917', 'Kantor Kabupaten Lumajang', 'admin_pengcab_kabupaten_lumajang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 238),
(191, 'FORBASI Kabupaten Madiun', 'admin.pengcab.kabupatenmadiun@forbasi.org', '081384229298', 'Kantor Kabupaten Madiun', 'admin_pengcab_kabupaten_madiun', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 239),
(192, 'FORBASI Kabupaten Magetan', 'admin.pengcab.kabupatenmagetan@forbasi.org', '081361686765', 'Kantor Kabupaten Magetan', 'admin_pengcab_kabupaten_magetan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 240),
(193, 'FORBASI Kabupaten Malang', 'admin.pengcab.kabupatenmalang@forbasi.org', '081333861558', 'Kantor Kabupaten Malang', 'admin_pengcab_kabupaten_malang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 241),
(194, 'FORBASI Kabupaten Mojokerto', 'admin.pengcab.kabupatenmojokerto@forbasi.org', '081377416143', 'Kantor Kabupaten Mojokerto', 'admin_pengcab_kabupaten_mojokerto', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 242),
(195, 'FORBASI Kabupaten Nganjuk', 'admin.pengcab.kabupatennganjuk@forbasi.org', '081348212539', 'Kantor Kabupaten Nganjuk', 'admin_pengcab_kabupaten_nganjuk', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 243),
(196, 'FORBASI Kabupaten Ngawi', 'admin.pengcab.kabupatenngawi@forbasi.org', '081311523655', 'Kantor Kabupaten Ngawi', 'admin_pengcab_kabupaten_ngawi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 244),
(197, 'FORBASI Kabupaten Pacitan', 'admin.pengcab.kabupatenpacitan@forbasi.org', '081335222772', 'Kantor Kabupaten Pacitan', 'admin_pengcab_kabupaten_pacitan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 245),
(198, 'FORBASI Kabupaten Pamekasan', 'admin.pengcab.kabupatenpamekasan@forbasi.org', '081368929908', 'Kantor Kabupaten Pamekasan', 'admin_pengcab_kabupaten_pamekasan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 246),
(199, 'FORBASI Kabupaten Pasuruan', 'admin.pengcab.kabupatenpasuruan@forbasi.org', '081367620877', 'Kantor Kabupaten Pasuruan', 'admin_pengcab_kabupaten_pasuruan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 247),
(200, 'FORBASI Kabupaten Ponorogo', 'admin.pengcab.kabupatenponorogo@forbasi.org', '081354654872', 'Kantor Kabupaten Ponorogo', 'admin_pengcab_kabupaten_ponorogo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 248),
(201, 'FORBASI Kabupaten Probolinggo', 'admin.pengcab.kabupatenprobolinggo@forbasi.org', '081319823527', 'Kantor Kabupaten Probolinggo', 'admin_pengcab_kabupaten_probolinggo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 249),
(202, 'FORBASI Kabupaten Sampang', 'admin.pengcab.kabupatensampang@forbasi.org', '081311473770', 'Kantor Kabupaten Sampang', 'admin_pengcab_kabupaten_sampang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 250),
(203, 'FORBASI Kabupaten Sidoarjo', 'admin.pengcab.kabupatensidoarjo@forbasi.org', '081335427127', 'Kantor Kabupaten Sidoarjo', 'admin_pengcab_kabupaten_sidoarjo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 251),
(204, 'FORBASI Kabupaten Situbondo', 'admin.pengcab.kabupatensitubondo@forbasi.org', '081355411269', 'Kantor Kabupaten Situbondo', 'admin_pengcab_kabupaten_situbondo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 252),
(205, 'FORBASI Kabupaten Sumenep', 'admin.pengcab.kabupatensumenep@forbasi.org', '081330193953', 'Kantor Kabupaten Sumenep', 'admin_pengcab_kabupaten_sumenep', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 253),
(206, 'FORBASI Kabupaten Trenggalek', 'admin.pengcab.kabupatentrenggalek@forbasi.org', '081365560825', 'Kantor Kabupaten Trenggalek', 'admin_pengcab_kabupaten_trenggalek', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 254),
(207, 'FORBASI Kabupaten Tuban', 'admin.pengcab.kabupatentuban@forbasi.org', '081375507949', 'Kantor Kabupaten Tuban', 'admin_pengcab_kabupaten_tuban', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:15', '2025-06-06 07:29:15', 15, 255),
(208, 'FORBASI Kabupaten Tulungagung', 'admin.pengcab.kabupatentulungagung@forbasi.org', '081320830135', 'Kantor Kabupaten Tulungagung', 'admin_pengcab_kabupaten_tulungagung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 256),
(209, 'FORBASI Kota Batu', 'admin.pengcab.kotabatu@forbasi.org', '081399439410', 'Kantor Kota Batu', 'admin_pengcab_kota_batu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 257),
(210, 'FORBASI Kota Blitar', 'admin.pengcab.kotablitar@forbasi.org', '081337596901', 'Kantor Kota Blitar', 'admin_pengcab_kota_blitar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 258),
(211, 'FORBASI Kota Kediri', 'admin.pengcab.kotakediri@forbasi.org', '081393541504', 'Kantor Kota Kediri', 'admin_pengcab_kota_kediri', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 259),
(212, 'FORBASI Kota Madiun', 'admin.pengcab.kotamadiun@forbasi.org', '081335405044', 'Kantor Kota Madiun', 'admin_pengcab_kota_madiun', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 260),
(213, 'FORBASI Kota Malang', 'admin.pengcab.kotamalang@forbasi.org', '081350734628', 'Kantor Kota Malang', 'admin_pengcab_kota_malang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 261),
(214, 'FORBASI Kota Mojokerto', 'admin.pengcab.kotamojokerto@forbasi.org', '081356493041', 'Kantor Kota Mojokerto', 'admin_pengcab_kota_mojokerto', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 262),
(215, 'FORBASI Kota Pasuruan', 'admin.pengcab.kotapasuruan@forbasi.org', '081381649501', 'Kantor Kota Pasuruan', 'admin_pengcab_kota_pasuruan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 263),
(216, 'FORBASI Kota Probolinggo', 'admin.pengcab.kotaprobolinggo@forbasi.org', '081332068990', 'Kantor Kota Probolinggo', 'admin_pengcab_kota_probolinggo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 264),
(217, 'FORBASI Kota Surabaya', 'admin.pengcab.kotasurabaya@forbasi.org', '081310011393', 'Kantor Kota Surabaya', 'admin_pengcab_kota_surabaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 15, 265),
(218, 'FORBASI Kabupaten Bengkayang', 'admin.pengcab.kabupatenbengkayang@forbasi.org', '081359181064', 'Kantor Kabupaten Bengkayang', 'admin_pengcab_kabupaten_bengkayang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 315),
(219, 'FORBASI Kabupaten Kapuas Hulu', 'admin.pengcab.kabupatenkapuashulu@forbasi.org', '081353407591', 'Kantor Kabupaten Kapuas Hulu', 'admin_pengcab_kabupaten_kapuas_hulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 316),
(220, 'FORBASI Kabupaten Kayong Utara', 'admin.pengcab.kabupatenkayongutara@forbasi.org', '081315437416', 'Kantor Kabupaten Kayong Utara', 'admin_pengcab_kabupaten_kayong_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 317),
(221, 'FORBASI Kabupaten Ketapang', 'admin.pengcab.kabupatenketapang@forbasi.org', '081313821288', 'Kantor Kabupaten Ketapang', 'admin_pengcab_kabupaten_ketapang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 318),
(222, 'FORBASI Kabupaten Kubu Raya', 'admin.pengcab.kabupatenkuburaya@forbasi.org', '081330052436', 'Kantor Kabupaten Kubu Raya', 'admin_pengcab_kabupaten_kubu_raya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 319),
(223, 'FORBASI Kabupaten Landak', 'admin.pengcab.kabupatenlandak@forbasi.org', '081360357432', 'Kantor Kabupaten Landak', 'admin_pengcab_kabupaten_landak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 320),
(224, 'FORBASI Kabupaten Melawi', 'admin.pengcab.kabupatenmelawi@forbasi.org', '081395179514', 'Kantor Kabupaten Melawi', 'admin_pengcab_kabupaten_melawi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 321),
(225, 'FORBASI Kabupaten Mempawah', 'admin.pengcab.kabupatenmempawah@forbasi.org', '081360062276', 'Kantor Kabupaten Mempawah', 'admin_pengcab_kabupaten_mempawah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 322),
(226, 'FORBASI Kabupaten Sambas', 'admin.pengcab.kabupatensambas@forbasi.org', '081370358278', 'Kantor Kabupaten Sambas', 'admin_pengcab_kabupaten_sambas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 323),
(227, 'FORBASI Kabupaten Sanggau', 'admin.pengcab.kabupatensanggau@forbasi.org', '081349293722', 'Kantor Kabupaten Sanggau', 'admin_pengcab_kabupaten_sanggau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 324),
(228, 'FORBASI Kabupaten Sekadau', 'admin.pengcab.kabupatensekadau@forbasi.org', '081397052580', 'Kantor Kabupaten Sekadau', 'admin_pengcab_kabupaten_sekadau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 325),
(229, 'FORBASI Kabupaten Sintang', 'admin.pengcab.kabupatensintang@forbasi.org', '081373727404', 'Kantor Kabupaten Sintang', 'admin_pengcab_kabupaten_sintang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 326),
(230, 'FORBASI Kota Pontianak', 'admin.pengcab.kotapontianak@forbasi.org', '081396856075', 'Kantor Kota Pontianak', 'admin_pengcab_kota_pontianak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 327),
(231, 'FORBASI Kota Singkawang', 'admin.pengcab.kotasingkawang@forbasi.org', '081382211412', 'Kantor Kota Singkawang', 'admin_pengcab_kota_singkawang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 20, 328),
(232, 'FORBASI Kabupaten Balangan', 'admin.pengcab.kabupatenbalangan@forbasi.org', '081368478462', 'Kantor Kabupaten Balangan', 'admin_pengcab_kabupaten_balangan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 343),
(233, 'FORBASI Kabupaten Banjar', 'admin.pengcab.kabupatenbanjar@forbasi.org', '081344584494', 'Kantor Kabupaten Banjar', 'admin_pengcab_kabupaten_banjar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 344),
(234, 'FORBASI Kabupaten Barito Kuala', 'admin.pengcab.kabupatenbaritokuala@forbasi.org', '081342400655', 'Kantor Kabupaten Barito Kuala', 'admin_pengcab_kabupaten_barito_kuala', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 345),
(235, 'FORBASI Kabupaten Hulu Sungai Selatan', 'admin.pengcab.kabupatenhulusungaiselatan@forbasi.org', '081310735783', 'Kantor Kabupaten Hulu Sungai Selatan', 'admin_pengcab_kabupaten_hulu_sungai_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 346),
(236, 'FORBASI Kabupaten Hulu Sungai Tengah', 'admin.pengcab.kabupatenhulusungaitengah@forbasi.org', '081394123980', 'Kantor Kabupaten Hulu Sungai Tengah', 'admin_pengcab_kabupaten_hulu_sungai_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 347),
(237, 'FORBASI Kabupaten Hulu Sungai Utara', 'admin.pengcab.kabupatenhulusungaiutara@forbasi.org', '081323606340', 'Kantor Kabupaten Hulu Sungai Utara', 'admin_pengcab_kabupaten_hulu_sungai_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 348),
(238, 'FORBASI Kabupaten Kotabaru', 'admin.pengcab.kabupatenkotabaru@forbasi.org', '081325377541', 'Kantor Kabupaten Kotabaru', 'admin_pengcab_kabupaten_kotabaru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 349),
(239, 'FORBASI Kabupaten Tabalong', 'admin.pengcab.kabupatentabalong@forbasi.org', '081333540280', 'Kantor Kabupaten Tabalong', 'admin_pengcab_kabupaten_tabalong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 350),
(240, 'FORBASI Kabupaten Tanah Bumbu', 'admin.pengcab.kabupatentanahbumbu@forbasi.org', '081319012683', 'Kantor Kabupaten Tanah Bumbu', 'admin_pengcab_kabupaten_tanah_bumbu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 351),
(241, 'FORBASI Kabupaten Tanah Laut', 'admin.pengcab.kabupatentanahlaut@forbasi.org', '081340207446', 'Kantor Kabupaten Tanah Laut', 'admin_pengcab_kabupaten_tanah_laut', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 352),
(242, 'FORBASI Kabupaten Tapin', 'admin.pengcab.kabupatentapin@forbasi.org', '081312826706', 'Kantor Kabupaten Tapin', 'admin_pengcab_kabupaten_tapin', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 353),
(243, 'FORBASI Kota Banjarbaru', 'admin.pengcab.kotabanjarbaru@forbasi.org', '081380131926', 'Kantor Kota Banjarbaru', 'admin_pengcab_kota_banjarbaru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 354),
(244, 'FORBASI Kota Banjarmasin', 'admin.pengcab.kotabanjarmasin@forbasi.org', '081392558091', 'Kantor Kota Banjarmasin', 'admin_pengcab_kota_banjarmasin', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 22, 355),
(245, 'FORBASI Kabupaten Barito Selatan', 'admin.pengcab.kabupatenbaritoselatan@forbasi.org', '081331658782', 'Kantor Kabupaten Barito Selatan', 'admin_pengcab_kabupaten_barito_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 329),
(246, 'FORBASI Kabupaten Barito Timur', 'admin.pengcab.kabupatenbaritotimur@forbasi.org', '081364772018', 'Kantor Kabupaten Barito Timur', 'admin_pengcab_kabupaten_barito_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 330),
(247, 'FORBASI Kabupaten Barito Utara', 'admin.pengcab.kabupatenbaritoutara@forbasi.org', '081370008634', 'Kantor Kabupaten Barito Utara', 'admin_pengcab_kabupaten_barito_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 331),
(248, 'FORBASI Kabupaten Gunung Mas', 'admin.pengcab.kabupatengunungmas@forbasi.org', '081370374779', 'Kantor Kabupaten Gunung Mas', 'admin_pengcab_kabupaten_gunung_mas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 332),
(249, 'FORBASI Kabupaten Kapuas', 'admin.pengcab.kabupatenkapuas@forbasi.org', '081314828324', 'Kantor Kabupaten Kapuas', 'admin_pengcab_kabupaten_kapuas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 333),
(250, 'FORBASI Kabupaten Katingan', 'admin.pengcab.kabupatenkatingan@forbasi.org', '081356679767', 'Kantor Kabupaten Katingan', 'admin_pengcab_kabupaten_katingan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 334),
(251, 'FORBASI Kabupaten Kotawaringin Barat', 'admin.pengcab.kabupatenkotawaringinbarat@forbasi.org', '081395187629', 'Kantor Kabupaten Kotawaringin Barat', 'admin_pengcab_kabupaten_kotawaringin_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 335),
(252, 'FORBASI Kabupaten Kotawaringin Timur', 'admin.pengcab.kabupatenkotawaringintimur@forbasi.org', '081317715043', 'Kantor Kabupaten Kotawaringin Timur', 'admin_pengcab_kabupaten_kotawaringin_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 336),
(253, 'FORBASI Kabupaten Lamandau', 'admin.pengcab.kabupatenlamandau@forbasi.org', '081365730596', 'Kantor Kabupaten Lamandau', 'admin_pengcab_kabupaten_lamandau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 337),
(254, 'FORBASI Kabupaten Murung Raya', 'admin.pengcab.kabupatenmurungraya@forbasi.org', '081386690649', 'Kantor Kabupaten Murung Raya', 'admin_pengcab_kabupaten_murung_raya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 338),
(255, 'FORBASI Kabupaten Pulang Pisau', 'admin.pengcab.kabupatenpulangpisau@forbasi.org', '081344091902', 'Kantor Kabupaten Pulang Pisau', 'admin_pengcab_kabupaten_pulang_pisau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 339),
(256, 'FORBASI Kabupaten Seruyan', 'admin.pengcab.kabupatenseruyan@forbasi.org', '081315437300', 'Kantor Kabupaten Seruyan', 'admin_pengcab_kabupaten_seruyan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 340),
(257, 'FORBASI Kabupaten Sukamara', 'admin.pengcab.kabupatensukamara@forbasi.org', '081329807043', 'Kantor Kabupaten Sukamara', 'admin_pengcab_kabupaten_sukamara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 341),
(258, 'FORBASI Kota Palangka Raya', 'admin.pengcab.kotapalangkaraya@forbasi.org', '081334483742', 'Kantor Kota Palangka Raya', 'admin_pengcab_kota_palangka_raya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 21, 342),
(259, 'FORBASI Kabupaten Berau', 'admin.pengcab.kabupatenberau@forbasi.org', '081365298965', 'Kantor Kabupaten Berau', 'admin_pengcab_kabupaten_berau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 356),
(260, 'FORBASI Kabupaten Kutai Barat', 'admin.pengcab.kabupatenkutaibarat@forbasi.org', '081328475110', 'Kantor Kabupaten Kutai Barat', 'admin_pengcab_kabupaten_kutai_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 357),
(261, 'FORBASI Kabupaten Kutai Kartanegara', 'admin.pengcab.kabupatenkutaikartanegara@forbasi.org', '081353912508', 'Kantor Kabupaten Kutai Kartanegara', 'admin_pengcab_kabupaten_kutai_kartanegara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 358),
(262, 'FORBASI Kabupaten Kutai Timur', 'admin.pengcab.kabupatenkutaitimur@forbasi.org', '081357727919', 'Kantor Kabupaten Kutai Timur', 'admin_pengcab_kabupaten_kutai_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 359),
(263, 'FORBASI Kabupaten Mahakam Ulu', 'admin.pengcab.kabupatenmahakamulu@forbasi.org', '081362261657', 'Kantor Kabupaten Mahakam Ulu', 'admin_pengcab_kabupaten_mahakam_ulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 360),
(264, 'FORBASI Kabupaten Paser', 'admin.pengcab.kabupatenpaser@forbasi.org', '081357404722', 'Kantor Kabupaten Paser', 'admin_pengcab_kabupaten_paser', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 361),
(265, 'FORBASI Kabupaten Penajam Paser Utara', 'admin.pengcab.kabupatenpenajampaserutara@forbasi.org', '081360799778', 'Kantor Kabupaten Penajam Paser Utara', 'admin_pengcab_kabupaten_penajam_paser_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 362),
(266, 'FORBASI Kota Balikpapan', 'admin.pengcab.kotabalikpapan@forbasi.org', '081398014997', 'Kantor Kota Balikpapan', 'admin_pengcab_kota_balikpapan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 363),
(267, 'FORBASI Kota Bontang', 'admin.pengcab.kotabontang@forbasi.org', '081319397357', 'Kantor Kota Bontang', 'admin_pengcab_kota_bontang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 364),
(268, 'FORBASI Kota Samarinda', 'admin.pengcab.kotasamarinda@forbasi.org', '081368603818', 'Kantor Kota Samarinda', 'admin_pengcab_kota_samarinda', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 23, 365),
(269, 'FORBASI Kabupaten Bulungan', 'admin.pengcab.kabupatenbulungan@forbasi.org', '081314612478', 'Kantor Kabupaten Bulungan', 'admin_pengcab_kabupaten_bulungan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 24, 366),
(270, 'FORBASI Kabupaten Malinau', 'admin.pengcab.kabupatenmalinau@forbasi.org', '081387106176', 'Kantor Kabupaten Malinau', 'admin_pengcab_kabupaten_malinau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 24, 367),
(271, 'FORBASI Kabupaten Nunukan', 'admin.pengcab.kabupatennunukan@forbasi.org', '081377813043', 'Kantor Kabupaten Nunukan', 'admin_pengcab_kabupaten_nunukan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 24, 368),
(272, 'FORBASI Kabupaten Tana Tidung', 'admin.pengcab.kabupatentanatidung@forbasi.org', '081346169878', 'Kantor Kabupaten Tana Tidung', 'admin_pengcab_kabupaten_tana_tidung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 24, 369),
(273, 'FORBASI Kota Tarakan', 'admin.pengcab.kotatarakan@forbasi.org', '081335064773', 'Kantor Kota Tarakan', 'admin_pengcab_kota_tarakan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 24, 370),
(274, 'FORBASI Kabupaten Bangka', 'admin.pengcab.kabupatenbangka@forbasi.org', '081359302332', 'Kantor Kabupaten Bangka', 'admin_pengcab_kabupaten_bangka', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 141),
(275, 'FORBASI Kabupaten Bangka Barat', 'admin.pengcab.kabupatenbangkabarat@forbasi.org', '081360598702', 'Kantor Kabupaten Bangka Barat', 'admin_pengcab_kabupaten_bangka_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 142),
(276, 'FORBASI Kabupaten Bangka Selatan', 'admin.pengcab.kabupatenbangkaselatan@forbasi.org', '081325781034', 'Kantor Kabupaten Bangka Selatan', 'admin_pengcab_kabupaten_bangka_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 143),
(277, 'FORBASI Kabupaten Bangka Tengah', 'admin.pengcab.kabupatenbangkatengah@forbasi.org', '081318676334', 'Kantor Kabupaten Bangka Tengah', 'admin_pengcab_kabupaten_bangka_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 144),
(278, 'FORBASI Kabupaten Belitung', 'admin.pengcab.kabupatenbelitung@forbasi.org', '081329861282', 'Kantor Kabupaten Belitung', 'admin_pengcab_kabupaten_belitung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 145),
(279, 'FORBASI Kabupaten Belitung Timur', 'admin.pengcab.kabupatenbelitungtimur@forbasi.org', '081357439239', 'Kantor Kabupaten Belitung Timur', 'admin_pengcab_kabupaten_belitung_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 146),
(280, 'FORBASI Kota Pangkal Pinang', 'admin.pengcab.kotapangkalpinang@forbasi.org', '081392713225', 'Kantor Kota Pangkal Pinang', 'admin_pengcab_kota_pangkal_pinang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 9, 147),
(281, 'FORBASI Kabupaten Bintan', 'admin.pengcab.kabupatenbintan@forbasi.org', '081317762607', 'Kantor Kabupaten Bintan', 'admin_pengcab_kabupaten_bintan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 148),
(282, 'FORBASI Kabupaten Karimun', 'admin.pengcab.kabupatenkarimun@forbasi.org', '081314860188', 'Kantor Kabupaten Karimun', 'admin_pengcab_kabupaten_karimun', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 149),
(283, 'FORBASI Kabupaten Kepulauan Anambas', 'admin.pengcab.kabupatenkepulauananambas@forbasi.org', '081358052669', 'Kantor Kabupaten Kepulauan Anambas', 'admin_pengcab_kabupaten_kepulauan_anambas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 150),
(284, 'FORBASI Kabupaten Lingga', 'admin.pengcab.kabupatenlingga@forbasi.org', '081313414107', 'Kantor Kabupaten Lingga', 'admin_pengcab_kabupaten_lingga', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 151),
(285, 'FORBASI Kabupaten Natuna', 'admin.pengcab.kabupatennatuna@forbasi.org', '081343908029', 'Kantor Kabupaten Natuna', 'admin_pengcab_kabupaten_natuna', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 152),
(286, 'FORBASI Kota Batam', 'admin.pengcab.kotabatam@forbasi.org', '081344402593', 'Kantor Kota Batam', 'admin_pengcab_kota_batam', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 153),
(287, 'FORBASI Kota Tanjungpinang', 'admin.pengcab.kotatanjungpinang@forbasi.org', '081331311322', 'Kantor Kota Tanjungpinang', 'admin_pengcab_kota_tanjungpinang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 10, 154),
(288, 'FORBASI Kabupaten Lampung Barat', 'admin.pengcab.kabupatenlampungbarat@forbasi.org', '081344589807', 'Kantor Kabupaten Lampung Barat', 'admin_pengcab_kabupaten_lampung_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 126),
(289, 'FORBASI Kabupaten Lampung Selatan', 'admin.pengcab.kabupatenlampungselatan@forbasi.org', '081322341374', 'Kantor Kabupaten Lampung Selatan', 'admin_pengcab_kabupaten_lampung_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 127),
(290, 'FORBASI Kabupaten Lampung Tengah', 'admin.pengcab.kabupatenlampungtengah@forbasi.org', '081337483686', 'Kantor Kabupaten Lampung Tengah', 'admin_pengcab_kabupaten_lampung_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 128),
(291, 'FORBASI Kabupaten Lampung Timur', 'admin.pengcab.kabupatenlampungtimur@forbasi.org', '081344834797', 'Kantor Kabupaten Lampung Timur', 'admin_pengcab_kabupaten_lampung_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 129),
(292, 'FORBASI Kabupaten Lampung Utara', 'admin.pengcab.kabupatenlampungutara@forbasi.org', '081379544479', 'Kantor Kabupaten Lampung Utara', 'admin_pengcab_kabupaten_lampung_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 130),
(293, 'FORBASI Kabupaten Mesuji', 'admin.pengcab.kabupatenmesuji@forbasi.org', '081347304947', 'Kantor Kabupaten Mesuji', 'admin_pengcab_kabupaten_mesuji', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 131),
(294, 'FORBASI Kabupaten Pesawaran', 'admin.pengcab.kabupatenpesawaran@forbasi.org', '081358141185', 'Kantor Kabupaten Pesawaran', 'admin_pengcab_kabupaten_pesawaran', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 132),
(295, 'FORBASI Kabupaten Pesisir Barat', 'admin.pengcab.kabupatenpesisirbarat@forbasi.org', '081356312353', 'Kantor Kabupaten Pesisir Barat', 'admin_pengcab_kabupaten_pesisir_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 133),
(296, 'FORBASI Kabupaten Pringsewu', 'admin.pengcab.kabupatenpringsewu@forbasi.org', '081323490121', 'Kantor Kabupaten Pringsewu', 'admin_pengcab_kabupaten_pringsewu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 134),
(297, 'FORBASI Kabupaten Tanggamus', 'admin.pengcab.kabupatentanggamus@forbasi.org', '081370857856', 'Kantor Kabupaten Tanggamus', 'admin_pengcab_kabupaten_tanggamus', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 135),
(298, 'FORBASI Kabupaten Tulang Bawang', 'admin.pengcab.kabupatentulangbawang@forbasi.org', '081361013195', 'Kantor Kabupaten Tulang Bawang', 'admin_pengcab_kabupaten_tulang_bawang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 136),
(299, 'FORBASI Kabupaten Tulang Bawang Barat', 'admin.pengcab.kabupatentulangbawangbarat@forbasi.org', '081391564376', 'Kantor Kabupaten Tulang Bawang Barat', 'admin_pengcab_kabupaten_tulang_bawang_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 137),
(300, 'FORBASI Kabupaten Way Kanan', 'admin.pengcab.kabupatenwaykanan@forbasi.org', '081393542278', 'Kantor Kabupaten Way Kanan', 'admin_pengcab_kabupaten_way_kanan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 138),
(301, 'FORBASI Kota Bandar Lampung', 'admin.pengcab.kotabandarlampung@forbasi.org', '081359156108', 'Kantor Kota Bandar Lampung', 'admin_pengcab_kota_bandar_lampung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 139),
(302, 'FORBASI Kota Metro', 'admin.pengcab.kotametro@forbasi.org', '081310268234', 'Kantor Kota Metro', 'admin_pengcab_kota_metro', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 8, 140),
(303, 'FORBASI Kabupaten Buru', 'admin.pengcab.kabupatenburu@forbasi.org', '081380199066', 'Kantor Kabupaten Buru', 'admin_pengcab_kabupaten_buru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 452),
(304, 'FORBASI Kabupaten Buru Selatan', 'admin.pengcab.kabupatenburuselatan@forbasi.org', '081357879294', 'Kantor Kabupaten Buru Selatan', 'admin_pengcab_kabupaten_buru_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 453),
(305, 'FORBASI Kabupaten Kepulauan Aru', 'admin.pengcab.kabupatenkepulauanaru@forbasi.org', '081356104792', 'Kantor Kabupaten Kepulauan Aru', 'admin_pengcab_kabupaten_kepulauan_aru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 454),
(306, 'FORBASI Kabupaten Kepulauan Tanimbar', 'admin.pengcab.kabupatenkepulauantanimbar@forbasi.org', '081324463907', 'Kantor Kabupaten Kepulauan Tanimbar', 'admin_pengcab_kabupaten_kepulauan_tanimbar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 455),
(307, 'FORBASI Kabupaten Maluku Barat Daya', 'admin.pengcab.kabupatenmalukubaratdaya@forbasi.org', '081360699953', 'Kantor Kabupaten Maluku Barat Daya', 'admin_pengcab_kabupaten_maluku_barat_daya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 458),
(308, 'FORBASI Kabupaten Maluku Tengah', 'admin.pengcab.kabupatenmalukutengah@forbasi.org', '081379617027', 'Kantor Kabupaten Maluku Tengah', 'admin_pengcab_kabupaten_maluku_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 456),
(309, 'FORBASI Kabupaten Maluku Tenggara', 'admin.pengcab.kabupatenmalukutenggara@forbasi.org', '081312546292', 'Kantor Kabupaten Maluku Tenggara', 'admin_pengcab_kabupaten_maluku_tenggara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 457),
(310, 'FORBASI Kabupaten Seram Bagian Barat', 'admin.pengcab.kabupatenserambagianbarat@forbasi.org', '081398235658', 'Kantor Kabupaten Seram Bagian Barat', 'admin_pengcab_kabupaten_seram_bagian_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 459),
(311, 'FORBASI Kabupaten Seram Bagian Timur', 'admin.pengcab.kabupatenserambagiantimur@forbasi.org', '081332552611', 'Kantor Kabupaten Seram Bagian Timur', 'admin_pengcab_kabupaten_seram_bagian_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 460),
(312, 'FORBASI Kota Ambon', 'admin.pengcab.kotaambon@forbasi.org', '081310647170', 'Kantor Kota Ambon', 'admin_pengcab_kota_ambon', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 461),
(313, 'FORBASI Kota Tual', 'admin.pengcab.kotatual@forbasi.org', '081361773174', 'Kantor Kota Tual', 'admin_pengcab_kota_tual', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 31, 462),
(314, 'FORBASI Kabupaten Halmahera Barat', 'admin.pengcab.kabupatenhalmaherabarat@forbasi.org', '081353035429', 'Kantor Kabupaten Halmahera Barat', 'admin_pengcab_kabupaten_halmahera_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 463),
(315, 'FORBASI Kabupaten Halmahera Selatan', 'admin.pengcab.kabupatenhalmaheraselatan@forbasi.org', '081398959051', 'Kantor Kabupaten Halmahera Selatan', 'admin_pengcab_kabupaten_halmahera_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 464),
(316, 'FORBASI Kabupaten Halmahera Tengah', 'admin.pengcab.kabupatenhalmaheratengah@forbasi.org', '081358541372', 'Kantor Kabupaten Halmahera Tengah', 'admin_pengcab_kabupaten_halmahera_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 465),
(317, 'FORBASI Kabupaten Halmahera Timur', 'admin.pengcab.kabupatenhalmaheratimur@forbasi.org', '081315710625', 'Kantor Kabupaten Halmahera Timur', 'admin_pengcab_kabupaten_halmahera_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 466),
(318, 'FORBASI Kabupaten Halmahera Utara', 'admin.pengcab.kabupatenhalmaherautara@forbasi.org', '081397574756', 'Kantor Kabupaten Halmahera Utara', 'admin_pengcab_kabupaten_halmahera_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 467),
(319, 'FORBASI Kabupaten Kepulauan Sula', 'admin.pengcab.kabupatenkepulauansula@forbasi.org', '081321269984', 'Kantor Kabupaten Kepulauan Sula', 'admin_pengcab_kabupaten_kepulauan_sula', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 468),
(320, 'FORBASI Kabupaten Pulau Morotai', 'admin.pengcab.kabupatenpulaumorotai@forbasi.org', '081332868663', 'Kantor Kabupaten Pulau Morotai', 'admin_pengcab_kabupaten_pulau_morotai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 469),
(321, 'FORBASI Kabupaten Pulau Taliabu', 'admin.pengcab.kabupatenpulautaliabu@forbasi.org', '081399553551', 'Kantor Kabupaten Pulau Taliabu', 'admin_pengcab_kabupaten_pulau_taliabu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 470),
(322, 'FORBASI Kota Ternate', 'admin.pengcab.kotaternate@forbasi.org', '081371456915', 'Kantor Kota Ternate', 'admin_pengcab_kota_ternate', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 471),
(323, 'FORBASI Kota Tidore Kepulauan', 'admin.pengcab.kotatidorekepulauan@forbasi.org', '081368379076', 'Kantor Kota Tidore Kepulauan', 'admin_pengcab_kota_tidore_kepulauan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 32, 472),
(324, 'FORBASI Kabupaten Bima', 'admin.pengcab.kabupatenbima@forbasi.org', '081348907627', 'Kantor Kabupaten Bima', 'admin_pengcab_kabupaten_bima', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 283),
(325, 'FORBASI Kabupaten Dompu', 'admin.pengcab.kabupatendompu@forbasi.org', '081339676870', 'Kantor Kabupaten Dompu', 'admin_pengcab_kabupaten_dompu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 284),
(326, 'FORBASI Kabupaten Lombok Barat', 'admin.pengcab.kabupatenlombokbarat@forbasi.org', '081368701456', 'Kantor Kabupaten Lombok Barat', 'admin_pengcab_kabupaten_lombok_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 285),
(327, 'FORBASI Kabupaten Lombok Tengah', 'admin.pengcab.kabupatenlomboktengah@forbasi.org', '081384063650', 'Kantor Kabupaten Lombok Tengah', 'admin_pengcab_kabupaten_lombok_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 286),
(328, 'FORBASI Kabupaten Lombok Timur', 'admin.pengcab.kabupatenlomboktimur@forbasi.org', '081375619346', 'Kantor Kabupaten Lombok Timur', 'admin_pengcab_kabupaten_lombok_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 287),
(329, 'FORBASI Kabupaten Lombok Utara', 'admin.pengcab.kabupatenlombokutara@forbasi.org', '081338959922', 'Kantor Kabupaten Lombok Utara', 'admin_pengcab_kabupaten_lombok_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 288),
(330, 'FORBASI Kabupaten Sumbawa', 'admin.pengcab.kabupatensumbawa@forbasi.org', '081348015487', 'Kantor Kabupaten Sumbawa', 'admin_pengcab_kabupaten_sumbawa', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 289),
(331, 'FORBASI Kabupaten Sumbawa Barat', 'admin.pengcab.kabupatensumbawabarat@forbasi.org', '081356087962', 'Kantor Kabupaten Sumbawa Barat', 'admin_pengcab_kabupaten_sumbawa_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 290),
(332, 'FORBASI Kota Bima', 'admin.pengcab.kotabima@forbasi.org', '081369189377', 'Kantor Kota Bima', 'admin_pengcab_kota_bima', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 291),
(333, 'FORBASI Kota Mataram', 'admin.pengcab.kotamataram@forbasi.org', '081350451362', 'Kantor Kota Mataram', 'admin_pengcab_kota_mataram', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 18, 292),
(334, 'FORBASI Kabupaten Alor', 'admin.pengcab.kabupatenalor@forbasi.org', '081336116419', 'Kantor Kabupaten Alor', 'admin_pengcab_kabupaten_alor', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 293),
(335, 'FORBASI Kabupaten Belu', 'admin.pengcab.kabupatenbelu@forbasi.org', '081371005629', 'Kantor Kabupaten Belu', 'admin_pengcab_kabupaten_belu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 294),
(336, 'FORBASI Kabupaten Ende', 'admin.pengcab.kabupatenende@forbasi.org', '081388286206', 'Kantor Kabupaten Ende', 'admin_pengcab_kabupaten_ende', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 295),
(337, 'FORBASI Kabupaten Flores Timur', 'admin.pengcab.kabupatenflorestimur@forbasi.org', '081325306726', 'Kantor Kabupaten Flores Timur', 'admin_pengcab_kabupaten_flores_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 296),
(338, 'FORBASI Kabupaten Kupang', 'admin.pengcab.kabupatenkupang@forbasi.org', '081381598188', 'Kantor Kabupaten Kupang', 'admin_pengcab_kabupaten_kupang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 297),
(339, 'FORBASI Kabupaten Lembata', 'admin.pengcab.kabupatenlembata@forbasi.org', '081345723940', 'Kantor Kabupaten Lembata', 'admin_pengcab_kabupaten_lembata', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 298),
(340, 'FORBASI Kabupaten Malaka', 'admin.pengcab.kabupatenmalaka@forbasi.org', '081346766972', 'Kantor Kabupaten Malaka', 'admin_pengcab_kabupaten_malaka', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 299),
(341, 'FORBASI Kabupaten Manggarai', 'admin.pengcab.kabupatenmanggarai@forbasi.org', '081373786330', 'Kantor Kabupaten Manggarai', 'admin_pengcab_kabupaten_manggarai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 300),
(342, 'FORBASI Kabupaten Manggarai Barat', 'admin.pengcab.kabupatenmanggaraibarat@forbasi.org', '081345643578', 'Kantor Kabupaten Manggarai Barat', 'admin_pengcab_kabupaten_manggarai_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 301),
(343, 'FORBASI Kabupaten Manggarai Timur', 'admin.pengcab.kabupatenmanggaraitimur@forbasi.org', '081371040238', 'Kantor Kabupaten Manggarai Timur', 'admin_pengcab_kabupaten_manggarai_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 302),
(344, 'FORBASI Kabupaten Nagekeo', 'admin.pengcab.kabupatennagekeo@forbasi.org', '081361982505', 'Kantor Kabupaten Nagekeo', 'admin_pengcab_kabupaten_nagekeo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 303),
(345, 'FORBASI Kabupaten Ngada', 'admin.pengcab.kabupatenngada@forbasi.org', '081357164496', 'Kantor Kabupaten Ngada', 'admin_pengcab_kabupaten_ngada', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 304),
(346, 'FORBASI Kabupaten Rote Ndao', 'admin.pengcab.kabupatenrotendao@forbasi.org', '081362972428', 'Kantor Kabupaten Rote Ndao', 'admin_pengcab_kabupaten_rote_ndao', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 305),
(347, 'FORBASI Kabupaten Sabu Raijua', 'admin.pengcab.kabupatensaburaijua@forbasi.org', '081350504998', 'Kantor Kabupaten Sabu Raijua', 'admin_pengcab_kabupaten_sabu_raijua', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 306),
(348, 'FORBASI Kabupaten Sikka', 'admin.pengcab.kabupatensikka@forbasi.org', '081361667946', 'Kantor Kabupaten Sikka', 'admin_pengcab_kabupaten_sikka', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 307);
INSERT INTO `users` (`id`, `club_name`, `email`, `phone`, `address`, `username`, `password`, `role_id`, `is_active`, `created_at`, `updated_at`, `province_id`, `city_id`) VALUES
(349, 'FORBASI Kabupaten Sumba Barat', 'admin.pengcab.kabupatensumbabarat@forbasi.org', '081384119759', 'Kantor Kabupaten Sumba Barat', 'admin_pengcab_kabupaten_sumba_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 308),
(350, 'FORBASI Kabupaten Sumba Barat Daya', 'admin.pengcab.kabupatensumbabaratdaya@forbasi.org', '081345928491', 'Kantor Kabupaten Sumba Barat Daya', 'admin_pengcab_kabupaten_sumba_barat_daya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 309),
(351, 'FORBASI Kabupaten Sumba Tengah', 'admin.pengcab.kabupatensumbatengah@forbasi.org', '081383295288', 'Kantor Kabupaten Sumba Tengah', 'admin_pengcab_kabupaten_sumba_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 310),
(352, 'FORBASI Kabupaten Sumba Timur', 'admin.pengcab.kabupatensumbatimur@forbasi.org', '081338436706', 'Kantor Kabupaten Sumba Timur', 'admin_pengcab_kabupaten_sumba_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 311),
(353, 'FORBASI Kabupaten Timor Tengah Selatan', 'admin.pengcab.kabupatentimortengahselatan@forbasi.org', '081388300147', 'Kantor Kabupaten Timor Tengah Selatan', 'admin_pengcab_kabupaten_timor_tengah_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 312),
(354, 'FORBASI Kabupaten Timor Tengah Utara', 'admin.pengcab.kabupatentimortengahutara@forbasi.org', '081326823914', 'Kantor Kabupaten Timor Tengah Utara', 'admin_pengcab_kabupaten_timor_tengah_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 313),
(355, 'FORBASI Kota Kupang', 'admin.pengcab.kotakupang@forbasi.org', '081324693099', 'Kantor Kota Kupang', 'admin_pengcab_kota_kupang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 19, 314),
(356, 'FORBASI Kabupaten Biak Numfor', 'admin.pengcab.kabupatenbiaknumfor@forbasi.org', '081331677480', 'Kantor Kabupaten Biak Numfor', 'admin_pengcab_kabupaten_biak_numfor', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 473),
(357, 'FORBASI Kabupaten Jayapura', 'admin.pengcab.kabupatenjayapura@forbasi.org', '081399599037', 'Kantor Kabupaten Jayapura', 'admin_pengcab_kabupaten_jayapura', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 474),
(358, 'FORBASI Kabupaten Keerom', 'admin.pengcab.kabupatenkeerom@forbasi.org', '081392255049', 'Kantor Kabupaten Keerom', 'admin_pengcab_kabupaten_keerom', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 475),
(359, 'FORBASI Kabupaten Sarmi', 'admin.pengcab.kabupatensarmi@forbasi.org', '081322669388', 'Kantor Kabupaten Sarmi', 'admin_pengcab_kabupaten_sarmi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 476),
(360, 'FORBASI Kabupaten Supiori', 'admin.pengcab.kabupatensupiori@forbasi.org', '081314312065', 'Kantor Kabupaten Supiori', 'admin_pengcab_kabupaten_supiori', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 477),
(361, 'FORBASI Kabupaten Waropen', 'admin.pengcab.kabupatenwaropen@forbasi.org', '081321852924', 'Kantor Kabupaten Waropen', 'admin_pengcab_kabupaten_waropen', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 478),
(362, 'FORBASI Kota Jayapura', 'admin.pengcab.kotajayapura@forbasi.org', '081366944166', 'Kantor Kota Jayapura', 'admin_pengcab_kota_jayapura', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 33, 479),
(363, 'FORBASI Kabupaten Fakfak', 'admin.pengcab.kabupatenfakfak@forbasi.org', '081312573186', 'Kantor Kabupaten Fakfak', 'admin_pengcab_kabupaten_fakfak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 486),
(364, 'FORBASI Kabupaten Kaimana', 'admin.pengcab.kabupatenkaimana@forbasi.org', '081390858482', 'Kantor Kabupaten Kaimana', 'admin_pengcab_kabupaten_kaimana', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 487),
(365, 'FORBASI Kabupaten Manokwari', 'admin.pengcab.kabupatenmanokwari@forbasi.org', '081311652661', 'Kantor Kabupaten Manokwari', 'admin_pengcab_kabupaten_manokwari', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 488),
(366, 'FORBASI Kabupaten Manokwari Selatan', 'admin.pengcab.kabupatenmanokwariselatan@forbasi.org', '081356753710', 'Kantor Kabupaten Manokwari Selatan', 'admin_pengcab_kabupaten_manokwari_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 489),
(367, 'FORBASI Kabupaten Pegunungan Arfak', 'admin.pengcab.kabupatenpegununganarfak@forbasi.org', '081381195221', 'Kantor Kabupaten Pegunungan Arfak', 'admin_pengcab_kabupaten_pegunungan_arfak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 490),
(368, 'FORBASI Kabupaten Teluk Bintuni', 'admin.pengcab.kabupatentelukbintuni@forbasi.org', '081371767818', 'Kantor Kabupaten Teluk Bintuni', 'admin_pengcab_kabupaten_teluk_bintuni', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 491),
(369, 'FORBASI Kabupaten Teluk Wondama', 'admin.pengcab.kabupatentelukwondama@forbasi.org', '081350060517', 'Kantor Kabupaten Teluk Wondama', 'admin_pengcab_kabupaten_teluk_wondama', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 35, 492),
(370, 'FORBASI Kabupaten Maybrat', 'admin.pengcab.kabupatenmaybrat@forbasi.org', '081382388634', 'Kantor Kabupaten Maybrat', 'admin_pengcab_kabupaten_maybrat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 480),
(371, 'FORBASI Kabupaten Raja Ampat', 'admin.pengcab.kabupatenrajaampat@forbasi.org', '081318303101', 'Kantor Kabupaten Raja Ampat', 'admin_pengcab_kabupaten_raja_ampat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 481),
(372, 'FORBASI Kabupaten Sorong', 'admin.pengcab.kabupatensorong@forbasi.org', '081374061710', 'Kantor Kabupaten Sorong', 'admin_pengcab_kabupaten_sorong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 482),
(373, 'FORBASI Kabupaten Sorong Selatan', 'admin.pengcab.kabupatensorongselatan@forbasi.org', '081353702651', 'Kantor Kabupaten Sorong Selatan', 'admin_pengcab_kabupaten_sorong_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 483),
(374, 'FORBASI Kabupaten Tambrauw', 'admin.pengcab.kabupatentambrauw@forbasi.org', '081360696742', 'Kantor Kabupaten Tambrauw', 'admin_pengcab_kabupaten_tambrauw', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 484),
(375, 'FORBASI Kota Sorong', 'admin.pengcab.kotasorong@forbasi.org', '081362832488', 'Kantor Kota Sorong', 'admin_pengcab_kota_sorong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 34, 485),
(376, 'FORBASI Kabupaten Jayawijaya', 'admin.pengcab.kabupatenjayawijaya@forbasi.org', '081324230289', 'Kantor Kabupaten Jayawijaya', 'admin_pengcab_kabupaten_jayawijaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 501),
(377, 'FORBASI Kabupaten Lanny Jaya', 'admin.pengcab.kabupatenlannyjaya@forbasi.org', '081351589823', 'Kantor Kabupaten Lanny Jaya', 'admin_pengcab_kabupaten_lanny_jaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 502),
(378, 'FORBASI Kabupaten Mamberamo Tengah', 'admin.pengcab.kabupatenmamberamotengah@forbasi.org', '081382461448', 'Kantor Kabupaten Mamberamo Tengah', 'admin_pengcab_kabupaten_mamberamo_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 503),
(379, 'FORBASI Kabupaten Nduga', 'admin.pengcab.kabupatennduga@forbasi.org', '081398644530', 'Kantor Kabupaten Nduga', 'admin_pengcab_kabupaten_nduga', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 504),
(380, 'FORBASI Kabupaten Pegunungan Bintang', 'admin.pengcab.kabupatenpegununganbintang@forbasi.org', '081340475890', 'Kantor Kabupaten Pegunungan Bintang', 'admin_pengcab_kabupaten_pegunungan_bintang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 505),
(381, 'FORBASI Kabupaten Tolikara', 'admin.pengcab.kabupatentolikara@forbasi.org', '081361814204', 'Kantor Kabupaten Tolikara', 'admin_pengcab_kabupaten_tolikara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 506),
(382, 'FORBASI Kabupaten Yahukimo', 'admin.pengcab.kabupatenyahukimo@forbasi.org', '081319869408', 'Kantor Kabupaten Yahukimo', 'admin_pengcab_kabupaten_yahukimo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 507),
(383, 'FORBASI Kabupaten Yalimo', 'admin.pengcab.kabupatenyalimo@forbasi.org', '081355115105', 'Kantor Kabupaten Yalimo', 'admin_pengcab_kabupaten_yalimo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 37, 508),
(384, 'FORBASI Kabupaten Asmat', 'admin.pengcab.kabupatenasmat@forbasi.org', '081325612873', 'Kantor Kabupaten Asmat', 'admin_pengcab_kabupaten_asmat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 38, 509),
(385, 'FORBASI Kabupaten Boven Digoel', 'admin.pengcab.kabupatenbovendigoel@forbasi.org', '081329148956', 'Kantor Kabupaten Boven Digoel', 'admin_pengcab_kabupaten_boven_digoel', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 38, 510),
(386, 'FORBASI Kabupaten Mappi', 'admin.pengcab.kabupatenmappi@forbasi.org', '081352493638', 'Kantor Kabupaten Mappi', 'admin_pengcab_kabupaten_mappi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 38, 511),
(387, 'FORBASI Kabupaten Merauke', 'admin.pengcab.kabupatenmerauke@forbasi.org', '081342960924', 'Kantor Kabupaten Merauke', 'admin_pengcab_kabupaten_merauke', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 38, 512),
(388, 'FORBASI Kabupaten Deiyai', 'admin.pengcab.kabupatendeiyai@forbasi.org', '081355487437', 'Kantor Kabupaten Deiyai', 'admin_pengcab_kabupaten_deiyai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:16', '2025-06-06 07:29:16', 36, 493),
(389, 'FORBASI Kabupaten Dogiyai', 'admin.pengcab.kabupatendogiyai@forbasi.org', '081387838801', 'Kantor Kabupaten Dogiyai', 'admin_pengcab_kabupaten_dogiyai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 494),
(390, 'FORBASI Kabupaten Intan Jaya', 'admin.pengcab.kabupatenintanjaya@forbasi.org', '081364431834', 'Kantor Kabupaten Intan Jaya', 'admin_pengcab_kabupaten_intan_jaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 495),
(391, 'FORBASI Kabupaten Mimika', 'admin.pengcab.kabupatenmimika@forbasi.org', '081345681814', 'Kantor Kabupaten Mimika', 'admin_pengcab_kabupaten_mimika', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 496),
(392, 'FORBASI Kabupaten Nabire', 'admin.pengcab.kabupatennabire@forbasi.org', '081378528427', 'Kantor Kabupaten Nabire', 'admin_pengcab_kabupaten_nabire', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 497),
(393, 'FORBASI Kabupaten Paniai', 'admin.pengcab.kabupatenpaniai@forbasi.org', '081335432848', 'Kantor Kabupaten Paniai', 'admin_pengcab_kabupaten_paniai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 498),
(394, 'FORBASI Kabupaten Puncak', 'admin.pengcab.kabupatenpuncak@forbasi.org', '081336001930', 'Kantor Kabupaten Puncak', 'admin_pengcab_kabupaten_puncak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 499),
(395, 'FORBASI Kabupaten Puncak Jaya', 'admin.pengcab.kabupatenpuncakjaya@forbasi.org', '081339191847', 'Kantor Kabupaten Puncak Jaya', 'admin_pengcab_kabupaten_puncak_jaya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 36, 500),
(396, 'FORBASI Kabupaten Bengkalis', 'admin.pengcab.kabupatenbengkalis@forbasi.org', '081374075598', 'Kantor Kabupaten Bengkalis', 'admin_pengcab_kabupaten_bengkalis', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 76),
(397, 'FORBASI Kabupaten Indragiri Hilir', 'admin.pengcab.kabupatenindragirihilir@forbasi.org', '081363282149', 'Kantor Kabupaten Indragiri Hilir', 'admin_pengcab_kabupaten_indragiri_hilir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 77),
(398, 'FORBASI Kabupaten Indragiri Hulu', 'admin.pengcab.kabupatenindragirihulu@forbasi.org', '081328607541', 'Kantor Kabupaten Indragiri Hulu', 'admin_pengcab_kabupaten_indragiri_hulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 78),
(399, 'FORBASI Kabupaten Kampar', 'admin.pengcab.kabupatenkampar@forbasi.org', '081313944976', 'Kantor Kabupaten Kampar', 'admin_pengcab_kabupaten_kampar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 79),
(400, 'FORBASI Kabupaten Kepulauan Meranti', 'admin.pengcab.kabupatenkepulauanmeranti@forbasi.org', '081372410332', 'Kantor Kabupaten Kepulauan Meranti', 'admin_pengcab_kabupaten_kepulauan_meranti', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 85),
(401, 'FORBASI Kabupaten Kuantan Singingi', 'admin.pengcab.kabupatenkuantansingingi@forbasi.org', '081353580830', 'Kantor Kabupaten Kuantan Singingi', 'admin_pengcab_kabupaten_kuantan_singingi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 80),
(402, 'FORBASI Kabupaten Pelalawan', 'admin.pengcab.kabupatenpelalawan@forbasi.org', '081380507114', 'Kantor Kabupaten Pelalawan', 'admin_pengcab_kabupaten_pelalawan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 81),
(403, 'FORBASI Kabupaten Rokan Hilir', 'admin.pengcab.kabupatenrokanhilir@forbasi.org', '081373735827', 'Kantor Kabupaten Rokan Hilir', 'admin_pengcab_kabupaten_rokan_hilir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 82),
(404, 'FORBASI Kabupaten Rokan Hulu', 'admin.pengcab.kabupatenrokanhulu@forbasi.org', '081315453843', 'Kantor Kabupaten Rokan Hulu', 'admin_pengcab_kabupaten_rokan_hulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 83),
(405, 'FORBASI Kabupaten Siak', 'admin.pengcab.kabupatensiak@forbasi.org', '081318178034', 'Kantor Kabupaten Siak', 'admin_pengcab_kabupaten_siak', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 84),
(406, 'FORBASI Kota Dumai', 'admin.pengcab.kotadumai@forbasi.org', '081359732488', 'Kantor Kota Dumai', 'admin_pengcab_kota_dumai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 86),
(407, 'FORBASI Kota Pekanbaru', 'admin.pengcab.kotapekanbaru@forbasi.org', '081390113659', 'Kantor Kota Pekanbaru', 'admin_pengcab_kota_pekanbaru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 4, 87),
(408, 'FORBASI Kabupaten Majene', 'admin.pengcab.kabupatenmajene@forbasi.org', '081322200065', 'Kantor Kabupaten Majene', 'admin_pengcab_kabupaten_majene', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 446),
(409, 'FORBASI Kabupaten Mamasa', 'admin.pengcab.kabupatenmamasa@forbasi.org', '081366421442', 'Kantor Kabupaten Mamasa', 'admin_pengcab_kabupaten_mamasa', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 447),
(410, 'FORBASI Kabupaten Mamuju', 'admin.pengcab.kabupatenmamuju@forbasi.org', '081321063511', 'Kantor Kabupaten Mamuju', 'admin_pengcab_kabupaten_mamuju', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 448),
(411, 'FORBASI Kabupaten Mamuju Tengah', 'admin.pengcab.kabupatenmamujutengah@forbasi.org', '081361806153', 'Kantor Kabupaten Mamuju Tengah', 'admin_pengcab_kabupaten_mamuju_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 449),
(412, 'FORBASI Kabupaten Pasangkayu', 'admin.pengcab.kabupatenpasangkayu@forbasi.org', '081386288272', 'Kantor Kabupaten Pasangkayu', 'admin_pengcab_kabupaten_pasangkayu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 450),
(413, 'FORBASI Kabupaten Polewali Mandar', 'admin.pengcab.kabupatenpolewalimandar@forbasi.org', '081359556867', 'Kantor Kabupaten Polewali Mandar', 'admin_pengcab_kabupaten_polewali_mandar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 30, 451),
(414, 'FORBASI Kabupaten Bantaeng', 'admin.pengcab.kabupatenbantaeng@forbasi.org', '081364884219', 'Kantor Kabupaten Bantaeng', 'admin_pengcab_kabupaten_bantaeng', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 399),
(415, 'FORBASI Kabupaten Barru', 'admin.pengcab.kabupatenbarru@forbasi.org', '081340800980', 'Kantor Kabupaten Barru', 'admin_pengcab_kabupaten_barru', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 400),
(416, 'FORBASI Kabupaten Bone', 'admin.pengcab.kabupatenbone@forbasi.org', '081328107917', 'Kantor Kabupaten Bone', 'admin_pengcab_kabupaten_bone', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 401),
(417, 'FORBASI Kabupaten Bulukumba', 'admin.pengcab.kabupatenbulukumba@forbasi.org', '081382430975', 'Kantor Kabupaten Bulukumba', 'admin_pengcab_kabupaten_bulukumba', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 402),
(418, 'FORBASI Kabupaten Enrekang', 'admin.pengcab.kabupatenenrekang@forbasi.org', '081388046934', 'Kantor Kabupaten Enrekang', 'admin_pengcab_kabupaten_enrekang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 403),
(419, 'FORBASI Kabupaten Gowa', 'admin.pengcab.kabupatengowa@forbasi.org', '081318490006', 'Kantor Kabupaten Gowa', 'admin_pengcab_kabupaten_gowa', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 404),
(420, 'FORBASI Kabupaten Jeneponto', 'admin.pengcab.kabupatenjeneponto@forbasi.org', '081372434870', 'Kantor Kabupaten Jeneponto', 'admin_pengcab_kabupaten_jeneponto', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 405),
(421, 'FORBASI Kabupaten Kepulauan Selayar', 'admin.pengcab.kabupatenkepulauanselayar@forbasi.org', '081330208726', 'Kantor Kabupaten Kepulauan Selayar', 'admin_pengcab_kabupaten_kepulauan_selayar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 406),
(422, 'FORBASI Kabupaten Luwu', 'admin.pengcab.kabupatenluwu@forbasi.org', '081341199438', 'Kantor Kabupaten Luwu', 'admin_pengcab_kabupaten_luwu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 407),
(423, 'FORBASI Kabupaten Luwu Timur', 'admin.pengcab.kabupatenluwutimur@forbasi.org', '081330674774', 'Kantor Kabupaten Luwu Timur', 'admin_pengcab_kabupaten_luwu_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 408),
(424, 'FORBASI Kabupaten Luwu Utara', 'admin.pengcab.kabupatenluwuutara@forbasi.org', '081327698441', 'Kantor Kabupaten Luwu Utara', 'admin_pengcab_kabupaten_luwu_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 409),
(425, 'FORBASI Kabupaten Maros', 'admin.pengcab.kabupatenmaros@forbasi.org', '081351740081', 'Kantor Kabupaten Maros', 'admin_pengcab_kabupaten_maros', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 410),
(426, 'FORBASI Kabupaten Pangkajene dan Kepulauan', 'admin.pengcab.kabupatenpangkajenedankepulauan@forbasi.org', '081333009551', 'Kantor Kabupaten Pangkajene dan Kepulauan', 'admin_pengcab_kabupaten_pangkajene_dan_kepulauan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 411),
(427, 'FORBASI Kabupaten Pinrang', 'admin.pengcab.kabupatenpinrang@forbasi.org', '081336331446', 'Kantor Kabupaten Pinrang', 'admin_pengcab_kabupaten_pinrang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 412),
(428, 'FORBASI Kabupaten Sidenreng Rappang', 'admin.pengcab.kabupatensidenrengrappang@forbasi.org', '081342368272', 'Kantor Kabupaten Sidenreng Rappang', 'admin_pengcab_kabupaten_sidenreng_rappang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 413),
(429, 'FORBASI Kabupaten Sinjai', 'admin.pengcab.kabupatensinjai@forbasi.org', '081384839134', 'Kantor Kabupaten Sinjai', 'admin_pengcab_kabupaten_sinjai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 414),
(430, 'FORBASI Kabupaten Soppeng', 'admin.pengcab.kabupatensoppeng@forbasi.org', '081339973121', 'Kantor Kabupaten Soppeng', 'admin_pengcab_kabupaten_soppeng', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 415),
(431, 'FORBASI Kabupaten Takalar', 'admin.pengcab.kabupatentakalar@forbasi.org', '081349122057', 'Kantor Kabupaten Takalar', 'admin_pengcab_kabupaten_takalar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 416),
(432, 'FORBASI Kabupaten Tana Toraja', 'admin.pengcab.kabupatentanatoraja@forbasi.org', '081341160821', 'Kantor Kabupaten Tana Toraja', 'admin_pengcab_kabupaten_tana_toraja', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 417),
(433, 'FORBASI Kabupaten Toraja Utara', 'admin.pengcab.kabupatentorajautara@forbasi.org', '081386590284', 'Kantor Kabupaten Toraja Utara', 'admin_pengcab_kabupaten_toraja_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 418),
(434, 'FORBASI Kabupaten Wajo', 'admin.pengcab.kabupatenwajo@forbasi.org', '081368624661', 'Kantor Kabupaten Wajo', 'admin_pengcab_kabupaten_wajo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 419),
(435, 'FORBASI Kota Makassar', 'admin.pengcab.kotamakassar@forbasi.org', '081353645799', 'Kantor Kota Makassar', 'admin_pengcab_kota_makassar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 420),
(436, 'FORBASI Kota Palopo', 'admin.pengcab.kotapalopo@forbasi.org', '081344976624', 'Kantor Kota Palopo', 'admin_pengcab_kota_palopo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 421),
(437, 'FORBASI Kota Parepare', 'admin.pengcab.kotaparepare@forbasi.org', '081359192197', 'Kantor Kota Parepare', 'admin_pengcab_kota_parepare', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 27, 422),
(438, 'FORBASI Kabupaten Banggai', 'admin.pengcab.kabupatenbanggai@forbasi.org', '081378831723', 'Kantor Kabupaten Banggai', 'admin_pengcab_kabupaten_banggai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 386),
(439, 'FORBASI Kabupaten Banggai Kepulauan', 'admin.pengcab.kabupatenbanggaikepulauan@forbasi.org', '081361523341', 'Kantor Kabupaten Banggai Kepulauan', 'admin_pengcab_kabupaten_banggai_kepulauan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 387),
(440, 'FORBASI Kabupaten Banggai Laut', 'admin.pengcab.kabupatenbanggailaut@forbasi.org', '081393259541', 'Kantor Kabupaten Banggai Laut', 'admin_pengcab_kabupaten_banggai_laut', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 388),
(441, 'FORBASI Kabupaten Buol', 'admin.pengcab.kabupatenbuol@forbasi.org', '081330501492', 'Kantor Kabupaten Buol', 'admin_pengcab_kabupaten_buol', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 389),
(442, 'FORBASI Kabupaten Donggala', 'admin.pengcab.kabupatendonggala@forbasi.org', '081374803882', 'Kantor Kabupaten Donggala', 'admin_pengcab_kabupaten_donggala', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 390),
(443, 'FORBASI Kabupaten Morowali', 'admin.pengcab.kabupatenmorowali@forbasi.org', '081324580599', 'Kantor Kabupaten Morowali', 'admin_pengcab_kabupaten_morowali', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 391),
(444, 'FORBASI Kabupaten Morowali Utara', 'admin.pengcab.kabupatenmorowaliutara@forbasi.org', '081359316450', 'Kantor Kabupaten Morowali Utara', 'admin_pengcab_kabupaten_morowali_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 392),
(445, 'FORBASI Kabupaten Parigi Moutong', 'admin.pengcab.kabupatenparigimoutong@forbasi.org', '081334481531', 'Kantor Kabupaten Parigi Moutong', 'admin_pengcab_kabupaten_parigi_moutong', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 393),
(446, 'FORBASI Kabupaten Poso', 'admin.pengcab.kabupatenposo@forbasi.org', '081338713229', 'Kantor Kabupaten Poso', 'admin_pengcab_kabupaten_poso', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 394),
(447, 'FORBASI Kabupaten Sigi', 'admin.pengcab.kabupatensigi@forbasi.org', '081347745302', 'Kantor Kabupaten Sigi', 'admin_pengcab_kabupaten_sigi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 395),
(448, 'FORBASI Kabupaten Tojo Una-Una', 'admin.pengcab.kabupatentojouna-una@forbasi.org', '081330501088', 'Kantor Kabupaten Tojo Una-Una', 'admin_pengcab_kabupaten_tojo_una-una', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 396),
(449, 'FORBASI Kabupaten Tolitoli', 'admin.pengcab.kabupatentolitoli@forbasi.org', '081349462324', 'Kantor Kabupaten Tolitoli', 'admin_pengcab_kabupaten_tolitoli', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 397),
(450, 'FORBASI Kota Palu', 'admin.pengcab.kotapalu@forbasi.org', '081321786321', 'Kantor Kota Palu', 'admin_pengcab_kota_palu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 26, 398),
(451, 'FORBASI Kabupaten Bombana', 'admin.pengcab.kabupatenbombana@forbasi.org', '081312234211', 'Kantor Kabupaten Bombana', 'admin_pengcab_kabupaten_bombana', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 423),
(452, 'FORBASI Kabupaten Buton', 'admin.pengcab.kabupatenbuton@forbasi.org', '081322703609', 'Kantor Kabupaten Buton', 'admin_pengcab_kabupaten_buton', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 424),
(453, 'FORBASI Kabupaten Buton Selatan', 'admin.pengcab.kabupatenbutonselatan@forbasi.org', '081322768067', 'Kantor Kabupaten Buton Selatan', 'admin_pengcab_kabupaten_buton_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 425),
(454, 'FORBASI Kabupaten Buton Tengah', 'admin.pengcab.kabupatenbutontengah@forbasi.org', '081330726855', 'Kantor Kabupaten Buton Tengah', 'admin_pengcab_kabupaten_buton_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 426),
(455, 'FORBASI Kabupaten Buton Utara', 'admin.pengcab.kabupatenbutonutara@forbasi.org', '081329569783', 'Kantor Kabupaten Buton Utara', 'admin_pengcab_kabupaten_buton_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 427),
(456, 'FORBASI Kabupaten Kolaka', 'admin.pengcab.kabupatenkolaka@forbasi.org', '081361573689', 'Kantor Kabupaten Kolaka', 'admin_pengcab_kabupaten_kolaka', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 428),
(457, 'FORBASI Kabupaten Kolaka Timur', 'admin.pengcab.kabupatenkolakatimur@forbasi.org', '081364643471', 'Kantor Kabupaten Kolaka Timur', 'admin_pengcab_kabupaten_kolaka_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 429),
(458, 'FORBASI Kabupaten Kolaka Utara', 'admin.pengcab.kabupatenkolakautara@forbasi.org', '081324575822', 'Kantor Kabupaten Kolaka Utara', 'admin_pengcab_kabupaten_kolaka_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 430),
(459, 'FORBASI Kabupaten Konawe', 'admin.pengcab.kabupatenkonawe@forbasi.org', '081349236662', 'Kantor Kabupaten Konawe', 'admin_pengcab_kabupaten_konawe', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 431),
(460, 'FORBASI Kabupaten Konawe Kepulauan', 'admin.pengcab.kabupatenkonawekepulauan@forbasi.org', '081313201868', 'Kantor Kabupaten Konawe Kepulauan', 'admin_pengcab_kabupaten_konawe_kepulauan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 432),
(461, 'FORBASI Kabupaten Konawe Selatan', 'admin.pengcab.kabupatenkonaweselatan@forbasi.org', '081312879657', 'Kantor Kabupaten Konawe Selatan', 'admin_pengcab_kabupaten_konawe_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 433),
(462, 'FORBASI Kabupaten Konawe Utara', 'admin.pengcab.kabupatenkonaweutara@forbasi.org', '081370731316', 'Kantor Kabupaten Konawe Utara', 'admin_pengcab_kabupaten_konawe_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 434),
(463, 'FORBASI Kabupaten Muna', 'admin.pengcab.kabupatenmuna@forbasi.org', '081325322425', 'Kantor Kabupaten Muna', 'admin_pengcab_kabupaten_muna', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 435),
(464, 'FORBASI Kabupaten Muna Barat', 'admin.pengcab.kabupatenmunabarat@forbasi.org', '081333906088', 'Kantor Kabupaten Muna Barat', 'admin_pengcab_kabupaten_muna_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 436),
(465, 'FORBASI Kabupaten Wakatobi', 'admin.pengcab.kabupatenwakatobi@forbasi.org', '081387124810', 'Kantor Kabupaten Wakatobi', 'admin_pengcab_kabupaten_wakatobi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 437),
(466, 'FORBASI Kota Baubau', 'admin.pengcab.kotabaubau@forbasi.org', '081320711383', 'Kantor Kota Baubau', 'admin_pengcab_kota_baubau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 438),
(467, 'FORBASI Kota Kendari', 'admin.pengcab.kotakendari@forbasi.org', '081320233408', 'Kantor Kota Kendari', 'admin_pengcab_kota_kendari', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 28, 439),
(468, 'FORBASI Kabupaten Bolaang Mongondow', 'admin.pengcab.kabupatenbolaangmongondow@forbasi.org', '081310294272', 'Kantor Kabupaten Bolaang Mongondow', 'admin_pengcab_kabupaten_bolaang_mongondow', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 371),
(469, 'FORBASI Kabupaten Bolaang Mongondow Selatan', 'admin.pengcab.kabupatenbolaangmongondowselatan@forbasi.org', '081317583926', 'Kantor Kabupaten Bolaang Mongondow Selatan', 'admin_pengcab_kabupaten_bolaang_mongondow_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 372),
(470, 'FORBASI Kabupaten Bolaang Mongondow Timur', 'admin.pengcab.kabupatenbolaangmongondowtimur@forbasi.org', '081344716741', 'Kantor Kabupaten Bolaang Mongondow Timur', 'admin_pengcab_kabupaten_bolaang_mongondow_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 373),
(471, 'FORBASI Kabupaten Bolaang Mongondow Utara', 'admin.pengcab.kabupatenbolaangmongondowutara@forbasi.org', '081346955133', 'Kantor Kabupaten Bolaang Mongondow Utara', 'admin_pengcab_kabupaten_bolaang_mongondow_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 374),
(472, 'FORBASI Kabupaten Kepulauan Sangihe', 'admin.pengcab.kabupatenkepulauansangihe@forbasi.org', '081384294837', 'Kantor Kabupaten Kepulauan Sangihe', 'admin_pengcab_kabupaten_kepulauan_sangihe', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 375),
(473, 'FORBASI Kabupaten Kepulauan Siau Tagulandang Biaro', 'admin.pengcab.kabupatenkepulauansiautagulandangbiaro@forbasi.org', '081364374958', 'Kantor Kabupaten Kepulauan Siau Tagulandang Biaro', 'admin_pengcab_48b914997ec9ecf', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 376),
(474, 'FORBASI Kabupaten Kepulauan Talaud', 'admin.pengcab.kabupatenkepulauantalaud@forbasi.org', '081312107340', 'Kantor Kabupaten Kepulauan Talaud', 'admin_pengcab_kabupaten_kepulauan_talaud', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 377),
(475, 'FORBASI Kabupaten Minahasa', 'admin.pengcab.kabupatenminahasa@forbasi.org', '081340714328', 'Kantor Kabupaten Minahasa', 'admin_pengcab_kabupaten_minahasa', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 378),
(476, 'FORBASI Kabupaten Minahasa Selatan', 'admin.pengcab.kabupatenminahasaselatan@forbasi.org', '081358763198', 'Kantor Kabupaten Minahasa Selatan', 'admin_pengcab_kabupaten_minahasa_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 379),
(477, 'FORBASI Kabupaten Minahasa Tenggara', 'admin.pengcab.kabupatenminahasatenggara@forbasi.org', '081316698919', 'Kantor Kabupaten Minahasa Tenggara', 'admin_pengcab_kabupaten_minahasa_tenggara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 380),
(478, 'FORBASI Kabupaten Minahasa Utara', 'admin.pengcab.kabupatenminahasautara@forbasi.org', '081347337778', 'Kantor Kabupaten Minahasa Utara', 'admin_pengcab_kabupaten_minahasa_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 381),
(479, 'FORBASI Kota Bitung', 'admin.pengcab.kotabitung@forbasi.org', '081354274199', 'Kantor Kota Bitung', 'admin_pengcab_kota_bitung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 382),
(480, 'FORBASI Kota Kotamobagu', 'admin.pengcab.kotakotamobagu@forbasi.org', '081348969340', 'Kantor Kota Kotamobagu', 'admin_pengcab_kota_kotamobagu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 383),
(481, 'FORBASI Kota Manado', 'admin.pengcab.kotamanado@forbasi.org', '081399542649', 'Kantor Kota Manado', 'admin_pengcab_kota_manado', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 384),
(482, 'FORBASI Kota Tomohon', 'admin.pengcab.kotatomohon@forbasi.org', '081341972216', 'Kantor Kota Tomohon', 'admin_pengcab_kota_tomohon', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 25, 385),
(483, 'FORBASI Kabupaten Agam', 'admin.pengcab.kabupatenagam@forbasi.org', '081349917551', 'Kantor Kabupaten Agam', 'admin_pengcab_kabupaten_agam', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 57),
(484, 'FORBASI Kabupaten Dharmasraya', 'admin.pengcab.kabupatendharmasraya@forbasi.org', '081330525408', 'Kantor Kabupaten Dharmasraya', 'admin_pengcab_kabupaten_dharmasraya', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 58),
(485, 'FORBASI Kabupaten Kepulauan Mentawai', 'admin.pengcab.kabupatenkepulauanmentawai@forbasi.org', '081364982338', 'Kantor Kabupaten Kepulauan Mentawai', 'admin_pengcab_kabupaten_kepulauan_mentawai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 59),
(486, 'FORBASI Kabupaten Lima Puluh Kota', 'admin.pengcab.kabupatenlimapuluhkota@forbasi.org', '081386732597', 'Kantor Kabupaten Lima Puluh Kota', 'admin_pengcab_kabupaten_lima_puluh_kota', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 60),
(487, 'FORBASI Kabupaten Padang Pariaman', 'admin.pengcab.kabupatenpadangpariaman@forbasi.org', '081358029473', 'Kantor Kabupaten Padang Pariaman', 'admin_pengcab_kabupaten_padang_pariaman', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 61),
(488, 'FORBASI Kabupaten Pasaman', 'admin.pengcab.kabupatenpasaman@forbasi.org', '081324299992', 'Kantor Kabupaten Pasaman', 'admin_pengcab_kabupaten_pasaman', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 62),
(489, 'FORBASI Kabupaten Pasaman Barat', 'admin.pengcab.kabupatenpasamanbarat@forbasi.org', '081314545181', 'Kantor Kabupaten Pasaman Barat', 'admin_pengcab_kabupaten_pasaman_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 63),
(490, 'FORBASI Kabupaten Pesisir Selatan', 'admin.pengcab.kabupatenpesisirselatan@forbasi.org', '081364315790', 'Kantor Kabupaten Pesisir Selatan', 'admin_pengcab_kabupaten_pesisir_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 64),
(491, 'FORBASI Kabupaten Sijunjung', 'admin.pengcab.kabupatensijunjung@forbasi.org', '081327114620', 'Kantor Kabupaten Sijunjung', 'admin_pengcab_kabupaten_sijunjung', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 65),
(492, 'FORBASI Kabupaten Solok', 'admin.pengcab.kabupatensolok@forbasi.org', '081378270943', 'Kantor Kabupaten Solok', 'admin_pengcab_kabupaten_solok', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 66),
(493, 'FORBASI Kabupaten Solok Selatan', 'admin.pengcab.kabupatensolokselatan@forbasi.org', '081394499295', 'Kantor Kabupaten Solok Selatan', 'admin_pengcab_kabupaten_solok_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 67),
(494, 'FORBASI Kabupaten Tanah Datar', 'admin.pengcab.kabupatentanahdatar@forbasi.org', '081324626060', 'Kantor Kabupaten Tanah Datar', 'admin_pengcab_kabupaten_tanah_datar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 68),
(495, 'FORBASI Kota Bukittinggi', 'admin.pengcab.kotabukittinggi@forbasi.org', '081331438674', 'Kantor Kota Bukittinggi', 'admin_pengcab_kota_bukittinggi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 69),
(496, 'FORBASI Kota Padang', 'admin.pengcab.kotapadang@forbasi.org', '081322648900', 'Kantor Kota Padang', 'admin_pengcab_kota_padang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 70),
(497, 'FORBASI Kota Padangpanjang', 'admin.pengcab.kotapadangpanjang@forbasi.org', '081345982830', 'Kantor Kota Padangpanjang', 'admin_pengcab_kota_padangpanjang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 71),
(498, 'FORBASI Kota Pariaman', 'admin.pengcab.kotapariaman@forbasi.org', '081362075591', 'Kantor Kota Pariaman', 'admin_pengcab_kota_pariaman', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 72),
(499, 'FORBASI Kota Payakumbuh', 'admin.pengcab.kotapayakumbuh@forbasi.org', '081356078606', 'Kantor Kota Payakumbuh', 'admin_pengcab_kota_payakumbuh', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 73),
(500, 'FORBASI Kota Sawahlunto', 'admin.pengcab.kotasawahlunto@forbasi.org', '081366556179', 'Kantor Kota Sawahlunto', 'admin_pengcab_kota_sawahlunto', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 74),
(501, 'FORBASI Kota Solok', 'admin.pengcab.kotasolok@forbasi.org', '081334730982', 'Kantor Kota Solok', 'admin_pengcab_kota_solok', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 3, 75),
(502, 'FORBASI Kabupaten Banyuasin', 'admin.pengcab.kabupatenbanyuasin@forbasi.org', '081390326945', 'Kantor Kabupaten Banyuasin', 'admin_pengcab_kabupaten_banyuasin', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 99),
(503, 'FORBASI Kabupaten Empat Lawang', 'admin.pengcab.kabupatenempatlawang@forbasi.org', '081383095963', 'Kantor Kabupaten Empat Lawang', 'admin_pengcab_kabupaten_empat_lawang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 100),
(504, 'FORBASI Kabupaten Lahat', 'admin.pengcab.kabupatenlahat@forbasi.org', '081350933408', 'Kantor Kabupaten Lahat', 'admin_pengcab_kabupaten_lahat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 101),
(505, 'FORBASI Kabupaten Muara Enim', 'admin.pengcab.kabupatenmuaraenim@forbasi.org', '081383968284', 'Kantor Kabupaten Muara Enim', 'admin_pengcab_kabupaten_muara_enim', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 102),
(506, 'FORBASI Kabupaten Musi Banyuasin', 'admin.pengcab.kabupatenmusibanyuasin@forbasi.org', '081391916239', 'Kantor Kabupaten Musi Banyuasin', 'admin_pengcab_kabupaten_musi_banyuasin', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 103),
(507, 'FORBASI Kabupaten Musi Rawas', 'admin.pengcab.kabupatenmusirawas@forbasi.org', '081353733559', 'Kantor Kabupaten Musi Rawas', 'admin_pengcab_kabupaten_musi_rawas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 104),
(508, 'FORBASI Kabupaten Musi Rawas Utara', 'admin.pengcab.kabupatenmusirawasutara@forbasi.org', '081368806597', 'Kantor Kabupaten Musi Rawas Utara', 'admin_pengcab_kabupaten_musi_rawas_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 105),
(509, 'FORBASI Kabupaten Ogan Ilir', 'admin.pengcab.kabupatenoganilir@forbasi.org', '081331827880', 'Kantor Kabupaten Ogan Ilir', 'admin_pengcab_kabupaten_ogan_ilir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 106),
(510, 'FORBASI Kabupaten Ogan Komering Ilir', 'admin.pengcab.kabupatenogankomeringilir@forbasi.org', '081353157452', 'Kantor Kabupaten Ogan Komering Ilir', 'admin_pengcab_kabupaten_ogan_komering_ilir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 107),
(511, 'FORBASI Kabupaten Ogan Komering Ulu', 'admin.pengcab.kabupatenogankomeringulu@forbasi.org', '081331108897', 'Kantor Kabupaten Ogan Komering Ulu', 'admin_pengcab_kabupaten_ogan_komering_ulu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 108),
(512, 'FORBASI Kabupaten Ogan Komering Ulu Selatan', 'admin.pengcab.kabupatenogankomeringuluselatan@forbasi.org', '081314353818', 'Kantor Kabupaten Ogan Komering Ulu Selatan', 'admin_pengcab_kabupaten_ogan_komering_ulu_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 109),
(513, 'FORBASI Kabupaten Ogan Komering Ulu Timur', 'admin.pengcab.kabupatenogankomeringulutimur@forbasi.org', '081386043963', 'Kantor Kabupaten Ogan Komering Ulu Timur', 'admin_pengcab_kabupaten_ogan_komering_ulu_timur', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 110),
(514, 'FORBASI Kabupaten Penukal Abab Lematang Ilir', 'admin.pengcab.kabupatenpenukalabablematangilir@forbasi.org', '081348509811', 'Kantor Kabupaten Penukal Abab Lematang Ilir', 'admin_pengcab_kabupaten_penukal_abab_lematang_ilir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 111),
(515, 'FORBASI Kota Lubuklinggau', 'admin.pengcab.kotalubuklinggau@forbasi.org', '081319318249', 'Kantor Kota Lubuklinggau', 'admin_pengcab_kota_lubuklinggau', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 112),
(516, 'FORBASI Kota Pagar Alam', 'admin.pengcab.kotapagaralam@forbasi.org', '081371535870', 'Kantor Kota Pagar Alam', 'admin_pengcab_kota_pagar_alam', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 113),
(517, 'FORBASI Kota Palembang', 'admin.pengcab.kotapalembang@forbasi.org', '081353664177', 'Kantor Kota Palembang', 'admin_pengcab_kota_palembang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 114);
INSERT INTO `users` (`id`, `club_name`, `email`, `phone`, `address`, `username`, `password`, `role_id`, `is_active`, `created_at`, `updated_at`, `province_id`, `city_id`) VALUES
(518, 'FORBASI Kota Prabumulih', 'admin.pengcab.kotaprabumulih@forbasi.org', '081317088134', 'Kantor Kota Prabumulih', 'admin_pengcab_kota_prabumulih', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 6, 115),
(519, 'FORBASI Kabupaten Asahan', 'admin.pengcab.kabupatenasahan@forbasi.org', '081381575390', 'Kantor Kabupaten Asahan', 'admin_pengcab_kabupaten_asahan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 24),
(520, 'FORBASI Kabupaten Batubara', 'admin.pengcab.kabupatenbatubara@forbasi.org', '081370568255', 'Kantor Kabupaten Batubara', 'admin_pengcab_kabupaten_batubara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 25),
(521, 'FORBASI Kabupaten Dairi', 'admin.pengcab.kabupatendairi@forbasi.org', '081327687971', 'Kantor Kabupaten Dairi', 'admin_pengcab_kabupaten_dairi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 26),
(522, 'FORBASI Kabupaten Deli Serdang', 'admin.pengcab.kabupatendeliserdang@forbasi.org', '081321710132', 'Kantor Kabupaten Deli Serdang', 'admin_pengcab_kabupaten_deli_serdang', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 27),
(523, 'FORBASI Kabupaten Humbang Hasundutan', 'admin.pengcab.kabupatenhumbanghasundutan@forbasi.org', '081325469792', 'Kantor Kabupaten Humbang Hasundutan', 'admin_pengcab_kabupaten_humbang_hasundutan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 28),
(524, 'FORBASI Kabupaten Karo', 'admin.pengcab.kabupatenkaro@forbasi.org', '081370513945', 'Kantor Kabupaten Karo', 'admin_pengcab_kabupaten_karo', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 29),
(525, 'FORBASI Kabupaten Labuhanbatu', 'admin.pengcab.kabupatenlabuhanbatu@forbasi.org', '081330890545', 'Kantor Kabupaten Labuhanbatu', 'admin_pengcab_kabupaten_labuhanbatu', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 30),
(526, 'FORBASI Kabupaten Labuhanbatu Selatan', 'admin.pengcab.kabupatenlabuhanbatuselatan@forbasi.org', '081356281807', 'Kantor Kabupaten Labuhanbatu Selatan', 'admin_pengcab_kabupaten_labuhanbatu_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 31),
(527, 'FORBASI Kabupaten Labuhanbatu Utara', 'admin.pengcab.kabupatenlabuhanbatuutara@forbasi.org', '081332301197', 'Kantor Kabupaten Labuhanbatu Utara', 'admin_pengcab_kabupaten_labuhanbatu_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 32),
(528, 'FORBASI Kabupaten Langkat', 'admin.pengcab.kabupatenlangkat@forbasi.org', '081389660519', 'Kantor Kabupaten Langkat', 'admin_pengcab_kabupaten_langkat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 33),
(529, 'FORBASI Kabupaten Mandailing Natal', 'admin.pengcab.kabupatenmandailingnatal@forbasi.org', '081391454210', 'Kantor Kabupaten Mandailing Natal', 'admin_pengcab_kabupaten_mandailing_natal', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 34),
(530, 'FORBASI Kabupaten Nias', 'admin.pengcab.kabupatennias@forbasi.org', '081314989547', 'Kantor Kabupaten Nias', 'admin_pengcab_kabupaten_nias', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 35),
(531, 'FORBASI Kabupaten Nias Barat', 'admin.pengcab.kabupatenniasbarat@forbasi.org', '081359965201', 'Kantor Kabupaten Nias Barat', 'admin_pengcab_kabupaten_nias_barat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 36),
(532, 'FORBASI Kabupaten Nias Selatan', 'admin.pengcab.kabupatenniasselatan@forbasi.org', '081365842376', 'Kantor Kabupaten Nias Selatan', 'admin_pengcab_kabupaten_nias_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 37),
(533, 'FORBASI Kabupaten Nias Utara', 'admin.pengcab.kabupatenniasutara@forbasi.org', '081379635154', 'Kantor Kabupaten Nias Utara', 'admin_pengcab_kabupaten_nias_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 38),
(534, 'FORBASI Kabupaten Padang Lawas', 'admin.pengcab.kabupatenpadanglawas@forbasi.org', '081385024360', 'Kantor Kabupaten Padang Lawas', 'admin_pengcab_kabupaten_padang_lawas', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 39),
(535, 'FORBASI Kabupaten Padang Lawas Utara', 'admin.pengcab.kabupatenpadanglawasutara@forbasi.org', '081354718047', 'Kantor Kabupaten Padang Lawas Utara', 'admin_pengcab_kabupaten_padang_lawas_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 40),
(536, 'FORBASI Kabupaten Pakpak Bharat', 'admin.pengcab.kabupatenpakpakbharat@forbasi.org', '081365218405', 'Kantor Kabupaten Pakpak Bharat', 'admin_pengcab_kabupaten_pakpak_bharat', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 41),
(537, 'FORBASI Kabupaten Samosir', 'admin.pengcab.kabupatensamosir@forbasi.org', '081395621335', 'Kantor Kabupaten Samosir', 'admin_pengcab_kabupaten_samosir', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 42),
(538, 'FORBASI Kabupaten Serdang Bedagai', 'admin.pengcab.kabupatenserdangbedagai@forbasi.org', '081366084424', 'Kantor Kabupaten Serdang Bedagai', 'admin_pengcab_kabupaten_serdang_bedagai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 43),
(539, 'FORBASI Kabupaten Simalungun', 'admin.pengcab.kabupatensimalungun@forbasi.org', '081368205918', 'Kantor Kabupaten Simalungun', 'admin_pengcab_kabupaten_simalungun', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 44),
(540, 'FORBASI Kabupaten Tapanuli Selatan', 'admin.pengcab.kabupatentapanuliselatan@forbasi.org', '081367161092', 'Kantor Kabupaten Tapanuli Selatan', 'admin_pengcab_kabupaten_tapanuli_selatan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 45),
(541, 'FORBASI Kabupaten Tapanuli Tengah', 'admin.pengcab.kabupatentapanulitengah@forbasi.org', '081386851239', 'Kantor Kabupaten Tapanuli Tengah', 'admin_pengcab_kabupaten_tapanuli_tengah', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 46),
(542, 'FORBASI Kabupaten Tapanuli Utara', 'admin.pengcab.kabupatentapanuliutara@forbasi.org', '081349070227', 'Kantor Kabupaten Tapanuli Utara', 'admin_pengcab_kabupaten_tapanuli_utara', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:17', '2025-06-06 07:29:17', 2, 47),
(543, 'FORBASI Kabupaten Toba', 'admin.pengcab.kabupatentoba@forbasi.org', '081342434888', 'Kantor Kabupaten Toba', 'admin_pengcab_kabupaten_toba', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 48),
(544, 'FORBASI Kota Binjai', 'admin.pengcab.kotabinjai@forbasi.org', '081323350728', 'Kantor Kota Binjai', 'admin_pengcab_kota_binjai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 49),
(545, 'FORBASI Kota Gunungsitoli', 'admin.pengcab.kotagunungsitoli@forbasi.org', '081319000979', 'Kantor Kota Gunungsitoli', 'admin_pengcab_kota_gunungsitoli', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 50),
(546, 'FORBASI Kota Medan', 'admin.pengcab.kotamedan@forbasi.org', '081320687877', 'Kantor Kota Medan', 'admin_pengcab_kota_medan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 51),
(547, 'FORBASI Kota Padangsidimpuan', 'admin.pengcab.kotapadangsidimpuan@forbasi.org', '081325639045', 'Kantor Kota Padangsidimpuan', 'admin_pengcab_kota_padangsidimpuan', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 52),
(548, 'FORBASI Kota Pematangsiantar', 'admin.pengcab.kotapematangsiantar@forbasi.org', '081337970131', 'Kantor Kota Pematangsiantar', 'admin_pengcab_kota_pematangsiantar', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 53),
(549, 'FORBASI Kota Sibolga', 'admin.pengcab.kotasibolga@forbasi.org', '081384187859', 'Kantor Kota Sibolga', 'admin_pengcab_kota_sibolga', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 54),
(550, 'FORBASI Kota Tanjungbalai', 'admin.pengcab.kotatanjungbalai@forbasi.org', '081327411403', 'Kantor Kota Tanjungbalai', 'admin_pengcab_kota_tanjungbalai', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 55),
(551, 'FORBASI Kota Tebing Tinggi', 'admin.pengcab.kotatebingtinggi@forbasi.org', '081368123706', 'Kantor Kota Tebing Tinggi', 'admin_pengcab_kota_tebing_tinggi', '$2y$10$aftok6m2ehjceeUFNKk8Qe1fLv2yi9hDQINur3qvK3ceEnSn1yJ6y', 2, 1, '2025-06-06 07:29:18', '2025-06-06 07:29:18', 2, 56),
(1658, 'rajawali', 'rajawali@gmail.com', '0892346327', 'testingg', 'rajawali', '$2y$10$rRmP.Q27XsKgrBSfBw2ZZeVh0.OWn2QA8ufw1vcxv0FzNQ/3ZlJ6K', 1, 1, '2025-06-06 07:08:13', '2025-06-06 07:08:13', 12, 164);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_notifications_user_id` (`user_id`);

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_province_city` (`province_id`,`name`),
  ADD KEY `province_id` (`province_id`);

--
-- Indexes for table `kta_applications`
--
ALTER TABLE `kta_applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_kta_applications_status` (`status`),
  ADD KEY `idx_kta_applications_user_id` (`user_id`);

--
-- Indexes for table `kta_application_history`
--
ALTER TABLE `kta_application_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `provinces`
--
ALTER TABLE `provinces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1537;

--
-- AUTO_INCREMENT for table `kta_applications`
--
ALTER TABLE `kta_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `kta_application_history`
--
ALTER TABLE `kta_application_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1659;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`);

--
-- Constraints for table `kta_applications`
--
ALTER TABLE `kta_applications`
  ADD CONSTRAINT `kta_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kta_application_history`
--
ALTER TABLE `kta_application_history`
  ADD CONSTRAINT `kta_application_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `kta_applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
