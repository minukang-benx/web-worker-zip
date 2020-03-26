import ZipWorker from "./zip.worker";
import { saveAs } from "file-saver";

const worker = new ZipWorker();

worker.addEventListener("message", event => {
  const message = event.data;
  switch (message.type) {
    case "start": {
      document.querySelector("#progress").style.display = "block";
      break;
    }
    case "progress": {
      document.querySelector("#progress-value").innerHTML = Math.floor(message.data.value * 10000) / 100;
      break;
    }
    case "end-progress": {
      document.querySelector("#progress").style.display = "none";
      break;
    }
    case "result": {
      if (message.data.result) {
        saveAs(message.data.result, "my.zip");
      }
      break;
    }
  }
});

document.querySelector("#download-button").addEventListener("click", async e => {
  e.preventDefault();
  worker.postMessage({
    files: JSON.parse(e.currentTarget.dataset.files)
  });
});