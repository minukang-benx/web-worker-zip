import axios from "axios";
import JSZip from "jszip";

const ctx = self;

ctx.addEventListener("message", async (event) => {
  const files = event.data.files;
  if (files && files.length) {
    ctx.postMessage({ type: "start" });
    const progressResult = new Array(files.length);
    const collection = await Promise.all(files.map(async (file, index) => {
      const { data: response } = await axios({
        url: file,
        responseType: "blob",
        onDownloadProgress({ loaded, total }) {
          progressResult[index] = loaded / total;
          const totalProgress = progressResult.reduce((result, value) => result + (value || 0), 0);
          ctx.postMessage({
            type: "progress",
            data: {
              value: totalProgress / files.length
            }
          });
        }
      });
      return {
        response,
        file,
      };
    }));
    const blobs = await Promise.all(collection.map(async ({ file, response }) => {
      return {
        file,
        blob: response
      }
    }));
    console.log("End Progress", blobs);
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