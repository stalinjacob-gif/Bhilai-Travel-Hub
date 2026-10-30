process.env.NODE_ENV = 'test';
const { test } = require('node:test'), assert = require('node:assert'), request = require('supertest');
const { createApp } = require('../server/app');
const { WHATSAPP_NUMBER } = require('../server/config');
const H = { 'X-Requested-With': 'bth' };
let clock = Date.now(), sent = {};
const provider = { name: 'test', send: async (m, c) => { sent[m] = c; } };
const app = createApp({ dbFile: ':memory:', provider, now: () => clock });
async function login(mobile) {
  const a = request.agent(app); clock += 31e3;
  await a.post('/api/auth/request-otp').set(H).send({ mobile }).expect(200);
  await a.post('/api/auth/verify-otp').set(H).send({ mobile, otp: sent[mobile] }).expect(200); return a;
}
const trip = (o = {}) => ({ pickup: 'Bhilai Sector 6', dropoff: 'Raipur Airport', pickupAt: new Date(clock + 24 * 36e5).toISOString(), tripType: 'one-way', passengers: 2, vehicleCategory: 'sedan', name: 'Test', ...o });

test('failed OTP delivery does not block an immediate retry', async () => {
  let shouldFail = true;
  const retryApp = createApp({
    dbFile: ':memory:',
    provider: { name: 'test', send: async () => { if (shouldFail) throw new Error('test delivery failure'); } },
    now: () => clock
  });
  await request(retryApp).post('/api/auth/request-otp').set(H).send({ mobile: '9000000099' }).expect(502);
  shouldFail = false;
  await request(retryApp).post('/api/auth/request-otp').set(H).send({ mobile: '9000000099' }).expect(200);
});

test('OTP: never exposed, wrong/expired/reused rejected', async () => {
  const r = await request(app).post('/api/auth/request-otp').set(H).send({ mobile: '9000000001' }).expect(200);
  assert.ok(!JSON.stringify(r.body).includes(sent['9000000001']));
  await request(app).post('/api/auth/verify-otp').set(H).send({ mobile: '9000000001', otp: '000000' }).expect(401);
  await request(app).post('/api/auth/request-otp').set(H).send({ mobile: '9000000001' }).expect(429); // cooldown
  clock += 31e3; await request(app).post('/api/auth/request-otp').set(H).send({ mobile: '9000000001' }).expect(200);
  const code = sent['9000000001'];
  await request(app).post('/api/auth/verify-otp').set(H).send({ mobile: '9000000001', otp: code }).expect(200);
  await request(app).post('/api/auth/verify-otp').set(H).send({ mobile: '9000000001', otp: code }).expect(401); // reuse
  clock += 31e3; await request(app).post('/api/auth/request-otp').set(H).send({ mobile: '9000000002' }).expect(200);
  clock += 6 * 60e3; await request(app).post('/api/auth/verify-otp').set(H).send({ mobile: '9000000002', otp: sent['9000000002'] }).expect(401); // expired
  await request(app).post('/api/auth/request-otp').set(H).send({ mobile: '123' }).expect(400);
});
test('auth + CSRF header enforced', async () => {
  await request(app).get('/api/bookings').expect(401);
  await request(app).post('/api/contact').send({}).expect(403);
});
test('booking validation, persistence, isolation', async () => {
  const a = await login('9111111111'), b = await login('9222222222');
  await a.post('/api/bookings').set(H).send(trip({ passengers: 0 })).expect(422);
  await a.post('/api/bookings').set(H).send(trip({ pickupAt: new Date(clock - 1e3).toISOString() })).expect(422);
  const { body } = await a.post('/api/bookings').set(H).send(trip()).expect(201);
  assert.match(body.ref, /^BTH-/);
  assert.equal((await a.get('/api/bookings')).body.bookings.length, 1);
  assert.equal((await b.get('/api/bookings')).body.bookings.length, 0);
  await b.get('/api/bookings/' + body.ref).expect(404);
  await b.post(`/api/bookings/${body.ref}/cancel`).set(H).send({}).expect(404);
});
test('cancellation fee tiers', async () => {
  const a = await login('9333333333'), mk = async (h) => (await a.post('/api/bookings').set(H).send(trip({ pickupAt: new Date(clock + h * 36e5).toISOString() }))).body.ref;
  // bookings must be >=30min ahead at creation; move clock after creating
  const free = await mk(10), mid = await mk(4), low = await mk(1);
  const pct = async (r, h) => { clock += 0; return (await a.post(`/api/bookings/${r}/cancel`).set(H).send({})).body.cancellationFeePercent; };
  assert.equal(await pct(free), 0);
  const save = clock; clock = save + 1 * 36e5 + 30 * 6e4 * 0; // 'mid' now ~3h out, 'low' ~0h
  assert.equal(await pct(mid), 20);
  clock = save + 30 * 60e3; assert.equal(await pct(low), 80);
  await a.post(`/api/bookings/${low}/cancel`).set(H).send({}).expect(409);
});
test('rental overlap prevented, concurrent-safe, non-overlap ok', async () => {
  const a = await login('9444444444'), b = await login('9555555555'), d = (n) => new Date(clock + n * 864e5).toISOString().slice(0, 10);
  const mk = (ag, s, e) => ag.post('/api/rentals').set(H).send({ vehicleId: 1, startDate: d(s), endDate: d(e), name: 'T' });
  await mk(a, 2, 4).expect(201);
  await mk(b, 4, 5).expect(409); await mk(b, 1, 2).expect(409);
  await mk(b, 5, 6).expect(201);
  await mk(a, -3, -1).expect(422);
  const res = await Promise.all([mk(a, 10, 12), mk(b, 11, 13)]);
  assert.deepEqual(res.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await request(app).get(`/api/vehicles/1/availability?start=${d(2)}&end=${d(3)}`)).body.available, false);
});
test('catalogue from DB, contact, logout', async () => {
  assert.equal((await request(app).get('/api/config')).body.email, process.env.BUSINESS_EMAIL || '');
  assert.equal((await request(app).get('/api/config')).body.whatsapp, WHATSAPP_NUMBER);
  assert.equal((await request(app).get('/api/vehicles')).body.length, 3);
  assert.equal((await request(app).get('/api/routes')).body.length, 3);
  await request(app).post('/api/contact').set(H).send({ name: 'A', mobile: '9876500000', message: 'hello there' }).expect(201);
  const a = await login('9666666666'); await a.post('/api/auth/logout').set(H).send({}).expect(200); await a.get('/api/me').expect(401);
});
