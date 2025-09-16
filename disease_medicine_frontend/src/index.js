import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

const mountNode = document.getElementById('root');
if (!mountNode) {
  // Provide both console error and an on-page visible message to avoid a blank screen.
  // eslint-disable-next-line no-console
  console.error('Root element with id="root" not found. Unable to mount React app.');
  try {
    const fallback = document.createElement('div');
    fallback.setAttribute('style', 'padding:16px;font-family:sans-serif;color:#b12704;background:#fff5f5;border-bottom:1px solid #ffcccc');
    fallback.setAttribute('role', 'alert');
    fallback.innerHTML = '<strong>Startup error:</strong> Root element with id="root" not found. Unable to mount React app.';
    document.body.prepend(fallback);
  } catch (_) {
    // ignore if document is not accessible
  }
} else {
  const root = ReactDOM.createRoot(mountNode);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
