/* ============================================================
   GIBERISH — languages: English (default), हिन्दी, ગુજરાતી
   The page is written in English. Translations live in assets/js/i18n-dict.js,
   keyed by the English text itself, so no markup needs special attributes.

   How matching works:
   - An element whose content is only text + inline tags (em, b, i, strong, small, br, span)
     is looked up by its whole inner HTML (whitespace collapsed). This keeps word order
     natural in Hindi/Gujarati even when the English has <em>…</em> in the middle.
   - Otherwise each plain text node inside is looked up on its own (trimmed).
   - placeholder / aria-label / title attributes are looked up too.
   Anything not in the dictionary simply stays in English (by design: brand, product and
   note names read better in English).

   GibI18n.set('hi' | 'gu' | 'en'), GibI18n.lang, GibI18n.missing() → untranslated strings on this page
   ============================================================ */
(function () {
  const LANGS = { en: 'EN', hi: 'हि', gu: 'ગુ' };
  const FONTS = {
    hi: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@300;400;500&family=Noto+Serif+Devanagari:wght@300;400;500&display=swap',
    gu: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@300;400;500&family=Noto+Serif+Gujarati:wght@300;400;500&display=swap',
  };
  const INLINE = new Set(['EM', 'B', 'I', 'STRONG', 'SMALL', 'BR', 'SPAN', 'U']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'svg']);
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  let lang = 'en';
  try { lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('gib.lang') || 'en'; } catch (_) {}
  if (!LANGS[lang]) lang = 'en';

  const dict = () => (window.GIB_I18N || {})[lang] || {};

  // the dictionary (~300 KB) is only fetched for Hindi / Gujarati, never for English visitors
  const DICT_SRC = ((document.currentScript && document.currentScript.src) || 'assets/js/i18n.js').replace(/i18n\.js(\?.*)?$/, 'i18n-dict.js');
  let waiting = null;
  function withDict(cb) {
    if (window.GIB_I18N) return cb();
    if (!waiting) {
      waiting = [];
      const s = document.createElement('script');
      s.src = DICT_SRC;
      s.onload = s.onerror = () => { const q = waiting; waiting = null; q.forEach((f) => f()); };
      document.head.appendChild(s);
    }
    waiting.push(cb);
  }
  const orig = new WeakMap();      // element → original English innerHTML
  const origText = new WeakMap();  // text node → original English text
  let busy = false;

  function simple(el) { // only text and inline formatting inside?
    for (const c of el.children) if (!INLINE.has(c.tagName) || c.children.length || c.attributes.length > 1 || (c.attributes.length === 1 && c.attributes[0].name !== 'class' && c.attributes[0].name !== 'style')) return false;
    return true;
  }

  function translateEl(el, D) {
    if (SKIP.has(el.tagName) || el.closest('[data-no-i18n]')) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const key = '@' + a, store = el.dataset['i18n' + a.replace(/[^a-z]/g, '')];
      const en = store || el.getAttribute(a);
      if (!store) el.dataset['i18n' + a.replace(/[^a-z]/g, '')] = en;
      el.setAttribute(a, (lang !== 'en' && D[norm(en)]) || en);
      void key;
    }
    if (el.children.length && simple(el) && norm(el.textContent)) {
      // if the page's own script changed the content since we last wrote it, that is the new English source
      let rec = orig.get(el);
      if (!rec || el.innerHTML !== rec.out) rec = { en: el.innerHTML, out: el.innerHTML };
      const t = D[norm(rec.en)];
      if (t || lang === 'en') { rec.out = lang === 'en' ? rec.en : t; if (el.innerHTML !== rec.out) el.innerHTML = rec.out; rec.out = el.innerHTML; orig.set(el, rec); return; }
    }
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      let rec = origText.get(n);
      if (!rec || n.nodeValue !== rec.out) rec = { en: n.nodeValue, out: n.nodeValue };
      const t = D[norm(rec.en)];
      rec.out = lang !== 'en' && t ? rec.en.replace(rec.en.trim(), t) : rec.en;
      if (n.nodeValue !== rec.out) n.nodeValue = rec.out;
      origText.set(n, rec);
    }
  }

  function apply(root = document.body) {
    if (!root || busy) return;
    busy = true;
    const D = dict();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, { acceptNode: (n) => (SKIP.has(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let el = root.nodeType === 1 ? root : walker.nextNode();
    while (el) { translateEl(el, D); el = walker.nextNode(); }
    busy = false;
  }

  function loadFont() {
    if (!FONTS[lang] || document.getElementById('i18n-font-' + lang)) return;
    const l = document.createElement('link');
    l.id = 'i18n-font-' + lang; l.rel = 'stylesheet'; l.href = FONTS[lang];
    document.head.appendChild(l);
  }

  function set(l) {
    if (!LANGS[l]) return;
    if (l !== 'en' && !window.GIB_I18N) return withDict(() => set(l));
    lang = l;
    try { localStorage.setItem('gib.lang', l); } catch (_) {}
    document.documentElement.lang = l === 'en' ? 'en' : l;
    loadFont();
    apply();
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === l));
    document.dispatchEvent(new CustomEvent('lang:change', { detail: l }));
  }

  // a compact EN · हि · ગુ switch
  function switcher() {
    const w = document.createElement('div');
    w.className = 'lang-switch'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Language');
    w.setAttribute('data-no-i18n', '');
    w.innerHTML = Object.entries(LANGS).map(([k, v]) => `<button type="button" data-lang="${k}" class="${k === lang ? 'active' : ''}" aria-label="${{ en: 'English', hi: 'हिन्दी', gu: 'ગુજરાતી' }[k]}">${v}</button>`).join('');
    w.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) set(b.dataset.lang); });
    return w;
  }

  // collect visible English text that has no translation (used while writing the dictionary)
  function missing() {
    const D = dict(), out = new Set();
    document.querySelectorAll('body *').forEach((el) => {
      if (SKIP.has(el.tagName) || el.closest('[data-no-i18n]') || !el.getClientRects().length) return;
      if (el.children.length && simple(el) && norm(el.textContent)) { const en = norm((orig.get(el) || {}).en || el.innerHTML); if (!D[en] && /[A-Za-z]{3}/.test(el.textContent)) out.add(en); return; }
      for (const n of el.childNodes) if (n.nodeType === 3 && /[A-Za-z]{3}/.test(n.nodeValue)) { const en = norm((origText.get(n) || {}).en || n.nodeValue); if (!D[en]) out.add(en); }
      for (const a of ATTRS) if (el.hasAttribute(a)) { const en = norm(el.dataset['i18n' + a.replace(/[^a-z]/g, '')] || el.getAttribute(a)); if (/[A-Za-z]{3}/.test(en) && !D[en]) out.add(en); }
    });
    return [...out];
  }

  window.GibI18n = { set, apply, switcher, missing, get lang() { return lang; }, langs: LANGS };

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = lang === 'en' ? 'en' : lang;
    if (lang !== 'en') loadFont();
    // translate after the page's own scripts have rendered
    setTimeout(() => {
      if (lang !== 'en') withDict(() => { apply(); document.dispatchEvent(new CustomEvent('lang:change', { detail: lang })); });
      else apply();
      // keep translating anything added later (cards, quiz steps, overlays)
      let queued = new Set(), raf = 0;
      new MutationObserver((muts) => {
        if (busy || lang === 'en') return;
        for (const m of muts) {
          if (m.type === 'childList') m.addedNodes.forEach((n) => queued.add(n.nodeType === 1 ? n : n.parentElement));
          else if (m.type === 'characterData') queued.add(m.target.parentElement);
        }
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; const q = queued; queued = new Set(); q.forEach((n) => n && n.isConnected && apply(n)); });
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }, 0);
  });
})();
