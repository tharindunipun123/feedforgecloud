export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortByCreatedAt(items, direction = 'desc') {
  return [...items].sort((a, b) => {
    const diff = toMillis(a.createdAt) - toMillis(b.createdAt);
    return direction === 'desc' ? -diff : diff;
  });
}

export function sortByUpdatedAt(items, direction = 'desc') {
  return [...items].sort((a, b) => {
    const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt);
    const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt);
    const diff = aTime - bTime;
    return direction === 'desc' ? -diff : diff;
  });
}
