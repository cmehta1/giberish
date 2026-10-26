/* ============================================================
   GIBERISH — database writes (Supabase REST, no library needed)
   Saves orders (checkout) and Scent Kundli readings. Settings: GIB_CONFIG.supabase in data.js.
   Visitors may only *add* rows; reading and changing them happens in admin.html.
   ============================================================ */
(function () {
  'use strict';
  const cfg = (window.GIB_CONFIG || {}).supabase || {};
  const on = !!(cfg.url && cfg.key);
  function insert(table, row) {
    if (!on) return Promise.resolve(false);
    const headers = { apikey: cfg.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    if (/^eyJ/.test(cfg.key)) headers.Authorization = 'Bearer ' + cfg.key; // older "anon" JWT keys also go here
    return fetch(cfg.url.replace(/\/+$/, '') + '/rest/v1/' + table, { method: 'POST', headers, body: JSON.stringify(row), keepalive: true })
      .then((r) => { if (!r.ok) r.text().then((t) => console.warn('Giberish: could not save to', table, r.status, t)); return r.ok; })
      .catch(() => false);
  }
  window.GibDB = { on, saveOrder: (o) => insert('orders', o), saveKundli: (k) => insert('kundlis', k) };
})();
