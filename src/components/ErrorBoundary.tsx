import { Component, type ReactNode } from 'react';

/** Stops a single render error from white-screening the whole app. */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
          <div className="empty-emoji">😵‍💫</div>
          <h3>Something went wrong</h3>
          <p>{this.state.error.message}</p>
          <button className="btn btn-primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
