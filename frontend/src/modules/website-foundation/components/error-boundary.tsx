import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error(`[ErrorBoundary:${this.props.name ?? "unknown"}]`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
          <p className="font-medium">Unable to load {this.props.name ?? "this section"}</p>
          <p className="mt-1 opacity-80">{this.state.error?.message ?? "Unknown error"}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
