import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@cognite/aura/components/command';
import { EmptyState, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { useEffect, useState } from 'react';

import { useAssetSearchViewModel } from '../assets/useAssetSearchViewModel';
import { isForbidden } from '../lib/httpError';
import { useDebouncedValue } from '../lib/useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 250;

/** Type-ahead asset search. Results keep the server's relevance order, so Command's own filtering is off. */
export function AssetSearch() {
  const { query, results, isLoading, error, retry, search, select } = useAssetSearchViewModel();
  // In-flight input; only the debounced query is host-synced.
  const [draft, setDraft] = useState(query);
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debounced.trim() !== query.trim()) search(debounced.trim());
    // Re-run only when the debounced text changes; `query` and `search` change on every search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl">Asset 360</h1>
      <Command shouldFilter={false} label="Search assets" className="rounded-lg border">
        <CommandInput
          aria-label="Search assets by tag, name or description"
          placeholder="Search by tag, name or description, for example PUMP-101"
          value={draft}
          onValueChange={setDraft}
        />
        {hasQuery ? (
          <CommandList>
            {isLoading ? (
              <div className="flex flex-col gap-2 p-2" role="status" aria-label="Loading search results">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-start gap-2 p-2">
                {isForbidden(error) ? (
                  <EmptyState variant="compact" type="no-access">
                    <EmptyStateTitle as="p">You don't have access to search assets.</EmptyStateTitle>
                  </EmptyState>
                ) : (
                  <>
                    <Alert>
                      <AlertDescription>Failed to load search results: {error.message}</AlertDescription>
                    </Alert>
                    <Button variant="outline" size="sm" onClick={retry}>
                      Retry
                    </Button>
                  </>
                )}
              </div>
            ) : results.length === 0 ? (
              <EmptyState variant="compact" type="no-results">
                <EmptyStateTitle as="p">{`No assets match "${query}". Try fewer characters, a different tag, or part of the name.`}</EmptyStateTitle>
              </EmptyState>
            ) : (
              <CommandGroup heading="Assets">
                {results.map((asset) => (
                  <CommandItem
                    key={`${asset.ref.space}:${asset.ref.externalId}`}
                    value={`${asset.ref.space}:${asset.ref.externalId}`}
                    onSelect={() => select(asset.ref)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{asset.name}</span>
                        <Badge variant="nordic">{asset.tag}</Badge>
                      </span>
                      <span className="truncate text-muted-foreground">
                        {[asset.description, asset.parentName ? `in ${asset.parentName}` : undefined]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        ) : null}
      </Command>
    </div>
  );
}
