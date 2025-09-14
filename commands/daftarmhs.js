const db = require('../database/db');
const { isFromGroup, parseArguments, generateReply } = require('../utils/helpers');
const { extractPhoneNumber, extractLID } = require('../utils/messageLogger');

module.exports = {
  name: 'daftarmhs',
  description: 'Daftarkan diri sebagai mahasiswa dalam kelas',
  usage: '.daftarmhs <nama_lengkap>',
  category: 'Student',
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
          'Command ini hanya bisa digunakan di grup kelas yang sudah diinisialisasi.',
          'error'
        ));
      }

      const groupId = m.key.remoteJid;
      const currentClass = db.getClassByGroupId(groupId);

      if (!currentClass) {
        return m.reply(generateReply(
          'Grup Belum Diinisialisasi',
          'Grup ini belum diinisialisasi sebagai kelas.\n\n' +
          'Silakan minta admin untuk menjalankan:\n' +
          '*.initkelas <nama_kelas>*',
          'error'
        ));
      }

      // 2. Parse arguments
      const { args, error } = parseArguments(m.text, 1);
      if (error) {
        return m.reply(generateReply(
          'Parameter Kurang',
          `${error}\n\nContoh penggunaan:\n.daftarmhs Andi Pratama`,
          'error'
        ));
      }

      const studentName = args.join(' ').trim();

      // 3. Validasi nama
      if (studentName.length < 2) {
        return m.reply(generateReply(
          'Nama Tidak Valid',
          'Nama lengkap minimal 2 karakter.',
          'error'
        ));
      }

      // 4. Ekstrak data pengirim
      const phoneNumber = extractPhoneNumber(m);
      const lid = extractLID(m);

      if (phoneNumber === 'Tidak diketahui' || lid === 'Tidak diketahui') {
        return m.reply(generateReply(
          'Error Data Pengirim',
          'Tidak dapat mengidentifikasi nomor telepon atau LID WhatsApp Anda.\n' +
          'Silakan coba lagi atau hubungi admin.',
          'error'
        ));
      }

      // 5. Cek apakah sudah terdaftar
      const existingStudent = db.getStudentByPhone(phoneNumber);
      if (existingStudent) {
        const existingClass = db.getAllClasses().find(c => c.id === existingStudent.class_id);
        return m.reply(generateReply(
          'Sudah Terdaftar',
          `Anda sudah terdaftar sebagai mahasiswa.\n\n` +
          `📚 *Kelas:* ${existingClass?.name || 'Unknown'}\n` +
          `👤 *Nama:* ${existingStudent.name}\n` +
          `📱 *Nomor:* ${existingStudent.phone_number}\n` +
          `🆔 *LID:* ${existingStudent.lid}`,
          'warning'
        ));
      }

      // 6. Daftarkan mahasiswa
      const result = db.addStudent(currentClass.id, phoneNumber, studentName, lid);

      if (result.error) {
        return m.reply(generateReply(
          'Gagal Mendaftar',
          result.error,
          'error'
        ));
      }

      // 7. Reply sukses
      const successMessage = generateReply(
        'Pendaftaran Berhasil',
        `Selamat! Anda berhasil terdaftar sebagai mahasiswa.\n\n` +
        `📚 *Kelas:* ${currentClass.name}\n` +
        `👤 *Nama:* ${result.data.name}\n` +
        `📱 *Nomor:* ${result.data.phone_number}\n` +
        `🆔 *LID:* ${result.data.lid}\n` +
        `📅 *Terdaftar:* ${new Date(result.data.created_at).toLocaleString('id-ID')}\n\n` +
        `Sekarang Anda dapat:\n` +
        `• Mengecek kas dengan *.kas cek*\n` +
        `• Melihat tugas dengan *.tugas list*\n` +
        `• Melihat menu dengan *.menu*`,
        'success'
      );

      return m.reply(successMessage);

    } catch (error) {
      console.error('Error in daftarmhs command:', error);
      return m.reply(generateReply(
        'Error Sistem',
        'Terjadi kesalahan sistem. Silakan coba lagi.',
        'error'
      ));
    }
  }
};
