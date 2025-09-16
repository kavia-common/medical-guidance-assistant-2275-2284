import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ErrorBoundary catches runtime errors in children and renders a fallback UI
 * instead of letting the whole app crash to a blank screen.
 */
class ErrorBoundary extends React.Component {
  /** Track error state */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Update state so the next render shows the fallback UI. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /** Optionally log the error */
  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
          <h1>Something went wrong.</h1>
          <p style={{ color: 'tomato' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p style={{ opacity: 0.7, fontSize: 12 }}>
            Check the browser console for details. Try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
