document.addEventListener('submit', (event) => {
  event.preventDefault();
});

document.querySelectorAll('form').forEach((form) => {
  form.setAttribute('aria-description', 'Form submission is disabled on this staged copy.');
});

const homeSlider = document.querySelector('body.home #slider');

if (homeSlider && !homeSlider.querySelector('.alpha-after-dark')) {
  const hero = document.createElement('section');
  hero.className = 'alpha-after-dark';
  hero.setAttribute('aria-labelledby', 'alpha-after-dark-title');
  hero.innerHTML = `
    <div class="alpha-after-dark__ambient" aria-hidden="true"></div>
    <div class="alpha-after-dark__content">
      <span class="alpha-after-dark__logo-wrap">
        <img class="alpha-after-dark__logo" src="assets/alpha-logo-overlay-hd-v1.png" alt="Alpha Analytical Laboratories, Inc.">
        <span class="alpha-after-dark__flask-shimmer" aria-hidden="true"></span>
      </span>
      <p class="alpha-after-dark__eyebrow">Environmental analytical laboratory</p>
      <h1 id="alpha-after-dark-title">The science is serious.<br><span>The experience doesn't have to be.</span></h1>
      <p class="alpha-after-dark__summary">Total Water Matrix, Sediment and Hazardous Waste Testing and Analyses</p>
      <div class="alpha-after-dark__actions">
        <a class="alpha-after-dark__primary" href="services-listing/">Explore testing services</a>
        <a class="alpha-after-dark__secondary" href="contact-us-alpha-analytical-laboratories-inc/">Contact the laboratory</a>
      </div>
    </div>
    <div class="alpha-after-dark__readout" aria-hidden="true">
      <span>ALPHA // ANALYTICAL</span>
      <span>CALIFORNIA</span>
      <span>LAB SYSTEM ONLINE</span>
    </div>
  `;
  homeSlider.prepend(hero);
  homeSlider.classList.add('alpha-after-dark-enabled');

  const actionRail = document.createElement('nav');
  actionRail.className = 'alpha-action-rail';
  actionRail.setAttribute('aria-label', 'Start here');
  actionRail.innerHTML = `
    <a href="tel:+17074680401">
      <span class="alpha-action-rail__number">01</span>
      <span><strong>Not sure what to test?</strong><small>Call the laboratory</small></span>
    </a>
    <a href="services-listing/">
      <span class="alpha-action-rail__number">02</span>
      <span><strong>Know what you brought?</strong><small>Choose a testing service</small></span>
    </a>
    <a href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;pano=hrSOhWrCACuB3DL7BAOeWw&amp;viewpoint=39.1522388%2C-123.2055537&amp;heading=265.94&amp;pitch=3&amp;fov=75" target="_blank" rel="noopener noreferrer">
      <span class="alpha-action-rail__number">03</span>
      <span><strong>See where science happens</strong><small>Visit the Ukiah laboratory</small></span>
    </a>
    <a href="https://alpha-labs.promium.com/" target="_blank" rel="noopener noreferrer">
      <span class="alpha-action-rail__number">04</span>
      <span><strong>Your data is waiting</strong><small>Open Client Data Access</small></span>
    </a>
  `;
  homeSlider.insertAdjacentElement('afterend', actionRail);
}

const locationRoom = document.querySelector('.alpha-location-room');

if (locationRoom) {
  const locationButtons = [...locationRoom.querySelectorAll('[data-location]')];
  const locationPanels = [...locationRoom.querySelectorAll('[data-location-panel]')];
  const locationPlaceholder = locationRoom.querySelector('[data-location-placeholder]');

  locationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedLocation = button.dataset.location;

      locationButtons.forEach((candidate) => {
        const isSelected = candidate === button;
        candidate.classList.toggle('is-active', isSelected);
        candidate.setAttribute('aria-expanded', String(isSelected));
      });

      locationPanels.forEach((panel) => {
        panel.hidden = panel.dataset.locationPanel !== selectedLocation;
      });

      if (locationPlaceholder) {
        locationPlaceholder.hidden = true;
      }
    });
  });
}
