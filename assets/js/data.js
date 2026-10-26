/* ============================================================
   GIBERISH — catalogue & store settings
   Edit prices, notes and stories here. Everything on the site
   (shop, scent experience, Scent Kundli matching) reads from this file.
   ============================================================ */

window.GIB_CONFIG = {
  currency: '₹',
  // WhatsApp number that receives orders, in international format without "+" (e.g. "919876543210").
  whatsappNumber: '919016995128', // +91 90169 95128
  // Razorpay public key ("rzp_live_..." / "rzp_test_..."). Leave empty to hide online payment.
  razorpayKey: '',
  freeShippingAbove: 999,
  shippingFee: 79,
  bespokePrice: 1499,
  instagram: 'https://instagram.com/gibberish_perfume',
  instagramHandle: 'gibberish_perfume',
  whatsappDisplay: '+91 90169 95128',
  // Database (Supabase, free plan). Paste the Project URL and the publishable ("anon") key from
  // Supabase → Project Settings → API. The key is meant to be public: the security rules in
  // supabase/schema.sql decide what it can do. Leave them empty and nothing is saved.
  supabase: { url: 'https://qibtiywuhbqlftgxicvz.supabase.co', key: 'sb_publishable_3FDXazct7muqlzGe0drldA_1j2gvuqn' },
  // Festive offer. It switches itself on and off by date (India time, both days included).
  // Set `offer: null` to turn it off early; change the dates and words for the next festival.
  offer: {
    id: 'diwali-2026',
    name: 'Diwali offer',
    short: 'Diwali',      // used on the small badge: "Diwali · 2 for ₹800"
    start: '2026-10-26',
    end: '2026-11-11',
    pairPrice: 800,       // any two eligible perfumes
    types: ['perfume'],   // which product types count (only priced ones; Kaaf "by invitation" is excluded)
    freeShipping: true,   // orders with at least one pair ship free
  },
};

/* Optional HD ingredient photos. The site uses hand-drawn vector art by default.
   Add square, transparent PNGs here to swap them in everywhere (animations keep working):
   e.g. orange: 'assets/img/ingredients/orange.png', rose: '…', petal: '…', honey: '…' */
window.GIB_INGREDIENT_PHOTOS = {};

/* Ingredient palette used by the "Feel it" animation and the note chips.
   `family` drives the Scent Kundli matching. `color` (optional) tints the note in Scent Alchemy. */
window.GIB_INGREDIENTS = {
  rose:       { label: 'Rose',        family: { floral: 1 } },
  jasmine:    { label: 'Jasmine',     family: { floral: 1 } },
  oud:        { label: 'Oud',         family: { woody: 1, amber: .3 } },
  sandalwood: { label: 'Sandalwood',  family: { woody: 1, musk: .3 } },
  cedar:      { label: 'Cedarwood',   family: { woody: 1 } },
  saffron:    { label: 'Saffron',     family: { spicy: 1, amber: .3 } },
  amber:      { label: 'Amber',       family: { amber: 1 } },
  musk:       { label: 'White Musk',  family: { musk: 1 } },
  vanilla:    { label: 'Vanilla',     family: { amber: .7, musk: .4 } },
  citrus:     { label: 'Citrus',      family: { fresh: 1 } },
  cardamom:   { label: 'Cardamom',    family: { spicy: .8, fresh: .4 } },
  leather:    { label: 'Leather',     family: { woody: .5, spicy: .6 } },
  smoke:      { label: 'Incense',     family: { woody: .5, amber: .6 } },
  green:      { label: 'Green Leaves', family: { fresh: 1 } },

  // Fruit & flower
  apple:        { label: 'Green Apple',      family: { fruity: 1, fresh: .5 }, color: '#9ccf4f' },
  peach:        { label: 'Peach',            family: { fruity: 1, floral: .2 }, color: '#f2a07a' },
  raspberry:    { label: 'Raspberry',        family: { fruity: 1, floral: .2 }, color: '#d23a5e' },
  blackcurrant: { label: 'Blackcurrant',     family: { fruity: .9, fresh: .4 }, color: '#6b3a8c' },
  bergamot:     { label: 'Bergamot',         family: { fresh: 1, fruity: .3 }, color: '#c7d65a' },
  peony:        { label: 'White Peony',      family: { floral: 1, fresh: .3 }, color: '#f3d9dc' },
  orangeblossom:{ label: 'Orange Blossom',   family: { floral: 1, fresh: .3 }, color: '#f7ecd2' },
  orchid:       { label: 'Wild Orchid',      family: { floral: 1, gourmand: .2 }, color: '#c75bb8' },
  // Sweet indulgence
  candy:        { label: 'Cotton Candy',     family: { gourmand: 1, fruity: .2 }, color: '#f4a6c8' },
  marshmallow:  { label: 'Marshmallow',      family: { gourmand: 1, musk: .4 }, color: '#f6e8ee' },
  tonka:        { label: 'Tonka Bean',       family: { gourmand: .8, amber: .5 }, color: '#9a6a42' },
  caramel:      { label: 'Caramel',          family: { gourmand: 1, amber: .4 }, color: '#d99a45' },
  cocoa:        { label: 'Dark Cocoa',       family: { gourmand: 1, woody: .3 }, color: '#6e4630' },
  coffee:       { label: 'Espresso',         family: { gourmand: .8, woody: .3, spicy: .2 }, color: '#7a4e2e' },
  praline:      { label: 'Hazelnut Praline', family: { gourmand: 1, amber: .3 }, color: '#c08a52' },
  // Deep roots
  cashmere:     { label: 'Cashmere Wood',    family: { woody: .8, musk: .5 }, color: '#e2d3bc' },
  vetiver:      { label: 'Vetiver',          family: { woody: .9, fresh: .3 }, color: '#a89a55' },
};

/* NOTE for the Giberish team: notes marked in the poster artwork are used as-is
   (Kaaf, Barakkat Rouge 540). Others are best-guess placeholders — please confirm. */
window.GIB_PRODUCTS = [
  {
    id: 'giberish-signature',
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Giberish Signature',
    house: 'Giberish',
    type: 'attar',
    size: 'Attar',
    price: null,
    image: 'assets/img/hd/giberish-signature.webp',
    tagline: 'Pure. Rare. Timeless.',
    story: 'Our first and quietest creation. Kept in a domed vessel the way old perfumers kept their most precious oils. It isn’t something you wear for others. You wear it for the moment after the noise stops.',
    notes: { top: ['Saffron'], heart: ['Rose', 'Oud'], base: ['Sandalwood', 'Amber'] },
    ingredients: ['oud', 'rose', 'saffron', 'sandalwood', 'amber'],
    feel: ['Still', 'Whole', 'Timeless'],
    featured: true,
  },
  {
    id: 'barakkat-rouge-540',
    world: 'bazaar', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Barakkat Rouge 540',
    house: 'Giberish Luxury Perfumes',
    type: 'perfume',
    size: '60 ml · Eau de Parfum',
    price: 600,
    image: 'assets/img/hd/barakkat-rouge.webp',
    tagline: 'Luxury in every drop.',
    story: 'Inspired by the legendary Rouge 540. Saffron threads catch the light, jasmine opens like a held breath, and cedarwood and amber stay on your skin like a warm hand. People will ask what you’re wearing.',
    notes: { top: ['Saffron'], heart: ['Jasmine'], base: ['Amber', 'Cedarwood'] },
    ingredients: ['saffron', 'jasmine', 'amber', 'cedar', 'rose'],
    feel: ['Radiant', 'Magnetic', 'Unforgettable'],
    featured: true,
  },
  {
    id: 'kaaf',
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Kaaf',
    house: 'Ahmad Al Maghribi',
    type: 'perfume',
    size: '60 ml · Extrait de Parfum',
    price: null,
    image: 'assets/img/hd/kaaf.webp',
    tagline: 'Not just a fragrance. A statement.',
    story: 'A journey into the soul of Arabian heritage. Kaaf opens bright with citrus, spice and cardamom, then deepens into oud, leather and florals before settling into amber, musk, patchouli and vanilla. It lasts 10 to 12 hours, long after you’ve left.',
    notes: { top: ['Citrus', 'Spices', 'Cardamom'], heart: ['Oud', 'Leather', 'Floral'], base: ['Amber', 'Musk', 'Patchouli', 'Vanilla'] },
    ingredients: ['citrus', 'cardamom', 'oud', 'leather', 'amber', 'vanilla'],
    feel: ['Bold', 'Refined', 'Unforgettable'],
    featured: true,
  },
  {
    id: 'fahad',
    world: 'desert', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Fahad',
    house: 'Lattafa',
    type: 'perfume',
    size: '60 ml · Eau de Parfum',
    price: 600,
    image: 'assets/img/hd/fahad.webp',
    tagline: 'A fragrance that speaks before you do.',
    story: 'Bold, masculine, timeless. Fahad means “leopard”, and it moves like one: quiet, certain and impossible to ignore. We wore it for weeks before we chose it for you.',
    notes: { top: ['Cardamom'], heart: ['Leather', 'Oud'], base: ['Amber'] },
    ingredients: ['cardamom', 'leather', 'oud', 'amber', 'smoke'],
    feel: ['Confident', 'Grounded', 'Powerful'],
    featured: true,
  },
  {
    id: 'white-oud',
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'White Oud',
    house: 'Eau de Parfum',
    type: 'perfume',
    size: 'Eau de Parfum',
    price: 470,
    image: 'assets/img/hd/white-oud.webp',
    tagline: 'Oud, dressed in silk.',
    story: 'For those who think oud is too heavy. Here the dark wood is softened with rose, vanilla and clean musk. It’s gentle enough for the office and memorable enough for the evening.',
    notes: { top: ['Rose'], heart: ['Oud'], base: ['Vanilla', 'White Musk'] },
    ingredients: ['oud', 'rose', 'vanilla', 'musk'],
    feel: ['Soft', 'Elegant', 'Serene'],
  },
  {
    id: 'viking-creed',
    world: 'monsoon', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Viking Creed',
    house: 'Eau de Parfum',
    type: 'perfume',
    size: 'Eau de Parfum',
    price: 470,
    image: 'assets/img/hd/viking-creed.webp',
    tagline: 'For the one who leads.',
    story: 'Bright citrus and a trace of smoked wood, like a fire on a cold northern shore. Wear it on days when you need to walk in first and speak last.',
    notes: { top: ['Citrus'], heart: ['Smoked Birch'], base: ['Musk', 'Sandalwood'] },
    ingredients: ['citrus', 'smoke', 'musk', 'sandalwood'],
    feel: ['Fearless', 'Fresh', 'Driven'],
  },
  {
    id: 'liquid-burn',
    sound: 'fire', // GibSound theme for this fragrance
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Liquid Burn',
    house: 'French Avenue',
    type: 'perfume',
    size: '60 ml · Eau de Parfum',
    price: 600,
    image: 'assets/img/hd/liquid-burn.webp',
    tagline: 'More than a fragrance. It’s a feeling.',
    story: 'A powerful blend of spices, woods and warmth. Saffron and black pepper strike first like a match, then smouldering woods and amber glow on for hours. Liquid Burn is for those who leave a lasting impression.',
    // from the poster: spices, woods and warmth (saffron, black pepper and wood shown). Exact notes to confirm.
    notes: { top: ['Saffron', 'Black Pepper'], heart: ['Spices'], base: ['Woods', 'Amber'] },
    ingredients: ['saffron', 'cardamom', 'smoke', 'cedar', 'amber'],
    feel: ['Bold', 'Intense', 'Lasting'],
  },
  {
    id: 'green-irish',
    sound: 'forest', // GibSound theme for this fragrance
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Green Irish',
    house: 'Giberish',
    type: 'perfume',
    size: '60 ml · Men’s Perfume',
    price: 600,
    image: 'assets/img/hd/green-irish.webp',
    tagline: 'Fresh. Refined. Timeless.',
    story: 'Rain on green hills, a walk through wet grass, a freshly pressed shirt. Green Irish opens with bright citrus and crushed leaves, then settles into a soft, woody calm. Fresh enough for every day, refined enough to be remembered.',
    // best-guess notes in the classic green, fresh style. Please confirm.
    notes: { top: ['Citrus', 'Green Leaves'], heart: ['Violet Leaf', 'Iris'], base: ['Sandalwood', 'Ambergris'] },
    ingredients: ['citrus', 'green', 'sandalwood', 'musk', 'amber'],
    feel: ['Fresh', 'Refined', 'Timeless'],
  },
  {
    id: 'ajmal-1001-night',
    world: 'garden', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: '1001 Night',
    house: 'Ajmal · Attar',
    type: 'attar',
    size: '3 ml · Attar',
    price: 330,
    image: 'assets/img/hd/ajmal-1001-night.webp',
    tagline: 'A story that never ends.',
    story: 'Like Scheherazade’s tales, this attar unfolds slowly: rose at dusk, oud at midnight, and amber when the lamps burn low. One touch on the wrist is enough.',
    notes: { top: ['Saffron'], heart: ['Rose'], base: ['Oud', 'Amber'] },
    ingredients: ['rose', 'oud', 'amber', 'saffron'],
    feel: ['Dreamy', 'Romantic', 'Mysterious'],
  },
  {
    id: 'al-bakhoor',
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Al-Bakhoor',
    house: 'Attar',
    type: 'attar',
    size: '6 ml · Attar',
    price: 300,
    image: 'assets/img/hd/al-bakhoor.webp',
    tagline: 'The smoke of a thousand prayers.',
    story: 'The scent of incense curling up through an old courtyard. Smoky, resinous and calming, it’s the attar you reach for before you sit in silence.',
    notes: { top: ['Incense'], heart: ['Oud'], base: ['Sandalwood', 'Amber'] },
    ingredients: ['smoke', 'oud', 'sandalwood', 'amber'],
    feel: ['Sacred', 'Calm', 'Centred'],
  },
  {
    id: 'hajar-al-aswad',
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Hajar Al Aswad',
    house: 'Attar',
    type: 'attar',
    size: '3 ml · Attar',
    price: 330,
    image: 'assets/img/hd/hajar-al-aswad.webp',
    tagline: 'Dark, deep, devoted.',
    story: 'Named after the black stone, this attar is warm and resinous with a quiet sweetness at its core. It sits close to the skin and stays there all day like a prayer.',
    notes: { top: ['Saffron'], heart: ['Oud', 'Leather'], base: ['Amber', 'Musk'] },
    ingredients: ['oud', 'amber', 'musk', 'leather', 'saffron'],
    feel: ['Devoted', 'Warm', 'Deep'],
  },
  {
    id: 'musk-gold',
    world: 'silk', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Musk Gold Premium',
    house: 'Attar',
    type: 'attar',
    size: '3 ml · Attar',
    price: 330,
    image: 'assets/img/hd/musk-gold.webp',
    tagline: 'Like clean skin in sunlight.',
    story: 'Soft white musk, a little vanilla and a glow of amber. It smells like your own skin on its best day. People lean in without knowing why.',
    notes: { top: ['Jasmine'], heart: ['White Musk'], base: ['Vanilla', 'Amber'] },
    ingredients: ['musk', 'vanilla', 'amber', 'jasmine'],
    feel: ['Pure', 'Tender', 'Glowing'],
  },
  {
    id: 'mukhallat-malaki',
    world: 'bazaar', // Scent Worlds scene (and soundscape)
    nozzle: [.5, .02], // where the spray starts, as a fraction of the cut-out image
    name: 'Mukhallat Malaki',
    house: 'Attar',
    type: 'attar',
    size: '6 ml · Attar',
    price: 300,
    image: 'assets/img/hd/mukhallat-malaki.webp',
    tagline: 'A royal blend.',
    story: '“Mukhallat” means blend and “Malaki” means royal. Rose, saffron, oud and sandalwood are layered the way palace perfumers did it: richly, patiently and without hurry.',
    notes: { top: ['Saffron'], heart: ['Rose'], base: ['Oud', 'Sandalwood'] },
    ingredients: ['rose', 'saffron', 'oud', 'sandalwood'],
    feel: ['Regal', 'Rich', 'Gracious'],
  },
  {
    id: 'celoud',
    nozzle: [.64, .01], // where the spray starts, as a fraction of the cut-out image
    name: 'Celoud',
    house: 'Naseem · Attar',
    type: 'attar',
    size: '3 ml · Stick bottle',
    price: 250,
    image: 'assets/img/hd/celoud.webp',
    tagline: 'Feel the royal touch.',
    story: 'A rich, royal oud in a new stick bottle that slips into any pocket. Agarwood and white blossoms make a small, private luxury you can carry all day.',
    notes: { top: ['Jasmine'], heart: ['Rose'], base: ['Oud'] },
    ingredients: ['oud', 'jasmine', 'rose'],
    feel: ['Royal', 'Fresh', 'Assured'],
  },
  {
    id: 'bakhoor-dani',
    nozzle: [.5, .07], // where the spray starts, as a fraction of the cut-out image
    name: 'Bakhoor Dani',
    house: 'Giberish Home Ritual',
    type: 'ritual',
    size: 'Incense burner',
    price: 550,
    image: 'assets/img/hd/bakhoor-dani.webp',
    tagline: 'Bring the temple home.',
    story: 'A hand-finished burner for bakhoor and oud chips. Light it at dusk, let the smoke find every corner and watch your home slow down. This is where every Giberish ritual begins.',
    notes: { top: ['Incense'], heart: ['Oud'], base: ['Amber'] },
    ingredients: ['smoke', 'oud', 'amber', 'sandalwood'],
    feel: ['Peaceful', 'Sacred', 'Home'],
  },
];

window.GIB_FAMILIES = {
  floral:   { label: 'Floral',   color: '#e07a8f' },
  fruity:   { label: 'Fruity',   color: '#ee8a5a' },
  woody:    { label: 'Woody',    color: '#b07a4a' },
  amber:    { label: 'Amber',    color: '#e0a443' },
  gourmand: { label: 'Gourmand', color: '#c98d52' },
  fresh:    { label: 'Fresh',    color: '#9fcf8a' },
  musk:     { label: 'Musk',     color: '#efe6d6' },
  spicy:    { label: 'Spice',    color: '#d0582f' },
};

window.gibProductFamily = function (p) {
  const v = Object.fromEntries(Object.keys(window.GIB_FAMILIES).map((k) => [k, 0]));
  p.ingredients.forEach((k) => {
    const f = (window.GIB_INGREDIENTS[k] || {}).family || {};
    Object.keys(f).forEach((fam) => (v[fam] += f[fam]));
  });
  const max = Math.max(...Object.values(v)) || 1;
  Object.keys(v).forEach((k) => (v[k] = v[k] / max));
  return v;
};

/* Which immersive "world" and soundscape suit a product (used by Scent Worlds, Journey, sound toggles).
   Worlds: desert (oud, woods & sweets) · garden (florals & fruits) · bazaar (spice & saffron)
           monsoon (fresh & citrus) · silk (musks) · temple (incense & bakhoor)
   Set `world: '…'` on a product to override. */
window.gibProductWorld = function (p) {
  if (p.world) return p.world;
  if (p.type === 'ritual' || p.ingredients.includes('smoke')) return 'temple';
  const f = window.gibProductFamily(p);
  const top = Object.keys(f).sort((a, b) => f[b] - f[a])[0];
  return { woody: 'desert', amber: 'desert', gourmand: 'desert', floral: 'garden', fruity: 'garden', spicy: 'bazaar', fresh: 'monsoon', musk: 'silk' }[top] || 'desert';
};
window.gibProductSound = function (p) {
  if (p.sound) return p.sound;
  const w = window.gibProductWorld(p);
  if (w === 'desert') { const f = window.gibProductFamily(p); return f.amber > f.woody ? 'fire' : 'night'; }
  return { garden: 'forest', bazaar: 'bazaar', monsoon: 'sea', silk: 'silk', temple: 'temple' }[w] || 'breeze';
};

/* The festive offer, if it is running right now (else null), and whether a product counts toward it. */
window.gibOffer = function (now = new Date()) {
  const o = window.GIB_CONFIG.offer;
  if (!o) return null;
  const from = new Date(o.start + 'T00:00:00+05:30'), to = new Date(o.end + 'T23:59:59+05:30');
  return now >= from && now <= to ? Object.assign({ endsAt: to }, o) : null;
};
window.gibOfferEligible = function (p) {
  const o = window.gibOffer();
  return !!(o && p && p.price != null && o.types.includes(p.type));
};

/* The catalogue can come from the database: api/catalog (a Vercel function that reads Supabase) loads right
   after this file and calls gibApplyCatalog(). Everything above stays as the fallback when it can't. */
window.GIB_BUILTIN_NOTES = Object.keys(window.GIB_INGREDIENTS);
window.gibApplyCatalog = function (c) {
  if (!c || !c.products || !c.products.length || !c.notes || !Object.keys(c.notes).length) return;
  window.GIB_INGREDIENTS = c.notes;
  window.GIB_PRODUCTS = c.products.map((p) => Object.assign(p, { ingredients: (p.ingredients || []).filter((k) => c.notes[k]) }));
  window.GIB_CATALOG_SOURCE = 'database';
};

