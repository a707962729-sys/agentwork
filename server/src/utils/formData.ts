/**
 * Simple multipart/form-data parser
 * No external dependencies — uses Node.js built-in Buffer and string operations
 */

import { Request } from 'express';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuid } from 'uuid';

export interface UploadedFile {
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  filepath: string;
}

export interface FormDataFields {
  [key: string]: string | UploadedFile[] | undefined;
  files?: UploadedFile[];
}

export function parseFormData(req: Request): Promise<FormDataFields> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) {
      return reject(new Error('No boundary found in content-type'));
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const boundaryBuffer = Buffer.from('--' + boundary);
    const endBoundaryBuffer = Buffer.from('--' + boundary + '--');

    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const result: FormDataFields = {};
        const parts = splitByBoundary(body, boundaryBuffer);

        for (const part of parts) {
          if (part.length === 0) continue;

          // Parse part header and body
          const headerEndIdx = indexOfDoubleCRLF(part);
          if (headerEndIdx === -1) continue;
          const headerSection = part.slice(0, headerEndIdx).toString('utf8');
          const bodyPart = part.slice(headerEndIdx + 4); // skip \r\n\r\n

          // Extract headers from part header
          const headers: Record<string, string> = {};
          for (const line of headerSection.split('\r\n')) {
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            const key = line.slice(0, colonIdx).trim().toLowerCase();
            const value = line.slice(colonIdx + 1).trim();
            headers[key] = value;
          }

          const contentDisposition = headers['content-disposition'] || '';
          const nameMatch = contentDisposition.match(/name="([^"]+)"/);
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);

          if (filenameMatch) {
            // File field
            const filename = filenameMatch[1];
            const contentType2 = headers['content-type'] || 'application/octet-stream';

            // Write to temp file
            const tmpPath = join(tmpdir(), `aw_${uuid()}_${filename}`);
            const writeStream = createWriteStream(tmpPath);
            writeStream.write(bodyPart);
            writeStream.end();

            const uploadedFile: UploadedFile = {
              filename: `aw_${uuid()}_${filename}`,
              originalFilename: filename,
              mimetype: contentType2,
              size: bodyPart.length,
              filepath: tmpPath,
            };

            if (!result.files) result.files = [];
            result.files.push(uploadedFile);
          } else if (nameMatch) {
            const fieldName = nameMatch[1];
            result[fieldName] = bodyPart.toString('utf8').replace(/\r\n$/, '');
          }
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', reject);
  });
}

function splitByBoundary(buf: Buffer, boundary: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;

  while (start < buf.length) {
    const idx = buf.indexOf(boundary, start);
    if (idx === -1) break;
    if (idx > start) {
      // Skip leading CRLF before boundary
      const partStart = (buf[start] === 0x0d && buf[start + 1] === 0x0a) ? start + 2 : start;
      if (partStart < idx) {
        parts.push(buf.slice(partStart, idx - 2)); // strip trailing \r\n before boundary
      }
    }
    start = idx + boundary.length;
    // Skip CRLF after boundary
    if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
    // Check for end boundary
    if (buf.slice(start, start + 2).toString() === '--') break;
  }

  return parts;
}

function indexOfDoubleCRLF(buf: Buffer): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a && buf[i + 2] === 0x0d && buf[i + 3] === 0x0a) {
      return i;
    }
  }
  return -1;
}
