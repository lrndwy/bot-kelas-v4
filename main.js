require("./config/global");
const path = require("path");
const fs = require("fs");
const {
  makeInMemoryStore,
  useMultiFileAuthState,
  default: makeWASocket,
  Browsers,
  makeCacheableSignalKeyStore,
  isJidStatusBroadcast,
  isJidGroup,
  DisconnectReason,
  getContentType,
} = require("@itsukichan/baileys");
const pino = require("pino");
const NodeCache = require("node-cache");
const inquirer = require("inquirer");
let useCode = {
  isTrue: true,
};

const sleep = require("./utils/sleep");
const logger = require("./utils/logger");
const { logMessage, logMessageCompact } = require("./utils/messageLogger");
const reminder = require("./utils/reminder");

const log = pino({ level: "fatal" }).child({ level: "fatal", stream: "store" });

const store = useStore ? makeInMemoryStore({ logger: log }) : null;
store?.readFromFile("./sezz/store.json");
setInterval(() => {
  store?.writeToFile("./sezz/store.json");
  store?.readFromFile("./sezz/store.json");
}, 5000);

/**
 * Display beautiful startup banner
 */
function displayStartupBanner() {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    white: '\x1b[37m'
  };

  const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;
  const bold = (text) => `${colors.bright}${text}${colors.reset}`;

  console.clear();
  console.log();

  // ASCII Art Banner with horizontal borders only
  const bannerWidth = 78;
  const horizontalBorder = "═".repeat(bannerWidth);

  console.log(colorize('cyan', bold(horizontalBorder)));
  console.log();
  console.log(colorize('blue', bold("    ██████╗  ██████╗ ████████╗    ██╗  ██╗███████╗██╗      █████╗ ███████╗")));
  console.log(colorize('blue', bold("    ██╔══██╗██╔═══██╗╚══██╔══╝    ██║ ██╔╝██╔════╝██║     ██╔══██╗██╔════╝")));
  console.log(colorize('blue', bold("    ██████╔╝██║   ██║   ██║       █████╔╝ █████╗  ██║     ███████║███████╗")));
  console.log(colorize('blue', bold("    ██╔══██╗██║   ██║   ██║       ██╔═██╗ ██╔══╝  ██║     ██╔══██║╚════██║")));
  console.log(colorize('blue', bold("    ██████╔╝╚██████╔╝   ██║       ██║  ██╗███████╗███████╗██║  ██║███████║")));
  console.log(colorize('blue', bold("    ╚═════╝  ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝")));
  console.log();
  console.log(colorize('yellow', bold("                          🤖 WhatsApp Bot Manajemen Kelas V4")));
  console.log();
  console.log(colorize('cyan', bold(horizontalBorder)));

  // Bot information without side borders
  console.log(colorize('white', " 📱 Bot Name    : ") + colorize('green', bold(global.botName)));
  console.log(colorize('white', " 📞 Bot Number  : ") + colorize('green', bold(global.botNumber)));
  console.log(colorize('white', " 👤 Owner       : ") + colorize('green', bold(global.owner.name)));
  console.log(colorize('white', " 🌍 Timezone    : ") + colorize('green', bold(global.timezone)));
  console.log(colorize('white', " 🔧 Environment : ") + colorize(global.dev ? 'yellow' : 'green', bold(global.dev ? 'Development' : 'Production')));
  console.log(colorize('white', " 📝 Verbose Log : ") + colorize(global.verbose ? 'yellow' : 'gray', bold(global.verbose ? 'Enabled' : 'Disabled')));
  console.log(colorize('cyan', bold(horizontalBorder)));

  console.log();
  console.log(colorize('cyan', bold("🚀 Starting Bot Kelas V4...")));
  console.log(colorize('gray', "   Loading commands, initializing database, and preparing WhatsApp connection..."));
  console.log();
}

(async function start() {
  // Display startup banner
  displayStartupBanner();
  const commands = await new Promise((resolve, reject) => {
    const data = [];
    function readcmd(dircmd) {
      fs.readdirSync(dircmd).forEach((file) => {
        const fullpath = path.join(dircmd, file);
        if (fs.statSync(fullpath).isDirectory()) {
          readcmd(fullpath);
        } else if (file.endsWith(".js")) {
          const filecontent = require(fullpath);
          filecontent.cmd = file.replace(".js", "");
          filecontent.path = fullpath;

          const existCmd = data.find(
            (val) => val.cmd === file.replace(".js", ""),
          );
          if (existCmd) {
            reject(
              `Terdapat duplikat filename (filename sebagai command)\n- ${fullpath}\n- ${existCmd.path}`,
            );
          }

          data.push(filecontent);
        }
      });
    }
    readcmd(path.join(__dirname, "./commands"));

    // Progress indicator
    logger("success", "COMMANDS", `Loaded ${data.length} commands successfully`);

    resolve(data);
  }).catch((err) => {
    logger("error", "COMMANDS", `Failed to load commands: ${err.message}`);
    process.send("exit");
  });
  // Initialize database
  logger("info", "DATABASE", "Initializing database and checking data files...");

  const { state, saveCreds } = await useMultiFileAuthState("./sezz/auth").catch(
    (err) => {
      logger("error", "AUTH", `Failed to initialize auth state: ${err.message}`);
    },
  );
  const sock = makeWASocket({
    logger: log,
    borwser: Browsers.ubuntu("Chrome"),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, log),
    },
    printQRInTerminal: !useCode.isTrue,
    defaultQueryTimeoutMs: undefined,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const m = await store.loadMessage(key.remoteJid, key.id);
        return m;
      } else return {};
    },
    markOnlineOnConnect: global.online,
    msgRetryCounterCache: new NodeCache(),
    shouldSyncHistoryMessage: () => true,
    shouldIgnoreJid: (jid) => isJidStatusBroadcast(jid),
    syncFullHistory: useStore,
  });
  store?.bind(sock.ev);
  if (useCode.isTrue && !sock.user && !sock.authState.creds.registered) {
    console.log("\n\n");
    async function next() {
      logger("info", "PAIRING CODE", `Request pairing code: ${botNumber}`);
      await sleep(3000);
      let code = await sock.requestPairingCode(botNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      logger("primary", "PAIRING CODE", `Pairing code: ${code}`);
    }
    if (botNumber) {
      await next();
    } else {
      await inquirer
        .prompt([
          {
            type: "confirm",
            name: "confirm",
            default: true,
            message: "Terhubung menggunakan pairing code?",
          },
        ])
        .then(async ({ confirm }) => {
          useCode.isTrue = confirm;
          if (confirm) {
            botNumber = (
              await inquirer.prompt([
                {
                  type: "number",
                  name: "number",
                  message: "Masukkan nomor WhatsApp (Contoh: 6285179845835)",
                },
              ])
            ).number;
            await next();
          } else return start();
        });
    }
  }
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "connecting") {
      if (sock.user) {
        logger(
          "info",
          "CONNECTION",
          `Reconnecting ${sock.user.id.split(":")[0]}`,
        );
      }
    }
    if (connection === "open") {
      sock.id = `${sock.user.id.split(":")[0]}@s.whatsapp.net`;
      if (inviteCode) {
        await sock.groupAcceptInvite(inviteCode);
      }
      await sock.sendMessage(sock.id, {
        text: `Berhasil terhubung dengan ${botName}`,
      });
      logger("success", "CONNECTION", `Connected ${sock.id.split("@")[0]}`);

      // Initialize reminder system setelah bot terkoneksi
      reminder.init(sock);
      logger("info", "REMINDER", "Reminder system initialized");
    }
    if (connection === "close") {
      const { statusCode, message, error } =
        lastDisconnect.error?.output.payload;
      if (
        statusCode === DisconnectReason.badSession ||
        statusCode === DisconnectReason.forbidden ||
        statusCode == 405 ||
        (statusCode === DisconnectReason.loggedOut &&
          message !== "Stream Errored (conflict)")
      ) {
        fs.rmSync("./sezz", {
          force: true,
          recursive: true,
        });
      }
      logger("error", `Koneksi ${error}`, `${statusCode} ${message}`);
      start();
    }
  });
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    if (m.message.reactionMessage || m.message.protocolMessage) return;
    m.id = m.key.remoteJid;
    m.isGroup = isJidGroup(m.id);
    m.userId = !m.isGroup
      ? m.id
      : m.key.participant || `${m.participant.split(":")[0]}@s.whatsapp.net`;
    m.isBot = m.userId.endsWith("@bot");
    m.userName = m.pushName;
    m.fromMe = m.key.fromMe;
    m.itsSelf = m.id === sock.id;
    // Check if user is owner atau admin
    m.isOwner = `${global.owner.number}@s.whatsapp.net` === m.userId;
    m.isAdmin = global.adminNumbers.some(adminNum => `${adminNum}@s.whatsapp.net` === m.userId);
    m.isOwnerOrAdmin = m.isOwner || m.isAdmin;
    m.type = getContentType(m.message);
    m.isMentioned =
      m.message[m.type].contextInfo?.mentionedJid?.length > 0
        ? m.message[m.type].contextInfo.mentionedJid
        : null;
    m.isQuoted = m.message[m.type].contextInfo?.quotedMessage;
    m.quoted = m.isQuoted ? m.message[m.type].contextInfo : null;
    m.isForwarded = m.message[m.type].contextInfo?.isForwarded;
    m.text =
      m.type === "conversation"
        ? m.message.conversation
        : m.type === "extendedTextMessage"
          ? m.message.extendedTextMessage.text
          : m.type === "imageMessage"
            ? m.message.imageMessage.caption
            : m.type === "videoMessage"
              ? m.message.videoMessage.caption
              : m.type === "documentMessage"
                ? m.message.documentMessage.caption
                : m.type === "templateButtonReplyMessage"
                  ? m.message.templateButtonReplyMessage.selectedId
                  : m.type === "interactiveResponseMessage"
                    ? JSON.parse(
                        m.message.interactiveResponseMessage
                          .nativeFlowResponseMessage.paramsJson,
                      ).id
                    : m.type === "messageContextInfo"
                      ? m.message.buttonsResponseMessage?.selectedButtonId ||
                        m.message.listResponseMessage?.singleSelectReply
                          .selectedRowId ||
                        m.message.buttonsResponseMessage?.selectedButtonId ||
                        (m.message.interactiveResponseMessage
                          ?.nativeFlowResponseMessage.paramsJson
                          ? JSON.parse(
                              m.message.interactiveResponseMessage
                                .nativeFlowResponseMessage.paramsJson,
                            )?.id
                          : "") ||
                        ""
                      : m.type === "senderKeyDistributionMessage"
                        ? m.message.conversation ||
                          m.message.imageMessage?.caption
                        : "";
    m.isCmd = m.text?.startsWith(prefixCommand);
    m.cmd = m.text
      ?.trim()
      .replace(prefixCommand, "")
      .split(" ")[0]
      .toLowerCase();
    m.args = m.text
      ?.replace(/^\S*\b/g, "")
      .trim()
      .split(global.splitArgs)
      .filter((arg) => arg !== "");
    m.isLink = m.text?.match(
      /(http:\/\/|https:\/\/)?(www\.)?[a-zA-Z0-9]+\.[a-zA-Z]+(\.[a-zA-Z]+)?(\/[^\s]*)?/g,
    );
    // Log pesan dengan format yang rapi
    if (global.dev || global.verbose) {
      logMessage(m); // Log detail untuk development
    } else {
      logMessageCompact(m); // Log ringkas untuk production
    }

    // Filter pesan berdasarkan mode bot
    if (setting.selfmode && !m.fromMe && !m.isOwnerOrAdmin) {
      return; // Selfmode aktif, hanya owner, admin dan bot sendiri yang bisa gunakan
    }

    if (!m.isCmd) return;

    m.reply = (text) => sock.sendMessage(m.id, { text }, { quoted: m });

    for (let command of commands) {
      if (m.cmd === command.cmd) {
        if (command.onlyOwner && !m.fromMe && !m.isOwnerOrAdmin) return;
        try {
          logger("info", "COMMAND", m.cmd.toUpperCase());
          if (command.autoRead) {
            await sock.readMessages([m.key]);
          }

          if (command.presence) {
            const presenceOptions = [
              "unavailable",
              "available",
              "composing",
              "recording",
              "paused",
            ];
            await sock.sendPresenceUpdate(
              presenceOptions.includes(command.presence)
                ? command.presence
                : "composing",
              m.id,
            );
          }

          if (command.react) {
            await sock.sendMessage(m.id, {
              react: {
                key: m.key,
                text: command.react,
              },
            });
          }

          await command.handle(sock, m);
          if (command.react) {
            await sock.sendMessage(m.id, {
              react: {
                key: m.key,
                text: "✅",
              },
            });
          }
        } catch (err) {
          m.reply(`*ERROR:* ${err.message}`);
          console.log(err);
          logger("error", "COMMAND", m.cmd.toUpperCase());
        }
        break;
      }
    }
  });
})();
