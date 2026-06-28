import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { ErrorFallback } from "@/components/errors/ErrorFallback";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.trackError(error, {
      domain: "GlobalErrorBoundary",
      componentStack: info.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans flex flex-col">
          <ErrorFallback
            title="Application error"
            message="Servd Co encountered an unexpected problem. Reloading usually fixes this."
            onRetry={this.handleRetry}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
