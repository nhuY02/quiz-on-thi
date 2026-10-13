import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Trash2, AlertTriangle, HelpCircle } from 'lucide-react';

export interface DialogData {
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'danger';
  isConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
}

// Global dialog listener
let dialogSubscriber: ((data: DialogData | null) => void) | null = null;

export const showCustomAlert = (
  message: string,
  title?: string,
  type?: 'success' | 'error' | 'info'
): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (dialogSubscriber) {
      dialogSubscriber({
        message,
        title,
        type,
        isConfirm: false,
        resolve: () => resolve(),
      });
    } else {
      window.alert(message);
      resolve();
    }
  });
};

export const showCustomConfirm = (
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    if (dialogSubscriber) {
      dialogSubscriber({
        message,
        title: options?.title,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        type: options?.type,
        isConfirm: true,
        resolve,
      });
    } else {
      resolve(window.confirm(message));
    }
  });
};

export const CustomAlertDialog: React.FC = () => {
  const [data, setData] = useState<DialogData | null>(null);

  useEffect(() => {
    dialogSubscriber = (newData) => {
      setData(newData);
    };
    return () => {
      dialogSubscriber = null;
    };
  }, []);

  const handleClose = (result: boolean) => {
    if (data?.resolve) {
      data.resolve(result);
    }
    setData(null);
  };

  useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose(false);
      } else if (e.key === 'Enter') {
        handleClose(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data]);

  if (!data) return null;

  const msgLower = (data.message || '').toLowerCase();
  const isDanger =
    data.type === 'danger' ||
    msgLower.includes('xóa') ||
    msgLower.includes('delete');
  const isWarning =
    data.type === 'warning' ||
    msgLower.includes('rời') ||
    msgLower.includes('thoát');
  const isError =
    data.type === 'error' ||
    msgLower.includes('lỗi') ||
    msgLower.includes('error');
  const isSuccess =
    data.type === 'success' ||
    msgLower.includes('đã lưu') ||
    msgLower.includes('thành công') ||
    msgLower.includes('chúc mừng');

  // Title calculation
  let title = data.title;
  if (!title) {
    if (data.isConfirm) {
      title = isDanger ? 'Xác Nhận Xóa' : isWarning ? 'Xác Nhận Rời Nhóm' : 'Xác Nhận';
    } else {
      title = isError ? 'Thông Báo Lỗi' : isSuccess ? 'Thành Công' : 'Thông Báo';
    }
  }

  // Icons & Colors
  let iconBg = 'var(--brand-primary-light)';
  let iconBorder = 'rgba(99, 102, 241, 0.25)';
  let iconColor = 'var(--brand-primary)';
  let IconComponent = Sparkles;

  if (isDanger) {
    iconBg = 'rgba(239, 68, 68, 0.12)';
    iconBorder = 'rgba(239, 68, 68, 0.3)';
    iconColor = 'var(--error)';
    IconComponent = Trash2;
  } else if (isWarning) {
    iconBg = 'rgba(245, 158, 11, 0.14)';
    iconBorder = 'rgba(245, 158, 11, 0.35)';
    iconColor = '#f59e0b';
    IconComponent = AlertTriangle;
  } else if (isError) {
    iconBg = 'rgba(239, 68, 68, 0.12)';
    iconBorder = 'rgba(239, 68, 68, 0.3)';
    iconColor = 'var(--error)';
    IconComponent = AlertCircle;
  } else if (isSuccess) {
    iconBg = 'rgba(16, 185, 129, 0.12)';
    iconBorder = 'rgba(16, 185, 129, 0.3)';
    iconColor = 'var(--success)';
    IconComponent = CheckCircle2;
  } else if (data.isConfirm) {
    iconBg = 'rgba(99, 102, 241, 0.12)';
    iconBorder = 'rgba(99, 102, 241, 0.3)';
    iconColor = 'var(--brand-primary)';
    IconComponent = HelpCircle;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={() => handleClose(false)}
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '1.75rem 1.5rem',
        }}
      >
        {/* Modern Glowing Icon Header */}
        <div
          style={{
            width: '3.6rem',
            height: '3.6rem',
            borderRadius: 'var(--radius-full)',
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.1rem',
            border: `1.5px solid ${iconBorder}`,
            boxShadow: `0 0 20px ${iconBorder}`,
          }}
        >
          <IconComponent size={28} />
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

        {/* Action Buttons */}
        {data.isConfirm ? (
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleClose(false)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {data.cancelText || 'Hủy bỏ'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => handleClose(true)}
              autoFocus
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-lg)',
                background: isDanger
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                boxShadow: isDanger
                  ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                  : 'var(--brand-glow)',
              }}
            >
              {data.confirmText || (isDanger ? 'Xác nhận xóa' : 'Đồng ý')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleClose(true)}
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
            {data.confirmText || 'Đã hiểu (OK)'}
          </button>
        )}
      </div>
    </div>
  );
};
