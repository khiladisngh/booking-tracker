import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '../public/icons')
mkdirSync(outDir, { recursive: true })

// App icon SVG — calendar on dark tactical background
function makeSvg(size) {
  const pad = size * 0.18
  const inner = size - pad * 2
  const stroke = Math.max(2, size * 0.04)
  const r = size * 0.22

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#07101e"/>

  <!-- Subtle inner gradient surface -->
  <rect x="${pad * 0.4}" y="${pad * 0.4}" width="${size - pad * 0.8}" height="${size - pad * 0.8}"
        rx="${r * 0.8}" fill="#0d1a2e" opacity="0.6"/>

  <!-- Calendar body -->
  <rect x="${pad}" y="${pad + inner * 0.12}" width="${inner}" height="${inner * 0.82}"
        rx="${inner * 0.12}" fill="none" stroke="#3d82f0" stroke-width="${stroke}"/>

  <!-- Calendar header fill -->
  <rect x="${pad}" y="${pad + inner * 0.12}" width="${inner}" height="${inner * 0.26}"
        rx="${inner * 0.12}" fill="#3d82f0"/>
  <!-- Cover bottom corners of header fill -->
  <rect x="${pad}" y="${pad + inner * 0.26}" width="${inner}" height="${inner * 0.12}" fill="#3d82f0"/>

  <!-- Hanger left -->
  <line x1="${pad + inner * 0.28}" y1="${pad * 0.55}" x2="${pad + inner * 0.28}" y2="${pad + inner * 0.2}"
        stroke="#3d82f0" stroke-width="${stroke * 1.2}" stroke-linecap="round"/>
  <!-- Hanger right -->
  <line x1="${pad + inner * 0.72}" y1="${pad * 0.55}" x2="${pad + inner * 0.72}" y2="${pad + inner * 0.2}"
        stroke="#3d82f0" stroke-width="${stroke * 1.2}" stroke-linecap="round"/>

  <!-- Grid dots — row 1 -->
  <circle cx="${pad + inner * 0.28}" cy="${pad + inner * 0.56}" r="${stroke * 0.9}" fill="#e8f1fa"/>
  <circle cx="${pad + inner * 0.50}" cy="${pad + inner * 0.56}" r="${stroke * 0.9}" fill="#e8f1fa"/>
  <circle cx="${pad + inner * 0.72}" cy="${pad + inner * 0.56}" r="${stroke * 0.9}" fill="#e8f1fa"/>
  <!-- Grid dots — row 2 -->
  <circle cx="${pad + inner * 0.28}" cy="${pad + inner * 0.74}" r="${stroke * 0.9}" fill="#7990a8"/>
  <circle cx="${pad + inner * 0.50}" cy="${pad + inner * 0.74}" r="${stroke * 0.9}" fill="#7990a8"/>
  <circle cx="${pad + inner * 0.72}" cy="${pad + inner * 0.74}" r="${stroke * 0.9}" fill="#3d82f0"/>
</svg>`
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(makeSvg(size)))
    .png()
    .toFile(join(outDir, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}
