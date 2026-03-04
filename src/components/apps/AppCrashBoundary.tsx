'use client';

import React from 'react';

type AppCrashBoundaryProps = {
  children: React.ReactNode;
  appName?: string;
};

type AppCrashBoundaryState = {
  hasError: boolean;
};

class AppCrashBoundary extends React.Component<AppCrashBoundaryProps, AppCrashBoundaryState> {
  state: AppCrashBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppCrashBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed unexpectedly:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-neutral-100 dark:bg-neutral-950 text-black dark:text-white flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xl p-5 text-center">
            <p className="text-lg font-semibold">La aplicación se cerró inesperadamente</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              {this.props.appName ? `${this.props.appName} encontró un error.` : 'Se produjo un error inesperado.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium"
                aria-label="Reintentar aplicación"
              >
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm font-medium"
                aria-label="Volver a la pantalla de inicio"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppCrashBoundary;
