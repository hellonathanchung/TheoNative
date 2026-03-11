import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import type { GameDifficulty } from '../types';

interface Props {
  value: GameDifficulty;
  onChange: (difficulty: GameDifficulty) => void;
}

const LEVELS: { key: GameDifficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'normal', label: 'Normal' },
  { key: 'hard', label: 'Hard' },
];

export function DifficultySelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const active = value === level.key;
        return (
          <Pressable
            key={level.key}
            style={[
              styles.btn,
              { backgroundColor: active ? Colors.deepGreen : Colors.beige },
            ]}
            onPress={() => onChange(level.key)}
          >
            <Text
              style={[
                styles.label,
                { color: active ? Colors.cream : Colors.textMuted },
              ]}
            >
              {level.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
