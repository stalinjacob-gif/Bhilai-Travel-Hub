const { DatabaseSync } = require('node:sqlite');
function open(file) {
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY, mobile TEXT UNIQUE NOT NULL, name TEXT, email TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS otps(id INTEGER PRIMARY KEY, mobile TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER DEFAULT 0, used INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile, created_at);
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, seats INTEGER, transmission TEXT, fuel TEXT, self_drive INTEGER DEFAULT 0, chauffeur INTEGER DEFAULT 1, daily_rate INTEGER, per_km_rate INTEGER, available INTEGER DEFAULT 1, notes TEXT);
  CREATE TABLE IF NOT EXISTS routes(id INTEGER PRIMARY KEY, slug TEXT UNIQUE, label TEXT, tag TEXT, pickup TEXT, dropoff TEXT, duration TEXT, indicative_fare INTEGER);
  CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY, ref TEXT UNIQUE NOT NULL, customer_id INTEGER NOT NULL REFERENCES customers(id), pickup TEXT NOT NULL, dropoff TEXT NOT NULL, pickup_at TEXT NOT NULL, trip_type TEXT NOT NULL, passengers INTEGER NOT NULL, luggage INTEGER DEFAULT 0, vehicle_category TEXT NOT NULL, contact_name TEXT NOT NULL, email TEXT, notes TEXT, status TEXT DEFAULT 'confirmed', cancel_fee_pct INTEGER, cancelled_at TEXT, refund_status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
  CREATE TABLE IF NOT EXISTS rentals(id INTEGER PRIMARY KEY, ref TEXT UNIQUE NOT NULL, customer_id INTEGER NOT NULL REFERENCES customers(id), vehicle_id INTEGER NOT NULL REFERENCES vehicles(id), start_date TEXT NOT NULL, end_date TEXT NOT NULL, contact_name TEXT NOT NULL, notes TEXT, status TEXT DEFAULT 'confirmed', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX IF NOT EXISTS idx_rentals_vehicle ON rentals(vehicle_id, start_date, end_date);
  CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY, name TEXT, mobile TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  if (!db.prepare('SELECT 1 FROM vehicles LIMIT 1').get()) seed(db);
  return db;
}
function seed(db) { // TEST/DEV DATA: fares & rates intentionally unset (not provided in source).
  const v = db.prepare('INSERT INTO vehicles(name,category,seats,transmission,fuel,self_drive,chauffeur,notes) VALUES(?,?,?,?,?,?,?,?)');
  v.run('Maruti Dzire','sedan',5,'Manual / Automatic','Petrol',1,1,'Unlimited KMs, Bluetooth audio, doorstep delivery Bhilai/Durg');
  v.run('Maruti Ertiga','suv',7,'Manual',null,1,1,'High ground clearance, 24x7 roadside assistance');
  v.run('Toyota Innova Crysta','mpv',7,'Manual','Diesel',1,1,'Captain seats, Fastag & GPS equipped');
  const r = db.prepare('INSERT INTO routes(slug,label,tag,pickup,dropoff,duration) VALUES(?,?,?,?,?,?)');
  r.run('raipur-bhilai','Raipur ⇄ Bhilai / Durg','Daily Commute','Raipur','Bhilai','~45 mins');
  r.run('airport','Bhilai / Raipur ⇄ Airport (RPR)','Airport Special','Bhilai','Swami Vivekananda Airport, Raipur','~50 mins');
  r.run('bilaspur','Raipur / Bhilai ⇄ Bilaspur','Outstation Express','Raipur','Bilaspur','~2 hrs');
}
module.exports = { open };
