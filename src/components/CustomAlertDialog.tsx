import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export interface AlertData {
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info';
}

interface CustomAlertDialogProps {
  data: AlertData | null;
  onClose: () => void;
}

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  // Determine type automatically based on message content
  const msgLower = (data.message || '').toLowerCase();
  const isError = data.type === 'error' || msgLower.includes('lỗi') || msgLower.includes('error');
  const isSuccess =
    data.type === 'success' ||
    msgLower.includes('đã lưu') ||
    msgLower.includes('thành công') ||
    msgLower.includes('chúc mừng');

  const title =
    data.title ||
    (isError ? 'Thông Báo Lỗi' : isSuccess ? 'Thành Công' : 'Thông Báo');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '1.75rem 1.5rem',
        }}
      >
        {/* Modern Icon Header */}
        <div
          style={{
            width: '3.6rem',
            height: '3.6rem',
            borderRadius: 'var(--radius-full)',
            background: isError
              ? 'rgba(239, 68, 68, 0.12)'
              : isSuccess
              ? 'rgba(16, 185, 129, 0.12)'
              : 'var(--brand-primary-light)',
            color: isError
              ? 'var(--error)'
              : isSuccess
              ? 'var(--success)'
              : 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.1rem',
            border: `1.5px solid ${
              isError
                ? 'rgba(239, 68, 68, 0.25)'
                : isSuccess
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(99, 102, 241, 0.25)'
            }`,
          }}
        >
          {isError ? (
            <AlertCircle size={30} />
          ) : isSuccess ? (
            <CheckCircle2 size={30} />
          ) : (
            <Sparkles size={30} />
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </h3>

        {/* Message Text */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: '1.5rem',
            wordBreak: 'break-word',
          }}
        >
          {data.message}
        </p>

        {/* OK Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
          autoFocus
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.98rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--brand-glow)',
          }}
        >
          Đã hiểu (OK)
        </button>
      </div>
    </div>
  );
};
