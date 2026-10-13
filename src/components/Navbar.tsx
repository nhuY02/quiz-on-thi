import React, { useState } from 'react';
import { BookOpen, Settings, Archive, Moon, Sun, Shield, User, X, Check } from 'lucide-react';
import { getUserNickname, setUserNickname } from '../services/firebaseService';

interface NavbarProps {
  currentScreen: 'upload' | 'config' | 'quiz' | 'result';
  onNavigateHome: () => void;
  onOpenSettings: () => void;
  onOpenSavedBanks: () => void;
  onOpenAdmin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigateHome,
  onOpenSettings,
  onOpenSavedBanks,
  onOpenAdmin,
  theme,
  onToggleTheme,
  savedCount,
}) => {
  const [nickname, setNickname] = useState(getUserNickname());
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [inputName, setInputName] = useState(nickname);

  const handleOpenNameModal = () => {
    setInputName(nickname);
    setIsNameModalOpen(true);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUserNickname(inputName.trim());
      setNickname(inputName.trim());
    }
    setIsNameModalOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-brand" onClick={onNavigateHome} title="Về trang chủ">
          <div className="nav-brand-icon">
            <BookOpen size={20} />
          </div>
          <span>Quiz Ôn Thi</span>
        </div>

        <div className="nav-actions">
          {currentScreen !== 'upload' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onNavigateHome}
              title="Tải tài liệu mới"
            >
              Tạo đề mới
            </button>
          )}

          {/* User Nickname Button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleOpenNameModal}
            title="Bấm để đổi tên của bạn"
            style={{ fontSize: '0.82rem' }}
          >
            <User size={15} />
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nickname}
            </span>
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenSavedBanks}
            title="Kho đề đã lưu"
            style={{ position: 'relative' }}
          >
            <Archive size={17} />
            <span style={{ display: 'none', md: 'inline' } as any}>Kho đề</span>
            {savedCount > 0 && (
              <span
                style={{
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  marginLeft: '0.2rem',
                  fontWeight: 700,
                }}
              >
                {savedCount}
              </span>
            )}
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenSettings}
            title="Cấu hình API Key AI"
          >
            <Settings size={17} />
            <span style={{ display: 'none', md: 'inline' } as any}>Cấu hình AI</span>
          </button>

          {/* Admin Button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenAdmin}
            title="Trang quản trị dành cho Admin"
            style={{ color: 'var(--brand-primary)' }}
          >
            <Shield size={16} />
            <span style={{ display: 'none', md: 'inline' } as any}>Admin</span>
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            aria-label="Đổi giao diện sáng/tối"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Beautiful Name Input Modal */}
      {isNameModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNameModalOpen(false)}>
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '100%' }}
          >
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
                  <User size={17} />
                </div>
                <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Nhập tên của bạn</h3>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsNameModalOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveName}>
              <div className="modal-body">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Minh, Lan Anh..."
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    autoFocus
                    maxLength={30}
                    style={{ fontSize: '0.98rem', padding: '0.75rem 1rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNameModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
