// Load dotenv untuk membaca file .env
require('dotenv').config();

global.dev = process.env.NODE_ENV === "development";

// Bot Configuration dari environment variables
global.botName = process.env.BOT_NAME || "Bot Kelas V4";
global.botNumber = process.env.BOT_NUMBER || "6283832249883";

// Owner Configuration dari environment variables
global.owner = {
  name: process.env.OWNER_NAME || "lrndwy",
  number: process.env.OWNER_NUMBER || "6285890392419",
  social: [
    {
      name: "Instagram",
      url: process.env.OWNER_INSTAGRAM_URL || "https://www.instagram.com/lrnd.__",
    },
  ],
};

// Bot Behavior Settings dari environment variables
global.useStore = process.env.USE_STORE === "true" || true;
global.online = process.env.ONLINE_STATUS === "true" || false;
global.prefixCommand = process.env.PREFIX_COMMAND || ".";
global.splitArgs = process.env.SPLIT_ARGS || "|";
global.locale = process.env.LOCALE || "id_ID";
global.timezone = process.env.TIMEZONE || "Asia/Jakarta";
global.inviteCode = process.env.INVITE_CODE || "";

// Konfigurasi logging
global.verbose = process.env.VERBOSE === "true" || false;

// Konfigurasi admin (bisa multiple admin)
global.adminNumbers = process.env.ADMIN_NUMBERS
  ? process.env.ADMIN_NUMBERS.split(',').map(num => num.trim())
  : ['6285890392419']; // default admin

// Image configuration dari environment variables
global.image = {
  logo: process.env.LOGO_IMAGE_URL || "",
};

// Bot mode settings dari environment variables
global.setting = {
  selfmode: process.env.SELF_MODE === "true" || false
};

// Function untuk menyimpan setting ke environment variables
global.save = (name, data) => {
  switch (name.toLowerCase()) {
    case "setting": {
      // Setting sekarang disimpan dalam environment variables
      // Untuk production, disarankan menggunakan external config management
      console.log("Setting configuration:", data);
      global.setting = data;
      return data;
    }
  }
};

global.mess = {
  dev: "Masih dalam tahap pengembangan",
};
