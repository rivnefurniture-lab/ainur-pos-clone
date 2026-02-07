const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });
  
  await page.goto('http://localhost:5173/pos/products');
  await page.waitForTimeout(5000);
  
  const content = await page.content();
  console.log('Page length:', content.length);
  
  await browser.close();
})();
