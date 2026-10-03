import { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-8">
          <div className="max-w-lg rounded-xl border border-red-800/50 bg-neutral-900 p-6">
            <h1 className="mb-2 text-lg font-bold text-red-400">Something went wrong</h1>
            <p className="mb-4 text-sm text-neutral-400">
              The app encountered an error while loading. Try refreshing the page.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-neutral-800 p-3 text-xs text-red-300">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
