import type { GameDifficulty } from '../types';

// --- Sprout Jump (DinoGame) config ---

export interface DinoConfig {
  baseSpeed: number;
  speedIncrement: number;
  obstacleGapMin: number;
  obstacleGapMax: number;
  gravity: number;
  jumpForce: number;
}

export const DINO_CONFIGS: Record<GameDifficulty, DinoConfig> = {
  easy: {
    baseSpeed: 2.5,
    speedIncrement: 0.0005,
    obstacleGapMin: 120,
    obstacleGapMax: 220,
    gravity: 0.6,
    jumpForce: -11,
  },
  normal: {
    baseSpeed: 3.5,
    speedIncrement: 0.0008,
    obstacleGapMin: 90,
    obstacleGapMax: 180,
    gravity: 0.6,
    jumpForce: -11,
  },
  hard: {
    baseSpeed: 5.0,
    speedIncrement: 0.0012,
    obstacleGapMin: 60,
    obstacleGapMax: 130,
    gravity: 0.6,
    jumpForce: -11,
  },
};

// --- Bubble Pop (BubbleGame) config ---

export interface BubbleConfig {
  spawnRate: number;
  maxBubbles: number;
  speedMin: number;
  speedMax: number;
  radiusMin: number;
  radiusMax: number;
}

export const BUBBLE_CONFIGS: Record<GameDifficulty, BubbleConfig> = {
  easy: {
    spawnRate: 0.015,
    maxBubbles: 10,
    speedMin: 0.2,
    speedMax: 0.5,
    radiusMin: 18,
    radiusMax: 38,
  },
  normal: {
    spawnRate: 0.025,
    maxBubbles: 15,
    speedMin: 0.3,
    speedMax: 0.9,
    radiusMin: 14,
    radiusMax: 34,
  },
  hard: {
    spawnRate: 0.045,
    maxBubbles: 25,
    speedMin: 0.5,
    speedMax: 1.4,
    radiusMin: 10,
    radiusMax: 30,
  },
};
