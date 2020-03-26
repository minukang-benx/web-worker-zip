import "whatwg-fetch";
import ZipWorker from "./zip.worker";
import { saveAs } from "file-saver";

const worker = new ZipWorker();

worker.addEventListener("message", event => {
  if (event.data.result) {
    saveAs(event.data.result, "my.zip");
  }
});

document.querySelector("#download-button").addEventListener("click", async e => {
  e.preventDefault();
  worker.postMessage({
    files: JSON.parse(e.currentTarget.dataset.files)
  });
});