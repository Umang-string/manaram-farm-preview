(() => {
  const masthead = document.querySelector('.masthead');
  const awning = masthead.querySelector('.awning');
  const root = document.documentElement;
  const scrollThreshold = 12;
  let previousPosition = Math.max(0, window.scrollY);

  function measureHeader() {
    root.style.setProperty('--awning-height', awning.offsetHeight + 'px');
    root.style.setProperty('--masthead-height', masthead.offsetHeight + 'px');
  }

  function updateAwning() {
    const position = Math.max(0, window.scrollY);
    const travel = position - previousPosition;

    if (position <= scrollThreshold) {
      masthead.classList.remove('awning-closed');
    } else if (Math.abs(travel) >= scrollThreshold) {
      masthead.classList.toggle('awning-closed', travel > 0);
    } else {
      return;
    }

    previousPosition = position;
  }

  measureHeader();
  updateAwning();
  new ResizeObserver(measureHeader).observe(masthead);
  window.addEventListener('scroll', updateAwning, { passive: true });
  window.addEventListener('pageshow', updateAwning);
  window.addEventListener('scroll-position-adjusted', (event) => {
    previousPosition = Math.max(0, event.detail);
  });
})();
