import type { Table } from 'dexie';

export interface CrudRepository<T, K> {
  get(id: K): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  put(item: T): Promise<K>;
  delete(id: K): Promise<void>;
  clear(): Promise<void>;
}

export const createCrudRepository = <T, K>(
  table: Table<T, K>,
): CrudRepository<T, K> => ({
  get: async (id) => await table.get(id),
  getAll: async () => await table.toArray(),
  put: async (item) => await table.put(item),
  delete: async (id) => {
    await table.delete(id);
  },
  clear: async () => {
    await table.clear();
  },
});
