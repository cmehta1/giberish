/* ============================================================
   GIBERISH — calm, opt-in soundscapes (generated live with Web Audio, no audio files)
   Sound never starts on its own: only after the visitor presses a Sound button.
   Design rule: nothing ever glides in pitch (that is what sounds like a siren).
   Everything is soft noise (sea, wind, rain, water, fire) plus fixed-pitch bells and chimes.

   GibSound.play(theme) / stop() / setTheme(theme) / isOn()
   GibSound.mountToggle(parent, themeOrFn) → small "Sound" button
   GibSound.chime()                         → one soft temple bell (call only after a tap)
   Themes: sea breeze rain stream forest temple night fire bazaar silk
   (older names still work: desert→night, garden→forest, evening→fire)
   ============================================================ */
(function () {
  let ctx = null, master = null, verb = null, current = null, theme = null, on = false;
  const buttons = new Set();
  const ALIAS = { desert: 'night', garden: 'forest', evening: 'fire' };

  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    // a soft room for bells: short, low-feedback echoes
    verb = ctx.createGain(); verb.gain.value = 1;
    const d1 = ctx.createDelay(1); d1.delayTime.value = .19;
    const d2 = ctx.createDelay(1); d2.delayTime.value = .37;
    const fb = ctx.createGain(); fb.gain.value = .18;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const wet = ctx.createGain(); wet.gain.value = .32;
    verb.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(wet); wet.connect(master);
    return ctx;
  }

  let noiseCache = {};
  function noiseBuffer(type) {
    if (noiseCache[type]) return noiseCache[type];
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
      else { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .11; }
    }
    return (noiseCache[type] = buf);
  }
  // looping filtered noise; `swell` slowly breathes the volume (waves, gusts)
  function bed(out, { type = 'pink', filter = 'lowpass', freq = 1000, q = .7, gain = .1, swell = 0, depth = .6 }) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(type); src.loop = true;
    src.playbackRate.value = .9 + Math.random() * .2;
    const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(out); src.start();
    const nodes = [src];
    if (swell) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = swell; og.gain.value = gain * depth;
      o.connect(og); og.connect(g.gain); o.start(); nodes.push(o);
    }
    return nodes;
  }
  function every(ms, fn, jitter = 0) {
    let id; const tick = () => { fn(); id = setTimeout(tick, ms + Math.random() * jitter); };
    id = setTimeout(tick, 800 + Math.random() * ms * .6); return { stop: () => clearTimeout(id) };
  }
  // a fixed-pitch bell: inharmonic partials with a soft attack and a long, smooth decay
  function bell(out, f, gain = .05, decay = 6) {
    const t = ctx.currentTime;
    [[1, 1], [2.0, .35], [2.76, .28], [5.4, .08]].forEach(([m, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * a, t + .015);
      g.gain.exponentialRampToValueAtTime(.0001, t + decay / Math.sqrt(m));
      o.connect(g); g.connect(out); g.connect(verb); o.start(t); o.stop(t + decay + .2);
    });
  }
  // tiny burst of filtered noise: rain drop, ember crackle, pebble of water
  function tick(out, { freq = 4000, q = 2, gain = .03, len = .02 }) {
    const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuffer('pink');
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    src.connect(f); f.connect(g); g.connect(out); src.start(t, Math.random() * 3); src.stop(t + len + .02);
  }
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // calm, never clashing
  const chimes = (out, gain = .018) => every(4200, () => {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) setTimeout(() => bell(out, PENTA[Math.floor(Math.random() * PENTA.length)] * 2, gain, 3.5), i * (180 + Math.random() * 260));
  }, 6000);

  const THEMES = {
    sea(out) { // slow waves on a shore
      return { nodes: [
        ...bed(out, { type: 'brown', freq: 520, gain: .32, swell: .085, depth: .75 }),
        ...bed(out, { freq: 1800, filter: 'bandpass', q: .4, gain: .05, swell: .085, depth: .9 }),
        ...bed(out, { freq: 300, gain: .04 }),
      ] };
    },
    breeze(out) { // cool open air
      return { nodes: [
        ...bed(out, { freq: 650, filter: 'bandpass', q: .5, gain: .12, swell: .06, depth: .7 }),
        ...bed(out, { freq: 1400, filter: 'bandpass', q: .7, gain: .04, swell: .11, depth: .8 }),
      ] };
    },
    rain(out) { // light rain, close drops
      return { nodes: [
        ...bed(out, { freq: 5200, gain: .07 }),
        ...bed(out, { type: 'brown', freq: 400, gain: .1 }),
      ], timers: [every(90, () => tick(out, { freq: 2500 + Math.random() * 4000, gain: .012 + Math.random() * .02, len: .015 }), 220)] };
    },
    stream(out) { // a small brook over stones
      return { nodes: [
        ...bed(out, { freq: 1600, filter: 'bandpass', q: .6, gain: .1, swell: .23, depth: .25 }),
        ...bed(out, { freq: 700, filter: 'bandpass', q: .8, gain: .06, swell: .17, depth: .3 }),
        ...bed(out, { type: 'brown', freq: 300, gain: .08 }),
      ], timers: [every(160, () => tick(out, { freq: 900 + Math.random() * 1600, q: 6, gain: .01, len: .04 }), 260)] };
    },
    forest(out) { // breeze in leaves + far chimes
      return { nodes: [
        ...bed(out, { freq: 900, filter: 'bandpass', q: .5, gain: .09, swell: .07, depth: .7 }),
        ...bed(out, { freq: 3500, filter: 'highpass', gain: .015, swell: .13, depth: .8 }),
      ], timers: [chimes(out, .012)] };
    },
    temple(out) { // temple bells in a quiet courtyard
      bell(out, 196, .05, 8);
      return { nodes: [...bed(out, { freq: 500, filter: 'bandpass', q: .5, gain: .05, swell: .05, depth: .6 })],
        timers: [every(9000, () => bell(out, [196, 220, 261.63, 293.66][Math.floor(Math.random() * 4)], .045, 8), 5000)] };
    },
    night(out) { // still desert night: soft low wind, a faint shimmer
      return { nodes: [
        ...bed(out, { type: 'brown', freq: 320, gain: .22, swell: .05, depth: .6 }),
        ...bed(out, { freq: 7000, filter: 'highpass', gain: .006 }),
      ], timers: [every(14000, () => bell(out, PENTA[Math.floor(Math.random() * 6)] * 2, .008, 4), 9000)] };
    },
    fire(out) { // a warm hearth: low rumble and gentle crackles
      return { nodes: [...bed(out, { type: 'brown', freq: 260, gain: .18, swell: .12, depth: .3 })],
        timers: [every(170, () => { if (Math.random() < .55) tick(out, { freq: 1800 + Math.random() * 2800, q: 1.5, gain: .02 + Math.random() * .03, len: .01 + Math.random() * .02 }); }, 420)] };
    },
    bazaar(out) { // dusk market far away: warm murmur + brass chimes
      return { nodes: [
        ...bed(out, { type: 'brown', freq: 420, filter: 'bandpass', q: .6, gain: .1, swell: .09, depth: .4 }),
        ...bed(out, { freq: 900, filter: 'bandpass', q: .6, gain: .03, swell: .2, depth: .5 }),
      ], timers: [chimes(out, .014)] };
    },
    silk(out) { // airy, almost silent dawn
      return { nodes: [...bed(out, { freq: 1100, filter: 'bandpass', q: .4, gain: .05, swell: .05, depth: .7 })],
        timers: [every(7000, () => bell(out, PENTA[Math.floor(Math.random() * 6)] * 2, .01, 4.5), 6000)] };
    },
  };

  function start(name) {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    const s = THEMES[name](out);
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.2);
    return { out, ...s };
  }
  function end(s) {
    if (!s) return;
    s.out.gain.setTargetAtTime(0, ctx.currentTime, .6);
    (s.timers || []).forEach((t) => t.stop());
    setTimeout(() => { (s.nodes || []).forEach((n) => { try { n.stop(); } catch (_) {} }); s.out.disconnect(); }, 3000);
  }
  const resolve = (n) => { n = ALIAS[n] || n; return THEMES[n] ? n : 'breeze'; };

  function play(name) {
    if (!audio()) return;
    ctx.resume();
    theme = resolve(name || theme);
    if (current) end(current);
    current = start(theme);
    master.gain.setTargetAtTime(.75, ctx.currentTime, .8);
    on = true; sync();
  }
  function stop() {
    if (!ctx) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, .5);
    const c = current; current = null; setTimeout(() => end(c), 1500);
    on = false; sync();
  }
  function setTheme(name) { name = resolve(name); if (name === theme) return; theme = name; if (on) play(name); }
  function chime() { if (!audio()) return; ctx.resume(); master.gain.setTargetAtTime(on ? .75 : .6, ctx.currentTime, .05); bell(master, 220, .06, 7); }
  function sync() { buttons.forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? 'Sound on' : 'Sound off'; }); }

  function mountToggle(parent, th) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sound-toggle'; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<i aria-hidden="true"><b></b><b></b><b></b><b></b></i><span>Sound off</span>';
    b.addEventListener('click', () => (on ? stop() : play(typeof th === 'function' ? th() : th)));
    (typeof parent === 'string' ? document.querySelector(parent) : parent).appendChild(b);
    buttons.add(b);
    return b;
  }
  document.addEventListener('visibilitychange', () => { if (ctx && on) (document.hidden ? ctx.suspend() : ctx.resume()); });

  window.GibSound = { play, stop, setTheme, chime, isOn: () => on, mountToggle, themes: Object.keys(THEMES) };
})();
