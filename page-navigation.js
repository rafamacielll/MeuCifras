(() => {
  const nav = document.getElementById('pageNav');
  const up = document.getElementById('pageUpBtn');
  const down = document.getElementById('pageDownBtn');
  const count = document.getElementById('pageNavCount');
  const desktopScroller = document.querySelector('.scroll');
  if (!nav || !up || !down || !count) return;

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  function metrics(){
    if (isMobile()) {
      const doc = document.scrollingElement || document.documentElement;
      const size = window.innerHeight;
      const top = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
      const max = Math.max(0, scrollHeight - size);
      return {type:'window', size, top, max, scrollHeight};
    }

    const el = desktopScroller;
    const size = el?.clientHeight || window.innerHeight;
    const top = el?.scrollTop || 0;
    const scrollHeight = el?.scrollHeight || size;
    const max = Math.max(0, scrollHeight - size);
    return {type:'element', el, size, top, max, scrollHeight};
  }

  function pageInfo(){
    const m = metrics();
    const total = Math.max(1, Math.ceil(m.scrollHeight / Math.max(1, m.size)));
    const current = Math.min(total, Math.max(1, Math.floor((m.top + m.size * 0.5) / m.size) + 1));
    return {...m, total, current};
  }

  function update(){
    const p = pageInfo();
    count.textContent = `${p.current} / ${p.total}`;
    count.setAttribute('aria-label', `Página ${p.current} de ${p.total}`);
    up.disabled = p.top <= 2;
    down.disabled = p.top >= p.max - 2;
    nav.hidden = p.total <= 1;
  }

  function move(direction){
    const p = pageInfo();
    const target = Math.max(0, Math.min(p.max, p.top + direction * p.size));
    if (p.type === 'window') {
      window.scrollTo({top: target, behavior: 'smooth'});
    } else {
      p.el.scrollTo({top: target, behavior: 'smooth'});
    }
    window.setTimeout(update, 420);
  }

  up.addEventListener('click', () => move(-1));
  down.addEventListener('click', () => move(1));

  if (desktopScroller) desktopScroller.addEventListener('scroll', update, {passive:true});
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => window.setTimeout(update, 250));

  // Atualiza após a cifra/lista mudarem de tamanho.
  const observer = new ResizeObserver(() => update());
  const sheet = document.querySelector('.sheet');
  const songList = document.querySelector('.song-list');
  if (sheet) observer.observe(sheet);
  if (songList) observer.observe(songList);

  update();
})();
