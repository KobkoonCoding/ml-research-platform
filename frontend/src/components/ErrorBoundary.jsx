import React from 'react'

/**
 * Top-level React error boundary.
 *
 * A single render error in any deep child currently nukes the entire app
 * (white screen) — this catches such errors, logs them, and shows a small
 * recovery UI without losing the user's session state in localStorage.
 *
 * Class component is required: hooks cannot implement getDerivedStateFromError
 * / componentDidCatch.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // In a production deployment we'd ship this to Sentry / OpenTelemetry.
    // For a research showcase we just log to the console — explicit so a
    // reviewer running locally can see what crashed.
    // eslint-disable-next-line no-console
    console.error('UI error caught by ErrorBoundary:', error, info)
    this.setState({ info })
  }

  handleReset = () => {
    this.setState({ error: null, info: null })
  }

  handleHardReset = () => {
    try {
      // Clear cached session state so a corrupted analysis blob can't keep
      // crashing the UI on every reload.
      window.localStorage.removeItem('mlplatform_session_v2')
      window.sessionStorage.clear()
    } catch {
      // ignore — proceed to reload anyway
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || String(this.state.error)
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#050505',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{
          maxWidth: 560,
          padding: '2rem',
          borderRadius: 16,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.05)',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Something broke in the UI
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem' }}>
            A render error stopped this page. Your session data was not lost — try
            "Continue" first; if the page keeps crashing, "Reset & Reload" will
            clear cached state.
          </p>
          <pre
            style={{
              fontSize: '12px',
              padding: '0.75rem',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              overflowX: 'auto',
              color: '#fca5a5',
              marginBottom: '1.25rem',
            }}
          >
            {message}
          </pre>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: 10,
                border: '1px solid rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
            <button
              onClick={this.handleHardReset}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)',
                color: '#fca5a5',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset & Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
