// Make the WebP copies the site serves from a PNG or JPG photo (the original stays as the fallback).
//   npm install --no-save sharp
//   node tools/webp.mjs assets/img/hd/new-bottle.png
// → new-bottle.webp (+ new-bottle-400.webp for a bottle cut-out wider than 400 px)
import sharp from 'sharp';
for (const src of process.argv.slice(2)) {
  const base = src.replace(/\.(png|jpe?g)$/i, '');
  const alpha = /\.png$/i.test(src);
  const { width } = await sharp(src).metadata();
  const webp = (p) => p.webp({ quality: alpha ? 82 : 78, alphaQuality: 90, effort: 6, smartSubsample: true });
  await webp(sharp(src)).toFile(`${base}.webp`);
  if (/\/hd\//.test(src) && width > 400) await webp(sharp(src).resize({ width: 400 })).toFile(`${base}-400.webp`);
  console.log(`${base}.webp`, `(${width} px wide)`);
}
