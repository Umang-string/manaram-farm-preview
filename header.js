(() => {
  const header = document.querySelector('.masthead');
  if (!header || document.querySelector('#farm-mobile-nav')) return;
  const menuButton = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('.main-nav');
  const smallScreen = matchMedia('(max-width: 700px)');

  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }

  menuButton.hidden = false;
  menuButton.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  smallScreen.addEventListener('change', () => setMenu(false));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menuButton.focus();
    }
  });
})();

(() => {
  const mobileNav = document.getElementById('farm-mobile-nav');
  if (!mobileNav) return;

  const header = document.querySelector('.masthead');
  const toggle = header.querySelector('.menu-toggle');
  const mobile = matchMedia('(max-width: 1100px)');
  const links = [...header.querySelectorAll('[data-nav]'), ...mobileNav.querySelectorAll('[data-nav]')];
  let background = [];

  function showMobile(open) {
    document.body.classList.toggle('menu-open', open);
    mobileNav.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open) {
      background = [...document.querySelectorAll('body > main, body > footer, .story-skip, .masthead .awning')].filter(el => !el.inert);
      background.forEach(el => { el.inert = true; });
      mobileNav.querySelector('a').focus({preventScroll: true});
    } else {
      background.forEach(el => { el.inert = false; });
      background = [];
    }
  }

  function resetMenus() {
    const focused = document.activeElement;
    const wasInOverlay = mobileNav.contains(focused) || focused === toggle;
    showMobile(false);
    toggle.hidden = !mobile.matches;
    if (wasInOverlay) {
      if (mobile.matches) toggle.focus({preventScroll: true});
      else {
        const counterpart = links.find(link => header.contains(link) && link.dataset.nav === focused.dataset.nav);
        const destination = counterpart || header.querySelector('.logo');
        destination.focus({preventScroll: true});
      }
    } else if (mobile.matches && focused.closest('.primary-links, .mana-ko-cta')) {
      toggle.focus({preventScroll: true});
    }
  }

  toggle.addEventListener('click', () => {
    const open = mobileNav.inert;
    showMobile(open);
    if (!open) toggle.focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.inert) {
      showMobile(false);
      toggle.focus({preventScroll: true});
    } else if (event.key === 'Tab' && !mobileNav.inert) {
      const controls = [...header.querySelectorAll('a, button'), ...mobileNav.querySelectorAll('a')].filter(el =>
        !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility === 'visible'
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  });

  function followLink(event) {
    const link = event.target.closest('a[href]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = link.getAttribute('href');
    showMobile(false);
    if (target.startsWith('#')) {
      const destination = document.getElementById(target.slice(1));
      if (!destination) return;
      if (!destination.hasAttribute('tabindex')) destination.tabIndex = -1;
      destination.focus({preventScroll: true});
    }
  }
  header.addEventListener('click', followLink);
  mobileNav.addEventListener('click', followLink);

  mobile.addEventListener('change', resetMenus);
  window.addEventListener('pageshow', resetMenus);
  window.addEventListener('hashchange', resetMenus);
  resetMenus();
})();
