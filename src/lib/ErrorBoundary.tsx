import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** `app` replaces the whole screen and offers a reload; `panel` fails in place and lets the analyst retry. */
  variant?: 'app' | 'panel';
  /** Reloads the page. Injectable for tests. */
  onReload?: () => void;
};
type ErrorBoundaryState = { error: Error | null };

/** Keeps a render error from blanking the screen: shows the message and a way to recover. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Asset 360 failed to render', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { variant = 'app', onReload = () => window.location.reload() } = this.props;
    return (
      <div className={variant === 'app' ? 'mx-auto flex max-w-xl flex-col gap-3 p-8' : 'flex flex-col gap-3'}>
        <Alert>
          <AlertDescription>Something went wrong: {error.message}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          {variant === 'app' ? (
            <Button onClick={onReload}>Reload</Button>
          ) : (
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }
}
