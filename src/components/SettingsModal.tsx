import React, { useState } from 'react';
import { LLMConfig, LLMProvider } from '../types/quiz';
import { X, Key, Check, ExternalLink, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [provider, setProvider] = useState<LLMProvider>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model || 'gemini-2.5-flash');
  const [customBaseUrl, setCustomBaseUrl] = useState(config.customBaseUrl || '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      customBaseUrl: customBaseUrl.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <Key size={17} />
            </div>
            <h2 className="modal-title">Cấu hình API Key AI</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Security note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary-light)',
                color: 'var(--brand-primary)',
                fontSize: '0.82rem',
              }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span>
                API Key được lưu trữ trực tiếp trên trình duyệt của bạn (LocalStorage) và gọi thẳng đến API nhà cung cấp. Tuyệt đối an toàn.
              </span>
            </div>

            {/* Provider selection */}
            <div className="form-group">
              <label className="form-label">Nhà cung cấp AI (LLM)</label>
              <select
                className="form-select"
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as LLMProvider;
                  setProvider(p);
                  if (p === 'gemini') setModel('gemini-2.5-flash');
                  else if (p === 'groq') setModel('llama-3.3-70b-versatile');
                  else if (p === 'openai') setModel('gpt-4o-mini');
                }}
              >
                <option value="gemini">Google Gemini (Khuyên dùng - Miễn phí, Nhanh, Tốt nhất)</option>
                <option value="groq">Groq (Miễn phí, Tốc độ cực nhanh)</option>
                <option value="openai">OpenAI (ChatGPT gpt-4o-mini)</option>
                <option value="custom">Tùy chỉnh (DeepSeek / OpenRouter / Ollama local)</option>
              </select>
            </div>

            {/* Instructions for Gemini */}
            {provider === 'gemini' && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={15} color="var(--brand-primary)" />
                  Cách lấy Google Gemini API Key Miễn Phí:
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  1. Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>Google AI Studio <ExternalLink size={12} /></a>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  2. Đăng nhập tài khoản Google và bấm nút <strong>"Create API key"</strong>.
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  3. Sao chép và dán vào ô bên dưới.
                </div>
              </div>
            )}

            {/* API Key input */}
            <div className="form-group">
              <label className="form-label">
                API Key {provider === 'gemini' ? 'Gemini' : provider === 'groq' ? 'Groq' : 'OpenAI'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ position: 'absolute', right: '0.3rem' }}
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Model input */}
            <div className="form-group">
              <label className="form-label">Mô hình AI (Model)</label>
              {provider === 'gemini' ? (
                <select
                  className="form-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Mới nhất, Thông minh nhất)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Cực nhanh & Ổn định)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Phổ biến)</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'}
                />
              )}
            </div>

            {/* Custom Base URL if custom */}
            {(provider === 'custom' || provider === 'openai') && (
              <div className="form-group">
                <label className="form-label">Custom API Base URL (tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com/v1 hoặc https://openrouter.ai/api/v1"
                />
                <span className="form-helper">
                  Để trống nếu dùng OpenAI mặc định. Nhập URL nếu dùng DeepSeek, OpenRouter, hoặc Ollama cục bộ.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button type="submit" className="btn btn-primary">
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  Đã lưu cấu hình!
                </>
              ) : (
                'Lưu cấu hình'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
