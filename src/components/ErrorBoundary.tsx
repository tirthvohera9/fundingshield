'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Panel error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            lineHeight: 1.6,
          }}
        >
          Something went wrong in this panel.
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginLeft: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontSize: '0.78rem',
              textDecoration: 'underline',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
