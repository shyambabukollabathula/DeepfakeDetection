//main app.tsx

import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

interface DetectionHistoryItem {
  filename: string;
  is_deepfake: number;
  confidence: number;
}

function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  // Detection state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { is_deepfake: number; confidence: number }>(null);
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);

  // Auth handlers (unchanged)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isLogin) {
        const form = new FormData();
        form.append('username', email);
        form.append('password', password);
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Login failed');
        }
        const data = await res.json();
        setToken(data.access_token);
        setEmail('');
        setPassword('');
      } else {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Registration failed');
        }
        setIsLogin(true);
        setAuthError('Registration successful! Please log in.');
      }
    } catch (err) {
      if (err instanceof Error) setAuthError(err.message);
      else setAuthError('Something went wrong');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setHistory([]);
    setResult(null);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  // Detection handlers (unchanged)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if ([
        'jpg', 'jpeg', 'png',
        'mp4', 'avi', 'mov'
      ].includes(ext || '')) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setIsVideo(['mp4', 'avi', 'mov'].includes(ext || ''));
      } else {
        setError('Please select a JPG, PNG image or MP4, AVI, MOV video.');
        setFile(null);
        setPreview(null);
        setIsVideo(false);
        return;
      }
    } else {
      setFile(null);
      setPreview(null);
      setIsVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError('Please select an image or video file.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/upload/`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Upload failed');
      }
      const uploadData = await uploadRes.json();
      const mediaId = uploadData.id;
      const detectRes = await fetch(`${API_BASE}/detect/${mediaId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!detectRes.ok) {
        const data = await detectRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Detection failed');
      }
      const resultRes = await fetch(`${API_BASE}/result/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resultRes.ok) {
        const data = await resultRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Could not get result');
      }
      const resultData = await resultRes.json();
      setResult({
        is_deepfake: resultData.is_deepfake,
        confidence: resultData.confidence,
      });
      setHistory(prev => [
        {
          filename: file.name,
          is_deepfake: resultData.is_deepfake,
          confidence: resultData.confidence,
        },
        ...prev
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong');
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <>
      {/* Global styles for black background, clean dark theme, and 3D floating panels */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        html, body, #root {
          height: 100%;
        }
        body {
          min-height: 100vh;
          height: 100vh;
          font-family: 'Inter', Arial, sans-serif;
          background: var(--color-bg-${theme});
          color: var(--color-text-${theme});
          margin: 0;
          transition: background 0.3s, color 0.3s;
        }
        .fullscreen-panel {
          min-height: 100vh;
          width: 100vw;
          background: var(--color-panel-${theme});
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 48px 0 32px 0;
          box-shadow: 0 12px 48px 0 var(--color-shadow-${theme}), 0 2px 8px var(--color-shadow2-${theme}), 0 1.5px 0 var(--color-shadow3-${theme});
          border-radius: 32px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .fullscreen-panel:hover {
          box-shadow: 0 24px 64px 0 var(--color-shadow-${theme}), 0 4px 16px var(--color-shadow2-${theme}), 0 2px 0 var(--color-shadow3-${theme});
          transform: translateY(-2px) scale(1.01);
        }
        .accent {
          color: var(--color-accent-${theme});
        }
        .btn {
          background: var(--color-accent-${theme});
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 17px;
          font-weight: 600;
          padding: 10px 28px;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
          box-shadow: 0 2px 8px var(--color-shadow2-${theme});
        }
        .btn:hover {
          background: var(--color-accent-${theme});
          box-shadow: 0 6px 18px var(--color-shadow2-${theme});
          transform: translateY(-2px) scale(1.03);
        }
        .btn:active {
          background: var(--color-accent-${theme});
        }
        .btn.secondary {
          background: var(--color-panel-${theme});
          color: var(--color-accent-${theme});
          border: 1.5px solid var(--color-accent-${theme});
        }
        .input, .file-input {
          width: 100%;
          padding: 10px;
          border-radius: 7px;
          border: 1.5px solid var(--color-border-${theme});
          background: var(--color-input-${theme});
          color: var(--color-text-${theme});
          font-size: 16px;
          margin-bottom: 14px;
        }
        .file-input {
          margin-bottom: 18px;
        }
        .divider {
          height: 1.5px;
          background: var(--color-border-${theme});
          border: none;
          margin: 28px 0 20px 0;
        }
        .history-panel {
          background: var(--color-panel-${theme});
          border-radius: 12px;
          margin-top: 32px;
          padding: 18px 16px;
          box-shadow: 0 8px 32px var(--color-shadow2-${theme}), 0 2px 8px var(--color-shadow2-${theme});
          width: 100%;
          max-width: 600px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .history-panel:hover {
          box-shadow: 0 16px 48px var(--color-shadow2-${theme}), 0 4px 16px var(--color-shadow2-${theme});
          transform: translateY(-1.5px) scale(1.01);
        }
        .history-item {
          background: var(--color-history-${theme});
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 10px;
          font-size: 15px;
          box-shadow: 0 2px 8px var(--color-shadow2-${theme});
        }
        .result-panel {
          background: var(--color-panel-${theme});
          border-radius: 12px;
          margin-top: 28px;
          padding: 18px 16px;
          box-shadow: 0 8px 32px var(--color-shadow2-${theme}), 0 2px 8px var(--color-shadow2-${theme});
          text-align: center;
          width: 100%;
          max-width: 600px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .result-panel:hover {
          box-shadow: 0 16px 48px var(--color-shadow2-${theme}), 0 4px 16px var(--color-shadow2-${theme});
          transform: translateY(-1.5px) scale(1.01);
        }
        .result-label {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .confidence {
          font-size: 16px;
          color: var(--color-confidence-${theme});
        }
        .error {
          color: var(--color-error-${theme});
          margin-top: 14px;
          text-align: center;
        }
        .logout-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          width: 100%;
          max-width: 600px;
        }
        .file-preview {
          margin-bottom: 18px;
          text-align: center;
        }
        .file-preview img, .file-preview video {
          max-width: 100%;
          max-height: 200px;
          border-radius: 10px;
          border: 1.5px solid var(--color-border-${theme});
          box-shadow: 0 4px 16px var(--color-shadow2-${theme});
        }
        /* Switch Styles */
        .theme-toggle {
          position: absolute;
          top: 32px;
          right: 48px;
          z-index: 10;
          display: flex;
          align-items: center;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 54px;
          height: 28px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-panel-${theme});
          border: 2px solid var(--color-border-${theme});
          border-radius: 34px;
          transition: background 0.3s, border 0.3s;
        }
        .slider:before {
          position: absolute;
          content: '';
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 2.5px;
          background: var(--color-accent-${theme});
          border-radius: 50%;
          transition: transform 0.3s, background 0.3s;
          box-shadow: 0 2px 8px var(--color-shadow2-${theme});
        }
        input:checked + .slider:before {
          transform: translateX(24px);
        }
        .theme-icon {
          font-size: 18px;
          margin: 0 8px;
          color: var(--color-accent-${theme});
          user-select: none;
        }
        @media (max-width: 700px) {
          .fullscreen-panel {
            padding: 24px 0 16px 0;
          }
          .result-panel, .history-panel, .logout-row {
            max-width: 98vw;
            padding-left: 4vw;
            padding-right: 4vw;
          }
          .theme-toggle {
            top: 12px;
            right: 12px;
          }
        }
      `}</style>
      {/* Theme toggle switch */}
      <div className="theme-toggle">
        <span className="theme-icon" role="img" aria-label="Light">☀️</span>
        <label className="switch">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="slider"></span>
        </label>
        <span className="theme-icon" role="img" aria-label="Dark">🌙</span>
      </div>
      <div className="fullscreen-panel">
        {/* Auth UI */}
        {!token ? (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 18, fontWeight: 700, fontSize: 28 }}>Deepfake Detection</h2>
            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input"
              />
              <button type="submit" className="btn" style={{ width: '100%' }}>
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button onClick={() => { setIsLogin(!isLogin); setAuthError(null); }} className="btn secondary" style={{ width: '100%' }}>
                {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </div>
            {authError && <div className="error">{authError}</div>}
          </div>
        ) : (
          <div className="logout-row">
            <span style={{ fontSize: 15, color: '#94a3b8' }}>Logged in</span>
            <button onClick={handleLogout} className="btn secondary">Logout</button>
          </div>
        )}
        {/* Detection UI (only if logged in) */}
        {token && <>
          <form onSubmit={handleSubmit} style={{ marginTop: 0, width: '100%', maxWidth: 600 }}>
            <label style={{ marginBottom: 8, display: 'block', fontWeight: 600, color: '#23272f' }}>Select Image or Video</label>
        <input
          type="file"
              accept=".jpg,.jpeg,.png,.mp4,.avi,.mov"
          onChange={handleFileChange}
              className="file-input"
            />
            {preview && (
              <div className="file-preview">
                {isVideo ? (
                  <video src={preview} controls />
                ) : (
                  <img src={preview} alt="Preview" />
                )}
              </div>
            )}
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Processing...' : 'Upload & Detect'}
        </button>
      </form>
          {error && <div className="error">{error}</div>}
      {result && (
            <div className="result-panel">
              <div className="result-label accent">
            {result.is_deepfake ? 'Deepfake Detected' : 'Real Media'}
          </div>
              <div className="confidence">
            Confidence: <b>{(result.confidence * 100).toFixed(1)}%</b>
          </div>
        </div>
      )}
          {history.length > 0 && (
            <div className="history-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#23272f' }}>Detection History</span>
                <button onClick={handleClearHistory} className="btn secondary" style={{ fontSize: 14, padding: '4px 16px' }}>Clear</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((item, idx) => (
                  <li key={idx} className="history-item">
                    <div style={{ fontWeight: 600, color: '#23272f' }}>{item.filename}</div>
                    <div style={{ color: item.is_deepfake ? '#ef4444' : '#2563eb', fontWeight: 700 }}>
                      {item.is_deepfake ? 'Deepfake Detected' : 'Real Media'}
                    </div>
                    <div style={{ fontSize: 14, color: '#2563eb' }}>
                      Confidence: <b>{(item.confidence * 100).toFixed(1)}%</b>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>}
    </div>
    </>
  );
}

export default App; 