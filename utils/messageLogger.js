const moment = require("moment-timezone");

// Definisi warna ANSI secara langsung untuk menghindari masalah dependency
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper functions untuk styling
const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;
const bold = (text) => `${colors.bright}${text}${colors.reset}`;
const boldBlue = (text) => `${colors.bright}${colors.blue}${text}${colors.reset}`;

moment.locale(global.locale || "id");

/**
 * Ekstrak nama grup dari message object
 * @param {Object} m - Message object
 * @returns {string} Nama grup atau 'Private Chat'
 */
function extractGroupName(m) {
  if (!m.isGroup) return "Private Chat";

  // Coba ambil dari metadata grup jika tersedia
  if (m.groupMetadata?.subject) {
    return m.groupMetadata.subject;
  }

  // Fallback ke Group ID
  return m.key.remoteJid || "Unknown Group";
}

/**
 * Logger untuk menampilkan informasi pesan WhatsApp dengan format yang rapi
 * @param {Object} m - Message object dari WhatsApp
 */
function logMessage(m) {
  const timestamp = moment.tz(global.timezone || "Asia/Jakarta").format("DD/MM/YY HH:mm:ss");

  // Header dengan timestamp
  console.log(colorize('cyan', "═".repeat(90)));
  console.log(boldBlue(`📱 PESAN WHATSAPP - ${timestamp}`));
  console.log(colorize('cyan', "═".repeat(90)));

  // 1. PUSH NAME
  console.log(colorize('yellow', "👤 PENGIRIM:"));
  console.log(`   • Push Name      : ${colorize('green', m.pushName || m.userName || "Tidak diketahui")}`);
  console.log(`   • User Name      : ${colorize('green', m.userName || "Tidak diketahui")}`);

  // 2. NOMOR TELEPON
  console.log(`   • Nomor Telepon  : ${colorize('green', extractPhoneNumber(m))}`);

  // 3. JID (Jabber ID)
  console.log(`   • JID (Remote)   : ${colorize('gray', m.key.remoteJid || "Tidak diketahui")}`);
  console.log(`   • JID (User)     : ${colorize('gray', m.userId || "Tidak diketahui")}`);

  // 4. LID (Local Identifier)
  console.log(`   • LID            : ${colorize('gray', extractLID(m))}`);

  // 5. GRUP INFO (jika dari grup)
  console.log(colorize('yellow', "\n💬 CHAT INFO:"));
  if (m.isGroup) {
    console.log(`   • Tipe           : ${colorize('blue', "GRUP")}`);
    console.log(`   • Nama Grup      : ${colorize('blue', extractGroupName(m))}`);
    console.log(`   • Group ID       : ${colorize('gray', m.key.remoteJid)}`);
    console.log(`   • Participant    : ${colorize('gray', m.key.participant || "N/A")}`);
    console.log(`   • Participant Alt: ${colorize('gray', m.key.participantAlt || "N/A")}`);
  } else {
    console.log(`   • Tipe           : ${colorize('blue', "PRIVATE CHAT")}`);
    console.log(`   • Chat ID        : ${colorize('gray', m.key.remoteJid)}`);
    console.log(`   • Remote JID Alt : ${colorize('gray', m.key.remoteJidAlt || "N/A")}`);
  }

  // 6. PESAN & TEXT
  console.log(colorize('yellow', "\n📝 PESAN:"));
  console.log(`   • Message Type   : ${colorize('blue', m.type || "conversation")}`);
  console.log(`   • Text Content   : ${colorize('white', m.text || "Tidak ada teks")}`);
  console.log(`   • Raw Message    : ${colorize('white', JSON.stringify(m.message?.conversation || m.text || "Tidak ada").substring(0, 100))}`);

  // 7. COMMAND INFO
  console.log(colorize('yellow', "\n⚡ COMMAND INFO:"));
  console.log(`   • Is Command     : ${m.isCmd ? colorize('green', "Ya") : colorize('red', "Tidak")}`);

  if (m.isCmd) {
    console.log(`   • CMD            : ${colorize('magenta', m.cmd || "N/A")}`);
    console.log(`   • Full Command   : ${colorize('magenta', "." + (m.cmd || "N/A"))}`);
  } else {
    console.log(`   • CMD            : ${colorize('gray', m.cmd || "N/A")}`);
  }

  // 8. ARGS (Arguments)
  console.log(`   • ARGS           : ${colorize('cyan', m.args?.length ? `[${m.args.join(", ")}]` : "Tidak ada")}`);
  console.log(`   • Args Count     : ${colorize('cyan', m.args?.length || 0)}`);

  // 9. INFORMASI TAMBAHAN
  console.log(colorize('yellow', "\n🔗 DETAIL TAMBAHAN:"));
  console.log(`   • Message ID     : ${colorize('gray', m.key.id)}`);
  console.log(`   • Timestamp      : ${colorize('gray', m.messageTimestamp)}`);
  console.log(`   • From Me        : ${m.fromMe ? colorize('green', "Ya") : colorize('red', "Tidak")}`);
  console.log(`   • Is Owner       : ${m.isOwner ? colorize('green', "Ya") : colorize('red', "Tidak")}`);
  console.log(`   • Is Link        : ${m.isLink ? colorize('green', "Ya") : colorize('red', "Tidak")}`);
  console.log(`   • Is Mentioned   : ${m.isMentioned ? colorize('green', "Ya") : colorize('red', "Tidak")}`);
  console.log(`   • Is Quoted      : ${m.isQuoted ? colorize('green', "Ya") : colorize('red', "Tidak")}`);
  console.log(`   • Platform       : ${colorize('gray', m.platform || "N/A")}`);

  console.log(colorize('cyan', "═".repeat(90)));
  console.log(); // Baris kosong untuk pemisah
}

/**
 * Ekstrak nomor telepon dari message object
 * @param {Object} m - Message object
 * @returns {string} Nomor telepon
 */
function extractPhoneNumber(m) {
  // Untuk pesan grup, ambil dari participantAlt
  if (m.isGroup && m.key.participantAlt) {
    // Format 1: 6285890392419:42@s.whatsapp.net
    const colonMatch = m.key.participantAlt.match(/^(\d+):/);
    if (colonMatch) {
      return colonMatch[1];
    }

    // Format 2: 6285890392419@s.whatsapp.net
    const atMatch = m.key.participantAlt.match(/^(\d+)@/);
    if (atMatch) {
      return atMatch[1];
    }

    // Fallback: split by : or @
    const splitResult = m.key.participantAlt.split(/[:@]/)[0];
    if (splitResult && /^\d+$/.test(splitResult)) {
      return splitResult;
    }
  }

  // Untuk private chat, ambil dari remoteJid (format: 6285890392419@s.whatsapp.net)
  if (!m.isGroup && m.key.remoteJid) {
    return m.key.remoteJid.replace("@s.whatsapp.net", "") || "Tidak diketahui";
  }

  // Fallback ke userId untuk private chat
  if (m.userId && m.userId.includes("@s.whatsapp.net")) {
    return m.userId.replace("@s.whatsapp.net", "");
  }

  // Extra fallback untuk format yang lain
  if (m.userId && m.userId.includes("@lid")) {
    // Coba cari nomor dari participantAlt jika ada
    if (m.key.participantAlt) {
      const phoneMatch = m.key.participantAlt.match(/^(\d+)[:@]/);
      if (phoneMatch) {
        return phoneMatch[1];
      }
    }
  }

  return "Tidak diketahui";
}

/**
 * Ekstrak LID dari message object
 * @param {Object} m - Message object
 * @returns {string} LID WhatsApp
 */
function extractLID(m) {
  // Untuk pesan grup, ambil dari participant (format: 263517718470756@lid)
  if (m.isGroup && m.key.participant) {
    return m.key.participant;
  }

  // Untuk private chat, ambil dari remoteJidAlt (format: 251625574813765@lid)
  if (!m.isGroup && m.key.remoteJidAlt) {
    return m.key.remoteJidAlt;
  }

  // Fallback jika ada di properti lain
  if (m.userId && m.userId.includes("@lid")) {
    return m.userId;
  }

  // Coba dari participantAlt yang mungkin mengandung LID dalam format berbeda
  if (m.key.participantAlt && m.key.participantAlt.includes("@")) {
    const parts = m.key.participantAlt.split(":");
    if (parts.length > 1 && parts[1].includes("@")) {
      return parts[1];
    }
  }

  return "Tidak diketahui";
}

/**
 * Logger ringkas untuk production
 * Menampilkan semua info penting dalam format compact
 * @param {Object} m - Message object
 */
function logMessageCompact(m) {
  const timestamp = moment.tz(global.timezone || "Asia/Jakarta").format("HH:mm:ss");
  const sender = m.pushName || m.userName || "Unknown";
  const phone = extractPhoneNumber(m);
  const chatType = m.isGroup ? "GRUP" : "PRIVAT";
  const groupName = m.isGroup ? extractGroupName(m) : "N/A";
  const messagePreview = (m.text || "").substring(0, 40) + (m.text?.length > 40 ? "..." : "");
  const cmdInfo = m.isCmd ? `.${m.cmd}` : "";
  const argsInfo = m.args?.length ? `[${m.args.length}]` : "";

  console.log(
    colorize('gray', `[${timestamp}]`) +
    colorize('blue', ` ${chatType}`) +
    (m.isGroup ? colorize('blue', ` "${groupName.substring(0, 15)}"`) : "") +
    colorize('green', ` ${sender}`) +
    colorize('yellow', ` (${phone})`) +
    (m.isCmd ? colorize('magenta', ` ${cmdInfo}${argsInfo}`) : "") +
    colorize('white', `: ${messagePreview}`)
  );

  // Tambahan baris untuk info detail jika command
  if (m.isCmd && global.verbose) {
    console.log(
      colorize('gray', "    ") +
      colorize('cyan', `JID: ${m.userId} | LID: ${extractLID(m)} | Args: ${m.args?.join(", ") || "none"}`)
    );
  }
}

module.exports = {
  logMessage,
  logMessageCompact,
  extractPhoneNumber,
  extractLID,
  extractGroupName
};
