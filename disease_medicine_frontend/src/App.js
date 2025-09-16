import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Helper: read API base URL from env (CRA requires REACT_APP_ prefix)
// Fallback to same-origin root if not provided.
/**
 * Derive a sensible default API base when running behind a reverse proxy path like /proxy/3001/.
 * - If REACT_APP_API_BASE_URL is set, use it as-is (without trailing slash).
 * - Else, if window.location.pathname starts with "/proxy/<port>/", use that base path to keep same-origin calls under the proxy segment.
 * - Else, fallback to empty string for same-origin root.
 */
// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the API base URL from environment or defaults to same-origin, preserving proxy base path when present. */
  const fromEnv = process.env.REACT_APP_API_BASE_URL || '';
  const normalizedEnv = fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv;
  if (normalizedEnv) return normalizedEnv;

  // Try to detect proxy base path like /proxy/3001/...
  try {
    const loc = window.location;
    const path = loc?.pathname || '';
    // Match patterns: /proxy/<digits>/ or /proxy/<digits>
    const proxyMatch = path.match(/^\/proxy\/\d+(?=\/|$)/);
    if (proxyMatch && proxyMatch[0]) {
      return proxyMatch[0]; // e.g., "/proxy/3001"
    }
  } catch (_) {
    // ignore if window is not accessible
  }
  // Default same-origin root
  return '';
}

// Types (JSDoc for clarity)
/**
 * @typedef {Object} Disease
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} Medicine
 * @property {string} name
 * @property {string|number} quantity
 */

/**
 * @typedef {Object} ExplanationMessage
 * @property {"user"|"assistant"|"system"} role
 * @property {string} content
 * @property {string} [diseaseId]
 */

const INITIAL_SYSTEM_NOTE = "You can ask for additional explanations about the selected disease or proposed medicines. This conversation will be sent to the backend.";

// PUBLIC_INTERFACE
function App() {
  /**
   * This component renders:
   * - Disease dropdown (fetched from backend)
   * - Medicine list with recommended quantities for the selected disease
   * - Explanation area with conversation history and input to ask backend for more details
   * 
   * Backend contract (HTTP):
   * - GET /api/diseases -> { diseases: [{id, name}, ...] }
   * - GET /api/medicines?disease_id=<id> -> { disease_id: string, medicines: [{name, quantity}, ...] }
   * - POST /api/explain -> body: { disease_id: string, message: string, history?: [{role, content}] }
   *                       -> response: { answer: string, disease_id: string }
   */

  const apiBase = useMemo(() => getApiBaseUrl(), []);
  const [theme, setTheme] = useState('light');

  const [diseases, setDiseases] = useState(/** @type Disease[] */([]));
  const [loadingDiseases, setLoadingDiseases] = useState(false);
  const [diseaseError, setDiseaseError] = useState('');

  const [selectedDiseaseId, setSelectedDiseaseId] = useState('');
  const [medicines, setMedicines] = useState(/** @type Medicine[] */([]));
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medError, setMedError] = useState('');

  // Conversation state
  const [messages, setMessages] = useState(/** @type ExplanationMessage[] */([
    { role: 'system', content: INITIAL_SYSTEM_NOTE },
  ]));
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch diseases on mount
  useEffect(() => {
    async function fetchDiseases() {
      setLoadingDiseases(true);
      setDiseaseError('');
      try {
        const res = await fetch(`${apiBase}/api/diseases`);
        if (!res.ok) {
          throw new Error(`Failed to fetch diseases: ${res.status}`);
        }
        const data = await res.json();
        const list = Array.isArray(data?.diseases) ? data.diseases : [];
        setDiseases(list);
        // Preselect first disease if available
        if (list.length > 0) {
          setSelectedDiseaseId(list[0].id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching diseases', err);
        setDiseaseError(err?.message || 'Error loading diseases');
      } finally {
        setLoadingDiseases(false);
      }
    }
    fetchDiseases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Fetch medicines when selected disease changes
  useEffect(() => {
    async function fetchMedicines() {
      if (!selectedDiseaseId) {
        setMedicines([]);
        return;
      }
      setLoadingMedicines(true);
      setMedError('');
      try {
        const res = await fetch(`${apiBase}/api/medicines?disease_id=${encodeURIComponent(selectedDiseaseId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch medicines: ${res.status}`);
        }
        const data = await res.json();
        const meds = Array.isArray(data?.medicines) ? data.medicines : [];
        setMedicines(meds);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching medicines', err);
        setMedError(err?.message || 'Error loading medicines');
      } finally {
        setLoadingMedicines(false);
      }
    }
    fetchMedicines();
  }, [apiBase, selectedDiseaseId]);

  // Reset conversation when disease changes (preserve system note)
  useEffect(() => {
    setMessages(prev => {
      const system = prev.find(m => m.role === 'system') || { role: 'system', content: INITIAL_SYSTEM_NOTE };
      return [system];
    });
    setChatError('');
  }, [selectedDiseaseId]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark themes. */
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  async function sendExplanation() {
    /** Sends the user message along with conversation history to backend and appends the assistant's answer. */
    if (!selectedDiseaseId) {
      setChatError('Please select a disease first.');
      return;
    }
    const trimmed = userInput.trim();
    if (!trimmed) {
      return;
    }
    setSending(true);
    setChatError('');

    // Optimistically add user message
    const newUserMsg = { role: 'user', content: trimmed, diseaseId: selectedDiseaseId };
    setMessages(prev => [...prev, newUserMsg]);
    setUserInput('');

    try {
      const historyToSend = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));
      const payload = {
        disease_id: selectedDiseaseId,
        message: trimmed,
        history: historyToSend
      };
      const res = await fetch(`${apiBase}/api/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Failed to get explanation: ${res.status}`);
      }
      const data = await res.json();
      const answer = data?.answer || 'No answer received.';
      const assistantMsg = { role: 'assistant', content: answer, diseaseId: selectedDiseaseId };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error requesting explanation', err);
      setChatError(err?.message || 'Error requesting explanation.');
    } finally {
      setSending(false);
    }
  }

  // UI helpers
  const currentDiseaseName = useMemo(() => {
    const d = diseases.find(x => x.id === selectedDiseaseId);
    return d?.name || '';
  }, [diseases, selectedDiseaseId]);

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <h1 style={{ margin: '12px 0 8px' }}>Disease Medicine Assistant</h1>
        <p className="App-link" style={{ margin: '0 0 24px' }}>
          Minimal prototype: select a disease, view medicines, ask for explanations.
        </p>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        {/* Disease Selector */}
        <section style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>1) Select Disease</h2>
          {loadingDiseases ? (
            <p>Loading diseases...</p>
          ) : diseaseError ? (
            <p style={{ color: 'tomato' }}>{diseaseError}</p>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label htmlFor="disease-select" style={{ minWidth: 90 }}>Disease</label>
              <select
                id="disease-select"
                value={selectedDiseaseId}
                onChange={(e) => setSelectedDiseaseId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                aria-label="Select disease"
              >
                {diseases.length === 0 && <option value="">No diseases</option>}
                {diseases.map(d => (
                  <option value={d.id} key={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Medicines List */}
        <section style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>2) Recommended Medicines</h2>
          {loadingMedicines ? (
            <p>Loading medicines...</p>
          ) : medError ? (
            <p style={{ color: 'tomato' }}>{medError}</p>
          ) : medicines.length === 0 ? (
            <p>No medicines available for the selected disease.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {medicines.map((m, idx) => (
                <li
                  key={`${m.name}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: 'var(--bg-primary)'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ opacity: 0.85 }}>Qty: {m.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Explanations / Conversation */}
        <section style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>3) Ask for Explanation</h2>
          <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
            Disease: <strong>{currentDiseaseName || 'Not selected'}</strong>
          </p>

          <div
            aria-live="polite"
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              background: 'var(--bg-primary)',
              padding: 12,
              maxHeight: 260,
              overflowY: 'auto',
              marginBottom: 12
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    background: m.role === 'user' ? 'var(--button-bg)' : 'transparent',
                    color: m.role === 'user' ? 'var(--button-text)' : 'var(--text-primary)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                    padding: '8px 10px',
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <small style={{ opacity: 0.8, display: 'block', marginBottom: 4 }}>
                    {m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Assistant' : 'System'}
                  </small>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {chatError && <p style={{ color: 'tomato', marginTop: 0 }}>{chatError}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Ask for more details (e.g., side effects, dosage rationale)"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !sending) sendExplanation();
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
              aria-label="Explanation input"
            />
            <button
              className="theme-toggle"
              style={{ position: 'static', boxShadow: 'none' }}
              onClick={sendExplanation}
              disabled={sending || !selectedDiseaseId || !userInput.trim()}
              aria-busy={sending}
            >
              {sending ? 'Sending…' : 'Ask'}
            </button>
          </div>
        </section>

        {/* API Base Info */}
        <div style={{ marginTop: 16, textAlign: 'right', opacity: 0.7, fontSize: 12 }}>
          API: {apiBase || '(same origin)'}
        </div>
      </main>
    </div>
  );
}

export default App;
