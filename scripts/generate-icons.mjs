/**
 * Generates the PWA raster icons from a tiny built-in renderer — no image
 * dependencies. It draws the WORDLOCK "redaction bar" motif (three text lines,
 * the middle one an accent censor bar) and encodes real PNGs using Node's zlib.
 *
 * Run with:  node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "../public/icons");

const DARK = [13, 13, 15, 255]; // #0d0d0f
const PAPER = [247, 246, 242, 255]; // #f7f6f2
const ACCENT = [255, 74, 28, 255]; // #ff4a1c

// ---- CRC32 (for PNG chunks) ----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- Simple RGBA canvas ----
function createCanvas(size, bg) {
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = bg[0];
    px[i * 4 + 1] = bg[1];
    px[i * 4 + 2] = bg[2];
    px[i * 4 + 3] = bg[3];
  }
  return px;
}

function fillRect(px, size, x, y, w, h, color) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(size, Math.round(x + w));
  const y1 = Math.min(size, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * size + xx) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = color[3];
    }
  }
}

/** Draw the three-bar wordmark centred within a safe inset. */
function drawMotif(px, size, padFraction) {
  const inset = size * padFraction;
  const contentW = size - inset * 2;
  const barH = contentW * 0.15;
  const gap = barH * 0.62;
  const blockH = barH * 3 + gap * 2;
  const startY = (size - blockH) / 2;
  const x = inset;
  fillRect(px, size, x, startY, contentW, barH, PAPER);
  fillRect(px, size, x, startY + barH + gap, contentW, barH, ACCENT);
  fillRect(px, size, x, startY + (barH + gap) * 2, contentW * 0.62, barH, PAPER);
}

// ---- PNG encoding (8-bit RGBA, no interlace) ----
function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(px, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none)
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size, padFraction) {
  const px = createCanvas(size, DARK);
  drawMotif(px, size, padFraction);
  return encodePNG(px, size);
}

mkdirSync(OUT_DIR, { recursive: true });

const files = [
  { name: "icon-192.png", size: 192, pad: 0.22 },
  { name: "icon-512.png", size: 512, pad: 0.22 },
  // Maskable icons need their content inside the safe zone (~80%).
  { name: "icon-maskable-512.png", size: 512, pad: 0.3 },
];

for (const f of files) {
  const buf = makeIcon(f.size, f.pad);
  writeFileSync(resolve(OUT_DIR, f.name), buf);
  console.log(`wrote ${f.name} (${buf.length} bytes)`);
}
