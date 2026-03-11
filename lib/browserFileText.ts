"use client";

const textLikeExtensions = [".txt", ".md", ".markdown", ".csv", ".json", ".rtf"];

async function runOcrFromCanvas(canvas: HTMLCanvasElement) {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(canvas, "eng");

  return result.data.text.replace(/\s+\n/g, "\n").trim();
}

async function readPdfTextWithOcr(file: File) {
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 5);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      continue;
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const pageText = await runOcrFromCanvas(canvas);

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  return pageTexts.join("\n\n");
}

async function readImageText(file: File) {
  const image = document.createElement("img");
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image load failed"));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas unavailable");
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    return runOcrFromCanvas(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readPdfText(file: File) {
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  return pageTexts.join("\n\n");
}

async function readDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value.replace(/\s+\n/g, "\n").trim();
}

export async function readSupportedFileText(file: File) {
  const lowerName = file.name.toLowerCase();
  const isTextLike =
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    textLikeExtensions.some((extension) => lowerName.endsWith(extension));

  try {
    if (isTextLike) {
      return {
        text: await file.text(),
        message: null
      };
    }

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      let text = await readPdfText(file);

      if (!text) {
        text = await readPdfTextWithOcr(file);
      }

      return {
        text,
        message: text
          ? "Text was extracted from the PDF. Review it, then generate the quest."
          : "The PDF was uploaded, but no readable text was extracted."
      };
    }

    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const text = await readDocxText(file);

      return {
        text,
        message: text
          ? "Text was extracted from the DOCX file. Review it, then generate the quest."
          : "The DOCX file was uploaded, but no readable text was extracted."
      };
    }

    if (file.type.startsWith("image/")) {
      const text = await readImageText(file);

      return {
        text,
        message: text
          ? "Text was extracted from the image. Review it, then generate the quest."
          : "The image was uploaded, but no readable text was extracted."
      };
    }
  } catch {
    return {
      text: null,
      message:
        "The file was uploaded, but Study Quest could not extract readable text from it. If it is a scanned document, try a clearer file or paste the text manually."
    };
  }

  return {
    text: null,
    message:
      "This file type cannot be read directly yet. Use PDF, DOCX, TXT, Markdown, CSV, or paste the note text."
  };
}
