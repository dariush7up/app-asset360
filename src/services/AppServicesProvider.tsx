import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useContext, useMemo, type ReactNode } from 'react';

import { ApiAssetService } from '../assets/AssetService';
import { ApiFileService } from '../files/FileService';
import { Throttle } from '../lib/throttle';
import { ApiTimeSeriesService } from '../timeSeries/TimeSeriesService';
import { ApiWorkOrderService } from '../workOrders/WorkOrderService';

import { AppServicesContext, type AppServices } from './AppServices';

/** At most 6 concurrent CDF requests, matching the browser's per-origin HTTP/1.1 connection limit. */
const MAX_CONCURRENT_CDF_REQUESTS = 6;

/** Builds the real services from the Fusion-authenticated CogniteClient, unless services were already injected. */
export function AppServicesProvider({ children }: { children: ReactNode }) {
  const client = useCogniteSdk();
  const injected = useContext(AppServicesContext);
  const services = useMemo<AppServices>(() => {
    if (injected) return injected;

    const throttle = new Throttle(MAX_CONCURRENT_CDF_REQUESTS);
    const t = <A extends unknown[], R>(fn: (...args: A) => Promise<R>): ((...args: A) => Promise<R>) =>
      (...args: A) => throttle.run(() => fn(...args));

    // Wrap each SDK method with the throttle so all services share the same concurrency cap.
    const throttled = {
      instances: {
        query: t(client.instances.query.bind(client.instances)),
        search: t(client.instances.search.bind(client.instances)),
        retrieve: t(client.instances.retrieve.bind(client.instances)),
      },
      datapoints: {
        retrieve: t(client.datapoints.retrieve.bind(client.datapoints)),
        retrieveLatest: t(client.datapoints.retrieveLatest.bind(client.datapoints)),
      },
      files: {
        getDownloadUrls: t(client.files.getDownloadUrls.bind(client.files)),
      },
    };
    return {
      assets: new ApiAssetService(throttled),
      timeSeries: new ApiTimeSeriesService(throttled),
      files: new ApiFileService(throttled),
      workOrders: new ApiWorkOrderService(throttled),
    };
  }, [client, injected]);
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}
