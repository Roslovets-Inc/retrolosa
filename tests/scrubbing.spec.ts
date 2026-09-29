import { test, expect } from '@playwright/test'

test('rapid scrubbing survives browser history rate limits', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  await page.addInitScript(() => {
    const replace = history.replaceState.bind(history)
    let count = 0
    history.replaceState = (...args) => {
      if (++count > 30) throw new DOMException('Too many calls to History API', 'SecurityError')
      return replace(...args)
    }
  })
  await page.goto('/#lon=1.44954&lat=43.597678&z=16.7')
  await page.getByRole('button', { name: 'Время', exact: true }).click()
  const slider = page.getByRole('slider', { name: 'Путешествие по времени' })
  await slider.evaluate(async element => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    for (let i = 0; i < 100; i++) {
      setter.call(element, String(1680 + ((i * 29) % 347)))
      element.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(requestAnimationFrame)
    }
  })
  await expect(slider).toBeVisible()
  await slider.fill('1830')
  await expect(page.locator('.timeline-value')).toHaveText('1830')
  await expect(page).toHaveURL(/time=1830/, { timeout: 5000 })
  await expect(page.getByRole('button', { name: 'Шторка', exact: true })).toBeVisible()
  expect(failures).toEqual([])
})

test('rejected history writes never blank the application', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  await page.addInitScript(() => {
    history.replaceState = () => { throw new DOMException('History writes blocked', 'SecurityError') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Время', exact: true }).click()
  await page.getByRole('slider', { name: 'Путешествие по времени' }).fill('1900')
  await page.waitForTimeout(700)
  await expect(page.locator('.timeline-value')).toContainText('1830 → Сегодня')
  await page.getByRole('button', { name: 'Шторка', exact: true }).click()
  await page.getByRole('button', { name: 'Карта 1830 года' }).click()
  await expect(page.getByRole('button', { name: 'Карта 1830 года' })).toHaveAttribute('aria-pressed', 'true')
  expect(failures).toEqual([])
})
