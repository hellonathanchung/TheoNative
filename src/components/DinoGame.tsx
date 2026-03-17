import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Rect,
  Line,
  Circle,
  Path as SkiaPath,
  LinearGradient,
  vec,
  Skia,
  Group,
  Oval,
  RoundedRect,
} from '@shopify/react-native-skia';
import { useTheme, type ThemeColors } from '../theme';
import { loadDinoHigh, saveDinoHigh } from '../utils/storage';
import type { DinoConfig } from '../utils/gameConfig';

const GAME_WIDTH = Dimensions.get('window').width - 40;
const GAME_HEIGHT = 180;
const GROUND_Y = 145;

interface Obstacle {
  x: number;
  w: number;
  h: number;
  type: 'rock' | 'flower' | 'bush';
}

interface Cloud {
  x: number;
  y: number;
  w: number;
}

interface GameState {
  running: boolean;
  score: number;
  highScore: number;
  sproutY: number;
  sproutVy: number;
  jumping: boolean;
  obstacles: Obstacle[];
  clouds: Cloud[];
  frame: number;
  speed: number;
  nextObstacle: number;
  gameOver: boolean;
}

interface DinoGameProps {
  config: DinoConfig;
  headerExtra?: React.ReactNode;
}

export function DinoGame({ config, headerExtra }: DinoGameProps) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const configRef = useRef(config);
  configRef.current = config;

  const stateRef = useRef<GameState>({
    running: false,
    score: 0,
    highScore: loadDinoHigh(),
    sproutY: GROUND_Y,
    sproutVy: 0,
    jumping: false,
    obstacles: [],
    clouds: [
      { x: 60, y: 25, w: 40 },
      { x: 180, y: 15, w: 50 },
      { x: 290, y: 35, w: 35 },
    ],
    frame: 0,
    speed: config.baseSpeed,
    nextObstacle: 80,
    gameOver: false,
  });

  const rafRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayHigh, setDisplayHigh] = useState(stateRef.current.highScore);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [, forceRender] = useState(0);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.sproutY = GROUND_Y;
    s.sproutVy = 0;
    s.jumping = false;
    s.obstacles = [];
    s.clouds = [
      { x: 60, y: 25, w: 40 },
      { x: 180, y: 15, w: 50 },
      { x: 290, y: 35, w: 35 },
    ];
    s.frame = 0;
    s.speed = configRef.current.baseSpeed;
    s.nextObstacle = 80;
    s.gameOver = false;
    s.running = true;
    setDisplayScore(0);
    setIsGameOver(false);
    setGameStarted(true);
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.running && !s.gameOver) {
      resetGame();
      return;
    }
    if (s.gameOver) {
      resetGame();
      return;
    }
    if (!s.jumping) {
      s.sproutVy = configRef.current.jumpForce;
      s.jumping = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  }, [resetGame]);

  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;

      if (s.running && !s.gameOver) {
        s.frame++;
        const cfg = configRef.current;
        s.speed = cfg.baseSpeed + s.frame * cfg.speedIncrement;

        // Move clouds
        for (const c of s.clouds) c.x -= s.speed * 0.15;
        s.clouds = s.clouds.filter((c) => c.x + c.w > -20);
        if (s.clouds.length < 3 && Math.random() < 0.005) {
          s.clouds.push({
            x: GAME_WIDTH + 20,
            y: 15 + Math.random() * 30,
            w: 30 + Math.random() * 25,
          });
        }

        // Physics
        s.sproutVy += cfg.gravity;
        s.sproutY += s.sproutVy;
        if (s.sproutY >= GROUND_Y) {
          s.sproutY = GROUND_Y;
          s.sproutVy = 0;
          s.jumping = false;
        }

        // Spawn obstacles
        s.nextObstacle--;
        if (s.nextObstacle <= 0) {
          const types: Obstacle['type'][] = ['rock', 'flower', 'bush'];
          const type = types[Math.floor(Math.random() * types.length)];
          const h =
            type === 'rock'
              ? 16 + Math.random() * 12
              : type === 'flower'
                ? 20 + Math.random() * 10
                : 14 + Math.random() * 8;
          const w =
            type === 'bush' ? 22 + Math.random() * 10 : 14 + Math.random() * 8;
          s.obstacles.push({ x: GAME_WIDTH + 10, w, h, type });
          s.nextObstacle =
            cfg.obstacleGapMin +
            Math.random() * (cfg.obstacleGapMax - cfg.obstacleGapMin);
        }

        // Move obstacles
        for (const o of s.obstacles) o.x -= s.speed;
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);

        // Collision
        const sproutBox = { x: 32, y: s.sproutY - 30, w: 16, h: 38 };
        for (const o of s.obstacles) {
          const obsBox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h + 2 };
          if (
            sproutBox.x < obsBox.x + obsBox.w &&
            sproutBox.x + sproutBox.w > obsBox.x &&
            sproutBox.y + sproutBox.h > obsBox.y &&
            sproutBox.y < obsBox.y + obsBox.h
          ) {
            s.gameOver = true;
            s.running = false;
            if (s.score > s.highScore) {
              s.highScore = s.score;
              saveDinoHigh(s.highScore);
              setDisplayHigh(s.highScore);
            }
            setIsGameOver(true);
            break;
          }
        }

        // Score
        s.score = Math.floor(s.frame / 6);
        if (s.frame % 6 === 0) setDisplayScore(s.score);
      }

      forceRender((n) => n + 1);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const gs = stateRef.current;

  // Build grass tuft line segments
  const grassTufts: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let gx = 10; gx < GAME_WIDTH; gx += 25) {
    const offset = (gx * 7 + gs.frame * gs.speed * 0.5) % GAME_WIDTH;
    const px = (GAME_WIDTH - offset) % GAME_WIDTH;
    grassTufts.push(
      { x1: px, y1: GROUND_Y + 8, x2: px - 2, y2: GROUND_Y + 4 },
      { x1: px, y1: GROUND_Y + 8, x2: px + 2, y2: GROUND_Y + 3 },
    );
  }

  const renderObstacle = (obs: Obstacle, idx: number) => {
    if (obs.type === 'rock') {
      const path = Skia.Path.Make();
      path.moveTo(obs.x, GROUND_Y + 2);
      path.lineTo(obs.x + obs.w * 0.3, GROUND_Y - obs.h);
      path.lineTo(obs.x + obs.w * 0.7, GROUND_Y - obs.h + 4);
      path.lineTo(obs.x + obs.w, GROUND_Y + 2);
      path.close();
      const hlPath = Skia.Path.Make();
      hlPath.moveTo(obs.x + obs.w * 0.3, GROUND_Y - obs.h);
      hlPath.lineTo(obs.x + obs.w * 0.5, GROUND_Y - obs.h + 3);
      hlPath.lineTo(obs.x + obs.w * 0.35, GROUND_Y - obs.h + 8);
      hlPath.close();
      return (
        <Group key={`obs-${idx}`}>
          <SkiaPath path={path} color={colors.textMuted} />
          <SkiaPath path={hlPath} color={colors.textSecondary} />
        </Group>
      );
    }
    if (obs.type === 'flower') {
      const cx = obs.x + obs.w / 2;
      const cy = GROUND_Y - obs.h + 3;
      return (
        <Group key={`obs-${idx}`}>
          <Line
            p1={vec(cx, GROUND_Y + 2)}
            p2={vec(cx, GROUND_Y - obs.h + 6)}
            color={colors.deepGreen}
            strokeWidth={2}
          />
          {[0, 1, 2, 3, 4].map((a) => {
            const angle = (a / 5) * Math.PI * 2;
            return (
              <Oval
                key={a}
                x={cx + Math.cos(angle) * 5 - 4}
                y={cy + Math.sin(angle) * 5 - 3}
                width={8}
                height={6}
                color="#E57373"
              />
            );
          })}
          <Circle cx={cx} cy={cy} r={3} color="#FFEB3B" />
        </Group>
      );
    }
    // bush
    return (
      <Group key={`obs-${idx}`}>
        <Circle
          cx={obs.x + obs.w * 0.3}
          cy={GROUND_Y - obs.h * 0.5}
          r={obs.w * 0.35}
          color={colors.green}
        />
        <Circle
          cx={obs.x + obs.w * 0.7}
          cy={GROUND_Y - obs.h * 0.5}
          r={obs.w * 0.35}
          color={colors.green}
        />
        <Circle
          cx={obs.x + obs.w * 0.5}
          cy={GROUND_Y - obs.h * 0.7}
          r={obs.w * 0.3}
          color={colors.green}
        />
        <Circle
          cx={obs.x + obs.w * 0.4}
          cy={GROUND_Y - obs.h * 0.55}
          r={obs.w * 0.15}
          color={colors.mediumGreen}
        />
      </Group>
    );
  };

  // Sprout character
  const sproutX = 40;
  const sproutY = gs.sproutY;
  const sway = Math.sin(gs.frame * 0.1) * 2;
  const legPhase = gs.frame * 0.2;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>SPROUT JUMP</Text>
        {headerExtra}
        <View style={styles.scoresRow}>
          <Text style={styles.scoreLabel}>
            {String(displayScore).padStart(4, '0')}
          </Text>
          <Pressable
            onPress={() => {
              if (displayHigh > 0) {
                saveDinoHigh(0);
                stateRef.current.highScore = 0;
                setDisplayHigh(0);
              }
            }}
          >
            <Text style={styles.highLabel}>
              HI {String(displayHigh).padStart(4, '0')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={jump}>
        <View style={styles.canvasWrapper}>
          <Canvas style={styles.canvas}>
            {/* Sky gradient */}
            <Rect x={0} y={0} width={GAME_WIDTH} height={GAME_HEIGHT}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, GAME_HEIGHT)}
                colors={[colors.cream, colors.beige]}
              />
            </Rect>

            {/* Ground */}
            <Rect
              x={0}
              y={GROUND_Y + 8}
              width={GAME_WIDTH}
              height={GAME_HEIGHT - GROUND_Y}
              color={colors.softGreen}
            />
            <Line
              p1={vec(0, GROUND_Y + 8)}
              p2={vec(GAME_WIDTH, GROUND_Y + 8)}
              color={colors.mediumGreen}
              strokeWidth={1}
            />

            {/* Grass tufts */}
            {grassTufts.map((g, i) => (
              <Line
                key={`g-${i}`}
                p1={vec(g.x1, g.y1)}
                p2={vec(g.x2, g.y2)}
                color={colors.green}
                strokeWidth={1}
              />
            ))}

            {/* Clouds */}
            {gs.clouds.map((c, i) => (
              <Group key={`cloud-${i}`} opacity={0.7}>
                <Circle cx={c.x} cy={c.y} r={c.w * 0.3} color={colors.beige} />
                <Circle
                  cx={c.x + c.w * 0.25}
                  cy={c.y - 5}
                  r={c.w * 0.25}
                  color={colors.beige}
                />
                <Circle
                  cx={c.x + c.w * 0.5}
                  cy={c.y}
                  r={c.w * 0.3}
                  color={colors.beige}
                />
              </Group>
            ))}

            {/* Obstacles */}
            {gs.obstacles.map((obs, i) => renderObstacle(obs, i))}

            {/* Sprout character */}
            <Group>
              {/* Pot (body) */}
              <RoundedRect
                x={sproutX - 8}
                y={sproutY - 16}
                width={16}
                height={18}
                r={3}
                color={colors.mediumGreen}
              />
              {/* Eyes */}
              <Circle cx={sproutX - 3} cy={sproutY - 9} r={1.5} color={colors.textPrimary} />
              <Circle cx={sproutX + 3} cy={sproutY - 9} r={1.5} color={colors.textPrimary} />
              {/* Stem */}
              <Line
                p1={vec(sproutX, sproutY - 16)}
                p2={vec(sproutX + sway * 0.5, sproutY - 30)}
                color={colors.deepGreen}
                strokeWidth={2}
              />
              {/* Leaves */}
              <Oval
                x={sproutX + sway * 0.5 + 4 - 5}
                y={sproutY - 29 - 3}
                width={10}
                height={6}
                color={colors.deepGreen}
              />
              <Oval
                x={sproutX + sway * 0.5 - 4 - 5}
                y={sproutY - 31 - 3}
                width={10}
                height={6}
                color={colors.deepGreen}
              />
              {/* Legs */}
              <Line
                p1={vec(sproutX - 4, sproutY + 2)}
                p2={vec(sproutX - 4 + Math.sin(legPhase) * 4, sproutY + 8)}
                color={colors.textSecondary}
                strokeWidth={2}
              />
              <Line
                p1={vec(sproutX + 4, sproutY + 2)}
                p2={vec(
                  sproutX + 4 + Math.sin(legPhase + Math.PI) * 4,
                  sproutY + 8,
                )}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Group>

            {/* Game over overlay */}
            {gs.gameOver && (
              <Rect
                x={0}
                y={0}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                color={mode === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(245, 250, 245, 0.6)'}
              />
            )}
          </Canvas>

          {/* Text overlays rendered as RN Text for crisp font rendering */}
          <View style={styles.overlayContainer} pointerEvents="none">
            {!gameStarted && !isGameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>Tap to Start!</Text>
                <Text style={styles.overlaySubtext}>
                  Help Sprout jump over obstacles
                </Text>
              </View>
            )}
            {isGameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>Game Over!</Text>
                <Text style={styles.overlaySubtext}>Tap to play again</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {!gameStarted && (
        <Text style={styles.hint}>Tap the screen to jump</Text>
      )}
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
    fontVariant: ['tabular-nums'],
  },
  highLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  overlaySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
});
