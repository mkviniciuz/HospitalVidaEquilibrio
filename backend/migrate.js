const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const requiredColumns = [
  { name: 'social_name', type: 'TEXT' },
  { name: 'whatsapp', type: 'TEXT' },
  { name: 'email', type: 'TEXT' },
  { name: 'cep', type: 'TEXT' },
  { name: 'address_number', type: 'TEXT' },
  { name: 'address_complement', type: 'TEXT' },
  { name: 'city', type: 'TEXT' },
  { name: 'state', type: 'TEXT' },
  { name: 'emergency_name', type: 'TEXT' },
  { name: 'emergency_phone', type: 'TEXT' },
  { name: 'allergies', type: 'TEXT' },
  { name: 'blood_type', type: 'TEXT' },
  { name: 'service_type', type: 'TEXT' },
  { name: 'plan_name', type: 'TEXT' },
  { name: 'card_number', type: 'TEXT' },
  { name: 'card_validity', type: 'TEXT' },
  { name: 'lgpd_consent', type: 'INTEGER' }
];

db.serialize(() => {
  db.all("PRAGMA table_info(patients)", (err, columns) => {
    if (err) {
      console.error("Erro ao verificar colunas:", err);
      process.exit(1);
    }

    const existingNames = columns.map(c => c.name);
    
    requiredColumns.forEach(col => {
      if (!existingNames.includes(col.name)) {
        console.log(`Adicionando coluna ${col.name}...`);
        db.run(`ALTER TABLE patients ADD COLUMN ${col.name} ${col.type}`, (err) => {
          if (err) console.error(`Erro ao adicionar ${col.name}:`, err);
        });
      }
    });

    console.log("Migração concluída ou colunas já existentes.");
  });
});
