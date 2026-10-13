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
  Pencil,
  Lock,
  LockOpen,
  User,
  Search,
} from 'lucide-react';
import {
  getActiveGroupId,
  setActiveGroupId,
  clearActiveGroupId,
  getGroupQuizzes,
  shareQuizToGroup,
  deleteGroupQuiz,
  updateGroupQuizTitle,
  updateGroupQuizAllowDownload,
  registerGroupMember,
  getGroupMembers,
  subscribeGroupData,
  getUserNickname,
  GroupQuizItem,
} from '../services/firebaseService';
import { saveQuizBank } from '../services/storage';
import { SavedQuizBank } from '../types/quiz';
import { showCustomConfirm } from './CustomAlertDialog';

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

  // New features: Members, edit title, download permissions
  const [currentUser] = useState<string>(getUserNickname());
  const [members, setMembers] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchGroupTerm, setSearchGroupTerm] = useState('');
  const [searchPersonalTerm, setSearchPersonalTerm] = useState('');

  // Realtime subscription: tự động cập nhật ngay lập tức khi bạn bè khóa tải, đổi tên hoặc đưa đề mới
  useEffect(() => {
    if (!isOpen) return;

    const gId = currentGroupId || getActiveGroupId();
    if (!gId) return;

    registerGroupMember(gId, currentUser);
    setIsLoading(true);

    const unsubscribe = subscribeGroupData(gId, (quizzes, mList) => {
      setGroupQuizzes(quizzes);
      setMembers(mList);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentGroupId, currentUser]);

  const fetchQuizzes = async (gId: string) => {
    setIsLoading(true);
    try {
      await registerGroupMember(gId, currentUser);
      const [list, mList] = await Promise.all([
        getGroupQuizzes(gId),
        getGroupMembers(gId),
      ]);
      setGroupQuizzes(list);
      setMembers(mList);
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
    registerGroupMember(clean, currentUser);
  };

  const handleLeaveGroup = async () => {
    const confirmed = await showCustomConfirm('Bạn có muốn rời khỏi nhóm học tập hiện tại?', {
      title: 'Rời Nhóm Học Tập',
      confirmText: 'Rời nhóm',
      cancelText: 'Ở lại',
      type: 'warning',
    });
    if (confirmed) {
      clearActiveGroupId();
      setCurrentGroupId(null);
      setGroupQuizzes([]);
      setMembers([]);
      setShowMembers(false);
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
    if (item.sharedBy !== currentUser) {
      alert('Chỉ người chia sẻ đề thi này mới có quyền xóa khỏi nhóm!');
      return;
    }
    const confirmed = await showCustomConfirm(
      `Bạn có chắc muốn xóa đề "${item.quizBank.title}" khỏi nhóm?`,
      {
        title: 'Xác Nhận Xóa Đề',
        confirmText: 'Xóa đề',
        cancelText: 'Hủy',
        type: 'danger',
      }
    );
    if (confirmed) {
      await deleteGroupQuiz(item.id);
      await fetchQuizzes(currentGroupId);
    }
  };

  const handleStartEditTitle = (item: GroupQuizItem) => {
    if (item.sharedBy !== currentUser) {
      alert('Chỉ người chia sẻ bộ đề này mới có quyền sửa tên!');
      return;
    }
    setEditingQuizId(item.id || null);
    setEditingTitle(item.quizBank.title);
  };

  const handleSaveTitle = async (item: GroupQuizItem) => {
    if (!item.id || !editingTitle.trim() || !currentGroupId) return;
    setIsUpdating(true);
    try {
      await updateGroupQuizTitle(item.id, editingTitle.trim());
      await fetchQuizzes(currentGroupId);
      setEditingQuizId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Lỗi khi sửa tên: ${msg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDownload = async (item: GroupQuizItem) => {
    if (item.sharedBy !== currentUser) {
      alert('Chỉ người chia sẻ bộ đề này mới có quyền thay đổi quyền tải về!');
      return;
    }
    if (!item.id || !currentGroupId) return;
    const currentVal = item.allowDownload !== false;
    const newVal = !currentVal;
    try {
      await updateGroupQuizAllowDownload(item.id, newVal);
      await fetchQuizzes(currentGroupId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Lỗi cập nhật quyền tải về: ${msg}`);
    }
  };

  const handleSaveToMyDevice = (item: GroupQuizItem) => {
    const isOwner = item.sharedBy === currentUser;
    if (!isOwner && item.allowDownload === false) {
      alert(`Người chia sẻ (${item.sharedBy}) đã tắt quyền tải về máy cho bộ đề này. Bạn vẫn có thể làm bài và ôn tập trực tiếp trên web!`);
      return;
    }
    saveQuizBank(item.quizBank);
    onBankSaved(item.quizBank);
    alert(`Đã lưu đề "${item.quizBank.title}" vào Kho đề cá nhân của bạn!`);
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--brand-primary-light)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Đang trong nhóm học tập:
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                      👥 {currentGroupId}
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm ${showMembers ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setShowMembers(!showMembers)}
                      title="Xem danh sách thành viên trong nhóm"
                      style={{ fontSize: '0.78rem', padding: '0.32rem 0.65rem' }}
                    >
                      <Users size={13} />
                      <span>Thành viên ({members.length})</span>
                    </button>
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
              </div>

              {/* Members drawer when toggled */}
              {showMembers && (
                <div
                  className="animate-fade-in"
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} color="var(--brand-primary)" />
                    <span>Thành viên đang tham gia nhóm ({members.length}):</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {members.map((m) => {
                      const isMe = m === currentUser;
                      return (
                        <span
                          key={m}
                          className={`badge ${isMe ? 'badge-brand' : 'badge-neutral'}`}
                          style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
                        >
                          <User size={12} />
                          {m} {isMe ? '(Bạn)' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of quizzes shared in the group */}
          {currentGroupId && (() => {
            const filteredGroupQuizzes = groupQuizzes.filter((item) => {
              if (!searchGroupTerm.trim()) return true;
              const term = searchGroupTerm.toLowerCase().trim();
              return (
                item.quizBank.title.toLowerCase().includes(term) ||
                (item.sharedBy && item.sharedBy.toLowerCase().includes(term)) ||
                (item.quizBank.fileName && item.quizBank.fileName.toLowerCase().includes(term))
              );
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Đề Thi Trong Nhóm {searchGroupTerm ? `(${filteredGroupQuizzes.length}/${groupQuizzes.length})` : `(${groupQuizzes.length})`}
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

                {/* Search Bar for Group Quizzes */}
                {groupQuizzes.length > 0 && (
                  <div style={{ position: 'relative', width: '100%', marginBottom: '0.75rem' }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tìm kiếm đề thi trong nhóm (theo tên đề, người chia sẻ)..."
                      value={searchGroupTerm}
                      onChange={(e) => setSearchGroupTerm(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.4rem',
                        paddingRight: searchGroupTerm ? '2.4rem' : '0.85rem',
                        fontSize: '0.88rem',
                        borderRadius: 'var(--radius-md)',
                      }}
                    />
                    {searchGroupTerm && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSearchGroupTerm('')}
                        style={{
                          position: 'absolute',
                          right: '0.4rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '0.25rem',
                          color: 'var(--text-muted)',
                        }}
                        title="Xóa tìm kiếm"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

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
                ) : filteredGroupQuizzes.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px dashed var(--border-strong)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Search size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      Không tìm thấy đề thi khớp với "{searchGroupTerm}"
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSearchGroupTerm('')}
                      style={{ marginTop: '0.65rem' }}
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '35vh', overflowY: 'auto' }}>
                    {filteredGroupQuizzes.map((item) => {
                    const isOwner = item.sharedBy === currentUser;
                    const isEditing = editingQuizId === item.id;
                    const canDownload = item.allowDownload !== false;

                    return (
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
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          {isEditing ? (
                            /* Inline Edit Title */
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                              <input
                                type="text"
                                className="form-input"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.88rem', fontWeight: 600, flex: 1 }}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveTitle(item)}
                                disabled={isUpdating}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingQuizId(null)}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            /* Title and Edit Button for Owner */
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                              {isOwner && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon"
                                  onClick={() => handleStartEditTitle(item)}
                                  title="Đổi tên đề thi (Chỉ người chia sẻ mới có quyền)"
                                  style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                            </div>
                          )}

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>{item.quizBank.questions.length} câu hỏi</span>
                            <span>•</span>
                            <span>Độ phủ {item.quizBank.coverageReport?.coveragePercentage || 100}%</span>
                            <span>•</span>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                              Chia sẻ bởi: {item.sharedBy} {isOwner ? '(Bạn)' : ''}
                            </span>
                            {!canDownload && (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                <Lock size={10} /> Đã khóa tải về
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          {/* Owner: Toggle Download Permission */}
                          {isOwner && (
                            <button
                              type="button"
                              className={`btn btn-sm ${canDownload ? 'btn-ghost' : 'btn-secondary'}`}
                              onClick={() => handleToggleDownload(item)}
                              title={
                                canDownload
                                  ? 'Bấm để KHÓA quyền tải về (không cho thành viên khác tải về máy)'
                                  : 'Bấm để MỞ quyền tải về (cho phép thành viên khác tải về máy)'
                              }
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.55rem',
                                color: canDownload ? 'var(--success)' : 'var(--warning)',
                              }}
                            >
                              {canDownload ? <LockOpen size={12} /> : <Lock size={12} />}
                              <span>{canDownload ? 'Cho phép tải' : 'Khóa tải về'}</span>
                            </button>
                          )}

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

                          {/* Download Button (conditionally enabled by owner) */}
                          {canDownload || isOwner ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon"
                              onClick={() => handleSaveToMyDevice(item)}
                              title="Lưu về máy cá nhân của bạn"
                              style={{ padding: '0.4rem' }}
                            >
                              <Download size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon"
                              onClick={() =>
                                alert(
                                  `Người chia sẻ (${item.sharedBy}) đã khóa quyền tải về máy cho bộ đề này. Bạn vẫn có thể bấm "Ôn tập" để làm bài thi trực tiếp trên web!`
                                )
                              }
                              title="Người chia sẻ đã tắt quyền tải về máy cho đề này"
                              style={{ padding: '0.4rem', opacity: 0.5, cursor: 'not-allowed', color: 'var(--text-muted)' }}
                            >
                              <Lock size={14} />
                            </button>
                          )}

                          {isOwner && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon"
                              onClick={() => handleDeleteSharedQuiz(item)}
                              title="Xóa khỏi nhóm"
                              style={{ padding: '0.4rem', color: 'var(--error)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

          {/* Section: Share your personal quiz banks to this group */}
          {currentGroupId && savedBanks.length > 0 && (() => {
            const filteredSavedBanks = savedBanks.filter((b) => {
              if (!searchPersonalTerm.trim()) return true;
              const term = searchPersonalTerm.toLowerCase().trim();
              return b.title.toLowerCase().includes(term) || (b.fileName && b.fileName.toLowerCase().includes(term));
            });

            return (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                  Đề Cá Nhân Của Bạn (Bấm để chia sẻ lên nhóm):
                </h3>

                {savedBanks.length > 3 && (
                  <div style={{ position: 'relative', width: '100%', marginBottom: '0.6rem' }}>
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tìm đề cá nhân cần đưa lên nhóm..."
                      value={searchPersonalTerm}
                      onChange={(e) => setSearchPersonalTerm(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.2rem',
                        paddingRight: searchPersonalTerm ? '2.2rem' : '0.75rem',
                        fontSize: '0.82rem',
                        paddingTop: '0.35rem',
                        paddingBottom: '0.35rem',
                        borderRadius: 'var(--radius-md)',
                      }}
                    />
                    {searchPersonalTerm && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSearchPersonalTerm('')}
                        style={{
                          position: 'absolute',
                          right: '0.35rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '0.2rem',
                          color: 'var(--text-muted)',
                        }}
                        title="Xóa tìm kiếm"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '25vh', overflowY: 'auto' }}>
                  {filteredSavedBanks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Không tìm thấy đề cá nhân nào khớp với "{searchPersonalTerm}"
                    </div>
                  ) : (
                    filteredSavedBanks.map((b) => {
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
                    })
                  )}
                </div>
              </div>
            );
          })()}
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
