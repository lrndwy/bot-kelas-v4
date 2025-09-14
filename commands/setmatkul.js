const fs = require('fs');
const path = require('path');
const { isAdmin, isFromGroup, generateReply } = require('../utils/helpers');
const { downloadContentFromMessage } = require('@itsukichan/baileys');

module.exports = {
  name: 'setmatkul',
  description: 'Set atau update jadwal mata kuliah dengan gambar',
  usage: '.setmatkul (dengan gambar)',
  category: 'Class',
  autoRead: true,
  react: "📅",
  presence: "composing",
  onlyOwner: false,

  async handle(sock, m) {
    const isUserAdmin = isAdmin(m);
    const isGroupChat = isFromGroup(m);

    // Cek apakah perintah digunakan di grup
    if (!isGroupChat) {
      return m.reply(generateReply(
        'Error',
        'Perintah ini hanya bisa digunakan di grup kelas.',
        'error'
      ));
    }

    // Cek apakah user adalah admin
    if (!isUserAdmin) {
      return m.reply(generateReply(
        'Error',
        'Hanya admin yang dapat mengatur jadwal mata kuliah.',
        'error'
      ));
    }

    // Cek apakah ada gambar yang dikirim
    if (!m.message.imageMessage) {
      return m.reply(generateReply(
        'Error',
        'Silakan kirim gambar jadwal mata kuliah bersama dengan perintah .setmatkul',
        'error'
      ));
    }

    try {
      // Buat folder uploads jika belum ada
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Download gambar
      const quoted = m.quoted || m;
      const stream = await downloadContentFromMessage(quoted.message.imageMessage, 'image');

      // Generate nama file unik berdasarkan group ID dan timestamp
      const timestamp = new Date().getTime();
      const fileName = `matkul_${m.id.replace('@g.us', '').replace('@s.whatsapp.net', '')}_${timestamp}.jpg`;
      const filePath = path.join(uploadsDir, fileName);

      // Simpan gambar ke file
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      fs.writeFileSync(filePath, buffer);

      // Simpan informasi jadwal ke database
      const dbPath = path.join(process.cwd(), 'database', 'data', 'schedules.json');
      let schedules = {};

      // Baca data schedule yang sudah ada
      if (fs.existsSync(dbPath)) {
        try {
          const data = fs.readFileSync(dbPath, 'utf8');
          schedules = JSON.parse(data);
        } catch (err) {
          schedules = {};
        }
      }

      // Update atau tambah schedule untuk grup ini
      schedules[m.id] = {
        groupId: m.id,
        fileName: fileName,
        filePath: filePath,
        setBy: m.userId,
        setByName: m.userName,
        timestamp: timestamp,
        dateSet: new Date().toISOString()
      };

      // Simpan kembali ke file
      fs.writeFileSync(dbPath, JSON.stringify(schedules, null, 2));

      const successMessage = `✅ *Jadwal mata kuliah berhasil disimpan!*\n\n` +
        `📅 File: ${fileName}\n` +
        `👤 Diset oleh: ${m.userName}\n` +
        `🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
        `💡 Gunakan perintah *.matkul* untuk melihat jadwal.`;

      return m.reply(generateReply(
        'Jadwal Mata Kuliah',
        successMessage,
        'success'
      ));

    } catch (error) {
      console.error('Error saving schedule:', error);
      return m.reply(generateReply(
        'Error',
        `Gagal menyimpan jadwal mata kuliah: ${error.message}`,
        'error'
      ));
    }
  }
};
