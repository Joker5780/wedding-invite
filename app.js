/* ===== PERSONALIZATION ===== */

let currentGuestCode = 'default';

async function initPersonalization() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('g') || 'default';

  let guests = {};
  try {
    const res = await fetch('guests.json');
    guests = await res.json();
  } catch (e) {
    console.warn('Could not load guests.json', e);
  }

  const guest = guests[code] || guests['default'] || { greeting: 'Дорогие друзья и родные!', type: 'default' };
  currentGuestCode = code;

  // Set greeting text
  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) greetingEl.textContent = guest.greeting;

  // Set hidden form field
  const codeField = document.getElementById('guest_code_field');
  if (codeField) codeField.value = code;

  // Show/hide conditional blocks
  document.querySelectorAll('[data-show-for]').forEach(block => {
    const target = block.getAttribute('data-show-for');
    if (target === guest.type) {
      block.classList.add('visible');
    } else {
      block.classList.remove('visible');
    }
  });
}

/* ===== FLOATING HEARTS ===== */

function createHeart() {
  const container = document.getElementById('hearts-container');
  if (!container) return;

  const heart = document.createElement('span');
  heart.className = 'heart-particle';
  heart.textContent = Math.random() > 0.5 ? '♥' : '♡';
  heart.style.left = Math.random() * 100 + '%';
  heart.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
  heart.style.color = Math.random() > 0.5 ? '#E9CDD0' : '#c49da0';
  const duration = 4 + Math.random() * 5;
  heart.style.animationDuration = duration + 's';
  heart.style.animationDelay = Math.random() * 3 + 's';

  container.appendChild(heart);

  setTimeout(() => heart.remove(), (duration + 3) * 1000);
}

function startHearts() {
  for (let i = 0; i < 6; i++) {
    setTimeout(createHeart, i * 600);
  }
  setInterval(createHeart, 1200);
}

/* ===== SCROLL REVEAL ===== */

function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ===== COUNTDOWN ===== */

function updateCountdown() {
  const target = new Date('2026-09-06T14:00:00+03:00').getTime();
  const now = Date.now();
  const diff = target - now;

  const daysEl    = document.getElementById('cd-days');
  const hoursEl   = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (diff <= 0) {
    if (daysEl)    daysEl.textContent    = '0';
    if (hoursEl)   hoursEl.textContent   = '0';
    if (minutesEl) minutesEl.textContent = '0';
    if (secondsEl) secondsEl.textContent = '0';
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (daysEl)    daysEl.textContent    = days;
  if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

function initCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

/* ===== FORM SUBMISSION ===== */

let formEndpoint = null;

async function loadConfig() {
  try {
    const res = await fetch('config.json');
    const cfg = await res.json();
    if (cfg.formEndpoint && cfg.formEndpoint !== 'ВСТАВЬ_СЮДА_URL_GOOGLE_APPS_SCRIPT') {
      formEndpoint = cfg.formEndpoint;
    }
  } catch (e) {
    // file:// protocol or network error — endpoint stays null
    console.warn('Could not load config.json. If testing locally, run via HTTP server (python3 -m http.server).');
  }
}

function collectCheckboxValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(el => el.value)
    .join(', ');
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function initForm() {
  const form = document.getElementById('rsvp-form');
  const thankYou = document.getElementById('thank-you');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // URLSearchParams → sends as application/x-www-form-urlencoded
    // which is the only format Google Apps Script's e.parameter can parse
    const params = new URLSearchParams({
      guest_code:    currentGuestCode,
      name:          document.getElementById('name').value.trim(),
      attending:     getRadioValue('attending'),
      bus:           getRadioValue('bus'),
      alcohol:       collectCheckboxValues('alcohol'),
      allergies:     document.getElementById('allergies').value.trim(),
      accommodation: getRadioValue('accommodation'),
      message:       (document.getElementById('message') || {}).value || '',
      comment:       document.getElementById('comment').value.trim(),
      submitted_at:  new Date().toISOString(),
    });

    if (formEndpoint) {
      try {
        await fetch(formEndpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      } catch (err) {
        console.warn('Form submit error:', err);
      }
    } else {
      console.info('No formEndpoint — данные (для отладки):', Object.fromEntries(params));
    }

    form.style.display = 'none';
    if (thankYou) thankYou.classList.add('visible');
    thankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ===== INIT ===== */

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();        // load endpoint early; non-blocking
  initPersonalization();
  initScrollReveal();
  initCountdown();
  initForm();
});
