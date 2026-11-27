(() => {
  const awning = document.querySelector('.awning');
  const spotlights = [...awning.querySelectorAll('.awning-spotlight')];
  const hoverInput = matchMedia('(hover: hover)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;

  setInterval(() => {
    if (reducedMotion.matches || document.hidden || awning.closest('.awning-closed') ||
        awning.matches(':focus-within') || (hoverInput.matches && awning.matches(':hover'))) return;
    spotlights[current].hidden = true;
    current = (current + 1) % spotlights.length;
    spotlights[current].hidden = false;
  }, 10_000);
})();
