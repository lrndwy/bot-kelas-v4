const fs = require('fs');
const path = require('path');

/**
 * Database JSON handler untuk Bot WhatsApp Kelas
 * Mengelola data classes, students, cash_records, dan tasks
 */
class Database {
  constructor() {
    this.dataPath = path.join(__dirname, 'data');
    this.ensureDataDirectory();
    this.initializeFiles();
  }

  /**
   * Pastikan direktori data exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  /**
   * Initialize semua file database dengan struktur default
   */
  initializeFiles() {
    const files = {
      'classes.json': [],
      'students.json': [],
      'cash_records.json': [],
      'class_expenses.json': [],
      'tasks.json': []
    };

    Object.entries(files).forEach(([filename, defaultData]) => {
      const filePath = path.join(this.dataPath, filename);
      if (!fs.existsSync(filePath)) {
        this.writeFile(filename, defaultData);
      }
    });
  }

  /**
   * Baca file JSON
   * @param {string} filename - nama file (classes.json, students.json, etc)
   * @returns {Array} data array
   */
  readFile(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  /**
   * Tulis file JSON
   * @param {string} filename - nama file
   * @param {Array} data - data array untuk disimpan
   */
  writeFile(filename, data) {
    try {
      const filePath = path.join(this.dataPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      return false;
    }
  }

  /**
   * Generate ID auto increment
   * @param {string} tableName - nama tabel (classes, students, etc)
   * @returns {number} ID baru
   */
  generateId(tableName) {
    const filename = `${tableName}.json`;
    const data = this.readFile(filename);

    if (data.length === 0) return 1;

    const maxId = Math.max(...data.map(item => item.id || 0));
    return maxId + 1;
  }

  // =================== CLASSES METHODS ===================

  /**
   * Tambah kelas baru
   * @param {string} name - nama kelas
   * @param {string} groupId - ID grup WhatsApp
   * @returns {Object} kelas yang ditambahkan atau error
   */
  addClass(name, groupId) {
    const classes = this.readFile('classes.json');

    // Cek duplikasi group_id
    const existingClass = classes.find(c => c.group_id === groupId);
    if (existingClass) {
      return { error: 'Grup ini sudah terdaftar sebagai kelas: ' + existingClass.name };
    }

    const newClass = {
      id: this.generateId('classes'),
      name: name,
      group_id: groupId,
      created_at: new Date().toISOString()
    };

    classes.push(newClass);
    this.writeFile('classes.json', classes);

    return { success: true, data: newClass };
  }

  /**
   * Cari kelas berdasarkan group_id
   * @param {string} groupId - ID grup WhatsApp
   * @returns {Object|null} data kelas atau null
   */
  getClassByGroupId(groupId) {
    const classes = this.readFile('classes.json');
    return classes.find(c => c.group_id === groupId) || null;
  }

  /**
   * Ambil semua kelas
   * @returns {Array} daftar semua kelas
   */
  getAllClasses() {
    return this.readFile('classes.json');
  }

  // =================== STUDENTS METHODS ===================

  /**
   * Daftarkan mahasiswa baru (hanya mahasiswa yang bisa daftar sendiri)
   * @param {number} classId - ID kelas
   * @param {string} phoneNumber - nomor telepon mahasiswa
   * @param {string} name - nama mahasiswa
   * @param {string} lid - Local Identifier WhatsApp
   * @returns {Object} mahasiswa yang didaftarkan atau error
   */
  addStudent(classId, phoneNumber, name, lid) {
    const students = this.readFile('students.json');

    // Cek duplikasi nomor telepon
    const existingStudent = students.find(s => s.phone_number === phoneNumber);
    if (existingStudent) {
      return { error: 'Nomor telepon sudah terdaftar' };
    }

    // Cek duplikasi LID
    const existingLid = students.find(s => s.lid === lid);
    if (existingLid) {
      return { error: 'LID WhatsApp sudah terdaftar' };
    }

    const newStudent = {
      id: this.generateId('students'),
      class_id: classId,
      phone_number: phoneNumber,
      name: name,
      lid: lid,
      created_at: new Date().toISOString()
    };

    students.push(newStudent);
    this.writeFile('students.json', students);

    return { success: true, data: newStudent };
  }

  /**
   * Cari mahasiswa berdasarkan nomor telepon
   * @param {string} phoneNumber - nomor telepon
   * @returns {Object|null} data mahasiswa atau null
   */
  getStudentByPhone(phoneNumber) {
    const students = this.readFile('students.json');
    return students.find(s => s.phone_number === phoneNumber) || null;
  }

  /**
   * Cari mahasiswa berdasarkan LID
   * @param {string} lid - Local Identifier WhatsApp
   * @returns {Object|null} data mahasiswa atau null
   */
  getStudentByLid(lid) {
    const students = this.readFile('students.json');
    return students.find(s => s.lid === lid) || null;
  }

  /**
   * Ambil semua mahasiswa dalam satu kelas
   * @param {number} classId - ID kelas
   * @returns {Array} daftar mahasiswa dalam kelas
   */
  getStudentsByClass(classId) {
    const students = this.readFile('students.json');
    return students.filter(s => s.class_id === classId);
  }

  // =================== CASH RECORDS METHODS ===================

  /**
   * Tambah transaksi kas
   * @param {number} studentId - ID mahasiswa
   * @param {number} amount - jumlah (positif=setor, negatif=utang)
   * @returns {Object} transaksi yang ditambahkan
   */
  addCashRecord(studentId, amount) {
    const cashRecords = this.readFile('cash_records.json');

    const newRecord = {
      id: this.generateId('cash_records'),
      student_id: studentId,
      amount: parseInt(amount),
      created_at: new Date().toISOString()
    };

    cashRecords.push(newRecord);
    this.writeFile('cash_records.json', cashRecords);

    return { success: true, data: newRecord };
  }

  /**
   * Ambil riwayat kas mahasiswa
   * @param {number} studentId - ID mahasiswa
   * @returns {Array} riwayat transaksi
   */
  getCashRecordsByStudent(studentId) {
    const cashRecords = this.readFile('cash_records.json');
    return cashRecords.filter(r => r.student_id === studentId);
  }

  /**
   * Hitung saldo mahasiswa
   * @param {number} studentId - ID mahasiswa
   * @returns {number} saldo total
   */
  getStudentBalance(studentId) {
    const records = this.getCashRecordsByStudent(studentId);
    return records.reduce((total, record) => total + record.amount, 0);
  }

  /**
   * Ambil semua transaksi kas dalam satu kelas
   * @param {number} classId - ID kelas
   * @returns {Array} transaksi kas dengan info mahasiswa
   */
  getCashRecordsByClass(classId) {
    const students = this.getStudentsByClass(classId);
    const cashRecords = this.readFile('cash_records.json');

    const result = [];
    students.forEach(student => {
      const records = cashRecords.filter(r => r.student_id === student.id);
      const balance = records.reduce((total, record) => total + record.amount, 0);

      result.push({
        student: student,
        balance: balance,
        records: records
      });
    });

    return result;
  }

  // =================== CLASS EXPENSES METHODS ===================

  /**
   * Tambah pengeluaran kelas baru
   * @param {number} classId - ID kelas
   * @param {number} amount - jumlah pengeluaran
   * @param {string} description - keterangan pengeluaran
   * @returns {Object} pengeluaran yang ditambahkan
   */
  addClassExpense(classId, amount, description) {
    const expenses = this.readFile('class_expenses.json');

    const newExpense = {
      id: this.generateId('class_expenses'),
      class_id: classId,
      amount: amount,
      description: description,
      created_at: new Date().toISOString()
    };

    expenses.push(newExpense);
    this.writeFile('class_expenses.json', expenses);

    return newExpense;
  }

  /**
   * Ambil semua pengeluaran kelas
   * @param {number} classId - ID kelas
   * @returns {Array} daftar pengeluaran kelas
   */
  getClassExpenses(classId) {
    const expenses = this.readFile('class_expenses.json');
    return expenses.filter(e => e.class_id === classId);
  }

  /**
   * Ambil pengeluaran berdasarkan ID
   * @param {number} expenseId - ID pengeluaran
   * @returns {Object|null} data pengeluaran atau null
   */
  getExpenseById(expenseId) {
    const expenses = this.readFile('class_expenses.json');
    return expenses.find(e => e.id === expenseId) || null;
  }

  /**
   * Hapus pengeluaran kelas
   * @param {number} expenseId - ID pengeluaran
   * @returns {boolean} true jika berhasil
   */
  deleteExpense(expenseId) {
    const expenses = this.readFile('class_expenses.json');
    const index = expenses.findIndex(e => e.id === expenseId);

    if (index === -1) return false;

    expenses.splice(index, 1);
    this.writeFile('class_expenses.json', expenses);
    return true;
  }

  /**
   * Update deskripsi pengeluaran
   * @param {number} expenseId - ID pengeluaran
   * @param {string} newDescription - deskripsi baru
   * @returns {boolean} true jika berhasil
   */
  updateExpenseDescription(expenseId, newDescription) {
    const expenses = this.readFile('class_expenses.json');
    const expense = expenses.find(e => e.id === expenseId);

    if (!expense) return false;

    expense.description = newDescription;
    this.writeFile('class_expenses.json', expenses);
    return true;
  }

  // =================== TASKS METHODS ===================

  /**
   * Tambah tugas baru
   * @param {number} classId - ID kelas
   * @param {string} title - judul tugas
   * @param {string} deadline - tanggal deadline (YYYY-MM-DD)
   * @param {string} description - deskripsi tugas
   * @param {string} reminderDays - hari reminder (CSV format: "7,3,1")
   * @returns {Object} tugas yang ditambahkan
   */
  addTask(classId, title, deadline, description = '', reminderDays = '7,3,1') {
    const tasks = this.readFile('tasks.json');

    const newTask = {
      id: this.generateId('tasks'),
      class_id: classId,
      title: title,
      deadline: deadline,
      description: description,
      reminder_days: reminderDays,
      created_at: new Date().toISOString()
    };

    tasks.push(newTask);
    this.writeFile('tasks.json', tasks);

    return { success: true, data: newTask };
  }

  /**
   * Ambil semua tugas dalam satu kelas
   * @param {number} classId - ID kelas
   * @returns {Array} daftar tugas
   */
  getTasksByClass(classId) {
    const tasks = this.readFile('tasks.json');
    return tasks.filter(t => t.class_id === classId);
  }

  /**
   * Ambil tugas berdasarkan ID
   * @param {number} taskId - ID tugas
   * @returns {Object|null} data tugas atau null
   */
  getTaskById(taskId) {
    const tasks = this.readFile('tasks.json');
    return tasks.find(t => t.id === taskId) || null;
  }

  /**
   * Ambil semua tugas yang perlu reminder hari ini
   * @returns {Array} tugas yang perlu reminder dengan info kelas
   */
  getTasksNeedReminder() {
    const tasks = this.readFile('tasks.json');
    const classes = this.readFile('classes.json');
    const today = new Date();

    const result = [];

    tasks.forEach(task => {
      const deadline = new Date(task.deadline);
      const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      const reminderDays = task.reminder_days.split(',').map(d => parseInt(d.trim()));

      if (reminderDays.includes(daysUntilDeadline)) {
        const taskClass = classes.find(c => c.id === task.class_id);
        result.push({
          task: task,
          class: taskClass,
          daysLeft: daysUntilDeadline
        });
      }
    });

    return result;
  }
}

module.exports = new Database();
