(() => {
  const categories = document.querySelector('#products');
  const gallery = categories.querySelector('.product-gallery');
  const panel = gallery.parentElement;
  const masthead = document.querySelector('.masthead');
  const catalog = panel.querySelector('.portfolio-catalog');
  const slides = [...gallery.querySelectorAll('.category-lineup > li')];
  const cards = slides.map(slide => slide.querySelector('button'));
  const strip = gallery.querySelector('.category-strip');
  const controls = gallery.querySelector('.gallery-controls');
  const dots = controls.querySelector('.gallery-dots');
  const playback = controls.querySelector('.gallery-playback');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const count = cards.length;
  const duration = 8000;
  let position = 0;
  let visible = false;
  let paused = reducedMotion.matches;
  let progress;
  let drag;
  let scrollStep = 0;
  let scrollTravel = 0;
  let pinTop = 0;
  let pinProgress = 0;
  let pinBias = 0;
  let edgeDirection = 0;
  let edgeTimer;

  function wrap(value, length) {
    return ((value % length) + length) % length;
  }

  function distance(index, center, length) {
    const half = Math.floor(length / 2);
    return wrap(index - center + half, length) - half;
  }

  const dotButtons = cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-dot';
    button.setAttribute('aria-label', 'Show ' + card.querySelector('.category-name').textContent);
    const track = document.createElement('span');
    track.append(document.createElement('i'));
    button.append(track);
    dots.append(button);
    button.addEventListener('click', () => select(position + distance(index, position, count)));
    card.addEventListener('click', () => {
      const offset = distance(index, position, count);
      if (offset) select(position + offset);
    });
    return button;
  });

  // Extra positions keep the compact row filled while it crosses the loop boundary.
  const thumbnails = Array.from({length: count * 3}, (_, slot) => {
    const index = slot % count;
    const card = cards[index];
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'category-thumb ' + [...card.classList].find(name => name !== 'category-card');
    tile.setAttribute('aria-controls', 'category-lineup');
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.loading = 'lazy';
    img.src = card.querySelector('img').dataset.packshot;
    const label = document.createElement('span');
    label.textContent = card.querySelector('.category-name').textContent;
    tile.append(img, label);
    strip.append(tile);
    tile.addEventListener('click', () => select(position + distance(index, position, count)));
    return tile;
  });

  function place(tile, slot) {
    const old = tile.style.getPropertyValue('--slot');
    // A tile wrapping from one offscreen edge to the other must jump directly.
    tile.classList.toggle('gallery-tile-animate', old !== '' && Math.abs(Number(old) - slot) <= Math.floor(count / 2));
    tile.style.setProperty('--slot', slot);
  }

  function updatePlayback() {
    playback.classList.toggle('is-paused', paused);
    playback.setAttribute('aria-label', paused ? 'Play category slideshow' : 'Pause category slideshow');
    if (!progress) return;
    if (!scrollTravel && !paused && visible && !document.hidden && !drag && !edgeDirection) progress.play();
    else progress.pause();
  }

  function render(next) {
    position = next;
    const current = wrap(position, count);
    slides.forEach((slide, i) => {
      place(slide, distance(i, position, count));
      slide.classList.toggle('is-current', i === current);
      cards[i].setAttribute('aria-current', String(i === current));
      cards[i].tabIndex = i === current ? 0 : -1;
      dotButtons[i].setAttribute('aria-current', String(i === current));
    });
    thumbnails.forEach((tile, i) => {
      const slot = distance(i, position, thumbnails.length);
      place(tile, slot);
      tile.setAttribute('aria-current', String(slot === 0));
      tile.tabIndex = slot === 0 ? 0 : -1;
      tile.setAttribute('aria-hidden', String(Math.abs(slot) > Math.floor(count / 2)));
    });
    progress?.cancel();
    progress = dotButtons[current].querySelector('i').animate(
      [{transform:'scaleX(.22)'}, {transform:'scaleX(1)'}],
      {duration, fill:'both'}
    );
    progress.onfinish = () => render(position + 1);
    updatePlayback();
  }

  function select(next) {
    if (!scrollTravel) return render(next);
    const index = wrap(next, count);
    pinBias = 0;
    const start = window.scrollY + categories.getBoundingClientRect().top - pinTop;
    window.scrollTo({top: start + index * scrollStep, behavior: 'instant'});
    syncScroll();
  }

  function finishScroll() {
    if (!scrollTravel) return;
    // Remove only the sticky distance already traversed, preserving the visible content.
    const elapsed = pinTop - categories.getBoundingClientRect().top;
    const top = window.scrollY - Math.max(0, Math.min(scrollTravel, elapsed));
    scrollTravel = 0;
    categories.classList.remove('is-scroll-pinned', 'is-viewing-gallery');
    gallery.style.removeProperty('--scroll-offset');
    window.removeEventListener('scroll', syncScroll);
    window.removeEventListener('resize', measureScroll);
    window.scrollTo({top, behavior: 'instant'});
    window.dispatchEvent(new CustomEvent('scroll-position-adjusted', {detail: window.scrollY}));
    playback.hidden = false;
    updatePlayback();
  }

  function syncScroll() {
    const sectionTop = categories.getBoundingClientRect().top;
    categories.classList.toggle('is-viewing-gallery', sectionTop <= masthead.offsetHeight);
    const elapsed = pinTop - sectionTop;
    pinProgress = Math.max(0, Math.min(count - 1, elapsed / scrollStep));
    const offset = pinProgress + pinBias;
    const index = Math.round(offset);
    if (index !== position) render(index);
    gallery.style.setProperty('--scroll-offset', index - offset);
    if (elapsed >= scrollTravel) finishScroll();
  }

  function measureScroll() {
    const stripBottom = strip.getBoundingClientRect().bottom - panel.getBoundingClientRect().top;
    const navHeight = matchMedia('(max-width: 1100px)').matches ? masthead.querySelector('.navigation').offsetHeight : 0;
    pinTop = Math.min(navHeight, Math.floor(window.innerHeight - stripBottom - 8));
    scrollStep = Math.max(260, Math.min(600, window.innerHeight * .55));
    // Give the final banner a little reading room before the page moves on.
    scrollTravel = Math.round((count - 1 + .35) * scrollStep);
    categories.style.setProperty('--category-pin-top', pinTop + 'px');
    categories.style.setProperty('--category-travel', scrollTravel + 'px');
    syncScroll();
  }

  function stopEdgeHover() {
    if (!edgeDirection) return;
    clearTimeout(edgeTimer);
    edgeDirection = 0;
    updatePlayback();
  }

  function advanceAtEdge() {
    const next = position + edgeDirection;
    if (scrollTravel) {
      // Keep horizontal browsing anchored at the current vertical scroll position.
      pinBias = next - pinProgress;
      gallery.style.setProperty('--scroll-offset', 0);
      gallery.classList.add('is-edge-sliding');
    }
    render(next);
    edgeTimer = setTimeout(advanceAtEdge, 1100);
  }

  for (const row of [slides[0].parentElement, strip]) {
    row.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || event.buttons || drag) return stopEdgeHover();
      const bounds = row.getBoundingClientRect();
      const inset = Math.min(80, bounds.width * .08);
      const direction = event.clientX < bounds.left + inset ? -1 : event.clientX > bounds.right - inset ? 1 : 0;
      if (direction === edgeDirection) return;
      stopEdgeHover();
      if (direction) {
        edgeDirection = direction;
        updatePlayback();
        edgeTimer = setTimeout(advanceAtEdge, 300);
      }
    });
    row.addEventListener('pointerleave', stopEdgeHover);
  }
  window.addEventListener('blur', stopEdgeHover);
  window.addEventListener('scroll', () => {
    stopEdgeHover();
    gallery.classList.remove('is-edge-sliding');
  }, {passive: true});

  gallery.addEventListener('keydown', event => {
    stopEdgeHover();
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    paused = true;
    const index = wrap(position, count);
    const next = {ArrowLeft: position - 1, ArrowRight: position + 1, Home: position - index, End: position + count - 1 - index};
    select(next[event.key]);
    const current = wrap(position, count);
    (dots.contains(event.target) ? dotButtons[current] : cards[current]).focus({preventScroll:true});
  });
  gallery.addEventListener('focusin', event => {
    if (event.target !== playback && event.target.matches(':focus-visible')) {
      paused = true;
      updatePlayback();
    }
  });
  playback.addEventListener('click', () => {
    paused = !paused;
    updatePlayback();
  });

  let suppressClick = false;
  gallery.addEventListener('dragstart', event => event.preventDefault());
  gallery.addEventListener('pointerdown', event => {
    stopEdgeHover();
    if (!event.isPrimary || event.button !== 0 || controls.contains(event.target)) return;
    suppressClick = false;
    const tile = event.target.closest('.category-card, .category-thumb');
    if (!tile) return;
    const gap = parseFloat(getComputedStyle(tile.closest('.category-lineup, .category-strip')).columnGap);
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, step: tile.offsetWidth + gap};
    updatePlayback();
  });
  window.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
    gallery.classList.add('is-dragging');
    gallery.style.setProperty('--drag-offset', Math.max(-1, Math.min(1, dx / drag.step)));
  });
  function releaseDrag() {
    drag = null;
    gallery.classList.remove('is-dragging');
    gallery.style.removeProperty('--drag-offset');
  }
  window.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    releaseDrag();
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick = true;
      select(position + (dx < 0 ? 1 : -1));
    } else updatePlayback();
  });
  gallery.addEventListener('click', event => {
    if (suppressClick && event.detail) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  }, true);
  window.addEventListener('pointercancel', event => {
    if (drag?.id === event.pointerId) { releaseDrag(); updatePlayback(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopEdgeHover();
    updatePlayback();
  });
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    if (paused) finishScroll();
    updatePlayback();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(gallery);
  gallery.classList.add('is-ready');
  strip.hidden = false;
  controls.hidden = false;
  render(0);
  if (!reducedMotion.matches && count > 1 && !catalog.open) {
    categories.classList.add('is-scroll-pinned');
    playback.hidden = true;
    window.addEventListener('scroll', syncScroll, {passive: true});
    window.addEventListener('resize', measureScroll);
    catalog.addEventListener('toggle', () => { if (catalog.open) finishScroll(); });
    measureScroll();
    updatePlayback();
  }
})();
