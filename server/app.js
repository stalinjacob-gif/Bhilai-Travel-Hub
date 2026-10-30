const express = require('express'), crypto = require('crypto'), path = require('path');
const cookieParser = require('cookie-parser'), helmet = require('helmet'), rateLimit = require('express-rate-limit');
const { open } = require('./db');
const { WHATSAPP_NUMBER } = require('./config');
const sha = (s) => crypto.createHmac('sha256', process.env.APP_SECRET || 'dev-only-secret').update(String(s)).digest('hex');
const MOBILE = /^[6-9]\d{9}$/, DAY = 864e5;
const CFG = { phone: process.env.BUSINESS_PHONE || '+91 98765 43210', whatsapp: WHATSAPP_NUMBER, email: process.env.BUSINESS_EMAIL || '', cancel: { freeHrs: 6, midHrs: 2, midPct: +(process.env.CANCEL_MID_PCT || 20), lowPct: 80 } };
const ref = (p) => p + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function createApp({ dbFile = process.env.DB_FILE || './data/bth.db', provider = null, now = () => Date.now() } = {}) {
  const db = open(dbFile), app = express(), prod = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: false }), express.json({ limit: '20kb' }), cookieParser());
  const lim = (max) => rateLimit({ windowMs: 15 * 60e3, max: process.env.NODE_ENV === 'test' ? 1e6 : max, standardHeaders: true });
  // CSRF: cookies are SameSite=Lax and every mutation must be JSON + custom header (blocks cross-site forms)
  app.use('/api', (q, s, n) => (['GET', 'HEAD'].includes(q.method) || (q.is('json') && q.get('x-requested-with') === 'bth')) ? n() : bad(s, 'Invalid request', 403));

  const auth = (q, s, n) => {
    const t = q.cookies.sid; if (!t) return bad(s, 'Login required', 401);
    const r = db.prepare('SELECT c.* FROM sessions x JOIN customers c ON c.id=x.customer_id WHERE x.token_hash=? AND x.expires_at>?').get(sha(t), now());
    if (!r) return bad(s, 'Session expired', 401); q.user = r; n();
  };

  app.get('/api/config', (q, s) => s.json({ phone: CFG.phone, whatsapp: CFG.whatsapp, email: CFG.email, cancellation: CFG.cancel }));

  // ---- Auth ----
  app.post('/api/auth/request-otp', lim(20), async (q, s) => {
    const m = String(q.body.mobile || ''); if (!MOBILE.test(m)) return bad(s, 'Enter a valid 10-digit Indian mobile number');
    if (!provider) return bad(s, 'SMS provider not configured', 503);
    const last = db.prepare('SELECT created_at FROM otps WHERE mobile=? ORDER BY id DESC LIMIT 1').get(m);
    if (last && now() - last.created_at < 30e3) return bad(s, 'Please wait 30 seconds before requesting another OTP', 429);
    const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
    try { await provider.send(m, code); } catch (err) {
      console.error(`OTP delivery failed (${provider.name}):`, err.message);
      return bad(s, 'Could not send OTP. Please try again later.', 502);
    }
    db.prepare('UPDATE otps SET used=1 WHERE mobile=?').run(m); // invalidate earlier codes only after successful delivery
    db.prepare('INSERT INTO otps(mobile,code_hash,expires_at,created_at) VALUES(?,?,?,?)').run(m, sha(m + code), now() + 5 * 60e3, now());
    s.json({ ok: true, expiresInSeconds: 300, delivery: provider.name });
  });
  app.post('/api/auth/verify-otp', lim(30), (q, s) => {
    const m = String(q.body.mobile || ''), code = String(q.body.otp || '');
    const o = db.prepare('SELECT * FROM otps WHERE mobile=? AND used=0 ORDER BY id DESC LIMIT 1').get(m);
    if (!o || o.expires_at < now()) return bad(s, 'OTP expired or not requested', 401);
    if (o.attempts >= 5) return bad(s, 'Too many attempts. Request a new OTP', 429);
    db.prepare('UPDATE otps SET attempts=attempts+1 WHERE id=?').run(o.id);
    const a = Buffer.from(o.code_hash), b = Buffer.from(sha(m + code));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return bad(s, 'Incorrect OTP', 401);
    db.prepare('UPDATE otps SET used=1 WHERE id=?').run(o.id);
    db.prepare('INSERT OR IGNORE INTO customers(mobile) VALUES(?)').run(m);
    const c = db.prepare('SELECT * FROM customers WHERE mobile=?').get(m), tok = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(tok), c.id, now() + 7 * DAY);
    s.cookie('sid', tok, { httpOnly: true, sameSite: 'lax', secure: prod, maxAge: 7 * DAY });
    s.json({ customer: { mobile: c.mobile, name: c.name, email: c.email } });
  });
  app.post('/api/auth/logout', (q, s) => { if (q.cookies.sid) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(q.cookies.sid)); s.clearCookie('sid'); s.json({ ok: true }); });
  app.get('/api/me', auth, (q, s) => s.json({ customer: { mobile: q.user.mobile, name: q.user.name, email: q.user.email } }));
  app.patch('/api/me', auth, (q, s) => {
    const name = String(q.body.name || '').trim().slice(0, 80), email = String(q.body.email || '').trim().slice(0, 120);
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return bad(s, 'Invalid email');
    db.prepare('UPDATE customers SET name=?,email=? WHERE id=?').run(name, email || null, q.user.id); s.json({ ok: true });
  });

  // ---- Catalogue ----
  app.get('/api/vehicles', (q, s) => {
    const w = [], p = [];
    if (q.query.category) { w.push('category=?'); p.push(q.query.category); }
    if (q.query.selfDrive === '1') w.push('self_drive=1');
    s.json(db.prepare(`SELECT * FROM vehicles ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY id`).all(...p));
  });
  app.get('/api/vehicles/:id/availability', (q, s) => {
    const { start, end } = q.query; if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) return bad(s, 'Valid start and end dates required');
    const n = db.prepare("SELECT COUNT(*) n FROM rentals WHERE vehicle_id=? AND status='confirmed' AND start_date<=? AND end_date>=?").get(+q.params.id, end, start).n;
    s.json({ available: n === 0 });
  });
  app.get('/api/routes', (q, s) => s.json(db.prepare('SELECT * FROM routes').all()));

  // ---- Cab bookings ----
  app.post('/api/bookings', auth, (q, s) => {
    const b = q.body, e = [];
    if (!String(b.pickup || '').trim()) e.push('pickup'); if (!String(b.dropoff || '').trim()) e.push('dropoff');
    const at = new Date(b.pickupAt); if (isNaN(at) || at.getTime() < now() + 30 * 60e3) e.push('pickupAt (must be at least 30 minutes ahead)');
    if (!['one-way', 'round-trip', 'local'].includes(b.tripType)) e.push('tripType');
    if (!Number.isInteger(b.passengers) || b.passengers < 1 || b.passengers > 7) e.push('passengers (1-7)');
    if (!['sedan', 'suv', 'mpv'].includes(b.vehicleCategory)) e.push('vehicleCategory');
    if (!String(b.name || '').trim()) e.push('name');
    if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) e.push('email');
    if (e.length) return s.status(422).json({ error: 'Invalid fields', fields: e });
    const r = ref('BTH');
    db.prepare('INSERT INTO bookings(ref,customer_id,pickup,dropoff,pickup_at,trip_type,passengers,luggage,vehicle_category,contact_name,email,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(r, q.user.id, b.pickup.trim(), b.dropoff.trim(), at.toISOString(), b.tripType, b.passengers, Math.max(0, +b.luggage || 0), b.vehicleCategory, b.name.trim(), b.email || null, String(b.notes || '').slice(0, 500));
    s.status(201).json({ ref: r, status: 'confirmed' });
  });
  app.get('/api/bookings', auth, (q, s) => s.json({
    bookings: db.prepare('SELECT * FROM bookings WHERE customer_id=? ORDER BY id DESC').all(q.user.id),
    rentals: db.prepare('SELECT r.*, v.name vehicle FROM rentals r JOIN vehicles v ON v.id=r.vehicle_id WHERE customer_id=? ORDER BY r.id DESC').all(q.user.id) }));
  app.get('/api/bookings/:ref', auth, (q, s) => { // ownership enforced in the query
    const b = db.prepare('SELECT * FROM bookings WHERE ref=? AND customer_id=?').get(q.params.ref, q.user.id); b ? s.json(b) : bad(s, 'Not found', 404);
  });
  app.post('/api/bookings/:ref/cancel', auth, (q, s) => {
    const b = db.prepare('SELECT * FROM bookings WHERE ref=? AND customer_id=?').get(q.params.ref, q.user.id);
    if (!b) return bad(s, 'Not found', 404); if (b.status !== 'confirmed') return bad(s, 'Booking is not active', 409);
    const hrs = (new Date(b.pickup_at) - now()) / 36e5, c = CFG.cancel;
    if (hrs <= 0) return bad(s, 'Pickup time has passed', 409);
    const pct = hrs >= c.freeHrs ? 0 : hrs >= c.midHrs ? c.midPct : c.lowPct;
    // No online payments are integrated, so no refund is ever processed by this system.
    db.prepare("UPDATE bookings SET status='cancelled',cancel_fee_pct=?,cancelled_at=?,refund_status='not_applicable_no_online_payment' WHERE id=?").run(pct, new Date(now()).toISOString(), b.id);
    s.json({ status: 'cancelled', cancellationFeePercent: pct, refund: 'No online payment is recorded; any refund is handled manually by the desk.' });
  });

  // ---- Self-drive rentals (overlap-safe: IMMEDIATE transaction serialises writers) ----
  app.post('/api/rentals', auth, (q, s) => {
    const b = q.body, today = new Date(now()).toISOString().slice(0, 10), D = /^\d{4}-\d{2}-\d{2}$/;
    if (!D.test(b.startDate) || !D.test(b.endDate) || b.startDate < today || b.endDate < b.startDate) return bad(s, 'Valid start/end dates required (not in the past)', 422);
    if (!String(b.name || '').trim()) return bad(s, 'Name required', 422);
    const v = db.prepare('SELECT * FROM vehicles WHERE id=? AND self_drive=1').get(+b.vehicleId);
    if (!v || !v.available) return bad(s, 'Vehicle not available for self-drive', 404);
    const r = ref('BTR');
    db.exec('BEGIN IMMEDIATE');
    try {
      const n = db.prepare("SELECT COUNT(*) n FROM rentals WHERE vehicle_id=? AND status='confirmed' AND start_date<=? AND end_date>=?").get(v.id, b.endDate, b.startDate).n;
      if (n) { db.exec('ROLLBACK'); return bad(s, 'Vehicle already booked for those dates', 409); }
      db.prepare('INSERT INTO rentals(ref,customer_id,vehicle_id,start_date,end_date,contact_name,notes) VALUES(?,?,?,?,?,?,?)').run(r, q.user.id, v.id, b.startDate, b.endDate, b.name.trim(), String(b.notes || '').slice(0, 500));
      db.exec('COMMIT');
    } catch (err) { try { db.exec('ROLLBACK'); } catch {} return bad(s, 'Could not create rental', 500); }
    s.status(201).json({ ref: r, status: 'confirmed' });
  });

  app.post('/api/contact', lim(10), (q, s) => {
    const { name, mobile, message } = q.body;
    if (!String(name || '').trim() || !MOBILE.test(String(mobile || '')) || String(message || '').trim().length < 5) return bad(s, 'Name, valid mobile and message required', 422);
    db.prepare('INSERT INTO enquiries(name,mobile,message) VALUES(?,?,?)').run(name.trim(), mobile, String(message).slice(0, 1000)); s.status(201).json({ ok: true });
  });

  app.use('/api', (q, s) => bad(s, 'Not found', 404));
  app.use(express.static(path.join(__dirname, '../public/build')));
  app.use((err, q, s, n) => { console.error(err.message); bad(s, 'Server error', 500); });
  app.db = db; return app;
}
module.exports = { createApp };
