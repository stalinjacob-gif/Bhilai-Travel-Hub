<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
$configured = is_file($configPath);
$config = $configured ? require $configPath : [];
$businessPhone = (string)($config['business_phone'] ?? '+91 7999981204');
$businessEmail = (string)($config['business_email'] ?? '');
$cancellation = [
    'freeHrs' => 6,
    'midHrs' => 2,
    'midPct' => (int)($config['cancel_mid_pct'] ?? 20),
    'lowPct' => 80,
];
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#073b3a">
  <meta name="description" content="Book trusted cab rides and self-drive cars across Bhilai, Durg and Raipur.">
  <title>Bhilai Travel Hub — Local rides, made easy</title>
  <link rel="stylesheet" href="assets/styles.css">
  <link rel="stylesheet" href="assets/interface.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="header-start">
        <a class="brand" href="#top" aria-label="Bhilai Travel Hub home">
          <img class="brand-logo" src="assets/bhilai-travel-hub-logo.png" alt="Bhilai Travel Hub, Chhattisgarh">
        </a>
        <a class="button button-primary header-cta" href="#book">Plan a ride <span aria-hidden="true">↗</span></a>
      </div>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-navigation">Explore sections</button>
      <nav id="main-navigation" class="main-nav" aria-label="Main navigation">
        <a href="#services">Services</a><a href="#book">Book a cab</a><a href="#self-drive">Self-drive</a>
        <a href="#fleet">Our fleet</a><a href="#routes">Routes &amp; fares</a><a href="#policy">Policy</a>
        <a href="#faq">FAQs</a><a href="#contact">Contact</a>
      </nav>
    </div>
  </header>

  <main id="top">
    <section class="hero hero-section">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow eyebrow-light"><span class="live-dot"></span> BHILAI · DURG · RAIPUR</span>
          <h1>Good journeys<br>start <em>right here.</em></h1>
          <p>Local cab rides and self-drive cars, with friendly support from a team that knows the roads.</p>
          <div class="hero-buttons">
            <a class="button button-lime" href="#book">Book a cab <span aria-hidden="true">→</span></a>
            <a class="button button-glass" href="#self-drive">Explore self-drive</a>
          </div>
          <div class="hero-airport-fares" aria-label="Airport one-way fares">
            <div class="hero-airport-fares-heading"><b>Airport rides · one way</b><span>Durg / Bhilai ↔ Raipur Airport</span></div>
            <div class="hero-airport-fare-options">
              <button type="button" data-airport-category="sedan" data-airport-direction="drop" aria-label="Request airport ride in Premium Sedan for ₹1,100 one way"><span>Premium Sedan</span><b>₹1,100</b></button>
              <button type="button" data-airport-category="suv" data-airport-direction="drop" aria-label="Request airport ride in SUV for ₹1,600 one way"><span>SUV</span><b>₹1,600</b></button>
              <button type="button" data-airport-category="mpv" data-airport-direction="drop" aria-label="Request airport ride in MPV for ₹2,200 one way"><span>MPV</span><b>₹2,200</b></button>
            </div>
            <small>Same fare for airport pickup and drop · Tap a fare to book</small>
          </div>
          <div class="hero-trust"><span>✓ No account needed</span><span>✓ Send your request in WhatsApp</span></div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-sun"></div><div class="art-road"><span></span></div>
          <div class="art-car"><span></span><i></i><b></b></div>
          <div class="art-label art-label-top">YOUR NEXT RIDE <b>→</b></div>
          <div class="art-label art-label-bottom"><b>BHILAI</b><span>Raipur is closer than you think.</span></div>
        </div>
        <form class="quick-trip" id="quick-trip-form">
          <div class="quick-trip-title"><span class="quick-icon">↗</span><div><b>Where to?</b><small>Get your trip started</small></div></div>
          <label for="quickPickup">Pickup point</label><input id="quickPickup" name="pickup" placeholder="e.g. Bhilai, Sector 6" required>
          <label for="quickDropoff">Going to</label><input id="quickDropoff" name="dropoff" placeholder="e.g. Raipur Airport" required>
          <button class="button button-primary button-wide">Continue to trip details <span aria-hidden="true">→</span></button>
        </form>
      </div>
      <div class="hero-bottom"><span>LOCAL KNOW-HOW</span><span>COMFORTABLE RIDES</span><span>PERSONAL SUPPORT</span></div>
    </section>

    <div class="page-content">
      <div id="load-error" class="notice notice-error" role="alert" hidden></div>
      <?php if (!$configured): ?>
        <div class="notice notice-error" role="alert">The PHP site files are installed, but <code>config.php</code> is missing. Copy <code>config.example.php</code> to <code>config.php</code>, set the database details, and import <code>schema.sql</code>.</div>
      <?php endif; ?>

      <section class="service-strip" id="services">
        <div class="section-heading"><div><span class="eyebrow">TRAVEL YOUR WAY</span><h2>Everything for the road ahead</h2><p>Choose a service to jump straight to the details.</p></div></div>
        <div class="service-grid">
          <button class="service-tile" type="button" data-scroll="book"><span class="service-icon">↗</span><b>Book a cab</b><small>Local, airport &amp; outstation</small><span class="tile-arrow">Explore →</span></button>
          <button class="service-tile" type="button" data-scroll="self-drive"><span class="service-icon service-icon-lime">▣</span><b>Self-drive cars</b><small>Choose dates and a vehicle</small><span class="tile-arrow">Explore →</span></button>
          <button class="service-tile" type="button" data-scroll="fleet"><span class="service-icon service-icon-peach">◈</span><b>Find your vehicle</b><small>Compare the available fleet</small><span class="tile-arrow">Explore →</span></button>
          <button class="service-tile" type="button" data-scroll="routes"><span class="service-icon service-icon-blue">⌁</span><b>Popular routes</b><small>See common journeys</small><span class="tile-arrow">Explore →</span></button>
        </div>
      </section>

      <section class="booking-section section-block" id="book">
        <div class="booking-intro">
          <span class="eyebrow">01 / CAB BOOKING</span><h2>Tell us about your trip.</h2>
          <p>Share the details and send your request directly to the travel desk in WhatsApp.</p>
          <div class="booking-promise"><span>01</span><div><b>Choose your journey</b><small>Pickup, drop-off and timing</small></div></div>
          <div class="booking-promise"><span>02</span><div><b>Review your WhatsApp message</b><small>Nothing is sent without your approval</small></div></div>
          <div class="booking-promise"><span>03</span><div><b>Get a confirmation</b><small>The travel desk replies in WhatsApp</small></div></div>
        </div>
        <form class="form-card" id="cab-form">
          <div class="form-card-heading"><div><span class="eyebrow">CAB REQUEST</span><h3>Trip details</h3></div><span class="step-pill">Step 1 of 1</span></div>
          <div class="form-grid">
            <div class="field"><label for="pickup">Pickup location</label><input id="pickup" name="pickup" autocomplete="street-address" placeholder="e.g. Bhilai, Sector 6" required></div>
            <div class="field"><label for="dropoff">Drop-off location</label><input id="dropoff" name="dropoff" autocomplete="street-address" placeholder="e.g. Raipur Airport" required></div>
            <div class="field"><label for="pickupAt">Pickup date &amp; time</label><input id="pickupAt" name="pickupAt" type="datetime-local" required></div>
            <div class="field"><label for="tripType">Trip type</label><select id="tripType" name="tripType"><option>One-way</option><option>Round trip</option><option>Local rental</option></select></div>
            <div class="field"><label for="passengers">Passengers</label><select id="passengers" name="passengers"><?php for ($i = 1; $i <= 7; $i++): ?><option value="<?= $i ?>"<?= $i === 2 ? ' selected' : '' ?>><?= $i ?> <?= $i === 1 ? 'passenger' : 'passengers' ?></option><?php endfor; ?></select></div>
            <div class="field"><label for="bags">Bags</label><select id="bags" name="luggage"><?php for ($i = 0; $i <= 10; $i++): ?><option value="<?= $i ?>"<?= $i === 1 ? ' selected' : '' ?>><?= $i ?> <?= $i === 1 ? 'bag' : 'bags' ?></option><?php endfor; ?></select></div>
            <div class="field"><label for="vehiclePreference">Vehicle preference</label><select id="vehiclePreference" name="category"><option value="sedan">Premium Sedan</option><option value="suv">SUV</option><option value="mpv">MPV</option></select></div>
            <div class="field"><label for="customerName">Your name <span>(optional)</span></label><input id="customerName" name="name" autocomplete="name"></div>
            <div class="field field-full"><label for="tripNotes">Extra details <span>(optional)</span></label><textarea id="tripNotes" name="notes" rows="3" placeholder="Stops, luggage or anything else we should know"></textarea></div>
          </div>
          <div class="form-footer"><p>Fare and availability are confirmed by the travel desk. No payment is taken here.</p><button class="button button-primary">Continue to WhatsApp <span aria-hidden="true">→</span></button></div>
          <div id="cab-draft"></div>
        </form>
      </section>

      <section class="section-block" id="self-drive">
        <div class="section-heading"><div><span class="eyebrow">02 / SELF-DRIVE</span><h2>Take the wheel.</h2><p>Pick a car and dates. We’ll confirm availability and pricing in WhatsApp.</p></div></div>
        <div class="vehicle-grid" id="self-drive-grid"><p class="empty-state">Loading cars…</p></div>
        <form class="form-card rental-card" id="rental-form" hidden>
          <div class="form-card-heading"><div><span class="eyebrow">RENTAL REQUEST</span><h3 id="rental-title">Vehicle</h3></div><button class="text-button" type="button" id="rental-close">Close</button></div>
          <div class="form-grid">
            <div class="field"><label for="rentalStart">Pickup date</label><input id="rentalStart" name="start" type="date" required></div>
            <div class="field"><label for="rentalEnd">Return date</label><input id="rentalEnd" name="end" type="date" required></div>
            <div class="field"><label for="renterName">Your name <span>(optional)</span></label><input id="renterName" name="name" autocomplete="name"></div>
          </div>
          <div class="form-footer"><p>Valid Indian driving licence and Aadhaar required at handover.</p><button class="button button-primary">Prepare WhatsApp request <span aria-hidden="true">→</span></button></div>
          <div id="rental-draft"></div>
        </form>
      </section>

      <section class="section-block" id="fleet">
        <div class="section-heading"><div><span class="eyebrow">03 / OUR FLEET</span><h2>A good fit for every trip.</h2><p>Filter the fleet and choose what works for your journey.</p></div>
          <select class="filter-select" id="fleet-filter" aria-label="Filter vehicles by category"><option value="all">All vehicles</option><option value="sedan">Premium Sedan</option><option value="suv">SUV</option><option value="mpv">MPV</option></select>
        </div>
        <div class="fleet-grid" id="fleet-grid"><p class="empty-state">Loading vehicles…</p></div>
      </section>

      <section class="routes-section section-block" id="routes">
        <div class="routes-heading"><div><span class="eyebrow">TRANSPARENT PRICING</span><h2>Popular Regional Express Routes</h2></div><p>Choose a route to add it to your booking request.</p></div>
        <div class="route-grid" id="route-grid"><p class="empty-state">Loading popular routes…</p></div>
      </section>

      <section class="policy-faq-stack section-block">
        <section id="policy" class="policy-section" aria-labelledby="policyTitle">
          <header class="policy-heading"><span class="eyebrow">CLEAR &amp; FAIR TERMS</span><h2 id="policyTitle">Booking Cancellation Policy</h2><p>Cancellation charges, refund guidance, and customer responsibilities for Bhilai Travel Hub rides.</p></header>
          <div class="policy-card">
            <div class="policy-tier-grid">
              <article class="policy-tier policy-tier-free"><span class="policy-tier-label"><i aria-hidden="true">✓</i> 1. Advance cancellation</span><b>No cancellation fee</b><p>Cancel at least <?= $cancellation['freeHrs'] ?> hours before pickup to avoid a cancellation fee.</p></article>
              <article class="policy-tier policy-tier-mid"><span class="policy-tier-label"><i aria-hidden="true">◷</i> 2. <?= $cancellation['midHrs'] ?> to <?= $cancellation['freeHrs'] ?> hours prior</span><b><?= $cancellation['midPct'] ?>% fee</b><p>Cancellations in this window are subject to the applicable fee on the booking amount.</p></article>
              <article class="policy-tier policy-tier-late"><span class="policy-tier-label"><i aria-hidden="true">!</i> 3. Under <?= $cancellation['midHrs'] ?> hours prior</span><b><?= $cancellation['lowPct'] ?>% fee</b><p>Late cancellations are subject to the stated fee. Contact the travel desk as soon as possible.</p></article>
            </div>
            <div class="policy-guidance-grid">
              <article class="policy-guidance"><span class="policy-guidance-icon policy-guidance-refund" aria-hidden="true">↻</span><div><b>4. Refund processing</b><p>The travel desk will confirm refund eligibility and timelines. This website does not process payments or refunds.</p></div></article>
              <article class="policy-guidance"><span class="policy-guidance-icon policy-guidance-customer" aria-hidden="true">✦</span><div><b>5. Customer responsibility</b><p>Please share accurate trip details and notify the travel desk early about changes so your driver can be updated.</p></div></article>
            </div>
          </div>
        </section>
        <section id="faq" class="faq-section" aria-labelledby="faqTitle">
          <header class="faq-heading"><span class="eyebrow">GOT QUESTIONS?</span><h2 id="faqTitle">Frequently Asked Questions</h2></header>
          <div class="faq-list">
            <details><summary>What are the cancellation charges if I change plans?</summary><p>There is no cancellation fee at least <?= $cancellation['freeHrs'] ?> hours before pickup. Between <?= $cancellation['midHrs'] ?> and <?= $cancellation['freeHrs'] ?> hours, the fee is <?= $cancellation['midPct'] ?>%; under <?= $cancellation['midHrs'] ?> hours, it is <?= $cancellation['lowPct'] ?>%. Contact the travel desk to discuss any eligible refund.</p></details>
            <details><summary>How does self-drive car rental work in Bhilai?</summary><p>Choose a vehicle and dates in the Self-drive section, then send a request for availability and pricing. A valid Indian driving licence and Aadhaar are required at handover.</p></details>
            <details><summary>Are toll taxes and GST included in the taxi fare?</summary><p>Airport one-way fares are shown on this page. For other trips, ask the travel desk to confirm fare details, including any applicable tolls or taxes, before you book.</p></details>
            <details><summary>When is my ride booking confirmed?</summary><p>Your ride is confirmed only after the travel desk checks availability and replies to you. Sending a WhatsApp request alone does not confirm the booking.</p></details>
          </div>
        </section>
      </section>

      <section class="contact-section section-block" id="contact">
        <div class="contact-copy"><span class="eyebrow eyebrow-light">07 / CONTACT</span><h2>Let’s get you moving.</h2><p>Have a question or a special request? Send the team a note and they’ll get back to you.</p>
          <a id="contact-call" href="tel:<?= e(preg_replace('/\s+/', '', $businessPhone)) ?>">Call the travel desk <b id="business-phone"><?= e($businessPhone) ?></b></a>
          <?php if ($businessEmail !== ''): ?><span class="contact-email">Booking inbox: <?= e($businessEmail) ?></span><?php endif; ?>
        </div>
        <form class="contact-card" id="contact-form">
          <div class="form-grid">
            <div class="field"><label for="contactName">Your name</label><input id="contactName" name="name" autocomplete="name" placeholder="Name (optional)"></div>
            <div class="field"><label for="contactEmail">Your email</label><input id="contactEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com"></div>
            <div class="field field-full"><label for="contactMessage">How can we help?</label><textarea id="contactMessage" name="message" rows="4" required placeholder="Write your question or request…"></textarea></div>
          </div>
          <button class="button button-primary">Continue to WhatsApp <span aria-hidden="true">→</span></button>
          <div id="contact-draft"></div>
        </form>
      </section>
    </div>
  </main>

  <footer class="site-footer">
    <div class="footer-main">
      <a class="brand brand-footer" href="#top" aria-label="Bhilai Travel Hub home"><img class="brand-logo" src="assets/bhilai-travel-hub-logo.png" alt="Bhilai Travel Hub, Chhattisgarh"></a>
      <p>Local rides and self-drive rentals across Bhilai, Durg and Raipur.</p>
      <div class="footer-links"><button data-scroll="services">Services</button><button data-scroll="book">Book a cab</button><button data-scroll="self-drive">Self-drive</button><button data-scroll="fleet">Our fleet</button><button data-scroll="routes">Routes &amp; fares</button><button data-scroll="policy">Policy</button><button data-scroll="faq">FAQs</button><button data-scroll="contact">Contact</button></div>
    </div>
    <div class="footer-bottom"><span>© 2026 Bhilai Travel Hub</span><span>Made for the roads around home.</span></div>
  </footer>

  <aside class="booking-assistant booking-assistant-open" aria-label="Smart booking assistant">
    <section class="assistant-panel" id="assistant-panel" aria-label="Booking assistant chat">
      <header class="assistant-header"><span class="assistant-avatar" aria-hidden="true">B<span>✦</span></span><div class="assistant-heading"><b>Your travel copilot</b><span><i></i> Here to help you book</span></div><button type="button" class="assistant-close" aria-label="Minimize assistant">−</button></header>
      <div class="assistant-trust">Quick, guided booking · No account needed</div>
      <div class="assistant-thread" id="assistant-thread" aria-live="polite"></div>
      <form class="assistant-input" id="assistant-form"><label class="sr-only" for="assistantMessage">Type your reply</label><input id="assistantMessage" autocomplete="off" placeholder="Type your answer…"><button type="submit" aria-label="Send message" disabled>↑</button></form>
      <p class="assistant-disclaimer">Your request is only sent when you choose WhatsApp and tap Send. The travel desk confirms availability and booking.</p>
    </section>
    <button type="button" class="assistant-launcher" id="assistant-launcher" aria-label="Open booking assistant" hidden><span class="assistant-avatar" aria-hidden="true">B<span>✦</span></span><span>Plan a ride</span><i aria-hidden="true">↑</i></button>
  </aside>
  <script src="assets/app.js" defer></script>
</body>
</html>
