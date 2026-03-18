import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useSharing } from "../contexts/SharingContext";
import { useTheme, type ThemeColors } from "../theme";

export function PartnerSharing() {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const sharing = useSharing();
  const {
    user,
    authLoading,
    signInWithOtp,
    verifyOtp,
    signOut,
    partner,
    pendingInvites,
    sentInvite,
    partnershipLoading,
    invitePartner,
    acceptInvite,
    declineInvite,
    disconnect,
    cancelInvite,
  } = sharing;

  const [email, setEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithOtp(email.trim());
      setOtpEmail(email.trim());
      setShowOtp(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(otpEmail, otp.trim());
      setShowOtp(false);
      setEmail("");
      setOtp("");
    } catch (e: any) {
      setError(e.message ?? "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    if (!partnerEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await invitePartner(partnerEmail.trim());
      setPartnerEmail("");
    } catch (e: any) {
      setError(e.message ?? "Failed to send invite");
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string, inviterName: string) => {
    try {
      await acceptInvite(inviteId);
    } catch (e: any) {
      if (e.message === "ALREADY_CONNECTED") {
        Alert.alert(
          "Already Connected",
          `You're already connected to ${
            partner?.display_name || partner?.email
          }. Disconnect from them and accept this invite instead?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Switch Partner",
              style: "destructive",
              onPress: async () => {
                try {
                  await disconnect();
                  await acceptInvite(inviteId);
                } catch (err: any) {
                  setError(err.message ?? "Failed to switch partner");
                }
              },
            },
          ]
        );
      } else {
        setError(e.message ?? "Failed to accept invite");
      }
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Partner?",
      `This will stop sharing data with ${
        partner?.display_name || partner?.email
      }.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Disconnect", style: "destructive", onPress: disconnect },
      ]
    );
  };

  if (authLoading) {
    return (
      <View style={s.container}>
        <ActivityIndicator color={colors.deepGreen} />
      </View>
    );
  }

  // State: Not signed in — show email input
  if (!user && !showOtp) {
    return (
      <View style={s.container}>
        <Text style={s.desc}>
          Sign in to share contraction data with your partner in real time.
        </Text>
        <TextInput
          style={s.input}
          placeholder="mnkyDluffy@onepiece.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        {error && <Text style={s.error}>{error}</Text>}
        <Pressable
          style={[s.primaryBtn, busy && { opacity: 0.6 }]}
          onPress={handleSendOtp}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.deepGreen} size="small" />
          ) : (
            <Text style={s.primaryBtnText}>Sign in</Text>
          )}
        </Pressable>
      </View>
    );
  }

  // State: OTP entry
  if (!user && showOtp) {
    return (
      <View style={s.container}>
        <Text style={s.desc}>Enter the 8-digit code sent to {otpEmail}</Text>
        <TextInput
          style={s.input}
          placeholder="8-digit code"
          placeholderTextColor={colors.textMuted}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
        />
        {error && <Text style={s.error}>{error}</Text>}
        <Pressable
          style={[s.primaryBtn, busy && { opacity: 0.6 }]}
          onPress={handleVerifyOtp}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.deepGreen} size="small" />
          ) : (
            <Text style={s.primaryBtnText}>Verify</Text>
          )}
        </Pressable>
        <Pressable
          style={s.linkBtn}
          onPress={() => {
            setShowOtp(false);
            setOtp("");
            setError(null);
          }}
        >
          <Text style={s.linkText}>Use different email</Text>
        </Pressable>
      </View>
    );
  }

  // State: Connected to partner
  if (user && partner) {
    return (
      <View style={s.container}>
        <View style={s.connectedRow}>
          <View style={s.statusDot} />
          <Text style={s.connectedText}>
            Connected to {partner.display_name || partner.email}
          </Text>
        </View>
        <Text style={s.signedInAs}>Signed in as {user.email}</Text>
        <Pressable style={s.disconnectBtn} onPress={handleDisconnect}>
          <Text style={s.disconnectText}>Disconnect</Text>
        </Pressable>
        <Pressable style={s.linkBtn} onPress={signOut}>
          <Text style={s.linkText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  // State: Signed in — show pending invites, sent invite, or invite form
  return (
    <View style={s.container}>
      <Text style={s.signedInAs}>Signed in as {user?.email}</Text>

      {/* Pending invites received */}
      {pendingInvites.map((invite) => {
        const inviterName =
          invite.inviter_display_name || invite.inviter_email || "Someone";
        return (
          <View key={invite.id} style={s.inviteCard}>
            <Text style={s.inviteText}>
              {inviterName} wants to share with you
            </Text>
            <View style={s.inviteActions}>
              <Pressable
                style={s.acceptBtn}
                onPress={() => handleAcceptInvite(invite.id, inviterName)}
              >
                <Text style={s.acceptText}>Accept</Text>
              </Pressable>
              <Pressable
                style={s.declineBtn}
                onPress={() => declineInvite(invite.id)}
              >
                <Text style={s.declineText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Sent invite pending */}
      {sentInvite && (
        <View style={s.inviteCard}>
          <Text style={s.inviteText}>
            Invitation sent to {sentInvite.invitee_email} — waiting...
          </Text>
          <Pressable style={s.cancelBtn} onPress={cancelInvite}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Invite partner form */}
      {!sentInvite && (
        <>
          <Text style={s.desc}>
            Enter your partner's email to invite them to view your contractions.
          </Text>
          <TextInput
            style={s.input}
            placeholder="Partner's email"
            placeholderTextColor={colors.textMuted}
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          {error && <Text style={s.error}>{error}</Text>}
          <Pressable
            style={[s.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={handleInvite}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.deepGreen} size="small" />
            ) : (
              <Text style={s.primaryBtnText}>Invite Partner</Text>
            )}
          </Pressable>
        </>
      )}

      <Pressable style={s.linkBtn} onPress={signOut}>
        <Text style={s.linkText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    desc: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.beige,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    primaryBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.beige,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 8,
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.deepGreen,
    },
    linkBtn: {
      paddingVertical: 8,
      alignItems: "center",
    },
    linkText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    error: {
      fontSize: 12,
      color: colors.danger,
      marginBottom: 8,
    },
    signedInAs: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 12,
    },
    connectedRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.green,
      marginRight: 8,
    },
    connectedText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    disconnectBtn: {
      paddingVertical: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.beige,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    disconnectText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.danger,
    },
    inviteCard: {
      backgroundColor: colors.beige,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    inviteText: {
      fontSize: 13,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    inviteActions: {
      flexDirection: "row",
      gap: 8,
    },
    acceptBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.beige,
      borderRadius: 10,
    },
    acceptText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.deepGreen,
    },
    declineBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    declineText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    cancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.beige,
      borderRadius: 10,
      alignSelf: "flex-start",
    },
    cancelText: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
