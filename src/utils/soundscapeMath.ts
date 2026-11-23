import type { SoundGroupKey, SoundMix } from '../types/tea';

export const SOUND_GROUP_KEYS: SoundGroupKey[] = ['rainWind', 'hearth', 'birds'];

export function createDefaultSoundMix(): SoundMix {
  return {
    rainWind: { enabled: false, volume: 0.45 },
    hearth: { enabled: false, volume: 0.42 },
    birds: { enabled: false, volume: 0.35 },
    naturalRandomness: true,
  };
}

export function countActiveSoundGroups(mix: SoundMix): number {
  return SOUND_GROUP_KEYS.reduce((acc, key) => (mix[key].enabled ? acc + 1 : acc), 0);
}

export function disableAllSoundGroups(mix: SoundMix): SoundMix {
  return {
    ...mix,
    rainWind: { ...mix.rainWind, enabled: false },
    hearth: { ...mix.hearth, enabled: false },
    birds: { ...mix.birds, enabled: false },
  };
}

export function computeDiscreteDelayMs(
  minMs: number,
  maxMs: number,
  naturalRandomness: boolean,
  rng: () => number = Math.random
): number {
  const safeMin = Math.max(50, Math.min(minMs, maxMs));
  const safeMax = Math.max(safeMin, maxMs);
  if (!naturalRandomness) {
    return Math.round((safeMin + safeMax) / 2);
  }
  // Slightly organic distribution with subtle jitter around the range
  const u = (rng() + rng()) / 2;
  const jitter = (rng() - 0.5) * (safeMax - safeMin) * 0.2;
  const raw = safeMin + u * (safeMax - safeMin) + jitter;
  return Math.round(Math.max(safeMin * 0.85, Math.min(safeMax * 1.15, raw)));
}

export function computeOrganicGainScale(
  naturalRandomness: boolean,
  rng: () => number = Math.random
): number {
  if (!naturalRandomness) return 0.85;
  return Number((0.55 + rng() * 0.6).toFixed(3));
}

export function shouldSkipPresenceEvent(
  skipProbability: number,
  naturalRandomness: boolean,
  rng: () => number = Math.random
): boolean {
  if (!naturalRandomness || skipProbability <= 0) return false;
  return rng() < Math.min(1, skipProbability);
}
