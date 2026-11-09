// ---------- timing helpers: shots are timed straight from the voice, so a new take needs no edits ----------
// WORDS (words.js) = [{w, s, e, line, k}] in seconds; k = 1 for *key* words
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
const LINE = i => WORDS.find(w => w.line === i).s;                              // first word of line i
const LINE_END = i => WORDS.filter(w => w.line === i).pop().e;                  // end of line i
// time of a word: WT('plato') = first "plato"; WT('calor', 1) = second; WT('agua', 0, 5) = first "agua" from line 5 on
function WT(word, n = 0, fromLine = 0) {
  const m = WORDS.filter(w => w.line >= fromLine && norm(w.w) === norm(word));
  if (!m[n]) { console.log('WT: no word "' + word + '" #' + n); return fromLine ? LINE(fromLine) : 0; }
  return m[n].s;
}
const DUR = WORDS[WORDS.length - 1].e + 1.5;   // hold the last shot a beat after the voice ends
const SHOTS = [];
// shot(line, transition, draw): starts a shot a hair before that line's first word
// shotAt(seconds, transition, draw): starts a shot at any time (mid-line cuts)
// opt.capY moves the captions for this shot only (e.g. to the top over the final share sheet)
function shot(line, tr, draw, opt = {}) { SHOTS.push({ start: line === 0 ? 0 : LINE(line) - .08, tr, draw, ...opt }); }
function shotAt(t, tr, draw, opt = {}) { SHOTS.push({ start: t, tr, draw, ...opt }); }
