import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Contraction } from '../types';
import type { User } from '@supabase/supabase-js';

const DEBOUNCE_MS = 500;

export function useSync(
  user: User | null,
  partnerId: string | null,
  localContractions: Contraction[],
) {
  const [partnerContractions, setPartnerContractions] = useState<Contraction[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>('');

  // Upload local contractions to Supabase (debounced)
  useEffect(() => {
    if (!user || localContractions.length === 0) return;

    // Build a fingerprint to avoid redundant syncs
    const fingerprint = localContractions.map((c) => c.id).join(',');
    if (fingerprint === lastSyncedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const rows = localContractions.map((c) => ({
          id: c.id,
          user_id: user.id,
          start_time: c.startTime,
          end_time: c.endTime,
          duration: c.duration,
          intensity: c.intensity ?? null,
        }));

        const { error } = await supabase
          .from('contractions')
          .upsert(rows, { onConflict: 'id,user_id' });

        if (!error) {
          lastSyncedRef.current = fingerprint;
        }
      } catch {
        // Offline or error — will retry on next change
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, localContractions]);

  // Fetch partner's contractions initially
  useEffect(() => {
    if (!partnerId) {
      setPartnerContractions([]);
      return;
    }

    const fetchPartnerData = async () => {
      try {
        const { data, error } = await supabase
          .from('contractions')
          .select('*')
          .eq('user_id', partnerId)
          .order('start_time', { ascending: true });

        if (!error && data) {
          setPartnerContractions(
            data.map((row: any) => ({
              id: row.id,
              startTime: row.start_time,
              endTime: row.end_time,
              duration: row.duration,
              intensity: row.intensity,
            })),
          );
        }
      } catch {
        // Offline
      }
    };

    fetchPartnerData();
  }, [partnerId]);

  // Realtime subscription for partner's contractions
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel('partner-contractions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractions',
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setPartnerContractions((prev) =>
              prev.filter((c) => c.id !== old.id),
            );
          } else {
            const row = payload.new as any;
            const contraction: Contraction = {
              id: row.id,
              startTime: row.start_time,
              endTime: row.end_time,
              duration: row.duration,
              intensity: row.intensity,
            };
            setPartnerContractions((prev) => {
              const existing = prev.findIndex((c) => c.id === contraction.id);
              if (existing >= 0) {
                const next = [...prev];
                next[existing] = contraction;
                return next;
              }
              return [...prev, contraction].sort(
                (a, b) => a.startTime - b.startTime,
              );
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  // Clean up synced contractions when starting a new session
  const clearSyncedContractions = useCallback(async () => {
    if (!user) return;
    try {
      await supabase
        .from('contractions')
        .delete()
        .eq('user_id', user.id);
      lastSyncedRef.current = '';
    } catch {
      // Offline
    }
  }, [user]);

  return { partnerContractions, clearSyncedContractions };
}
