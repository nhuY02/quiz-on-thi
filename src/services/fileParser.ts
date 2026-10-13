import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '5.4.299'}/pdf.worker.min.mjs`;
  } catch {
    // Fallback if needed
  }
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt';
  pages: DocumentPage[];
  fullText: string;
  pageCount: number;
}

export async function parseFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return parsePdfFile(file, onProgress);
  } else if (extension === 'docx') {
    return parseDocxFile(file, onProgress);
  } else if (extension === 'txt' || extension === 'md') {
    return parseTextFile(file, onProgress);
  } else {
    throw new Error(`Định dạng file .${extension} chưa được hỗ trợ. Vui lòng tải file .pdf, .docx, hoặc .txt.`);
  }
}

async function parsePdfFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ParsedDocument> {
  onProgress?.(5, 'Đang đọc file PDF...');
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '5.4.299'}/cmaps/`,
      cMapPacked: true,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Không thể mở file PDF: ${message}. Vui lòng kiểm tra lại file.`);
  }

  const numPages = pdfDoc.numPages;
  if (numPages === 0) {
    throw new Error('File PDF không có trang nào.');
  }

  const pages: DocumentPage[] = [];
  let totalExtractedLength = 0;

  for (let i = 1; i <= numPages; i++) {
    const percent = Math.round(5 + ((i / numPages) * 85));
    onProgress?.(percent, `Đang trích xuất nội dung trang ${i}/${numPages}...`);

    try {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter((str) => str.trim().length > 0);

      const pageText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();
      totalExtractedLength += pageText.length;

      pages.push({
        pageNumber: i,
        text: pageText,
      });
    } catch (err) {
      console.warn(`Lỗi khi đọc trang ${i}:`, err);
      pages.push({
        pageNumber: i,
        text: '',
      });
    }
  }

  // Check for scanned / image-only PDFs
  if (totalExtractedLength < 50) {
    throw new Error(
      '⚠️ File PDF này không chứa văn bản (có thể là file scan hoặc chứa toàn hình ảnh). Vui lòng sử dụng file PDF có văn bản dạng số (selectable text) hoặc chuyển đổi OCR trước khi tải lên.'
    );
  }

  const fullText = pages.map((p) => `[Trang ${p.pageNumber}]\n${p.text}`).join('\n\n');

  onProgress?.(100, 'Đã trích xuất xong nội dung file PDF!');

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: 'pdf',
    pages,
    fullText,
    pageCount: numPages,
  };
}

async function parseDocxFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ParsedDocument> {
  onProgress?.(20, 'Đang đọc file DOCX (Word)...');
  const arrayBuffer = await file.arrayBuffer();

  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text || text.length < 50) {
      throw new Error('File DOCX không chứa đủ nội dung văn bản để tạo câu hỏi.');
    }

    onProgress?.(100, 'Đã trích xuất xong nội dung file Word!');

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: 'docx',
      pages: [{ pageNumber: 1, text }],
      fullText: text,
      pageCount: 1,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('không chứa đủ nội dung')) {
      throw err;
    }
    throw new Error('Không thể đọc file DOCX. Vui lòng đảm bảo file không bị hỏng hoặc có mật khẩu.');
  }
}

async function parseTextFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ParsedDocument> {
  onProgress?.(30, 'Đang đọc file văn bản...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string || '').trim();
      if (!text || text.length < 50) {
        reject(new Error('File văn bản quá ngắn hoặc rỗng để tạo câu hỏi ôn tập.'));
        return;
      }
      onProgress?.(100, 'Đã đọc xong file văn bản!');
      resolve({
        fileName: file.name,
        fileSize: file.size,
        fileType: 'txt',
        pages: [{ pageNumber: 1, text }],
        fullText: text,
        pageCount: 1,
      });
    };
    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file văn bản.'));
    };
    reader.readAsText(file, 'utf-8');
  });
}
