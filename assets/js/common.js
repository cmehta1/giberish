/* ============================================================
   GIBERISH — shared chrome, cart, reveal, ambient dust
   ============================================================ */
(function () {
  const C = window.GIB_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => C.currency + Number(n).toLocaleString('en-IN');

  const ICON = {
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h10"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor"><path d="M0 5h20M16 1l4 4-4 4"/></svg>',
  };

  /* ---------- Images ----------
     Photos are served as WebP (made from the PNG/JPG originals next to them, which stay as
     the fallback). Bottle cut-outs also have a 400px-wide "-400" copy for small cards. */
  const IMG_W = { 'ajmal-1001-night': 621, 'al-bakhoor': 630, 'bakhoor-dani': 793, 'barakkat-rouge': 491, celoud: 531, fahad: 531, 'giberish-signature': 573,
    'hajar-al-aswad': 633, kaaf: 380, 'mukhallat-malaki': 630, 'musk-gold': 633, 'viking-creed': 756, 'white-oud': 714 };
  window.GibImg = {
    // "x-400.webp 400w, x.webp 573w" for a bottle in assets/img/hd/, else ''
    srcset(src) {
      const m = /^(.*\/hd\/([a-z0-9-]+))\.webp$/.exec(src || ''), w = m && IMG_W[m[2]];
      return w ? (w > 400 ? `${m[1]}-400.webp 400w, ` : '') + `${src} ${w}w` : '';
    },
    fallback: (src) => src.replace(/\.(webp|avif)(?=$|\?)/, /\/hd\/|buddha-sil/.test(src) ? '.png' : '.jpg'),
  };
  // a browser that cannot show WebP gets the original PNG/JPG instead
  document.addEventListener('error', (e) => {
    const im = e.target;
    if (im.tagName !== 'IMG' || im.dataset.fb || !/\.(webp|avif)(\?|$)/.test(im.currentSrc || im.src)) return;
    im.dataset.fb = '1'; im.removeAttribute('srcset'); im.src = window.GibImg.fallback(im.currentSrc || im.src);
  }, true);

  /* ---------- Structured data (schema.org), built from data.js so prices never drift ---------- */
  // a Product for one bottle; "By invitation" bottles (price: null) have no offer to describe, so they get none
  window.gibProductLD = function (p) {
    if (!p || p.price == null) return null;
    const abs = (u) => new URL(u, location.origin + '/').href;
    const house = String(p.house || '').split(' · ')[0];
    const url = abs('shop#feel=' + p.id);
    return {
      '@type': 'Product', '@id': url, sku: p.id, name: p.name,
      image: [abs(p.image), abs(window.GibImg.fallback(p.image))],
      description: p.story || p.tagline,
      brand: { '@type': 'Brand', name: /^(Attar|Eau de Parfum)$/.test(house) ? 'Giberish' : house },
      category: { attar: 'Attar', perfume: 'Eau de Parfum', ritual: 'Home fragrance' }[p.type] || p.size,
      offers: { '@type': 'Offer', url, price: p.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: 'Giberish' } },
    };
  };
  // put JSON-LD in <head> (replaces the block with the same id)
  window.gibLD = function (id, data) {
    let s = document.getElementById(id);
    if (!data) { if (s) s.remove(); return; }
    if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = id; document.head.appendChild(s); }
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data });
  };

  // Interactive experiences (also listed on explore.html)
  const EXPERIENCES = [
    ['worlds.html', 'Scent Worlds', 'Step inside each fragrance'],
    ['alchemy.html', 'Scent Alchemy', 'Compose notes in a glass orb'],
    ['boutique.html', 'The Boutique', 'Walk our virtual showroom'],
    ['layering.html', 'Layering Lab', 'Pair two fragrances'],
    ['journey.html', 'Scent Journey', 'How a fragrance unfolds'],
  ];
  window.GIB_EXPERIENCES = EXPERIENCES;

  /* ---------- Header / footer / drawer ---------- */
  function renderChrome() {
    const page = document.body.dataset.page;
    const links = [
      ['index.html', 'Home', 'home'],
      ['shop.html', 'Collection', 'shop'],
      ['about.html', 'Philosophy', 'about'],
    ];
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="container">
        <a href="index.html" class="brand" aria-label="Giberish home">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-word">Giberish</span>
        </a>
        <nav class="nav" aria-label="Main">
          ${links.map(([h, l, k]) => `<a href="${h}" class="${page === k ? 'active' : ''}">${l}</a>`).join('')}
          <div class="nav-drop">
            <a href="explore.html" class="${['explore', 'worlds', 'alchemy', 'boutique', 'layering', 'journey'].includes(page) ? 'active' : ''}">Experiences</a>
            <div class="nav-menu">
              ${EXPERIENCES.map(([h, t, d]) => `<a href="${h}">${t}<small>${d}</small></a>`).join('')}
            </div>
          </div>
          <a href="whispers.html" class="${page === 'whispers' ? 'active' : ''}">Whispers</a>
          <a href="atlas.html" class="${page === 'atlas' ? 'active' : ''}">Scent Atlas</a>
          <a href="kundli.html" class="nav-kundli ${page === 'kundli' ? 'active' : ''}"><i></i>Scent Kundli</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" data-open-cart aria-label="Open bag">${ICON.bag}<span class="cart-count">0</span></button>
          <button class="icon-btn menu-btn" data-open-menu aria-label="Open menu">${ICON.menu}</button>
        </div>
      </div>`;
    // experience pages get a breadcrumb row: Experiences › Current (and quick links to the others)
    const here = EXPERIENCES.find(([h]) => h.replace('.html', '') === page);
    if (here) {
      document.body.classList.add('has-crumbs');
      const crumbs = document.createElement('div');
      crumbs.className = 'crumbs';
      crumbs.innerHTML = `<div class="container">
          <nav aria-label="Breadcrumb"><a href="explore.html">Experiences</a><span aria-hidden="true">›</span><b aria-current="page">${here[1]}</b></nav>
          <div class="crumb-others">${EXPERIENCES.filter((x) => x !== here).map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>
        </div>`;
      header.appendChild(crumbs);
    }
    document.body.prepend(header);
    if (window.GibI18n) header.querySelector('.header-actions').prepend(window.GibI18n.switcher());

    const mm = document.createElement('div');
    mm.className = 'mobile-menu';
    mm.innerHTML = `
      <button class="icon-btn close" data-close-menu aria-label="Close menu">${ICON.close}</button>
      <a href="index.html">Home</a>
      <a href="shop.html">The <em>Collection</em></a>
      <a href="about.html">Our <em>Philosophy</em></a>
      <a href="kundli.html">Scent <em>Kundli</em></a>
      <a href="explore.html"><em>Experiences</em></a>
      <a href="whispers.html"><em>Whispers</em></a>
      <a href="atlas.html">Scent <em>Atlas</em></a>
      <a href="checkout.html">Your <em>Bag</em></a>
      <div class="mm-foot">Pure · Rare · Timeless</div>`;
    document.body.appendChild(mm);
    if (window.GibI18n) mm.insertBefore(window.GibI18n.switcher(), mm.querySelector('.mm-foot'));

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="brand"><span class="brand-mark"></span><span class="brand-word">Giberish</span></a>
            <p style="margin-top:16px">Fragrance for the moment after the noise. Each one is chosen, worn and recommended by us personally.</p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li><a href="shop.html">The Collection</a></li>
              <li><a href="shop.html#attar">Attars</a></li>
              <li><a href="shop.html#perfume">Perfumes</a></li>
              <li><a href="shop.html#ritual">Home Rituals</a></li>
            </ul>
          </div>
          <div>
            <h5>Giberish</h5>
            <ul>
              <li><a href="about.html">Philosophy</a></li>
              <li><a href="kundli.html">Scent Kundli</a></li>
              <li><a href="whispers.html">Whispers</a></li>
              <li><a href="atlas.html">The Scent Atlas</a></li>
              <li><a href="${C.instagram}" target="_blank" rel="noopener">Instagram @${C.instagramHandle}</a></li>
              <li><a href="https://wa.me/${C.whatsappNumber}" target="_blank" rel="noopener">WhatsApp ${C.whatsappDisplay}</a></li>
            </ul>
          </div>
          <div class="footer-news">
            <h5>Join the Silence Circle</h5>
            <p class="muted" style="margin:0">One letter a month: new attars, rituals and a moment of quiet.</p>
            <form class="signup" data-signup>
              <input type="email" required placeholder="Your email" aria-label="Email">
              <button class="btn btn-solid btn-sm" type="submit">Join</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Giberish · www.giberish.com</span>
          <span>Pure · Rare · Timeless</span>
        </div>
      </div>`;
    if (!document.body.hasAttribute('data-no-footer')) document.body.appendChild(footer);

    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('data-lenis-prevent', '');
    drawer.setAttribute('aria-label', 'Your bag');
    drawer.innerHTML = `
      <div class="drawer-head"><h3>Your <span class="script" style="font-size:34px">bag</span></h3>
        <button class="icon-btn" data-close-cart aria-label="Close bag">${ICON.close}</button></div>
      <div class="drawer-body"></div>
      <div class="drawer-foot"></div>`;
    document.body.append(scrim, drawer);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i></i><span></span>';
    document.body.appendChild(toast);

    // interactions
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-open-cart],[data-close-cart],[data-open-menu],[data-close-menu],[data-add]');
      if (!t) return;
      if (t.matches('[data-open-cart]')) openCart();
      if (t.matches('[data-close-cart]')) closeCart();
      if (t.matches('[data-open-menu]')) { mm.classList.add('open'); document.body.classList.add('no-scroll'); }
      if (t.matches('[data-close-menu]')) { mm.classList.remove('open'); document.body.classList.remove('no-scroll'); }
      if (t.matches('[data-add]')) {
        e.preventDefault();
        Cart.add(t.dataset.add);
      }
    });
    scrim.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
    $$('[data-signup]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault(); f.reset(); toastMsg('Welcome to the Silence Circle');
    }));

    // header scroll state
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 30);
      header.classList.toggle('hidden', y > 400 && y > lastY && !document.body.classList.contains('no-scroll'));
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openCart() { renderCart(); scrim.classList.add('show'); drawer.classList.add('open'); document.body.classList.add('no-scroll'); }
    function closeCart() { scrim.classList.remove('show'); drawer.classList.remove('open'); if (!$('.xp.open') && !mm.classList.contains('open')) document.body.classList.remove('no-scroll'); }
    window.GibUI = { openCart, closeCart, toast: toastMsg };
  }

  let toastTimer;
  function toastMsg(msg) {
    const t = $('.toast');
    if (!t) return;
    t.querySelector('span').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ---------- Cart (localStorage) ---------- */
  const KEY = 'giberish.bag.v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { return []; } };
  const write = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {} };
  const findProduct = (id) => window.GIB_PRODUCTS.find((p) => p.id === id);

  const Cart = {
    items: read(),
    lines() {
      return this.items.map((it) => {
        if (it.custom) return { ...it, name: it.custom.name, price: it.custom.price, sub: 'Bespoke attar · hand-blended for you', image: null };
        const p = findProduct(it.id);
        return p ? { ...it, name: p.name, price: p.price, sub: p.size, image: p.image } : null;
      }).filter(Boolean);
    },
    count() { return this.items.reduce((a, b) => a + b.qty, 0); },
    subtotal() { return this.lines().reduce((a, l) => a + l.price * l.qty, 0); },
    shipping() { const s = this.subtotal(); return s === 0 || s >= C.freeShippingAbove ? 0 : C.shippingFee; },
    add(id, custom) {
      const p = findProduct(id);
      if (!custom && (!p || p.price == null)) { toastMsg('You’re on the waitlist for ' + (p ? p.name : 'this') + '. We’ll let you know.'); return; }
      const key = custom ? 'bespoke-' + Date.now() : id;
      const ex = this.items.find((i) => i.key === key);
      if (ex) ex.qty++;
      else this.items.push({ key, id, qty: 1, custom: custom || null });
      this.save();
      toastMsg((custom ? custom.name : p.name) + ' added to your bag');
      const cc = $('.cart-count');
      if (cc) { cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump'); }
    },
    setQty(key, q) {
      const it = this.items.find((i) => i.key === key);
      if (!it) return;
      it.qty = Math.max(0, q);
      if (!it.qty) this.items = this.items.filter((i) => i !== it);
      this.save();
    },
    clear() { this.items = []; this.save(); },
    save() { write(this.items); updateCount(); renderCart(); document.dispatchEvent(new CustomEvent('cart:change')); },
  };
  // migrate: ensure each item has a key
  Cart.items.forEach((i) => { if (!i.key) i.key = i.id; });
  window.GibCart = Cart;
  window.gibMoney = money;

  function updateCount() {
    const el = $('.cart-count');
    if (!el) return;
    const n = Cart.count();
    el.textContent = n;
    el.classList.toggle('show', n > 0);
  }

  function renderCart() {
    const body = $('.drawer-body'), foot = $('.drawer-foot');
    if (!body) return;
    const lines = Cart.lines();
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty"><div class="script" style="font-size:54px">Silence…</div>
        <p>Your bag is waiting for its first fragrance.</p>
        <a class="btn btn-ghost btn-sm" href="shop.html" style="margin-top:12px">Explore the collection</a></div>`;
      foot.innerHTML = `<a class="link-arrow" href="kundli.html">Not sure? Read your Scent Kundli ${ICON.arrow}</a>`;
      return;
    }
    body.innerHTML = lines.map((l) => `
      <div class="cart-line">
        ${l.image ? `<img src="${l.image}" alt="">` : `<div class="bespoke-thumb">G</div>`}
        <div>
          <h4>${l.name}</h4><small>${l.sub}</small>
          <div class="qty"><button data-q="${l.key}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="${l.key}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div><div class="price">${money(l.price * l.qty)}</div><button class="remove" data-rm="${l.key}">Remove</button></div>
      </div>`).join('');
    const sub = Cart.subtotal();
    const left = Math.max(0, C.freeShippingAbove - sub);
    foot.innerHTML = `
      <div class="ship-meter">${left > 0 ? `Add <b class="gold">${money(left)}</b> more for complimentary shipping` : 'Your order ships <b class="gold">free</b>, gift-wrapped with care'}
        <div class="bar"><i style="width:${Math.min(100, (sub / C.freeShippingAbove) * 100)}%"></i></div></div>
      <div class="total-row"><span class="eyebrow">Subtotal</span><span>${money(sub)}</span></div>
      <a href="checkout.html" class="btn btn-solid" style="width:100%">Checkout</a>`;
    body.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => {
      const it = Cart.items.find((i) => i.key === b.dataset.q);
      Cart.setQty(b.dataset.q, it.qty + Number(b.dataset.d));
    });
    body.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => Cart.setQty(b.dataset.rm, 0));
  }

  /* ---------- Product card (shared) ---------- */
  window.gibCard = function (p, opts = {}) {
    const notes = [...p.notes.top, ...p.notes.heart, ...p.notes.base].slice(0, 4);
    return `
      <article class="p-card" data-tilt data-id="${p.id}" data-type="${p.type}">
        <div class="p-media" data-feel="${p.id}" role="button" tabindex="0" aria-label="Feel ${p.name}">
          <img src="${p.image}" srcset="${window.GibImg.srcset(p.image)}" sizes="(min-width: 700px) 240px, 72vw" alt="${p.name}" loading="lazy" decoding="async">
          ${window.GibArt ? [...new Set(p.ingredients.flatMap((k) => window.GibArt.forIngredient(k)))].filter((k) => k !== 'smoke').slice(0, 3)
            .map((k) => `<img class="p-ing" data-k="${k}" src="${window.GibArt.url(k)}" alt="">`).join('') : ''}
          <span class="feel-badge"><i></i>Feel it</span>
        </div>
        <div class="p-body">
          <span class="p-house">${p.house}</span>
          <h3 class="p-name">${p.name}</h3>
          <p class="p-tag">${p.tagline}</p>
          ${opts.story ? `<p class="p-story">${p.story}</p>` : ''}
          <div class="p-notes">${notes.map((n) => `<span class="chip">${n}</span>`).join('')}</div>
          <div class="p-foot">
            <div class="p-price">${p.price != null ? money(p.price) : '<span style="font-size:20px">By invitation</span>'}<small>${p.size}</small></div>
            <button class="btn btn-sm ${p.price != null ? '' : 'btn-ghost'}" data-add="${p.id}">${p.price != null ? 'Add to bag' : 'Waitlist'}</button>
          </div>
        </div>
      </article>`;
  };

  /* ---------- Card tilt + glow (pointer devices only) ---------- */
  function initTilt() {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('[data-tilt]');
      $$('[data-tilt].tilting').forEach((c) => { if (c !== card) { c.classList.remove('tilting'); c.style.transform = ''; } });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      card.style.transform = `perspective(900px) rotateY(${(x - .5) * 6}deg) rotateX(${(.5 - y) * 6}deg) translateY(-6px)`;
      const media = card.querySelector('.p-media');
      if (media) { media.style.setProperty('--mx', x * 100 + '%'); media.style.setProperty('--my', y * 100 + '%'); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  window.gibObserveReveals = function (root = document) {
    const els = $$('.reveal:not(.in), [data-reveal]:not(.in)', root);
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
  };

  /* ---------- Ambient gold dust ---------- */
  function initDust() {
    if (reduceMotion || document.body.hasAttribute('data-no-dust')) return;
    const c = document.createElement('canvas');
    c.className = 'dust';
    document.body.prepend(c);
    const ctx = c.getContext('2d');
    let W, H, dpr, parts = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
      const n = Math.round(Math.min(70, innerWidth / 18));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: (Math.random() * 1.4 + .3) * dpr, s: Math.random() * .25 + .05,
        a: Math.random() * Math.PI * 2, tw: Math.random() * .02 + .005,
      }));
    };
    resize();
    addEventListener('resize', resize);
    let scrollV = 0, lastS = scrollY;
    addEventListener('scroll', () => { scrollV += (scrollY - lastS) * .02; lastS = scrollY; }, { passive: true });
    (function loop() {
      ctx.clearRect(0, 0, W, H);
      scrollV *= .92;
      for (const p of parts) {
        p.a += p.tw;
        p.y -= (p.s + scrollV * .6) * dpr;
        p.x += Math.sin(p.a) * .15 * dpr;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.y > H + 10) { p.y = -10; }
        const alpha = .25 + Math.sin(p.a * 2) * .2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(242, 213, 155, ${alpha})`;
        ctx.shadowColor = 'rgba(242,213,155,.8)';
        ctx.shadowBlur = 6 * dpr;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  function initSmooth() {
    if (reduceMotion || !window.Lenis) return;
    const lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.gibLenis = lenis;
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
    // pause while a drawer / overlay / menu is open
    new MutationObserver(() => (document.body.classList.contains('no-scroll') ? lenis.stop() : lenis.start()))
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); }
    });
  }

  /* ---------- Page curtain ---------- */
  function initCurtain() {
    const cur = document.createElement('div');
    cur.className = 'curtain';
    cur.innerHTML = '<img src="assets/img/buddha-sil.webp" alt="">';
    let arriving = false;
    try { arriving = !!sessionStorage.getItem('gibNav'); sessionStorage.removeItem('gibNav'); } catch (_) {}
    if (!arriving) cur.classList.add('up', 'gone');
    document.body.appendChild(cur);
    document.documentElement.classList.remove('nav-in');
    if (arriving) requestAnimationFrame(() => setTimeout(() => {
      cur.classList.add('up');
      setTimeout(() => cur.classList.add('gone'), 1100);
    }, 250));
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href) || reduceMotion) return;
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem('gibNav', '1'); } catch (_) {}
      cur.classList.remove('gone');
      void cur.offsetWidth;
      cur.classList.remove('up');
      cur.classList.add('down');
      setTimeout(() => (location.href = url.href), 650);
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted) cur.classList.add('up', 'gone'); });
  }

  /* ---------- Custom cursor + magnetic buttons ---------- */
  function initCursor() {
    if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    document.addEventListener('mouseleave', () => document.documentElement.classList.remove('cursor-on'));
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      document.documentElement.classList.add('cursor-on');
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const t = e.target;
      ring.classList.toggle('feel', !!t.closest('.p-media, .feel-visual'));
      ring.classList.toggle('hover', !!t.closest('a, button, .k-opt, [role="button"]'));
      const b = t.closest('.btn');
      $$('.btn.magnet').forEach((m) => { if (m !== b) { m.classList.remove('magnet'); m.style.translate = ''; } });
      if (b) {
        const r = b.getBoundingClientRect();
        b.classList.add('magnet');
        b.style.translate = `${(x - r.left - r.width / 2) * .18}px ${(y - r.top - r.height / 2) * .3}px`;
      }
    }, { passive: true });
    (function loop() { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`; requestAnimationFrame(loop); })();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCurtain();
    initSmooth();
    initCursor();
    renderChrome();
    updateCount();
    initTilt();
    initDust();
    window.gibObserveReveals();
  });
})();
