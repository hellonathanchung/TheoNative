import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSharing } from '../contexts/SharingContext';
import { useShareLink } from '../hooks/useShareLink';
import { useTheme, type ThemeColors } from '../theme';

const EXPIRY_OPTIONS = [
  { label: '4 hours', hours: 4 },
  { label: '8 hours', hours: 8 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

export function MidwifeSharing() {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { user } = useSharing();
  const { activeLink, loading, createLink, deactivateLink, getShareUrl } = useShareLink(user);
  const [selectedHours, setSelectedHours] = useState(48);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <View style={s.container}>
        <Text style={s.desc}>
          Sign in above to share a live link with your midwife or care team.
        </Text>
      </View>
    );
  }

  const handleCreate = async () => {
    const url = await createLink(selectedHours);
    if (url) {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    if (url) {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (url) {
      await Share.share({
        message: `Follow my contractions in real time: ${url}`,
      });
    }
  };

  // Active link exists
  if (activeLink) {
    const expiresAt = new Date(activeLink.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const hoursLeft = Math.max(0, Math.floor(diffMs / 3600000));
    const minsLeft = Math.max(0, Math.floor((diffMs % 3600000) / 60000));

    return (
      <View style={s.container}>
        <View style={s.activeRow}>
          <View style={s.statusDot} />
          <Text style={s.activeText}>Live link active</Text>
        </View>
        <Text style={s.expiryText}>
          Expires in {hoursLeft}h {minsLeft}m
        </Text>

        <View style={s.buttonRow}>
          <Pressable style={s.actionBtn} onPress={handleCopy}>
            <Text style={s.actionBtnText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={handleShare}>
            <Text style={s.actionBtnText}>Share</Text>
          </Pressable>
        </View>

        <Pressable
          style={s.deactivateBtn}
          onPress={deactivateLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <Text style={s.deactivateText}>Deactivate Link</Text>
          )}
        </Pressable>
      </View>
    );
  }

  // No active link — show create form
  return (
    <View style={s.container}>
      <Text style={s.desc}>
        Generate a temporary link your midwife can open in any browser to see
        your contractions in real time.
      </Text>

      <View style={s.expiryPicker}>
        {EXPIRY_OPTIONS.map((opt) => (
          <Pressable
            key={opt.hours}
            style={[
              s.expiryOption,
              selectedHours === opt.hours && s.expiryOptionActive,
            ]}
            onPress={() => setSelectedHours(opt.hours)}
          >
            <Text
              style={[
                s.expiryOptionText,
                selectedHours === opt.hours && s.expiryOptionTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[s.primaryBtn, loading && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.deepGreen} size="small" />
        ) : (
          <Text style={s.primaryBtnText}>
            {copied ? 'Link Copied!' : 'Generate & Copy Link'}
          </Text>
        )}
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
    expiryPicker: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
    },
    expiryOption: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.beige,
    },
    expiryOptionActive: {
      backgroundColor: colors.deepGreen,
    },
    expiryOptionText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    expiryOptionTextActive: {
      color: colors.white,
      fontWeight: '600',
    },
    primaryBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.beige,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 8,
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.deepGreen,
    },
    activeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.green,
      marginRight: 8,
    },
    activeText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    expiryText: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 12,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: colors.beige,
      borderRadius: 12,
      alignItems: 'center',
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.deepGreen,
    },
    deactivateBtn: {
      paddingVertical: 8,
      alignItems: 'center',
    },
    deactivateText: {
      fontSize: 13,
      color: colors.danger,
    },
  });
