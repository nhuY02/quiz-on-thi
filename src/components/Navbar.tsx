import React from 'react';
import { BookOpen, Settings, Archive, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentScreen: 'upload' | 'config' | 'quiz' | 'result';
  onNavigateHome: () => void;
  onOpenSettings: () => void;
  onOpenSavedBanks: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigateHome,
  onOpenSettings,
  onOpenSavedBanks,
  theme,
  onToggleTheme,
  savedCount,
}) => {
  return (
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
  );
};
