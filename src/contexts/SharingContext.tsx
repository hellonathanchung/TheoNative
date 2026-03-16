import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePartnership } from '../hooks/usePartnership';
import { useSync } from '../hooks/useSync';
import type { Contraction } from '../types';
import type { User } from '@supabase/supabase-js';
import type { Partnership } from '../hooks/usePartnership';

interface SharingContextValue {
  // Auth
  user: User | null;
  authLoading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Partnership
  partner: { email: string; display_name: string | null } | null;
  partnerId: string | null;
  pendingInvites: Partnership[];
  sentInvite: Partnership | null;
  partnershipLoading: boolean;
  invitePartner: (email: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  declineInvite: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  cancelInvite: () => Promise<void>;

  // Sync
  partnerContractions: Contraction[];
  clearSyncedContractions: () => Promise<void>;
}

const SharingContext = createContext<SharingContextValue | null>(null);

interface Props {
  localContractions: Contraction[];
  children: React.ReactNode;
}

export function SharingProvider({ localContractions, children }: Props) {
  const auth = useAuth();
  const partnership = usePartnership(auth.user);
  const sync = useSync(auth.user, partnership.partnerId, localContractions);

  const value: SharingContextValue = {
    user: auth.user,
    authLoading: auth.loading,
    signInWithOtp: auth.signInWithOtp,
    verifyOtp: auth.verifyOtp,
    signOut: auth.signOut,

    partner: partnership.partner,
    partnerId: partnership.partnerId,
    pendingInvites: partnership.pendingInvites,
    sentInvite: partnership.sentInvite,
    partnershipLoading: partnership.loading,
    invitePartner: partnership.invitePartner,
    acceptInvite: partnership.acceptInvite,
    declineInvite: partnership.declineInvite,
    disconnect: partnership.disconnect,
    cancelInvite: partnership.cancelInvite,

    partnerContractions: sync.partnerContractions,
    clearSyncedContractions: sync.clearSyncedContractions,
  };

  return (
    <SharingContext.Provider value={value}>
      {children}
    </SharingContext.Provider>
  );
}

export function useSharing(): SharingContextValue {
  const ctx = useContext(SharingContext);
  if (!ctx) throw new Error('useSharing must be used within SharingProvider');
  return ctx;
}
