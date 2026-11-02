import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import premiumSedanPhoto from './assets/vehicles/premium-sedan.jpg';
import suvPhoto from './assets/vehicles/suv.jpg';
import mpvPhoto from './assets/vehicles/mpv.jpg';
import bhilaiTravelHubLogo from './assets/bhilai-travel-hub-logo.png';
import './styles.css';
import './interface.css';

const CATEGORIES = {
  sedan: 'Premium Sedan',
  suv: 'SUV',
  mpv: 'MPV'
};

const EMPTY_ASSISTANT_DRAFT = {
  serviceType: 'Cab booking',
  pickup: '',
  dropoff: '',
  date: '',
  time: '',
  passengers: '',
  category: '',
  name: '',
  phone: ''
};

const VEHICLE_PHOTOS = {
  sedan: {
    src: premiumSedanPhoto,
    alt: 'Premium sedan parked on a city street',
    credit: 'Photo: Biswarup Ganguly · CC BY 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Dzire_VXi_VVT_-_Subcompact_Car_-_Kolkata_2018-01-17_7574.JPG'
  },
  suv: {
    src: suvPhoto,
    alt: 'SUV parked outdoors',
    credit: 'Photo: Akashpbrahmavar · CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Ertiga(1).jpg'
  },
  mpv: {
    src: mpvPhoto,
    alt: 'MPV parked outside',
    credit: 'Photo: Premnath Kudva · CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_side.jpg'
  }
};

const AIRPORT_FARES = [
  { name: CATEGORIES.sedan, fare: 1100, category: 'sedan' },
  { name: CATEGORIES.suv, fare: 1600, category: 'suv' },
  { name: CATEGORIES.mpv, fare: 2200, category: 'mpv' }
];

const NAV_ITEMS = [
  ['services', 'Services'],
  ['book', 'Book a cab'],
  ['self-drive', 'Self-drive'],
  ['fleet', 'Our fleet'],
  ['routes', 'Routes & fares'],
  ['policy', 'Policy'],
  ['faq', 'FAQs'],
  ['contact', 'Contact']
];

const EMPTY_TRIP = {
  pickup: '',
  dropoff: '',
  pickupAt: '',
  tripType: 'One-way',
  passengers: '2',
  luggage: '1',
  category: 'sedan',
  name: '',
  notes: ''
};

async function api(path) {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Could not load ${path}`);
  return data;
}

function localDateTimeMin() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function whatsappDraftUrl(phone, message) {
  const number = phone.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Notice({ tone = 'info', children }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

function VehiclePhoto({ category, className = '' }) {
  const photo = VEHICLE_PHOTOS[category] || VEHICLE_PHOTOS.sedan;
  return (
    <div className={`vehicle-photo ${className}`}>
      <img src={photo.src} alt={photo.alt} loading="lazy" />
      <span className="vehicle-photo-label">{CATEGORIES[category] || 'Vehicle'}</span>
      <a className="vehicle-photo-credit" href={photo.source} target="_blank" rel="noopener noreferrer">{photo.credit}</a>
    </div>
  );
}

function BookingAssistant({ config }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: 'Hi! I’m your Bhilai Travel Hub assistant. I can help put together a ride request, check airport fares, or answer a quick question.',
    actions: [
      { label: 'Book a ride', action: 'book' },
      { label: 'Airport fares', action: 'airport-fares' },
      { label: 'Ask a question', action: 'faq' }
    ]
  }]);
  const [stage, setStage] = useState('');
  const [draft, setDraft] = useState(EMPTY_ASSISTANT_DRAFT);
  const [input, setInput] = useState('');
  const [launchNotice, setLaunchNotice] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const threadRef = useRef(null);
  const whatsappNumber = (config.whatsapp || '').replace(/\D/g, '');
  const whatsappReady = /^\d{8,15}$/.test(whatsappNumber);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isOpen, launchNotice, copyStatus, copyFailed]);

  const addMessage = (role, text, actions) => {
    setMessages((current) => [...current, { role, text, ...(actions ? { actions } : {}) }]);
  };

  const askPickup = () => {
    setDraft({ ...EMPTY_ASSISTANT_DRAFT });
    setStage('pickup');
    addMessage('bot', 'Great. Where should we pick you up?');
  };

  const beginAirportRequest = (direction) => {
    const airport = 'Swami Vivekananda Airport, Raipur';
    const nextDraft = direction === 'drop'
      ? { ...EMPTY_ASSISTANT_DRAFT, serviceType: 'Airport drop', pickup: 'Durg / Bhilai', dropoff: airport }
      : { ...EMPTY_ASSISTANT_DRAFT, serviceType: 'Airport pickup', pickup: airport, dropoff: 'Durg / Bhilai' };
    setDraft(nextDraft);
    setStage('date');
    addMessage('bot', `I’ve set up an airport ${direction === 'drop' ? 'drop' : 'pickup'} request. What date do you need?`);
  };

  const showAirportFares = () => {
    const fares = AIRPORT_FARES.map(({ name, fare }) => `${name} ₹${fare.toLocaleString('en-IN')}`).join(' · ');
    addMessage('bot', `Durg / Bhilai ↔ Raipur Airport, one way: ${fares}. The same fares apply to pickup and drop. Availability is confirmed by the travel desk.`, [
      { label: 'Book airport drop', action: 'airport-drop' },
      { label: 'Book airport pickup', action: 'airport-pickup' }
    ]);
  };

  const answerQuestion = (question) => {
    const text = question.toLowerCase();
    if (/(book|ride|cab|taxi)/.test(text) && text.includes('airport') && text.includes('pickup')) {
      beginAirportRequest('pickup');
    } else if (/(book|ride|cab|taxi)/.test(text) && text.includes('airport') && text.includes('drop')) {
      beginAirportRequest('drop');
    } else if (/(book|ride|cab|taxi)/.test(text)) {
      askPickup();
    } else if (text.includes('cancel')) {
      addMessage('bot', `Cancellation: no fee at least ${config.cancellation.freeHrs} hours before pickup; ${config.cancellation.midPct}% between ${config.cancellation.midHrs} and ${config.cancellation.freeHrs} hours; ${config.cancellation.lowPct}% under ${config.cancellation.midHrs} hours. The travel desk confirms any applicable refund; this site does not process payments or refunds.`);
    } else if (text.includes('self') || text.includes('rent')) {
      addMessage('bot', 'For self-drive, choose a vehicle and dates in the Self-drive section. A valid Indian driving licence and Aadhaar are required at handover. The team will confirm availability and pricing.');
    } else if (text.includes('fare') || text.includes('price') || text.includes('airport')) {
      showAirportFares();
    } else if (text.includes('confirm') || text.includes('booked') || text.includes('booking')) {
      addMessage('bot', 'I can prepare your request, but it is not confirmed until the travel desk checks availability and replies to you on WhatsApp. You’ll review the message and tap Send before it reaches them.');
    } else if (text.includes('account') || text.includes('login')) {
      addMessage('bot', 'You do not need an account to send a request. The travel desk confirms availability and fare with you on WhatsApp.');
    } else {
      addMessage('bot', 'I can help with a cab request, airport fares, cancellation timing, or self-drive requirements. What would you like to know?', [
        { label: 'Book a ride', action: 'book' },
        { label: 'Airport fares', action: 'airport-fares' }
      ]);
    }
  };

  const handleAction = (action, label) => {
    addMessage('user', label);
    if (action === 'book') {
      askPickup();
    } else if (action === 'airport-fares') {
      showAirportFares();
    } else if (action === 'faq') {
      setStage('faq');
      addMessage('bot', 'Ask me about cancellation, self-drive, airport fares, or booking confirmations.');
    } else if (action === 'airport-drop') {
      beginAirportRequest('drop');
    } else if (action === 'airport-pickup') {
      beginAirportRequest('pickup');
    } else if (action.startsWith('category:')) {
      const category = action.split(':')[1];
      setDraft((current) => ({ ...current, category }));
      setStage('name');
      addMessage('bot', 'What name should I include? You can type “skip” if you prefer not to add one.');
    }
  };

  const finishRequest = (nextDraft) => {
    setDraft(nextDraft);
    setStage('complete');
    addMessage('bot', `Here’s your ${CATEGORIES[nextDraft.category]} request: ${nextDraft.pickup} → ${nextDraft.dropoff} on ${nextDraft.date} at ${nextDraft.time}, for ${nextDraft.passengers} passenger(s). Please review and send it to the travel desk on WhatsApp. They’ll confirm availability and the booking with you.`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput('');
    addMessage('user', value);

    if (stage === 'pickup') {
      const nextDraft = { ...draft, pickup: value };
      setDraft(nextDraft);
      setStage('dropoff');
      addMessage('bot', 'Where would you like to go?');
    } else if (stage === 'dropoff') {
      const nextDraft = { ...draft, dropoff: value };
      setDraft(nextDraft);
      setStage('date');
      addMessage('bot', 'What date do you need? For example: 31 Oct 2026');
    } else if (stage === 'date') {
      const nextDraft = { ...draft, date: value };
      setDraft(nextDraft);
      setStage('time');
      addMessage('bot', 'What pickup time works for you? For example: 10:30 AM');
    } else if (stage === 'time') {
      const nextDraft = { ...draft, time: value };
      setDraft(nextDraft);
      setStage('passengers');
      addMessage('bot', 'How many passengers are travelling?');
    } else if (stage === 'passengers') {
      const nextDraft = { ...draft, passengers: value };
      setDraft(nextDraft);
      setStage('category');
      addMessage('bot', 'Which vehicle segment would you prefer?', [
        { label: 'Premium Sedan', action: 'category:sedan' },
        { label: 'SUV', action: 'category:suv' },
        { label: 'MPV', action: 'category:mpv' }
      ]);
    } else if (stage === 'name') {
      setDraft((current) => ({ ...current, name: value.toLowerCase() === 'skip' ? '' : value }));
      setStage('phone');
      addMessage('bot', 'What phone number can the travel desk use to contact you? Type “skip” to leave it out.');
    } else if (stage === 'phone') {
      finishRequest({ ...draft, phone: value.toLowerCase() === 'skip' ? '' : value });
    } else {
      answerQuestion(value);
    }
  };

  const requestBody = [
    `Service: ${draft.serviceType}`,
    `Route: ${draft.pickup} → ${draft.dropoff}`,
    `Date: ${draft.date}`,
    `Time: ${draft.time}`,
    `Passengers: ${draft.passengers}`,
    `Vehicle: ${CATEGORIES[draft.category] || 'Not selected'}`,
    `Customer name: ${draft.name || 'Not provided'}`,
    ...(draft.phone ? [`Phone: ${draft.phone}`] : [])
  ].join('\n');

  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(requestBody);
      setCopyFailed(false);
      setCopyStatus('Request text copied. Paste it into WhatsApp if needed.');
    } catch {
      setCopyFailed(true);
      setCopyStatus('Automatic copy is unavailable. Select the text below and copy it.');
    }
  };

  const restart = () => {
    setDraft({ ...EMPTY_ASSISTANT_DRAFT });
    setStage('');
    setLaunchNotice('');
    setCopyStatus('');
    setCopyFailed(false);
    addMessage('bot', 'What can I help you with?', [
      { label: 'Book a ride', action: 'book' },
      { label: 'Airport fares', action: 'airport-fares' },
      { label: 'Ask a question', action: 'faq' }
    ]);
  };

  return (
    <aside className={`booking-assistant ${isOpen ? 'booking-assistant-open' : ''}`} aria-label="Smart booking assistant">
      {isOpen ? (
        <section className="assistant-panel" aria-label="Booking assistant chat">
          <header className="assistant-header">
            <span className="assistant-avatar" aria-hidden="true">B<span>✦</span></span>
            <div className="assistant-heading"><b>Your travel copilot</b><span><i /> Here to help you book</span></div>
            <button type="button" className="assistant-close" aria-label="Minimize assistant" onClick={() => setIsOpen(false)}>−</button>
          </header>
          <div className="assistant-trust">Quick, guided booking · No account needed</div>
          <div className="assistant-thread" ref={threadRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`assistant-message assistant-message-${message.role}`} key={`${index}-${message.text.slice(0, 12)}`}>
                <p>{message.text}</p>
                {message.actions?.length > 0 && <div className="assistant-options">{message.actions.map((option) => (
                  <button type="button" key={option.action} onClick={() => handleAction(option.action, option.label)}>{option.label}<span aria-hidden="true">→</span></button>
                ))}</div>}
                {stage === 'complete' && index === messages.length - 1 && (
                  <div className="assistant-final-actions">
                    {whatsappReady
                      ? <a href={whatsappDraftUrl(whatsappNumber, requestBody)} target="_blank" rel="noopener noreferrer" onClick={() => setLaunchNotice('WhatsApp opened in a new tab. Review your request and tap Send; the travel desk will confirm availability.')}>Send request on WhatsApp <span aria-hidden="true">↗</span></a>
                      : <small>WhatsApp booking isn’t configured. Please call the travel desk to continue.</small>}
                    {whatsappReady && <button type="button" onClick={copyRequest}>Copy request text</button>}
                    {launchNotice && <p className="assistant-action-status" role="status">{launchNotice}</p>}
                    {copyStatus && <p className="assistant-action-status" role="status">{copyStatus}</p>}
                    {copyFailed && <textarea className="assistant-copy-fallback" rows="5" readOnly value={requestBody} onFocus={(event) => event.currentTarget.select()} aria-label="Request text to copy" />}
                    <button type="button" onClick={restart}>Start another request</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="assistant-input" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="assistantMessage">Type your reply</label>
            <input id="assistantMessage" value={input} onChange={(event) => setInput(event.target.value)} placeholder={stage === 'complete' ? 'Ask another question…' : 'Type your answer…'} autoComplete="off" />
            <button type="submit" aria-label="Send message" disabled={!input.trim()}>↑</button>
          </form>
          <p className="assistant-disclaimer">Your request is only sent when you choose WhatsApp and tap Send. The travel desk confirms availability and booking.</p>
        </section>
      ) : (
        <button type="button" className="assistant-launcher" onClick={() => setIsOpen(true)} aria-label="Open booking assistant">
          <span className="assistant-avatar" aria-hidden="true">B<span>✦</span></span><span>Plan a ride</span><i aria-hidden="true">↑</i>
        </button>
      )}
    </aside>
  );
}

function RequestDraft({ config, subject, body }) {
  const detailsId = `request-details-${subject.replace(/\W/g, '-').toLowerCase()}`;
  const whatsappNumber = (config.whatsapp || '').replace(/\D/g, '');
  const whatsappReady = /^\d{8,15}$/.test(whatsappNumber);

  return (
    <div className="draft-panel">
      <h3>Your booking message is ready</h3>
      <p>Open WhatsApp, review the details, then tap <b>Send</b>. This site does not send messages automatically.</p>
      {!whatsappReady && <Notice tone="error">WhatsApp booking is not configured. Check the business number in the server configuration.</Notice>}
      {whatsappReady && <div className="draft-actions">
        <a className="button button-primary button-small" href={whatsappDraftUrl(whatsappNumber, body)} target="_blank" rel="noopener noreferrer">Send request on WhatsApp</a>
      </div>}
      <label htmlFor={detailsId}>WhatsApp message</label>
      <textarea id={detailsId} rows="7" readOnly value={body} />
    </div>
  );
}

function App() {
  const [config, setConfig] = useState({ phone: '', whatsapp: '', email: '', cancellation: { freeHrs: 6, midHrs: 2, midPct: 20, lowPct: 80 } });
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [category, setCategory] = useState('all');
  const [trip, setTrip] = useState(EMPTY_TRIP);
  const [rental, setRental] = useState(null);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [requestDraft, setRequestDraft] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([api('/config'), api('/vehicles'), api('/routes')])
      .then(([nextConfig, nextVehicles, nextRoutes]) => {
        setConfig(nextConfig);
        setVehicles(nextVehicles);
        setRoutes(nextRoutes);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  useEffect(() => {
    const handleLegacyBookingLink = () => {
      if (!location.hash.startsWith('#/book')) return;
      const params = new URLSearchParams(location.hash.split('?')[1] || '');
      setTrip((current) => ({
        ...current,
        pickup: params.get('from') || current.pickup,
        dropoff: params.get('to') || current.dropoff,
        category: params.get('cat') || current.category
      }));
      setTimeout(() => scrollToSection('book'), 50);
    };
    handleLegacyBookingLink();
    window.addEventListener('hashchange', handleLegacyBookingLink);
    return () => window.removeEventListener('hashchange', handleLegacyBookingLink);
  }, []);

  const visibleVehicles = useMemo(
    () => category === 'all' ? vehicles : vehicles.filter((vehicle) => vehicle.category === category),
    [category, vehicles]
  );

  const setTripField = (field) => (event) => {
    setTrip((current) => ({ ...current, [field]: event.target.value }));
    setRequestDraft(null);
  };

  const requestCab = (event) => {
    event.preventDefault();
    const pickupDateTime = new Date(trip.pickupAt);
    const details = [
      'Service: Chauffeur cab booking',
      `Route: ${trip.pickup.trim()} → ${trip.dropoff.trim()}`,
      `Date: ${pickupDateTime.toLocaleDateString()}`,
      `Time: ${pickupDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      `Passengers: ${trip.passengers}`,
      `Customer name: ${trip.name.trim() || 'Not provided'}`,
      `Trip type: ${trip.tripType}`,
      `Bags: ${trip.luggage || 0}`,
      `Vehicle preference: ${CATEGORIES[trip.category]}`,
      `Instructions: ${trip.notes.trim() || 'None'}`
    ].join('\n');
    setRequestDraft({ subject: 'Cab booking request', body: details });
  };

  const requestRental = (event) => {
    event.preventDefault();
    if (!rental) return;
    setRequestDraft({
      subject: 'Self-drive rental request',
      body: [
        'Hello Bhilai Travel Hub, I would like to request a self-drive rental.',
        '',
        `Name: ${rental.name.trim() || 'Not provided'}`,
        `Vehicle category: ${CATEGORIES[rental.vehicle.category] || 'Vehicle'}`,
        `Pickup date: ${rental.start}`,
        `Return date: ${rental.end}`
      ].join('\n')
    });
  };

  const requestContact = (event) => {
    event.preventDefault();
    setRequestDraft({
      subject: 'Contact request',
      body: [
        'Hello Bhilai Travel Hub, I have a question.',
        '',
        `Name: ${contact.name.trim() || 'Not provided'}`,
        `Reply email: ${contact.email.trim() || 'Not provided'}`,
        `Message: ${contact.message.trim()}`
      ].join('\n')
    });
  };

  const openBooking = (from = '', to = '', vehicleCategory = 'sedan') => {
    setTrip((current) => ({ ...current, pickup: from, dropoff: to, category: vehicleCategory }));
    setRequestDraft(null);
    scrollToSection('book');
  };

  const openAirportBooking = (direction, vehicleCategory) => {
    const airport = 'Swami Vivekananda Airport, Raipur';
    openBooking(
      direction === 'drop' ? 'Durg / Bhilai' : airport,
      direction === 'drop' ? airport : 'Durg / Bhilai',
      vehicleCategory
    );
  };

  const updateContact = (field) => (event) => {
    setContact((current) => ({ ...current, [field]: event.target.value }));
    setRequestDraft(null);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-start">
            <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); scrollToSection('top'); }} aria-label="Bhilai Travel Hub home">
              <img className="brand-logo" src={bhilaiTravelHubLogo} alt="Bhilai Travel Hub, Chhattisgarh" />
            </a>
            <a className="button button-primary header-cta" href="#book" onClick={(event) => { event.preventDefault(); openBooking(); }}>Plan a ride <span aria-hidden="true">↗</span></a>
          </div>
          <button className="menu-toggle" type="button" aria-expanded={mobileMenuOpen} aria-controls="main-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? 'Close menu' : 'Explore sections'}
          </button>
          <nav id="main-navigation" className={`main-nav ${mobileMenuOpen ? 'main-nav-open' : ''}`} aria-label="Main navigation">
            {NAV_ITEMS.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={(event) => { event.preventDefault(); setMobileMenuOpen(false); scrollToSection(id); }}>{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="eyebrow eyebrow-light"><span className="live-dot" /> BHILAI · DURG · RAIPUR</span>
              <h1>Good journeys<br />start <em>right here.</em></h1>
              <p>Local cab rides and self-drive cars, with friendly support from a team that knows the roads.</p>
              <div className="hero-buttons">
                <button className="button button-lime" type="button" onClick={() => openBooking()}>Book a cab <span aria-hidden="true">→</span></button>
                <button className="button button-glass" type="button" onClick={() => scrollToSection('self-drive')}>Explore self-drive</button>
              </div>
              <div className="hero-airport-fares" aria-label="Airport one-way fares">
                <div className="hero-airport-fares-heading">
                  <b>Airport rides · one way</b>
                  <span>Durg / Bhilai ↔ Raipur Airport</span>
                </div>
                <div className="hero-airport-fare-options">
                  {AIRPORT_FARES.map(({ name, fare, category }) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => openAirportBooking('drop', category)}
                      aria-label={`Request airport ride in ${name} for ₹${fare.toLocaleString('en-IN')} one way`}
                    >
                      <span>{name}</span>
                      <b>₹{fare.toLocaleString('en-IN')}</b>
                    </button>
                  ))}
                </div>
                <small>Same fare for airport pickup and drop · Tap a fare to book</small>
              </div>
              <div className="hero-trust"><span>✓ No account needed</span><span>✓ Send your request in WhatsApp</span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-sun" />
              <div className="art-road"><span /></div>
              <div className="art-car"><span /><i /><b /></div>
              <div className="art-label art-label-top">YOUR NEXT RIDE <b>→</b></div>
              <div className="art-label art-label-bottom"><b>BHILAI</b><span>Raipur is closer than you think.</span></div>
            </div>
            <form className="quick-trip" onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              openBooking(fields.get('quickPickup').trim(), fields.get('quickDropoff').trim());
            }}>
              <div className="quick-trip-title"><span className="quick-icon">↗</span><div><b>Where to?</b><small>Get your trip started</small></div></div>
              <label htmlFor="quickPickup">Pickup point</label>
              <input id="quickPickup" name="quickPickup" placeholder="e.g. Bhilai, Sector 6" required />
              <label htmlFor="quickDropoff">Going to</label>
              <input id="quickDropoff" name="quickDropoff" placeholder="e.g. Raipur Airport" required />
              <button className="button button-primary button-wide">Continue to trip details <span aria-hidden="true">→</span></button>
            </form>
          </div>
          <div className="hero-bottom"><span>LOCAL KNOW-HOW</span><span>COMFORTABLE RIDES</span><span>PERSONAL SUPPORT</span></div>
        </section>

        <div className="page-content">
          {loadError && <Notice tone="error">We couldn’t load some trip information: {loadError}. Refresh the page to try again.</Notice>}

          <section className="service-strip" id="services">
            <SectionHeading eyebrow="TRAVEL YOUR WAY" title="Everything for the road ahead" description="Choose a service to jump straight to the details." />
            <div className="service-grid">
              <button className="service-tile" onClick={() => openBooking()}><span className="service-icon">↗</span><b>Book a cab</b><small>Local, airport &amp; outstation</small><span className="tile-arrow">Explore →</span></button>
              <button className="service-tile" onClick={() => scrollToSection('self-drive')}><span className="service-icon service-icon-lime">▣</span><b>Self-drive cars</b><small>Choose dates and a vehicle</small><span className="tile-arrow">Explore →</span></button>
              <button className="service-tile" onClick={() => scrollToSection('fleet')}><span className="service-icon service-icon-peach">◈</span><b>Find your vehicle</b><small>Compare the available fleet</small><span className="tile-arrow">Explore →</span></button>
              <button className="service-tile" onClick={() => scrollToSection('routes')}><span className="service-icon service-icon-blue">⌁</span><b>Popular routes</b><small>See common journeys</small><span className="tile-arrow">Explore →</span></button>
            </div>
          </section>

          <section className="booking-section section-block" id="book">
            <div className="booking-intro">
              <span className="eyebrow">01 / CAB BOOKING</span>
              <h2>Tell us about your trip.</h2>
              <p>Share the details and send your request directly to the travel desk in WhatsApp.</p>
              <div className="booking-promise"><span>01</span><div><b>Choose your journey</b><small>Pickup, drop-off and timing</small></div></div>
              <div className="booking-promise"><span>02</span><div><b>Review your WhatsApp message</b><small>Nothing is sent without your approval</small></div></div>
              <div className="booking-promise"><span>03</span><div><b>Get a confirmation</b><small>The travel desk replies in WhatsApp</small></div></div>
            </div>
            <form className="form-card" onSubmit={requestCab}>
              <div className="form-card-heading"><div><span className="eyebrow">CAB REQUEST</span><h3>Trip details</h3></div><span className="step-pill">Step 1 of 1</span></div>
              <div className="form-grid">
                <div className="field"><label htmlFor="pickup">Pickup location</label><input id="pickup" autoComplete="street-address" placeholder="e.g. Bhilai, Sector 6" value={trip.pickup} onChange={setTripField('pickup')} required /></div>
                <div className="field"><label htmlFor="dropoff">Drop-off location</label><input id="dropoff" autoComplete="street-address" placeholder="e.g. Raipur Airport" value={trip.dropoff} onChange={setTripField('dropoff')} required /></div>
                <div className="field"><label htmlFor="pickupAt">Pickup date &amp; time</label><input id="pickupAt" type="datetime-local" min={localDateTimeMin()} value={trip.pickupAt} onChange={setTripField('pickupAt')} required /></div>
                <div className="field"><label htmlFor="tripType">Trip type</label><select id="tripType" value={trip.tripType} onChange={setTripField('tripType')}><option>One-way</option><option>Round trip</option><option>Local rental</option></select></div>
                <div className="field"><label htmlFor="passengers">Passengers</label><select id="passengers" value={trip.passengers} onChange={setTripField('passengers')}>{[1, 2, 3, 4, 5, 6, 7].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'passenger' : 'passengers'}</option>)}</select></div>
                <div className="field"><label htmlFor="bags">Bags</label><select id="bags" value={trip.luggage} onChange={setTripField('luggage')}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'bag' : 'bags'}</option>)}</select></div>
                <div className="field"><label htmlFor="vehiclePreference">Vehicle preference</label><select id="vehiclePreference" value={trip.category} onChange={setTripField('category')}>{Object.entries(CATEGORIES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>
                <div className="field"><label htmlFor="customerName">Your name <span>(optional)</span></label><input id="customerName" autoComplete="name" value={trip.name} onChange={setTripField('name')} /></div>
                <div className="field field-full"><label htmlFor="tripNotes">Extra details <span>(optional)</span></label><textarea id="tripNotes" rows="3" placeholder="Stops, luggage or anything else we should know" value={trip.notes} onChange={setTripField('notes')} /></div>
              </div>
              <div className="form-footer"><p>Fare and availability are confirmed by the travel desk. No payment is taken here.</p><button className="button button-primary">Continue to WhatsApp <span aria-hidden="true">→</span></button></div>
              {requestDraft?.subject === 'Cab booking request' && <RequestDraft config={config} {...requestDraft} />}
            </form>
          </section>

          <section className="section-block" id="self-drive">
            <SectionHeading eyebrow="02 / SELF-DRIVE" title="Take the wheel." description="Pick a car and dates. We’ll confirm availability and pricing in WhatsApp." />
            <div className="vehicle-grid">
              {vehicles.filter((vehicle) => vehicle.self_drive).map((vehicle, index) => (
                <article className={`vehicle-card ${rental?.vehicle.id === vehicle.id ? 'vehicle-card-active' : ''}`} key={vehicle.id}>
                  <VehiclePhoto category={vehicle.category} className={`vehicle-art vehicle-art-${index % 3}`} />
                  <div className="vehicle-card-body"><h3>{CATEGORIES[vehicle.category] || 'Vehicle'}</h3><p>{vehicle.seats} seats{vehicle.transmission ? ` · ${vehicle.transmission}` : ''}{vehicle.fuel ? ` · ${vehicle.fuel}` : ''}</p><p className="vehicle-note">{vehicle.notes || 'Ask us about availability and features.'}</p>                  <div className="vehicle-card-footer"><b>{vehicle.daily_rate ? `₹${vehicle.daily_rate}/day` : 'Rate on request'}</b><button className="button button-secondary button-small" onClick={() => { setRental({ vehicle, start: '', end: '', name: '' }); setRequestDraft(null); setTimeout(() => scrollToSection('rental-request'), 30); }}>Choose {CATEGORIES[vehicle.category] || 'vehicle'} <span aria-hidden="true">→</span></button></div></div>
                </article>
              ))}
              {vehicles.length === 0 && !loadError && <p className="empty-state">Loading cars…</p>}
            </div>
            {rental && <form className="form-card rental-card" id="rental-request" onSubmit={requestRental}>
              <div className="form-card-heading"><div><span className="eyebrow">RENTAL REQUEST</span><h3>{CATEGORIES[rental.vehicle.category] || 'Vehicle'}</h3></div><button className="text-button" type="button" onClick={() => { setRental(null); setRequestDraft(null); }}>Close</button></div>
              <div className="form-grid">
                <div className="field"><label htmlFor="rentalStart">Pickup date</label><input id="rentalStart" type="date" min={new Date().toISOString().slice(0, 10)} value={rental.start} onChange={(event) => { setRental((value) => ({ ...value, start: event.target.value, end: value.end < event.target.value ? event.target.value : value.end })); setRequestDraft(null); }} required /></div>
                <div className="field"><label htmlFor="rentalEnd">Return date</label><input id="rentalEnd" type="date" min={rental.start || new Date().toISOString().slice(0, 10)} value={rental.end} onChange={(event) => { setRental((value) => ({ ...value, end: event.target.value })); setRequestDraft(null); }} required /></div>
                <div className="field"><label htmlFor="renterName">Your name <span>(optional)</span></label><input id="renterName" autoComplete="name" value={rental.name} onChange={(event) => { setRental((value) => ({ ...value, name: event.target.value })); setRequestDraft(null); }} /></div>
              </div>
              <div className="form-footer"><p>Valid Indian driving licence and Aadhaar required at handover.</p><button className="button button-primary">Prepare WhatsApp request <span aria-hidden="true">→</span></button></div>
              {requestDraft?.subject === 'Self-drive rental request' && <RequestDraft config={config} {...requestDraft} />}
            </form>}
          </section>

          <section className="section-block" id="fleet">
            <SectionHeading eyebrow="03 / OUR FLEET" title="A good fit for every trip." description="Filter the fleet and choose what works for your journey."
              action={<select className="filter-select" aria-label="Filter vehicles by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All vehicles</option>{Object.keys(CATEGORIES).map((key) => <option key={key} value={key}>{CATEGORIES[key]}</option>)}</select>} />
            <div className="fleet-grid">
              {visibleVehicles.map((vehicle) => (
                <article className="fleet-card" key={vehicle.id}>
                  <VehiclePhoto category={vehicle.category} className="fleet-photo" />
                  <div className="fleet-card-content">
                    <div className="fleet-card-top"><span className="category-pill">{vehicle.seats} seats</span><span className={`availability ${vehicle.available ? 'available' : 'unavailable'}`}><i />{vehicle.available ? 'Available' : 'Check availability'}</span></div>
                    <h3>{CATEGORIES[vehicle.category] || 'Vehicle'}</h3><p>{vehicle.transmission || 'Comfortable ride'}{vehicle.fuel ? ` · ${vehicle.fuel}` : ''}</p><p className="vehicle-note">{vehicle.notes || 'Comfortable travel for your next journey.'}</p>
                    <div className="fleet-card-bottom"><b>{vehicle.daily_rate ? `₹${vehicle.daily_rate}/day` : 'Rate on request'}</b><button className="text-button" onClick={() => vehicle.self_drive ? (setRental({ vehicle, start: '', end: '', name: '' }), scrollToSection('self-drive')) : openBooking('', '', vehicle.category)}>Select {CATEGORIES[vehicle.category] || 'vehicle'} →</button></div>
                  </div>
                </article>
              ))}
              {visibleVehicles.length === 0 && !loadError && <p className="empty-state">Loading vehicles…</p>}
            </div>
          </section>

          <section className="routes-section section-block" id="routes">
            <div className="routes-heading">
              <div><span className="eyebrow">TRANSPARENT PRICING</span><h2>Popular Regional Express Routes</h2></div>
              <p>Choose a route to add it to your booking request.</p>
            </div>
            <div className="route-grid">
              {routes.map((route, index) => (
                <article className={`route-card route-card-${route.slug}`} key={route.id || route.label}>
                  <span className="eyebrow">{route.tag}</span>
                  <h3>{route.slug === 'airport' ? 'Bhilai / Raipur ⇄ Airport (RPR)' : route.label}</h3>
                  <p>{route.slug === 'airport' ? `Express Terminal Drop · ${route.duration}` : route.slug === 'raipur-bhilai' ? `Direct Highway Express · ${route.duration}` : `Intercity Outstation · ${route.duration}`}</p>
                  <div className="route-card-info">
                    <strong>{route.slug === 'airport' ? 'One-way fares by segment' : 'Billed as per Govt RTO Meter Tariff'}</strong>
                    {route.slug === 'airport' ? (
                      <>
                        <div className="route-airport-fares">
                          {AIRPORT_FARES.map(({ name, fare }) => <span key={name}>{name} <b>₹{fare.toLocaleString('en-IN')}</b></span>)}
                        </div>
                        <small>Same one-way fares for airport pickup and drop</small>
                      </>
                    ) : (
                      <small>{route.slug === 'raipur-bhilai' ? 'Zero Hidden Charges · Instant Dispatch' : 'All tolls & permits handled · Verified chauffeurs'}</small>
                    )}
                  </div>
                  <div className="route-card-actions">
                    {route.slug === 'airport' ? (
                      <>
                        <button type="button" onClick={() => openAirportBooking('drop', 'sedan')}>Airport drop <span aria-hidden="true">→</span></button>
                        <button type="button" onClick={() => openAirportBooking('pickup', 'sedan')}>Airport pickup <span aria-hidden="true">→</span></button>
                      </>
                    ) : (
                      <button type="button" onClick={() => openBooking(route.pickup, route.dropoff)}>Book this route <span aria-hidden="true">→</span></button>
                    )}
                  </div>
                </article>
              ))}
              {routes.length === 0 && !loadError && <p className="empty-state">Loading popular routes…</p>}
            </div>
          </section>

          <section className="policy-faq-stack section-block">
            <section id="policy" className="policy-section" aria-labelledby="policyTitle">
              <header className="policy-heading">
                <span className="eyebrow">CLEAR &amp; FAIR TERMS</span>
                <h2 id="policyTitle">Booking Cancellation Policy</h2>
                <p>Cancellation charges, refund guidance, and customer responsibilities for Bhilai Travel Hub rides.</p>
              </header>
              <div className="policy-card">
                <div className="policy-tier-grid">
                  <article className="policy-tier policy-tier-free">
                    <span className="policy-tier-label"><i aria-hidden="true">✓</i> 1. Advance cancellation</span>
                    <b>No cancellation fee</b>
                    <p>Cancel at least {config.cancellation.freeHrs} hours before pickup to avoid a cancellation fee.</p>
                  </article>
                  <article className="policy-tier policy-tier-mid">
                    <span className="policy-tier-label"><i aria-hidden="true">◷</i> 2. {config.cancellation.midHrs} to {config.cancellation.freeHrs} hours prior</span>
                    <b>{config.cancellation.midPct}% fee</b>
                    <p>Cancellations in this window are subject to the applicable fee on the booking amount.</p>
                  </article>
                  <article className="policy-tier policy-tier-late">
                    <span className="policy-tier-label"><i aria-hidden="true">!</i> 3. Under {config.cancellation.midHrs} hours prior</span>
                    <b>{config.cancellation.lowPct}% fee</b>
                    <p>Late cancellations are subject to the stated fee. Contact the travel desk as soon as possible.</p>
                  </article>
                </div>
                <div className="policy-guidance-grid">
                  <article className="policy-guidance">
                    <span className="policy-guidance-icon policy-guidance-refund" aria-hidden="true">↻</span>
                    <div><b>4. Refund processing</b><p>The travel desk will confirm refund eligibility and timelines. This website does not process payments or refunds.</p></div>
                  </article>
                  <article className="policy-guidance">
                    <span className="policy-guidance-icon policy-guidance-customer" aria-hidden="true">✦</span>
                    <div><b>5. Customer responsibility</b><p>Please share accurate trip details and notify the travel desk early about changes so your driver can be updated.</p></div>
                  </article>
                </div>
              </div>
            </section>
            <section id="faq" className="faq-section" aria-labelledby="faqTitle">
              <header className="faq-heading">
                <span className="eyebrow">GOT QUESTIONS?</span>
                <h2 id="faqTitle">Frequently Asked Questions</h2>
              </header>
              <div className="faq-list">
                <details><summary>What are the cancellation charges if I change plans?</summary><p>There is no cancellation fee at least {config.cancellation.freeHrs} hours before pickup. Between {config.cancellation.midHrs} and {config.cancellation.freeHrs} hours, the fee is {config.cancellation.midPct}%; under {config.cancellation.midHrs} hours, it is {config.cancellation.lowPct}%. Contact the travel desk to discuss any eligible refund.</p></details>
                <details><summary>How does self-drive car rental work in Bhilai?</summary><p>Choose a vehicle and dates in the Self-drive section, then send a request for availability and pricing. A valid Indian driving licence and Aadhaar are required at handover.</p></details>
                <details><summary>Are toll taxes and GST included in the taxi fare?</summary><p>Airport one-way fares are shown by vehicle on this page. For other trips, ask the travel desk to confirm fare details, including any applicable tolls or taxes, before you book.</p></details>
                <details><summary>When is my ride booking confirmed?</summary><p>Your ride is confirmed only after the travel desk checks availability and replies to you. Sending a WhatsApp request alone does not confirm the booking.</p></details>
              </div>
            </section>
          </section>

          <section className="contact-section section-block" id="contact">
            <div className="contact-copy"><span className="eyebrow eyebrow-light">07 / CONTACT</span><h2>Let’s get you moving.</h2><p>Have a question or a special request? Send the team a note and they’ll get back to you.</p><a href={`tel:${config.phone.replace(/\s/g, '')}`}>Call the travel desk <b>{config.phone}</b></a>{config.email && <span className="contact-email">Booking inbox: {config.email}</span>}</div>
            <form className="contact-card" onSubmit={requestContact}>
              <div className="form-grid">
                <div className="field"><label htmlFor="contactName">Your name</label><input id="contactName" value={contact.name} onChange={updateContact('name')} autoComplete="name" placeholder="Name (optional)" /></div>
                <div className="field"><label htmlFor="contactEmail">Your email</label><input id="contactEmail" type="email" value={contact.email} onChange={updateContact('email')} autoComplete="email" placeholder="you@example.com" /></div>
                <div className="field field-full"><label htmlFor="contactMessage">How can we help?</label><textarea id="contactMessage" rows="4" value={contact.message} onChange={updateContact('message')} required placeholder="Write your question or request…" /></div>
              </div>
              <button className="button button-primary">Continue to WhatsApp <span aria-hidden="true">→</span></button>
              {requestDraft?.subject === 'Contact request' && <RequestDraft config={config} {...requestDraft} />}
            </form>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><a className="brand brand-footer" href="#top" onClick={(event) => { event.preventDefault(); scrollToSection('top'); }} aria-label="Bhilai Travel Hub home"><img className="brand-logo" src={bhilaiTravelHubLogo} alt="Bhilai Travel Hub, Chhattisgarh" /></a><p>Local rides and self-drive rentals across Bhilai, Durg and Raipur.</p><div className="footer-links">{NAV_ITEMS.map(([id, label]) => <button key={id} onClick={() => scrollToSection(id)}>{label}</button>)}</div></div>
        <div className="footer-bottom"><span>© 2026 Bhilai Travel Hub</span><span>Made for the roads around home.</span></div>
      </footer>
      <BookingAssistant config={config} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
