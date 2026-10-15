import { useAppState } from '../state/appStateContext';

import { AssetPage } from './AssetPage';
import { AssetSearch } from './AssetSearch';
import { RecentAssets } from './RecentAssets';

/** Home (search and recently viewed) until an asset is selected, then its 360 page. The selection is host-synced so links restore it. */
export function Asset360() {
  const { state } = useAppState();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
        {state.asset ? (
          <AssetPage />
        ) : (
          <>
            <AssetSearch />
            <RecentAssets />
          </>
        )}
      </section>
    </main>
  );
}
