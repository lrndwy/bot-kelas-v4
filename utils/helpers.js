const { extractPhoneNumber, extractLID } = require('./messageLogger');

/**
 * Helper functions untuk Bot WhatsApp Kelas
 */

/**
 * Cek apakah pengirim pesan adalah admin
 * @param {Object} m - Message object
 * @returns {boolean} true jika admin
 */
function isAdmin(m) {
  const phoneNumber = extractPhoneNumber(m);
  return global.adminNumbers.includes(phoneNumber);
}

/**
 * Cek apakah pesan dikirim di grup
 * @param {Object} m - Message object
 * @returns {boolean} true jika dari grup
 */
function isFromGroup(m) {
  return m.isGroup === true;
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date - tanggal
 * @returns {string} tanggal terformat
 */
function formatDateIndonesia(date) {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format rupiah
 * @param {number} amount - jumlah
 * @returns {string} format rupiah
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Parse arguments dari command
 * @param {string} text - text pesan
 * @param {number} minArgs - minimum arguments yang dibutuhkan
 * @returns {Object} parsed arguments atau error
 */
function parseArguments(text, minArgs = 0) {
  // Hapus command prefix dan ambil arguments
  const args = text.trim().split(' ').slice(1);

  if (args.length < minArgs) {
    return {
      error: `Command membutuhkan minimal ${minArgs} parameter`,
      args: []
    };
  }

  return { args };
}

/**
 * Ekstrak quoted strings dari arguments
 * @param {Array} args - array arguments
 * @returns {Array} array dengan quoted strings di-parse
 */
function parseQuotedArguments(args) {
  const result = [];
  let currentQuote = '';
  let inQuote = false;

  for (let arg of args) {
    if (arg.startsWith('"') && arg.endsWith('"') && arg.length > 1) {
      // Single word quoted
      result.push(arg.slice(1, -1));
    } else if (arg.startsWith('"')) {
      // Start of multi-word quote
      inQuote = true;
      currentQuote = arg.slice(1);
    } else if (arg.endsWith('"') && inQuote) {
      // End of multi-word quote
      currentQuote += ' ' + arg.slice(0, -1);
      result.push(currentQuote);
      currentQuote = '';
      inQuote = false;
    } else if (inQuote) {
      // Inside multi-word quote
      currentQuote += ' ' + arg;
    } else {
      // Regular argument
      result.push(arg);
    }
  }

  // Handle unclosed quotes
  if (inQuote) {
    result.push(currentQuote);
  }

  return result;
}

/**
 * Validasi format tanggal YYYY-MM-DD
 * @param {string} dateString - string tanggal
 * @returns {Object} hasil validasi
 */
function validateDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(dateString)) {
    return {
      valid: false,
      error: 'Format tanggal harus YYYY-MM-DD (contoh: 2025-09-20)'
    };
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Tanggal tidak valid'
    };
  }

  if (date < today) {
    return {
      valid: false,
      error: 'Tanggal deadline tidak boleh di masa lalu'
    };
  }

  return { valid: true, date };
}

/**
 * Hitung hari tersisa hingga deadline
 * @param {string} deadline - tanggal deadline
 * @returns {number} hari tersisa
 */
function getDaysUntilDeadline(deadline) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate reply message dengan format yang rapi
 * @param {string} title - judul pesan
 * @param {string} content - isi pesan
 * @param {string} type - tipe pesan (success, error, info)
 * @returns {string} formatted message
 */
function generateReply(title, content, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const icon = icons[type] || icons.info;

  return `${icon} *${title}*\n\n${content}`;
}

/**
 * Ekstrak mention dari pesan
 * @param {string} text - text pesan
 * @returns {Array} array nomor telepon yang di-mention
 */
function extractMentions(text) {
  const mentionRegex = /@(\d+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Cari mahasiswa berdasarkan mention di pesan
 * Mencari berdasarkan LID dari context mention, bukan dari nomor di text
 * @param {Object} m - Message object
 * @param {Object} db - Database instance
 * @param {number} classId - ID kelas
 * @returns {Object|null} mahasiswa yang ditemukan atau null
 */
function findStudentByMention(m, db, classId) {
  // Jika tidak ada mention, return null
  if (!m.isMentioned || !Array.isArray(m.isMentioned) || m.isMentioned.length === 0) {
    return null;
  }

  // Ambil semua mahasiswa di kelas ini
  const students = db.getStudentsByClass(classId);

  // Cari mahasiswa berdasarkan LID yang di-mention
  for (const mentionedJid of m.isMentioned) {
    // Cek berdasarkan LID langsung
    const studentByLid = students.find(s => s.lid === mentionedJid);
    if (studentByLid) {
      return studentByLid;
    }

    // Cek berdasarkan phone number (untuk backward compatibility)
    const phoneFromJid = mentionedJid.replace('@s.whatsapp.net', '');
    const studentByPhone = students.find(s => s.phone_number === phoneFromJid);
    if (studentByPhone) {
      return studentByPhone;
    }
  }

  return null;
}

/**
 * Validasi nomor telepon Indonesia
 * @param {string} phoneNumber - nomor telepon
 * @returns {Object} hasil validasi
 */
function validatePhoneNumber(phoneNumber) {
  // Hapus karakter non-digit
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Format nomor Indonesia
  let formattedNumber = cleanNumber;

  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1);
  } else if (formattedNumber.startsWith('8')) {
    formattedNumber = '62' + formattedNumber;
  }

  // Validasi panjang dan format
  if (formattedNumber.length < 10 || formattedNumber.length > 15) {
    return {
      valid: false,
      error: 'Nomor telepon tidak valid'
    };
  }

  if (!formattedNumber.startsWith('62')) {
    return {
      valid: false,
      error: 'Nomor telepon harus nomor Indonesia'
    };
  }

  return {
    valid: true,
    number: formattedNumber
  };
}

module.exports = {
  isAdmin,
  isFromGroup,
  formatDateIndonesia,
  formatRupiah,
  parseArguments,
  parseQuotedArguments,
  validateDate,
  getDaysUntilDeadline,
  generateReply,
  extractMentions,
  findStudentByMention,
  validatePhoneNumber
};
