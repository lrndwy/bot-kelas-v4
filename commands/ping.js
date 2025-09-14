const { generateReply } = require('../utils/helpers');
const reminder = require('../utils/reminder');
const db = require('../database/db');

module.exports = {
  name: 'ping',
  description: 'Cek status bot dan sistem',
  usage: '.ping',
  category: 'General',
  onlyOwner: false,
  autoRead: true,
  presence: 'composing',
  react: '🏓',

  async handle(sock, m) {
    try {
      const startTime = Date.now();

      // Test database
      let dbStatus = '✅ Connected';
      let totalClasses = 0;
      let totalStudents = 0;
      let totalTasks = 0;

      try {
        const classes = db.getAllClasses();
        totalClasses = classes.length;

        const students = db.readFile('students.json');
        totalStudents = students.length;

        const tasks = db.readFile('tasks.json');
        totalTasks = tasks.length;
      } catch (error) {
        dbStatus = '❌ Error';
      }

      // Test reminder system
      const reminderStatus = reminder.getStatus();

      // Calculate response time
      const responseTime = Date.now() - startTime;

      let message = `🏓 *PONG!*\n\n`;
      message += `⚡ *Response Time:* ${responseTime}ms\n`;
      message += `🕐 *Server Time:* ${new Date().toLocaleString('id-ID', { timeZone: global.timezone })}\n\n`;

      message += `💾 *Database Status:* ${dbStatus}\n`;
      message += `📊 *Data Summary:*\n`;
      message += `  • Kelas: ${totalClasses}\n`;
      message += `  • Mahasiswa: ${totalStudents}\n`;
      message += `  • Tugas: ${totalTasks}\n\n`;

      message += `🔔 *Reminder System:* ${reminderStatus.isRunning ? '✅ Running' : '❌ Stopped'}\n`;
      message += `🌐 *Socket:* ${reminderStatus.hasSocket ? '✅ Connected' : '❌ Disconnected'}\n`;
      message += `🌍 *Timezone:* ${reminderStatus.timezone}\n\n`;

      message += `🤖 *Bot Version:* ${global.botName}\n`;
      message += `📱 *Bot Number:* ${global.botNumber}\n\n`;

      message += `📈 *Status:* All systems operational`;

      return m.reply(generateReply(
        'System Status',
        message,
        'success'
      ));

    } catch (error) {
      console.error('Error in ping command:', error);
      return m.reply(generateReply(
        'System Check Failed',
        `❌ *Error:* ${error.message}\n\n` +
        `🕐 *Time:* ${new Date().toLocaleString('id-ID')}\n` +
        `Please contact administrator.`,
        'error'
      ));
    }
  }
};
