(() => {
  'use strict';

  const categories = { sedan: 'Premium Sedan', suv: 'SUV', mpv: 'MPV' };
  const photos = {
    sedan: {
      src: 'assets/vehicles/premium-sedan.jpg',
      alt: 'Premium sedan parked on a city street',
      credit: 'Photo: Biswarup Ganguly · CC BY 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Dzire_VXi_VVT_-_Subcompact_Car_-_Kolkata_2018-01-17_7574.JPG'
    },
    suv: {
      src: 'assets/vehicles/suv.jpg',
      alt: 'SUV parked outdoors',
      credit: 'Photo: Akashpbrahmavar · CC0',
      source: 'https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Ertiga(1).jpg'
    },
    mpv: {
      src: 'assets/vehicles/mpv.jpg',
      alt: 'MPV parked outside',
      credit: 'Photo: Premnath Kudva · CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_side.jpg'
    }
  };
  const airportFares = [
    { name: 'Premium Sedan', fare: 1100, category: 'sedan' },
    { name: 'SUV', fare: 1600, category: 'suv' },
    { name: 'MPV', fare: 2200, category: 'mpv' }
  ];
  const state = {
    config: {
      phone: '+91 7999981204',
      whatsapp: '917999981204',
      email: '',
      cancellation: { freeHrs: 6, midHrs: 2, midPct: 20, lowPct: 80 }
    },
    vehicles: [],
    routes: [],
    selectedRental: null,
    assistant: {
      open: true,
      stage: '',
      draft: {},
      messages: []
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

  async function getApi(path) {
    const response = await fetch(`api${path}`, { credentials: 'same-origin' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Could not load ${path}`);
    return data;
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function whatsappUrl(message) {
    const number = String(state.config.whatsapp || '').replace(/\D/g, '');
    return /^\d{8,15}$/.test(number)
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : '';
  }

  function draftPanel(body, key) {
    const target = document.getElementById(key);
    if (!target) return;
    const url = whatsappUrl(body);
    target.innerHTML = `<div class="draft-panel">
      <h3>Your booking message is ready</h3>
      <p>Open WhatsApp, review the details, then tap <b>Send</b>. This site does not send messages automatically.</p>
      ${url ? `<div class="draft-actions"><a class="button button-primary button-small" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Send request on WhatsApp</a></div>` : '<div class="notice notice-error" role="alert">WhatsApp booking is not configured. Check the business number in the server configuration.</div>'}
      <label for="${key}-preview">WhatsApp message</label>
      <textarea id="${key}-preview" rows="7" readonly>${escapeHtml(body)}</textarea>
    </div>`;
  }

  function setAirportBooking(direction, category) {
    const airport = 'Swami Vivekananda Airport, Raipur';
    $('#pickup').value = direction === 'drop' ? 'Durg / Bhilai' : airport;
    $('#dropoff').value = direction === 'drop' ? airport : 'Durg / Bhilai';
    $('#vehiclePreference').value = category;
    scrollTo('book');
  }

  function vehiclePhoto(category, className = '') {
    const photo = photos[category] || photos.sedan;
    return `<div class="vehicle-photo ${className}">
      <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
      <span class="vehicle-photo-label">${escapeHtml(categories[category] || 'Vehicle')}</span>
      <a class="vehicle-photo-credit" href="${photo.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.credit)}</a>
    </div>`;
  }

  function renderVehicleCards() {
    const selfGrid = $('#self-drive-grid');
    const fleetGrid = $('#fleet-grid');
    const selectedCategory = $('#fleet-filter').value;
    const selfDrive = state.vehicles.filter((vehicle) => Number(vehicle.self_drive) === 1);
    selfGrid.innerHTML = selfDrive.length ? selfDrive.map((vehicle, index) => `
      <article class="vehicle-card">
        ${vehiclePhoto(vehicle.category, `vehicle-art vehicle-art-${index % 3}`)}
        <div class="vehicle-card-body">
          <h3>${escapeHtml(categories[vehicle.category] || 'Vehicle')}</h3>
          <p>${escapeHtml(vehicle.seats)} seats${vehicle.transmission ? ` · ${escapeHtml(vehicle.transmission)}` : ''}${vehicle.fuel ? ` · ${escapeHtml(vehicle.fuel)}` : ''}</p>
          <p class="vehicle-note">${escapeHtml(vehicle.notes || 'Ask us about availability and features.')}</p>
          <div class="vehicle-card-footer"><b>${vehicle.daily_rate ? `${money(vehicle.daily_rate)}/day` : 'Rate on request'}</b>
            <button class="button button-secondary button-small" type="button" data-rent="${Number(vehicle.id)}">Choose ${escapeHtml(categories[vehicle.category] || 'vehicle')} <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </article>`).join('') : '<p class="empty-state">No self-drive cars are listed yet.</p>';

    const visible = selectedCategory === 'all'
      ? state.vehicles
      : state.vehicles.filter((vehicle) => vehicle.category === selectedCategory);
    fleetGrid.innerHTML = visible.length ? visible.map((vehicle) => `
      <article class="fleet-card">
        ${vehiclePhoto(vehicle.category, 'fleet-photo')}
        <div class="fleet-card-content">
          <div class="fleet-card-top"><span class="category-pill">${Number(vehicle.seats) || 0} seats</span>
            <span class="availability ${Number(vehicle.available) === 1 ? 'available' : 'unavailable'}"><i></i>${Number(vehicle.available) === 1 ? 'Available' : 'Check availability'}</span>
          </div>
          <h3>${escapeHtml(categories[vehicle.category] || 'Vehicle')}</h3>
          <p>${escapeHtml(vehicle.transmission || 'Comfortable ride')}${vehicle.fuel ? ` · ${escapeHtml(vehicle.fuel)}` : ''}</p>
          <p class="vehicle-note">${escapeHtml(vehicle.notes || 'Comfortable travel for your next journey.')}</p>
          <div class="fleet-card-bottom"><b>${vehicle.daily_rate ? `${money(vehicle.daily_rate)}/day` : 'Rate on request'}</b>
            <button class="text-button" type="button" data-select-vehicle="${Number(vehicle.id)}">Select ${escapeHtml(categories[vehicle.category] || 'vehicle')} →</button>
          </div>
        </div>
      </article>`).join('') : '<p class="empty-state">No vehicles match this category.</p>';
  }

  function renderRoutes() {
    const grid = $('#route-grid');
    grid.innerHTML = state.routes.map((route) => {
      const isAirport = route.slug === 'airport';
      const title = isAirport ? 'Bhilai / Raipur ⇄ Airport (RPR)' : route.label;
      const description = isAirport
        ? `Express Terminal Drop · ${route.duration || '~50 mins'}`
        : route.slug === 'raipur-bhilai'
          ? `Direct Highway Express · ${route.duration || '~45 mins'}`
          : `Intercity Outstation · ${route.duration || '~2 hrs'}`;
      const priceInfo = isAirport
        ? `<strong>One-way fares by segment</strong>
          <div class="route-airport-fares">${airportFares.map((item) => `<span>${item.name} <b>${money(item.fare)}</b></span>`).join('')}</div>
          <small>Same one-way fares for airport pickup and drop</small>`
        : `<strong>Billed as per Govt RTO Meter Tariff</strong>
          <small>${route.slug === 'raipur-bhilai' ? 'Zero Hidden Charges · Instant Dispatch' : 'All tolls & permits handled · Verified chauffeurs'}</small>`;
      const actions = isAirport
        ? '<button type="button" data-airport-category="sedan" data-airport-direction="drop">Airport drop <span aria-hidden="true">→</span></button><button type="button" data-airport-category="sedan" data-airport-direction="pickup">Airport pickup <span aria-hidden="true">→</span></button>'
        : `<button type="button" data-route="${escapeHtml(route.slug)}">Book this route <span aria-hidden="true">→</span></button>`;
      return `<article class="route-card route-card-${escapeHtml(route.slug)}">
        <span class="eyebrow">${escapeHtml(route.tag || '')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>
        <div class="route-card-info">${priceInfo}</div><div class="route-card-actions">${actions}</div>
      </article>`;
    }).join('');
  }

  function initializeDateFields() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 60);
    $('#pickupAt').min = now.toISOString().slice(0, 16);
    const today = new Date().toISOString().slice(0, 10);
    $('#rentalStart').min = today;
    $('#rentalEnd').min = today;
    $('#rentalStart').addEventListener('change', () => {
      $('#rentalEnd').min = $('#rentalStart').value || today;
      if ($('#rentalEnd').value && $('#rentalEnd').value < $('#rentalStart').value) {
        $('#rentalEnd').value = $('#rentalStart').value;
      }
    });
  }

  function requestCab(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const when = new Date(String(form.get('pickupAt')));
    const category = categories[String(form.get('category'))] || 'Premium Sedan';
    const message = [
      'Service: Chauffeur cab booking',
      `Route: ${String(form.get('pickup')).trim()} → ${String(form.get('dropoff')).trim()}`,
      `Date: ${when.toLocaleDateString()}`,
      `Time: ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      `Passengers: ${form.get('passengers')}`,
      `Customer name: ${String(form.get('name')).trim() || 'Not provided'}`,
      `Trip type: ${form.get('tripType')}`,
      `Bags: ${form.get('luggage') || 0}`,
      `Vehicle preference: ${category}`,
      `Instructions: ${String(form.get('notes')).trim() || 'None'}`
    ].join('\n');
    draftPanel(message, 'cab-draft');
  }

  function requestRental(event) {
    event.preventDefault();
    if (!state.selectedRental) return;
    const form = new FormData(event.currentTarget);
    const message = [
      'Hello Bhilai Travel Hub, I would like to request a self-drive rental.',
      '',
      `Name: ${String(form.get('name')).trim() || 'Not provided'}`,
      `Vehicle category: ${categories[state.selectedRental.category] || 'Vehicle'}`,
      `Pickup date: ${form.get('start')}`,
      `Return date: ${form.get('end')}`
    ].join('\n');
    draftPanel(message, 'rental-draft');
  }

  function requestContact(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = [
      'Hello Bhilai Travel Hub, I have a question.',
      '',
      `Name: ${String(form.get('name')).trim() || 'Not provided'}`,
      `Reply email: ${String(form.get('email')).trim() || 'Not provided'}`,
      `Message: ${String(form.get('message')).trim()}`
    ].join('\n');
    draftPanel(message, 'contact-draft');
  }

  function selectRental(vehicle) {
    state.selectedRental = vehicle;
    $('#rental-title').textContent = categories[vehicle.category] || 'Vehicle';
    $('#rental-form').hidden = false;
    $('#rental-draft').replaceChildren();
    $('#rental-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(message) {
    const error = $('#load-error');
    error.textContent = `We couldn’t load trip information: ${message}. Check the PHP configuration and MariaDB connection.`;
    error.hidden = false;
  }

  async function loadData() {
    try {
      const [config, vehicles, routes] = await Promise.all([
        getApi('/config'), getApi('/vehicles'), getApi('/routes')
      ]);
      state.config = config;
      state.vehicles = vehicles;
      state.routes = routes;
      const phone = String(config.phone || '');
      $('#business-phone').textContent = phone;
      $('#contact-call').href = `tel:${phone.replace(/\s/g, '')}`;
      if (config.email) {
        let line = $('.contact-email');
        if (!line) {
          line = document.createElement('span');
          line.className = 'contact-email';
          $('.contact-copy').append(line);
        }
        line.textContent = `Booking inbox: ${config.email}`;
      }
      renderVehicleCards();
      renderRoutes();
    } catch (error) {
      showError(error.message);
      $('#self-drive-grid').innerHTML = '<p class="empty-state">Vehicle information is temporarily unavailable.</p>';
      $('#fleet-grid').innerHTML = '<p class="empty-state">Vehicle information is temporarily unavailable.</p>';
      $('#route-grid').innerHTML = '<p class="empty-state">Route information is temporarily unavailable.</p>';
    }
  }

  function addAssistantMessage(role, text, actions = []) {
    state.assistant.messages.push({ role, text, actions });
    renderAssistant();
  }

  function renderAssistant() {
    const thread = $('#assistant-thread');
    thread.innerHTML = state.assistant.messages.map((message, index) => `
      <div class="assistant-message assistant-message-${message.role}" data-message-index="${index}">
        <p>${escapeHtml(message.text)}</p>
        ${message.actions.length ? `<div class="assistant-options">${message.actions.map((action) => `<button type="button" data-assistant-action="${escapeHtml(action.action)}">${escapeHtml(action.label)}<span aria-hidden="true">→</span></button>`).join('')}</div>` : ''}
        ${state.assistant.stage === 'complete' && index === state.assistant.messages.length - 1 ? assistantFinalActions() : ''}
      </div>`).join('');
    thread.scrollTop = thread.scrollHeight;
  }

  function assistantFinalActions() {
    const draft = state.assistant.draft;
    const body = [
      `Service: ${draft.serviceType || 'Cab booking'}`,
      `Route: ${draft.pickup || ''} → ${draft.dropoff || ''}`,
      `Date: ${draft.date || ''}`,
      `Time: ${draft.time || ''}`,
      `Passengers: ${draft.passengers || ''}`,
      `Vehicle: ${categories[draft.category] || 'Not selected'}`,
      `Customer name: ${draft.name || 'Not provided'}`,
      ...(draft.phone ? [`Phone: ${draft.phone}`] : [])
    ].join('\n');
    const url = whatsappUrl(body);
    return `<div class="assistant-final-actions">
      ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Send request on WhatsApp <span aria-hidden="true">↗</span></a>` : '<small>WhatsApp booking isn’t configured. Please call the travel desk to continue.</small>'}
      ${url ? '<button type="button" data-copy-request>Copy request text</button>' : ''}
      <p class="assistant-action-status" data-copy-status hidden></p>
      <textarea class="assistant-copy-fallback" data-copy-fallback rows="5" readonly hidden aria-label="Request text to copy"></textarea>
      <button type="button" data-assistant-action="restart">Start another request</button>
    </div>`;
  }

  function airportRequest(direction) {
    const location = 'Swami Vivekananda Airport, Raipur';
    state.assistant.draft = {
      serviceType: direction === 'drop' ? 'Airport drop' : 'Airport pickup',
      pickup: direction === 'drop' ? 'Durg / Bhilai' : location,
      dropoff: direction === 'drop' ? location : 'Durg / Bhilai'
    };
    state.assistant.stage = 'date';
    addAssistantMessage('bot', `I’ve set up an airport ${direction === 'drop' ? 'drop' : 'pickup'} request. What date do you need?`);
  }

  function showAirportFares() {
    const fares = airportFares.map((item) => `${item.name} ${money(item.fare)}`).join(' · ');
    addAssistantMessage('bot', `Durg / Bhilai ↔ Raipur Airport, one way: ${fares}. The same fares apply to pickup and drop. Availability is confirmed by the travel desk.`, [
      { label: 'Book airport drop', action: 'airport-drop' },
      { label: 'Book airport pickup', action: 'airport-pickup' }
    ]);
  }

  function answerAssistant(question) {
    const text = question.toLowerCase();
    if (/(book|ride|cab|taxi)/.test(text) && text.includes('airport') && text.includes('pickup')) {
      airportRequest('pickup');
    } else if (/(book|ride|cab|taxi)/.test(text) && text.includes('airport') && text.includes('drop')) {
      airportRequest('drop');
    } else if (/(book|ride|cab|taxi)/.test(text)) {
      state.assistant.draft = {};
      state.assistant.stage = 'pickup';
      addAssistantMessage('bot', 'Great. Where should we pick you up?');
    } else if (text.includes('cancel')) {
      const c = state.config.cancellation;
      addAssistantMessage('bot', `Cancellation: no fee at least ${c.freeHrs} hours before pickup; ${c.midPct}% between ${c.midHrs} and ${c.freeHrs} hours; ${c.lowPct}% under ${c.midHrs} hours. The travel desk confirms any applicable refund; this site does not process payments or refunds.`);
    } else if (text.includes('self') || text.includes('rent')) {
      addAssistantMessage('bot', 'For self-drive, choose a vehicle and dates in the Self-drive section. A valid Indian driving licence and Aadhaar are required at handover. The team will confirm availability and pricing.');
    } else if (text.includes('fare') || text.includes('price') || text.includes('airport')) {
      showAirportFares();
    } else if (text.includes('confirm') || text.includes('booked') || text.includes('booking')) {
      addAssistantMessage('bot', 'I can prepare your request, but it is not confirmed until the travel desk checks availability and replies to you on WhatsApp. You’ll review the message and tap Send before it reaches them.');
    } else if (text.includes('account') || text.includes('login')) {
      addAssistantMessage('bot', 'You do not need an account to send a request. The travel desk confirms availability and fare with you on WhatsApp.');
    } else {
      addAssistantMessage('bot', 'I can help with a cab request, airport fares, cancellation timing, or self-drive requirements. What would you like to know?', [
        { label: 'Book a ride', action: 'book' }, { label: 'Airport fares', action: 'airport-fares' }
      ]);
    }
  }

  function assistantAction(action) {
    if (action === 'book') {
      state.assistant.draft = {};
      state.assistant.stage = 'pickup';
      addAssistantMessage('bot', 'Great. Where should we pick you up?');
    } else if (action === 'airport-fares') {
      showAirportFares();
    } else if (action === 'airport-drop') {
      airportRequest('drop');
    } else if (action === 'airport-pickup') {
      airportRequest('pickup');
    } else if (action === 'restart') {
      state.assistant.draft = {};
      state.assistant.stage = '';
      addAssistantMessage('bot', 'What can I help you with?', [
        { label: 'Book a ride', action: 'book' },
        { label: 'Airport fares', action: 'airport-fares' },
        { label: 'Ask a question', action: 'faq' }
      ]);
    } else if (action === 'faq') {
      state.assistant.stage = '';
      addAssistantMessage('bot', 'What would you like to know? Ask about fares, cancellation, self-drive, or booking confirmation.');
    } else if (action.startsWith('category:')) {
      state.assistant.draft.category = action.split(':')[1];
      state.assistant.stage = 'name';
      addAssistantMessage('bot', 'What name should I include? You can type “skip” if you prefer not to add one.');
    }
  }

  function assistantSubmit(event) {
    event.preventDefault();
    const input = $('#assistantMessage');
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    addAssistantMessage('user', value);
    const draft = state.assistant.draft;
    switch (state.assistant.stage) {
      case 'pickup':
        draft.pickup = value;
        state.assistant.stage = 'dropoff';
        addAssistantMessage('bot', 'Where would you like to go?');
        break;
      case 'dropoff':
        draft.dropoff = value;
        state.assistant.stage = 'date';
        addAssistantMessage('bot', 'What date do you need? For example: 31 Oct 2026');
        break;
      case 'date':
        draft.date = value;
        state.assistant.stage = 'time';
        addAssistantMessage('bot', 'What pickup time works for you? For example: 10:30 AM');
        break;
      case 'time':
        draft.time = value;
        state.assistant.stage = 'passengers';
        addAssistantMessage('bot', 'How many passengers are travelling?');
        break;
      case 'passengers':
        draft.passengers = value;
        state.assistant.stage = 'category';
        addAssistantMessage('bot', 'Which vehicle segment would you prefer?', [
          { label: 'Premium Sedan', action: 'category:sedan' },
          { label: 'SUV', action: 'category:suv' },
          { label: 'MPV', action: 'category:mpv' }
        ]);
        break;
      case 'name':
        draft.name = value.toLowerCase() === 'skip' ? '' : value;
        state.assistant.stage = 'phone';
        addAssistantMessage('bot', 'What phone number can the travel desk use to contact you? Type “skip” to leave it out.');
        break;
      case 'phone':
        draft.phone = value.toLowerCase() === 'skip' ? '' : value;
        state.assistant.stage = 'complete';
        addAssistantMessage('bot', `Here’s your ${categories[draft.category] || 'vehicle'} request: ${draft.pickup} → ${draft.dropoff} on ${draft.date} at ${draft.time}, for ${draft.passengers} passenger(s). Please review and send it to the travel desk on WhatsApp. They’ll confirm availability and the booking with you.`);
        break;
      default:
        answerAssistant(value);
    }
  }

  function setupEvents() {
    const menuButton = $('.menu-toggle');
    const nav = $('#main-navigation');
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('main-nav-open', open);
    });
    $$('#main-navigation a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('main-nav-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
    $$('[data-scroll]').forEach((button) => button.addEventListener('click', () => scrollTo(button.dataset.scroll)));
    $('#quick-trip-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      $('#pickup').value = String(form.get('pickup')).trim();
      $('#dropoff').value = String(form.get('dropoff')).trim();
      scrollTo('book');
    });
    $('#cab-form').addEventListener('submit', requestCab);
    $('#rental-form').addEventListener('submit', requestRental);
    $('#contact-form').addEventListener('submit', requestContact);
    $('#rental-close').addEventListener('click', () => {
      state.selectedRental = null;
      $('#rental-form').hidden = true;
      $('#rental-draft').replaceChildren();
    });
    $('#fleet-filter').addEventListener('change', renderVehicleCards);
    document.addEventListener('click', (event) => {
      const airport = event.target.closest('[data-airport-category]');
      if (airport) {
        setAirportBooking(airport.dataset.airportDirection, airport.dataset.airportCategory);
        return;
      }
      const chooseRental = event.target.closest('[data-rent]');
      if (chooseRental) {
        const vehicle = state.vehicles.find((item) => Number(item.id) === Number(chooseRental.dataset.rent));
        if (vehicle) selectRental(vehicle);
        return;
      }
      const chooseFleet = event.target.closest('[data-select-vehicle]');
      if (chooseFleet) {
        const vehicle = state.vehicles.find((item) => Number(item.id) === Number(chooseFleet.dataset.selectVehicle));
        if (!vehicle) return;
        if (Number(vehicle.self_drive) === 1) {
          selectRental(vehicle);
        } else {
          $('#vehiclePreference').value = vehicle.category;
          scrollTo('book');
        }
        return;
      }
      const routeButton = event.target.closest('[data-route]');
      if (routeButton) {
        const route = state.routes.find((item) => item.slug === routeButton.dataset.route);
        if (route) {
          $('#pickup').value = route.pickup || '';
          $('#dropoff').value = route.dropoff || '';
          scrollTo('book');
        }
      }
    });

    const assistant = $('.booking-assistant');
    const closeAssistant = $('.assistant-close');
    const launcher = $('#assistant-launcher');
    closeAssistant.addEventListener('click', () => {
      state.assistant.open = false;
      $('#assistant-panel').hidden = true;
      launcher.hidden = false;
    });
    launcher.addEventListener('click', () => {
      state.assistant.open = true;
      $('#assistant-panel').hidden = false;
      launcher.hidden = true;
    });
    $('#assistant-form').addEventListener('submit', assistantSubmit);
    $('#assistantMessage').addEventListener('input', (event) => {
      $('#assistant-form button[type="submit"]').disabled = !event.target.value.trim();
    });
    $('#assistant-thread').addEventListener('click', async (event) => {
      const action = event.target.closest('[data-assistant-action]');
      if (action) {
        assistantAction(action.dataset.assistantAction);
        return;
      }
      const copyButton = event.target.closest('[data-copy-request]');
      if (copyButton) {
        const body = [
          `Service: ${state.assistant.draft.serviceType || 'Cab booking'}`,
          `Route: ${state.assistant.draft.pickup || ''} → ${state.assistant.draft.dropoff || ''}`,
          `Date: ${state.assistant.draft.date || ''}`,
          `Time: ${state.assistant.draft.time || ''}`,
          `Passengers: ${state.assistant.draft.passengers || ''}`,
          `Vehicle: ${categories[state.assistant.draft.category] || 'Not selected'}`,
          `Customer name: ${state.assistant.draft.name || 'Not provided'}`,
          ...(state.assistant.draft.phone ? [`Phone: ${state.assistant.draft.phone}`] : [])
        ].join('\n');
        const status = $('[data-copy-status]', copyButton.parentElement);
        const fallback = $('[data-copy-fallback]', copyButton.parentElement);
        try {
          await navigator.clipboard.writeText(body);
          status.textContent = 'Request text copied. Paste it into WhatsApp if needed.';
          fallback.hidden = true;
        } catch {
          status.textContent = 'Automatic copy is unavailable. Select the text below and copy it.';
          fallback.value = body;
          fallback.hidden = false;
          fallback.focus();
          fallback.select();
        }
        status.hidden = false;
      }
    });
    addAssistantMessage('bot', 'Hi! I’m your Bhilai Travel Hub assistant. I can help put together a ride request, check airport fares, or answer a quick question.', [
      { label: 'Book a ride', action: 'book' },
      { label: 'Airport fares', action: 'airport-fares' },
      { label: 'Ask a question', action: 'faq' }
    ]);
  }

  initializeDateFields();
  setupEvents();
  loadData();
})();
