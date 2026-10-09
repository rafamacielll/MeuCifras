(() => {
  const nav = document.getElementById('pageNav');
  const up = document.getElementById('pageUpBtn');
  const down = document.getElementById('pageDownBtn');
  const count = document.getElementById('pageNavCount');
  const desktopScroller = document.querySelector('.scroll');
  const chordArea = document.getElementById('sheetBody');
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

  // Mantém cerca de 3 linhas visíveis entre uma "página" e a próxima.
  // Isso ajuda a pessoa a se situar durante a leitura da cifra.
  function overlapPx(){
    if (chordArea) {
      const style = getComputedStyle(chordArea);
      const lineHeight = parseFloat(style.lineHeight);
      if (Number.isFinite(lineHeight) && lineHeight > 0) {
        return Math.round(lineHeight * 3);
      }
    }
    return isMobile() ? 78 : 86;
  }

  function stepSize(m){
    const overlap = Math.min(overlapPx(), Math.max(40, m.size * 0.24));
    return Math.max(120, m.size - overlap);
  }

  function pageInfo(){
    const m = metrics();
    const step = stepSize(m);
    const total = Math.max(1, Math.ceil(Math.max(0, m.scrollHeight - m.size) / step) + 1);
    const current = Math.min(total, Math.max(1, Math.round(m.top / step) + 1));
    return {...m, step, total, current};
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
    const target = Math.max(0, Math.min(p.max, p.top + direction * p.step));

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

  const observer = new ResizeObserver(() => update());
  const sheet = document.querySelector('.sheet');
  const songList = document.querySelector('.song-list');
  if (sheet) observer.observe(sheet);
  if (songList) observer.observe(songList);
  if (chordArea) observer.observe(chordArea);

  update();
})();
