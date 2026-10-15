// A big 4-digit PIN pad. Resolves with the code, 'forgot', or null (cancelled).
// Digits are never read aloud, so siblings can't overhear a secret code.

export function askPin({ title, note = '', color = '#1f2430', expect = null, create = false, forgot = false }) {
  return new Promise((resolve) => {
    let code = '';
    let first = null;
    let msg = title;
    const el = document.createElement('div');
    el.className = 'pin-ov';
    el.style.setProperty('--kid', color);
    document.body.appendChild(el);

    const draw = (shake = false) => {
      el.innerHTML = `
        <div class="pin-sheet ${shake ? 'shake' : ''}">
          ${note ? `<div class="pin-note">${note}</div>` : ''}
          <h2>${msg}</h2>
          <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<span class="${i < code.length ? 'on' : ''}"></span>`).join('')}</div>
          <div class="pin-pad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-pin="${d}">${d}</button>`).join('')}
            <button data-pin="cancel" class="pin-soft">✕</button>
            <button data-pin="0">0</button>
            <button data-pin="back" class="pin-soft">⌫</button>
          </div>
          ${forgot ? '<button class="pin-forgot" data-pin="forgot">Forgot my code</button>' : ''}
        </div>`;
    };

    const done = (value) => { el.remove(); resolve(value); };

    const check = () => {
      if (create) {
        if (first == null) { first = code; code = ''; msg = 'Type it again to check'; return draw(); }
        if (code === first) return done(code);
        first = null; code = ''; msg = "Those didn't match. Make your code again"; return draw(true);
      }
      if (code === expect) return done(code);
      code = ''; msg = 'Not quite. Try again'; draw(true);
    };

    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pin]');
      if (!b) return;
      const p = b.dataset.pin;
      if (p === 'cancel') return done(null);
      if (p === 'forgot') return done('forgot');
      if (p === 'back') { code = code.slice(0, -1); return draw(); }
      if (code.length < 4) code += p;
      draw();
      if (code.length === 4) setTimeout(check, 150);
    });
    draw();
  });
}
