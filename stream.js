import { Readable } from "stream";
import * as path from "path";

let currentIndex = 0;

export class Stream extends Readable {
  constructor(page, options) {
    super(options);
  }

  timecode;

  _read() {}

  // @ts-ignore
  async destroy() {
    await this.page.browser().videoCaptureExtension?.evaluate((index) => {
      // @ts-ignore
      STOP_RECORDING(index);
    }, this.page.index);
    super.destroy();
    return this;
  }
}

export async function launch(puppeteer, opts) {
  //if puppeteer library is not passed as first argument, then first argument is options

  if (!opts) opts = {};

  if (!opts.args) opts.args = [];

  const extensionPath = path.join(".", "extension");
  const extensionId = "jjndjgheafjngoipoacpjgeicjeomjli";
  let loadExtension = false;
  let loadExtensionExcept = false;
  let whitelisted = false;

  opts.args = opts.args.map((x) => {
    if (x.includes("--load-extension=")) {
      loadExtension = true;
      return x + "," + extensionPath;
    } else if (x.includes("--disable-extensions-except=")) {
      loadExtensionExcept = true;
      return (
        "--disable-extensions-except=" + extensionPath + "," + x.split("=")[1]
      );
    } else if (x.includes("--whitelisted-extension-id")) {
      whitelisted = true;
      return x + "," + extensionId;
    }

    return x;
  });

  if (!loadExtension) opts.args.push("--load-extension=" + extensionPath);
  if (!loadExtensionExcept)
    opts.args.push("--disable-extensions-except=" + extensionPath);
  if (!whitelisted) opts.args.push("--whitelisted-extension-id=" + extensionId);
  if (opts.defaultViewport?.width && opts.defaultViewport?.height)
    opts.args.push(
      `--window-size=${opts.defaultViewport?.width}x${opts.defaultViewport?.height}`
    );

  opts.headless = false;

  // opts.args.push("--use-fake-ui-for-media-stream");
  // opts.args.push("--use-fake-device-for-media-stream");
  // opts.args.push("--use-file-for-fake-audio-capture=/example.wav");

  // opts.ignoreDefaultArgs = ["--mute-audio"];

  const browser = await puppeteer.launch(opts);

  browser.encoders = new Map();

  const extensionTarget = await browser.waitForTarget(
    (target) =>
      target.type() === "background_page" &&
      target.url() ===
        `chrome-extension://${extensionId}/_generated_background_page.html`
  );

  if (!extensionTarget) {
    throw new Error("cannot load extension");
  }

  const videoCaptureExtension = await extensionTarget.page();

  if (!videoCaptureExtension) {
    throw new Error("cannot get page of extension");
  }

  browser.videoCaptureExtension = videoCaptureExtension;

  await browser.videoCaptureExtension.exposeFunction("sendData", (opts) => {
    const encoder = browser.encoders?.get(opts.id);
    if (!encoder) {
      return;
    }

    const data = Buffer.from(str2ab(opts.data));
    encoder.timecode = opts.timecode;
    encoder.push(data);
  });

  await browser.videoCaptureExtension.exposeFunction("log", (...opts) => {
    console.log("videoCaptureExtension", ...opts);
  });

  return browser;
}

export async function getStream(page, opts) {
  const encoder = new Stream(page);
  if (!opts.audio && !opts.video)
    throw new Error("At least audio or video must be true");
  if (!opts.mimeType) {
    if (opts.video) opts.mimeType = "video/webm";
    else if (opts.audio) opts.mimeType = "audio/webm";
  }
  if (!opts.frameSize) opts.frameSize = 20;

  await page.bringToFront();

  if (page.index === undefined) {
    page.index = currentIndex++;
  }

  await page.browser().videoCaptureExtension?.evaluate(
    (settings) => {
      START_RECORDING(settings);
    },
    { ...opts, index: page.index }
  );
  page.browser().encoders?.set(page.index, encoder);

  return encoder;
}

function str2ab(str) {
  // Convert a UTF-8 String to an ArrayBuffer

  var buf = new ArrayBuffer(str.length); // 1 byte for each char
  var bufView = new Uint8Array(buf);

  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
