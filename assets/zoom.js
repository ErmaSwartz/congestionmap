// Click-to-zoom on any image inside a .fragment.
// Stays out of the way otherwise; no dependencies.
(function () {
  function ensureModal() {
    if (document.getElementById('zoom-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'zoom-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<button id="zoom-close" type="button" aria-label="Close enlarged view">×</button>' +
      '<div id="zoom-content"><img id="zoom-img" src="" alt=""></div>' +
      '<div id="zoom-hint">Click image to toggle actual size · Esc to close</div>';
    document.body.appendChild(modal);
  }

  function open(src, alt, trigger) {
    ensureModal();
    var modal = document.getElementById('zoom-modal');
    var img = document.getElementById('zoom-img');
    img.src = src;
    img.alt = alt || '';
    img.classList.remove('actual');
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    setTimeout(function () {
      var btn = document.getElementById('zoom-close');
      if (btn) btn.focus();
    }, 0);
  }

  function close() {
    var modal = document.getElementById('zoom-modal');
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var img = document.getElementById('zoom-img');
    if (img) img.classList.remove('actual');
  }

  function bind() {
    document.querySelectorAll('.fragment img').forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        open(img.src, img.alt, img);
      });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(img.src, img.alt, img);
        }
      });
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'zoom-img') {
        e.stopPropagation();
        t.classList.toggle('actual');
        return;
      }
      if (t.id === 'zoom-close') {
        e.stopPropagation();
        close();
        return;
      }
      var modal = document.getElementById('zoom-modal');
      if (modal && modal.classList.contains('visible') && (t === modal || modal.contains(t) === false)) {
        // outside click on backdrop — close
        if (t === modal) close();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
