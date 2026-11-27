(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rotationDelay = 10_000;

  function setupCarousel(slides, { choices, observe, track } = {}) {
    const buttons = choices ? [...choices.querySelectorAll('button')] : [];
    let activeIndex = 0;
    let inView = !observe;
    let rotationTimer;
    let touching = false;

    function selectSlide(index) {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        buttons[slideIndex]?.setAttribute('aria-pressed', String(active));
      });
    }

    function scrollsHorizontally() {
      return track && track.scrollWidth > track.clientWidth;
    }

    function showSlide(index) {
      if (scrollsHorizontally()) {
        track.scrollTo({ left: index * track.clientWidth, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      } else {
        selectSlide(index);
      }
      scheduleRotation();
    }

    function scheduleRotation() {
      window.clearTimeout(rotationTimer);
      if (!inView || touching || reducedMotion.matches || document.hidden) return;

      rotationTimer = window.setTimeout(() => {
        showSlide((activeIndex + 1) % slides.length);
      }, rotationDelay);
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => showSlide(index));
    });
    if (choices) choices.hidden = false;
    if (track) {
      track.classList.add('is-swipeable');
      track.addEventListener('scroll', () => {
        if (!scrollsHorizontally()) return;
        const nearest = Math.round(track.scrollLeft / track.clientWidth);
        const index = Math.max(0, Math.min(nearest, slides.length - 1));
        if (index !== activeIndex) selectSlide(index);
        scheduleRotation();
      }, { passive: true });

      function trackTouches(event) {
        touching = event.touches.length > 0;
        scheduleRotation();
      }
      for (const type of ['touchstart', 'touchend', 'touchcancel']) {
        track.addEventListener(type, trackTouches, { passive: true });
      }
      new ResizeObserver(() => {
        if (scrollsHorizontally()) track.scrollLeft = activeIndex * track.clientWidth;
      }).observe(track);
    }
    if (observe) {
      const visibleThreshold = 0.5;
      new IntersectionObserver(([entry]) => {
        inView = entry.intersectionRatio >= visibleThreshold;
        scheduleRotation();
      }, { threshold: visibleThreshold }).observe(observe);
    }
    reducedMotion.addEventListener('change', scheduleRotation);
    document.addEventListener('visibilitychange', scheduleRotation);
    scheduleRotation();
  }

  const hero = document.querySelector('.hero-carousel');
  setupCarousel(hero.querySelectorAll('.hero'), {
    choices: hero.querySelector('.hero-choices'),
    track: hero.querySelector('.hero-track'),
  });

  const promo = document.querySelector('.promo-pack');
  setupCarousel(promo.querySelectorAll('.promo-slide'), { observe: promo });
})();
