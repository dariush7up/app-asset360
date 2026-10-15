const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return '-';
  return dateTime.format(new Date(epochMs));
}

const time = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' });

export function formatTime(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return '-';
  return time.format(new Date(epochMs));
}
