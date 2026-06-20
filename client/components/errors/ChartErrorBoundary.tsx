import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

/** Isolates Recharts / analytics crashes on admin dashboards. */
export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.trackError(error, {
      domain: "ChartErrorBoundary",
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#1A1A1A] p-8 text-center"
          style={{ minHeight: 200 }}
        >
          <p className="text-sm text-[#A8A8A8]">
            {this.props.title ?? "Chart unavailable"} — data will refresh on reload.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
