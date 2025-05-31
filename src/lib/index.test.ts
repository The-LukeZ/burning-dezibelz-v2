import { addExtension, getFileExtension, removeExtension, sanitizeFilename } from "$lib";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";

describe("sanitizeFilename", () => {
  test("replaces special characters with underscores", () => {
    expect(sanitizeFilename("file@name#test.jpg")).toBe("file_name_test.jpg");
    expect(sanitizeFilename("my file name.png")).toBe("my_file_name.png");
    expect(sanitizeFilename("file!@#$%^&*()name.gif")).toBe("file__________name.gif");
  });

  test("preserves allowed characters", () => {
    expect(sanitizeFilename("valid_file-name123.webp")).toBe("valid_file-name123.webp");
    expect(sanitizeFilename("ABC123_test-file.jpg")).toBe("ABC123_test-file.jpg");
  });

  test("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("");
  });
});

describe("removeExtension", () => {
  test("removes common image extensions", () => {
    expect(removeExtension("image.jpg")).toBe("image");
    expect(removeExtension("photo.png")).toBe("photo");
    expect(removeExtension("graphic.gif")).toBe("graphic");
    expect(removeExtension("picture.webp")).toBe("picture");
  });

  test("preserves filename without extension", () => {
    expect(removeExtension("filename")).toBe("filename");
    expect(removeExtension("file.txt")).toBe("file.txt");
  });

  test("handles multiple dots in filename", () => {
    expect(removeExtension("file.name.jpg")).toBe("file.name");
    expect(removeExtension("my.file.name.png")).toBe("my.file.name");
  });
});

describe("addExtension", () => {
  test("adds extension to filename", () => {
    expect(addExtension("image", "jpg")).toBe("image.jpg");
    expect(addExtension("photo", "png")).toBe("photo.png");
    expect(addExtension("graphic", "gif")).toBe("graphic.gif");
    expect(addExtension("picture", "webp")).toBe("picture.webp");
  });

  test("adds extension even if filename already has one", () => {
    expect(addExtension("image.png", "jpg")).toBe("image.png.jpg");
  });
});

describe("getFileExtension", () => {
  test("returns correct extension for valid image files", () => {
    expect(getFileExtension("image.jpg")).toBe("jpg");
    expect(getFileExtension("photo.png")).toBe("png");
    expect(getFileExtension("graphic.gif")).toBe("gif");
    expect(getFileExtension("picture.webp")).toBe("webp");
  });

  test("returns null for files without valid extensions", () => {
    expect(getFileExtension("filename")).toBe(null);
    expect(getFileExtension("file.txt")).toBe(null);
    expect(getFileExtension("document.pdf")).toBe(null);
  });

  test("handles multiple dots correctly", () => {
    expect(getFileExtension("file.name.jpg")).toBe("jpg");
    expect(getFileExtension("my.file.name.png")).toBe("png");
  });
});

describe("sanitizeVenuename", () => {
  const sanitize = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-") // Replace multiple dashes with a single dash
      .toLowerCase();

  test("sanitizes venue names correctly", () => {
    expect(sanitize("Venue Name")).toBe("venue-name");
    expect(sanitize("Café de Flore")).toBe("cafe-de-flore");
    expect(sanitize("München Hauptbahnhof")).toBe("munchen-hauptbahnhof");
    expect(sanitize("Concert Hall #1")).toBe("concert-hall-1");
    expect(sanitize("Theatre @ Night")).toBe("theatre-night");
  });
  test("returns empty string for empty input", () => {
    expect(sanitize("")).toBe("");
  });

  test("handles special characters", () => {
    expect(sanitize("Venue!@#$%^&*()Name")).toBe("venue-name");
    expect(sanitize("Café & Bistro")).toBe("cafe-bistro");
    expect(sanitize("München Hauptbahnhof")).toBe("munchen-hauptbahnhof");
    expect(sanitize("Concert Hall #1")).toBe("concert-hall-1");
    expect(sanitize("Theatre @ Night")).toBe("theatre-night");
  });
});
