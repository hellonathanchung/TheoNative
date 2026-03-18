import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
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
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

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

  // Fetch partner's contractions
  const fetchPartnerData = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data, error } = await supabase
        .from('contractions')
        .select('*')
        .eq('user_id', partnerId)
        .order('start_time', { ascending: true });

      if (!error && data && mountedRef.current) {
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
  }, [partnerId]);

  // Fetch on mount and when partnerId changes
  useEffect(() => {
    if (!partnerId) {
      setPartnerContractions([]);
      return;
    }
    fetchPartnerData();
  }, [partnerId, fetchPartnerData]);

  // Re-fetch when app comes to foreground
  useEffect(() => {
    if (!partnerId) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchPartnerData();
      }
    });

    return () => sub.remove();
  }, [partnerId, fetchPartnerData]);

  // Realtime subscription for partner's contractions
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel(`partner-contractions-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractions',
          filter: `user_id=eq.${partnerId}`,
        },
        () => {
          fetchPartnerData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, fetchPartnerData]);

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
