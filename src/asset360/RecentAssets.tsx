import { Button } from '@cognite/aura/components/button';

import { useRecentAssetsViewModel } from '../recent/useRecentAssetsViewModel';

/** The assets the analyst opened most recently on this device. Shown on the home screen only when there are some. */
export function RecentAssets() {
  const { recent, open } = useRecentAssetsViewModel();
  if (recent.length === 0) return null;

  return (
    <section aria-label="Recently viewed" className="flex flex-col gap-2">
      <h2 className="text-xl">Recently viewed</h2>
      <ul className="flex flex-col gap-1">
        {recent.map((asset) => (
          <li key={`${asset.ref.space}:${asset.ref.externalId}`}>
            <Button variant="ghost" onClick={() => open(asset.ref)}>
              <span className="font-medium">{asset.name}</span>
              <span className="ml-2 text-muted-foreground">{asset.tag}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
