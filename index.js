const playwright = require('playwright')

const PAGE = 'https://www.chollometro.com/categorias/tarjetas-graficas'
const PRODUCT = '4090'
const BELOW_PRICE = 1500
const BROWSERS = ['chromium']
const NUMBER_OF_PAGES = 10

const scraper = async () => {
  for (const browserType of BROWSERS) {
    const browser = await playwright[browserType].launch()
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(PAGE)

    // accept cookies
    await page.waitForSelector('button[data-t="acceptAllBtn"]')
    const acceptCookies = await page.$('button[data-t="acceptAllBtn"]')
    if (acceptCookies) {
      await acceptCookies.click()
    }

    // Start scraping
    for (let i = 0; i < NUMBER_OF_PAGES; i++) {
      const elements = await page.$$('article')
      let element = null
      const info = []
      for (const el of elements) {
        const strong = await el.$('strong.thread-title')
        if (strong) {
          const text = await (await strong.getProperty('textContent')).jsonValue()
          const stock = await el.$('span:has-text("Agotado")')
          const price = await el.$('span.thread-price')
          const priceText = await (await price.getProperty('textContent')).jsonValue()
          const priceNumber = parseInt(priceText.replace('€', ''))

          console.log({ text, stock: !!stock, price: priceText })
          info.push({ text, stock: !!stock, price: priceText })
          if (text.includes(PRODUCT) && !stock && priceNumber < BELOW_PRICE) {
            element = el
            break
          }
        }
      }

      // If we found the product, we stop the loop
      if (element) {
        const link = await element.$('a')
        const href = await (await link.getProperty('href')).jsonValue()
        console.log('Found in page', i + 1, href)
        break
      }
      console.log('Not found in page', i + 1)

      // Go to next page
      const nextButton = await page.$('button[aria-label="Siguiente página"]')
      if (nextButton) {
        console.log('Next page')
        await nextButton.click()
        // wait until the page is loaded
        await page.waitForSelector('article')
      } else {
        console.log('No more pages')
        break
      }
    }

    await browser.close()
  }
}

scraper()
