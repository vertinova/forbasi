<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplikasi Ditangguhkan - PB Forbasi</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #e74c3c; /* Merah untuk suspend */
            --secondary-color: #f1c40f; /* Kuning untuk peringatan */
            --dark-color: #2c3e50;
            --light-color: #ecf0f1;
            --background-gradient: linear-gradient(135deg, #3498db, #8e44ad);
        }

        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background: var(--background-gradient);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: var(--dark-color);
            overflow: hidden;
        }

        .container {
            background-color: #ffffff;
            border-radius: 20px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            padding: 50px;
            max-width: 550px;
            text-align: center;
            position: relative;
            overflow: hidden;
            animation: fadeIn 1s ease-out forwards;
        }

        .icon-wrapper {
            margin-bottom: 30px;
            position: relative;
        }

        .icon {
            font-size: 80px;
            color: var(--primary-color);
            display: inline-block;
            animation: bounceIn 1.2s ease-out forwards;
        }

        h1 {
            color: var(--primary-color);
            font-size: 2.8em;
            margin-bottom: 20px;
            font-weight: 700;
            animation: slideInUp 1s ease-out forwards;
            animation-delay: 0.3s;
            opacity: 0;
        }

        p {
            font-size: 1.1em;
            line-height: 1.6;
            margin-bottom: 30px;
            color: var(--dark-color);
            animation: slideInUp 1s ease-out forwards;
            animation-delay: 0.6s;
            opacity: 0;
        }

        .contact-info {
            background-color: var(--light-color);
            border-left: 5px solid var(--secondary-color);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            animation: slideInUp 1s ease-out forwards;
            animation-delay: 0.9s;
            opacity: 0;
        }

        .contact-info p {
            margin: 0;
            font-size: 1em;
            color: var(--dark-color);
        }

        .contact-info strong {
            color: var(--primary-color);
        }

        /* --- Animasi --- */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounceIn {
            0%, 20%, 40%, 60%, 80%, 100% {
                -webkit-transform: translateY(0);
                transform: translateY(0);
            }
            0% {
                opacity: 0;
                -webkit-transform: scale3d(.3, .3, .3);
                transform: scale3d(.3, .3, .3);
            }
            20% {
                -webkit-transform: translateY(-30px);
                transform: translateY(-30px);
            }
            40% {
                -webkit-transform: translateY(-15px);
                transform: translateY(-15px);
            }
            60% {
                -webkit-transform: translateY(-5px);
                transform: translateY(-5px);
            }
            100% {
                opacity: 1;
            }
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Dekorasi background dengan pseudo-elements */
        .container::before,
        .container::after {
            content: '';
            position: absolute;
            background-color: rgba(231, 76, 60, 0.05); /* Sedikit warna primary */
            border-radius: 50%;
            z-index: -1;
            animation: float 8s ease-in-out infinite;
        }

        .container::before {
            width: 150px;
            height: 150px;
            top: -50px;
            left: -50px;
            animation-delay: 0s;
        }

        .container::after {
            width: 100px;
            height: 100px;
            bottom: -30px;
            right: -30px;
            animation-delay: 2s;
            background-color: rgba(241, 196, 15, 0.05); /* Sedikit warna secondary */
        }

        @keyframes float {
            0% { transform: translate(0, 0); }
            50% { transform: translate(10px, 10px); }
            100% { transform: translate(0, 0); }
        }

        /* Responsive */
        @media (max-width: 600px) {
            .container {
                margin: 20px;
                padding: 30px;
            }
            h1 {
                font-size: 2em;
            }
            .icon {
                font-size: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-wrapper">
            <span class="icon">⚠️</span>
        </div>
        <h1>Aplikasi Ditangguhkan</h1>
        <p>Mohon maaf, aplikasi ini sementara tidak dapat diakses.</p>
        <p>Untuk informasi lebih lanjut dan bantuan, silakan segera hubungi pihak <strong>PB Forbasi</strong>.</p>
        <div class="contact-info">
           
            <p>Terima kasih atas pengertian Anda.</p>
        </div>
    </div>
</body>
</html>