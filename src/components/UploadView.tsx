import React, { useState, useRef, useEffect } from 'react';
import { LLMConfig, DocumentSection, SavedQuizBank } from '../types/quiz';
import { parseFile, ParsedDocument } from '../services/fileParser';
import { splitDocumentIntoSections } from '../services/sectionSplitter';
import { processSectionQuiz, calculateCoverageReport } from '../services/llmService';
import { saveQuizBank, saveActiveDraft, getActiveDraft, clearActiveDraft } from '../services/storage';
import { SAMPLE_QUIZ_BANK } from '../services/sampleData';
import { logFileUploadEvent } from '../services/firebaseService';
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
  Trash2,
  Pause,
  Play,
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
  const [isPaused, setIsPaused] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);
  const [currentStepStatus, setCurrentStepStatus] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<{
    fileName: string;
    completedCount: number;
    totalCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPausedRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const sectionsRef = useRef<DocumentSection[]>([]);
  sectionsRef.current = sections;

  // Restore draft on mount and warn on reload during generation
  useEffect(() => {
    const draft = getActiveDraft();
    if (draft && draft.sections && draft.sections.length > 0) {
      const safeSections = draft.sections.map((s) =>
        s.status === 'processing' ? { ...s, status: 'pending' as const } : s
      );
      setParsedDoc(draft.parsedDoc);
      setSections(safeSections);
      sectionsRef.current = safeSections;

      const completed = safeSections.filter((s) => s.status === 'completed').length;
      setRestoredDraftInfo({
        fileName: draft.fileName,
        completedCount: completed,
        totalCount: safeSections.length,
      });
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGeneratingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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
      sectionsRef.current = detectedSections;
      setIsParsing(false);
      setParseStatus('');
      setRestoredDraftInfo(null);
      saveActiveDraft({
        parsedDoc: doc,
        sections: detectedSections,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });
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

  const handlePauseGeneration = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    setCurrentStepStatus(
      'Đã tạm dừng. Bạn có thể xóa các phần không cần phía dưới (để tiết kiệm token), sau đó bấm "Tiếp tục sinh câu hỏi".'
    );
  };

  const handleResumeGeneration = () => {
    isPausedRef.current = false;
    setIsPaused(false);
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
    isGeneratingRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    setGeneralError('');

    while (isGeneratingRef.current) {
      // 1. Wait while paused
      while (isPausedRef.current && isGeneratingRef.current) {
        await new Promise((r) => setTimeout(r, 250));
      }

      if (!isGeneratingRef.current) break;

      // 2. Find next section that is not completed
      const targetIndex = sectionsRef.current.findIndex((s) => s.status !== 'completed');
      if (targetIndex === -1) {
        // All remaining sections completed!
        break;
      }

      setCurrentSectionIndex(targetIndex);
      const sectionToProcess = sectionsRef.current[targetIndex];

      // Mark processing in state
      const updated = [...sectionsRef.current];
      updated[targetIndex] = {
        ...updated[targetIndex],
        status: 'processing',
        error: undefined,
      };
      setSections([...updated]);

      try {
        const result = await processSectionQuiz(
          sectionToProcess,
          llmConfig,
          (statusText) => {
            if (!isPausedRef.current) {
              const currentTotal = sectionsRef.current.length;
              const currentIdx = sectionsRef.current.findIndex((s) => s.id === sectionToProcess.id);
              setCurrentStepStatus(`Phần ${currentIdx + 1}/${currentTotal}: ${statusText}`);
            }
          }
        );

        // Update completed section in live sections
        const liveIndex = sectionsRef.current.findIndex((s) => s.id === sectionToProcess.id);
        if (liveIndex !== -1) {
          const completedList = [...sectionsRef.current];
          completedList[liveIndex] = {
            ...completedList[liveIndex],
            keyConcepts: result.keyConcepts,
            coveredConcepts: result.coveredConcepts,
            questions: result.questions,
            status: 'completed',
          };
          setSections([...completedList]);
          sectionsRef.current = completedList;
          saveActiveDraft({
            parsedDoc,
            sections: completedList,
            fileName: file ? file.name : parsedDoc?.fileName,
            fileSize: file ? file.size : parsedDoc?.fileSize,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const liveIndex = sectionsRef.current.findIndex((s) => s.id === sectionToProcess.id);
        if (liveIndex !== -1) {
          const errorList = [...sectionsRef.current];
          errorList[liveIndex] = {
            ...errorList[liveIndex],
            status: 'error',
            error: message,
          };
          setSections([...errorList]);
        }
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setGeneralError(`Có lỗi tại phần ${targetIndex + 1} (${sectionToProcess.title}): ${message}`);
        return;
      }
    }

    setIsGenerating(false);
    isGeneratingRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentSectionIndex(-1);

    // Compute final coverage report and quiz bank if all completed
    const finalSections = sectionsRef.current;
    if (finalSections.length > 0 && finalSections.every((s) => s.status === 'completed')) {
      clearActiveDraft();
      setRestoredDraftInfo(null);
      const coverageReport = calculateCoverageReport(finalSections);
      const allQuestions = finalSections.flatMap((s) => s.questions);

      const quizBank: SavedQuizBank = {
        id: `bank_${Date.now()}`,
        title: parsedDoc ? parsedDoc.fileName.replace(/\.[^/.]+$/, '') : 'Đề trắc nghiệm ôn thi',
        createdAt: new Date().toISOString(),
        fileName: parsedDoc ? parsedDoc.fileName : 'tai_lieu.pdf',
        fileSize: parsedDoc ? parsedDoc.fileSize : 0,
        sections: finalSections,
        questions: allQuestions,
        coverageReport,
      };

      saveQuizBank(quizBank);
      logFileUploadEvent({
        fileName: quizBank.fileName,
        fileSize: quizBank.fileSize,
        questionCount: quizBank.questions.length,
        sectionsCount: quizBank.sections.length,
        quizTitle: quizBank.title,
      });
      onQuizReady(quizBank);
    }
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
        logFileUploadEvent({
          fileName: quizBank.fileName,
          fileSize: quizBank.fileSize,
          questionCount: quizBank.questions.length,
          sectionsCount: quizBank.sections.length,
          quizTitle: quizBank.title,
        });
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

  const handleDeleteSection = (index: number) => {
    if (sections.length <= 1) {
      alert('Tài liệu cần có ít nhất 1 phần để sinh câu hỏi!');
      return;
    }
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
    sectionsRef.current = updated;
    saveActiveDraft({
      parsedDoc,
      sections: updated,
      fileName: file ? file.name : parsedDoc?.fileName,
      fileSize: file ? file.size : parsedDoc?.fileSize,
    });
  };

  const handleDiscardDraft = () => {
    clearActiveDraft();
    setParsedDoc(null);
    setFile(null);
    setSections([]);
    sectionsRef.current = [];
    setRestoredDraftInfo(null);
  };

  const handleLoadSample = () => {
    clearActiveDraft();
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
          {file ? file.name : parsedDoc ? parsedDoc.fileName : 'Kéo thả file vào đây hoặc bấm để chọn'}
        </div>
        <div className="drop-text-secondary">
          {parsedDoc
            ? 'Bấm để chọn file khác nếu bạn muốn thay thế tài liệu hiện tại.'
            : (
              <>Hỗ trợ định dạng <strong>PDF</strong>, <strong>Word (.docx)</strong>, <strong>Văn bản (.txt)</strong>.</>
            )}
        </div>

        {(file || parsedDoc) && (
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
            <span>
              Dung lượng:{' '}
              {(((file ? file.size : parsedDoc?.fileSize) || 0) / 1024).toFixed(1)} KB
            </span>
            {parsedDoc && parsedDoc.pageCount > 1 && (
              <span>• {parsedDoc.pageCount} trang</span>
            )}
          </div>
        )}
      </div>

      {/* Restored Draft Banner */}
      {restoredDraftInfo && !isGenerating && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.88rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                Đã tự động khôi phục tiến trình đang tạo dở:
              </strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {restoredDraftInfo.fileName} (Đã hoàn thành {restoredDraftInfo.completedCount}/{restoredDraftInfo.totalCount} phần - không tốn lại token!).
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleDiscardDraft}
            style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
            title="Hủy bỏ bản nháp này để tải file mới"
          >
            Hủy bản nháp
          </button>
        </div>
      )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tài liệu được chia thành {sections.length} phần độc lập
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Dự kiến sinh khoảng ~{totalQuestionsEstimate} câu hỏi bao quát định nghĩa, so sánh, thuật toán và ứng dụng.
              </p>
            </div>

            {isGenerating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                {isPaused ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleResumeGeneration}
                    style={{
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <Play size={18} />
                    Tiếp tục sinh câu hỏi
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={handlePauseGeneration}
                      title="Tạm dừng để xem hoặc xóa bớt các phần không cần phía dưới"
                      style={{
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <Pause size={17} />
                      Tạm dừng
                    </button>
                    <button
                      className="btn btn-primary btn-lg"
                      disabled
                      style={{
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        opacity: 0.9,
                        cursor: 'not-allowed',
                      }}
                    >
                      <RotateCw size={18} className="animate-spin" />
                      Đang xử lý phần {currentSectionIndex + 1}/{sections.length}...
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartGeneration}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <Sparkles size={18} />
                {sections.some((s) => s.status === 'completed') ? (
                  <>Tiếp tục sinh câu hỏi (Còn lại {sections.filter((s) => s.status !== 'completed').length}/{sections.length} phần)</>
                ) : (
                  <>Bắt đầu sinh câu hỏi ({sections.length} phần)</>
                )}
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* Real-time status banner while generating */}
          {isGenerating && currentStepStatus && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isPaused ? 'rgba(245, 158, 11, 0.12)' : 'var(--brand-primary-light)',
                border: isPaused ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
                color: isPaused ? '#f59e0b' : 'var(--brand-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              {isPaused ? (
                <>
                  <Pause size={16} />
                  <span>{currentStepStatus}</span>
                </>
              ) : (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  <span>{currentStepStatus}</span>
                </>
              )}
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

                    {((!isGenerating && sec.status !== 'processing') || (isPaused && sec.status === 'pending')) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDeleteSection(idx)}
                        title={`Xóa "${sec.title}" để không sinh câu hỏi (tiết kiệm token)`}
                        style={{
                          padding: '0.35rem',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--error)';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
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
