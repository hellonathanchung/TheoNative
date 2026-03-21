import { useEffect, useState, useCallback } from 'react';
import { supabase, SUPABASE_URL } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';

export interface ShareLink {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export function useShareLink(user: User | null) {
  const [activeLink, setActiveLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch active link on mount / user change
  useEffect(() => {
    if (!user) {
      setActiveLink(null);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActiveLink(data as ShareLink);
      } else {
        setActiveLink(null);
      }
    })();
  }, [user]);

  const createLink = useCallback(async (expiresInHours: number = 48): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      // Deactivate any existing links
      await supabase
        .from('share_links')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('share_links')
        .insert({ user_id: user.id, expires_at: expiresAt })
        .select()
        .single();

      if (error) throw error;

      const link = data as ShareLink;
      setActiveLink(link);

      // Build the Edge Function URL
      const supabaseUrl = SUPABASE_URL;
      return `${supabaseUrl}/functions/v1/live/${link.token}`;
    } catch (e) {
      console.warn('[useShareLink] createLink error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deactivateLink = useCallback(async () => {
    if (!activeLink) return;
    setLoading(true);
    try {
      await supabase
        .from('share_links')
        .update({ is_active: false })
        .eq('id', activeLink.id);
      setActiveLink(null);
    } catch (e) {
      console.warn('[useShareLink] deactivateLink error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeLink]);

  const getShareUrl = useCallback((): string | null => {
    if (!activeLink) return null;
    const supabaseUrl = SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/live/${activeLink.token}`;
  }, [activeLink]);

  return { activeLink, loading, createLink, deactivateLink, getShareUrl };
}
