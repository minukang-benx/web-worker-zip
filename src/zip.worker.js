import JSZip from "jszip";

const ctx = self;

ctx.addEventListener("message", async (event) => {
  const files = event.data.files;
  if (files && files.length) {
    const blobs = await Promise.all(files.map(async file => {
      const response = await fetch(file);
      return {
        file,
        blob: await response.blob(),
      }
    }));
    const zip = new JSZip();
    blobs.forEach(({ file, blob }) => {
      zip.file(file.split("/").pop(), blob);
    });
    ctx.postMessage({
      result: await zip.generateAsync({
        type: "blob"
      })
    });
  }
});