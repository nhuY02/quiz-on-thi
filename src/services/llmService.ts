import { QuizQuestion, DocumentSection, LLMConfig, CoverageReport } from '../types/quiz';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export interface GenerationSectionResult {
  sectionId: string;
  keyConcepts: string[];
  coveredConcepts: string[];
  questions: QuizQuestion[];
}

export function calculateCoverageReport(sections: DocumentSection[]): CoverageReport {
  let total = 0;
  let covered = 0;
  const missingConcepts: { section: string; concept: string }[] = [];
  const allConcepts: { section: string; concept: string; covered: boolean }[] = [];

  for (const sec of sections) {
    for (const concept of sec.keyConcepts) {
      total++;
      const isCovered = sec.coveredConcepts.some(c => 
        c.toLowerCase().trim() === concept.toLowerCase().trim() ||
        concept.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(concept.toLowerCase())
      );

      if (isCovered) {
        covered++;
        allConcepts.push({ section: sec.title, concept, covered: true });
      } else {
        missingConcepts.push({ section: sec.title, concept });
        allConcepts.push({ section: sec.title, concept, covered: false });
      }
    }
  }

  const coveragePercentage = total === 0 ? 100 : Math.round((covered / total) * 100);

  return {
    totalConcepts: total,
    coveredConcepts: covered,
    coveragePercentage,
    missingConcepts,
    allConcepts,
  };
}

export async function processSectionQuiz(
  section: DocumentSection,
  llmConfig: LLMConfig,
  onStatusUpdate?: (status: string) => void
): Promise<GenerationSectionResult> {
  const targetCount = Math.max(3, Math.min(8, Math.ceil(section.wordCount / 220)));
  
  onStatusUpdate?.(`Đang phân tích và sinh ${targetCount} câu hỏi...`);

  // Phase 1: Generate initial questions and identify key concepts
  const phase1Result = await generateInitialQuestions(section, targetCount, llmConfig);

  const initialKeyConcepts = phase1Result.keyConcepts;
  const initialQuestions = phase1Result.questions;

  // Extract concepts tested by initial questions
  const testedConceptsSet = new Set<string>();
  initialQuestions.forEach(q => {
    (q.keyConcepts || []).forEach(c => testedConceptsSet.add(c.trim().toLowerCase()));
  });

  // Find missing concepts
  const missing = initialKeyConcepts.filter(k => !testedConceptsSet.has(k.trim().toLowerCase()));

  let finalQuestions = [...initialQuestions];
  let coveredConceptsList = initialKeyConcepts.filter(k => testedConceptsSet.has(k.trim().toLowerCase()));

  // Phase 2: If concepts are missing, run verification and supplement generation
  if (missing.length > 0) {
    onStatusUpdate?.(`Kiểm tra độ phủ: phát hiện ${missing.length} khái niệm chưa có câu hỏi (${missing.slice(0, 3).join(', ')}). Đang sinh bổ sung...`);
    try {
      const supplementQuestions = await generateSupplementQuestions(section, missing, llmConfig);
      if (supplementQuestions.length > 0) {
        finalQuestions = [...finalQuestions, ...supplementQuestions];
        supplementQuestions.forEach(q => {
          (q.keyConcepts || []).forEach(c => testedConceptsSet.add(c.trim().toLowerCase()));
        });
        coveredConceptsList = initialKeyConcepts.filter(k => testedConceptsSet.has(k.trim().toLowerCase()));
      }
    } catch (suppErr) {
      console.warn('Lỗi khi sinh câu hỏi bổ sung cho độ phủ, giữ các câu đã có:', suppErr);
    }
  }

  return {
    sectionId: section.id,
    keyConcepts: initialKeyConcepts,
    coveredConcepts: coveredConceptsList,
    questions: finalQuestions,
  };
}

async function generateInitialQuestions(
  section: DocumentSection,
  targetCount: number,
  config: LLMConfig
): Promise<{ keyConcepts: string[]; questions: QuizQuestion[] }> {
  const systemPrompt = `Bạn là chuyên gia sư phạm chuyên soạn đề thi trắc nghiệm học thuật và chuyên môn cao cấp.
Nhiệm vụ của bạn: Đọc kỹ tài liệu được cung cấp và tạo ra bộ câu hỏi trắc nghiệm ôn tập CHẤT LƯỢNG CAO, BAO QUÁT TOÀN DIỆN nội dung.

YÊU CẦU BẮT BUỘC VỀ NỘI DUNG VÀ ĐỘ PHỦ:
1. Xác định danh sách 4 - 8 khái niệm/thuật ngữ/công thức/kỹ thuật quan trọng nhất có trong tài liệu này (keyConcepts).
2. Tạo đúng ${targetCount} câu hỏi trắc nghiệm bao quát các chủ đề:
   - Định nghĩa, thuật ngữ bản chất
   - Kỹ thuật / thuật toán / phương pháp / cơ chế hoạt động
   - Khi nào NÊN dùng / khi nào KHÔNG NÊN dùng
   - So sánh, phân biệt giữa các giải pháp hoặc thành phần
   - Tình huống áp dụng thực tế (scenario-based)
3. Giữ NGUYÊN thuật ngữ kỹ thuật tiếng Anh gốc (ví dụ: Gradient Descent, Deadlock, Throughput, Latency, Indexing, Interface, Microservices,...), KHÔNG dịch gượng ép sang tiếng Việt.
4. Mỗi câu hỏi gồm:
   - 4 lựa chọn (A, B, C, D), chỉ duy nhất 1 đáp án đúng.
   - Các phương án sai phải hợp lý, mang tính gây nhiễu sư phạm tốt, không được quá ngớ ngẩn hoặc quá lộ liễu.
   - Giải thích (explanation) viết bằng tiếng Việt rõ ràng, giải thích vì sao đáp án đúng là đúng, VÀ vì sao các phương án khác chưa chính xác.
   - Trích dẫn nguồn (sourceRef): ghi rõ phần hoặc ngữ cảnh xuất hiện trong văn bản (ví dụ: "${section.pageRange || section.title}").
   - Gắn nhãn chủ đề (topic) cụ thể.
   - keyConcepts: mảng chứa các khái niệm trong câu hỏi này.
5. CHỈ dựa vào nội dung văn bản dưới đây, KHÔNG bịa đặt kiến thức ngoài file.

Trả về kết quả DUY NHẤT dưới dạng JSON hợp lệ (không kèm lời chào mở đầu hay kết thúc), tuân theo cấu trúc:
{
  "keyConcepts": ["khái niệm 1", "khái niệm 2", "khái niệm 3"],
  "questions": [
    {
      "topic": "Chủ đề cụ thể",
      "question": "Nội dung câu hỏi?",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctIndex": 0,
      "explanation": "Giải thích chi tiết vì sao đúng và vì sao sai...",
      "sourceRef": "${section.pageRange || section.title}",
      "keyConcepts": ["khái niệm 1"]
    }
  ]
}`;

  const userMessage = `TIÊU ĐỀ PHẦN: ${section.title}
PHẠM VI: ${section.pageRange || 'Nội dung'}
VĂN BẢN TÀI LIỆU CẦN RA ĐỀ:
"""
${section.content}
"""`;

  const rawJson = await callLLM(systemPrompt, userMessage, config);
  const parsed = parseLLMResponse(rawJson);

  const keyConcepts: string[] = Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [];
  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

  const questions: QuizQuestion[] = rawQuestions.map((q: any, i: number) => ({
    id: `q_${section.id}_${i + 1}_${Math.random().toString(36).slice(2, 7)}`,
    section: section.title,
    topic: q.topic || section.title,
    question: q.question || 'Câu hỏi',
    options: ensureFourOptions(q.options),
    correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
    explanation: q.explanation || 'Không có giải thích chi tiết.',
    sourceRef: q.sourceRef || section.pageRange || section.title,
    keyConcepts: Array.isArray(q.keyConcepts) ? q.keyConcepts : [],
  }));

  return { keyConcepts, questions };
}

async function generateSupplementQuestions(
  section: DocumentSection,
  missingConcepts: string[],
  config: LLMConfig
): Promise<QuizQuestion[]> {
  const count = Math.min(3, missingConcepts.length);
  const systemPrompt = `Bạn là chuyên gia sư phạm. Trong bước kiểm tra độ phủ kiến thức, các khái niệm sau đây trong tài liệu hiện CHƯA có câu hỏi trắc nghiệm:
[${missingConcepts.join(', ')}]

Hãy tạo đúng ${count} câu hỏi trắc nghiệm tập trung trực tiếp vào các khái niệm còn thiếu này.
- Giữ NGUYÊN thuật ngữ tiếng Anh gốc.
- 4 đáp án (1 đúng, 3 sai hợp lý).
- Giải thích tiếng Việt chi tiết (vì sao đúng, vì sao các phương án khác sai).
- JSON format:
{
  "questions": [
    {
      "topic": "Chủ đề",
      "question": "Nội dung câu hỏi?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Giải thích...",
      "sourceRef": "${section.pageRange || section.title}",
      "keyConcepts": ["${missingConcepts[0]}"]
    }
  ]
}`;

  const userMessage = `VĂN BẢN THAM CHIẾU:
"""
${section.content}
"""`;

  const rawJson = await callLLM(systemPrompt, userMessage, config);
  const parsed = parseLLMResponse(rawJson);
  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

  return rawQuestions.map((q: any, i: number) => ({
    id: `q_supp_${section.id}_${i + 1}_${Math.random().toString(36).slice(2, 7)}`,
    section: section.title,
    topic: q.topic || section.title,
    question: q.question || 'Câu hỏi bổ sung',
    options: ensureFourOptions(q.options),
    correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
    explanation: q.explanation || 'Giải thích bổ sung.',
    sourceRef: q.sourceRef || section.pageRange || section.title,
    keyConcepts: Array.isArray(q.keyConcepts) ? q.keyConcepts : missingConcepts.slice(0, 1),
  }));
}

function ensureFourOptions(options: any): [string, string, string, string] {
  if (Array.isArray(options) && options.length >= 4) {
    return [String(options[0]), String(options[1]), String(options[2]), String(options[3])];
  }
  if (Array.isArray(options)) {
    const list = options.map(String);
    while (list.length < 4) {
      list.push(`Phương án ${String.fromCharCode(65 + list.length)}`);
    }
    return [list[0], list[1], list[2], list[3]];
  }
  return ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];
}

async function callLLM(systemPrompt: string, userMessage: string, config: LLMConfig): Promise<string> {
  if (config.provider === 'gemini') {
    return callGeminiApi(systemPrompt, userMessage, config);
  } else {
    return callOpenAICompatibleApi(systemPrompt, userMessage, config);
  }
}

async function callGeminiApi(systemPrompt: string, userMessage: string, config: LLMConfig): Promise<string> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key cho Google Gemini để bắt đầu sinh câu hỏi.');
  }

  const model = config.model || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\n---\n\n${userMessage}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorText = '';
    try {
      const errJson = await response.json();
      errorText = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorText = await response.text();
    }
    
    if (response.status === 429) {
      throw new Error(`Đã đạt giới hạn yêu cầu (Rate Limit - 429) của Gemini: ${errorText}. Vui lòng thử lại sau giây lát.`);
    } else if (response.status === 400 && errorText.includes('API key')) {
      throw new Error('API Key Gemini không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại key.');
    }
    throw new Error(`Lỗi Gemini API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini không trả về nội dung text. Có thể do kiểm duyệt an toàn hoặc văn bản không phù hợp.');
  }

  return text;
}

async function callOpenAICompatibleApi(systemPrompt: string, userMessage: string, config: LLMConfig): Promise<string> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key.');
  }

  let baseUrl = 'https://api.openai.com/v1';
  if (config.provider === 'groq') {
    baseUrl = 'https://api.groq.com/openai/v1';
  } else if (config.customBaseUrl) {
    baseUrl = config.customBaseUrl.replace(/\/+$/, '');
  }

  const url = `${baseUrl}/chat/completions`;
  const model = config.model || (config.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorText = '';
    try {
      const errJson = await response.json();
      errorText = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorText = await response.text();
    }
    throw new Error(`Lỗi API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('API không trả về nội dung phản hồi.');
  }

  return text;
}

function parseLLMResponse(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt relaxed cleanup for trailing commas
    const fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(fixed);
    } catch {
      console.error('Lỗi phân tích JSON từ LLM:', rawText);
      throw new Error('Không thể phân tích dữ liệu JSON từ AI. Vui lòng thử lại phần này.');
    }
  }
}
