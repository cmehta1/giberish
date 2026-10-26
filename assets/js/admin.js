/* ============================================================
   GIBERISH — admin panel (admin.html)
   Orders (mark converted / not converted), Scent Kundli readings and emails,
   and the catalogue (products and notes) the website reads from the database.
   Only emails listed in public.admins can read or change anything (supabase/schema.sql).
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => (n == null || n === '' ? '—' : '₹' + Number(n).toLocaleString('en-IN'));
  const when = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const root = $('#adm');
  const FAMS = Object.keys(window.GIB_FAMILIES || {});
  const ART = (window.GibArt && window.GibArt.kinds) || [];
  const SOUNDS = ['', 'sea', 'breeze', 'rain', 'stream', 'forest', 'temple', 'night', 'fire', 'bazaar', 'silk'];
  const STATUS = { new: 'New', converted: 'Converted', not_converted: 'Not converted' };

  /* ---------- Backend: Supabase (the panel only talks to it through these few calls) ---------- */
  function supabaseBackend(cfg) {
    const sb = window.supabase.createClient(cfg.url, cfg.key);
    const run = async (q) => { const { data, error } = await q; if (error) throw new Error(error.message); return data; };
    const changed = (rows) => { if (!rows || !rows.length) throw new Error('Not saved: this account may not be allowed to make changes.'); return rows[0]; };
    return {
      async session() { const { data } = await sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; },
      onAuth(cb) { sb.auth.onAuthStateChange((ev, s) => cb(ev, s ? { email: s.user.email } : null)); },
      async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message); },
      signOut: () => sb.auth.signOut(),
      async resetPassword(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw new Error(error.message); },
      async updatePassword(password) { const { error } = await sb.auth.updateUser({ password }); if (error) throw new Error(error.message); },
      isAdmin: async () => !!(await run(sb.rpc('is_admin'))),
      list: (table, order, asc) => run(sb.from(table).select('*').order(order, { ascending: asc }).range(0, 4999)),
      update: async (table, key, id, patch) => changed(await run(sb.from(table).update(patch).eq(key, id).select())),
      upsert: async (table, row) => changed(await run(sb.from(table).upsert(row).select())),
      remove: async (table, key, id) => changed(await run(sb.from(table).delete().eq(key, id).select())),
      async upload(file, name) {
        await run(sb.storage.from('products').upload(name, file, { contentType: file.type, upsert: true }));
        return sb.storage.from('products').getPublicUrl(name).data.publicUrl;
      },
    };
  }

  let api = null, me = null;
  const state = { tab: 'orders', orders: [], kundlis: [], products: [], notes: [],
    of: { status: 'all', period: 'all', q: '' }, kf: { period: 'all', q: '', consent: false }, open: null };

  function toast(msg, bad) {
    let t = $('.adm-toast');
    if (!t) { t = document.createElement('div'); t.className = 'adm-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), bad ? 6000 : 2600);
  }
  const fail = (e) => toast(e.message || String(e), true);

  /* ---------- Sign in ---------- */
  function shell(inner) { root.innerHTML = `<div class="adm-gate"><div class="adm-card"><a href="index.html" class="adm-brand"><span class="brand-mark"></span><span>Giberish</span></a>${inner}</div></div>`; }

  function setupNeeded() {
    shell(`<h1>Admin</h1><p>The database isn’t connected yet. Paste your Supabase Project URL and publishable key into
      <code>GIB_CONFIG.supabase</code> in <code>assets/js/data.js</code>, then reload. The steps are in <code>supabase/SETUP.md</code>.</p>`);
  }

  function login(msg) {
    shell(`<h1>Admin</h1><p class="muted">Sign in with your admin email.</p>
      <form id="adm-login" class="adm-form">
        <label>Email<input type="email" name="email" autocomplete="username" required></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
        <p class="adm-err">${esc(msg || '')}</p>
        <button class="btn btn-solid" type="submit">Sign in</button>
        <button class="adm-link" type="button" id="adm-forgot">Forgot password?</button>
      </form>`);
    const f = $('#adm-login');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = $('button[type=submit]', f); b.disabled = true; b.textContent = 'Signing in…';
      try { await api.signIn(f.email.value.trim(), f.password.value); await enter(); } catch (err) { login(err.message); }
    };
    $('#adm-forgot').onclick = async () => {
      const email = f.email.value.trim();
      if (!email) { $('.adm-err').textContent = 'Type your email first, then press “Forgot password?”.'; return; }
      try { await api.resetPassword(email); $('.adm-err').textContent = 'If that email is an admin, a reset link is on its way.'; } catch (err) { $('.adm-err').textContent = err.message; }
    };
  }

  function newPassword() {
    shell(`<h1>Choose a new password</h1>
      <form id="adm-pw" class="adm-form">
        <label>New password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label>
        <p class="adm-err"></p><button class="btn btn-solid" type="submit">Save password</button>
      </form>`);
    $('#adm-pw').onsubmit = async (e) => {
      e.preventDefault();
      try { await api.updatePassword(e.target.password.value); toast('Password saved'); history.replaceState(null, '', location.pathname); await enter(); } catch (err) { $('.adm-err').textContent = err.message; }
    };
  }

  async function enter() {
    me = await api.session();
    if (!me) return login();
    let ok = false;
    try { ok = await api.isAdmin(); } catch (e) { return login(e.message); }
    if (!ok) {
      shell(`<h1>Not an admin</h1><p><b>${esc(me.email)}</b> can sign in, but isn’t on the admin list. Add it to <code>public.admins</code> in Supabase (see <code>supabase/SETUP.md</code>).</p>
        <button class="btn" id="adm-out">Sign out</button>`);
      $('#adm-out').onclick = async () => { await api.signOut(); login(); };
      return;
    }
    frame();
    await loadAll();
  }

  /* ---------- Frame & tabs ---------- */
  const TABS = [['orders', 'Orders'], ['kundlis', 'Scent Kundlis'], ['products', 'Products'], ['notes', 'Notes']];
  function frame() {
    root.innerHTML = `
      <header class="adm-top">
        <button type="button" class="adm-brand" id="adm-home" title="Back to orders"><span class="brand-mark"></span><span>Giberish</span><small>Admin</small></button>
        <nav class="adm-tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}">${l}<em data-count="${k}"></em></button>`).join('')}</nav>
        <div class="adm-me"><span>${esc(me.email)}</span><a class="adm-link" href="index.html" target="_blank" rel="noopener">View website ↗</a><button class="adm-link" id="adm-refresh" title="Reload data">Refresh</button><button class="adm-link" id="adm-out">Sign out</button></div>
      </header>
      <main class="adm-main" id="adm-main"><p class="adm-loading">Loading…</p></main>`;
    $$('[data-tab]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; state.open = null; try { localStorage.setItem('gib.adm.tab', state.tab); } catch (_) {} draw(); }));
    $('#adm-out').onclick = async () => { await api.signOut(); login(); };
    $('#adm-home').onclick = () => $('[data-tab=orders]').click();
    $('#adm-refresh').onclick = () => loadAll().then(() => toast('Up to date'));
    try { state.tab = localStorage.getItem('gib.adm.tab') || state.tab; } catch (_) {}
  }

  async function loadAll() {
    try {
      const [orders, kundlis, products, notes] = await Promise.all([
        api.list('orders', 'created_at', false), api.list('kundlis', 'created_at', false),
        api.list('products', 'sort', true), api.list('notes', 'sort', true),
      ]);
      Object.assign(state, { orders, kundlis, products, notes });
    } catch (e) { fail(e); }
    draw();
  }

  function draw() {
    $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === state.tab));
    const n = { orders: state.orders.filter((o) => o.status === 'new').length, kundlis: state.kundlis.length, products: state.products.length, notes: state.notes.length };
    $$('[data-count]').forEach((e) => (e.textContent = n[e.dataset.count] || ''));
    ({ orders: drawOrders, kundlis: drawKundlis, products: drawProducts, notes: drawNotes })[state.tab]();
  }

  /* ---------- Shared bits ---------- */
  const PERIODS = [['all', 'All time'], ['1', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days']];
  const inPeriod = (d, p) => p === 'all' || (p === '1' ? new Date(d).toDateString() === new Date().toDateString() : Date.now() - new Date(d) < p * 864e5);
  function csv(name, rows) {
    if (!rows.length) return toast('Nothing to export');
    const cols = Object.keys(rows[0]);
    const cell = (v) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const blob = new Blob(['﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `giberish-${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const stat = (label, value, sub) => `<div class="adm-stat"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const wa = (phone) => (phone ? `https://wa.me/91${String(phone).replace(/\D/g, '').slice(-10)}` : '');

  /* ---------- Orders ---------- */
  function drawOrders() {
    const f = state.of, all = state.orders;
    const list = all.filter((o) => (f.status === 'all' || o.status === f.status) && inPeriod(o.created_at, f.period)
      && (!f.q || [o.code, o.name, o.phone, o.email, o.city].join(' ').toLowerCase().includes(f.q.toLowerCase())));
    const conv = all.filter((o) => o.status === 'converted'), lost = all.filter((o) => o.status === 'not_converted');
    const decided = conv.length + lost.length;
    $('#adm-main').innerHTML = `
      <section class="adm-stats">
        ${stat('Orders', all.length, `${all.filter((o) => inPeriod(o.created_at, '7')).length} this week`)}
        ${stat('Waiting', all.filter((o) => o.status === 'new').length, 'marked New')}
        ${stat('Converted', conv.length, decided ? `${Math.round((conv.length / decided) * 100)}% of decided orders` : '')}
        ${stat('Not converted', lost.length)}
        ${stat('Converted sales', money(conv.reduce((s, o) => s + (o.total || 0), 0)))}
      </section>
      <section class="adm-bar">
        <div class="adm-chips">${[['all', 'All'], ...Object.entries(STATUS)].map(([k, l]) => `<button data-os="${k}" class="${f.status === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <select id="o-period">${PERIODS.map(([k, l]) => `<option value="${k}" ${f.period === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input id="o-q" type="search" placeholder="Search name, phone, order code…" value="${esc(f.q)}">
        <button class="btn btn-sm" id="o-csv">Export CSV</button>
      </section>
      <p class="adm-count">${list.length} of ${all.length} orders</p>
      <section class="adm-list">${list.length ? list.map(orderRow).join('') : '<p class="adm-empty">No orders here yet.</p>'}</section>`;
    $$('[data-os]').forEach((b) => (b.onclick = () => { f.status = b.dataset.os; drawOrders(); }));
    $('#o-period').onchange = (e) => { f.period = e.target.value; drawOrders(); };
    const q = $('#o-q'); q.oninput = () => { f.q = q.value; clearTimeout(q.t); q.t = setTimeout(() => { drawOrders(); const n = $('#o-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    $('#o-csv').onclick = () => csv('orders', list.map((o) => ({ date: o.created_at, code: o.code, status: STATUS[o.status], channel: o.channel, name: o.name, phone: o.phone, email: o.email,
      address: o.address, city: o.city, pincode: o.pincode, items: (o.items || []).map((i) => `${i.name} x${i.qty}`).join('; '), subtotal: o.subtotal, discount: o.discount,
      shipping: o.shipping, total: o.total, offer: o.offer, gift_note: o.gift_note, note: o.admin_note })));
    $$('.o-row').forEach((r) => {
      $('.o-head', r).onclick = () => { state.open = state.open === r.dataset.id ? null : r.dataset.id; drawOrders(); };
      $$('[data-set]', r).forEach((b) => (b.onclick = () => setStatus(r.dataset.id, b.dataset.set)));
      const save = $('[data-note]', r); if (save) save.onclick = () => saveNote(r.dataset.id, $('textarea', r).value);
      const del = $('[data-del]', r); if (del) del.onclick = () => removeRow('orders', r.dataset.id, 'this order');
    });
  }

  function orderRow(o) {
    const open = state.open === o.id, items = o.items || [];
    return `<article class="o-row ${open ? 'open' : ''}" data-id="${o.id}">
      <button class="o-head" aria-expanded="${open}">
        <span class="o-when">${when(o.created_at)}</span>
        <span class="o-who"><b>${esc(o.name)}</b><small>${esc(o.code)} · ${esc(o.channel)}</small></span>
        <span class="o-items">${items.map((i) => `${esc(i.name)}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')}</span>
        <span class="o-total">${money(o.total)}${o.discount ? `<small>${esc(o.offer || 'Offer')} −${money(o.discount)}</small>` : ''}</span>
        <span class="pill ${o.status}">${STATUS[o.status]}</span>
      </button>
      ${open ? `<div class="o-body">
        <div class="o-cols">
          <div><h4>Customer</h4><p>${esc(o.name)}<br>${o.phone ? `<a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> · <a href="${wa(o.phone)}" target="_blank" rel="noopener">WhatsApp</a><br>` : ''}${o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a><br>` : ''}${esc(o.address)}<br>${esc(o.city)} ${esc(o.pincode)}</p>
            ${o.gift_note ? `<h4>Gift note</h4><p>${esc(o.gift_note)}</p>` : ''}</div>
          <div><h4>Items</h4><table class="o-tbl">${items.map((i) => `<tr><td>${esc(i.name)}${i.formula ? `<small>${esc(i.formula)}</small>` : ''}</td><td>${i.qty} × ${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join('')}
            <tr class="sum"><td colspan="2">Subtotal</td><td>${money(o.subtotal)}</td></tr>
            ${o.discount ? `<tr class="sum"><td colspan="2">${esc(o.offer || 'Offer')}</td><td>−${money(o.discount)}</td></tr>` : ''}
            <tr class="sum"><td colspan="2">Shipping</td><td>${o.shipping ? money(o.shipping) : 'Free'}</td></tr>
            <tr class="sum total"><td colspan="2">Total</td><td>${money(o.total)}</td></tr></table></div>
        </div>
        <div class="o-actions">
          <div class="adm-chips big">
            <button data-set="converted" class="ok ${o.status === 'converted' ? 'on' : ''}">✓ Converted</button>
            <button data-set="not_converted" class="no ${o.status === 'not_converted' ? 'on' : ''}">✕ Not converted</button>
            <button data-set="new" class="${o.status === 'new' ? 'on' : ''}">New</button>
          </div>
          ${o.status_at ? `<small class="muted">Marked ${STATUS[o.status]} on ${when(o.status_at)}</small>` : ''}
          <label class="o-note">Note (only you see this)<textarea maxlength="1000" placeholder="e.g. paid on UPI, shipped by Delhivery…">${esc(o.admin_note || '')}</textarea></label>
          <div class="adm-actions wide"><button class="btn btn-sm" data-note>Save note</button><button class="adm-link danger" data-del>Delete this order</button></div>
        </div>
      </div>` : ''}
    </article>`;
  }

  async function setStatus(id, status) {
    try {
      const row = await api.update('orders', 'id', id, { status, status_at: status === 'new' ? null : new Date().toISOString() });
      Object.assign(state.orders.find((o) => o.id === id), row); draw(); toast(`Marked ${STATUS[status]}`);
    } catch (e) { fail(e); }
  }
  async function saveNote(id, note) {
    try { const row = await api.update('orders', 'id', id, { admin_note: note.trim() || null }); Object.assign(state.orders.find((o) => o.id === id), row); toast('Note saved'); } catch (e) { fail(e); }
  }

  async function removeRow(table, id, what) {
    if (!confirm(`Delete ${what} for good? This can’t be undone.`)) return;
    try { await api.remove(table, 'id', id); state[table] = state[table].filter((x) => x.id !== id); state.open = null; draw(); toast('Deleted'); } catch (e) { fail(e); }
  }

  /* ---------- Scent Kundlis ---------- */
  function drawKundlis() {
    const f = state.kf, all = state.kundlis;
    const list = all.filter((k) => inPeriod(k.created_at, f.period) && (!f.consent || k.consent_marketing)
      && (!f.q || [k.name, k.email, k.archetype, k.blend && k.blend.code].join(' ').toLowerCase().includes(f.q.toLowerCase())));
    const emails = new Set(all.map((k) => k.email)), yes = new Set(all.filter((k) => k.consent_marketing).map((k) => k.email));
    const top = Object.entries(all.reduce((m, k) => ((m[k.archetype] = (m[k.archetype] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0];
    $('#adm-main').innerHTML = `
      <section class="adm-stats">
        ${stat('Readings', all.length, `${all.filter((k) => inPeriod(k.created_at, '7')).length} this week`)}
        ${stat('Emails', emails.size, 'unique')}
        ${stat('Said yes to offers', yes.size, emails.size ? `${Math.round((yes.size / emails.size) * 100)}% of emails` : '')}
        ${stat('Most common reading', top ? esc(top[0]) : '—', top ? `${top[1]} ${top[1] === 1 ? 'person' : 'people'}` : '')}
      </section>
      <section class="adm-bar">
        <select id="k-period">${PERIODS.map(([k, l]) => `<option value="${k}" ${f.period === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <label class="adm-check"><input type="checkbox" id="k-consent" ${f.consent ? 'checked' : ''}> Only those who said yes to offers</label>
        <input id="k-q" type="search" placeholder="Search name, email, reading, code…" value="${esc(f.q)}">
        <button class="btn btn-sm" id="k-copy">Copy emails</button>
        <button class="btn btn-sm" id="k-csv">Export CSV</button>
      </section>
      <p class="adm-count">${list.length} of ${all.length} readings</p>
      <section class="adm-list">${list.length ? list.map(kundliRow).join('') : '<p class="adm-empty">No readings here yet.</p>'}</section>`;
    $('#k-period').onchange = (e) => { f.period = e.target.value; drawKundlis(); };
    $('#k-consent').onchange = (e) => { f.consent = e.target.checked; drawKundlis(); };
    const q = $('#k-q'); q.oninput = () => { f.q = q.value; clearTimeout(q.t); q.t = setTimeout(() => { drawKundlis(); const n = $('#k-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    $('#k-copy').onclick = async () => {
      const out = [...new Set(list.filter((k) => k.consent_marketing).map((k) => k.email))];
      if (!out.length) return toast('No one in this list said yes to offers');
      try { await navigator.clipboard.writeText(out.join(', ')); toast(`${out.length} emails copied (only people who said yes to offers)`); } catch (_) { prompt('Copy these emails:', out.join(', ')); }
    };
    $('#k-csv').onclick = () => csv('kundlis', list.map((k) => ({ date: k.created_at, name: k.name, email: k.email, offers_ok: k.consent_marketing ? 'yes' : 'no', reading: k.archetype,
      blend: k.blend && `${k.blend.top} / ${k.blend.heart} / ${k.blend.base}`, code: k.blend && k.blend.code, matches: (k.matches || []).map((m) => m.name).join('; '),
      answers: Object.values(k.answers || {}).join('; '), link: k.share_url, lang: k.lang })));
    $$('.k-row .o-head').forEach((h) => (h.onclick = () => { const id = h.parentNode.dataset.id; state.open = state.open === id ? null : id; drawKundlis(); }));
    $$('.k-row [data-del]').forEach((b) => (b.onclick = () => removeRow('kundlis', b.closest('.k-row').dataset.id, 'this reading')));
  }

  function kundliRow(k) {
    const open = state.open === k.id, b = k.blend || {}, prof = k.profile || {};
    return `<article class="o-row k-row ${open ? 'open' : ''}" data-id="${k.id}">
      <button class="o-head" aria-expanded="${open}">
        <span class="o-when">${when(k.created_at)}</span>
        <span class="o-who"><b>${esc(k.name || '—')}</b><small>${esc(k.email)}</small></span>
        <span class="o-items">${esc(k.archetype || '')}</span>
        <span class="o-total code">${esc(b.code || '')}</span>
        <span class="pill ${k.consent_marketing ? 'converted' : 'muted'}">${k.consent_marketing ? 'Offers: yes' : 'Offers: no'}</span>
      </button>
      ${open ? `<div class="o-body"><div class="o-cols">
        <div><h4>Answers</h4><dl class="k-ans">${Object.entries(k.answers || {}).map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl></div>
        <div><h4>Scent chart</h4><div class="k-bars">${FAMS.filter((f) => f in prof).map((f) => `<div><span>${esc((window.GIB_FAMILIES[f] || {}).label || f)}</span><i><b style="width:${Math.round((prof[f] || 0) * 100)}%;background:${(window.GIB_FAMILIES[f] || {}).color}"></b></i></div>`).join('')}</div>
          <h4>Bespoke attar</h4><p><b>${esc(b.name || '')}</b><br>Top: ${esc(b.top)} · Heart: ${esc(b.heart)} · Base: ${esc(b.base)}<br>Code ${esc(b.code)}${k.share_url ? ` · <a href="${esc(k.share_url)}" target="_blank" rel="noopener">Open blend</a>` : ''}</p>
          <h4>Matched fragrances</h4><p>${(k.matches || []).map((m) => `${esc(m.name)} (${m.score}%)`).join(', ')}</p>
          <p><a href="mailto:${esc(k.email)}">Email ${esc(k.name || 'them')}</a></p>
          <p><button class="adm-link danger" data-del>Delete this reading</button></p></div>
      </div></div>` : ''}
    </article>`;
  }

  /* ---------- Products ---------- */
  function drawProducts() {
    $('#adm-main').innerHTML = `
      <section class="adm-bar"><p class="muted">Edits reach the website within about a minute. Hidden products disappear from the site but stay here.</p><button class="btn btn-sm btn-solid" id="p-new">Add product</button></section>
      <section class="p-grid">${state.products.map((p) => `
        <article class="p-tile ${p.active ? '' : 'off'}" data-id="${esc(p.id)}">
          <div class="p-img">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}</div>
          <div><b>${esc(p.name)}</b><small>${esc(p.house || '')} · ${esc(p.type)}</small>
            <span class="p-meta">${p.price == null ? 'By invitation' : money(p.price)}${p.featured ? ' · Featured' : ''}${p.active ? '' : ' · Hidden'}</span></div>
          <button class="btn btn-sm" data-edit>Edit</button>
        </article>`).join('')}</section>`;
    $('#p-new').onclick = () => editProduct(null);
    $$('[data-edit]').forEach((b) => (b.onclick = () => editProduct(state.products.find((p) => p.id === b.closest('.p-tile').dataset.id))));
  }

  function modal(html) {
    const m = document.createElement('div');
    m.className = 'adm-modal';
    m.innerHTML = `<div class="adm-sheet" role="dialog" aria-modal="true"><button class="adm-x" aria-label="Close">×</button>${html}</div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    $('.adm-x', m).onclick = close;
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    return { el: m, close };
  }

  function editProduct(p) {
    const isNew = !p;
    p = p || { id: '', name: '', house: 'Giberish', type: 'perfume', size: '60 ml · Eau de Parfum', price: null, image: '', tagline: '', story: '',
      notes: { top: [], heart: [], base: [] }, ingredients: [], feel: [], featured: false, sound: '', sort: (state.products.length + 1) * 10, active: true };
    const notes = p.notes || {};
    const { el, close } = modal(`
      <h2>${isNew ? 'Add a product' : esc(p.name)}</h2>
      <form class="adm-form grid" id="pf">
        <label>Name<input name="name" required maxlength="80" value="${esc(p.name)}"></label>
        <label>Web address id<input name="id" required pattern="[a-z0-9-]{2,60}" value="${esc(p.id)}" ${isNew ? '' : 'readonly'} title="Lower-case letters, numbers and dashes"><small>${isNew ? 'Made from the name; used in links. It can’t be changed later.' : 'Used in links; it can’t be changed.'}</small></label>
        <label>House / brand<input name="house" value="${esc(p.house)}"></label>
        <label>Type<select name="type">${['perfume', 'attar', 'ritual'].map((t) => `<option ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Size<input name="size" value="${esc(p.size)}" placeholder="60 ml · Eau de Parfum"></label>
        <label>Price (₹)<input name="price" type="number" min="0" step="1" value="${p.price == null ? '' : p.price}" placeholder="Empty = By invitation"></label>
        <label class="full">Tagline<input name="tagline" value="${esc(p.tagline)}"></label>
        <label class="full">Story<textarea name="story" rows="4">${esc(p.story)}</textarea></label>
        <label>Top notes<input name="top" value="${esc((notes.top || []).join(', '))}" placeholder="Saffron, Black Pepper"></label>
        <label>Heart notes<input name="heart" value="${esc((notes.heart || []).join(', '))}"></label>
        <label>Base notes<input name="base" value="${esc((notes.base || []).join(', '))}"></label>
        <label>How it feels<input name="feel" value="${esc((p.feel || []).join(', '))}" placeholder="Bold, Warm, Lasting"></label>
        <fieldset class="full"><legend>Ingredients for the animations and matching (Feel it, Kundli, Layering)</legend>
          <div class="ing-pick">${state.notes.map((n) => `<label class="${(p.ingredients || []).includes(n.key) ? 'on' : ''}"><input type="checkbox" value="${esc(n.key)}" ${(p.ingredients || []).includes(n.key) ? 'checked' : ''}>${art(n)}${esc(n.label)}</label>`).join('')}</div></fieldset>
        <div class="full img-row"><div class="p-img big">${p.image ? `<img src="${esc(p.image)}" alt="">` : ''}</div>
          <label>Photo (transparent PNG or WebP cut-out works best)<input name="image" value="${esc(p.image)}" placeholder="assets/img/hd/… or an uploaded link"><input type="file" id="pf-file" accept="image/png,image/webp,image/jpeg"></label></div>
        <label>Soundscape<select name="sound">${SOUNDS.map((s) => `<option value="${s}" ${(p.sound || '') === s ? 'selected' : ''}>${s || 'Automatic'}</option>`).join('')}</select></label>
        <label>Order on the site<input name="sort" type="number" step="1" value="${p.sort}"></label>
        <label class="adm-check"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Featured</label>
        <label class="adm-check"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> Show on the website</label>
        <p class="adm-err full"></p>
        <div class="full adm-actions"><button class="btn btn-solid" type="submit">Save</button>${isNew ? '' : '<button class="btn btn-ghost danger" type="button" id="pf-del">Delete</button>'}</div>
      </form>`);
    const f = $('#pf', el);
    if (isNew) f.name.oninput = () => { f.id.value = f.name.value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); };
    $$('.ing-pick input', el).forEach((c) => (c.onchange = () => c.parentNode.classList.toggle('on', c.checked)));
    $('#pf-file', el).onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (!f.id.value) { $('.adm-err', el).textContent = 'Give the product a name first.'; return; }
      try {
        $('.adm-err', el).textContent = 'Uploading…';
        const url = await api.upload(file, `${f.id.value}-${Date.now()}.${(file.name.split('.').pop() || 'png').toLowerCase()}`);
        f.image.value = url; $('.p-img.big', el).innerHTML = `<img src="${esc(url)}" alt="">`; $('.adm-err', el).textContent = '';
      } catch (err) { $('.adm-err', el).textContent = err.message; }
    };
    const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
    f.onsubmit = async (e) => {
      e.preventDefault();
      const row = { id: f.id.value.trim(), name: f.name.value.trim(), house: f.house.value.trim() || null, type: f.type.value, size: f.size.value.trim() || null,
        price: f.price.value === '' ? null : Math.round(Number(f.price.value)), image: f.image.value.trim() || null, tagline: f.tagline.value.trim() || null,
        story: f.story.value.trim() || null, notes: { top: list(f.top.value), heart: list(f.heart.value), base: list(f.base.value) },
        ingredients: $$('.ing-pick input:checked', el).map((c) => c.value), feel: list(f.feel.value), featured: f.featured.checked,
        sound: f.sound.value || null, sort: Number(f.sort.value) || 100, active: f.active.checked };
      if (!/^[a-z0-9-]{2,60}$/.test(row.id)) { $('.adm-err', el).textContent = 'The web address id needs 2–60 lower-case letters, numbers or dashes.'; return; }
      if (isNew && state.products.some((x) => x.id === row.id)) { $('.adm-err', el).textContent = 'A product with this id already exists.'; return; }
      try {
        const saved = await api.upsert('products', row);
        const i = state.products.findIndex((x) => x.id === saved.id);
        if (i < 0) state.products.push(saved); else state.products[i] = saved;
        state.products.sort((a, b) => a.sort - b.sort);
        close(); draw(); toast(`${saved.name} saved`);
      } catch (err) { $('.adm-err', el).textContent = err.message; }
    };
    const del = $('#pf-del', el);
    if (del) del.onclick = async () => {
      if (!confirm(`Delete ${p.name} for good? To take it off the website but keep it, untick “Show on the website” instead.`)) return;
      try { await api.remove('products', 'id', p.id); state.products = state.products.filter((x) => x.id !== p.id); close(); draw(); toast('Deleted'); } catch (err) { fail(err); }
    };
  }

  /* ---------- Notes ---------- */
  const art = (n) => (window.GibArt ? `<img class="n-art" src="${window.GibArt.url(((n.art && n.art[0]) || (window.GibArt.forIngredient(n.key) || ['musk'])[0]))}" alt="">` : '');
  function drawNotes() {
    $('#adm-main').innerHTML = `
      <section class="adm-bar"><p class="muted">Notes are the ingredients Giberish offers. They appear in Scent Alchemy, the bespoke Kundli attar and the animations. Family weights (0–1.5) decide how a note counts toward Floral, Woody and the rest.</p><button class="btn btn-sm btn-solid" id="n-new">Add note</button></section>
      <div class="n-wrap"><table class="n-tbl"><thead><tr><th></th><th>Key</th><th>Name</th><th>Layer</th><th>Art</th><th>Colour</th>${FAMS.map((f) => `<th title="${esc(window.GIB_FAMILIES[f].label)}">${esc(window.GIB_FAMILIES[f].label.slice(0, 5))}</th>`).join('')}<th>Order</th><th>Show</th><th></th></tr></thead>
      <tbody>${state.notes.map(noteRow).join('')}</tbody></table></div>`;
    $('#n-new').onclick = () => {
      if ($('tr[data-key=""]')) return;
      $('.n-tbl tbody').insertAdjacentHTML('afterbegin', noteRow({ key: '', label: '', family: {}, tier: 'heart', art: null, color: null, sort: 100, active: true }, true));
      wireNotes(); $('tr[data-key=""] input[name=key]').focus();
    };
    wireNotes();
  }
  function noteRow(n, isNew) {
    const fam = n.family || {};
    return `<tr data-key="${esc(isNew ? '' : n.key)}" class="${n.active ? '' : 'off'}">
      <td>${art(n)}</td>
      <td><input name="key" value="${esc(n.key)}" ${isNew ? 'placeholder="mango" pattern="[a-z0-9]{2,30}"' : 'readonly'} size="10"></td>
      <td><input name="label" value="${esc(n.label)}" size="14" required></td>
      <td><select name="tier">${['top', 'heart', 'base'].map((t) => `<option ${n.tier === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><select name="art"><option value="">Auto</option>${ART.map((k) => `<option ${n.art && n.art[0] === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>
      <td><input name="color" type="color" value="${esc(n.color || '#d4a957')}" data-set="${n.color ? 1 : ''}"></td>
      ${FAMS.map((f) => `<td><input name="f_${f}" type="number" min="0" max="1.5" step=".1" value="${fam[f] != null ? fam[f] : ''}" class="w"></td>`).join('')}
      <td><input name="sort" type="number" value="${n.sort}" class="w"></td>
      <td><input name="active" type="checkbox" ${n.active ? 'checked' : ''}></td>
      <td><button class="btn btn-sm" data-save disabled>Save</button></td>
    </tr>`;
  }
  function wireNotes() {
    $$('.n-tbl tbody tr').forEach((tr) => {
      if (tr.wired) return; tr.wired = true;
      const btn = $('[data-save]', tr);
      $$('input, select', tr).forEach((i) => i.addEventListener('input', () => { btn.disabled = false; if (i.name === 'color') i.dataset.set = 1; }));
      btn.onclick = async () => {
        const v = (k) => $(`[name=${k}]`, tr);
        const family = {}; FAMS.forEach((f) => { const x = parseFloat(v('f_' + f).value); if (x > 0) family[f] = Math.min(1.5, x); });
        const row = { key: v('key').value.trim().toLowerCase(), label: v('label').value.trim(), tier: v('tier').value, art: v('art').value ? [v('art').value] : null,
          color: v('color').dataset.set ? v('color').value : null, family, sort: Number(v('sort').value) || 100, active: v('active').checked };
        if (!/^[a-z0-9]{2,30}$/.test(row.key)) return toast('The key needs 2–30 lower-case letters or numbers, e.g. mango', true);
        if (!row.label) return toast('Give the note a name', true);
        if (!Object.keys(family).length) return toast('Give the note at least one family weight', true);
        if (!tr.dataset.key && state.notes.some((n) => n.key === row.key)) return toast('That key is already used', true);
        try {
          const saved = await api.upsert('notes', row);
          const i = state.notes.findIndex((n) => n.key === saved.key);
          if (i < 0) state.notes.push(saved); else state.notes[i] = saved;
          state.notes.sort((a, b) => a.sort - b.sort);
          draw(); toast(`${saved.label} saved`);
        } catch (e) { fail(e); }
      };
    });
  }

  /* ---------- Start ---------- */
  window.GibAdmin = {
    async start(backend) {
      api = backend;
      if (location.hash.includes('type=recovery')) { api.onAuth(() => {}); return newPassword(); }
      api.onAuth((ev) => { if (ev === 'PASSWORD_RECOVERY') newPassword(); if (ev === 'SIGNED_OUT') login(); });
      await enter();
    },
  };
  document.addEventListener('DOMContentLoaded', () => {
    if (window.GibAdmin.started) return;
    const cfg = (window.GIB_CONFIG || {}).supabase || {};
    if (!cfg.url || !cfg.key || !window.supabase) return setupNeeded();
    window.GibAdmin.start(supabaseBackend(cfg)).catch(fail);
  });
})();
