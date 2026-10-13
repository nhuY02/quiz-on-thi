import React, { useRef } from 'react';
import { SavedQuizBank } from '../types/quiz';
import { X, Archive, Download, Trash2, Play, Upload, CheckCircle2 } from 'lucide-react';
import { exportQuizBankToJson, importQuizBankFromJson } from '../services/storage';
import { showCustomConfirm } from './CustomAlertDialog';

interface SavedBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: SavedQuizBank[];
  onSelectBank: (bank: SavedQuizBank) => void;
  onDeleteBank: (id: string) => void;
  onBankImported: (bank: SavedQuizBank) => void;
}

export const SavedBanksModal: React.FC<SavedBanksModalProps> = ({
  isOpen,
  onClose,
  banks,
  onSelectBank,
  onDeleteBank,
  onBankImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importQuizBankFromJson(file);
      onBankImported(imported);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
              <Archive size={17} />
            </div>
            <h2 className="modal-title">Kho Đề Đã Lưu ({banks.length})</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Các bộ câu hỏi được lưu trong bộ nhớ máy của bạn:
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Nhập từ file JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>

          {banks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-strong)',
              }}
            >
              <Archive size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Chưa có bộ câu hỏi nào được lưu</p>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                Khi bạn tạo đề mới hoặc bấm "Xem thử với tài liệu mẫu", ngân hàng câu hỏi sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {banks.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={b.title}
                    >
                      {b.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.3rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{b.questions.length} câu hỏi</span>
                      <span>•</span>
                      <span>{b.sections.length} phần</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)' }}>
                        <CheckCircle2 size={13} />
                        Độ phủ {b.coverageReport.coveragePercentage}%
                      </span>
                      <span>•</span>
                      <span>{new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onSelectBank(b);
                        onClose();
                      }}
                      title="Mở ôn tập bộ câu hỏi này"
                    >
                      <Play size={14} />
                      Ôn tập
                    </button>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => exportQuizBankToJson(b)}
                      title="Xuất ra file JSON"
                      style={{ padding: '0.45rem' }}
                    >
                      <Download size={15} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={async () => {
                        const confirmed = await showCustomConfirm(
                          `Bạn có chắc muốn xóa bộ câu hỏi "${b.title}"?`,
                          {
                            title: 'Xác Nhận Xóa Bộ Đề',
                            confirmText: 'Xóa bộ đề',
                            cancelText: 'Hủy',
                            type: 'danger',
                          }
                        );
                        if (confirmed) {
                          onDeleteBank(b.id);
                        }
                      }}
                      title="Xóa"
                      style={{ color: 'var(--error)', padding: '0.45rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
