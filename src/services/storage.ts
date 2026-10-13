import { SavedQuizBank, LLMConfig } from '../types/quiz';

const STORAGE_KEYS = {
  QUIZ_BANKS: 'quiz_on_thi_banks_v1',
  ACTIVE_BANK_ID: 'quiz_on_thi_active_bank_id',
  LLM_CONFIG: 'quiz_on_thi_llm_config',
  THEME: 'quiz_on_thi_theme',
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
};

export function getSavedQuizBanks(): SavedQuizBank[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_BANKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Lỗi đọc ngân hàng câu hỏi từ LocalStorage:', err);
    return [];
  }
}

export function saveQuizBank(bank: SavedQuizBank): void {
  try {
    const list = getSavedQuizBanks();
    const existingIndex = list.findIndex(b => b.id === bank.id);
    if (existingIndex >= 0) {
      list[existingIndex] = bank;
    } else {
      list.unshift(bank);
    }
    // Limit to 20 banks
    if (list.length > 20) list.pop();
    localStorage.setItem(STORAGE_KEYS.QUIZ_BANKS, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BANK_ID, bank.id);
  } catch (err) {
    console.error('Lỗi khi lưu bộ câu hỏi:', err);
  }
}

export function deleteQuizBank(id: string): SavedQuizBank[] {
  try {
    const list = getSavedQuizBanks().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUIZ_BANKS, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function updateQuizBankTitle(id: string, newTitle: string): SavedQuizBank[] {
  try {
    const list = getSavedQuizBanks();
    const bank = list.find(b => b.id === id);
    if (bank) {
      bank.title = newTitle;
      localStorage.setItem(STORAGE_KEYS.QUIZ_BANKS, JSON.stringify(list));
    }
    return list;
  } catch (err) {
    console.error('Lỗi khi sửa tên bộ đề:', err);
    return getSavedQuizBanks();
  }
}

export function getSavedLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG);
    if (!raw) return DEFAULT_LLM_CONFIG;
    return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Lỗi lưu cấu hình LLM:', err);
  }
}

export function exportQuizBankToJson(bank: SavedQuizBank): void {
  const jsonStr = JSON.stringify(bank, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = bank.title.replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ\s_-]/g, '').trim().replace(/\s+/g, '_');
  a.href = url;
  a.download = `Quiz_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importQuizBankFromJson(file: File): Promise<SavedQuizBank> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('File JSON không đúng định dạng ngân hàng câu hỏi Quiz Ôn Thi.');
  }
  const bank: SavedQuizBank = {
    id: parsed.id || `bank_imported_${Date.now()}`,
    title: parsed.title || file.name.replace(/\.json$/i, ''),
    createdAt: parsed.createdAt || new Date().toISOString(),
    fileName: parsed.fileName || file.name,
    fileSize: parsed.fileSize || file.size,
    sections: parsed.sections || [],
    questions: parsed.questions,
    coverageReport: parsed.coverageReport || {
      totalConcepts: 0,
      coveredConcepts: 0,
      coveragePercentage: 100,
      missingConcepts: [],
      allConcepts: []
    }
  };
  saveQuizBank(bank);
  return bank;
}
