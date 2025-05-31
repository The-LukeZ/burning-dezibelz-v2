import { writable } from "svelte/store";

type UploadState = {
  status: "idle" | "uploading" | "completed" | "error";
  progress: number;
};

type UploadResult<T> =
  | {
      success: false;
      error: { message: string; status: number };
    }
  | {
      success: true;
      data: T;
    };

export function create_upload<T = any>() {
  const { subscribe, update } = writable<UploadState>({ status: "idle", progress: 0 });

  let xhr: XMLHttpRequest | null = null;

  return {
    subscribe,

    start({ file, url, filename }: { file: File; url: string; filename: string }): Promise<UploadResult<T>> {
      return new Promise((resolve) => {
        xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            update((state) => ({ ...state, status: "uploading", progress }));
          }
        });

        xhr.addEventListener("loadend", () => {
          if (xhr!.status >= 200 && xhr!.status < 300) {
            update((state) => ({ ...state, status: "completed" }));

            try {
              const response = xhr!.responseText ? JSON.parse(xhr!.responseText) : null;
              resolve({ success: true, data: response as T });
            } catch {
              resolve({ success: true, data: xhr!.responseText as unknown as T });
            }
          } else {
            update((state) => ({ ...state, status: "error", progress: 0 }));
            resolve({
              success: false,
              error: { message: `Upload failed with status ${xhr!.message}`, status: xhr!.status },
            });
          }
        });

        xhr.addEventListener("error", () => {
          update((state) => ({ ...state, status: "error", progress: 0 }));
          resolve({
            success: false,
            error: { message: "Network error during upload", status: 0 },
          });
        });

        xhr.addEventListener("abort", () => {
          update((state) => ({ ...state, status: "idle", progress: 0 }));
          resolve({
            success: false,
            error: { message: "Upload aborted", status: 0 },
          });
        });

        xhr.open("POST", url);
        xhr.setRequestHeader("x-file-name", filename);
        xhr.send(file);
      });
    },

    cancel() {
      if (xhr) {
        xhr.abort();
        xhr = null;
      }
    },
  };
}

export default create_upload;
