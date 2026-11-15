import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application render error:', error);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6 text-[#242A24]">
          <div className="max-w-md w-full bg-white border border-[#E6E4DD] rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <h1 className="font-display text-xl text-[#172A22]">
              Nature’s Nectar Wellness
            </h1>
            <p className="text-xs text-[#556257] leading-relaxed">
              Something interrupted your page view. Tap below to reload the store safely.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-[#20392D] hover:bg-[#162920] text-white py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
