import { DocumentSection } from '../types/quiz';
import { ParsedDocument } from './fileParser';

/**
 * Splits a parsed document into logical sections (by chapter/heading or by page/word chunks)
 */
export function splitDocumentIntoSections(doc: ParsedDocument): DocumentSection[] {
  // If it's a multi-page PDF
  if (doc.fileType === 'pdf' && doc.pages.length > 0) {
    return splitPdfDocument(doc);
  }

  // Plain text or docx
  return splitTextDocument(doc.fullText, doc.fileName);
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function splitPdfDocument(doc: ParsedDocument): DocumentSection[] {
  const pages = doc.pages;
  const sections: DocumentSection[] = [];

  // Heading regex patterns:
  // e.g. "Chương 1", "CHƯƠNG I", "Phần 1", "Bài 2", "Chapter 3", "Section 1", "1. GIỚI THIỆU"
  const headingRegex = /^(?:chương|phần|bài|module|chapter|section|part)\s+[0-9ivx]+[\s.:\-–—]+([^\n]{3,80})/i;
  const numberedSectionRegex = /^(?:[1-9]\.[0-9]?(?:\.[0-9])?)\s+([A-ZÀ-Ỹ][^\n]{3,80})/;

  interface PotentialHeading {
    pageIndex: number;
    title: string;
    lineIndex: number;
  }

  const detectedHeadings: PotentialHeading[] = [];

  pages.forEach((page, pIdx) => {
    const lines = page.text.split('\n');
    lines.forEach((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 90) return;

      const mHeading = trimmed.match(headingRegex);
      if (mHeading) {
        detectedHeadings.push({
          pageIndex: pIdx,
          title: trimmed,
          lineIndex: lIdx,
        });
        return;
      }

      const mNumbered = trimmed.match(numberedSectionRegex);
      if (mNumbered && trimmed.length < 70) {
        detectedHeadings.push({
          pageIndex: pIdx,
          title: trimmed,
          lineIndex: lIdx,
        });
      }
    });
  });

  // If we found a good number of distinct headings (e.g. >= 2 and reasonable spacing)
  if (detectedHeadings.length >= 2 && detectedHeadings.length <= 25) {
    for (let i = 0; i < detectedHeadings.length; i++) {
      const cur = detectedHeadings[i];
      const next = detectedHeadings[i + 1];

      const startPage = cur.pageIndex;
      const endPage = next ? next.pageIndex : pages.length - 1;

      // Collect text between startPage and endPage
      const sectionPages = pages.slice(startPage, endPage + 1);
      const content = sectionPages.map(p => `[Trang ${p.pageNumber}]\n${p.text}`).join('\n\n');
      const wCount = countWords(content);

      if (wCount >= 40) {
        sections.push({
          id: `sec_${i + 1}_${Date.now()}`,
          index: i + 1,
          title: cur.title.slice(0, 80),
          content,
          wordCount: wCount,
          pageRange: `Trang ${startPage + 1}${endPage > startPage ? ` - ${endPage + 1}` : ''}`,
          keyConcepts: [],
          coveredConcepts: [],
          status: 'pending',
          questions: [],
        });
      }
    }
  }

  // If no reliable headings found or sections list empty, group by 2-3 pages or ~1000-1500 words
  if (sections.length === 0) {
    const PAGES_PER_SECTION = pages.length <= 4 ? 1 : pages.length <= 12 ? 2 : 3;
    let sectionIdx = 1;

    for (let i = 0; i < pages.length; i += PAGES_PER_SECTION) {
      const chunkPages = pages.slice(i, i + PAGES_PER_SECTION);
      const content = chunkPages.map(p => `[Trang ${p.pageNumber}]\n${p.text}`).join('\n\n');
      const wCount = countWords(content);
      const startP = chunkPages[0].pageNumber;
      const endP = chunkPages[chunkPages.length - 1].pageNumber;
      const pageLabel = startP === endP ? `Trang ${startP}` : `Trang ${startP} - ${endP}`;

      // Extract first meaningful line as snippet title
      const firstLine = chunkPages[0].text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5 && l.length < 80)[0] || '';

      const title = firstLine
        ? `Phần ${sectionIdx}: ${firstLine.slice(0, 50)}...`
        : `Phần ${sectionIdx} (${pageLabel})`;

      sections.push({
        id: `sec_page_${sectionIdx}_${Date.now()}`,
        index: sectionIdx,
        title,
        content,
        wordCount: wCount,
        pageRange: pageLabel,
        keyConcepts: [],
        coveredConcepts: [],
        status: 'pending',
        questions: [],
      });

      sectionIdx++;
    }
  }

  return sections;
}

function splitTextDocument(text: string, fileName: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = text.split('\n');

  const headingRegex = /^(?:#{1,3}\s+|chương\s+\d+|phần\s+[0-9ivx]+|bài\s+\d+|module\s+\d+|[1-9]\.[0-9]?\s+)/i;

  interface Chunk {
    title: string;
    lines: string[];
  }

  const chunks: Chunk[] = [];
  let currentChunk: Chunk = {
    title: `Phần 1: Khởi đầu (${fileName})`,
    lines: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (headingRegex.test(trimmed) && currentChunk.lines.join(' ').length > 400) {
      chunks.push(currentChunk);
      currentChunk = {
        title: trimmed.replace(/^#+\s*/, '').slice(0, 70),
        lines: [line],
      };
    } else {
      currentChunk.lines.push(line);
    }
  }
  chunks.push(currentChunk);

  // If chunking produced too few or 1 giant chunk, split by word count (~1000-1400 words)
  if (chunks.length === 1 && countWords(text) > 1200) {
    const words = text.split(/\s+/);
    const CHUNK_SIZE = 1000;
    let idx = 1;

    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const sliceWords = words.slice(i, i + CHUNK_SIZE);
      const content = sliceWords.join(' ');
      sections.push({
        id: `sec_text_${idx}_${Date.now()}`,
        index: idx,
        title: `Phần ${idx} (${Math.round((i / words.length) * 100)}% nội dung)`,
        content,
        wordCount: sliceWords.length,
        keyConcepts: [],
        coveredConcepts: [],
        status: 'pending',
        questions: [],
      });
      idx++;
    }
    return sections;
  }

  chunks.forEach((chunk, idx) => {
    const content = chunk.lines.join('\n').trim();
    const wCount = countWords(content);
    if (wCount >= 30) {
      sections.push({
        id: `sec_${idx + 1}_${Date.now()}`,
        index: idx + 1,
        title: chunk.title || `Phần ${idx + 1}`,
        content,
        wordCount: wCount,
        keyConcepts: [],
        coveredConcepts: [],
        status: 'pending',
        questions: [],
      });
    }
  });

  if (sections.length === 0) {
    sections.push({
      id: `sec_all_${Date.now()}`,
      index: 1,
      title: 'Toàn bộ nội dung',
      content: text,
      wordCount: countWords(text),
      keyConcepts: [],
      coveredConcepts: [],
      status: 'pending',
      questions: [],
    });
  }

  return sections;
}
