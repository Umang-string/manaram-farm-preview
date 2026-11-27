(() => {
  const intro = document.getElementById('farm');
  if (!intro || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal-in-view');
      reveal.unobserve(entry.target);
    }
  });
  for (const item of intro.children) reveal.observe(item);
})();

(() => {
  const scene = document.querySelector('.harvest-scene');
  const section = scene.parentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let frame;

  function updateParallax() {
    frame = undefined;
    const { top, height } = section.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const pinnedTop = parseFloat(getComputedStyle(scene).top);
    const halfPinDistance = (height - scene.offsetHeight) / 2;
    const progress = Number.isFinite(pinnedTop)
      ? (pinnedTop - halfPinDistance - top) / (halfPinDistance + viewportHeight * .11)
      : (viewportHeight - height - 2 * top) / (viewportHeight + height);
    section.style.setProperty('--harvest-progress', Math.max(-1, Math.min(1, progress)));
  }

  function scheduleUpdate() {
    if (inView && !reducedMotion.matches && frame === undefined) {
      frame = requestAnimationFrame(updateParallax);
    }
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    scheduleUpdate();
  }).observe(section);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = undefined;
      section.style.removeProperty('--harvest-progress');
    } else {
      scheduleUpdate();
    }
  });
})();
