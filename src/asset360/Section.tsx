import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { EmptyState, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import type { ReactNode } from 'react';

import { MAX_LISTED } from '../cdm/paging';
import { isForbidden } from '../lib/httpError';

type SectionProps = {
  /** Accessible name for the region, and the noun used in loading, error and no-access messages. */
  label: string;
  isLoading: boolean;
  error: Error | null;
  /** Runs the request again from the error state. */
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  /** More items exist than were loaded. */
  truncated?: boolean;
  children: ReactNode;
};

/** Content area that handles its own loading, error, no-access and empty states independently of the rest of the page. */
export function Section({ label, isLoading, error, onRetry, isEmpty, emptyText, truncated, children }: SectionProps) {
  return (
    <div role="region" aria-label={label}>
      {isLoading ? (
        <div className="flex flex-col gap-2" role="status" aria-label={`Loading ${label.toLowerCase()}`}>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : error && isForbidden(error) ? (
        <EmptyState variant="compact" type="no-access">
          <EmptyStateTitle as="p">{`You don't have access to ${label.toLowerCase()}. Ask an administrator to grant it.`}</EmptyStateTitle>
        </EmptyState>
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <Alert>
            <AlertDescription>
              Failed to load {label.toLowerCase()}: {error.message}
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : isEmpty ? (
        <EmptyState variant="compact" type="no-results">
          <EmptyStateTitle as="p">{emptyText}</EmptyStateTitle>
        </EmptyState>
      ) : (
        <>
          {children}
          {truncated ? (
            <p className="pt-2 text-sm text-muted-foreground">Showing the first {MAX_LISTED} results.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
