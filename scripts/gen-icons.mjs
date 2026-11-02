// Generates placeholder PWA icons (white shopping cart on the brand green). No external deps.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

// Cart drawn in a 0..1 box, kept inside the maskable safe zone (centre 60%).
const dist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const basket = [
  [0.385, 0.4],
  [0.72, 0.4],
  [0.68, 0.545],
  [0.43, 0.545],
]
const inPoly = (px, py, poly) =>
  poly.reduce((acc, [x1, y1], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length]
    return y1 > py !== y2 > py && px < ((x2 - x1) * (py - y1)) / (y2 - y1) + x1 ? !acc : acc
  }, false)
const inCartBox = (x, y) =>
  dist(x, y, 0.28, 0.32, 0.36, 0.32) < 0.035 ||
  dist(x, y, 0.36, 0.32, 0.43, 0.6) < 0.035 ||
  dist(x, y, 0.43, 0.6, 0.66, 0.6) < 0.035 ||
  inPoly(x, y, basket) ||
  Math.hypot(x - 0.47, y - 0.68) < 0.055 ||
  Math.hypot(x - 0.62, y - 0.68) < 0.055

// `scale` grows the cart around the centre: `any` icons fill more, maskable ones stay in the safe zone.
const inCart = (x, y, scale) => inCartBox((x - 0.5) / scale + 0.5, (y - 0.5) / scale + 0.5)

function png(size, scale) {
  const bg = [46, 106, 79] // #2E6A4F (primary)
  const fg = [255, 255, 255]
  const row = size * 3 + 1
  const raw = Buffer.alloc(row * size)
  const ss = 4 // supersampling for smooth edges
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0
    for (let x = 0; x < size; x++) {
      let hits = 0
      for (let j = 0; j < ss; j++)
        for (let i = 0; i < ss; i++)
          if (inCart((x + (i + 0.5) / ss) / size, (y + (j + 0.5) / ss) / size, scale)) hits++
      const a = hits / (ss * ss)
      raw.set(
        bg.map((c, k) => Math.round(c + (fg[k] - c) * a)),
        y * row + 1 + x * 3,
      )
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
// Cart extent is ±0.22 of the side at scale 1. Maskable safe zone = circle of radius 0.4 (corner 0.31 at 1.15).
for (const size of [192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size, 1.45))
writeFileSync('public/icons/icon-maskable-512.png', png(512, 1.15))
