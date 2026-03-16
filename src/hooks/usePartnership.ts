import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { analytics } from '../utils/analytics';
import type { User } from '@supabase/supabase-js';

export interface Partnership {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  accepted_at: string | null;
}

interface PartnerProfile {
  email: string;
  display_name: string | null;
}

export function usePartnership(user: User | null) {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Partnership[]>([]);
  const [sentInvite, setSentInvite] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPartnerships = useCallback(async () => {
    if (!user) {
      setPartner(null);
      setPartnerId(null);
      setPendingInvites([]);
      setSentInvite(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partnerships')
        .select('*')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`);

      if (error) throw error;

      const partnerships = (data ?? []) as Partnership[];

      // Find accepted partnership
      const accepted = partnerships.find((p) => p.status === 'accepted');
      if (accepted) {
        const otherUserId =
          accepted.inviter_id === user.id
            ? accepted.invitee_id
            : accepted.inviter_id;
        if (otherUserId) {
          setPartnerId(otherUserId);
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', otherUserId)
            .single();
          setPartner(profile as PartnerProfile | null);
        }
      } else {
        setPartner(null);
        setPartnerId(null);
      }

      // Pending invites received by this user
      const received = partnerships.filter(
        (p) => p.status === 'pending' && p.invitee_id === user.id,
      );
      setPendingInvites(received);

      // Pending invite sent by this user
      const sent = partnerships.find(
        (p) => p.status === 'pending' && p.inviter_id === user.id,
      );
      setSentInvite(sent ?? null);
    } catch {
      // Silently fail — UI will show "no partner"
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  // Realtime subscription for partnership changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partnerships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partnerships',
        },
        () => {
          fetchPartnerships();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPartnerships]);

  const invitePartner = useCallback(
    async (email: string) => {
      if (!user) return;
      const { error } = await supabase.from('partnerships').insert({
        inviter_id: user.id,
        invitee_email: email.toLowerCase().trim(),
      });
      if (error) throw error;
      analytics.partnerInviteSent();
      await fetchPartnerships();
    },
    [user, fetchPartnerships],
  );

  const acceptInvite = useCallback(
    async (partnershipId: string) => {
      const { error } = await supabase
        .from('partnerships')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', partnershipId);
      if (error) throw error;
      analytics.partnerInviteAccepted();
      await fetchPartnerships();
    },
    [fetchPartnerships],
  );

  const declineInvite = useCallback(
    async (partnershipId: string) => {
      const { error } = await supabase
        .from('partnerships')
        .update({ status: 'declined' })
        .eq('id', partnershipId);
      if (error) throw error;
      await fetchPartnerships();
    },
    [fetchPartnerships],
  );

  const disconnect = useCallback(async () => {
    if (!user) return;
    // Delete all accepted/pending partnerships for this user
    const { error } = await supabase
      .from('partnerships')
      .delete()
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`);
    if (error) throw error;
    analytics.partnerDisconnected();
    setPartner(null);
    setPartnerId(null);
    setSentInvite(null);
    setPendingInvites([]);
  }, [user]);

  const cancelInvite = useCallback(async () => {
    if (!sentInvite) return;
    const { error } = await supabase
      .from('partnerships')
      .delete()
      .eq('id', sentInvite.id);
    if (error) throw error;
    setSentInvite(null);
  }, [sentInvite]);

  return {
    partner,
    partnerId,
    pendingInvites,
    sentInvite,
    loading,
    invitePartner,
    acceptInvite,
    declineInvite,
    disconnect,
    cancelInvite,
  };
}
