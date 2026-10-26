# Giberish — website

A static, mobile-first site for Giberish. It uses plain HTML, CSS and JavaScript with GSAP for the scroll story, so there is no build step. You can host it anywhere: Netlify, Vercel, GitHub Pages or any web host.

## Run it locally

```bash
python3 -m http.server 5880
```

Then open http://localhost:5880.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Hero, a scroll story about the philosophy (Noise → Letting go → Silence → Essence), the three truths, featured fragrances, the "Feel it" banner, the Scent Kundli teaser, the breathing ritual and the bakhoor banner |
| `shop.html` | The collection in three chapters (Attars, Perfumes, Home Rituals), with category and mood filters |
| `about.html` | The full philosophy: the word, the laughing Buddha, the way of attar and our promise |
| `kundli.html` | **Scent Kundli**: a 10-question scent horoscope. It gives an archetype, a chart, top matches, a shareable story image and a bespoke attar you can order |
| `checkout.html` | Bag, address, gift note, then an order on WhatsApp or online payment through Razorpay |
| `explore.html` | The Experiences hub, linked from the "Experiences" menu |
| `worlds.html?p=<id>` | **Scent Worlds**: each fragrance in its own world (desert, garden, bazaar, monsoon, silk, temple). Set `world:` on a product in data.js to choose its world |
| `alchemy.html` | **Scent Alchemy**: drag notes into a glass orb, see matching fragrances, order the blend |
| `boutique.html` | **The Boutique**: a 3D virtual showroom (three.js), with a 2D gallery fallback |
| `layering.html` | **Layering Lab**: pair two fragrances, with a harmony score and suggested pairings |
| `journey.html?p=<id>` | **Scent Journey**: how top, heart and base notes unfold over time |
| `whispers.html` | **Whispers**: 113 small truths about scent (science, memory research, heritage, old wisdom, the ritual, Giberish lines), revealed one at a time with drifting ingredients. Edit them in `assets/js/whispers-data.js`; `whispers.html#w=12` links to one |
| `atlas.html` | **The Scent Atlas**: an illustrated guide to the natural and synthetic materials perfumers use. It has an animated note pyramid, a family wheel, the ways scent is extracted, and a searchable library with a detail page for each material. `atlas.html#m=vetiver` opens one material and `atlas.html?q=rose` opens a search |

Tapping any bottle opens the **Feel it** experience: the ingredients bloom and orbit the bottle, it sprays, and the person breathes in, closes their eyes and smiles. You can link straight to it with `any-page.html#feel=<product-id>`.

## Before going live

All settings are in **`assets/js/data.js`**:

1. **Orders** come in on WhatsApp (`whatsappNumber`, currently +91 90169 95128) or Instagram (`instagramHandle`, currently @gibberish_perfume). At checkout, WhatsApp opens with the order typed out. Instagram opens a chat with the order copied, so the customer only has to paste it.
2. `razorpayKey` (optional): adding a Razorpay key shows an extra "Pay online" option at checkout. For production, create orders on a small server and verify the payment signature.
3. **Prices**: *Giberish Signature* and *Kaaf* have `price: null`, so they show "By invitation" with a waitlist button. Add their prices to sell them.
4. **Notes**: notes for Kaaf and Barakkat Rouge 540 come from your posters. The other notes are placeholders, so please confirm them.
5. `bespokePrice`: the Scent Kundli bespoke attar is set to ₹1,499 for 6 ml, which is a placeholder.
6. **Photos**: bottles are cut out of your posters and upscaled (`assets/img/hd/`). The five attars and Viking Creed / White Oud come from the small catalogue image, so real studio photos will look sharper. Replace them with the tool below.

## Adding or replacing a product photo

`tools/lift.swift` uses macOS's built-in subject lifting to cut a bottle out of any photo (transparent PNG) and upscale it:

```bash
swift tools/lift.swift ~/Desktop/new-bottle.jpg assets/img/hd/new-bottle.png --scale 2
```

Use `--crop x,y,w,h` to cut out just the bottle first, if the photo has other objects. Then make the WebP copy the site serves (the PNG stays as the fallback for old browsers):

```bash
npm install --no-save sharp
node tools/webp.mjs assets/img/hd/new-bottle.png
```

Set `image:` to the `.webp` file (for example `assets/img/hd/new-bottle.webp`) and `nozzle:` (where the spray starts, as a fraction of the image) for that product in `assets/js/data.js`. A `.png` path also works, it is just heavier.

Images are cached by browsers for a year, so give a replaced photo a **new file name** rather than overwriting the old one.

## Speed and search

- **Images** are served as WebP (AVIF for the large photos in the page HTML) with the original PNG/JPG as the fallback. Bottle cut-outs also have a 400px `-400.webp` copy for small cards.
- **Fonts** (Cormorant Garamond, Great Vibes, Jost) are self-hosted in `assets/fonts/`, so the first paint needs no Google Fonts connection. Hindi and Gujarati fonts still load from Google, only for visitors who pick those languages.
- **Translations** (`i18n-dict.js`, about 300 KB) load only for हि and ગુ visitors.
- Page scripts use `defer`. The Boutique is the only page that loads three.js; the Layering Lab loads `bottle3d.js` once the page is idle.
- **Sharing and search**: every page has a title, description, canonical link and Open Graph / Twitter tags with `assets/img/og-image.jpg` (1200×630). The shop and the Feel it overlay add schema.org Product data (price in INR) built from `data.js`. `sitemap.xml` and `robots.txt` are in the root.
- **The domain** is a placeholder until the site is live: `https://giberish.vercel.app`. It is written in the canonical, Open Graph and Twitter tags in every page head, the `index.html` JSON-LD, `sitemap.xml` and `robots.txt` (the Product data on the shop builds its URLs from the live address, so it needs no change). To switch, for example to `https://www.giberish.com`, run this once from the project folder:

```bash
grep -rl 'giberish.vercel.app' --include='*.html' --include='*.xml' --include='*.txt' . | xargs sed -i '' 's#https://giberish.vercel.app#https://www.giberish.com#g'
```

- **`vercel.json`** turns on clean URLs (`/shop` instead of `/shop.html`) and caches fonts and images for a year. CSS and JS are not cached long: their names don't change between deploys, so browsers check for a new version on each visit (a quick 304 when nothing changed). That way a price change in `data.js` reaches everyone straight away.

## Animation pieces

- `assets/js/art.js`: vector ingredient illustrations (orange, lemon, honey, honeycomb, rose, petal, jasmine, saffron, cinnamon, vanilla, star anise, cardamom, sandalwood, oud, amber, leaf, musk, smoke)
- `assets/js/scene.js`: the orbit and spray engine (`GibScene.mount`) and the living logo (`GibScene.emblem`)
- `assets/js/experience.js`: the "Feel it" overlay
- `assets/js/art.js` also holds the motion engine (`GibArt.draw`), which gives every ingredient its own movement: petals flip, citrus spins and drips juice, honey stretches and falls, saffron sways, oud and sandalwood leave smoke wisps, incense curls, jasmine blooms, musk pulses and amber glints.
- **Home intro**: darkness, then the backlit monk, then "Giberish" written in gold. It plays once per browser session (`sessionStorage`), and a tap, scroll or key skips it. To see it again, open the site in a new tab or private window.

## Swapping in HD ingredient photos

The ingredients are vector art. To use photos instead, add square, transparent PNGs to `GIB_INGREDIENT_PHOTOS` in `assets/js/data.js`, for example `orange: 'assets/img/ingredients/orange.png'`. Every animation keeps working with the photos.

## Shared Kundli blends

At the end of the Scent Kundli, visitors can fine-tune their bespoke attar (top, heart and base notes, and strength) and press **Share this blend**. The link (`kundli.html?blend=…`) holds the exact formula. Anyone who opens it sees that blend and can order the same bottle.

Every blend also has a short code, such as `GB-SAF-AMB-OUD-2` (top, heart, base, strength 1–3). The code is included in the order message, so you always know exactly what to make.

## Languages

There is an EN · हि · ગુ switch in the header. Pages are written in English, and `assets/js/i18n-dict.js` holds the Hindi and Gujarati text, keyed by the English. Anything missing simply stays in English. To find untranslated text on a page, open it with `?lang=hi` and run `GibI18n.missing()` in the browser console.

## Soundscapes

`assets/js/sound.js` generates calm background sound in the browser, so there are no audio files to host. The themes are sea waves, breeze, light rain, a stream, forest air with far chimes, temple bells, a still desert night, a fire crackle, a distant bazaar and a silky dawn. Nothing changes pitch, so nothing ever sounds like a siren. Sound only starts when a visitor presses a **Sound** button. The soundscape for each product follows its world.

## 3D bottles and world photos

- `assets/js/bottle3d.js` (`GibBottle3D`) builds a 3D glass-and-metal bottle for each product, with its label. The Boutique uses these bottles, and the Layering Lab uses them as thumbnails. On slow devices it steps down to simpler glass, then to the HD photos. Add `boutique.html?bottles=high|low|photo` to force one quality for testing.
- Scent Worlds uses 13 free-licence Unsplash photos in `assets/img/worlds/` (served as `.webp`). Photographer credits are in `assets/img/worlds/CREDITS.md`, and the world for each product is set in `assets/js/worlds.js`.

## The Scent Atlas

- The materials are in `assets/js/atlas-data.js` (`GIB_ATLAS`). Each one has its names (English, Latin, Indian, Hindi and Gujarati) and its family, plus how strongly it shows as a top, heart and base note (0–3). Each one also says where it comes from, how it is made, how it smells, what it pairs with, a fact, a safety note and its sources. Set `gib:` to an ingredient key from `data.js` to show the Giberish fragrances that contain that material.
- The page text (families, methods, glossary and safety cards) is in `assets/js/atlas.js`.
- Natural materials use free-licence Unsplash photos in `assets/img/atlas/`, with credits in `assets/img/atlas/CREDITS.md`. Synthetic molecules are drawn as gold line art from PubChem structures, which are public domain. To redraw them after you add a synthetic with a `cid`, run:

  ```bash
  node tools/molecule-svg.mjs --atlas
  ```

- Facts were checked against the sources listed with each material. Safety notes are general. IFRA standards change, so check the current IFRA amendment before you make a formula.

