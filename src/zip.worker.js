import "whatwg-fetch";
import TextEncoder from "text-encoding";
import JSZip from "jszip";
import fetchReadableStream from "fetch-readablestream";

global.TextEncoder = TextEncoder;

const ctx = self;

function delay (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

ctx.addEventListener("message", async (event) => {
  const files = event.data.files;
  if (files && files.length) {
    ctx.postMessage({ type: "start" });
    const collection = await Promise.all(files.map(async file => {
      const response = await fetchReadableStream(file);
      return {
        response,
        file,
        size: Number(response.headers.get('Content-Length'))
      };
    }));
    const totalSize = collection.reduce((result, { size }) => {
      return result + size;
    }, 0);
    let receivedSize = 0;
    const blobs = await Promise.all(collection.map(async ({ file, response }) => {
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        receivedSize += value.length;
        ctx.postMessage({
          type: "progress",
          data: {
            value: receivedSize / totalSize
          }
        });
        await delay(150);
      }
      return {
        file,
        blob: new Blob(chunks)
      }
    }));
    ctx.postMessage({ type: "end-progress" });
    const zip = new JSZip();
    blobs.forEach(({ file, blob }) => {
      zip.file(file.split("/").pop(), blob);
    });
    ctx.postMessage({
      type: "result",
      data: {
        result: await zip.generateAsync({
          type: "blob"
        })
      }
    });
  }
});