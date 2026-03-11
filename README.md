# FORBASI

Repositori ini berisi dua versi aplikasi FORBASI:

## Struktur

```
forbasi-app/
├── backend/      # Node.js + Express API (versi baru)
├── frontend/     # React + Vite (versi baru)
└── php/          # Referensi PHP legacy
    ├── index.php         # Entry point
    ├── style.css
    ├── sw.js
    └── forbasi/          # Aplikasi PHP utama
        ├── php/          # Script PHP (dashboard, KTA, dll)
        ├── css/
        ├── js/
        ├── config/       # Konfigurasi (lihat database.example.php)
        └── ...
```

## Setup Backend (Node.js)

```bash
cd backend
cp .env.example .env   # isi konfigurasi
npm install
npm run dev
```

## Setup Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Setup PHP (Legacy Reference)

1. Copy `php/forbasi/config/database.example.php` → `database.php`
2. Isi kredensial database
3. Jalankan SQL dari `php/forbasi/forbasi_db.sql`
4. Deploy ke web server (Apache/Nginx)
