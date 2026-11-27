(() => {
  const section = document.querySelector('.farm-facts');
  if (!section) return;

  const track = section.querySelector('.farm-facts__track');
  const cards = Array.from(track.children);
  const controls = section.querySelector('.farm-facts__controls');
  const previous = controls.querySelector('.farm-facts__prev');
  const next = controls.querySelector('.farm-facts__next');
  const counter = controls.querySelector('.farm-facts__count');
  const status = section.querySelector('.farm-facts__status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const choices = cards.map((card, index) => {
    const heading = card.querySelector('h3');
    const choice = document.createElement('button');
    choice.type = 'button';
    choice.className = 'farm-facts__choose';
    choice.textContent = heading.textContent;
    choice.setAttribute('aria-label', 'Select farm fact: ' + heading.textContent);
    choice.addEventListener('click', () => goTo(index));
    heading.replaceChildren(choice);
    return choice;
  });
  let current = 0;
  let scrollTimer;

  function positions() {
    const first = cards[0].offsetLeft;
    const lastStop = track.scrollWidth - track.clientWidth;
    const snapWidth = track.clientWidth - parseFloat(window.getComputedStyle(track).paddingRight);
    return cards.map(card => Math.min(lastStop, Math.max(0,
      card.offsetLeft - first - (snapWidth - card.offsetWidth) / 2
    )));
  }

  function display(index, announce) {
    const changed = index !== current;
    current = index;
    choices.forEach((choice, number) => choice.setAttribute('aria-pressed', String(number === index)));
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    counter.textContent = (index + 1) + ' / ' + cards.length;
    controls.style.setProperty('--facts-progress', (index + 1) / cards.length);
    if (changed && announce) {
      status.textContent = 'Farm fact ' + (index + 1) + ' of ' + cards.length + '. ' + cards[index].querySelector('h3').textContent;
    }
  }

  function goTo(index, instant = false) {
    const bounded = Math.max(0, Math.min(cards.length - 1, index));
    display(bounded, !instant);
    track.scrollTo({left: positions()[bounded], behavior: instant || motion.matches ? 'instant' : 'smooth'});
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const targets = {ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: cards.length - 1};
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    goTo(targets[event.key]);
  });

  track.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const stops = positions();
      const nearest = stops.reduce((best, value, index) =>
        Math.abs(value - track.scrollLeft) < Math.abs(stops[best] - track.scrollLeft) ? index : best, 0);
      display(nearest, true);
    }, 150);
  }, {passive: true});

  section.dataset.ready = '';
  controls.hidden = false;
  display(0, false);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => goTo(current, true)).observe(track);
  }
})();
