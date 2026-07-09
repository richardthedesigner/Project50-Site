// Stamp shared partials into pages between idempotent markers.
// Run after editing partials/: node build.mjs  (or npm run stamp)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const partials = {
  nav: readFileSync('partials/nav.html', 'utf8').trim(),
  footer: readFileSync('partials/footer.html', 'utf8').trim(),
}

for (const file of readdirSync('.').filter(f => f.endsWith('.html'))) {
  let html = readFileSync(file, 'utf8')
  let changed = false
  for (const [name, content] of Object.entries(partials)) {
    const re = new RegExp(`(<!-- p50:${name} -->)[\\s\\S]*?(<!-- /p50:${name} -->)`)
    if (re.test(html)) {
      html = html.replace(re, `$1\n${content}\n$2`)
      changed = true
    }
  }
  if (changed) {
    writeFileSync(file, html)
    console.log('stamped', file)
  }
}
