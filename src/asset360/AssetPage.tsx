import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbPageButton,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Fragment } from 'react';

import { useAssetViewModel } from '../assets/useAssetViewModel';
import { isForbidden } from '../lib/httpError';

import { DocumentsPanel } from './DocumentsPanel';
import { TimeSeriesPanel } from './TimeSeriesPanel';
import { WorkOrdersPanel } from './WorkOrdersPanel';

export function AssetPage() {
  const vm = useAssetViewModel();
  if (!vm.selected) return null;

  if (vm.isLoading) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Loading asset">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (vm.error || vm.notFound || !vm.details) {
    return (
      <div className="flex flex-col items-start gap-3">
        {vm.error && isForbidden(vm.error) ? (
          <EmptyState variant="compact" type="no-access">
            <EmptyStateTitle as="p">You don't have access to this asset.</EmptyStateTitle>
          </EmptyState>
        ) : (
          <Alert>
            <AlertDescription>
              {vm.error ? `Failed to load asset: ${vm.error.message}` : 'This asset could not be found.'}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          {vm.error ? (
            <Button variant="outline" size="sm" onClick={vm.retry}>
              Retry
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={vm.close}>
            Back to search
          </Button>
        </div>
      </div>
    );
  }

  const { asset, ancestors } = vm.details;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Breadcrumb aria-label="Asset location">
            <BreadcrumbList>
              {ancestors.map((ancestor) => (
                <Fragment key={`${ancestor.ref.space}:${ancestor.ref.externalId}`}>
                  <BreadcrumbItem>
                    <BreadcrumbPageButton onClick={() => vm.open(ancestor.ref)}>{ancestor.name}</BreadcrumbPageButton>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage>{asset.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <CardTitle as="h1">{asset.name}</CardTitle>
          {asset.description ? <CardDescription>{asset.description}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2" aria-label="Asset identity">
              <Badge variant="nordic">Tag: {asset.tag}</Badge>
              {asset.typeName ? <Badge variant="mountain">Type: {asset.typeName}</Badge> : null}
              {asset.className ? <Badge variant="mountain">Class: {asset.className}</Badge> : null}
              {asset.aliases.map((alias) => (
                <Badge key={alias} variant="secondary">
                  {alias}
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={vm.close}>
              Back to search
            </Button>
          </div>
        </CardContent>
      </Card>

      <TimeSeriesPanel asset={vm.selected} />
      <WorkOrdersPanel asset={vm.selected} />
      <DocumentsPanel asset={vm.selected} ancestors={ancestors.map((a) => a.ref)} />
    </div>
  );
}
