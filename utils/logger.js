const moment = require("moment-timezone");
moment.locale(global.locale);

// Warna ANSI untuk tampilan yang lebih menarik
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

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

// Helper functions
const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;
const bold = (text) => `${colors.bright}${text}${colors.reset}`;

// Icons untuk berbagai jenis log
const getLogIcon = (type) => {
  switch (type.toLowerCase()) {
    case "primary": return "🚀";
    case "success": return "✅";
    case "info": return "ℹ️";
    case "error": return "❌";
    case "warning": return "⚠️";
    case "connection": return "🔗";
    case "reminder": return "⏰";
    default: return "📝";
  }
};

// Mendapatkan warna berdasarkan tipe
const getLogColor = (type) => {
  switch (type.toLowerCase()) {
    case "primary": return "blue";
    case "success": return "green";
    case "info": return "cyan";
    case "error": return "red";
    case "warning": return "yellow";
    case "connection": return "magenta";
    case "reminder": return "yellow";
    default: return "white";
  }
};

module.exports = (type, title, message) => {
  const date = moment.tz(global.timezone).format("dddd, DD MMMM YYYY");
  const time = moment.tz(global.timezone).format("HH:mm:ss");

  const icon = getLogIcon(type);
  const logColor = getLogColor(type);
  const boxWidth = 80;

  // Horizontal border lines only
  const horizontalBorder = "─".repeat(boxWidth);

  // Format content
  const botInfo = `${icon} ${bold(colorize(logColor, botName))}`;
  const timeInfo = colorize('gray', `⏰ ${time}`);
  const dateInfo = colorize('gray', `📅 ${date}`);
  const titleInfo = bold(colorize(logColor, `${title.toUpperCase()}`));
  const messageInfo = colorize('white', message);

  // Simple content formatting without side borders
  const formatContent = (content) => ` ${content}`;

  // Print the beautiful box
  console.log(colorize(logColor, horizontalBorder));
  console.log(formatContent(`${botInfo} ${timeInfo}`));
  console.log(formatContent(dateInfo));
  console.log();
  console.log(formatContent(`${titleInfo}: ${messageInfo}`));
  console.log(colorize(logColor, horizontalBorder));
  console.log(); // Empty line for spacing
};
