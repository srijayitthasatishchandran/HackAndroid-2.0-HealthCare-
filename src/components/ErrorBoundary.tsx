import React from "react";
import { Link } from "react-router-dom";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; errorMsg?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorMsg: undefined };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    this.setState({ errorMsg: msg });
    try {
      console.error(error);
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Please try again or go back to Home.</p>
            {this.state.errorMsg && (
              <p className="text-xs text-muted-foreground">{this.state.errorMsg}</p>
            )}
            <div className="flex gap-2 justify-center">
              <Link to="/" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Home</Link>
              <Link to="/clinics" className="px-4 py-2 rounded-md border">Clinics</Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
