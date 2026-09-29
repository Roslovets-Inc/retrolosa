import { test, expect } from '@playwright/test'
test('1954 aerial tiles, shared view and four-period timeline work on mobile', async ({ page }) => {
  const errors: string[] = []
  const tiles: number[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.url().includes('LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954')) tiles.push(r.status()) })
  await page.goto('/#lon=1.44954&lat=43.597678&z=16.7&year=1954')
  await expect(page.getByRole('button', {name: 'Карта 1954 года'})).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => tiles.includes(200), {timeout: 60000}).toBeTruthy()
  await expect(page.getByText('Карты загружены', {exact:true})).toBeVisible({timeout:60000})
  await page.getByRole('button', {name:'1954',exact:true}).click()
  await page.screenshot({path:'.local/1954-desktop.png'})
  await page.getByRole('button', {name:'Наложение',exact:true}).click()
  await page.getByRole('slider', {name:'Непрозрачность исторической карты'}).fill('50')
  await expect(page.locator('.historic-map')).toHaveCSS('opacity','0.5')
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:'.local/1954-mobile.png'})
  await page.getByRole('button', {name:'Время',exact:true}).click()
  const slider=page.getByRole('slider',{name:'Путешествие по времени'})
  for (const [value,label] of [['1892','1830 → 1954 · 50%'],['1954','1954'],['1990','1954 → Сегодня · 50%'],['1680','1680'],['1830','1830']]) {
    await slider.fill(value)
    await expect(page.locator('.timeline-value')).toHaveText(label)
  }
  await slider.fill('1954')
  await page.screenshot({path:'.local/1954-time-mobile.png'})
  await expect(page).toHaveURL(/time=1954/)
  await page.reload()
  await expect(slider).toHaveValue('1954')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(errors).toEqual([])
  expect(tiles.every(status => status === 200)).toBeTruthy()
})
