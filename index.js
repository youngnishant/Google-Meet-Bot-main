import { launch, getStream } from "./stream.js";
import * as fs from "fs";
import puppeteer from "puppeteer";

const file = fs.createWriteStream("test1.webm");

async function test() {
  const browser = await launch(puppeteer);

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const stream = await getStream(page, { audio: true, video: true });
  console.log("recording");

  //   await page.evaluate(() => {
  //     var audio = document.createElement("audio");
  //     audio.setAttribute("src", "http://example.com/example.mp3");
  //     audio.setAttribute("crossorigin", "anonymous");
  //     audio.setAttribute("controls", "");
  //     audio.onplay = function () {
  //       var stream = audio.captureStream();
  //       navigator.mediaDevices.getUserMedia = async function () {
  //         return stream;
  //       };
  //     };
  //     document.querySelector("body").appendChild(audio);
  //   });

  stream.pipe(file);
}

process.on("SIGINT", async function () {
  console.log("Caught interrupt signal");
  await stream.destroy();
  file.close();
  console.log("finished");
});
test();
