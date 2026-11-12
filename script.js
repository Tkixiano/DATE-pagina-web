const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');
const root = document.documentElement;
const heroVisual = document.querySelector('.hero-visual');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ticking = false;
const updateScrollEffects = () => {
  const scrollY = window.scrollY;
  const maxScroll = root.scrollHeight - window.innerHeight;
  header.classList.toggle('scrolled', scrollY > 16);
  root.style.setProperty('--scroll-progress', maxScroll > 0 ? scrollY / maxScroll : 0);

  if (!reduceMotion && heroVisual) {
    const shift = Math.min(scrollY * .075, 42);
    heroVisual.style.setProperty('--hero-shift', `${shift}px`);
    heroVisual.style.setProperty('--card-shift', `${Math.min(scrollY * .04, 24)}px`);
  }
  ticking = false;
};

const requestScrollUpdate = () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
};
updateScrollEffects();
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });

toggle.addEventListener('click', () => {
  const open = toggle.classList.toggle('active');
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = open ? 'hidden' : '';
});

menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  toggle.classList.remove('active');
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('main > .section').forEach((section, index) => {
  section.classList.add('section-enter');
  if (index === 0) section.classList.add('section-visible');
  else sectionObserver.observe(section);
});

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.step-card, .audience-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--tilt-x', `${y * -3.5}deg`);
      card.style.setProperty('--tilt-y', `${x * 3.5}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
const activeSectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
navSections.forEach(section => activeSectionObserver.observe(section));

document.querySelectorAll('details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('details[open]').forEach(other => {
      if (other !== detail) other.removeAttribute('open');
    });
  });
});

const form = document.querySelector('#lead-form');
form.addEventListener('submit', async event => {
  event.preventDefault();

  const fields = [...form.querySelectorAll('[required]')];
  fields.forEach(field => field.classList.toggle('invalid', !field.checkValidity()));

  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('[type="submit"]');

  if (!form.checkValidity()) {
    status.textContent = 'Revisá los campos para continuar.';
    fields.find(field => !field.checkValidity())?.focus();
    return;
  }

  const name = form.elements.nombre.value.trim().split(' ')[0];
  const formData = new FormData(form);
  const encodedData = new URLSearchParams(formData).toString();

  status.textContent = 'Enviando tus datos...';
  submitButton.disabled = true;

  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodedData
    });

    if (!response.ok) throw new Error('No se pudo guardar el formulario.');

    status.textContent = `Gracias, ${name}. Registramos tu interés en DATE.`;
    form.reset();
    fields.forEach(field => field.classList.remove('invalid'));
  } catch (error) {
    status.textContent = 'No pudimos guardar tus datos. Probá nuevamente en unos segundos.';
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
