const { isAdmin, isFromGroup, generateReply } = require('../utils/helpers');

module.exports = {
  name: 'menu',
  description: 'Tampilkan menu utama bot',
  usage: '.menu',
  category: 'General',
  autoRead: true,
  react: "📋",
  presence: "composing",
  onlyOwner: false,

  handle: (sock, m) => {
    const isUserAdmin = isAdmin(m);
    const isGroupChat = isFromGroup(m);

    let menuMessage = `🤖 *BOT WHATSAPP KELAS V4*\n\n`;
    menuMessage += `👋 Halo! Saya adalah bot untuk manajemen kelas.\n\n`;

    if (isGroupChat) {
      menuMessage += `📚 *FITUR KELAS:*\n`;
      menuMessage += `• .daftarmhs <nama> - Daftar sebagai mahasiswa\n`;
      menuMessage += `• .kas cek - Cek kas sendiri\n`;
      menuMessage += `• .kas list - Lihat kas seluruh kelas\n`;
      menuMessage += `• .kas laporan - Laporan kas lengkap (dengan pengeluaran)\n`;
      menuMessage += `• .tugas list - Lihat daftar tugas\n`;
      menuMessage += `• .tugas detail <id> - Detail tugas\n`;
      menuMessage += `• .tugas reminder <id> - Lihat jadwal reminder tugas\n`;
      menuMessage += `• .matkul - Lihat jadwal mata kuliah\n\n`;

      menuMessage += `💡 *INFO FITUR:*\n`;
      menuMessage += `• Kas laporan: Menampilkan total kas, pengeluaran, dan sisa kas\n`;
      menuMessage += `• Tugas reminder: Sistem otomatis mengingatkan sebelum deadline\n`;
      menuMessage += `• Deadline tugas: Format YYYY-MM-DD (Tahun-Bulan-Hari)\n\n`;

      if (isUserAdmin) {
        menuMessage += `⚙️ *FITUR ADMIN:*\n`;
        menuMessage += `• .initkelas <nama> - Inisialisasi kelas\n`;
        menuMessage += `• .kas tambah @nomor jumlah - Tambah kas mahasiswa\n`;
        menuMessage += `• .kas kurang @nomor jumlah - Kurangi kas mahasiswa\n`;
        menuMessage += `• .kas keluar jumlah keterangan - Pengeluaran kas kelas\n`;
        menuMessage += `• .tugas tambah - Tambah tugas (lihat detail di bawah)\n`;
        menuMessage += `• .setmatkul - Set jadwal mata kuliah (dengan gambar)\n`;
        menuMessage += `• .testreminder - Test sistem reminder\n\n`;

        menuMessage += `💰 *DETAIL KAS:*\n`;
        menuMessage += `• .kas keluar: Untuk pengeluaran dari kas kelas\n`;
        menuMessage += `• Format: .kas keluar <jumlah> <keterangan>\n`;
        menuMessage += `• Contoh: .kas keluar 50000 Beli snack ulang tahun kelas\n`;
        menuMessage += `• Akan dicek apakah saldo kas kelas mencukupi\n\n`;

        menuMessage += `📚 *DETAIL TUGAS:*\n`;
        menuMessage += `Format: .tugas tambah judul YYYY-MM-DD deskripsi [remind=x,y,z]\n\n`;
        menuMessage += `🗓️ *Deadline (YYYY-MM-DD):*\n`;
        menuMessage += `• Format tanggal: Tahun-Bulan-Hari\n`;
        menuMessage += `• Contoh: 2025-09-25 (25 September 2025)\n`;
        menuMessage += `• Contoh: 2025-12-15 (15 Desember 2025)\n\n`;
        menuMessage += `🔔 *Parameter Remind (opsional):*\n`;
        menuMessage += `• remind=7,3,1 (reminder 7, 3, dan 1 hari sebelum deadline)\n`;
        menuMessage += `• remind=5,2 (reminder 5 dan 2 hari sebelum deadline)\n`;
        menuMessage += `• Jika tidak diisi: default remind=7,3,1\n\n`;
        menuMessage += `*Contoh Lengkap:*\n`;
        menuMessage += `• .tugas tambah Quiz 2025-09-25 Kuis matematika bab 1-3\n`;
        menuMessage += `• .tugas tambah Makalah 2025-10-15 Tulis makalah Pancasila remind=10,5,2\n\n`;
        menuMessage += `📅 *DETAIL JADWAL MATA KULIAH:*\n`;
        menuMessage += `• .setmatkul: Kirim gambar jadwal dengan command ini\n`;
        menuMessage += `• Hanya admin yang bisa mengatur jadwal\n`;
        menuMessage += `• Jadwal akan ter-update jika admin kirim jadwal baru\n`;
        menuMessage += `• .matkul: Semua anggota grup bisa lihat jadwal\n\n`;
      }
    } else {
      menuMessage += `📱 *CHAT PRIVATE:*\n`;
      menuMessage += `Silakan gunakan bot di grup kelas yang sudah diinisialisasi.\n\n`;

      if (isUserAdmin) {
        menuMessage += `⚙️ *ADMIN:* Anda memiliki akses admin.\n\n`;
      }
    }

    menuMessage += `🔧 *FITUR UMUM:*\n`;
    menuMessage += `• .menu - Tampilkan menu ini\n`;
    menuMessage += `• .ping - Cek status bot\n\n`;

    menuMessage += `📖 *PANDUAN PENGGUNAAN:*\n`;
    menuMessage += `1. Admin inisialisasi grup dengan .initkelas\n`;
    menuMessage += `2. Mahasiswa daftar sendiri dengan .daftarmhs\n`;
    menuMessage += `3. Admin kelola kas dan tugas\n`;
    menuMessage += `4. Reminder tugas otomatis\n\n`;

    menuMessage += `💡 *Tips:* Gunakan quotes untuk parameter yang mengandung spasi\n`;
    menuMessage += `Contoh: .tugas tambah "Makalah Pancasila" "2025-09-20"`;

    return m.reply(generateReply(
      'Menu Bot Kelas',
      menuMessage,
      'info'
    ));
  }
};
