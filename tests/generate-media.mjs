// BuildVault Stage 4 fixture generator.
//
// Uses ONLY Node.js built-in modules (node:fs, node:zlib). No third-party packages.
//
// This script was run once to create the two small media files inside
// tests/fixtures/buildvault-synthetic-project/media/. It is kept under tests/ so the
// fixtures can be regenerated, but it is NOT part of the deterministic test runner:
// the runner must never write into the fixture directory.
//
// Run with:  node tests/generate-media.mjs
//
// The generated files are synthetic placeholders. They contain no real recordings or
// photographs. Their purpose is to exercise the Skill's degradable media-analysis
// path, where the correct outcome is to report "no media evidence obtained" rather
// than to invent image or transcript content.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:"));
const mediaDir = path.join(here, "fixtures/buildvault-synthetic-project/media");
mkdirSync(mediaDir, { recursive: true });

// ---------------------------------------------------------------- WAV (audio) ---
// Mono, 8-bit unsigned PCM, 8000 Hz, ~1.5 s of a soft 220 Hz tone.
const sampleRate = 8000;
const seconds = 1.5;
const sampleCount = Math.floor(sampleRate * seconds);
const samples = Buffer.alloc(sampleCount);
for (let i = 0; i < sampleCount; i += 1) {
  const t = i / sampleRate;
  const value = Math.sin(2 * Math.PI * 220 * t) * 60; // amplitude 0..60
  samples[i] = Math.max(0, Math.min(255, Math.round(128 + value)));
}

const wav = Buffer.alloc(44 + samples.length);
wav.write("RIFF", 0, "ascii");
wav.writeUInt32LE(36 + samples.length, 4);
wav.write("WAVE", 8, "ascii");
wav.write("fmt ", 12, "ascii");
wav.writeUInt32LE(16, 16); // fmt chunk size
wav.writeUInt16LE(1, 20); // PCM
wav.writeUInt16LE(1, 22); // channels
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate, 28); // byte rate
wav.writeUInt16LE(1, 32); // block align
wav.writeUInt16LE(8, 34); // bits per sample
wav.write("data", 36, "ascii");
wav.writeUInt32LE(samples.length, 40);
samples.copy(wav, 44);
writeFileSync(path.join(mediaDir, "field-trial-audio.wav"), wav);

// ----------------------------------------------------------------- PNG (image) ---
// 16x16 truecolour PNG with a simple gradient and a dark border.
const crcTable = [];
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

const width = 16;
const height = 16;
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: truecolour
ihdr[10] = 0; // deflate
ihdr[11] = 0; // adaptive filtering
ihdr[12] = 0; // no interlace

const raw = Buffer.alloc(height * (1 + width * 3));
let offset = 0;
for (let y = 0; y < height; y += 1) {
  raw[offset] = 0; // filter type: none
  offset += 1;
  for (let x = 0; x < width; x += 1) {
    const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
    raw[offset] = border ? 32 : (x * 16) & 0xff;
    raw[offset + 1] = border ? 32 : (y * 16) & 0xff;
    raw[offset + 2] = border ? 32 : ((x + y) * 8) & 0xff;
    offset += 3;
  }
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(path.join(mediaDir, "chassis-photo.png"), png);

console.log(`wrote ${path.join(mediaDir, "field-trial-audio.wav")} (${wav.length} bytes)`);
console.log(`wrote ${path.join(mediaDir, "chassis-photo.png")} (${png.length} bytes)`);
