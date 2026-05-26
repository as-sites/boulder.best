/** Run async work over `items` with at most `concurrency` tasks in flight. */
export const mapWithConcurrency = async <TItem, TResult>(
  items: ReadonlyArray<TItem>,
  concurrency: number,
  mapper: (item: TItem, index: number) => Promise<TResult>,
): Promise<TResult[]> => {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(1, concurrency), items.length);
  const results: TResult[] = [];

  for (let start = 0; start < items.length; start += limit) {
    const batch = items.slice(start, start + limit);
    const batchResults = await Promise.all(
      batch.map(async (item, offset) => await mapper(item, start + offset)),
    );
    results.push(...batchResults);
  }

  return results;
};
