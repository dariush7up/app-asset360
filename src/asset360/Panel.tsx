import { Card, CardContent, CardHeader, CardTitle } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '../lib/ErrorBoundary';

/** A titled panel on the asset page. A render failure inside one panel stays inside it. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorBoundary variant="panel">{children}</ErrorBoundary>
      </CardContent>
    </Card>
  );
}
