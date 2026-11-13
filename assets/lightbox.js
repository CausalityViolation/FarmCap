/* Farm Capitalist: the screenshot viewer. Without this file every screenshot is simply a link to the large picture. */
(function () {
  'use strict';
  var list = document.querySelector('.shots');
  if (!list) return;
  var links = Array.prototype.slice.call(list.querySelectorAll('a.shot'));
  if (!links.length) return;
  var labels = list.dataset;
  var heading = document.querySelector('.look h2');
  var box, nav, fig, img, cap, count, bClose, bPrev, bNext;
  var idx = 0, opener = null, pushed = false, sx = 0, sy = 0, multi = false;

  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function button(cls, glyph, label) {
    var b = mk('button', cls, glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label || '');
    return b;
  }

  function build() {
    box = mk('div', 'lb');
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', heading ? heading.textContent : 'Screenshots');
    bClose = button('lb-x', '×', labels.close);
    fig = mk('figure', 'lb-fig');
    img = mk('img');
    img.width = 1080;
    img.height = 2160;
    cap = mk('figcaption');
    cap.setAttribute('aria-hidden', 'true');
    fig.appendChild(img);
    fig.appendChild(cap);
    nav = mk('div', 'lb-nav');
    bPrev = button('lb-prev', '‹', labels.prev);
    count = mk('p', 'lb-count');
    count.setAttribute('aria-live', 'polite');
    bNext = button('lb-next', '›', labels.next);
    nav.appendChild(bPrev);
    nav.appendChild(count);
    nav.appendChild(bNext);
    box.appendChild(bClose);
    box.appendChild(fig);
    box.appendChild(nav);
    document.body.appendChild(box);

    bClose.addEventListener('click', close);
    bPrev.addEventListener('click', function () { step(-1); });
    bNext.addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === fig || e.target === nav) close();
    });
    box.addEventListener('touchstart', function (e) {
      multi = e.touches.length > 1;
      var t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (multi) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener('keydown', onKey);
    /* the browser's back button (or the phone's back gesture) closes the viewer instead of leaving the page */
    window.addEventListener('popstate', function () {
      if (box && !box.hidden) { pushed = false; hide(); }
    });
  }

  function render() {
    var a = links[idx], th = a.querySelector('img');
    var text = th ? th.alt : '';
    img.src = a.getAttribute('href');
    img.alt = text;
    cap.textContent = text;
    count.textContent = (idx + 1) + ' / ' + links.length;
    [1, -1].forEach(function (d) {
      var near = links[(idx + d + links.length) % links.length];
      new Image().src = near.getAttribute('href');
    });
  }

  function step(n) {
    idx = (idx + n + links.length) % links.length;
    render();
  }

  function open(i, from) {
    if (!box) build();
    idx = i;
    opener = from;
    render();
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    try { history.pushState({ lb: 1 }, ''); pushed = true; } catch (err) { pushed = false; }
    bClose.focus();
  }

  function hide() {
    box.hidden = true;
    document.documentElement.classList.remove('lb-open');
    if (opener && opener.focus) opener.focus();
    opener = null;
  }

  function close() {
    if (!box || box.hidden) return;
    if (pushed) {
      history.back();
      /* if the browser never answers with popstate, do not leave the viewer stuck */
      setTimeout(function () { if (!box.hidden) { pushed = false; hide(); } }, 400);
    } else {
      hide();
    }
  }

  function onKey(e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'Tab') {
      var f = [bClose, bPrev, bNext], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
  }

  list.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.shot') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(links.indexOf(a), a);
  });
})();
