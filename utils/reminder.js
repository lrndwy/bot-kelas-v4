const cron = require('node-cron');
const db = require('../database/db');
const { formatDateIndonesia } = require('./helpers');
const logger = require('./logger');

/**
 * Sistem Reminder Otomatis untuk Tugas
 * Mengirim pengingat tugas sesuai jadwal yang ditentukan
 */
class ReminderSystem {
  constructor() {
    this.sock = null;
    this.isRunning = false;
  }

  /**
   * Initialize reminder system
   * @param {Object} sock - WhatsApp socket instance
   */
  init(sock) {
    this.sock = sock;
    this.startScheduler();
  }

  /**
   * Start cron scheduler
   */
  startScheduler() {
    if (this.isRunning) {
      logger('warning', 'REMINDER', 'Reminder system already running');
      return;
    }

    // Jadwal reminder: Setiap jam 8 pagi
    cron.schedule('0 8 * * *', () => {
      this.checkAndSendReminders();
    }, {
      scheduled: true,
      timezone: global.timezone || 'Asia/Jakarta'
    });

    // Jadwal reminder tambahan: Setiap 4 jam
    cron.schedule('0 */4 * * *', () => {
      this.checkAndSendReminders();
    }, {
      scheduled: true,
      timezone: global.timezone || 'Asia/Jakarta'
    });

    this.isRunning = true;
    logger('success', 'REMINDER', 'Reminder system started');
    logger('info', 'SCHEDULE', 'Jadwal: Setiap jam 8 pagi dan setiap 4 jam');
  }

  /**
   * Stop cron scheduler
   */
  stopScheduler() {
    if (!this.isRunning) {
      console.log('Reminder system not running');
      return;
    }

    cron.destroy();
    this.isRunning = false;
    console.log('📅 Reminder system stopped');
  }

  /**
   * Check database dan kirim reminder jika diperlukan
   */
  async checkAndSendReminders() {
    try {
      console.log('🔍 Checking for reminders...');

      const tasksNeedReminder = db.getTasksNeedReminder();

      if (tasksNeedReminder.length === 0) {
        console.log('📅 No reminders needed today');
        return;
      }

      console.log(`📬 Found ${tasksNeedReminder.length} reminder(s) to send`);

      for (const item of tasksNeedReminder) {
        await this.sendReminder(item);
      }

    } catch (error) {
      console.error('Error in reminder check:', error);
    }
  }

  /**
   * Kirim reminder ke grup kelas
   * @param {Object} item - Task dengan info kelas dan hari tersisa
   */
  async sendReminder(item) {
    if (!this.sock) {
      console.error('Socket not initialized');
      return;
    }

    try {
      const { task, class: taskClass, daysLeft } = item;

      let urgencyIcon = '📅';
      let urgencyText = '';

      if (daysLeft === 1) {
        urgencyIcon = '🔴';
        urgencyText = ' (URGENT!)';
      } else if (daysLeft <= 3) {
        urgencyIcon = '🟡';
        urgencyText = ' (Mendesak)';
      }

      let reminderMessage = `${urgencyIcon} *REMINDER TUGAS${urgencyText}*\n\n`;
      reminderMessage += `📚 *Kelas:* ${taskClass.name}\n`;
      reminderMessage += `📝 *Tugas:* ${task.title}\n`;
      reminderMessage += `📅 *Deadline:* ${formatDateIndonesia(task.deadline)}\n`;
      reminderMessage += `⏰ *Sisa waktu:* ${daysLeft} hari lagi\n`;

      if (task.description) {
        reminderMessage += `📖 *Deskripsi:* ${task.description}\n`;
      }

      reminderMessage += `\n💡 *Jangan lupa untuk mengerjakan tugas ini!*`;

      if (daysLeft === 1) {
        reminderMessage += `\n\n🚨 *PERHATIAN: Deadline besok!*`;
      }

      // Kirim ke grup kelas
      await this.sock.sendMessage(taskClass.group_id, {
        text: reminderMessage
      });

      console.log(`📬 Reminder sent for task "${task.title}" to class "${taskClass.name}"`);

    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  /**
   * Test reminder system - kirim reminder untuk semua tugas yang akan datang
   * @param {string} groupId - ID grup untuk test
   */
  async testReminder(groupId) {
    if (!this.sock) {
      console.error('Socket not initialized');
      return;
    }

    try {
      const currentClass = db.getClassByGroupId(groupId);
      if (!currentClass) {
        await this.sock.sendMessage(groupId, {
          text: '❌ Grup ini belum diinisialisasi sebagai kelas.'
        });
        return;
      }

      const tasks = db.getTasksByClass(currentClass.id);

      if (tasks.length === 0) {
        await this.sock.sendMessage(groupId, {
          text: '📝 Belum ada tugas untuk kelas ini.'
        });
        return;
      }

      let testMessage = `🧪 *TEST REMINDER SYSTEM*\n\n`;
      testMessage += `📚 *Kelas:* ${currentClass.name}\n`;
      testMessage += `📊 *Total Tugas:* ${tasks.length}\n\n`;

      const today = new Date();
      let hasUpcomingTasks = false;

      tasks.forEach((task, index) => {
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline >= 0) {
          hasUpcomingTasks = true;
          testMessage += `${index + 1}. *${task.title}*\n`;
          testMessage += `   📅 ${formatDateIndonesia(task.deadline)}\n`;
          testMessage += `   ⏰ ${daysUntilDeadline} hari lagi\n`;
          testMessage += `   🔔 Reminder: ${task.reminder_days} hari sebelum\n\n`;
        }
      });

      if (!hasUpcomingTasks) {
        testMessage += `✅ Tidak ada tugas yang akan datang.`;
      } else {
        testMessage += `✅ Sistem reminder berjalan normal.\n`;
        testMessage += `📅 Jadwal cek: Setiap jam 8 pagi dan setiap 4 jam.`;
      }

      await this.sock.sendMessage(groupId, {
        text: testMessage
      });

      console.log(`🧪 Test reminder sent to class "${currentClass.name}"`);

    } catch (error) {
      console.error('Error in test reminder:', error);
    }
  }

  /**
   * Get reminder status
   * @returns {Object} status reminder system
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasSocket: !!this.sock,
      timezone: global.timezone || 'Asia/Jakarta'
    };
  }
}

// Export singleton instance
module.exports = new ReminderSystem();
