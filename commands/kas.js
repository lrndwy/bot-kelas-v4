const db = require('../database/db');
const { isAdmin, isFromGroup, parseArguments, generateReply, formatRupiah, extractMentions, findStudentByMention } = require('../utils/helpers');
const { extractPhoneNumber } = require('../utils/messageLogger');

module.exports = {
  name: 'kas',
  description: 'Manajemen kas kelas',
  usage: '.kas <tambah|kurang|cek|list> [parameter]',
  category: 'Finance',
  onlyOwner: false,
  autoRead: true,
  presence: 'composing',
  react: '⏳',

  async handle(sock, m) {
    try {
      // 1. Cek harus di grup yang sudah diinisialisasi sebagai kelas
      if (!isFromGroup(m)) {
        return m.reply(generateReply(
          'Perintah Salah',
          'Command ini hanya bisa digunakan di grup kelas.',
          'error'
        ));
      }

      const groupId = m.key.remoteJid;
      const currentClass = db.getClassByGroupId(groupId);

      if (!currentClass) {
        return m.reply(generateReply(
          'Grup Belum Diinisialisasi',
          'Grup ini belum diinisialisasi sebagai kelas.',
          'error'
        ));
      }

      // 2. Parse subcommand
      const { args, error } = parseArguments(m.text, 1);
      if (error) {
        return m.reply(generateReply(
          'Parameter Kurang',
          getKasUsage(),
          'error'
        ));
      }

      const subCommand = args[0].toLowerCase();
      const subArgs = args.slice(1);

      // 3. Route ke subcommand yang sesuai
      switch (subCommand) {
        case 'tambah':
          return await handleTambahKas(m, currentClass, subArgs);
        case 'kurang':
          return await handleKurangKas(m, currentClass, subArgs);
        case 'keluar':
        case 'pengeluaran':
          return await handlePengeluaranKas(m, currentClass, subArgs);
        case 'cek':
          return await handleCekKas(m, currentClass, subArgs);
        case 'list':
          return await handleListKas(m, currentClass);
        case 'laporan':
          return await handleLaporanKas(m, currentClass);
        default:
          return m.reply(generateReply(
            'Subcommand Tidak Valid',
            getKasUsage(),
            'error'
          ));
      }

    } catch (error) {
      console.error('Error in kas command:', error);
      return m.reply(generateReply(
        'Error Sistem',
        'Terjadi kesalahan sistem. Silakan coba lagi.',
        'error'
      ));
    }
  }
};

/**
 * Handle tambah kas (Admin only)
 */
async function handleTambahKas(m, currentClass, args) {
  if (!isAdmin(m)) {
    return m.reply(generateReply(
      'Akses Ditolak',
      'Hanya admin yang dapat menambah kas mahasiswa.',
      'error'
    ));
  }

  if (args.length < 2) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format: .kas tambah @mahasiswa jumlah\nContoh: .kas tambah @mahasiswa 25000\n\n' +
      'Cara mention: ketik @ lalu pilih kontak mahasiswa dari daftar.',
      'error'
    ));
  }

  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0) {
    return m.reply(generateReply(
      'Jumlah Tidak Valid',
      'Jumlah kas harus berupa angka positif.',
      'error'
    ));
  }

  // Cari mahasiswa berdasarkan mention (LID)
  const student = findStudentByMention(m, db, currentClass.id);
  if (!student) {
    return m.reply(generateReply(
      'Mahasiswa Tidak Ditemukan',
      'Mahasiswa yang di-mention tidak terdaftar di kelas ini.\n\n' +
      'Pastikan:\n' +
      '• Mahasiswa sudah mendaftar dengan .daftarmhs\n' +
      '• Anda mention dengan benar (@nama)',
      'error'
    ));
  }

  // Tambah transaksi
  const result = db.addCashRecord(student.id, amount);
  const newBalance = db.getStudentBalance(student.id);

  return m.reply(generateReply(
    'Kas Berhasil Ditambah',
    `💰 *Mahasiswa:* ${student.name}\n` +
    `📱 *Nomor:* ${student.phone_number}\n` +
    `🆔 *LID:* ${student.lid}\n` +
    `➕ *Ditambah:* ${formatRupiah(amount)}\n` +
    `💳 *Saldo Sekarang:* ${formatRupiah(newBalance)}`,
    'success'
  ));
}

/**
 * Handle kurang kas (Admin only)
 */
async function handleKurangKas(m, currentClass, args) {
  if (!isAdmin(m)) {
    return m.reply(generateReply(
      'Akses Ditolak',
      'Hanya admin yang dapat mengurangi kas mahasiswa.',
      'error'
    ));
  }

  if (args.length < 2) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format: .kas kurang @mahasiswa jumlah\nContoh: .kas kurang @mahasiswa 5000\n\n' +
      'Cara mention: ketik @ lalu pilih kontak mahasiswa dari daftar.',
      'error'
    ));
  }

  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0) {
    return m.reply(generateReply(
      'Jumlah Tidak Valid',
      'Jumlah kas harus berupa angka positif.',
      'error'
    ));
  }

  // Cari mahasiswa berdasarkan mention (LID)
  const student = findStudentByMention(m, db, currentClass.id);
  if (!student) {
    return m.reply(generateReply(
      'Mahasiswa Tidak Ditemukan',
      'Mahasiswa yang di-mention tidak terdaftar di kelas ini.\n\n' +
      'Pastikan:\n' +
      '• Mahasiswa sudah mendaftar dengan .daftarmhs\n' +
      '• Anda mention dengan benar (@nama)',
      'error'
    ));
  }

  // Kurangi kas (negative amount)
  const result = db.addCashRecord(student.id, -amount);
  const newBalance = db.getStudentBalance(student.id);

  return m.reply(generateReply(
    'Kas Berhasil Dikurangi',
    `💰 *Mahasiswa:* ${student.name}\n` +
    `📱 *Nomor:* ${student.phone_number}\n` +
    `🆔 *LID:* ${student.lid}\n` +
    `➖ *Dikurangi:* ${formatRupiah(amount)}\n` +
    `💳 *Saldo Sekarang:* ${formatRupiah(newBalance)}`,
    'success'
  ));
}

/**
 * Handle pengeluaran kas kelas (Admin only)
 */
async function handlePengeluaranKas(m, currentClass, args) {
  if (!isAdmin(m)) {
    return m.reply(generateReply(
      'Akses Ditolak',
      'Hanya admin yang dapat mengeluarkan kas kelas.',
      'error'
    ));
  }

  if (args.length < 2) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format: .kas keluar <jumlah> <keterangan>\nContoh: .kas keluar 50000 Beli snack ulang tahun kelas\n\n' +
      'Format alternatif: .kas pengeluaran <jumlah> <keterangan>',
      'error'
    ));
  }

  const amount = parseInt(args[0]);
  const description = args.slice(1).join(' ');

  if (isNaN(amount) || amount <= 0) {
    return m.reply(generateReply(
      'Jumlah Tidak Valid',
      'Jumlah pengeluaran harus berupa angka positif.',
      'error'
    ));
  }

  if (!description || description.trim().length < 3) {
    return m.reply(generateReply(
      'Keterangan Tidak Valid',
      'Keterangan pengeluaran harus minimal 3 karakter.',
      'error'
    ));
  }

  // Hitung total kas kelas sebelum pengeluaran
  const cashData = db.getCashRecordsByClass(currentClass.id);
  const totalKasMahasiswa = cashData.reduce((sum, data) => sum + data.balance, 0);

  // Ambil total pengeluaran sebelumnya
  const existingExpenses = db.getClassExpenses(currentClass.id);
  const totalPengeluaran = existingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const sisaKas = totalKasMahasiswa - totalPengeluaran;

  if (amount > sisaKas) {
    return m.reply(generateReply(
      'Saldo Tidak Mencukupi',
      `💰 *Total Kas Mahasiswa:* ${formatRupiah(totalKasMahasiswa)}\n` +
      `💸 *Total Pengeluaran:* ${formatRupiah(totalPengeluaran)}\n` +
      `💳 *Sisa Kas:* ${formatRupiah(sisaKas)}\n\n` +
      `❌ Pengeluaran ${formatRupiah(amount)} melebihi sisa kas kelas!`,
      'error'
    ));
  }

  // Catat pengeluaran
  const expense = db.addClassExpense(currentClass.id, amount, description);
  const newSisaKas = sisaKas - amount;

  return m.reply(generateReply(
    'Pengeluaran Kas Berhasil',
    `💸 *Pengeluaran Kas Kelas*\n\n` +
    `🏫 *Kelas:* ${currentClass.name}\n` +
    `💰 *Jumlah:* ${formatRupiah(amount)}\n` +
    `📝 *Keterangan:* ${description}\n` +
    `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID')}\n\n` +
    `💳 *Sisa Kas Setelah Pengeluaran:* ${formatRupiah(newSisaKas)}`,
    'success'
  ));
}

/**
 * Handle cek kas individual
 */
async function handleCekKas(m, currentClass, args) {
  let student = null;

  // Jika ada mention, cek kas mahasiswa yang di-mention
  if (args.length > 0) {
    student = findStudentByMention(m, db, currentClass.id);
  }

  // Jika tidak ada mention atau tidak ditemukan, cek kas sendiri
  if (!student) {
    const senderPhone = extractPhoneNumber(m);
    student = db.getStudentByPhone(senderPhone);

    if (!student || student.class_id !== currentClass.id) {
      return m.reply(generateReply(
        'Mahasiswa Tidak Ditemukan',
        'Anda belum terdaftar sebagai mahasiswa di kelas ini.\n\n' +
        'Silakan daftar terlebih dahulu dengan:\n' +
        '*.daftarmhs [Nama Lengkap]*',
        'error'
      ));
    }
  }

  // Ambil riwayat transaksi
  const records = db.getCashRecordsByStudent(student.id);
  const balance = db.getStudentBalance(student.id);

  let message = `💰 *Info Kas Mahasiswa*\n\n`;
  message += `👤 *Nama:* ${student.name}\n`;
  message += `📱 *Nomor:* ${student.phone_number}\n`;
  message += `🆔 *LID:* ${student.lid}\n`;
  message += `💳 *Saldo:* ${formatRupiah(balance)}\n\n`;

  if (records.length === 0) {
    message += `📝 *Riwayat Transaksi:* Belum ada transaksi`;
  } else {
    message += `📝 *Riwayat Transaksi:*\n`;
    records.slice(-5).forEach((record, index) => {
      const date = new Date(record.created_at).toLocaleDateString('id-ID');
      const type = record.amount > 0 ? '➕' : '➖';
      message += `${type} ${formatRupiah(Math.abs(record.amount))} - ${date}\n`;
    });

    if (records.length > 5) {
      message += `\n... dan ${records.length - 5} transaksi lainnya`;
    }
  }

  return m.reply(generateReply(
    'Info Kas',
    message,
    'info'
  ));
}

/**
 * Handle list kas seluruh kelas
 */
async function handleListKas(m, currentClass) {
  const cashData = db.getCashRecordsByClass(currentClass.id);

  if (cashData.length === 0) {
    return m.reply(generateReply(
      'Kas Kelas Kosong',
      'Belum ada mahasiswa yang terdaftar di kelas ini.',
      'info'
    ));
  }

  let totalBalance = 0;
  let message = `💰 *Kas Kelas ${currentClass.name}*\n\n`;

  // Hitung total pengeluaran
  const expenses = db.getClassExpenses(currentClass.id);
  const totalPengeluaran = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  cashData.forEach((data, index) => {
    totalBalance += data.balance;
    const status = data.balance >= 0 ? '✅' : '❌';
    message += `${index + 1}. ${status} ${data.student.name}\n`;
    message += `   💳 ${formatRupiah(data.balance)}\n\n`;
  });

  const sisaKas = totalBalance - totalPengeluaran;

  message += `💰 *Total Kas Mahasiswa:* ${formatRupiah(totalBalance)}\n`;
  message += `💸 *Total Pengeluaran:* ${formatRupiah(totalPengeluaran)}\n`;
  message += `💵 *Sisa Kas Kelas:* ${formatRupiah(sisaKas)}\n\n`;
  message += `💡 *Tips:* Gunakan *.kas laporan* untuk melihat detail lengkap`;

  return m.reply(generateReply(
    'Daftar Kas Kelas',
    message,
    'info'
  ));
}

/**
 * Handle laporan kas lengkap (termasuk pengeluaran)
 */
async function handleLaporanKas(m, currentClass) {
  const cashData = db.getCashRecordsByClass(currentClass.id);

  if (cashData.length === 0) {
    return m.reply(generateReply(
      'Kas Kelas Kosong',
      'Belum ada mahasiswa yang terdaftar di kelas ini.',
      'info'
    ));
  }

  // Hitung total kas mahasiswa
  const totalKasMahasiswa = cashData.reduce((sum, data) => sum + data.balance, 0);

  // Ambil data pengeluaran
  const expenses = db.getClassExpenses(currentClass.id);
  const totalPengeluaran = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const sisaKas = totalKasMahasiswa - totalPengeluaran;

  let message = `📊 *Laporan Kas Kelas ${currentClass.name}*\n\n`;

  // Ringkasan Kas
  message += `💰 *RINGKASAN KAS:*\n`;
  message += `💳 Total Kas Mahasiswa: ${formatRupiah(totalKasMahasiswa)}\n`;
  message += `💸 Total Pengeluaran: ${formatRupiah(totalPengeluaran)}\n`;
  message += `💵 Sisa Kas: ${formatRupiah(sisaKas)}\n\n`;

  // Daftar Pengeluaran Terbaru
  if (expenses.length > 0) {
    message += `💸 *PENGELUARAN TERBARU:*\n`;
    expenses.slice(-5).forEach((expense, index) => {
      const date = new Date(expense.created_at).toLocaleDateString('id-ID');
      message += `${index + 1}. ${formatRupiah(expense.amount)}\n`;
      message += `   📝 ${expense.description}\n`;
      message += `   📅 ${date}\n\n`;
    });

    if (expenses.length > 5) {
      message += `... dan ${expenses.length - 5} pengeluaran lainnya\n\n`;
    }
  } else {
    message += `💸 *PENGELUARAN:* Belum ada pengeluaran\n\n`;
  }

  // Status Kas Mahasiswa
  message += `👥 *STATUS KAS MAHASISWA:*\n`;
  cashData.forEach((data, index) => {
    const status = data.balance >= 0 ? '✅' : '❌';
    message += `${index + 1}. ${status} ${data.student.name}: ${formatRupiah(data.balance)}\n`;
  });

  return m.reply(generateReply(
    'Laporan Kas Kelas',
    message,
    'info'
  ));
}

/**
 * Get kas command usage
 */
function getKasUsage() {
  return `📖 *Cara Penggunaan Kas:*\n\n` +
    `👥 *MAHASISWA:*\n` +
    `🔹 *.kas cek* - Cek kas sendiri\n` +
    `🔹 *.kas cek @nomor* - Cek kas mahasiswa lain\n` +
    `🔹 *.kas list* - Lihat kas seluruh kelas\n` +
    `🔹 *.kas laporan* - Laporan kas lengkap\n\n` +
    `⚙️ *ADMIN:*\n` +
    `🔹 *.kas tambah @nomor jumlah* - Tambah kas mahasiswa\n` +
    `🔹 *.kas kurang @nomor jumlah* - Kurangi kas mahasiswa\n` +
    `🔹 *.kas keluar jumlah keterangan* - Pengeluaran kas kelas\n\n` +
    `*Contoh:*\n` +
    `• .kas tambah @6281234567890 25000\n` +
    `• .kas kurang @6281234567890 5000\n` +
    `• .kas keluar 50000 Beli snack ulang tahun\n` +
    `• .kas cek @6281234567890`;
}
