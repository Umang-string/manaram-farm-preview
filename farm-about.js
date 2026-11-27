// The watch links also work when scripts or modal dialogs are unavailable.
const filmDialog = document.querySelector('.farm-cinema');
if (filmDialog && typeof filmDialog.showModal === 'function') {
  const screen = filmDialog.querySelector('.farm-cinema__screen');
  let opener;
  for (const link of document.querySelectorAll('[data-farm-film]')) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      const player = document.createElement('iframe');
      player.title = 'Manaram Farm corporate film by Karyalaya Films';
      player.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.src = 'https://www.youtube.com/embed/iEz4-kW4Wjw?autoplay=1&playsinline=1';
      screen.replaceChildren(player);
      filmDialog.showModal();
    });
  }
  filmDialog.querySelector('.farm-cinema__close').addEventListener('click', () => filmDialog.close());
  filmDialog.addEventListener('click', event => {
    if (event.target !== filmDialog) return;
    const r = filmDialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) {
      filmDialog.close();
    }
  });
  filmDialog.addEventListener('close', () => {
    screen.replaceChildren();
    opener?.focus({preventScroll: true});
  });
}
