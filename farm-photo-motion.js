(() => {
  const frames = document.querySelectorAll('.motion-window');
  const intro = document.querySelector('.farm-opening__intro');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frameRequest = 0;

  function paint() {
    frameRequest = 0;
    const height = window.innerHeight;
    if (intro) {
      const bounds = intro.getBoundingClientRect();
      intro.classList.toggle('is-expanded', bounds.top + bounds.height * .5 < height * .88);
    }
    if (reducedMotion.matches) return;

    for (const frame of frames) {
      const bounds = frame.getBoundingClientRect();
      if (bounds.bottom < -80 || bounds.top > height + 80) continue;
      const progress = (height - 2 * bounds.top - bounds.height) / (height + bounds.height);
      const range = Math.min(54, bounds.height * .065);
      const offset = Math.max(-1, Math.min(1, progress)) * range;
      frame.style.setProperty('--photo-y', offset.toFixed(2) + 'px');
    }
  }

  function schedulePaint() {
    if (!frameRequest) frameRequest = requestAnimationFrame(paint);
  }

  addEventListener('scroll', schedulePaint, { passive: true });
  addEventListener('resize', schedulePaint, { passive: true });
  reducedMotion.addEventListener('change', schedulePaint);
  schedulePaint();
})();
