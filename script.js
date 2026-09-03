const DEMO_STORAGE_KEY = 'alpha-labs-48hr-demo-state-v1';
const DEMO_ACTION_PARAM = 'demo-action';
const VALID_DEMO_MODES = new Set(['banner', 'jobs']);

function readDemoModes() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter((mode) => VALID_DEMO_MODES.has(mode)) : []);
  } catch {
    return new Set();
  }
}

function writeDemoModes(modes) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify([...modes]));
}

function consumeDemoAction() {
  const url = new URL(window.location.href);
  const action = url.searchParams.get(DEMO_ACTION_PARAM);
  const modes = readDemoModes();

  if (action === 'reset') {
    modes.clear();
    writeDemoModes(modes);
  } else if (VALID_DEMO_MODES.has(action)) {
    modes.add(action);
    writeDemoModes(modes);
  }

  if (action) {
    url.searchParams.delete(DEMO_ACTION_PARAM);
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  return modes;
}

function stagedCareersUrl() {
  const prefix = window.location.pathname.includes('/alpha-labs-48hr-preview/')
    ? '/alpha-labs-48hr-preview/'
    : '/';
  return `${window.location.origin}${prefix}meeting-staged/careers-lab-tech/index.html`;
}

function initializeForms() {
  document.querySelectorAll('form').forEach((form) => {
    form.setAttribute('aria-description', 'Form submission is disabled on this staged copy.');
  });
}

async function applyStagedCareers() {
  if (!/\/careers\/(?:index\.html)?$/.test(window.location.pathname)) return;

  const response = await fetch(`${stagedCareersUrl()}?v=demo-v1`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load staged Careers page: ${response.status}`);

  const stagedDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
  const stagedContent = stagedDocument.querySelector('.entry-content[data-staged-template="lab-tech-careers"]');
  const activeContent = document.querySelector('.entry-content');
  if (!stagedContent || !activeContent) throw new Error('Staged Careers content is unavailable.');

  activeContent.replaceWith(stagedContent);
  initializeForms();
}

const demoModes = consumeDemoAction();
document.documentElement.classList.toggle('demo-banner', demoModes.has('banner'));

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'lab-tech-application') return;
  if (!form.reportValidity()) return;
  const status = document.getElementById('application-status');
  if (status) {
    status.classList.add('is-visible');
    status.focus();
  }
});

initializeForms();

if (demoModes.has('jobs')) {
  applyStagedCareers().catch((error) => console.error(error));
}
