// One-off image pipeline: scripts/originals/*.jpg -> assets/img/<name>-<w>.{avif,webp,jpg}
// Run: npm install && node scripts/images.mjs   (output is committed; not a build step)
import sharp from 'sharp'
import { readdirSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'

const SRC = new URL('./originals/', import.meta.url).pathname
const OUT = new URL('../assets/img/', import.meta.url).pathname
const WIDTHS = [480, 800, 1200, 1600]
// Editorial B&W set: grade baked in so pages need no CSS filter
const MONO = new Set(['hero-home', 'hero-story', 'hero-programmes', 'hero-contact', 'founder', 'story-jo', 'prog-group', 'mosaic-3'])

mkdirSync(OUT, { recursive: true })

for (const file of readdirSync(SRC).filter(f => f.endsWith('.jpg'))) {
  const name = basename(file, '.jpg')
  const src = sharp(join(SRC, file)).rotate()
  const meta = await src.metadata()
  for (const w of WIDTHS) {
    if (w > meta.width) continue
    let img = sharp(join(SRC, file)).rotate().resize({ width: w })
    if (MONO.has(name)) img = img.grayscale().linear(1.08, -8) // slight contrast lift
    await img.clone().avif({ quality: 52 }).toFile(join(OUT, `${name}-${w}.avif`))
    await img.clone().webp({ quality: 75 }).toFile(join(OUT, `${name}-${w}.webp`))
    await img.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`))
  }
  console.log(name, 'done')
}
