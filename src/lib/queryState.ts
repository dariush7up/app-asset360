type QueryLike = { isLoading: boolean; error: Error | null; refetch: () => Promise<unknown> };

export type PanelState = {
  isLoading: boolean;
  error: Error | null;
  /** Runs the request again, for the retry control on a failed panel. */
  retry: () => void;
};

export function queryState(query: QueryLike): PanelState {
  return { isLoading: query.isLoading, error: query.error, retry: () => void query.refetch() };
}
