/* ============================================================
   GIBERISH — Whispers: small truths about scent
   cat:  science · memory · heritage · wisdom · ritual · giberish
   text: the line (quotes keep their original wording)
   src:  where it comes from (research area, study, book or author)
   art:  GibArt kinds that drift around it
   Research lines are written carefully: "studies suggest" where science is still debated.
   ============================================================ */
window.GIB_WHISPER_CATS = {
  science:  { label: 'The Science',      color: '#9fcfe0' },
  memory:   { label: 'Memory & Feeling', color: '#e07a8f' },
  heritage: { label: 'Heritage & Craft', color: '#e0a443' },
  wisdom:   { label: 'Old Wisdom',       color: '#f2d59b' },
  ritual:   { label: 'The Ritual',       color: '#c8a2e0' },
  giberish: { label: 'Giberish Says',    color: '#f4e6c8' },
};

window.GIB_WHISPERS = [
  // ---- The science
  { cat: 'science', text: 'Your nose carries about 400 different kinds of smell receptors. Together, in endless combinations, they let you recognise an astonishing world of scents.', src: 'Human olfaction research', art: ['musk', 'jasmine'] },
  { cat: 'science', text: 'Smell is wired more directly to the brain’s centres of emotion and memory than any other sense. That is why a scent can move you before you can even name it.', src: 'Neuroscience of olfaction', art: ['rose', 'petal'] },
  { cat: 'science', text: 'Richard Axel and Linda Buck won the 2004 Nobel Prize in Physiology or Medicine for discovering how our odour receptors work.', src: 'Nobel Prize, 2004', art: ['musk', 'amber'] },
  { cat: 'science', text: 'Around a thousand genes in your DNA are devoted to smell, one of the largest families of genes the human body carries.', src: 'Human genome research', art: ['leaf', 'musk'] },
  { cat: 'science', text: 'One widely discussed study suggested humans may be able to tell apart more than a trillion different smells. Scientists still debate the exact number, but it is vast.', src: 'Science, 2014 (debated)', art: ['orange', 'rose', 'oud'] },
  { cat: 'science', text: 'Much of what we call taste is really smell, rising from the back of the mouth as we eat and drink.', src: 'Retronasal olfaction', art: ['vanilla', 'cinnamon'] },
  { cat: 'science', text: 'The cells in your nose that detect scent are among the few nerve cells that keep renewing themselves throughout life.', src: 'Olfactory neurogenesis', art: ['leaf'] },
  { cat: 'science', text: 'Within minutes of wearing a perfume you may stop noticing it, while the people around you still can. Scientists call this olfactory adaptation.', src: 'Olfactory adaptation', art: ['musk', 'jasmine'] },
  { cat: 'science', text: 'Newborn babies can recognise their mother’s scent within their first week of life.', src: 'Infant olfaction research', art: ['musk', 'petal'] },
  { cat: 'science', text: 'Humans can detect geosmin, the earthy molecule behind the smell of rain on dry soil, at just a few parts per trillion.', src: 'Petrichor research', art: ['leaf', 'sandalwood'] },
  { cat: 'science', text: 'The word petrichor, for the scent of rain on parched earth, was coined in 1964 by Australian scientists Isabel Bear and Richard Thomas.', src: 'Nature, 1964', art: ['leaf'] },
  { cat: 'science', text: 'Top notes are small, light molecules that evaporate first. Base notes are heavier and linger for hours. That is why a perfume changes as it lives on your skin.', src: 'Perfume chemistry', art: ['lemon', 'rose', 'amber'] },
  { cat: 'science', text: 'Losing the sense of smell is linked with lower wellbeing. Many people only realise how much they lean on scent once it is gone.', src: 'Anosmia research', art: ['petal'] },
  { cat: 'science', text: 'Smell can be trained. Perfumers spend years learning to recognise hundreds of raw materials by nose alone.', src: 'Perfumer training', art: ['saffron', 'oud', 'jasmine'] },

  // ---- Memory & feeling
  { cat: 'memory', text: 'Memories brought back by smell tend to be older than those cued by words or pictures, often reaching into the first ten years of life.', src: 'Studies of odour-evoked memory (e.g. Willander & Larsson, 2006)', art: ['sandalwood', 'petal'] },
  { cat: 'memory', text: 'Memories triggered by scent are often felt as more emotional and more vivid than those cued by sight or sound.', src: 'Research by psychologist Rachel Herz and others', art: ['rose', 'honey'] },
  { cat: 'memory', text: 'The sudden return of a memory through scent is called the Proust effect, after the novelist whose madeleine dipped in tea unlocked a whole childhood.', src: 'Marcel Proust, In Search of Lost Time', art: ['honey', 'vanilla'] },
  { cat: 'memory', text: 'We often know a smell perfectly yet cannot name it. Researchers call this the tip-of-the-nose feeling.', src: 'Olfactory naming research', art: ['jasmine', 'musk'] },
  { cat: 'memory', text: 'A scent you meet in a happy moment can carry that happiness back to you for years.', src: 'Giberish', art: ['petal', 'orange'] },
  { cat: 'memory', text: 'A grandmother’s cupboard, a festival night, the first rain: the scents of home are among the strongest anchors we have.', src: 'Giberish', art: ['sandalwood', 'smoke', 'leaf'] },

  // ---- Heritage & craft
  { cat: 'heritage', text: 'The word perfume comes from the Latin per fumum, “through smoke”: the first fragrances were incense offered to the sky.', src: 'Etymology', art: ['smoke', 'amber'] },
  { cat: 'heritage', text: 'Attar comes from the Persian and Arabic word itr, which simply means fragrance.', src: 'Etymology', art: ['rose', 'oud'] },
  { cat: 'heritage', text: 'Kannauj, in Uttar Pradesh, has distilled attars for centuries in copper stills called deg and bhapka. It is often called the perfume capital of India.', src: 'Kannauj attar tradition', art: ['rose', 'sandalwood'] },
  { cat: 'heritage', text: 'Mitti attar captures the smell of the first monsoon rain on parched earth, distilled from sun-baked clay.', src: 'Kannauj attar tradition', art: ['leaf', 'sandalwood'] },
  { cat: 'heritage', text: 'Traditional attars are distilled into sandalwood oil instead of alcohol, which is why a single drop stays so close and so long on the skin.', src: 'Attar making', art: ['sandalwood', 'rose'] },
  { cat: 'heritage', text: 'Oud is born from a wound. When an agarwood tree is infected, it defends itself by filling its heartwood with a dark, fragrant resin.', src: 'Agarwood biology', art: ['oud', 'smoke'] },
  { cat: 'heritage', text: 'Thousands of kilograms of rose petals are needed to distil a single kilogram of rose oil.', src: 'Rose oil production', art: ['rose', 'petal', 'petal'] },
  { cat: 'heritage', text: 'A kilogram of saffron needs around 150,000 crocus flowers, each one picked by hand.', src: 'Saffron harvest', art: ['saffron'] },
  { cat: 'heritage', text: 'Vanilla is the fruit of an orchid. In most places where it grows, every flower must be pollinated by hand.', src: 'Vanilla cultivation', art: ['vanilla'] },
  { cat: 'heritage', text: 'In perfumery, amber is not the fossil stone. It is a warm accord, usually built from resins like labdanum and benzoin softened with vanilla.', src: 'Perfumery', art: ['amber', 'vanilla'] },
  { cat: 'heritage', text: 'Musk was once taken from the musk deer. Modern perfumery uses clean, synthetic musks instead, and no animal is harmed.', src: 'Perfumery', art: ['musk'] },
  { cat: 'heritage', text: 'Many white flowers, like jasmine and tuberose, grow most fragrant in the evening, when night-flying moths come to pollinate them.', src: 'Botany', art: ['jasmine', 'jasmine'] },
  { cat: 'heritage', text: 'Ancient Egyptians burned a blend called kyphi at dusk, made of resins, honey, wine and spices.', src: 'Ancient Egyptian texts', art: ['honey', 'smoke', 'cinnamon'] },
  { cat: 'heritage', text: 'The Persian physician Ibn Sina is often credited with refining the steam distillation of rose oil, more than a thousand years ago.', src: 'History of distillation', art: ['rose'] },
  { cat: 'heritage', text: 'True sandalwood comes from trees that take decades to mature, which is why its oil has always been precious.', src: 'Sandalwood', art: ['sandalwood'] },
  { cat: 'heritage', text: 'In Indian temples, sandalwood paste, chandan, is offered and applied to bring coolness and calm.', src: 'Indian ritual', art: ['sandalwood', 'jasmine'] },

  // ---- Old wisdom (public-domain words)
  { cat: 'wisdom', text: '“Smell is a potent wizard that transports you across thousands of miles and all the years you have lived.”', src: 'Helen Keller, The World I Live In (1908)', art: ['petal', 'musk'] },
  { cat: 'wisdom', text: '“Kasturi kundal basai, mrig dhoondhe ban maahi.” The musk is in the deer’s own body, yet it searches the whole forest for it.', src: 'Kabir, 15th century', art: ['musk', 'leaf'] },
  { cat: 'wisdom', text: '“Musk is that which proclaims itself by its own fragrance, not by what the perfumer says.”', src: 'Saadi, Gulistan (1258)', art: ['musk', 'oud'] },
  { cat: 'wisdom', text: '“That which we call a rose / By any other name would smell as sweet.”', src: 'William Shakespeare, Romeo and Juliet', art: ['rose', 'petal'] },
  { cat: 'wisdom', text: '“Memory, imagination, old sentiments and associations are more readily reached through the sense of smell than through any other channel.”', src: 'Attributed to Oliver Wendell Holmes Sr.', art: ['sandalwood', 'musk'] },
  { cat: 'wisdom', text: 'In Samkhya philosophy, gandha, the subtle essence of smell, belongs to the earth element: the most grounded of all the senses.', src: 'Samkhya darshana', art: ['sandalwood', 'leaf'] },
  { cat: 'wisdom', text: 'Gandha, fragrance, is one of the five offerings of the Hindu puja, alongside flowers, incense, the lamp and food.', src: 'Panchopachara puja', art: ['jasmine', 'smoke'] },

  // ---- The ritual
  { cat: 'ritual', text: 'Warmth helps fragrance rise. Pulse points like the wrist and the base of the throat are warm, so scent blooms there gently.', src: 'Perfumery practice', art: ['amber', 'rose'] },
  { cat: 'ritual', text: 'Fragrance lasts longer on moisturised skin, because oils hold aroma molecules longer than dry skin does.', src: 'Perfumery practice', art: ['vanilla', 'jasmine'] },
  { cat: 'ritual', text: 'Never rub your wrists together after applying. Let the scent settle on its own, the way it was composed to.', src: 'Perfumery practice', art: ['petal', 'musk'] },
  { cat: 'ritual', text: 'One drop at the pulse, three slow breaths. That is the whole ritual.', src: 'Giberish', art: ['jasmine', 'sandalwood'] },

  // ---- Giberish says
  { cat: 'giberish', text: 'A fragrance is the shortest way back to a moment.', src: 'Giberish', art: ['petal', 'honey'] },
  { cat: 'giberish', text: 'Wear scent for yourself first. Everyone else only overhears it.', src: 'Giberish', art: ['musk', 'rose'] },
  { cat: 'giberish', text: 'Perfume is the one luxury no one can see, and the one people remember the longest.', src: 'Giberish', art: ['saffron', 'amber'] },
  { cat: 'giberish', text: 'The right fragrance does not make you someone else. It makes you more yourself.', src: 'Giberish', art: ['oud', 'rose'] },
  { cat: 'giberish', text: 'In the silence after the noise, you can finally smell the rose.', src: 'Giberish', art: ['rose', 'petal'] },
  { cat: 'giberish', text: 'Attar is patience you can carry in your pocket.', src: 'Giberish', art: ['sandalwood', 'oud'] },
  { cat: 'giberish', text: 'Every bottle holds a place you have never been, and a memory you have not made yet.', src: 'Giberish', art: ['orange', 'jasmine', 'saffron'] },
];
