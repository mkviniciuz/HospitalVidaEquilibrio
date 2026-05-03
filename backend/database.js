const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    
    db.serialize(() => {
      // Tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )`);

      // Inserir admin padrão
      db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (!err && row.count === 0) {
          const adminPassword = await bcrypt.hash('admin123', 10);
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Administrador', 'admin@vidaequilibrio.com', adminPassword, 'administrador']
          );
        }
      });

      // Tabela de pacientes expandida
      db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        social_name TEXT,
        dob TEXT NOT NULL,
        rg TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        phone TEXT,
        whatsapp TEXT,
        email TEXT,
        gender TEXT NOT NULL,
        cep TEXT,
        address TEXT,
        address_number TEXT,
        address_complement TEXT,
        city TEXT,
        state TEXT,
        emergency_name TEXT,
        emergency_phone TEXT,
        allergies TEXT,
        blood_type TEXT,
        service_type TEXT,
        plan_name TEXT,
        card_number TEXT,
        card_validity TEXT,
        lgpd_consent INTEGER,
        entry_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabela de Leitos
      db.run(`CREATE TABLE IF NOT EXISTS beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE,
        room TEXT,
        type TEXT, -- 'masculino' ou 'feminino'
        is_occupied INTEGER DEFAULT 0,
        patient_id INTEGER,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL
      )`);

      // Tabela de Medicamentos
      db.run(`CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT, -- 'ex: 8/8h'
        frequency_hours INTEGER, -- Para o cronômetro numérico
        is_timer_running INTEGER DEFAULT 0,
        timer_started_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )`);

      // Tabela de Observações
      db.run(`CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )`);

      // Popular leitos se não existirem
      db.get('SELECT COUNT(*) as count FROM beds', (err, row) => {
        if (!err && row.count === 0) {
          const stmt = db.prepare('INSERT INTO beds (room, type, number) VALUES (?, ?, ?)');
          // Quartos Femininos (1 a 5) - 3 leitos cada
          for (let room = 1; room <= 5; room++) {
            for (let bed = 1; bed <= 3; bed++) {
              stmt.run(`Quarto ${room}`, 'feminino', bed);
            }
          }
          // Quartos Masculinos (6 a 10) - 3 leitos cada
          for (let room = 6; room <= 10; room++) {
            for (let bed = 1; bed <= 3; bed++) {
              stmt.run(`Quarto ${room}`, 'masculino', bed);
            }
          }
          stmt.finalize();
          console.log('30 leitos iniciais gerados com sucesso.');
        }
      });
    });
  }
});

module.exports = db;
