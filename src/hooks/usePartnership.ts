import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
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
  // Enriched inviter profile (populated via join in fetchPartnerships)
  inviter_email?: string;
  inviter_display_name?: string | null;
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
  const userRef = useRef(user);
  userRef.current = user;
  const userId = user?.id;
  const userEmail = user?.email;

  const fetchPartnerships = useCallback(async () => {
    const user = userRef.current;
    if (!user) {
      setPartner(null);
      setPartnerId(null);
      setPendingInvites([]);
      setSentInvite(null);
      return;
    }

    setLoading(true);
    try {
      // Join with inviter profile to get their email/display_name
      const { data, error } = await supabase
        .from('partnerships')
        .select('*, inviter:profiles!inviter_id(email, display_name)')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id},invitee_email.eq.${user.email}`);

      if (error) throw error;

      // Flatten the nested inviter profile into the partnership object
      const partnerships: Partnership[] = (data ?? []).map((p: any) => ({
        ...p,
        inviter_email: p.inviter?.email,
        inviter_display_name: p.inviter?.display_name ?? null,
        inviter: undefined,
      }));

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

      // Pending invites received by this user (match by id or email)
      const received = partnerships.filter(
        (p) =>
          p.status === 'pending' &&
          p.inviter_id !== user.id &&
          (p.invitee_id === user.id ||
            p.invitee_email.toLowerCase() === user.email?.toLowerCase()),
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
  }, [userId, userEmail]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  // Re-fetch partnerships when app comes to foreground
  useEffect(() => {
    if (!userId) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchPartnerships();
      }
    });

    return () => sub.remove();
  }, [userId, fetchPartnerships]);

  // Realtime subscription for partnership changes (accept/decline/new invites)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('partnership-changes')
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
  }, [userId, fetchPartnerships]);

  const invitePartner = useCallback(
    async (email: string) => {
      if (!user) return;
      const targetEmail = email.toLowerCase().trim();

      // Guard: can't invite yourself
      if (targetEmail === user.email?.toLowerCase()) {
        throw new Error("You can't invite yourself.");
      }

      // Guard: already connected to a partner
      if (partnerId) {
        throw new Error(
          'You are already connected to a partner. Disconnect first to invite someone new.',
        );
      }

      // Look up target user's profile to enable reciprocal and already-connected checks
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();

      // Check if the target user is already in an accepted partnership
      if (targetProfile) {
        const { data: theirPartnership } = await supabase
          .from('partnerships')
          .select('id')
          .or(`inviter_id.eq.${targetProfile.id},invitee_id.eq.${targetProfile.id}`)
          .eq('status', 'accepted')
          .maybeSingle();

        if (theirPartnership) {
          throw new Error('That person is already connected to a partner.');
        }
      }

      // Check if there's already a pending invite FROM that email to us (reciprocal)
      const { data: existing } = await supabase
        .from('partnerships')
        .select('*')
        .eq('invitee_email', user.email)
        .eq('status', 'pending');

      // Reciprocal: find a pending invite specifically from the target user
      const reciprocal = targetProfile
        ? (existing ?? []).find((p: any) => p.inviter_id === targetProfile.id)
        : null;

      if (reciprocal) {
        // Auto-accept their invite instead of creating a duplicate
        const { error } = await supabase
          .from('partnerships')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            invitee_id: user.id,
          })
          .eq('id', reciprocal.id);
        if (error) throw error;
        analytics.partnerInviteAccepted();
      } else {
        // Check if we previously sent a declined invite to this person — reset it to pending
        const { data: prior } = await supabase
          .from('partnerships')
          .select('id, status')
          .eq('inviter_id', user.id)
          .eq('invitee_email', targetEmail)
          .maybeSingle();

        if (prior?.status === 'declined') {
          const { error } = await supabase
            .from('partnerships')
            .update({ status: 'pending', accepted_at: null })
            .eq('id', prior.id);
          if (error) throw error;
          analytics.partnerInviteSent();
        } else {
          const { error } = await supabase.from('partnerships').insert({
            inviter_id: user.id,
            invitee_email: targetEmail,
          });
          if (error) {
            if (error.code === '23505') {
              throw new Error('You already have a pending invite to this person');
            }
            throw error;
          }
          analytics.partnerInviteSent();
        }
      }

      await fetchPartnerships();
    },
    [user, partnerId, fetchPartnerships],
  );

  const acceptInvite = useCallback(
    async (partnershipId: string) => {
      if (!user) return;

      // Guard: already connected to a different partner
      if (partnerId) {
        throw new Error('ALREADY_CONNECTED');
      }

      const { error } = await supabase
        .from('partnerships')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          invitee_id: user.id,
        })
        .eq('id', partnershipId);
      if (error) throw error;
      analytics.partnerInviteAccepted();
      await fetchPartnerships();
    },
    [user, partnerId, fetchPartnerships],
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
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id},invitee_email.eq.${user.email}`);
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
