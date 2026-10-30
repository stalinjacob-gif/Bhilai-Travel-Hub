# Bhilai Travel Hub

Cab booking + self-drive rental site. React frontend, Express API, and SQLite database.

## Run (VS Code terminal)
Requires **Node.js 22.5+** (uses built-in `node:sqlite`).
```bash
npm install
npm run dev         # open http://localhost:5173 (Vite frontend)
npm test           # backend API tests
```
The development command starts both Vite and the Express API. Vite serves the React app on port 5173 and forwards `/api` requests to Express on port 3000. For a production-style run, `npm start` builds the React app and serves it with Express on port 3000.

Airport one-way fares between Durg/Bhilai and Raipur Airport are shown on the site: Sedan ₹1,100, Ertiga ₹1,600, and Crysta ₹2,200. The same fares apply in both directions.

Cab, self-drive and contact requests prepare a WhatsApp message addressed to the number configured in `server/config.js`. Booking links use WhatsApp click-to-chat URLs, and customers review the details and press Send; the website does not send automatically or confirm the booking. The DB (`data/bth.db`) and test seed data (3 vehicles, 3 routes) are created on first start.

The app does not load `.env` files automatically. If the business WhatsApp number changes, update `WHATSAPP_NUMBER` in `server/config.js`. For a local Mac/Linux development run:
```bash
BUSINESS_EMAIL='bookings@your-domain.com' npm run dev
```

## Deploy to Render

The root `render.yaml` configures a paid Node.js web service with a 1 GB persistent disk for SQLite. To deploy:

1. Push this project to a GitHub repository. Keep `.env` and `data/*.db*` out of Git; `.gitignore` excludes them.
2. Create/sign in to Render, choose **New → Blueprint**, and connect the GitHub repository.
3. Review the service and disk costs in Render before confirming deployment. The Blueprint sets `DB_FILE=/var/data/bth.db` so SQLite data is stored on the persistent disk, and asks Render to generate `APP_SECRET`.
4. After the deploy succeeds, open the service URL shown in the Render dashboard and test the site and booking flow.

The public URL is only created by Render after an account owner connects the repository and confirms deployment. Do not share account passwords, API keys, or other secrets.

## Environment (see `.env.example`)
PORT, NODE_ENV, APP_SECRET (set a long random value), DB_FILE, BUSINESS_PHONE, BUSINESS_EMAIL, CANCEL_MID_PCT. Read from the process environment (no dotenv).

The public website uses `GET /api/vehicles`, `GET /api/routes`, and `GET /api/config` to display information. Legacy account and database booking endpoints remain in the server for compatibility but are not part of the customer booking flow.

## Decisions / deviations from the brief
- React + Express + `node:sqlite` (plain JavaScript, Vite build; no TypeScript/Prisma/Tailwind).
- Booking requests are composed by WhatsApp click-to-chat; customers must press Send, and the travel desk confirms availability and price before accepting a booking.
- Airport fares are listed in the React UI. Other route fares and rental rates are not configured; those prices are confirmed by the travel desk.
- Set `WHATSAPP_NUMBER` in `server/config.js` to the real WhatsApp-enabled business number before launch.
- 2-6h cancellation fee is one configurable % (default 20) because the policy gives a 20-50% range.
- No payments: no refund is processed; cancellation only records the fee %.

## Not done / needs work
Admin dashboard, payments, Postgres migration, OpenAPI docs, frontend unit tests, Playwright E2E, address/map, terms page.
