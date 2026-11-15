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

## Cube & Pour Hospitality static website

The workspace root also contains a standalone, no-build multi-page Cube & Pour Hospitality website:

- Open `index.html` directly in a browser, or serve the workspace root with VS Code Live Server.
- Pages: `index.html`, `services.html`, `framework.html`, `about.html`, `ice-program.html`, `testimonials.html`, `contact.html`, and `404.html`.
- Shared styles and interactions are in `assets/css/style.css` and `assets/js/main.js`; the favicon is `assets/img/favicon.svg`.
- Edit each page’s copy in its HTML file and update the palette custom properties at the top of `assets/css/style.css`.
- Set the Formspree endpoint in `assets/js/main.js` where marked TODO. If submission fails, the form prepares an email using the `mailto:` fallback.
- Deploy from the workspace root without a build command. Netlify and Vercel can use `.` as the publish/output directory; GitHub Pages can publish the repository root.

The static site markup is kept separate from the existing travel booking app in `client/`.

## Deploy the Bhilai Travel Hub app to Cloudflare

The React app can run entirely on Cloudflare using **Workers Static Assets** for the Vite build and a **Cloudflare Worker + D1** for the public catalogue API. This deployment does not use Render, Express, or SQLite. The visible booking and contact forms remain WhatsApp drafts; OTP, login, and SMS are not included in this Cloudflare deployment.

Requirements: Node.js 22.5+, npm, and a Cloudflare account with Workers and D1 enabled.

1. Install dependencies and authenticate Wrangler:
   ```bash
   npm install
   npx wrangler login
   ```
2. The production D1 database is `bhilai-travel-hub-db` in APAC; its ID and binding are already configured in `wrangler.jsonc`. Do not create a second database. If setting this up in a different Cloudflare account, create a database and replace the ID with that account’s D1 ID.
3. Apply the schema and starter vehicle/route rows to the remote database:
   ```bash
   npx wrangler d1 migrations apply bhilai-travel-hub-db --remote
   ```
4. Deploy the site and Worker:
   ```bash
   npm run cf:deploy
   ```
5. The custom domains `bhilaitravelhub.com` and `www.bhilaitravelhub.com` are configured in `wrangler.jsonc`; Cloudflare creates the DNS and certificate configuration on deploy. The domain’s nameservers already use Cloudflare, so do not change them again.
6. Test the HTTPS site, `/api/config`, `/api/vehicles`, and `/api/routes`. The API returns catalogue/configuration only; public booking requests are prepared in WhatsApp and are not saved as confirmed bookings.

If deploying through the Cloudflare dashboard’s Git integration, use repository root `/`, build command `npm run build`, and deploy command `npx wrangler deploy`. The same configured D1 database and domains are used.

The Worker config is in `wrangler.jsonc`, its API entry point is `worker.js`, and the D1 schema/seeds are in `migrations/0001_catalog.sql`. Review the public business contact values in the `vars` section of `wrangler.jsonc` before deployment.

For local development of the existing Express/SQLite version, continue using `npm run dev`. To run the Cloudflare version locally, run:
   ```bash
   npm run build
   npx wrangler d1 migrations apply bhilai-travel-hub-db --local
   npm run cf:dev
   ```
   The local D1 database is stored under `.wrangler/`.

## Environment (see `.env.example`)

For the local Express/SQLite development server, `PORT`, `NODE_ENV`, `APP_SECRET`, `DB_FILE`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, and `CANCEL_MID_PCT` are read from the process environment (no dotenv). The Cloudflare Worker uses the `vars` and D1 binding in `wrangler.jsonc` instead.

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
