import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  UploadCloud,
  FileCheck2,
  Settings,
  Lock,
  Key,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  getAdminPassword,
  saveAdminPassword,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  resetFirebaseInstance,
  getUploadLogs,
  getSubmissionLogs,
  UploadLogItem,
  SubmissionLogItem,
  FirebaseConfig,
} from '../services/firebaseService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState<'uploads' | 'submissions' | 'config'>('uploads');

  // Logs
  const [uploadLogs, setUploadLogs] = useState<UploadLogItem[]>([]);
  const [submissionLogs, setSubmissionLogs] = useState<SubmissionLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Config tab state
  const [firebaseConfigStr, setFirebaseConfigStr] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSavedFirebaseConfig();
      if (cfg) {
        setFirebaseConfigStr(JSON.stringify(cfg, null, 2));
      } else {
        setFirebaseConfigStr('');
      }
    }
  }, [isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getAdminPassword();
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
      fetchLogs();
    } else {
      setPasswordError('Mật khẩu quản trị chưa đúng. (Mặc định: admin)');
    }
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

  const handleSaveFirebaseConfig = () => {
    setSaveSuccessMsg('');
    try {
      const parsed = JSON.parse(firebaseConfigStr);
      if (!parsed.apiKey || !parsed.projectId) {
        alert('Cấu hình Firebase phải chứa ít nhất apiKey và projectId.');
        return;
      }
      saveFirebaseConfig(parsed as FirebaseConfig);
      resetFirebaseInstance();
      setSaveSuccessMsg('Đã lưu cấu hình Firebase thành công!');
      fetchLogs();
    } catch {
      alert('Định dạng JSON cấu hình không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  const handleChangePassword = () => {
    if (!newAdminPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới.');
      return;
    }
    saveAdminPassword(newAdminPassword.trim());
    setNewAdminPassword('');
    alert('Đã cập nhật mật khẩu Admin thành công!');
  };

  if (!isOpen) return null;

  const hasConfig = Boolean(getSavedFirebaseConfig());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: isAuthenticated ? '780px' : '420px', width: '100%' }}
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

        {/* Password Screen if not authenticated */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin}>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Khu vực dành riêng cho bạn (chủ sở hữu trang web) để xem ai đã dùng web, tải lên tài liệu gì và kết quả ôn tập.
              </p>

              {passwordError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--error-light)',
                    color: 'var(--error-text)',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mật khẩu Admin</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Mật khẩu mặc định: admin"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <span className="form-helper">
                  Gợi ý: Mật khẩu mặc định lần đầu là <strong>admin</strong> (có thể đổi sau khi vào trong).
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                <Key size={15} />
                Đăng nhập Admin
              </button>
            </div>
          </form>
        ) : (
          /* Authenticated Admin Dashboard */
          <>
            <div className="modal-body" style={{ gap: '1rem' }}>
              {/* Notice if Firebase is not yet connected */}
              {!hasConfig && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--warning-light)',
                    border: '1px solid var(--warning-border)',
                    fontSize: '0.85rem',
                    color: 'var(--warning-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>
                      Chưa kết nối Firebase! Dữ liệu tải lên của bạn bè chưa được lưu lên đám mây.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('config')}
                    style={{ flexShrink: 0 }}
                  >
                    Cài đặt ngay
                  </button>
                </div>
              )}

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
                  className={`btn btn-sm ${activeTab === 'config' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('config')}
                >
                  <Settings size={15} />
                  <span>Cấu hình Firebase</span>
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
                        Khi bạn bè làm bài và bấm "Nộp bài", điểm số và phân tích phần yếu sẽ hiển thị tại đây.
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

              {/* Tab 3: Firebase Config & Password Settings */}
              {activeTab === 'config' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Instructions on getting Firebase Free */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--brand-gradient-subtle)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      Hướng dẫn lấy mã cấu hình Firebase miễn phí (chỉ mất 2 phút):
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      1. Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>Firebase Console <ExternalLink size={12} /></a> và bấm <strong>"Create a project"</strong> (Đặt tên tùy ý, vd: `quiz-on-thi`).
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      2. Vào mục <strong>Firestore Database</strong> ➔ Bấm <strong>Create database</strong> (chọn chế độ "Start in test mode").
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      3. Vào <strong>Project settings</strong> ➔ Cuộn xuống mục <strong>Your apps</strong> ➔ Bấm biểu tượng <strong>{'Web (</>)'}</strong> ➔ Sao chép đoạn `firebaseConfig = {'{ ... }'}` và dán vào ô bên dưới.
                    </div>
                  </div>

                  {saveSuccessMsg && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--success-light)',
                        color: 'var(--success-text)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  {/* Firebase Config Input */}
                  <div className="form-group">
                    <label className="form-label">Mã Cấu Hình Firebase (JSON)</label>
                    <textarea
                      className="form-input"
                      rows={6}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "quiz-on-thi.firebaseapp.com",\n  "projectId": "quiz-on-thi",\n  "storageBucket": "quiz-on-thi.firebasestorage.app",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                      value={firebaseConfigStr}
                      onChange={(e) => setFirebaseConfigStr(e.target.value)}
                    ></textarea>
                    <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveFirebaseConfig}
                      >
                        Lưu cấu hình Firebase
                      </button>
                    </div>
                  </div>

                  {/* Change Admin Password */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label className="form-label">Đổi mật khẩu Admin</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Nhập mật khẩu mới..."
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleChangePassword}
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAuthenticated(false)}
              >
                <Lock size={14} />
                Đăng xuất Admin
              </button>
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
