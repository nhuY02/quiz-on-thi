import React, { useState, useRef } from 'react';
import { LLMConfig, DocumentSection, SavedQuizBank } from '../types/quiz';
import { parseFile, ParsedDocument } from '../services/fileParser';
import { splitDocumentIntoSections } from '../services/sectionSplitter';
import { processSectionQuiz, calculateCoverageReport } from '../services/llmService';
import { saveQuizBank } from '../services/storage';
import { SAMPLE_QUIZ_BANK } from '../services/sampleData';
import {
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  ArrowRight,
  BookOpen,
  Key,
} from 'lucide-react';

interface UploadViewProps {
  llmConfig: LLMConfig;
  onOpenSettings: () => void;
  onQuizReady: (bank: SavedQuizBank) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  llmConfig,
  onOpenSettings,
  onQuizReady,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);
  const [currentStepStatus, setCurrentStepStatus] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setGeneralError('');
    setFile(selectedFile);
    setIsParsing(true);
    setParseStatus('Đang đọc file...');
    setParseProgress(10);
    setSections([]);

    try {
      const doc = await parseFile(selectedFile, (percent, status) => {
        setParseProgress(percent);
        setParseStatus(status);
      });

      setParsedDoc(doc);
      setParseStatus('Đang phân tích cấu trúc & chia phần tài liệu...');
      const detectedSections = splitDocumentIntoSections(doc);
      setSections(detectedSections);
      setIsParsing(false);
      setParseStatus('');
    } catch (err: unknown) {
      setIsParsing(false);
      const message = err instanceof Error ? err.message : String(err);
      setGeneralError(message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleStartGeneration = async () => {
    if (!llmConfig.apiKey.trim()) {
      onOpenSettings();
      return;
    }

    if (sections.length === 0) {
      setGeneralError('Chưa có nội dung phần nào để sinh câu hỏi.');
      return;
    }

    setIsGenerating(true);
    setGeneralError('');

    const updatedSections = [...sections];

    for (let i = 0; i < updatedSections.length; i++) {
      // If already completed in a previous partial run, skip
      if (updatedSections[i].status === 'completed') continue;

      setCurrentSectionIndex(i);
      updatedSections[i].status = 'processing';
      updatedSections[i].error = undefined;
      setSections([...updatedSections]);

      try {
        const result = await processSectionQuiz(
          updatedSections[i],
          llmConfig,
          (statusText) => {
            setCurrentStepStatus(`Phần ${i + 1}/${updatedSections.length}: ${statusText}`);
          }
        );

        updatedSections[i].keyConcepts = result.keyConcepts;
        updatedSections[i].coveredConcepts = result.coveredConcepts;
        updatedSections[i].questions = result.questions;
        updatedSections[i].status = 'completed';
        setSections([...updatedSections]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        updatedSections[i].status = 'error';
        updatedSections[i].error = message;
        setSections([...updatedSections]);
        setIsGenerating(false);
        setGeneralError(`Có lỗi tại phần ${i + 1} (${updatedSections[i].title}): ${message}`);
        return;
      }
    }

    setIsGenerating(false);
    setCurrentSectionIndex(-1);

    // Compute final coverage report and quiz bank
    const coverageReport = calculateCoverageReport(updatedSections);
    const allQuestions = updatedSections.flatMap((s) => s.questions);

    const quizBank: SavedQuizBank = {
      id: `bank_${Date.now()}`,
      title: parsedDoc ? parsedDoc.fileName.replace(/\.[^/.]+$/, '') : 'Đề trắc nghiệm ôn thi',
      createdAt: new Date().toISOString(),
      fileName: parsedDoc ? parsedDoc.fileName : 'tai_lieu.pdf',
      fileSize: parsedDoc ? parsedDoc.fileSize : 0,
      sections: updatedSections,
      questions: allQuestions,
      coverageReport,
    };

    saveQuizBank(quizBank);
    onQuizReady(quizBank);
  };

  const handleRetrySection = async (index: number) => {
    if (!llmConfig.apiKey.trim()) {
      onOpenSettings();
      return;
    }

    setGeneralError('');
    setIsGenerating(true);
    setCurrentSectionIndex(index);

    const updatedSections = [...sections];
    updatedSections[index].status = 'processing';
    updatedSections[index].error = undefined;
    setSections([...updatedSections]);

    try {
      const result = await processSectionQuiz(
        updatedSections[index],
        llmConfig,
        (statusText) => {
          setCurrentStepStatus(`Phần ${index + 1}/${updatedSections.length}: ${statusText}`);
        }
      );

      updatedSections[index].keyConcepts = result.keyConcepts;
      updatedSections[index].coveredConcepts = result.coveredConcepts;
      updatedSections[index].questions = result.questions;
      updatedSections[index].status = 'completed';
      setSections([...updatedSections]);

      // Check if all are now completed
      const allDone = updatedSections.every((s) => s.status === 'completed');
      if (allDone) {
        const coverageReport = calculateCoverageReport(updatedSections);
        const allQuestions = updatedSections.flatMap((s) => s.questions);
        const quizBank: SavedQuizBank = {
          id: `bank_${Date.now()}`,
          title: parsedDoc ? parsedDoc.fileName.replace(/\.[^/.]+$/, '') : 'Đề trắc nghiệm ôn thi',
          createdAt: new Date().toISOString(),
          fileName: parsedDoc ? parsedDoc.fileName : 'tai_lieu.pdf',
          fileSize: parsedDoc ? parsedDoc.fileSize : 0,
          sections: updatedSections,
          questions: allQuestions,
          coverageReport,
        };
        saveQuizBank(quizBank);
        onQuizReady(quizBank);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      updatedSections[index].status = 'error';
      updatedSections[index].error = message;
      setSections([...updatedSections]);
      setGeneralError(`Lỗi khi thử lại phần ${index + 1}: ${message}`);
    } finally {
      setIsGenerating(false);
      setCurrentSectionIndex(-1);
    }
  };

  const handleLoadSample = () => {
    saveQuizBank(SAMPLE_QUIZ_BANK);
    onQuizReady(SAMPLE_QUIZ_BANK);
  };

  const totalQuestionsEstimate = sections.reduce(
    (acc, s) => acc + Math.max(3, Math.min(8, Math.ceil(s.wordCount / 220))),
    0
  );

  return (
    <div className="animate-fade-in">
      {/* Hero Header */}
      <div className="upload-hero">
        <h1 className="upload-title">
          Tạo Đề Trắc Nghiệm <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bao Quát Toàn Diện</span> Từ Tài Liệu
        </h1>
        <p className="upload-subtitle">
          Tải lên tài liệu PDF, Word (.docx) hoặc Text (.txt). AI sẽ phân tích từng phần, kiểm tra độ phủ kiến thức và tạo bộ câu hỏi chất lượng cao kèm giải thích chi tiết.
        </p>

        {/* Quick sample button */}
        <div className="sample-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLoadSample}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Sparkles size={15} color="var(--brand-primary)" />
            <span>Trải nghiệm ngay với đề mẫu (Không cần API Key)</span>
          </button>
        </div>
      </div>

      {/* API Key warning if not set */}
      {!llmConfig.apiKey.trim() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--brand-primary-light)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Key size={18} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Bạn chưa nhập API Key. Hãy cấu hình Gemini API Key (miễn phí) để AI có thể sinh câu hỏi từ file của bạn.
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onOpenSettings}>
            Cấu hình ngay
          </button>
        </div>
      )}

      {/* Error alert */}
      {generalError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--error-light)',
            border: '1px solid var(--error-border)',
            color: 'var(--error-text)',
            marginBottom: '1.5rem',
            fontSize: '0.92rem',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
          accept=".pdf,.docx,.txt,.md"
          style={{ display: 'none' }}
        />

        <div className="drop-icon-container">
          <UploadCloud size={32} />
        </div>

        <div className="drop-text-primary">
          {file ? file.name : 'Kéo thả file vào đây hoặc bấm để chọn'}
        </div>
        <div className="drop-text-secondary">
          Hỗ trợ định dạng <strong>PDF</strong>, <strong>Word (.docx)</strong>, <strong>Văn bản (.txt)</strong>.
        </div>

        {file && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <FileText size={16} color="var(--brand-primary)" />
            <span>Dung lượng: {(file.size / 1024).toFixed(1)} KB</span>
            {parsedDoc && parsedDoc.pageCount > 1 && (
              <span>• {parsedDoc.pageCount} trang</span>
            )}
          </div>
        )}
      </div>

      {/* Parsing progress */}
      {isParsing && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 600 }}>{parseStatus}</span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{parseProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${parseProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Sections Preview & Start Button */}
      {sections.length > 0 && !isParsing && (
        <div className="card process-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tài liệu được chia thành {sections.length} phần độc lập
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Dự kiến sinh khoảng ~{totalQuestionsEstimate} câu hỏi bao quát định nghĩa, so sánh, thuật toán và ứng dụng.
              </p>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartGeneration}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  Đang xử lý phần {currentSectionIndex + 1}/{sections.length}...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Bắt đầu sinh câu hỏi ({sections.length} phần)
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Real-time status banner while generating */}
          {isGenerating && currentStepStatus && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary-light)',
                color: 'var(--brand-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <RotateCw size={16} className="animate-spin" />
              <span>{currentStepStatus}</span>
            </div>
          )}

          {/* Section list preview with status badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {sections.map((sec, idx) => {
              const isCurrent = currentSectionIndex === idx;
              return (
                <div
                  key={sec.id}
                  className={`section-item ${isCurrent ? 'active' : ''} ${sec.status === 'completed' ? 'completed' : ''} ${sec.status === 'error' ? 'error' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: 'var(--radius-full)',
                        background: sec.status === 'completed' ? 'var(--success)' : 'var(--bg-surface)',
                        color: sec.status === 'completed' ? '#fff' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {sec.status === 'completed' ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sec.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem' }}>
                        <span>{sec.wordCount} từ</span>
                        {sec.pageRange && <span>• {sec.pageRange}</span>}
                        {sec.questions.length > 0 && (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            • Đã sinh {sec.questions.length} câu hỏi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {sec.status === 'completed' && (
                      <span className="badge badge-success">Hoàn tất</span>
                    )}

                    {sec.status === 'processing' && (
                      <span className="badge badge-brand animate-pulse">
                        <RotateCw size={11} className="animate-spin" /> Đang tạo...
                      </span>
                    )}

                    {sec.status === 'error' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="badge badge-error">Lỗi</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRetrySection(idx)}
                          disabled={isGenerating}
                        >
                          Thử lại
                        </button>
                      </div>
                    )}

                    {sec.status === 'pending' && (
                      <span className="badge badge-neutral">Chờ xử lý</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
