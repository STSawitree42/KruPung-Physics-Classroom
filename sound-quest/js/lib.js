/* =========================================================
   Shared helpers (DOM, math, number parsing, canvas)
   ========================================================= */
(function (SQ) {
  'use strict';
  const lib = SQ.lib = {};

  lib.$ = (s, r = document) => r.querySelector(s);
  lib.$$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Safe element builder: text is always set via textContent */
  lib.h = function (tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;               // only used with static, trusted markup
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  };

  lib.shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  lib.pick = a => a[Math.floor(Math.random() * a.length)];
  lib.rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  lib.clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  lib.sup = n => String(n).split('').map(c => SUP[c] || c).join('');
  lib.sig = (x, p = 3) => Number(Number(x).toPrecision(p));
  /* Format a number: 3 significant figures, scientific notation for very small/large values */
  lib.fmt = function (x, p = 3) {
    if (!isFinite(x)) return String(x);
    const ax = Math.abs(x);
    if (ax !== 0 && (ax < 0.001 || ax >= 1e6)) {
      let e = Math.floor(Math.log10(ax)); let m = lib.sig(x / Math.pow(10, e), p);
      if (Math.abs(m) >= 10) { m = lib.sig(m / 10, p); e++; }
      return (m === 1 ? '' : m + ' × ') + '10' + lib.sup(e);
    }
    return lib.sig(x, p).toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  /* Parse what a student types: 340, 3.4e2, 1,047, 2×10^-3, 2x10-3, 10^-4, 0,5 (decimal comma) */
  lib.parseNum = function (str) {
    if (str == null) return NaN;
    let s = String(str).trim().replace(/\s+/g, '').replace(/[−–—]/g, '-');
    if (!s) return NaN;
    if (/^-?\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');           // 0,5 → 0.5
    s = s.replace(/,/g, '');                                           // 1,047 → 1047
    s = s.replace(/\^\(?\s*([+-]?\d+)\s*\)?/g, '^$1');
    let m = s.match(/^([+-]?\d*\.?\d+)[×xX*·]10\^?([+-]?\d+)$/);
    if (m) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
    m = s.match(/^10\^([+-]?\d+)$/);
    if (m) return Math.pow(10, parseInt(m[1], 10));
    if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  };

  /* Compare a numeric answer with tolerance (relative by default 2%) */
  lib.close = function (val, ans, tol) {
    tol = tol || {};
    const rel = tol.rel != null ? tol.rel : 0.02, abs = tol.abs != null ? tol.abs : 0;
    const diff = Math.abs(val - ans);
    return diff <= Math.max(abs, Math.abs(ans) * rel) + 1e-12;
  };

  /* Hi-DPI responsive canvas with an optional animation loop */
  lib.canvas = function (canvas, height, draw) {
    const ctx = canvas.getContext('2d');
    const st = { w: 0, h: height, ctx, raf: 0, running: false, t0: performance.now(), draw };
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      st.w = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 600;
      canvas.style.height = st.h + 'px';
      canvas.width = Math.round(st.w * dpr); canvas.height = Math.round(st.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!st.running && st.draw) st.draw(ctx, st.w, st.h, (performance.now() - st.t0) / 1000);
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
    resize();
    st.start = function () {
      if (st.running) return; st.running = true;
      const loop = now => { if (!st.running) return; st.draw(ctx, st.w, st.h, (now - st.t0) / 1000); st.raf = requestAnimationFrame(loop); };
      st.raf = requestAnimationFrame(loop);
    };
    st.stop = function () { st.running = false; cancelAnimationFrame(st.raf); };
    st.redraw = () => st.draw && st.draw(ctx, st.w, st.h, (performance.now() - st.t0) / 1000);
    st.destroy = function () { st.stop(); if (ro) ro.disconnect(); else window.removeEventListener('resize', resize); };
    st.resize = resize;
    return st;
  };

  /* Pointer position on a canvas in CSS pixels */
  lib.pointer = (canvas, e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  /* Labelled slider control with fine-step buttons */
  lib.slider = function (opt) {
    const { h } = lib;
    const val = h('b', { text: '' });
    const input = h('input', { type: 'range', min: opt.min, max: opt.max, step: opt.step, value: opt.value, 'aria-label': opt.label });
    const show = () => { val.textContent = opt.format ? opt.format(+input.value) : input.value; };
    const set = v => { input.value = lib.clamp(v, opt.min, opt.max); show(); opt.onInput && opt.onInput(+input.value); };
    input.addEventListener('input', () => { show(); opt.onInput && opt.onInput(+input.value); });
    const steps = (opt.steps || []).map(s => h('button', { type: 'button', text: (s > 0 ? '+' : '') + s, onclick: () => set(Math.round((+input.value + s) * 1e6) / 1e6) }));
    const el = h('div', { class: 'control' }, h('label', null, h('span', { text: opt.label }), val), input, steps.length ? h('div', { class: 'step-btns' }, steps) : null);
    show();
    return { el, input, get value() { return +input.value; }, set, disable(d) { input.disabled = d; steps.forEach(b => b.disabled = d); } };
  };

  /* Segmented single-choice buttons */
  lib.segmented = function (options, onChange) {
    const { h } = lib; let value = null;
    const btns = options.map(o => h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', text: o.label,
      onclick: () => { value = o.value; btns.forEach(b => b.setAttribute('aria-checked', String(b === btn(o)))); onChange && onChange(value); } }));
    function btn(o) { return btns[options.indexOf(o)]; }
    return { el: h('div', { class: 'seg', role: 'radiogroup' }, btns), get value() { return value; }, disable(d) { btns.forEach(b => b.disabled = d); } };
  };
})(window.SQ);
