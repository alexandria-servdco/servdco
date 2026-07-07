import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { ErrorFallback } from "@/components/errors/ErrorFallback";
import { reloadOnceOnStaleChunk } from "@/lib/staleChunkRecovery";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

/** Route-level boundary — isolates page crashes without taking down the shell. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const reloaded = reloadOnceOnStaleChunk(error);
    if (reloaded) return;

    logger.trackError(error, {
      domain: "RouteErrorBoundary",
      route: this.props.label,
      componentStack: info.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title="This page failed to load"
          message="Try again or use the menu to navigate elsewhere."
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
