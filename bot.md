# 📌 Deskripsi Lengkap Bot WhatsApp Kelas

> ✅ **STATUS: FULLY IMPLEMENTED** - Bot sudah siap digunakan!
> 🚀 **READY TO USE** - Semua fitur telah diimplementasi sesuai spesifikasi

# 🎯 Tujuan

Bot WhatsApp untuk 3 kelas dengan fitur:

1. **Manajemen kelas** → bot bisa masuk grup kelas, admin ditentukan lewat `.env`.
2. **Inisialisasi mahasiswa** → menyimpan identitas nomor & nama mahasiswa dalam database.
3. **Manajemen kas kelas** → mencatat transaksi kas per mahasiswa.
4. **Pengingat tugas** → mencatat tugas dengan deadline, lalu mengingatkan otomatis ke grup.

---

# 📌 Fitur Utama

# 1. **Manajemen Kelas**

* Admin dapat mendaftarkan grup sebagai kelas.
* Setiap grup → representasi satu kelas.
* Admin hanya bisa ditentukan lewat `.env` (contoh: `ADMIN_NUMBERS=6281234567890,6289876543210`).

**Command:**

```
!initkelas NamaKelas
```

---

# 2. **Inisialisasi Mahasiswa**

* Mahasiswa diinisialisasi per kelas.
* Setiap mahasiswa mendaftarkan diri sendiri dengan mengirim command:

  ```
  .daftarmhs Andi Pratama
  ```
* Bot akan mengambil nomor telepon dari pengirim pesan → simpan nomor & nama → kaitkan ke kelas.

---

# 3. **Manajemen Kas Kelas**

* Bot mencatat transaksi kas per mahasiswa.
* Bukan hanya saldo, tetapi **riwayat transaksi** supaya lebih transparan.

**Command:**

* Tambah kas mahasiswa:

  ```
  !kas tambah @6281234567890 20000
  ```
* Lihat kas kelas:

  ```
  !kas list
  ```
* Lihat kas per mahasiswa:

  ```
  !kas cek @6281234567890
  ```

---

# 4. **Manajemen & Reminder Tugas**

* Admin menambahkan tugas dengan judul, deadline, deskripsi.
* Reminder otomatis dikirim ke grup:

  * **H-7 (1 minggu sebelum deadline)**
  * **H-3 (3 hari sebelum deadline)**
  * **H-1 (1 hari sebelum deadline)**
* Reminder bisa dikustomisasi saat membuat tugas (`remind=7,3,1`).

**Command:**

* Tambah tugas:

  ```
  !tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman"
  ```
* Tambah tugas dengan reminder custom:

  ```
  !tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman" remind=7,3,1
  ```
* Lihat daftar tugas:

  ```
  !tugas list
  ```
* Lihat detail reminder tugas:

  ```
  !tugas reminder <id_tugas>
  ```

---

# 📌 Struktur Database (Penyimpanan menggunakan JSON saja)

### Tabel: classes (Kelas)
- id → integer, primary key, auto increment
- name → text, tidak boleh kosong
- group_id → text, unik, tidak boleh kosong (ID grup WhatsApp)

### Tabel: students (Mahasiswa)
- id → integer, primary key, auto increment
- class_id → integer, foreign key → classes.id
- phone_number → text, unik, tidak boleh kosong (nomor HP mahasiswa)
- name → text, tidak boleh kosong
- lid → text, unik, tidak boleh kosong (Local Identifier WhatsApp)

### Tabel: cash_records (Kas / Riwayat Transaksi)
- id → integer, primary key, auto increment
- student_id → integer, foreign key → students.id
- amount → integer, tidak boleh kosong
- nilai positif = setor
- nilai negatif = utang / pengeluaran
- created_at → datetime, default = waktu saat data dibuat

### Tabel: tasks (Tugas)
- id → integer, primary key, auto increment
- class_id → integer, foreign key → classes.id
- title → text, tidak boleh kosong (judul tugas)
- deadline → date, tidak boleh kosong (tanggal deadline)
- description → text, opsional (deskripsi tugas)
- reminder_days → text, default '7,3,1' (format CSV → hari sebelum deadline, contoh: 7,3,1)
- created_at → datetime, default = waktu saat data dibuat


---

# 📌 Flow Reminder Tugas

1. Admin membuat tugas dengan command:

   ```
   !tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman" remind=7,3,1
   ```
2. Bot simpan ke DB dengan `deadline=2025-09-20` dan `reminder_days=7,3,1`.
3. Scheduler bot (contoh `node-cron` atau job harian) akan cek setiap tugas → kirim reminder sesuai jadwal:

   * 13 Sept → "Reminder: 7 hari lagi deadline tugas *Makalah Pancasila*."
   * 17 Sept → "Reminder: 3 hari lagi deadline tugas *Makalah Pancasila*."
   * 19 Sept → "Reminder: Besok deadline tugas *Makalah Pancasila*."

---

# 📌 Ringkasan

* **Kelas** → grup WA, diinisialisasi dengan `!initkelas`.
* **Mahasiswa** → diinisialisasi massal dengan format `@nomor,nama`.
* **Kas** → riwayat transaksi per mahasiswa, bisa dicek total maupun individu.
* **Tugas** → ada deadline, deskripsi, dan reminder otomatis (default 7-3-1 hari sebelum).
* **Admin** → ditentukan lewat `.env`, hanya admin yang bisa jalankan command sensitif.

---

# 🚀 IMPLEMENTASI LENGKAP

## 📁 Struktur File yang Dibuat

```
/database/
  - db.js                    # Database JSON handler
  - data/
    - classes.json          # Data kelas
    - students.json         # Data mahasiswa
    - cash_records.json     # Data transaksi kas
    - tasks.json           # Data tugas

/commands/
  - initkelas.js             # Inisialisasi kelas
  - daftarmhs.js            # Pendaftaran mahasiswa individu
  - kas.js                  # Manajemen kas kelas
  - tugas.js                # Manajemen tugas
  - menu.js                 # Menu utama (updated)
  - testreminder.js         # Testing reminder system

/utils/
  - reminder.js             # Sistem reminder otomatis

env.example                 # Template environment variables
```

## ⚙️ Setup dan Instalasi

1. **Install Dependencies:**
   ```bash
   yarn install
   ```

2. **Konfigurasi Admin:**
   - Copy `env.example` ke `.env`
   - Set `ADMIN_NUMBERS` dengan nomor admin (pisah dengan koma)
   ```
   ADMIN_NUMBERS=6281234567890,6289876543210
   ```

3. **Jalankan Bot:**
   ```bash
   yarn start
   # atau untuk development:
   yarn dev
   ```

## 🎯 Cara Penggunaan

### 1. Inisialisasi Kelas (Admin Only)
```
.initkelas Kelas-3A
```

### 2. Daftarkan Mahasiswa (Setiap Mahasiswa)
```
.daftarmhs Andi Pratama
```

### 3. Manajemen Kas
```
# Tambah kas (Admin only)
.kas tambah @6281234567890 25000

# Kurangi kas (Admin only)
.kas kurang @6281234567890 5000

# Lihat kas semua mahasiswa
.kas list

# Lihat kas mahasiswa tertentu
.kas cek @6281234567890
```

### 4. Manajemen Tugas
```
# Tambah tugas (Admin only)
.tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman"

# Tambah dengan reminder custom (Admin only)
.tugas tambah "Quiz Matematika" "2025-09-15" "Bab 1-3" remind=3,1

# Lihat daftar tugas
.tugas list

# Lihat detail tugas
.tugas detail 1

# Lihat jadwal reminder
.tugas reminder 1
```

### 5. Commands Umum
```
.menu          # Lihat menu utama
.ping          # Cek status bot
.testreminder  # Test sistem reminder (Admin only)
```

## 🔔 Sistem Reminder Otomatis

- **Jadwal:** Setiap jam 8 pagi dan setiap 4 jam
- **Default reminder:** 7 hari, 3 hari, 1 hari sebelum deadline
- **Custom reminder:** Bisa diatur saat membuat tugas
- **Auto-start:** Sistem otomatis berjalan saat bot connect

## ✨ Fitur yang Diimplementasi

✅ **Manajemen Kelas**
- Inisialisasi grup sebagai kelas
- Validasi grup unik per kelas

✅ **Inisialisasi Mahasiswa**
- Pendaftaran individu dengan format `.daftarmhs [nama lengkap]`
- Validasi nomor telepon unik
- Otomatis mengambil nomor dari pengirim pesan

✅ **Manajemen Kas Kelas**
- Riwayat transaksi lengkap
- Saldo per mahasiswa dan total kelas
- Transaksi positif (setor) dan negatif (utang)

✅ **Manajemen & Reminder Tugas**
- Tugas dengan deadline dan deskripsi
- Reminder otomatis dengan jadwal custom
- Status tugas (normal/mendesak/terlewat)

✅ **Sistem Admin**
- Multi-admin support via environment variable
- Parsing nomor telepon dari participantAlt
- Command authorization berdasarkan nomor

✅ **Database JSON**
- Auto-increment ID
- Relasi antar tabel (foreign key simulation)
- File backup dan recovery

## 🎯 Bot Siap Digunakan!

Semua fitur sesuai spesifikasi di Bot.md telah diimplementasi dengan lengkap. Bot dapat langsung dijalankan dan digunakan untuk mengelola 3 kelas atau lebih.
