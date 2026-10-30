// A receipt photo made ready to read: cropped to the paper (the big bright area on a darker table),
// enlarged so its small print is big enough, and turned grey with the faint print made black.

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

/** The paper's part of `src` (a canvas), ready for text recognition. */
export function paperOf(src) {
  const W = src.width, H = src.height;
  // Where the paper is, worked out on a small copy.
  const k = Math.max(1, Math.max(W, H) / 400);
  const sw = Math.round(W / k), sh = Math.round(H / k);
  const small = Object.assign(document.createElement("canvas"), { width: sw, height: sh });
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
  const x0 = Math.max(0, (cx0 - 4) * k), y0 = Math.max(0, (cy0 - 4) * k);
  const cw = Math.min(W, (cx1 + 4) * k) - x0, ch = Math.min(H, (cy1 + 4) * k) - y0;
  // At least 1800 px wide (a receipt's print is small), at most 4000 px tall (a phone's memory).
  const scale = Math.min(4000 / ch, Math.max(1, 1800 / cw));
  const out = Object.assign(document.createElement("canvas"), { width: Math.round(cw * scale), height: Math.round(ch * scale) });
  const og = out.getContext("2d", { willReadFrequently: true });
  og.drawImage(src, x0, y0, cw, ch, 0, 0, out.width, out.height);
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
