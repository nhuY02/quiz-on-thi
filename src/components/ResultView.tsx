import React, { useState, useEffect } from 'react';
import { QuizQuestion, SavedQuizBank } from '../types/quiz';
import { exportQuizBankToJson } from '../services/storage';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  PlusCircle,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  FileCheck2,
  AlertTriangle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Shuffle,
} from 'lucide-react';

interface ResultViewProps {
  quizBank: SavedQuizBank;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
  flaggedQuestions: Record<string, boolean>;
  onRetryIncorrectOnly: (incorrectQuestions: QuizQuestion[]) => void;
  onRetryAll: () => void;
  onNewQuiz: () => void;
  onViewCoverage: () => void;
  onRefreshExam?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  quizBank,
  questions,
  userAnswers,
  flaggedQuestions,
  onRetryIncorrectOnly,
  onRetryAll,
  onNewQuiz,
  onViewCoverage,
  onRefreshExam,
}) => {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const total = questions.length;
  let correctCount = 0;
  const incorrectQuestions: QuizQuestion[] = [];

  questions.forEach((q) => {
    const chosen = userAnswers[q.id];
    if (chosen === q.correctIndex) {
      correctCount++;
    } else {
      incorrectQuestions.push(q);
    }
  });

  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  // Trigger celebration confetti for good scores
  useEffect(() => {
    if (percentage >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [percentage]);

  // Performance breakdown by Section
  const sectionStats: Record<string, { total: number; correct: number }> = {};
  questions.forEach((q) => {
    const secName = q.section;
    if (!sectionStats[secName]) {
      sectionStats[secName] = { total: 0, correct: 0 };
    }
    sectionStats[secName].total++;
    if (userAnswers[q.id] === q.correctIndex) {
      sectionStats[secName].correct++;
    }
  });

  // Performance breakdown by Topic
  const topicStats: Record<string, { total: number; correct: number; section: string }> = {};
  questions.forEach((q) => {
    const topName = q.topic || 'Chủ đề chung';
    if (!topicStats[topName]) {
      topicStats[topName] = { total: 0, correct: 0, section: q.section };
    }
    topicStats[topName].total++;
    if (userAnswers[q.id] === q.correctIndex) {
      topicStats[topName].correct++;
    }
  });

  const filteredQuestions = questions.filter((q) => {
    const isCorrect = userAnswers[q.id] === q.correctIndex;
    if (filter === 'incorrect') return !isCorrect;
    if (filter === 'flagged') return Boolean(flaggedQuestions[q.id]);
    return true;
  });

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Hero Result Banner */}
      <div className="result-hero">
        <div className="score-circle">
          <span className="score-number">{correctCount}</span>
          <span className="score-total">/ {total} câu</span>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          {percentage >= 90
            ? '🎉 Xuất Sắc! Nắm Vững Kiến Thức'
            : percentage >= 70
            ? '👍 Kết Quả Tốt! Ôn Lại Vài Chỗ Chưa Chắc'
            : percentage >= 50
            ? '📚 Cần Cố Gắng! Hãy Ôn Lại Các Phần Yếu'
            : '⚠️ Hãy Ôn Tập Kỹ Lại Nội Dung Tài Liệu'}
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
          Bạn đạt <strong>{percentage}%</strong> điểm số tổng quan ({correctCount}/{total} câu đúng).
        </p>

        {/* Coverage banner quick link */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onViewCoverage}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Layers size={14} color="var(--brand-primary)" />
            <span>Độ phủ: {quizBank.coverageReport.coveragePercentage}% ({quizBank.coverageReport.coveredConcepts}/{quizBank.coverageReport.totalConcepts} khái niệm)</span>
          </button>
        </div>
      </div>

      {/* Main Actions Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        {incorrectQuestions.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onRetryIncorrectOnly(incorrectQuestions)}
          >
            <RotateCcw size={16} />
            <span>Làm lại {incorrectQuestions.length} câu sai</span>
          </button>
        )}

        {onRefreshExam && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRefreshExam}
            title="Bốc ngẫu nhiên một đề thi mới với các câu hỏi và kiến thức khác từ tài liệu"
          >
            <Shuffle size={16} />
            <span>Bốc đề thi mới (Câu hỏi khác)</span>
          </button>
        )}

        <button type="button" className="btn btn-secondary" onClick={onRetryAll}>
          <RotateCcw size={16} />
          <span>Làm lại đề vừa thi</span>
        </button>

        <button type="button" className="btn btn-secondary" onClick={() => exportQuizBankToJson(quizBank)}>
          <Download size={16} />
          <span>Xuất file JSON</span>
        </button>

        <button type="button" className="btn btn-secondary" onClick={onNewQuiz}>
          <PlusCircle size={16} />
          <span>Tạo bộ câu hỏi mới</span>
        </button>
      </div>

      {/* Section & Topic Weakness Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          Phân Tích Kết Quả Theo Từng Phần & Chủ Đề
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Xác định chính xác phần nào bạn đã nắm vững và phần nào còn yếu để tập trung ôn tập hiệu quả.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {Object.entries(sectionStats).map(([secTitle, stats]) => {
            const secPercent = Math.round((stats.correct / stats.total) * 100);
            const isWeak = secPercent < 60;
            return (
              <div
                key={secTitle}
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isWeak ? 'var(--warning-light)' : 'var(--bg-subtle)',
                  border: `1px solid ${isWeak ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {secTitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {stats.correct}/{stats.total} câu ({secPercent}%)
                    </span>
                    {isWeak && (
                      <span className="badge badge-warning">Cần ôn lại</span>
                    )}
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '7px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${secPercent}%`,
                      background: isWeak ? 'var(--warning)' : secPercent >= 80 ? 'var(--success)' : 'var(--brand-primary)',
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Danh Sách Chi Tiết Lời Giải ({filteredQuestions.length})
          </h2>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({total})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'incorrect' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('incorrect')}
            >
              Câu sai ({incorrectQuestions.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'flagged' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('flagged')}
            >
              Đã đánh dấu ({Object.values(flaggedQuestions).filter(Boolean).length})
            </button>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Không có câu hỏi nào trong mục này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredQuestions.map((q, qIdx) => {
              const chosen = userAnswers[q.id];
              const isCorrect = chosen === q.correctIndex;
              const isExpanded = expandedId === q.id || filter === 'incorrect';

              return (
                <div
                  key={q.id}
                  style={{
                    padding: '1.15rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isCorrect ? 'var(--border-subtle)' : 'var(--error-border)'}`,
                    background: isCorrect ? 'var(--bg-surface)' : 'var(--bg-surface)',
                  }}
                >
                  {/* Question header row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {isCorrect ? (
                          <CheckCircle2 size={19} color="var(--success)" />
                        ) : (
                          <XCircle size={19} color="var(--error)" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                            {q.section}
                          </span>
                          <span className="badge badge-brand" style={{ fontSize: '0.72rem' }}>
                            {q.topic}
                          </span>
                          {flaggedQuestions[q.id] && (
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                              Đã đánh dấu
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Expanded details (Options & Detailed explanation) */}
                  {isExpanded && (
                    <div className="animate-fade-in" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                      {/* Options list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const isThisCorrect = optIdx === q.correctIndex;
                          const isThisChosen = optIdx === chosen;

                          let bg = 'var(--bg-subtle)';
                          let border = 'var(--border-subtle)';
                          let color = 'var(--text-primary)';

                          if (isThisCorrect) {
                            bg = 'var(--success-light)';
                            border = 'var(--success-border)';
                            color = 'var(--success-text)';
                          } else if (isThisChosen && !isThisCorrect) {
                            bg = 'var(--error-light)';
                            border = 'var(--error-border)';
                            color = 'var(--error-text)';
                          }

                          return (
                            <div
                              key={optIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.65rem 0.85rem',
                                borderRadius: 'var(--radius-md)',
                                background: bg,
                                border: `1px solid ${border}`,
                                color,
                                fontSize: '0.9rem',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '50%',
                                  background: isThisCorrect ? 'var(--success)' : isThisChosen ? 'var(--error)' : 'var(--bg-surface)',
                                  color: isThisCorrect || isThisChosen ? '#fff' : 'var(--text-primary)',
                                  fontSize: '0.8rem',
                                  flexShrink: 0,
                                }}
                              >
                                {letters[optIdx]}
                              </span>
                              <span style={{ flex: 1, fontWeight: isThisCorrect || isThisChosen ? 600 : 400 }}>
                                {opt}
                              </span>
                              {isThisCorrect && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                                  (Đáp án đúng)
                                </span>
                              )}
                              {isThisChosen && !isThisCorrect && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--error)' }}>
                                  (Bạn đã chọn)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          <HelpCircle size={15} color="var(--brand-primary)" />
                          <span>Giải thích chi tiết:</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {q.explanation}
                        </p>
                        {q.sourceRef && (
                          <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileCheck2 size={13} />
                            <span>Nguồn tham chiếu: <strong>{q.sourceRef}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
