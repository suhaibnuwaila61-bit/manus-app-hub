import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CacheEntry = {
  data: unknown[];
  fetchedAt: number;
};

const tableCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

export function useSupabaseTable<T extends { id: string }>(table: string) {
  const { user } = useAuth();
  const cacheKey = user ? `${user.id}:${table}` : `guest:${table}`;
  const cachedEntry = tableCache.get(cacheKey);
  const hasFreshCache = !!cachedEntry && Date.now() - cachedEntry.fetchedAt < CACHE_TTL_MS;

  const [data, setData] = useState<T[]>((cachedEntry?.data as T[]) ?? []);
  const [loading, setLoading] = useState(!cachedEntry);

  const fetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) {
      tableCache.delete(cacheKey);
      setData([]);
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }

    const { data: rows, error } = await (supabase as any)
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && rows) {
      tableCache.set(cacheKey, { data: rows as T[], fetchedAt: Date.now() });
      setData(rows as T[]);
    }

    setLoading(false);
  }, [cacheKey, table, user]);

  useEffect(() => {
    if (!user) {
      tableCache.delete(cacheKey);
      setData([]);
      setLoading(false);
      return;
    }

    if (cachedEntry) {
      setData(cachedEntry.data as T[]);
      setLoading(false);

      if (!hasFreshCache) {
        void fetch({ silent: true });
      }

      return;
    }

    void fetch();
  }, [cacheKey, cachedEntry, fetch, hasFreshCache, user]);

  const create = async (record: Record<string, any>) => {
    if (!user) return null;
    const { data: row, error } = await (supabase as any)
      .from(table)
      .insert({ ...record, user_id: user.id })
      .select()
      .single();

    if (!error && row) {
      setData((prev) => {
        const next = [row as T, ...prev];
        tableCache.set(cacheKey, { data: next, fetchedAt: Date.now() });
        return next;
      });
      return row;
    }

    return null;
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await (supabase as any).from(table).update(updates).eq("id", id);
    if (!error) {
      setData((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
        tableCache.set(cacheKey, { data: next, fetchedAt: Date.now() });
        return next;
      });
    }
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (!error) {
      setData((prev) => {
        const next = prev.filter((item) => item.id !== id);
        tableCache.set(cacheKey, { data: next, fetchedAt: Date.now() });
        return next;
      });
    }
  };

  return { data, loading, refresh: () => fetch(), create, update, remove };
}
