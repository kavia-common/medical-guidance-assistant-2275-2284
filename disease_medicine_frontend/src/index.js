import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

const mountNode = document.getElementById('root');
if (!mountNode) {
  // eslint-disable-next-line no-console
  console.error('Root element with id="root" not found. Unable to mount React app.');
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
