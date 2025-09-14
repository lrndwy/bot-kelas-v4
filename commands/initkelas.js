const db = require('../database/db');
const { isAdmin, isFromGroup, parseArguments, generateReply } = require('../utils/helpers');

module.exports = {
  name: 'initkelas',
  description: 'Inisialisasi grup sebagai kelas (Admin only)',
  usage: '.initkelas <nama_kelas>',
  category: 'Admin',
  onlyOwner: false,
  autoRead: true,
  presence: 'composing',
  react: '⏳',

  async handle(sock, m) {
    try {
      // 1. Cek hanya admin yang bisa menggunakan command ini
      if (!isAdmin(m)) {
        return m.reply(generateReply(
          'Akses Ditolak',
          'Hanya admin yang dapat menginisialisasi kelas.',
          'error'
        ));
      }

      // 2. Cek harus di grup
      if (!isFromGroup(m)) {
        return m.reply(generateReply(
          'Perintah Salah',
          'Command ini hanya bisa digunakan di grup WhatsApp.',
          'error'
        ));
      }

      // 3. Parse arguments
      const { args, error } = parseArguments(m.text, 1);
      if (error) {
        return m.reply(generateReply(
          'Parameter Kurang',
          `${error}\n\nContoh penggunaan:\n.initkelas Kelas-3A`,
          'error'
        ));
      }

      const className = args.join(' ').trim();
      const groupId = m.key.remoteJid;

      // 4. Validasi nama kelas
      if (className.length < 2) {
        return m.reply(generateReply(
          'Nama Kelas Tidak Valid',
          'Nama kelas minimal 2 karakter.',
          'error'
        ));
      }

      // 5. Tambahkan kelas ke database
      const result = db.addClass(className, groupId);

      if (result.error) {
        return m.reply(generateReply(
          'Gagal Menambah Kelas',
          result.error,
          'error'
        ));
      }

      // 6. Reply sukses
      const successMessage = generateReply(
        'Kelas Berhasil Diinisialisasi',
        `📚 *Nama Kelas:* ${result.data.name}\n` +
        `🆔 *ID Kelas:* ${result.data.id}\n` +
        `📱 *Group ID:* ${result.data.group_id}\n` +
        `📅 *Dibuat:* ${new Date(result.data.created_at).toLocaleString('id-ID')}\n\n` +
        `Sekarang mahasiswa dapat mendaftar dengan command:\n` +
        `*.daftarmhs [Nama Lengkap]*`,
        'success'
      );

      return m.reply(successMessage);

    } catch (error) {
      console.error('Error in initkelas command:', error);
      return m.reply(generateReply(
        'Error Sistem',
        'Terjadi kesalahan sistem. Silakan coba lagi.',
        'error'
      ));
    }
  }
};
