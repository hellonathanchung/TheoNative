import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Rect,
  Circle,
  Oval,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { useTheme, type ThemeColors } from '../theme';
import { loadBubbleHigh, saveBubbleHigh } from '../utils/storage';
import type { BubbleConfig } from '../utils/gameConfig';

const GAME_WIDTH = Dimensions.get('window').width - 40;
const GAME_HEIGHT = 220;

interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
  wobbleOffset: number;
  wobbleSpeed: number;
  opacity: number;
  popping: boolean;
  popFrame: number;
}

const COLORS = [
  'rgba(129, 199, 132, 0.6)', // green
  'rgba(165, 214, 167, 0.6)', // light green
  'rgba(200, 230, 201, 0.5)', // pale green
  'rgba(76, 175, 80, 0.5)', // deep green
  'rgba(156, 204, 101, 0.5)', // lime
  'rgba(174, 213, 129, 0.5)', // light lime
];

interface GameState {
  bubbles: Bubble[];
  nextId: number;
  score: number;
  highScore: number;
  frame: number;
}

interface BubbleGameProps {
  config: BubbleConfig;
  headerExtra?: React.ReactNode;
}

export function BubbleGame({ config, headerExtra }: BubbleGameProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const configRef = useRef(config);
  configRef.current = config;

  const stateRef = useRef<GameState>({
    bubbles: [],
    nextId: 0,
    score: 0,
    highScore: loadBubbleHigh(),
    frame: 0,
  });

  const rafRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayHigh, setDisplayHigh] = useState(stateRef.current.highScore);
  const [, forceRender] = useState(0);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.bubbles = [];
    s.nextId = 0;
    s.score = 0;
    s.frame = 0;
    setDisplayScore(0);
  }, []);

  const popBubble = useCallback((tapX: number, tapY: number) => {
    const s = stateRef.current;
    // Find closest bubble to tap
    let closest: Bubble | null = null;
    let closestDist = Infinity;
    for (const b of s.bubbles) {
      if (b.popping) continue;
      const dx = b.x - tapX;
      const dy = b.y - tapY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r + 20 && dist < closestDist) {
        closest = b;
        closestDist = dist;
      }
    }
    if (closest) {
      closest.popping = true;
      closest.popFrame = 0;
      s.score++;
      setDisplayScore(s.score);
      if (s.score > s.highScore) {
        s.highScore = s.score;
        saveBubbleHigh(s.score);
        setDisplayHigh(s.score);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, []);

  // Game loop
  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      s.frame++;

      // Spawn bubbles from bottom
      const cfg = configRef.current;
      if (
        s.bubbles.filter((b) => !b.popping).length < cfg.maxBubbles &&
        Math.random() < cfg.spawnRate
      ) {
        const r = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);
        s.bubbles.push({
          id: s.nextId++,
          x: r + Math.random() * (GAME_WIDTH - r * 2),
          y: GAME_HEIGHT + r,
          r,
          speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.02,
          opacity: 1,
          popping: false,
          popFrame: 0,
        });
      }

      // Update bubbles
      for (const b of s.bubbles) {
        if (b.popping) {
          b.popFrame++;
          b.opacity = Math.max(0, 1 - b.popFrame / 12);
          b.r += 1.5; // Expand
        } else {
          b.y -= b.speed;
          b.x += Math.sin(s.frame * b.wobbleSpeed + b.wobbleOffset) * 0.4;
        }
      }

      // Remove off-screen or fully popped
      s.bubbles = s.bubbles.filter((b) =>
        b.popping ? b.popFrame < 12 : b.y + b.r > -10,
      );

      if (s.frame % 2 === 0) forceRender((n) => n + 1);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const gs = stateRef.current;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>BUBBLE POP</Text>
        {headerExtra}
        <View style={styles.scoresRow}>
          <Text style={styles.scoreLabel}>{displayScore} popped</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset bubble score"
            onPress={resetGame}
          >
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear bubble high score"
            onPress={() => {
              if (displayHigh > 0) {
                saveBubbleHigh(0);
                stateRef.current.highScore = 0;
                setDisplayHigh(0);
              }
            }}
          >
            <Text style={styles.highLabel}>HI {displayHigh}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.canvasPressable}
        accessibilityRole="button"
        accessibilityLabel="Bubble game board. Tap to pop bubbles."
        onPressIn={(e) => {
          popBubble(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }}
      >
        <View style={styles.canvasWrapper}>
          <Canvas style={styles.canvas}>
            {/* Background gradient (underwater feel) */}
            <Rect x={0} y={0} width={GAME_WIDTH} height={GAME_HEIGHT}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, GAME_HEIGHT)}
                colors={[colors.beige, colors.cream]}
              />
            </Rect>

            {/* Bubbles */}
            {gs.bubbles.map((b) => (
              <Group key={b.id} opacity={b.opacity}>
                {/* Main bubble */}
                <Circle cx={b.x} cy={b.y} r={b.r} color={b.color} />

                {!b.popping ? (
                  <>
                    {/* Shine highlight */}
                    <Oval
                      x={b.x - b.r * 0.25 - b.r * 0.3}
                      y={b.y - b.r * 0.25 - b.r * 0.2}
                      width={b.r * 0.6}
                      height={b.r * 0.4}
                      color="rgba(255, 255, 255, 0.4)"
                    />
                    {/* Border */}
                    <Circle
                      cx={b.x}
                      cy={b.y}
                      r={b.r}
                      color="rgba(76, 175, 80, 0.3)"
                      style="stroke"
                      strokeWidth={1}
                    />
                  </>
                ) : (
                  <>
                    {/* Pop sparkles */}
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const angle = (i / 6) * Math.PI * 2;
                      const dist = b.r * 0.8 + b.popFrame * 2;
                      return (
                        <Circle
                          key={i}
                          cx={b.x + Math.cos(angle) * dist}
                          cy={b.y + Math.sin(angle) * dist}
                          r={2}
                          color="rgba(76, 175, 80, 0.5)"
                        />
                      );
                    })}
                  </>
                )}
              </Group>
            ))}
          </Canvas>

          {/* Instruction text */}
          {gs.score === 0 && gs.frame > 60 && (
            <View style={styles.overlay} pointerEvents="none">
              <Text style={styles.overlayText}>Tap the bubbles!</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  highLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resetLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  canvasPressable: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  canvasWrapper: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  canvas: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
