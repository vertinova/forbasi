<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <link rel="shortcut icon" href="../assets/LOGO-FORBASI.png" type="image/x-icon" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Sedang Dalam Pemeliharaan</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        :root {
            --primary-color: #4CAF50; /* Hijau cerah */
            --secondary-color: #8BC34A; /* Hijau muda */
            --text-dark: #333;
            --text-light: #f9f9f9;
            --background-light: #e0f2f1; /* Aqua muda */
            --background-dark: #263238; /* Abu-abu gelap */
            --container-bg: #ffffff;
            --shadow-light: rgba(0, 0, 0, 0.1);
            --shadow-strong: rgba(0, 0, 0, 0.2);
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, var(--background-light) 0%, var(--primary-color) 100%);
            color: var(--text-dark);
            text-align: center;
            overflow: hidden; /* Mencegah scrollbar karena animasi latar */
            position: relative;
        }

        /* Animasi latar belakang */
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent);
            background-size: 40px 40px;
            animation: moveBackground 20s linear infinite;
            opacity: 0.3;
            z-index: -1;
        }

        @keyframes moveBackground {
            0% { background-position: 0 0; }
            100% { background-position: 400px 400px; }
        }

        .container {
            background-color: var(--container-bg);
            padding: 40px;
            border-radius: 15px; /* Sudut lebih membulat */
            box-shadow: 0 10px 30px var(--shadow-strong); /* Bayangan lebih dalam */
            max-width: 600px;
            width: 90%; /* Menggunakan persentase untuk lebar */
            box-sizing: border-box;
            position: relative;
            z-index: 10;
            transform: translateY(0);
            animation: fadeInScale 0.8s ease-out forwards; /* Animasi masuk */
            border: 1px solid var(--secondary-color); /* Border tipis */
        }

        /* Animasi masuk kontainer */
        @keyframes fadeInScale {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .icon-wrapper {
            margin-bottom: 30px;
        }

        .icon-wrapper img {
            max-width: 180px; /* Ukuran ikon lebih besar */
            height: auto;
            filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2)); /* Bayangan pada ikon */
            animation: bounce 2s infinite ease-in-out; /* Animasi ikon memantul */
        }

        /* Animasi ikon memantul */
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        h1 {
            color: var(--primary-color);
            font-size: 3em; /* Ukuran heading lebih besar */
            margin-bottom: 15px;
            font-weight: 700; /* Tebal */
            letter-spacing: 1px; /* Jarak antar huruf */
            animation: textSlideIn 1s ease-out forwards; /* Animasi teks masuk */
            opacity: 0; /* Awalnya tersembunyi */
            animation-delay: 0.3s; /* Penundaan setelah container */
        }

        /* Animasi teks masuk */
        @keyframes textSlideIn {
            0% {
                opacity: 0;
                transform: translateX(-20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }

        p {
            font-size: 1.2em; /* Ukuran paragraf lebih besar */
            line-height: 1.8;
            color: var(--text-dark);
            margin-bottom: 25px;
            animation: textFadeIn 1s ease-out forwards; /* Animasi teks masuk */
            opacity: 0; /* Awalnya tersembunyi */
            animation-delay: 0.6s; /* Penundaan setelah heading */
        }

        /* Animasi teks masuk (fade) */
        @keyframes textFadeIn {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }

        /* Responsive design untuk layar kecil */
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px; /* Sesuaikan padding untuk ruang yang lebih baik pada sisi */
                margin: 20px;
            }

            h1 {
                font-size: 2em; /* Sedikit lebih kecil untuk layar menengah */
            }

            p {
                font-size: 1em;
            }

            .icon-wrapper img {
                max-width: 120px;
            }
        }

        @media (max-width: 480px) { /* Untuk ponsel yang lebih kecil */
            .container {
                padding: 25px 15px; /* Padding lebih kecil lagi */
                margin: 15px; /* Margin lebih kecil */
                width: 95%; /* Lebar sedikit lebih besar untuk mengisi ruang */
            }

            .icon-wrapper {
                margin-bottom: 20px; /* Margin ikon sedikit lebih kecil */
            }

            .icon-wrapper img {
                max-width: 100px; /* Ikon lebih kecil */
            }

            h1 {
                font-size: 1.6em; /* Ukuran heading yang cocok untuk ponsel */
                margin-bottom: 10px;
            }

            p {
                font-size: 0.9em; /* Ukuran paragraf yang cocok untuk ponsel */
                line-height: 1.6; /* Sesuaikan line-height */
                margin-bottom: 20px;
            }
        }

        @media (max-width: 320px) { /* Untuk ponsel dengan layar sangat kecil */
            .container {
                padding: 20px 10px; /* Padding minimal */
                margin: 10px;
            }

            h1 {
                font-size: 1.4em;
            }

            p {
                font-size: 0.85em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-wrapper">
            <img src="forbasi/assets/LOGO-FORBASI.png" alt="Logo FORBASI">
        </div>
        <h1>Sistem Sedang dalam Pemeliharaan</h1>
        <p>
            Mohon maaf atas ketidaknyamanannya. Sistem kami sedang dalam pemeliharaan rutin untuk performa yang lebih baik. Kami akan segera kembali!
        </p>
    </div>
</body>
</html>