import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
(async () => {
  const config = {
    headless: false,
    ignoreDefaultArgs: true,
    args: [
      "--fast-start",
      "--disable-extensions",
      "--no-sandbox",
      //   "--disable-notifications",
      "--mute-audio",
      "--enable-automation",
    ],
    ignoreHTTPSErrors: true,
  };

  const browser = await puppeteer.launch(config);

  // going to sign-in page
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();

  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://meet.google.com/", [
    "microphone",
    "camera",
    "notifications",
  ]);

  await page.goto("https://meet.google.com/zgv-pqid-ndz");

  await page.waitForSelector('button[aria-label="More options"]');
  await page.click('button[aria-label="More options"]');

  const xp = `//span[contains(., 'Turn on captions')]`;
  const sizeButton = await page.waitForXPath(xp);
  await sizeButton.evaluate((btn) => {
    btn.closest("li").click();
  });

  await page.waitForSelector('input[type="text"]');
  await page.click('input[type="text"]');
  await page.waitForTimeout(1000);
  await page.keyboard.type(`test`, { delay: 200 });
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");

  await navigationPromise;

  page.on("domcontentloaded", async () => {
    // evaluate the caption text
    const captionText = await page.$eval(".iA1Ybc", (el) => el.innerText);
    console.log(captionText);
  });
  //   // turn off cam using Ctrl+E
  //   browser.close();
  //   // Join Now
  //   var i;
  //   for (i = 1; i <= 6; i++) {
  //     await page.keyboard.press("Tab");
  //     await page.waitForTimeout(800);
  //   }
  //   await page.keyboard.press("Enter");
  //   await navigationPromise;

  //   // open chat section and send a message to all
  //   await page.waitForTimeout(3000);
  //   for (i = 1; i <= 2; i++) {
  //     await page.keyboard.press("Tab");
  //     await page.waitForTimeout(600);
  //   }
  //   await page.keyboard.press("Enter");
  //   await page.waitForTimeout(1500);
  //   await page.keyboard.type("Hello, good day everyone!", { delay: 100 });
  //   await page.keyboard.press("Enter");

  //   // close the chat box
  //   await page.keyboard.press("Tab");
  //   await page.keyboard.press("Enter");

  //   // turn on captions
  //   await page.waitForTimeout(2000);
  //   for (i = 1; i <= 6; i++) {
  //     await page.keyboard.press("Tab");
  //     await page.waitForTimeout(600);
  //   }
  //   await page.keyboard.press("Enter");
})();
