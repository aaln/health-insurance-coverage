import { logger, task } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import fs from "fs";
import { put } from '@vercel/blob';
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const localPdfToImages = async (fileBuffer: ArrayBuffer, id: string) => {
  const pdfPath = `/tmp/${id}.pdf`;
  const outputDir = `/tmp/${id}`;

  // Write File to disk and convert to images using MuPDF
  fs.writeFileSync(pdfPath, Buffer.from(fileBuffer));
  fs.mkdirSync(outputDir, { recursive: true });
  execSync(`mutool convert -o ${outputDir}/page-%d.png ${pdfPath}`);

  const uploadedUrls = [];
  console.log("outputDir", outputDir);
  for (const file of fs.readdirSync(outputDir)) {
    const filePath = path.join(outputDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = await put(`images/${id}/${file}`, fileBuffer, {
      access: 'public',
      contentType: 'image/png'
    });
    uploadedUrls.push(blob.url);
  }
  uploadedUrls.sort((a, b) => {
    const pageA = parseInt(a.split('page-')[1].split('.')[0]);
    const pageB = parseInt(b.split('page-')[1].split('.')[0]);
    return pageA - pageB;
  });
  logger.log("uploaded image urls", { urls: uploadedUrls });
  return uploadedUrls;
}

export const PdfToImagesTask = task({
  id: "pdf-to-images",
  run: async (payload: {file_url: string}, { ctx }) => {
    logger.log("Converting PDF to images", { payload, ctx });

    const response = await fetch(payload.file_url);
    const file = await response.blob();
    const file_buffer = await file.arrayBuffer();
    return await localPdfToImages(file_buffer, uuidv4())
  },
});