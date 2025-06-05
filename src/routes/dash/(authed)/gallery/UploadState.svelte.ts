class UploadState {
  uploading = $state(false);
  files = $state<FileList | undefined>(undefined);
  folder = $state({
    value: "",
    isValid: null as boolean | null,
  });
  error = $state<string | null>(null);
  progress = $state({
    current: 0,
    total: 0,
  });

  reset() {
    this.uploading = false;
    this.files = undefined;
    this.folder.value = "";
    this.folder.isValid = null;
    this.error = null;
    this.progress.current = 0;
    this.progress.total = 0;
  }

  /**
   * Removes a file from the files collection at the specified index.
   *
   * Creates a new DataTransfer object to reconstruct the FileList without the
   * removed file, since FileList objects are immutable.
   *
   * @param index - The zero-based index of the file to remove
   * @returns void
   *
   * @remarks
   * If the index is out of bounds or files is null/undefined, the method
   * will return early without making any changes.
   */
  removeFile(index: number) {
    if (this.files && index >= 0 && index < this.files.length) {
      const fileArray = Array.from(this.files);
      fileArray.splice(index, 1);
      const dataTransfer = new DataTransfer();
      fileArray.forEach((file) => dataTransfer.items.add(file));
      this.files = dataTransfer.files;
    }
  }

  resetProgress() {
    this.progress.current = 0;
    this.progress.total = 0;
  }

  validateFolder(value: string) {
    this.folder.value = value;

    if (!value) {
      this.folder.isValid = null;
    } else {
      this.folder.isValid = /^[A-Za-z0-9_\-.öäüß ]+$/.test(value) && value.length >= 3 && value.length <= 64;
    }
  }
}

export default UploadState;
