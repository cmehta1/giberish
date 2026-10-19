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
};

/* Optional HD ingredient photos. The site uses hand-drawn vector art by default.
   Add square, transparent PNGs here to swap them in everywhere (animations keep working):
   e.g. orange: 'assets/img/ingredients/orange.png', rose: '…', petal: '…', honey: '…' */
window.GIB_INGREDIENT_PHOTOS = {};

/* Ingredient palette used by the "Feel it" animation and the note chips.
   `family` drives the Scent Kundli matching. */
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
    image: 'assets/img/hd/giberish-signature.png',
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
    image: 'assets/img/hd/barakkat-rouge.png',
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
    image: 'assets/img/hd/kaaf.png',
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
    image: 'assets/img/hd/fahad.png',
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
    image: 'assets/img/hd/white-oud.png',
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
    image: 'assets/img/hd/viking-creed.png',
    tagline: 'For the one who leads.',
    story: 'Bright citrus and a trace of smoked wood, like a fire on a cold northern shore. Wear it on days when you need to walk in first and speak last.',
    notes: { top: ['Citrus'], heart: ['Smoked Birch'], base: ['Musk', 'Sandalwood'] },
    ingredients: ['citrus', 'smoke', 'musk', 'sandalwood'],
    feel: ['Fearless', 'Fresh', 'Driven'],
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
    image: 'assets/img/hd/ajmal-1001-night.png',
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
    image: 'assets/img/hd/al-bakhoor.png',
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
    image: 'assets/img/hd/hajar-al-aswad.png',
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
    image: 'assets/img/hd/musk-gold.png',
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
    image: 'assets/img/hd/mukhallat-malaki.png',
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
    image: 'assets/img/hd/celoud.png',
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
    image: 'assets/img/hd/bakhoor-dani.png',
    tagline: 'Bring the temple home.',
    story: 'A hand-finished burner for bakhoor and oud chips. Light it at dusk, let the smoke find every corner and watch your home slow down. This is where every Giberish ritual begins.',
    notes: { top: ['Incense'], heart: ['Oud'], base: ['Amber'] },
    ingredients: ['smoke', 'oud', 'amber', 'sandalwood'],
    feel: ['Peaceful', 'Sacred', 'Home'],
  },
];

window.GIB_FAMILIES = {
  floral: { label: 'Floral',  color: '#e07a8f' },
  woody:  { label: 'Woody',   color: '#b07a4a' },
  amber:  { label: 'Amber',   color: '#e0a443' },
  fresh:  { label: 'Fresh',   color: '#9fcf8a' },
  musk:   { label: 'Musk',    color: '#efe6d6' },
  spicy:  { label: 'Spice',   color: '#d0582f' },
};

window.gibProductFamily = function (p) {
  const v = { floral: 0, woody: 0, amber: 0, fresh: 0, musk: 0, spicy: 0 };
  p.ingredients.forEach((k) => {
    const f = (window.GIB_INGREDIENTS[k] || {}).family || {};
    Object.keys(f).forEach((fam) => (v[fam] += f[fam]));
  });
  const max = Math.max(...Object.values(v)) || 1;
  Object.keys(v).forEach((k) => (v[k] = v[k] / max));
  return v;
};

/* Which immersive "world" and soundscape suit a product (used by Scent Worlds, Journey, sound toggles).
   Worlds: desert (oud & woods, moonlit dunes) · garden (florals) · bazaar (spice & saffron)
           monsoon (fresh & citrus) · silk (musks) · temple (incense & bakhoor)
   Set `world: '…'` on a product to override. */
window.gibProductWorld = function (p) {
  if (p.world) return p.world;
  if (p.type === 'ritual' || p.ingredients.includes('smoke')) return 'temple';
  const f = window.gibProductFamily(p);
  const top = Object.keys(f).sort((a, b) => f[b] - f[a])[0];
  return { woody: 'desert', amber: 'desert', floral: 'garden', spicy: 'bazaar', fresh: 'monsoon', musk: 'silk' }[top] || 'desert';
};
window.gibProductSound = function (p) {
  const w = window.gibProductWorld(p);
  if (w === 'desert') { const f = window.gibProductFamily(p); return f.amber > f.woody ? 'fire' : 'night'; }
  return { garden: 'forest', bazaar: 'bazaar', monsoon: 'sea', silk: 'silk', temple: 'temple' }[w] || 'breeze';
};
