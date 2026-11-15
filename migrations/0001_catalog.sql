CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  seats INTEGER,
  transmission TEXT,
  fuel TEXT,
  self_drive INTEGER NOT NULL DEFAULT 0,
  chauffeur INTEGER NOT NULL DEFAULT 1,
  daily_rate INTEGER,
  per_km_rate INTEGER,
  available INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  tag TEXT,
  pickup TEXT,
  dropoff TEXT,
  duration TEXT,
  indicative_fare INTEGER
);

INSERT INTO vehicles (name, category, seats, transmission, fuel, self_drive, chauffeur, notes)
VALUES
  ('Maruti Dzire', 'sedan', 5, 'Manual / Automatic', 'Petrol', 1, 1, 'Unlimited KMs, Bluetooth audio, doorstep delivery Bhilai/Durg'),
  ('Maruti Ertiga', 'suv', 7, 'Manual', NULL, 1, 1, 'High ground clearance, 24x7 roadside assistance'),
  ('Toyota Innova Crysta', 'mpv', 7, 'Manual', 'Diesel', 1, 1, 'Captain seats, Fastag & GPS equipped');

INSERT INTO routes (slug, label, tag, pickup, dropoff, duration)
VALUES
  ('raipur-bhilai', 'Raipur ⇄ Bhilai / Durg', 'Daily Commute', 'Raipur', 'Bhilai', '~45 mins'),
  ('airport', 'Bhilai / Raipur ⇄ Airport (RPR)', 'Airport Special', 'Bhilai', 'Swami Vivekananda Airport, Raipur', '~50 mins'),
  ('bilaspur', 'Raipur / Bhilai ⇄ Bilaspur', 'Outstation Express', 'Raipur', 'Bilaspur', '~2 hrs');
