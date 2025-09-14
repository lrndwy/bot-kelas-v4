const fs = require('fs');
const path = require('path');
const { isFromGroup, generateReply } = require('../utils/helpers');

module.exports = {
  name: 'matkul',
  description: 'Lihat jadwal mata kuliah',
  usage: '.matkul',
  category: 'Class',
  autoRead: true,
  react: "📚",
  presence: "composing",
  onlyOwner: false,

  async handle(sock, m) {
    const isGroupChat = isFromGroup(m);

    // Cek apakah perintah digunakan di grup
    if (!isGroupChat) {
      return m.reply(generateReply(
        'Error',
        'Perintah ini hanya bisa digunakan di grup kelas.',
        'error'
      ));
    }

    try {
      // Path ke file database schedules
      const dbPath = path.join(process.cwd(), 'database', 'data', 'schedules.json');

      // Cek apakah file database ada
      if (!fs.existsSync(dbPath)) {
        return m.reply(generateReply(
          'Info',
          'Belum ada jadwal mata kuliah yang disimpan.\n\nGunakan perintah *.setmatkul* (dengan gambar) untuk menambah jadwal.',
          'info'
        ));
      }

      // Baca data schedules
      let schedules = {};
      try {
        const data = fs.readFileSync(dbPath, 'utf8');
        schedules = JSON.parse(data);
      } catch (err) {
        return m.reply(generateReply(
          'Error',
          'Gagal membaca data jadwal mata kuliah.',
          'error'
        ));
      }

      // Cek apakah ada jadwal untuk grup ini
      const groupSchedule = schedules[m.id];
      if (!groupSchedule) {
        return m.reply(generateReply(
          'Info',
          'Belum ada jadwal mata kuliah untuk grup ini.\n\nGunakan perintah *.setmatkul* (dengan gambar) untuk menambah jadwal.',
          'info'
        ));
      }

      // Cek apakah file gambar masih ada
      const imagePath = groupSchedule.filePath;
      if (!fs.existsSync(imagePath)) {
        return m.reply(generateReply(
          'Error',
          'File jadwal mata kuliah tidak ditemukan. Silakan set ulang jadwal dengan *.setmatkul*',
          'error'
        ));
      }

      // Kirim gambar jadwal
      const imageBuffer = fs.readFileSync(imagePath);
      const setDate = new Date(groupSchedule.dateSet).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

      const caption = `📅 *JADWAL MATA KULIAH*\n\n` +
        `👤 Diset oleh: ${groupSchedule.setByName}\n` +
        `🕐 Waktu: ${setDate}\n\n` +
        `💡 Untuk mengubah jadwal, gunakan perintah *.setmatkul* dengan gambar baru.`;

      await sock.sendMessage(m.id, {
        image: imageBuffer,
        caption: caption
      }, { quoted: m });

    } catch (error) {
      console.error('Error displaying schedule:', error);
      return m.reply(generateReply(
        'Error',
        `Gagal menampilkan jadwal mata kuliah: ${error.message}`,
        'error'
      ));
    }
  }
};
