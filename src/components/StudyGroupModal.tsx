import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Share2,
  Copy,
  Check,
  Play,
  Download,
  Trash2,
  RotateCw,
  PlusCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import {
  getActiveGroupId,
  setActiveGroupId,
  clearActiveGroupId,
  getGroupQuizzes,
  shareQuizToGroup,
  deleteGroupQuiz,
  GroupQuizItem,
} from '../services/firebaseService';
import { saveQuizBank } from '../services/storage';
import { SavedQuizBank } from '../types/quiz';

interface StudyGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBanks: SavedQuizBank[];
  onSelectQuiz: (bank: SavedQuizBank) => void;
  onBankSaved: (bank: SavedQuizBank) => void;
}

export const StudyGroupModal: React.FC<StudyGroupModalProps> = ({
  isOpen,
  onClose,
  savedBanks,
  onSelectQuiz,
  onBankSaved,
}) => {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(getActiveGroupId());
  const [inputGroupId, setInputGroupId] = useState('');
  const [groupQuizzes, setGroupQuizzes] = useState<GroupQuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharingBankId, setSharingBankId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const gId = getActiveGroupId();
      setCurrentGroupId(gId);
      if (gId) {
        fetchQuizzes(gId);
      }
    }
  }, [isOpen]);

  const fetchQuizzes = async (gId: string) => {
    setIsLoading(true);
    try {
      const list = await getGroupQuizzes(gId);
      setGroupQuizzes(list);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputGroupId.trim().toUpperCase();
    if (!clean) {
      alert('Vui lòng nhập mã nhóm học tập.');
      return;
    }
    setActiveGroupId(clean);
    setCurrentGroupId(clean);
    setInputGroupId('');
    fetchQuizzes(clean);
  };

  const handleLeaveGroup = () => {
    if (confirm('Bạn có muốn rời khỏi nhóm học tập hiện tại?')) {
      clearActiveGroupId();
      setCurrentGroupId(null);
      setGroupQuizzes([]);
    }
  };

  const handleGenerateRandomGroup = () => {
    const randomCode = `NHOM_${Math.floor(1000 + Math.random() * 9000)}`;
    setInputGroupId(randomCode);
  };

  const handleCopyInviteLink = () => {
    if (!currentGroupId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('group', currentGroupId);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareBank = async (bank: SavedQuizBank) => {
    if (!currentGroupId) return;
    setSharingBankId(bank.id);
    try {
      await shareQuizToGroup(currentGroupId, bank);
      await fetchQuizzes(currentGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Lỗi khi chia sẻ đề: ${message}`);
    } finally {
      setSharingBankId(null);
    }
  };

  const handleDeleteSharedQuiz = async (item: GroupQuizItem) => {
    if (!item.id || !currentGroupId) return;
    if (confirm(`Bạn có chắc muốn xóa đề "${item.quizBank.title}" khỏi nhóm?`)) {
      await deleteGroupQuiz(item.id);
      await fetchQuizzes(currentGroupId);
    }
  };

  const handleSaveToMyDevice = (bank: SavedQuizBank) => {
    saveQuizBank(bank);
    onBankSaved(bank);
    alert(`Đã lưu đề "${bank.title}" vào Kho đề cá nhân của bạn!`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '100%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary-light)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
            <h2 className="modal-title">Nhóm Học Tập & Cộng Sự</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.25rem' }}>
          {/* Group Status / Join Bar */}
          {!currentGroupId ? (
            /* Not in any group yet: Prompt to join or create */
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--brand-gradient-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Tham gia hoặc Tạo Nhóm Học Tập
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Nhập cùng một mã nhóm với bạn bè (ví dụ: `TRIETHOC_K65`, `NHOM1_AI`) để tự động đồng bộ và ôn chung toàn bộ đề thi của nhau mà không cần upload lại.
              </p>

              <form onSubmit={handleJoinGroup} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mã nhóm (vd: TRIETHOC_K65)..."
                  value={inputGroupId}
                  onChange={(e) => setInputGroupId(e.target.value)}
                  style={{ flex: 1, minWidth: '220px', textTransform: 'uppercase', fontWeight: 600 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateRandomGroup}
                  title="Tạo mã nhóm ngẫu nhiên"
                >
                  <Sparkles size={14} />
                  Mã ngẫu nhiên
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Vào nhóm</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          ) : (
            /* Joined a group: Active group banner */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--brand-primary-light)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Đang trong nhóm học tập:
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                  👥 {currentGroupId}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyInviteLink}
                  title="Sao chép link mời gửi cho bạn bè"
                >
                  {copiedLink ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link mời'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleLeaveGroup}
                  title="Rời nhóm này"
                  style={{ color: 'var(--error)' }}
                >
                  <LogOut size={14} />
                  <span>Rời nhóm</span>
                </button>
              </div>
            </div>
          )}

          {/* List of quizzes shared in the group */}
          {currentGroupId && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Đề Thi Trong Nhóm ({groupQuizzes.length})
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fetchQuizzes(currentGroupId)}
                  disabled={isLoading}
                >
                  <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.88rem' }}>Đang tải đề thi của nhóm...</p>
                </div>
              ) : groupQuizzes.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border-strong)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <BookOpen size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>Nhóm chưa có đề thi nào</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    Hãy chia sẻ các đề bạn đã tạo ở bên dưới lên nhóm để bạn bè cùng làm!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '35vh', overflowY: 'auto' }}>
                  {groupQuizzes.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.quizBank.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                          <span>{item.quizBank.questions.length} câu hỏi</span>
                          <span>•</span>
                          <span>Độ phủ {item.quizBank.coverageReport?.coveragePercentage || 100}%</span>
                          <span>•</span>
                          <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                            Chia sẻ bởi: {item.sharedBy}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            onSelectQuiz(item.quizBank);
                            onClose();
                          }}
                          title="Làm bài ôn tập ngay"
                        >
                          <Play size={13} />
                          Ôn tập
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleSaveToMyDevice(item.quizBank)}
                          title="Lưu về máy cá nhân của bạn"
                          style={{ padding: '0.4rem' }}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => handleDeleteSharedQuiz(item)}
                          title="Xóa khỏi nhóm"
                          style={{ padding: '0.4rem', color: 'var(--error)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Share your personal quiz banks to this group */}
          {currentGroupId && savedBanks.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                Đề Cá Nhân Của Bạn (Bấm để chia sẻ lên nhóm):
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '25vh', overflowY: 'auto' }}>
                {savedBanks.map((b) => {
                  const isShared = groupQuizzes.some((g) => g.quizBank.id === b.id || g.quizBank.title === b.title);
                  const isCurrentSharing = sharingBankId === b.id;

                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 600 }}>
                        {b.title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({b.questions.length} câu)</span>
                      </div>

                      {isShared ? (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          <Check size={12} /> Đã có trong nhóm
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleShareBank(b)}
                          disabled={isCurrentSharing}
                        >
                          {isCurrentSharing ? (
                            <>
                              <RotateCw size={13} className="animate-spin" />
                              Đang đưa lên...
                            </>
                          ) : (
                            <>
                              <Share2 size={13} />
                              Đưa lên nhóm
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
