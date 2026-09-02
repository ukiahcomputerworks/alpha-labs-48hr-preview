const slides = Array.from(document.querySelectorAll('.slide'));
const dots = Array.from(document.querySelectorAll('.slider-dots button'));
let activeSlide = 0;
let timer;

function showSlide(index) {
  activeSlide = index;
  slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === index));
  dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
}

function scheduleNext() {
  window.clearInterval(timer);
  timer = window.setInterval(() => showSlide((activeSlide + 1) % slides.length), 5500);
}

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    showSlide(index);
    scheduleNext();
  });
});

if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) scheduleNext();
