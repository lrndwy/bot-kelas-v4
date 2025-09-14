const reminder = require('../utils/reminder');
const { isAdmin, isFromGroup, generateReply } = require('../utils/helpers');

module.exports = {
  name: 'testreminder',
  description: 'Test sistem reminder tugas (Admin only)',
  usage: '.testreminder',
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
          'Hanya admin yang dapat menjalankan test reminder.',
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

      const groupId = m.key.remoteJid;

      // 3. Cek status reminder system
      const status = reminder.getStatus();

      if (!status.isRunning) {
        return m.reply(generateReply(
          'Reminder System Offline',
          'Sistem reminder sedang tidak berjalan. Silakan restart bot.',
          'error'
        ));
      }

      // 4. Jalankan test reminder
      await reminder.testReminder(groupId);

      // 5. Reply info system
      const systemInfo = generateReply(
        'Test Reminder Completed',
        `🧪 Test reminder berhasil dijalankan.\n\n` +
        `📊 *Status Sistem:*\n` +
        `• Reminder System: ${status.isRunning ? '✅ Running' : '❌ Stopped'}\n` +
        `• Socket Connection: ${status.hasSocket ? '✅ Connected' : '❌ Disconnected'}\n` +
        `• Timezone: ${status.timezone}\n\n` +
        `📅 *Jadwal Reminder:*\n` +
        `• Setiap hari jam 8 pagi\n` +
        `• Setiap 4 jam sekali\n\n` +
        `💡 Lihat pesan di atas untuk detail tugas yang akan di-remind.`,
        'success'
      );

      return m.reply(systemInfo);

    } catch (error) {
      console.error('Error in testreminder command:', error);
      return m.reply(generateReply(
        'Error Sistem',
        'Terjadi kesalahan saat menjalankan test reminder.',
        'error'
      ));
    }
  }
};
