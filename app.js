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

const REVEAL_STAGGER_MS = 60;
const REVEAL_SCROLL_IN = 0.10; // доля высоты экрана — элемент чуть глубже центра экрана

function getRevealOffsetPx() {
  return Math.round(window.innerHeight * REVEAL_SCROLL_IN);
}

function isVisibleOnLoad(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function activateVisibleReveals(reveals, groups) {
  reveals.forEach(el => {
    if (el.classList.contains('in-view')) return;
    if (el.closest('.reveal-group')) return;
    if (isVisibleOnLoad(el)) activateReveal(el);
  });

  groups.forEach(group => {
    const pending = group.querySelectorAll('.reveal:not(.in-view)');
    if (!pending.length) return;
    if (isVisibleOnLoad(group)) pending.forEach(activateReveal);
  });
}

function activateReveal(el) {
  el.classList.add('in-view');
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const groups = document.querySelectorAll('.reveal-group');

  document.documentElement.style.setProperty('--reveal-stagger-ms', `${REVEAL_STAGGER_MS}ms`);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(activateReveal);
    return;
  }

  groups.forEach(group => {
    group.querySelectorAll('.reveal').forEach((el, index) => {
      el.style.setProperty('--reveal-delay', index);
    });
  });

  const revealRootMargin = `0px 0px -${getRevealOffsetPx()}px 0px`;

  const observerOptions = {
    threshold: 0,
    rootMargin: revealRootMargin,
  };

  const itemObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      activateReveal(entry.target);
      itemObserver.unobserve(entry.target);
    });
  }, observerOptions);

  const groupObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const group = entry.target;
      group.querySelectorAll('.reveal').forEach(activateReveal);
      groupObserver.unobserve(group);
    });
  }, observerOptions);

  groups.forEach(group => groupObserver.observe(group));

  reveals.forEach(el => {
    if (el.closest('.reveal-group')) return;
    itemObserver.observe(el);
  });

  activateVisibleReveals(reveals, groups);
  window.addEventListener('load', () => activateVisibleReveals(reveals, groups));
}

/* ===== COUNTDOWN ===== */

function pluralRu(n, one, few, many) {
  const mod100 = n % 100;
  const mod10 = mod100 % 10;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function setCountdownLabel(numEl, value, one, few, many) {
  const labelEl = numEl?.nextElementSibling;
  if (labelEl) labelEl.textContent = pluralRu(value, one, few, many);
}

function updateCountdown() {
  // 6 сентября 2026, 14:00 по Москве (UTC+3)
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
    setCountdownLabel(daysEl,    0, 'день',   'дня',   'дней');
    setCountdownLabel(hoursEl,   0, 'час',    'часа',  'часов');
    setCountdownLabel(minutesEl, 0, 'минуту', 'минуты','минут');
    setCountdownLabel(secondsEl, 0, 'секунду','секунды','секунд');
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

  setCountdownLabel(daysEl,    days,    'день',   'дня',   'дней');
  setCountdownLabel(hoursEl,   hours,   'час',    'часа',  'часов');
  setCountdownLabel(minutesEl, minutes, 'минуту', 'минуты','минут');
  setCountdownLabel(secondsEl, seconds, 'секунду','секунды','секунд');
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

const THANK_YOU_MESSAGES = {
  'конечно, да': {
    title: 'Спасибо! Ждём вас!',
    body: 'Мы очень рады, что вы будете рядом в этот день',
  },
  'к сожалению, нет': {
    title: 'Спасибо, что ответили!',
    body: 'Нам очень жаль, что вы не сможете быть с нами в этот день. Сообщите, если что-то поменяется',
  },
};

function showThankYou(form, thankYou, attending) {
  form.style.display = 'none';
  if (thankYou) {
    const messages = THANK_YOU_MESSAGES[attending] || THANK_YOU_MESSAGES['конечно, да'];
    const titleEl = thankYou.querySelector('.thank-you-title');
    const bodyEl = thankYou.querySelector('.thank-you-body');
    if (titleEl) titleEl.textContent = messages.title;
    if (bodyEl) bodyEl.textContent = messages.body;
    thankYou.classList.add('visible');
  }
  thankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function sendFormInBackground(params) {
  if (!formEndpoint) {
    console.info('No formEndpoint — данные (для отладки):', Object.fromEntries(params));
    return;
  }

  fetch(formEndpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  }).catch(err => {
    console.warn('Form submit error:', err);
  });
}

function initForm() {
  const form = document.getElementById('rsvp-form');
  const thankYou = document.getElementById('thank-you');
  const submitBtn = form?.querySelector('.btn-submit');
  if (!form) return;

  let isSubmitting = false;

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем...';
      submitBtn.classList.add('is-submitting');
    }

    const params = new URLSearchParams({
      guest_code:    currentGuestCode,
      name:          document.getElementById('name').value.trim(),
      attending:     getRadioValue('attending'),
      alcohol:       collectCheckboxValues('alcohol'),
      allergies:     document.getElementById('allergies').value.trim(),
      bus_to:        getRadioValue('bus_to'),
      bus_back:      getRadioValue('bus_back'),
      wishes:        document.getElementById('wishes-field').value.trim(),
      submitted_at:  new Date().toISOString(),
    });

    showThankYou(form, thankYou, getRadioValue('attending'));
    sendFormInBackground(params);
  });
}

/* ===== DRESSCODE CAROUSEL ===== */

function initDresscodeCarousel() {
  const carousel = document.querySelector('.dresscode-carousel');
  if (!carousel) return;

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  carousel.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    carousel.classList.add('is-dragging');
    startX = e.pageX;
    scrollLeft = carousel.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    carousel.classList.remove('is-dragging');
  });

  carousel.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    carousel.scrollLeft = scrollLeft - (e.pageX - startX);
  });

  carousel.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    carousel.scrollLeft += e.deltaY;
  }, { passive: false });
}

/* ===== INIT ===== */

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();        // load endpoint early; non-blocking
  initPersonalization();
  initScrollReveal();
  initCountdown();
  initForm();
  initDresscodeCarousel();
});
