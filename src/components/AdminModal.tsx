import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  UploadCloud,
  FileCheck2,
  Settings,
  Lock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  getUploadLogs,
  getSubmissionLogs,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeToAuthState,
  addAuthorizedAdminEmail,
  UploadLogItem,
  SubmissionLogItem,
} from '../services/firebaseService';
import type { User } from 'firebase/auth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'uploads' | 'submissions' | 'settings'>('uploads');

  // Logs
  const [uploadLogs, setUploadLogs] = useState<UploadLogItem[]>([]);
  const [submissionLogs, setSubmissionLogs] = useState<SubmissionLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Additional admin email state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addAdminSuccess, setAddAdminSuccess] = useState('');

  // Listen to auth state
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeToAuthState((user) => {
        setCurrentUser(user);
        if (user) {
          fetchLogs();
        }
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await signInAdminWithGoogle();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        fetchLogs();
      } else {
        setAuthError(res.error || 'Đăng nhập không thành công.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setAuthError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setCurrentUser(null);
    setUploadLogs([]);
    setSubmissionLogs([]);
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const [uLogs, sLogs] = await Promise.all([
        getUploadLogs(50),
        getSubmissionLogs(50),
      ]);
      setUploadLogs(uLogs);
      setSubmissionLogs(sLogs);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleAddSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    try {
      await addAuthorizedAdminEmail(newAdminEmail.trim());
      setAddAdminSuccess(`Đã cấp quyền Admin phụ cho: ${newAdminEmail.trim()}`);
      setNewAdminEmail('');
      setTimeout(() => setAddAdminSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Lỗi: ${message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: currentUser ? '780px' : '440px', width: '100%' }}
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
              <Shield size={18} />
            </div>
            <h2 className="modal-title">Bảng Quản Trị (Admin Dashboard)</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Screen 1: Google Authentication if not logged in */}
        {!currentUser ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--brand-primary-light)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Lock size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Xác thực Quản Trị Viên
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Khu vực dành riêng cho chủ sở hữu trang web. Đăng nhập an toàn bằng tài khoản Google (không lưu mật khẩu trong mã nguồn).
            </p>

            {authError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--error-light)',
                  color: 'var(--error-text)',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isLoggingIn ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  {/* Google standard colorful logo icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập bằng Google Admin</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Screen 2: Authenticated Admin Dashboard */
          <>
            <div className="modal-body" style={{ gap: '1rem' }}>
              {/* Admin Profile Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--brand-gradient-subtle)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      style={{ width: '2rem', height: '2rem', borderRadius: '50%' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: 'var(--brand-primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      A
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {currentUser.displayName || 'Quản trị viên'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    <UserCheck size={13} />
                    Chính chủ
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleSignOut}
                    style={{ fontSize: '0.8rem', color: 'var(--error)' }}
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'uploads' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('uploads')}
                >
                  <UploadCloud size={15} />
                  <span>Lịch sử Upload ({uploadLogs.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'submissions' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('submissions')}
                >
                  <FileCheck2 size={15} />
                  <span>Lịch sử Nộp bài ({submissionLogs.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={15} />
                  <span>Cài đặt & Quyền</span>
                </button>

                <div style={{ marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={fetchLogs}
                    disabled={isLoadingLogs}
                    title="Tải lại dữ liệu mới nhất"
                  >
                    <RotateCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Uploads List */}
              {activeTab === 'uploads' && (
                <div>
                  {uploadLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <UploadCloud size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      <p style={{ fontWeight: 600 }}>Chưa có lịch sử upload nào</p>
                      <p style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        Khi bạn hoặc bạn bè tải tài liệu lên và tạo đề thành công, thông tin sẽ được ghi nhận tại đây.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '50vh', overflowY: 'auto' }}>
                      {uploadLogs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                {log.userName || 'Học viên ẩn danh'}
                              </span>
                              <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                                {log.questionCount} câu hỏi
                              </span>
                            </div>
                            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                              Tài liệu: <strong>{log.fileName}</strong> ({((log.fileSize || 0) / 1024).toFixed(1)} KB)
                            </div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Submissions List */}
              {activeTab === 'submissions' && (
                <div>
                  {submissionLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <FileCheck2 size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      <p style={{ fontWeight: 600 }}>Chưa có bài thi nào được nộp</p>
                      <p style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        Khi bạn bè làm bài và bấm "Nộp bài", điểm số và phân tích sẽ hiển thị tại đây.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '50vh', overflowY: 'auto' }}>
                      {submissionLogs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                {log.userName || 'Học viên ẩn danh'}
                              </span>
                              <span
                                className={`badge ${log.percentage >= 80 ? 'badge-success' : log.percentage >= 50 ? 'badge-brand' : 'badge-warning'}`}
                                style={{ fontSize: '0.75rem' }}
                              >
                                {log.score}/{log.total} câu ({log.percentage}%)
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                {log.mode === 'practice' ? 'Luyện tập' : 'Thi thử'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                              Đề thi: <strong>{log.quizTitle}</strong>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Additional Settings */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserPlus size={16} color="var(--brand-primary)" />
                      <span>Cấp thêm quyền Admin phụ (Tùy chọn)</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Nếu bạn muốn cho một người bạn hoặc giáo viên khác cùng vào xem bảng Admin này bằng tài khoản Google của họ:
                    </p>

                    <form onSubmit={handleAddSubAdmin} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Nhập email Google của người đó..."
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Thêm Admin
                      </button>
                    </form>

                    {addAdminSuccess && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                        {addAdminSuccess}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
