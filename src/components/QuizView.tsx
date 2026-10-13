import React, { useState } from 'react';
import { QuizQuestion, QuizConfig } from '../types/quiz';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Grid,
  X,
  FileCheck2,
} from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
  config: QuizConfig;
  onFinishQuiz: (userAnswers: Record<string, number>, flagged: Record<string, boolean>) => void;
  onExit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  config,
  onFinishQuiz,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const curQ = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  const isAnswered = curQ.id in userAnswers;
  const selectedIndex = userAnswers[curQ.id];
  const isFlagged = Boolean(flaggedQuestions[curQ.id]);

  const handleSelectOption = (idx: number) => {
    // In practice mode, allow changing answer or lock it?
    // Usually in practice mode, once selected it reveals answer; let's allow selecting
    setUserAnswers((prev) => ({
      ...prev,
      [curQ.id]: idx,
    }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [curQ.id]: !prev[curQ.id],
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleRequestSubmit = () => {
    if (answeredCount < total) {
      setShowSubmitConfirm(true);
    } else {
      onFinishQuiz(userAnswers, flaggedQuestions);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Top Bar with Meta and Actions */}
      <div className="quiz-header">
        <div className="quiz-meta-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
              {curQ.section}
            </span>
            <span className="badge badge-brand">
              {curQ.topic}
            </span>
            {config.mode === 'practice' ? (
              <span className="badge badge-neutral">Chế độ Luyện tập</span>
            ) : (
              <span className="badge badge-warning">Chế độ Thi thử</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Flag for review button */}
            <button
              type="button"
              className={`btn btn-sm ${isFlagged ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleToggleFlag}
              title={isFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu câu này để xem lại sau'}
            >
              <Bookmark size={15} fill={isFlagged ? 'currentColor' : 'none'} />
              <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
            </button>

            {/* Question navigator grid toggle */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowQuestionGrid(true)}
              title="Mở danh sách toàn bộ câu hỏi"
            >
              <Grid size={15} />
              <span>{answeredCount}/{total} câu</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Index */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Câu {currentIndex + 1} / {total}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Đã làm: <strong>{answeredCount}</strong>/{total} câu ({Math.round((answeredCount / total) * 100)}%)
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="card question-card">
        <h2 className="question-text">
          {curQ.question}
        </h2>

        {/* 4 Options */}
        <div className="options-grid">
          {curQ.options.map((optionText, idx) => {
            let optionClass = 'option-btn';

            if (config.mode === 'practice') {
              // Practice mode: Show instant feedback when answered
              if (isAnswered) {
                if (idx === curQ.correctIndex) {
                  optionClass += ' correct';
                } else if (idx === selectedIndex) {
                  optionClass += ' wrong';
                }
              }
            } else {
              // Exam mode: Show selected state only
              if (idx === selectedIndex) {
                optionClass += ' selected';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                className={optionClass}
                onClick={() => handleSelectOption(idx)}
              >
                <div className="option-letter">{letters[idx]}</div>
                <div style={{ flex: 1, lineHeight: 1.5 }}>{optionText}</div>
                {config.mode === 'practice' && isAnswered && idx === curQ.correctIndex && (
                  <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                {config.mode === 'practice' && isAnswered && idx === selectedIndex && idx !== curQ.correctIndex && (
                  <XCircle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Practice Mode Instant Explanation */}
        {config.mode === 'practice' && isAnswered && (
          <div className="explanation-card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <HelpCircle size={17} color="var(--brand-primary)" />
              <span>Giải thích đáp án chi tiết</span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {curQ.explanation}
            </p>
            {curQ.sourceRef && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileCheck2 size={14} />
                <span>Nguồn tham chiếu: <strong>{curQ.sourceRef}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="quiz-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={18} />
          <span>Câu trước</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {currentIndex < total - 1 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              <span>Câu sau</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleRequestSubmit}>
              <Send size={16} />
              <span>Nộp bài thi</span>
            </button>
          )}

          {currentIndex < total - 1 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRequestSubmit}
              title="Có thể nộp bài bất cứ lúc nào"
            >
              Nộp bài
            </button>
          )}
        </div>
      </div>

      {/* Question Grid Modal */}
      {showQuestionGrid && (
        <div className="modal-overlay" onClick={() => setShowQuestionGrid(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Danh Sách Câu Hỏi ({total})</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowQuestionGrid(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary)' }}></span>
                  Đã trả lời ({answeredCount})
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}></span>
                  Chưa trả lời ({total - answeredCount})
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                  Đánh dấu ({Object.values(flaggedQuestions).filter(Boolean).length})
                </span>
              </div>

              <div className="question-nav-grid">
                {questions.map((q, idx) => {
                  const answered = q.id in userAnswers;
                  const current = idx === currentIndex;
                  const flagged = Boolean(flaggedQuestions[q.id]);

                  let btnCls = 'question-nav-btn';
                  if (current) btnCls += ' current';
                  if (answered) btnCls += ' answered';
                  if (flagged) btnCls += ' flagged';

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={btnCls}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowQuestionGrid(false);
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowQuestionGrid(false);
                  handleRequestSubmit();
                }}
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when submitting with unanswered questions */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Xác Nhận Nộp Bài</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSubmitConfirm(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Bạn vẫn còn <strong>{total - answeredCount}</strong> câu hỏi chưa trả lời trên tổng số {total} câu.
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Những câu chưa trả lời sẽ được tính là sai. Bạn có muốn nộp bài ngay bây giờ không?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitConfirm(false)}>
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  onFinishQuiz(userAnswers, flaggedQuestions);
                }}
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
