import { createContext, useContext } from 'react';

import type { AssetService } from '../assets/AssetService';
import type { FileService } from '../files/FileService';
import type { TimeSeriesService } from '../timeSeries/TimeSeriesService';
import type { WorkOrderService } from '../workOrders/WorkOrderService';

export type AppServices = {
  assets: AssetService;
  timeSeries: TimeSeriesService;
  files: FileService;
  workOrders: WorkOrderService;
};

export const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error('useAppServices must be used inside AppServicesProvider');
  return services;
}
