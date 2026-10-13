import React, { useState } from 'react';
import { SavedQuizBank, QuizConfig } from '../types/quiz';
import {
  Layers,
  BookOpen,
  CheckCircle2,
  Shuffle,
  Eye,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface ConfigViewProps {
  quizBank: SavedQuizBank;
  onStartQuiz: (config: QuizConfig) => void;
  onBack: () => void;
  onViewCoverage: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  quizBank,
  onStartQuiz,
  onBack,
  onViewCoverage,
}) => {
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(
    quizBank.sections.map((s) => s.id)
  );
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  const toggleSection = (id: string) => {
    if (selectedSectionIds.includes(id)) {
      if (selectedSectionIds.length === 1) {
        alert('Cần chọn ít nhất một phần để làm bài!');
        return;
      }
      setSelectedSectionIds(selectedSectionIds.filter((sId) => sId !== id));
    } else {
      setSelectedSectionIds([...selectedSectionIds, id]);
    }
  };

  const selectAllSections = () => {
    if (selectedSectionIds.length === quizBank.sections.length) {
      setSelectedSectionIds([quizBank.sections[0].id]);
    } else {
      setSelectedSectionIds(quizBank.sections.map((s) => s.id));
    }
  };

  const selectedQuestionsCount = quizBank.sections
    .filter((s) => selectedSectionIds.includes(s.id))
    .reduce((acc, s) => acc + s.questions.length, 0);

  const handleStart = () => {
    onStartQuiz({
      mode,
      selectedSectionIds,
      shuffleQuestions,
      shuffleOptions,
    });
  };

  const { coverageReport } = quizBank;

  return (
    <div className="config-container animate-fade-in">
      {/* Title & Document Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ marginBottom: '0.4rem', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} /> Quay lại tải tài liệu
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Cấu Hình Bài Ôn Thi
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={15} />
            <span>Tài liệu: <strong>{quizBank.title}</strong></span>
          </p>
        </div>

        {/* Coverage report banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--brand-gradient-subtle)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          onClick={onViewCoverage}
          title="Bấm để xem danh sách chi tiết các khái niệm"
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.88rem',
            }}
          >
            {coverageReport.coveragePercentage}%
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Độ Phủ Nội Dung
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {coverageReport.coveredConcepts}/{coverageReport.totalConcepts} khái niệm đã có câu hỏi
            </div>
          </div>
          <span className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
            Chi tiết
          </span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
          1. Chọn Chế Độ Làm Bài
        </h2>

        <div className="mode-grid">
          {/* Practice mode */}
          <div
            className={`mode-card ${mode === 'practice' ? 'selected' : ''}`}
            onClick={() => setMode('practice')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'practice' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                  color: mode === 'practice' ? '#ffffff' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Chế độ "Luyện Tập"
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Xem đáp án đúng/sai và lời giải thích chi tiết <strong>ngay sau mỗi câu</strong> bạn chọn. Phù hợp nhất để tự học và nắm chắc kiến thức.
            </p>
          </div>

          {/* Exam mode */}
          <div
            className={`mode-card ${mode === 'exam' ? 'selected' : ''}`}
            onClick={() => setMode('exam')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'exam' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                  color: mode === 'exam' ? '#ffffff' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Chế độ "Thi Thử"
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Làm toàn bộ đề thi không hiển thị đáp án trước. Chỉ khi bạn bấm <strong>Nộp bài</strong> mới nhận điểm số, % đúng và giải thích các câu sai.
            </p>
          </div>
        </div>
      </div>

      {/* Sections selection */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              2. Chọn Phần / Chương Muốn Ôn Tập
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Đã chọn <strong>{selectedQuestionsCount}</strong> câu hỏi từ <strong>{selectedSectionIds.length}/{quizBank.sections.length}</strong> phần
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={selectAllSections}
          >
            {selectedSectionIds.length === quizBank.sections.length ? 'Bỏ chọn bớt' : 'Chọn tất cả phần'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {quizBank.sections.map((section, idx) => {
            const isSelected = selectedSectionIds.includes(section.id);
            return (
              <label
                key={section.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                  border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSection(section.id)}
                  style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {section.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span>{section.questions.length} câu hỏi</span>
                    {section.pageRange && <span>• {section.pageRange}</span>}
                    <span>• {section.coveredConcepts.length} khái niệm đã phủ</span>
                  </div>
                </div>

                <span className="badge badge-neutral" style={{ flexShrink: 0 }}>
                  Phần {idx + 1}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Shuffling Options */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
          3. Tùy Chọn Xáo Trộn
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className="switch-group" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Shuffle size={18} color="var(--brand-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  Xáo trộn thứ tự câu hỏi
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Đảo lộn vị trí câu hỏi ngẫu nhiên giữa các phần để kiểm tra phản xạ kiến thức
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
          </label>

          <label className="switch-group" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Shuffle size={18} color="var(--brand-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  Xáo trộn thứ tự các đáp án (A, B, C, D)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Đảo vị trí 4 đáp án của mỗi câu hỏi để tránh học vẹt vị trí
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onBack}>
          Quay lại
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          disabled={selectedQuestionsCount === 0}
        >
          <span>Bắt đầu làm bài ({selectedQuestionsCount} câu)</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
