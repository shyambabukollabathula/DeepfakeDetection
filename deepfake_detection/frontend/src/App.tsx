//main app.tsx

import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

interface DetectionHistoryItem {
  filename: string;
  is_deepfake: number;
  confidence: number;
}

function App() {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true: login, false: register
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

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isLogin) {
        // Login
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
        // Register
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Registration failed');
        }
        // Auto-login after registration
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

  // Detection handlers
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
      setError('Please select an image file.');
      return;
    }
    setLoading(true);
    try {
      // 1. Upload the image
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
      // 2. Run detection
      const detectRes = await fetch(`${API_BASE}/detect/${mediaId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!detectRes.ok) {
        const data = await detectRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Detection failed');
      }
      // 3. Get result
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
      // Add to history
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
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#181818', borderRadius: 12, color: '#fff', boxShadow: '0 2px 16px #0004' }}>
      {/* Auth UI */}
      {!token ? (
        <div style={{ marginBottom: 32, background: '#222', borderRadius: 8, padding: 20 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 16 }}>{isLogin ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', fontSize: 16 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', fontSize: 16 }}
            />
            <button type="submit" style={{ width: '100%', padding: '8px 0', fontSize: 16, borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', marginBottom: 8 }}>
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={() => { setIsLogin(!isLogin); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
          </div>
          {authError && <div style={{ color: authError.startsWith('Registration successful') ? '#34d399' : '#f87171', marginTop: 8 }}>{authError}</div>}
        </div>
      ) : (
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>Logged in</span>
          <button onClick={handleLogout} style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 14 }}>Logout</button>
        </div>
      )}
      {/* Detection UI (only if logged in) */}
      {token && <>
        <h1 style={{ textAlign: 'center' }}>Deepfake Detection Demo</h1>
        <form onSubmit={handleSubmit} style={{ marginTop: 32 }}>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,.avi,.mov"
            onChange={handleFileChange}
            style={{ display: 'block', marginBottom: 16 }}
          />
          {preview && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              {isVideo ? (
                <video src={preview} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #333' }} />
              ) : (
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #333' }} />
              )}
            </div>
          )}
          <button type="submit" style={{ padding: '8px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }} disabled={loading}>
            {loading ? 'Processing...' : 'Upload & Detect'}
          </button>
        </form>
        {error && <div style={{ color: '#f87171', marginTop: 16 }}>{error}</div>}
        {result && (
          <div style={{ marginTop: 32, padding: 16, background: '#222', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
              {result.is_deepfake ? 'Deepfake Detected' : 'Real Media'}
            </div>
            <div style={{ fontSize: 16 }}>
              Confidence: <b>{(result.confidence * 100).toFixed(1)}%</b>
            </div>
          </div>
        )}
        {history.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 4, margin: 0 }}>Detection History</h2>
              <button onClick={handleClearHistory} style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 14 }}>Clear History</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map((item, idx) => (
                <li key={idx} style={{ background: '#222', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 500 }}>{item.filename}</div>
                  <div style={{ color: item.is_deepfake ? '#f87171' : '#34d399' }}>
                    {item.is_deepfake ? 'Deepfake Detected' : 'Real Media'}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    Confidence: <b>{(item.confidence * 100).toFixed(1)}%</b>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>}
    </div>
  );
}

export default App; 