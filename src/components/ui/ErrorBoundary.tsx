'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal Component Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-4 border border-[#c72c2c]/30 bg-[#ede7da] rounded text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#c72c2c] mx-auto" />
          <h3 className="text-lg font-bold text-[#141210]">
            {this.props.fallbackTitle || 'Component Encountered an Issue'}
          </h3>
          <p className="text-xs text-[#3a3530] max-w-md mx-auto leading-relaxed">
            {this.props.fallbackMessage ||
              'A temporary display error occurred while rendering this section. You can try refreshing or resetting.'}
          </p>
          {this.state.error?.message && (
            <p className="font-mono text-[11px] text-[#c72c2c] bg-[#c72c2c]/10 p-2 rounded inline-block">
              {this.state.error.message}
            </p>
          )}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase"
            >
              <RotateCcw size={14} /> Try Reloading Component
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
