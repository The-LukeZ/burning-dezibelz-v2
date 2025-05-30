import { writable } from "svelte/store";

export function create_upload() {
  const { subscribe, update } = writable({ status: "idle", progress: 0 });

  let xhr: XMLHttpRequest;

  return {
    subscribe,

    start({ file, url, filename }: { file: File; url: string; filename: string }) {
      return new Promise((resolve, rej) => {
        xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          let progress = 0;

          if (event.lengthComputable) {
            progress = Math.round((event.loaded / event.total) * 100);
          }

          update((state) => ({ ...state, status: "uploading", progress }));
        });

        xhr.addEventListener("loadend", () => {
          const status = xhr.status > 0 && xhr.status < 400 ? "completed" : "error";

          update((state) => ({ ...state, status }));

          resolve(xhr);
        });

        xhr.upload.addEventListener("error", () => {
          update((state) => ({ ...state, progress: 0, status: "error" }));
        });

        xhr.open("POST", url);

        xhr.setRequestHeader("x-file-name", filename);

        xhr.send(file);
      });
    },
  };
}

export default create_upload;
