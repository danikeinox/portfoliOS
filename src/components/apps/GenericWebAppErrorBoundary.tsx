'use client';

import React from 'react';

type GenericWebAppErrorBoundaryProps = {
  children: React.ReactNode;
};

type GenericWebAppErrorBoundaryState = {
  hasError: boolean;
};

class GenericWebAppErrorBoundary extends React.Component<
  GenericWebAppErrorBoundaryProps,
  GenericWebAppErrorBoundaryState
> {
  state: GenericWebAppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GenericWebAppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Generic web app crashed:', error, errorInfo);
  }

  private goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  private closeApp = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.assign('/');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] p-6 text-center shadow-xl">
            <p className="text-lg font-semibold">La aplicación ha dejado de funcionar</p>
            <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] mt-2">
              Se ha producido un error inesperado al ejecutar esta aplicación.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={this.goHome}
                className="h-11 rounded-full bg-[#0A84FF] text-white font-semibold"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={this.closeApp}
                className="h-11 rounded-full bg-[#EFEFF4] dark:bg-[#2C2C2E] font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GenericWebAppErrorBoundary;
