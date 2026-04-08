import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type TableName = "transactions" | "investments" | "savings_goals" | "budgets" | "lendings";

export function useSupabaseTable<T extends Tables<TableName>>(table: TableName) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setData([]); setLoading(false); return; }
    const { data: rows, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && rows) setData(rows as T[]);
    setLoading(false);
  }, [user, table]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (record: Record<string, any>) => {
    if (!user) return null;
    const { data: row, error } = await supabase
      .from(table)
      .insert({ ...record, user_id: user.id })
      .select()
      .single();
    if (!error && row) {
      setData(prev => [row as T, ...prev]);
      return row;
    }
    return null;
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from(table).update(updates).eq("id", id);
    if (!error) {
      setData(prev => prev.map(item => (item as any).id === id ? { ...item, ...updates } : item));
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) {
      setData(prev => prev.filter(item => (item as any).id !== id));
    }
  };

  return { data, loading, refresh: fetch, create, update, remove };
}
