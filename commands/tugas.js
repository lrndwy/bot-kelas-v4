const db = require('../database/db');
const {
  isAdmin,
  isFromGroup,
  parseArguments,
  parseQuotedArguments,
  generateReply,
  formatDateIndonesia,
  validateDate,
  getDaysUntilDeadline
} = require('../utils/helpers');

module.exports = {
  name: 'tugas',
  description: 'Manajemen tugas kelas',
  usage: '.tugas <tambah|list|detail|reminder> [parameter]',
  category: 'Academic',
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
          getTugasUsage(),
          'error'
        ));
      }

      const subCommand = args[0].toLowerCase();
      const subArgs = args.slice(1);

      // 3. Route ke subcommand yang sesuai
      switch (subCommand) {
        case 'tambah':
          return await handleTambahTugas(m, currentClass, subArgs);
        case 'list':
          return await handleListTugas(m, currentClass);
        case 'detail':
          return await handleDetailTugas(m, currentClass, subArgs);
        case 'reminder':
          return await handleReminderTugas(m, currentClass, subArgs);
        default:
          return m.reply(generateReply(
            'Subcommand Tidak Valid',
            getTugasUsage(),
            'error'
          ));
      }

    } catch (error) {
      console.error('Error in tugas command:', error);
      return m.reply(generateReply(
        'Error Sistem',
        'Terjadi kesalahan sistem. Silakan coba lagi.',
        'error'
      ));
    }
  }
};

/**
 * Handle tambah tugas (Admin only)
 */
async function handleTambahTugas(m, currentClass, args) {
  if (!isAdmin(m)) {
    return m.reply(generateReply(
      'Akses Ditolak',
      'Hanya admin yang dapat menambah tugas.',
      'error'
    ));
  }

  if (args.length < 2) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format (pilih salah satu):\n' +
      '• Dengan quotes: .tugas tambah "judul" "YYYY-MM-DD" "deskripsi"\n' +
      '• Tanpa quotes: .tugas tambah judul YYYY-MM-DD deskripsi panjang\n\n' +
      'Contoh:\n' +
      '• .tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman"\n' +
      '• .tugas tambah Tugas1 2025-09-20 Ini adalah deskripsi tugas yang panjang\n' +
      '• .tugas tambah "Quiz Matematika" "2025-09-15" "Bab 1-3" remind=3,1',
      'error'
    ));
  }

  // Parse arguments dengan fleksibilitas untuk format dengan atau tanpa quotes
  let title, deadline, description, reminderDays = '7,3,1';

  // Cek apakah menggunakan format dengan quotes
  if (args.some(arg => arg.includes('"'))) {
    // Format dengan quotes: .tugas tambah "judul" "deadline" "deskripsi"
    const quotedArgs = parseQuotedArguments(args);

    if (quotedArgs.length < 2) {
      return m.reply(generateReply(
        'Parameter Kurang',
        'Format dengan quotes: .tugas tambah "judul" "YYYY-MM-DD" "deskripsi"',
        'error'
      ));
    }

    title = quotedArgs[0];
    deadline = quotedArgs[1];
    description = quotedArgs[2] || '';
  } else {
    // Format tanpa quotes: .tugas tambah judul deadline deskripsi...
    if (args.length < 2) {
      return m.reply(generateReply(
        'Parameter Kurang',
        'Minimal harus ada judul dan tanggal deadline.\n\n' +
        'Format: .tugas tambah <judul> <YYYY-MM-DD> [deskripsi]\n' +
        'Contoh: .tugas tambah Tugas1 2025-09-20 Ini adalah deskripsi tugas yang panjang',
        'error'
      ));
    }

    title = args[0];
    deadline = args[1];

    // Gabungkan sisa arguments sebagai deskripsi, kecuali yang mengandung remind=
    const remainingArgs = args.slice(2);
    const reminderIndex = remainingArgs.findIndex(arg => arg.startsWith('remind='));

    if (reminderIndex !== -1) {
      description = remainingArgs.slice(0, reminderIndex).join(' ');
      reminderDays = remainingArgs[reminderIndex].replace('remind=', '');
    } else {
      description = remainingArgs.join(' ');
    }
  }

  // Fallback: cari parameter remind= di semua arguments jika belum ditemukan
  if (reminderDays === '7,3,1') {
    const remindIndex = args.findIndex(arg => arg.startsWith('remind='));
    if (remindIndex !== -1) {
      reminderDays = args[remindIndex].replace('remind=', '');
    }
  }

  // Validasi judul
  if (title.length < 3) {
    return m.reply(generateReply(
      'Judul Tidak Valid',
      'Judul tugas minimal 3 karakter.',
      'error'
    ));
  }

  // Validasi tanggal
  const dateValidation = validateDate(deadline);
  if (!dateValidation.valid) {
    return m.reply(generateReply(
      'Tanggal Tidak Valid',
      dateValidation.error,
      'error'
    ));
  }

  // Validasi reminder days
  const reminderArray = reminderDays.split(',').map(d => parseInt(d.trim()));
  if (reminderArray.some(d => isNaN(d) || d < 0)) {
    return m.reply(generateReply(
      'Reminder Tidak Valid',
      'Format reminder harus berupa angka yang dipisah koma.\nContoh: 7,3,1',
      'error'
    ));
  }

  // Tambah tugas ke database
  const result = db.addTask(currentClass.id, title, deadline, description, reminderDays);

  if (result.error) {
    return m.reply(generateReply(
      'Gagal Menambah Tugas',
      result.error,
      'error'
    ));
  }

  // Reply sukses
  let message = `📚 *Judul:* ${result.data.title}\n`;
  message += `📅 *Deadline:* ${formatDateIndonesia(result.data.deadline)}\n`;
  message += `⏰ *Hari tersisa:* ${getDaysUntilDeadline(result.data.deadline)} hari\n`;

  if (result.data.description) {
    message += `📝 *Deskripsi:* ${result.data.description}\n`;
  }

  message += `🔔 *Reminder:* ${result.data.reminder_days} hari sebelum deadline\n`;
  message += `🆔 *ID Tugas:* ${result.data.id}`;

  return m.reply(generateReply(
    'Tugas Berhasil Ditambah',
    message,
    'success'
  ));
}

/**
 * Handle list tugas
 */
async function handleListTugas(m, currentClass) {
  const tasks = db.getTasksByClass(currentClass.id);

  if (tasks.length === 0) {
    return m.reply(generateReply(
      'Tidak Ada Tugas',
      'Belum ada tugas yang diberikan untuk kelas ini.',
      'info'
    ));
  }

  let message = `📚 *Daftar Tugas ${currentClass.name}*\n\n`;

  tasks.forEach((task, index) => {
    const daysLeft = getDaysUntilDeadline(task.deadline);
    let status = '⏳';

    if (daysLeft < 0) {
      status = '❌'; // Terlewat
    } else if (daysLeft <= 1) {
      status = '🔴'; // Urgent
    } else if (daysLeft <= 3) {
      status = '🟡'; // Mendesak
    } else {
      status = '🟢'; // Normal
    }

    message += `${index + 1}. ${status} *${task.title}*\n`;
    message += `   📅 ${formatDateIndonesia(task.deadline)}\n`;
    message += `   ⏰ ${daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlewat ${Math.abs(daysLeft)} hari`}\n`;
    message += `   🆔 ID: ${task.id}\n\n`;
  });

  message += `💡 *Keterangan Status:*\n`;
  message += `🟢 Normal • 🟡 Mendesak • 🔴 Urgent • ❌ Terlewat\n\n`;
  message += `Gunakan *.tugas detail <id>* untuk melihat detail tugas.`;

  return m.reply(generateReply(
    'Daftar Tugas',
    message,
    'info'
  ));
}

/**
 * Handle detail tugas
 */
async function handleDetailTugas(m, currentClass, args) {
  if (args.length === 0) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format: .tugas detail <id_tugas>\nContoh: .tugas detail 1',
      'error'
    ));
  }

  const taskId = parseInt(args[0]);
  if (isNaN(taskId)) {
    return m.reply(generateReply(
      'ID Tidak Valid',
      'ID tugas harus berupa angka.',
      'error'
    ));
  }

  const task = db.getTaskById(taskId);
  if (!task || task.class_id !== currentClass.id) {
    return m.reply(generateReply(
      'Tugas Tidak Ditemukan',
      'Tugas dengan ID tersebut tidak ditemukan di kelas ini.',
      'error'
    ));
  }

  const daysLeft = getDaysUntilDeadline(task.deadline);
  let status = 'Normal';
  let statusIcon = '🟢';

  if (daysLeft < 0) {
    status = 'Terlewat';
    statusIcon = '❌';
  } else if (daysLeft <= 1) {
    status = 'Urgent';
    statusIcon = '🔴';
  } else if (daysLeft <= 3) {
    status = 'Mendesak';
    statusIcon = '🟡';
  }

  let message = `📚 *Judul:* ${task.title}\n`;
  message += `📅 *Deadline:* ${formatDateIndonesia(task.deadline)}\n`;
  message += `⏰ *Status:* ${statusIcon} ${status}\n`;
  message += `⌛ *Hari tersisa:* ${daysLeft >= 0 ? `${daysLeft} hari` : `Terlewat ${Math.abs(daysLeft)} hari`}\n`;

  if (task.description) {
    message += `📝 *Deskripsi:* ${task.description}\n`;
  }

  message += `🔔 *Reminder:* ${task.reminder_days} hari sebelum deadline\n`;
  message += `📅 *Dibuat:* ${new Date(task.created_at).toLocaleDateString('id-ID')}\n`;
  message += `🆔 *ID:* ${task.id}`;

  return m.reply(generateReply(
    'Detail Tugas',
    message,
    'info'
  ));
}

/**
 * Handle reminder tugas
 */
async function handleReminderTugas(m, currentClass, args) {
  if (args.length === 0) {
    return m.reply(generateReply(
      'Parameter Kurang',
      'Format: .tugas reminder <id_tugas>\nContoh: .tugas reminder 1',
      'error'
    ));
  }

  const taskId = parseInt(args[0]);
  if (isNaN(taskId)) {
    return m.reply(generateReply(
      'ID Tidak Valid',
      'ID tugas harus berupa angka.',
      'error'
    ));
  }

  const task = db.getTaskById(taskId);
  if (!task || task.class_id !== currentClass.id) {
    return m.reply(generateReply(
      'Tugas Tidak Ditemukan',
      'Tugas dengan ID tersebut tidak ditemukan di kelas ini.',
      'error'
    ));
  }

  const reminderDays = task.reminder_days.split(',').map(d => parseInt(d.trim()));
  const deadline = new Date(task.deadline);

  let message = `🔔 *Jadwal Reminder: ${task.title}*\n\n`;

  reminderDays.forEach(days => {
    const reminderDate = new Date(deadline);
    reminderDate.setDate(deadline.getDate() - days);

    message += `📅 H-${days}: ${formatDateIndonesia(reminderDate)}\n`;
  });

  message += `\n📅 *Deadline:* ${formatDateIndonesia(task.deadline)}`;

  return m.reply(generateReply(
    'Jadwal Reminder',
    message,
    'info'
  ));
}

/**
 * Get tugas command usage
 */
function getTugasUsage() {
  return `📖 *Cara Penggunaan Tugas:*\n\n` +
    `🔹 *.tugas tambah* - Tambah tugas (Admin)\n` +
    `🔹 *.tugas list* - Lihat daftar tugas\n` +
    `🔹 *.tugas detail <id>* - Lihat detail tugas\n` +
    `🔹 *.tugas reminder <id>* - Lihat jadwal reminder\n\n` +
    `*Format Tambah Tugas (pilih salah satu):*\n` +
    `• Dengan quotes: .tugas tambah "judul" "YYYY-MM-DD" "deskripsi"\n` +
    `• Tanpa quotes: .tugas tambah judul YYYY-MM-DD deskripsi panjang\n\n` +
    `*Contoh:*\n` +
    `• .tugas tambah "Makalah Pancasila" "2025-09-20" "Minimal 5 halaman"\n` +
    `• .tugas tambah Tugas1 2025-09-20 Ini adalah deskripsi tugas yang panjang\n` +
    `• .tugas tambah "Quiz Matematika" "2025-09-15" "Bab 1-3" remind=3,1\n` +
    `• .tugas detail 1\n` +
    `• .tugas reminder 1`;
}
