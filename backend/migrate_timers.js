const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE medications ADD COLUMN frequency_hours INTEGER;", (err) => {
    if (err) console.log(err.message);
    else console.log("Added frequency_hours");
  });
  db.run("ALTER TABLE medications ADD COLUMN is_timer_running INTEGER DEFAULT 0;", (err) => {
    if (err) console.log(err.message);
    else console.log("Added is_timer_running");
  });
  db.run("ALTER TABLE medications ADD COLUMN timer_started_at DATETIME;", (err) => {
    if (err) console.log(err.message);
    else console.log("Added timer_started_at");
  });
});

db.close();
