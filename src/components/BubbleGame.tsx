import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../theme';

const GAME_WIDTH = Dimensions.get('window').width - 40;
const GAME_HEIGHT = 250;

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

const BUBBLE_COLORS = [Colors.softGreen, Colors.mediumGreen, Colors.green, Colors.softCoral, Colors.warmAmber];

export function BubbleGame() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [nextId, setNextId] = useState(0);

  const spawnBubble = useCallback((x: number, y: number) => {
    const size = 30 + Math.random() * 40;
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const id = nextId;
    setNextId((n) => n + 1);
    setBubbles((prev) => [...prev, { id, x: x - size / 2, y: y - size / 2, size, color }]);
  }, [nextId]);

  const popBubble = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => s + 1);
  }, []);

  const handleTap = useCallback((e: { nativeEvent: { locationX: number; locationY: number } }) => {
    spawnBubble(e.nativeEvent.locationX, e.nativeEvent.locationY);
  }, [spawnBubble]);

  return (
    <View>
      <View style={s.headerRow}>
        <Text style={s.headerLabel}>BUBBLE POP</Text>
        <Text style={s.scoreText}>Popped: {score}</Text>
      </View>

      <Pressable onPress={handleTap} style={s.gameArea}>
        {bubbles.map((b) => (
          <Pressable
            key={b.id}
            onPress={(e) => { e.stopPropagation(); popBubble(b.id); }}
            style={[
              s.bubble,
              {
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
              },
            ]}
          />
        ))}

        {bubbles.length === 0 && (
          <View style={s.overlayCenter}>
            <Text style={s.overlayText}>Tap to create bubbles</Text>
            <Text style={s.overlaySubtext}>Then tap them to pop!</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLabel: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5 },
  scoreText: { fontSize: 12, color: Colors.textSecondary },
  gameArea: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: Colors.beige,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    opacity: 0.7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  overlaySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
