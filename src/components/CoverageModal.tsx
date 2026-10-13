import React from 'react';
import { CoverageReport } from '../types/quiz';
import { X, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CoverageReport;
}

export const CoverageModal: React.FC<CoverageModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
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
              <Layers size={17} />
            </div>
            <h2 className="modal-title">Báo Cáo Độ Phủ Kiến Thức</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary statistic */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--brand-gradient-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tỷ lệ bao quát nội dung</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.2rem' }}>
                {report.coveragePercentage}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số khái niệm đã có câu hỏi</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {report.coveredConcepts} / {report.totalConcepts} khái niệm
              </div>
            </div>
          </div>

          {/* Missing concepts if any */}
          {report.missingConcepts.length > 0 && (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--warning-light)',
                border: '1px solid var(--warning-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--warning-text)', fontSize: '0.9rem' }}>
                <AlertTriangle size={16} />
                <span>Các khái niệm chưa có câu hỏi ({report.missingConcepts.length}):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                {report.missingConcepts.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--warning-text)',
                      border: '1px solid var(--warning-border)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {item.concept} <span style={{ opacity: 0.7 }}>({item.section})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* List of all concepts */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
              Toàn bộ khái niệm & thuật ngữ được phát hiện ({report.allConcepts.length}):
            </div>
            <div style={{ maxHeight: '35vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {report.allConcepts.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: item.covered ? 'var(--bg-surface)' : 'var(--warning-light)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.covered ? (
                      <CheckCircle size={15} color="var(--success)" />
                    ) : (
                      <AlertTriangle size={15} color="var(--warning)" />
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.concept}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.section}</span>
                </div>
              ))}
            </div>
          </div>
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
