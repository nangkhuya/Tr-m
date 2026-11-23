import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDiscreteDelayMs,
  computeOrganicGainScale,
  countActiveSoundGroups,
  createDefaultSoundMix,
  disableAllSoundGroups,
  shouldSkipPresenceEvent,
} from './soundscapeMath';

test('default sound mix starts paused with naturalRandomness enabled', () => {
  const mix = createDefaultSoundMix();
  assert.equal(mix.naturalRandomness, true);
  assert.equal(countActiveSoundGroups(mix), 0);

  mix.rainWind.enabled = true;
  mix.birds.enabled = true;
  assert.equal(countActiveSoundGroups(mix), 2);

  const reset = disableAllSoundGroups(mix);
  assert.equal(countActiveSoundGroups(reset), 0);
  assert.equal(reset.rainWind.volume, mix.rainWind.volume);
  assert.equal(reset.naturalRandomness, true);
});

test('computeDiscreteDelayMs returns fixed midpoint when randomness is off and bounded jitter when on', () => {
  const steady = computeDiscreteDelayMs(1500, 5000, false, () => 0.1);
  assert.equal(steady, 3250);

  const minSample = computeDiscreteDelayMs(12000, 28000, true, () => 0);
  const maxSample = computeDiscreteDelayMs(12000, 28000, true, () => 0.999);
  assert.ok(minSample >= 12000 * 0.85);
  assert.ok(maxSample <= 28000 * 1.15);
  assert.notEqual(minSample, maxSample);
});

test('computeOrganicGainScale and shouldSkipPresenceEvent respect naturalRandomness', () => {
  assert.equal(computeOrganicGainScale(false, () => 0.1), 0.85);
  const lowGain = computeOrganicGainScale(true, () => 0);
  const highGain = computeOrganicGainScale(true, () => 1);
  assert.equal(lowGain, 0.55);
  assert.equal(highGain, 1.15);

  assert.equal(shouldSkipPresenceEvent(0.5, false, () => 0.1), false);
  assert.equal(shouldSkipPresenceEvent(0.35, true, () => 0.2), true);
  assert.equal(shouldSkipPresenceEvent(0.35, true, () => 0.8), false);
});
