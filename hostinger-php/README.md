# Hostinger upload package

This is the PHP 8 + MariaDB version of Bhilai Travel Hub. It does not include OTP, SMS, login, or customer accounts. Website forms prepare WhatsApp messages for visitors to review and send; they do not automatically confirm or save bookings.

## Upload using hPanel File Manager

1. In hPanel, create a MariaDB database and user. Record the database name, user, password, and host.
2. Open phpMyAdmin from hPanel, select the database, and import `schema.sql`.
3. In hPanel File Manager, open the correct domain's `public_html` directory. Upload `Bhilai-Travel-Hub-Hostinger.zip` and extract it **in `public_html`**. The archive has `index.php` at its top level, not in a nested project folder.
4. In File Manager, make a copy of `config.example.php` named `config.php`. Edit the `db` values using your Hostinger database credentials. Check `business_phone` and `whatsapp_number` as well. Never post/share database credentials.
5. In hPanel select PHP 8.x and ensure `pdo_mysql` is enabled. Enable SSL for the domain.
6. Visit your HTTPS domain. Test vehicle cards, routes, booking/contact forms, and WhatsApp links.
7. After importing the schema, `schema.sql` can be removed from `public_html`. `.htaccess` blocks direct web access to the config and SQL files.

## Files in this archive

- `index.php`, `.htaccess` — website page and API routing
- `api/index.php` — read-only JSON endpoints for site configuration, vehicles, and routes
- `assets/` — stylesheets, browser JavaScript, logo, and vehicle photos
- `config.example.php` — template to copy and configure as `config.php`
- `schema.sql` — MariaDB tables and starter vehicle/route rows; import through phpMyAdmin
- `README.md` — these deployment steps

The original React/Express app and `node_modules` are not needed for this PHP deployment.

## Configuration fields

- `db.host`, `db.name`, `db.user`, `db.password`, `db.charset`
- `business_phone`
- `whatsapp_number` (international digits only, currently `917999981204`)
- `business_email` (optional)
- `cancel_mid_pct` (default 20)
- `timezone` (default `Asia/Kolkata`)

There are no OTP or Twilio settings.

## API URLs

- `GET /api/config`
- `GET /api/vehicles` (optional `category` and `selfDrive=1`)
- `GET /api/routes`

## Troubleshooting

- **403 or directory listing:** Confirm `.htaccess` was extracted into `public_html` and Apache `.htaccess` support is enabled.
- **404 on `/api/...`:** Confirm `.htaccess` rewrite is active and PHP requests are reaching `api/index.php`.
- **500 / server error:** Check the hPanel PHP error log; verify `config.php`, database credentials, imported tables, PHP 8.x, and `pdo_mysql`.
- **Empty fleet or routes:** Confirm `schema.sql` imported into the same database configured in `config.php`; test `/api/vehicles` and `/api/routes`.
- **Missing styles or images:** Confirm the `assets/` folder was extracted beside `index.php`.
- **Hostinger parking page or old content:** Confirm the website files are directly in the domain's `public_html`, then clear Hostinger cache and hard-refresh.

The forms create WhatsApp drafts; booking confirmation and pricing must be agreed with the travel desk. This package does not process payments.
