// A receipt photo made ready to read: cropped to the paper (the big bright area on a darker table),
// turned upright if it lies sideways, sized so its print is big enough, made black and white, and
// read in pieces (a long receipt at once would be too much for a phone).

/** Otsu's threshold: the grey level that best splits a histogram in two. */
function threshold(hist, count) {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let below = 0, sumBelow = 0, best = 0, at = 128;
  for (let t = 0; t < 256; t++) {
    below += hist[t];
    if (!below) continue;
    const above = count - below;
    if (!above) break;
    sumBelow += t * hist[t];
    const between = below * above * (sumBelow / below - (sum - sumBelow) / above) ** 2;
    if (between > best) [best, at] = [between, t];
  }
  return at;
}

const grey = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
const canvas = (width, height) => Object.assign(document.createElement("canvas"), { width, height });

/** Where the paper is in `src`: x, y, width and height. */
function paperBox(src) {
  const W = src.width, H = src.height;
  // Worked out on a small copy.
  const k = Math.max(1, Math.max(W, H) / 400);
  const sw = Math.round(W / k), sh = Math.round(H / k);
  const small = canvas(sw, sh);
  const sg = small.getContext("2d", { willReadFrequently: true });
  sg.drawImage(src, 0, 0, sw, sh);
  const d = sg.getImageData(0, 0, sw, sh).data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) hist[Math.min(255, grey(d, i) | 0)]++;
  const th = threshold(hist, sw * sh);
  const rows = new Array(sh).fill(0), cols = new Array(sw).fill(0);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (grey(d, (y * sw + x) * 4) > th) (rows[y]++, cols[x]++);
  // The rows and columns that are mostly paper (a bright edge of the table doesn't count).
  const span = (a) => {
    const enough = Math.max(...a) * 0.3;
    return [a.findIndex((v) => v > enough), a.length - 1 - [...a].reverse().findIndex((v) => v > enough)];
  };
  const [cx0, cx1] = span(cols), [cy0, cy1] = span(rows);
  const x = Math.max(0, (cx0 - 4) * k), y = Math.max(0, (cy0 - 4) * k);
  return { x, y, w: Math.min(W, (cx1 + 4) * k) - x, h: Math.min(H, (cy1 + 4) * k) - y };
}

/** The paper, turned by `turn` degrees (0, 90 or -90), 1500 px wide, in black and white. */
export function paperOf(src, turn = 0, box = paperBox(src)) {
  const across = turn ? box.h : box.w, down = turn ? box.w : box.h;
  // About 1500 px across: a receipt line of ~40 characters is then big enough to read well.
  const scale = 1500 / across;
  const out = canvas(Math.round(across * scale), Math.round(down * scale));
  const og = out.getContext("2d", { willReadFrequently: true });
  og.translate(out.width / 2, out.height / 2);
  og.rotate((turn * Math.PI) / 180);
  og.drawImage(src, box.x, box.y, box.w, box.h, (-box.w * scale) / 2, (-box.h * scale) / 2, box.w * scale, box.h * scale);
  // Black and white, each pixel against its neighbourhood: faint print turns black even where the light
  // falls off, and the dark table around the paper (even, no print) turns white.
  const w = out.width, h = out.height;
  const img = og.getImageData(0, 0, w, h), p = img.data;
  const sum = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += grey(p, (y * w + x) * 4);
      sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row;
    }
  }
  const r = Math.max(8, Math.round(w / 60));
  // The paper's own brightness: where the surroundings are much darker (the table, the paper's edge), nothing is print.
  const levels = new Array(256).fill(0);
  for (let i = 0; i < p.length; i += 4) levels[grey(p, i) | 0]++;
  let seen = 0, paper = 255;
  for (let t = 0; t < 256; t++) if ((seen += levels[t]) >= (p.length / 4) * 0.9) { paper = t; break; }
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - r), yb = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - r), xb = Math.min(w, x + r + 1);
      const mean = (sum[yb * (w + 1) + xb] - sum[ya * (w + 1) + xb] - sum[yb * (w + 1) + xa] + sum[ya * (w + 1) + xa]) / ((yb - ya) * (xb - xa));
      const i = (y * w + x) * 4;
      p[i] = p[i + 1] = p[i + 2] = mean > paper * 0.65 && grey(p, i) < mean * 0.85 ? 0 : 255;
    }
  }
  og.putImageData(img, 0, 0);
  return out;
}

/** The page cut into pieces at most 2400 px tall, each cut in a blank gap between lines. */
export function piecesOf(page) {
  const w = page.width, h = page.height;
  const d = page.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const ink = (y) => {
    let n = 0;
    for (let x = 0; x < w; x += 2) if (!d[(y * w + x) * 4]) n++;
    return n;
  };
  const pieces = [];
  for (let top = 0; top < h; ) {
    let cut = Math.min(h, top + 2400);
    if (cut < h) {
      // The emptiest row in the last 600 px of the piece.
      let best = cut, least = Infinity;
      for (let y = cut; y > cut - 600; y -= 2) {
        const n = ink(y);
        if (n < least) [least, best] = [n, y];
        if (!n) break;
      }
      cut = best;
    }
    const piece = canvas(w, cut - top);
    piece.getContext("2d").drawImage(page, 0, top, w, cut - top, 0, 0, w, cut - top);
    pieces.push(piece);
    top = cut;
  }
  return pieces;
}

/**
 * Where the print is on `page` (made by paperOf from `box` of `src`, turned by `turn`), as a box in `src`;
 * null when the print already fills the page.
 */
function printBox(page, src, turn, box) {
  const w = page.width, h = page.height;
  const d = page.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const cols = new Float64Array(w), rows = new Float64Array(h);
  let all = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (!d[(y * w + x) * 4]) (cols[x]++, rows[y]++, all++);
  if (!all) return null;
  // The middle 98% of the ink, so a speck or the paper's edge far out doesn't count.
  const range = (a) => {
    let seen = 0, lo = 0, hi = a.length - 1;
    for (let i = 0; i < a.length; i++) if ((seen += a[i]) <= all * 0.01) lo = i;
    seen = 0;
    for (let i = a.length - 1; i >= 0; i--) if ((seen += a[i]) <= all * 0.01) hi = i;
    return [lo, hi];
  };
  let [x0, x1] = range(cols), [y0, y1] = range(rows);
  if (x1 - x0 > w * 0.75) return null;
  const mx = (x1 - x0) * 0.05, my = (y1 - y0) * 0.03;
  [x0, x1, y0, y1] = [Math.max(0, x0 - mx), Math.min(w, x1 + mx), Math.max(0, y0 - my), Math.min(h, y1 + my)];
  // Back from the page to the photo: undo the scale and the turn about the box's middle.
  const scale = w / (turn ? box.h : box.w), a = (-turn * Math.PI) / 180;
  const back = ([px, py]) => {
    const [dx, dy] = [(px - w / 2) / scale, (py - h / 2) / scale];
    return [box.x + box.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), box.y + box.h / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(back);
  const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
  const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys));
  return { x, y, w: Math.min(src.width, Math.max(...xs)) - x, h: Math.min(src.height, Math.max(...ys)) - y };
}

/**
 * The receipt's text from a photo or scan. `recognize(canvas)` reads one piece: { text, confidence }.
 * A paper lying sideways is read both ways round, and the way that reads best is kept.
 */
export async function readPaper(src, recognize) {
  const box = paperBox(src);
  // Wider than tall: lying sideways, or a short receipt. Each way is read, and the clearest kept.
  const turns = box.w > box.h * 1.15 ? [0, 90, -90] : [0];
  let best = null;
  for (const turn of turns) {
    let text = "", confidence = 0, pieces = 0;
    // The paper may include a white tablecloth around it: cut again to where the print is, from the photo.
    const page = paperOf(src, turn, box);
    const tight = printBox(page, src, turn, box);
    for (const piece of piecesOf(tight ? paperOf(src, turn, tight) : page)) {
      const r = await recognize(piece);
      text += r.text + "\n";
      confidence += r.confidence;
      pieces++;
    }
    if (!best || confidence / pieces > best.confidence) best = { text, confidence: confidence / pieces };
  }
  return best.text;
}
