import "server-only";

import { getDocumentKind } from "@/lib/document-format";
import type { DocumentKind } from "@/lib/types/documents";
import type { ExtractedDocument, ExtractedDocumentPage } from "@/server/ingestion/types";

async function extractPdfDocument(buffer: Buffer): Promise<ExtractedDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });
  const pdf = await loadingTask.promise;
  const pages: ExtractedDocumentPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => {
          if (!("str" in item)) {
            return "";
          }

          const chunk = item.str ?? "";
          const suffix = "hasEOL" in item && item.hasEOL ? "\n" : " ";
          return `${chunk}${suffix}`;
        })
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

      if (text) {
        pages.push({
          pageNumber,
          text,
        });
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return {
    pageCount: pdf.numPages,
    pages,
    text: pages.map((page) => page.text).join("\n\n"),
  };
}

function decodeTextBuffer(buffer: Buffer): string {
  return new TextDecoder("utf-8", {
    fatal: false,
  }).decode(buffer);
}

export async function extractDocumentText(input: {
  buffer: Buffer;
  fileExtension: string | null;
  mimeType: string;
}): Promise<{ extracted: ExtractedDocument; kind: DocumentKind }> {
  const kind = getDocumentKind(input.fileExtension, input.mimeType);

  if (kind === "pdf") {
    return {
      extracted: await extractPdfDocument(input.buffer),
      kind,
    };
  }

  const text = decodeTextBuffer(input.buffer);

  return {
    extracted: {
      pageCount: null,
      pages: [],
      text,
    },
    kind,
  };
}
