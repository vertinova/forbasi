<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fitur Reset Password Sedang Dikembangkan</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f8f8f8; /* Dominasi warna putih */
            overflow: hidden;
            position: relative;
        }

        .background-dots {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background-image: radial-gradient(#e0ffe0 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.5;
            animation: dotFlow 30s linear infinite;
        }

        @keyframes dotFlow {
            from {
                background-position: 0 0;
            }
            to {
                background-position: 100% 100%;
            }
        }

        .container {
            background-color: #ffffff;
            padding: 40px 60px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            text-align: center;
            max-width: 500px;
            width: 90%;
            position: relative;
            z-index: 1;
            transform: translateY(20px);
            opacity: 0;
            animation: fadeInScale 0.8s ease-out forwards;
        }

        @keyframes fadeInScale {
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .icon-wrapper {
            margin-bottom: 30px;
        }

        .icon-wrapper svg {
            width: 100px;
            height: 100px;
            color: #4CAF50; /* Elemen hijau */
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        h1 {
            color: #333333;
            font-size: 2.2em;
            margin-bottom: 15px;
        }

        p {
            color: #666666;
            font-size: 1.1em;
            line-height: 1.6;
            margin-bottom: 25px;
        }

        .progress-bar-container {
            width: 80%;
            height: 10px;
            background-color: #e0e0e0;
            border-radius: 5px;
            margin: 0 auto 30px;
            overflow: hidden;
        }

        .progress-bar {
            width: 0%;
            height: 100%;
            background-color: #8BC34A; /* Hijau cerah */
            border-radius: 5px;
            animation: fillProgress 3s ease-out forwards;
        }

        @keyframes fillProgress {
            to {
                width: 75%; /* Angka bisa disesuaikan */
            }
        }

        .contact-info {
            font-size: 0.95em;
            color: #888888;
        }

        .contact-info a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: 600;
        }

        .contact-info a:hover {
            text-decoration: underline;
        }

        .floating-element {
            position: absolute;
            background-color: rgba(76, 175, 80, 0.1); /* Hijau transparan */
            border-radius: 50%;
            opacity: 0;
            animation: floatAndFade 15s infinite ease-in-out;
            pointer-events: none;
        }

        .floating-element:nth-child(2) {
            width: 80px;
            height: 80px;
            top: 10%;
            left: 5%;
            animation-delay: 1s;
        }

        .floating-element:nth-child(3) {
            width: 120px;
            height: 120px;
            bottom: 15%;
            right: 10%;
            animation-delay: 3s;
        }

        .floating-element:nth-child(4) {
            width: 60px;
            height: 60px;
            top: 30%;
            right: 20%;
            animation-delay: 5s;
        }

        .floating-element:nth-child(5) {
            width: 90px;
            height: 90px;
            bottom: 5%;
            left: 25%;
            animation-delay: 7s;
        }

        @keyframes floatAndFade {
            0% {
                transform: translateY(0) scale(0.8);
                opacity: 0;
            }
            25% {
                opacity: 0.5;
            }
            50% {
                transform: translateY(-20px) scale(1);
                opacity: 0.7;
            }
            75% {
                opacity: 0.5;
            }
            100% {
                transform: translateY(0) scale(0.8);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="background-dots"></div>
    <div class="floating-element"></div>
    <div class="floating-element"></div>
    <div class="floating-element"></div>
    <div class="floating-element"></div>

    <div class="container">
        <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.22l5.58 2.79L12 8.78 6.42 5.01 12 3.22zM12 19.72c-3.03-.68-5.4-3.32-5.4-6.52V7.5L12 10.3l5.4-2.8V13.2c0 3.2-2.37 5.84-5.4 6.52z"/>
                <path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
        </div>
        <h1>Fitur Reset Password Sedang Dikembangkan!</h1>
        <p>Kami sedang bekerja keras untuk menghadirkan fitur reset password yang lebih baik dan aman untuk pengalaman Anda yang lebih lancar.</p>
        <div class="progress-bar-container">
            <div class="progress-bar"></div>
        </div>
        <p>Terima kasih atas kesabaran dan pengertian Anda.</p>
        <p class="contact-info">Jika Anda memiliki pertanyaan mendesak, silakan hubungi tim dukungan kami di <a href="mailto:forbasi.pengurusbesar@gmail.com">forbasi.pengurusbesar@gmail.com</a>.</p>
    </div>
</body>
</html>