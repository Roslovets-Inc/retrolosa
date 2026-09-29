import { PMTiles } from 'pmtiles'
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const year = process.argv[2] || '1680'
if (!['1680', '1830'].includes(year)) throw new Error('Unsupported year')
const suffix = year === '1680' ? '' : `-${year}`
const archive = new PMTiles(`https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-${year}.pmtiles`)
const h = await archive.getHeader()
const z = h.minZoom, n = 2 ** z
const x = lon => Math.floor((lon + 180) / 360 * n)
const y = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n)
const west = x(h.minLon), east = x(h.maxLon), north = y(h.maxLat), south = y(h.minLat)
const tiles = []
for (let row = north; row <= south; row++) for (let col = west; col <= east; col++) {
  const tile = await archive.getZxy(z, col, row)
  if (tile) tiles.push({ x: col - west, y: row - north, data: Buffer.from(tile.data).toString('base64') })
}
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage()
  const png = await page.evaluate(async ({ tiles, width, height }) => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
    const context = canvas.getContext('2d')
    for (const tile of tiles) {
      const image = new Image(); image.src = `data:image/png;base64,${tile.data}`; await image.decode()
      context.drawImage(image, tile.x * 256, tile.y * 256, 256, 256)
    }
    return canvas.toDataURL('image/png').split(',')[1]
  }, { tiles, width: (east - west + 1) * 256, height: (south - north + 1) * 256 })
  const lon = col => col / n * 360 - 180
  const lat = row => Math.atan(Math.sinh(Math.PI * (1 - 2 * row / n))) * 180 / Math.PI
  const coordinates = [[lon(west), lat(north)], [lon(east + 1), lat(north)], [lon(east + 1), lat(south + 1)], [lon(west), lat(south + 1)]]
  await mkdir('public', { recursive: true })
  await writeFile(`public/history-overview${suffix}.png`, Buffer.from(png, 'base64'))
  await writeFile(`src/history-overview${suffix}.json`, JSON.stringify(coordinates))
  console.log(JSON.stringify({ tiles: tiles.length, coordinates }))
} finally { await browser.close() }
