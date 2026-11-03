CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(20) NOT NULL,
  seats TINYINT UNSIGNED NULL,
  transmission VARCHAR(80) NULL,
  fuel VARCHAR(40) NULL,
  self_drive TINYINT(1) NOT NULL DEFAULT 0,
  chauffeur TINYINT(1) NOT NULL DEFAULT 1,
  daily_rate INT UNSIGNED NULL,
  per_km_rate INT UNSIGNED NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  notes VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  tag VARCHAR(80) NULL,
  pickup VARCHAR(180) NULL,
  dropoff VARCHAR(180) NULL,
  duration VARCHAR(40) NULL,
  indicative_fare INT UNSIGNED NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO vehicles (name, category, seats, transmission, fuel, self_drive, chauffeur, notes)
SELECT 'Maruti Dzire', 'sedan', 5, 'Manual / Automatic', 'Petrol', 1, 1, 'Unlimited KMs, Bluetooth audio, doorstep delivery Bhilai/Durg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name = 'Maruti Dzire');
INSERT INTO vehicles (name, category, seats, transmission, fuel, self_drive, chauffeur, notes)
SELECT 'Maruti Ertiga', 'suv', 7, 'Manual', NULL, 1, 1, 'High ground clearance, 24x7 roadside assistance'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name = 'Maruti Ertiga');
INSERT INTO vehicles (name, category, seats, transmission, fuel, self_drive, chauffeur, notes)
SELECT 'Toyota Innova Crysta', 'mpv', 7, 'Manual', 'Diesel', 1, 1, 'Captain seats, Fastag & GPS equipped'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name = 'Toyota Innova Crysta');

INSERT INTO routes (slug, label, tag, pickup, dropoff, duration)
SELECT 'raipur-bhilai', 'Raipur ⇄ Bhilai / Durg', 'Daily Commute', 'Raipur', 'Bhilai', '~45 mins'
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE slug = 'raipur-bhilai');
INSERT INTO routes (slug, label, tag, pickup, dropoff, duration)
SELECT 'airport', 'Bhilai / Raipur ⇄ Airport (RPR)', 'Airport Special', 'Bhilai', 'Swami Vivekananda Airport, Raipur', '~50 mins'
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE slug = 'airport');
INSERT INTO routes (slug, label, tag, pickup, dropoff, duration)
SELECT 'bilaspur', 'Raipur / Bhilai ⇄ Bilaspur', 'Outstation Express', 'Raipur', 'Bilaspur', '~2 hrs'
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE slug = 'bilaspur');
