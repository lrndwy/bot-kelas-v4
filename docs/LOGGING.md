# 📋 Sistem Logging WhatsApp Bot

## 🎯 Deskripsi

Sistem logging yang telah diperbaiki untuk menampilkan informasi pesan WhatsApp dengan format yang rapi dan terstruktur, menggantikan output JSON mentah yang sulit dibaca.

## ✨ Fitur

- **Format Terstruktur**: Output yang rapi dengan pemisah visual
- **Informasi Lengkap**: Semua data penting ditampilkan dengan jelas
- **Warna-warni**: Menggunakan chalk untuk output berwarna
- **Dual Mode**: Mode verbose (detail) dan compact (ringkas)
- **Auto-detect**: Otomatis membedakan pesan grup vs private chat

## 📊 Informasi yang Ditampilkan

### 👤 Informasi Pengirim
- Push Name / Username
- Nomor Telepon
- JID (Jabber ID)
- LID (Local Identifier)
- Status From Me
- Status Owner

### 💬 Informasi Chat
- Tipe Chat (Grup/Private)
- Group ID (jika grup)
- Chat ID
- Participant Info

### 📝 Informasi Pesan
- Tipe Pesan
- Text Content
- Status Command
- Command Name (jika command)
- Arguments (jika command)

### 🔗 Informasi Tambahan
- Message ID
- Timestamp
- Status Link
- Status Mention
- Status Quoted

## 🎨 Mode Logging

### Mode Verbose (Detail)
```bash
# Untuk development/debugging
VERBOSE=true yarn start
```

Output format box dengan semua detail:
```
════════════════════════════════════════════════════════════════════════════════
📱 PESAN WHATSAPP - 13/09/25 14:30:25
════════════════════════════════════════════════════════════════════════════════
👤 PENGIRIM:
   • Push Name    : Andi Pratama
   • Nomor        : 6281234567890
   • JID          : 6281234567890@s.whatsapp.net
   • LID          : 251625574813765@lid
   • From Me      : Tidak
   • Owner        : Tidak

💬 CHAT INFO:
   • Tipe         : Grup
   • Group ID     : 120363420546534209@g.us
   • Participant  : 263517718470756@lid

📝 PESAN:
   • Tipe         : conversation
   • Text         : .daftarmhs Andi Pratama
   • Is Command   : Ya
   • Command      : .daftarmhs
   • Arguments    : [Andi Pratama]

🔗 TAMBAHAN:
   • Message ID   : 3B6F466D086A6F8EFFF9
   • Timestamp    : 1757749303
   • Is Link      : Tidak
   • Mentioned    : Tidak
   • Quoted       : Tidak
════════════════════════════════════════════════════════════════════════════════
```

### Mode Compact (Ringkas)
```bash
# Default mode
yarn start
```

Output format satu baris:
```
[14:30:25] GROUP Andi Pratama (6281234567890) .daftarmhs: Andi Pratama
[14:31:10] PRIVATE Budi Santoso (6289876543210): Halo bot
```

## ⚙️ Konfigurasi

### Environment Variables
```bash
# Mode verbose logging (default: false)
VERBOSE=true

# Mode development (default: production)
NODE_ENV=development
```

### Global Config
Di `config/global.js`:
```javascript
global.verbose = process.env.VERBOSE === "true" || false;
global.dev = process.env.NODE_ENV === "development";
```

## 🔧 Penggunaan

### Import Functions
```javascript
const { logMessage, logMessageCompact, extractPhoneNumber, extractLID } = require("./utils/messageLogger");
```

### Manual Logging
```javascript
// Log detail
logMessage(messageObject);

// Log ringkas
logMessageCompact(messageObject);

// Extract data
const phone = extractPhoneNumber(messageObject);
const lid = extractLID(messageObject);
```

## 📱 Contoh Output

### Pesan Grup
```
[14:30:25] GROUP Andi Pratama (6281234567890) .kas: cek @6289876543210
```

### Pesan Private
```
[14:31:10] PRIVATE Budi Santoso (6289876543210): Halo, bagaimana kabar kelas?
```

### Command dengan Arguments
```
[14:32:15] GROUP Admin Kelas (6285555555555) .tugas: tambah "Quiz Matematika" "2025-09-20" "Bab 1-3"
```

## 🎯 Manfaat

1. **Debugging Mudah**: Format terstruktur memudahkan debugging
2. **Monitoring Real-time**: Dapat memantau aktivitas bot secara real-time
3. **Informasi Lengkap**: Semua data penting tersedia dalam satu tempat
4. **Performance**: Mode compact menghemat space terminal
5. **Professional**: Output yang rapi dan mudah dibaca

## 🔄 Migration dari Console.log

**Sebelum:**
```javascript
console.log(m); // Output JSON mentah yang sulit dibaca
```

**Sesudah:**
```javascript
if (global.dev || global.verbose) {
  logMessage(m); // Detail untuk development
} else {
  logMessageCompact(m); // Ringkas untuk production
}
```

Sistem baru ini memberikan fleksibilitas antara detail debugging dan monitoring production yang efisien.
