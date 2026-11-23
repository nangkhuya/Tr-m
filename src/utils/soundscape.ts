import type { SoundGroupKey, SoundMix } from '../types/tea';
import {
  computeDiscreteDelayMs,
  computeOrganicGainScale,
  createDefaultSoundMix,
  shouldSkipPresenceEvent,
  SOUND_GROUP_KEYS,
} from './soundscapeMath';

interface ChannelNodes {
  gain: GainNode;
  timeouts: Set<number>;
  disposed: boolean;
  cleanup: () => void;
}

class TeaSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private roomImpulseBuffer: AudioBuffer | null = null;
  private channels: Partial<Record<SoundGroupKey, ChannelNodes>> = {};
  private stopCleanupTimers: Partial<Record<SoundGroupKey, number>> = {};
  private currentMix: SoundMix = createDefaultSoundMix();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createChannelConvolver(ctx: AudioContext): ConvolverNode {
    if (!this.roomImpulseBuffer || this.roomImpulseBuffer.sampleRate !== ctx.sampleRate) {
      const sampleRate = ctx.sampleRate;
      const duration = 0.55;
      const length = Math.floor(sampleRate * duration);
      const impulse = ctx.createBuffer(1, length, sampleRate);
      const data = impulse.getChannelData(0);

      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const decay = Math.pow(1 - t, 2.8);
        const white = Math.random() * 2 - 1;
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp * decay * 0.45;
      }
      this.roomImpulseBuffer = impulse;
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = this.roomImpulseBuffer;
    return convolver;
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 3, pink = false): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const output = buffer.getChannelData(0);

    if (!pink) {
      for (let i = 0; i < length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private scheduleManagedTimeout(channel: ChannelNodes, delayMs: number, fn: () => void) {
    if (channel.disposed || typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      channel.timeouts.delete(id);
      if (!channel.disposed) {
        fn();
      }
    }, delayMs);
    channel.timeouts.add(id);
  }

  private clearChannelTimeouts(channel: ChannelNodes) {
    channel.timeouts.forEach((id) => window.clearTimeout(id));
    channel.timeouts.clear();
  }

  // --- Discrete Synthesis: Soft Window Creak in Breeze (450Hz-1300Hz, 0.4-1.2s) ---
  private triggerWindowCreak(ctx: AudioContext, dest: AudioNode) {
    const scale = computeOrganicGainScale(this.currentMix.naturalRandomness);
    const now = ctx.currentTime;
    const duration = 0.42 + Math.random() * 0.76; // 0.42s - 1.18s
    const baseFreq = 460 + Math.random() * 680; // 460Hz - 1140Hz

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = 'triangle';
    oscB.type = 'sine';

    // Slow organic pitch drift like timber/hinge shifting gently in wind
    const drift = (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 34);
    oscA.frequency.setValueAtTime(baseFreq, now);
    oscA.frequency.linearRampToValueAtTime(baseFreq + drift, now + duration * 0.65);
    oscA.frequency.linearRampToValueAtTime(baseFreq + drift * 0.5, now + duration);

    oscB.frequency.setValueAtTime(baseFreq * 1.014, now);
    oscB.frequency.linearRampToValueAtTime((baseFreq + drift) * 1.022, now + duration * 0.7);

    const frictionNoise = ctx.createBufferSource();
    frictionNoise.buffer = this.createNoiseBuffer(ctx, 1.3, true);
    const frictionFilter = ctx.createBiquadFilter();
    frictionFilter.type = 'bandpass';
    frictionFilter.frequency.setValueAtTime(Math.min(1300, baseFreq * 1.25), now);
    frictionFilter.Q.value = 5.2;

    const creakFilter = ctx.createBiquadFilter();
    creakFilter.type = 'bandpass';
    creakFilter.frequency.setValueAtTime(Math.min(1300, baseFreq * 1.12), now);
    creakFilter.Q.value = 4.5;

    const env = ctx.createGain();
    const peak = 0.026 * scale;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + duration * 0.28);
    env.gain.linearRampToValueAtTime(peak * 0.72, now + duration * 0.62);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscMix = ctx.createGain();
    oscMix.gain.value = 0.55;
    const frictionMix = ctx.createGain();
    frictionMix.gain.value = 0.85;

    oscA.connect(oscMix);
    oscB.connect(oscMix);
    oscMix.connect(creakFilter);
    creakFilter.connect(env);

    frictionNoise.connect(frictionFilter);
    frictionFilter.connect(frictionMix);
    frictionMix.connect(env);

    env.connect(dest);

    oscA.start(now);
    oscB.start(now);
    frictionNoise.start(now);
    oscA.stop(now + duration + 0.04);
    oscB.stop(now + duration + 0.04);
    frictionNoise.stop(now + duration + 0.04);
  }

  // --- Discrete Synthesis: Wood & Charcoal Crackle (5-25ms, 1200Hz-3500Hz) ---
  private triggerCharcoalCrackle(ctx: AudioContext, dest: AudioNode) {
    const scale = computeOrganicGainScale(this.currentMix.naturalRandomness);
    const now = ctx.currentTime;
    const duration = 0.006 + Math.random() * 0.018; // 6ms - 24ms

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.08, false);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1250 + Math.random() * 2200, now); // 1250Hz - 3450Hz
    bandpass.Q.value = 2.0 + Math.random() * 2.5;

    const env = ctx.createGain();
    const peak = (0.065 + Math.random() * 0.115) * scale;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.0015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(bandpass);
    bandpass.connect(env);
    env.connect(dest);

    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  // --- Discrete Synthesis: Subtle Soft Cough / Throat Clear (180-320ms, 300Hz-1100Hz + Room Reverb) ---
  private triggerSubtleCough(ctx: AudioContext, dest: AudioNode, convolver: ConvolverNode) {
    const scale = computeOrganicGainScale(this.currentMix.naturalRandomness);
    const isDoubleClear = Math.random() < 0.45;
    const pulses = isDoubleClear ? [0, 0.145] : [0];

    pulses.forEach((offset, idx) => {
      const start = ctx.currentTime + offset;
      const duration = idx === 0 ? 0.18 + Math.random() * 0.11 : 0.14 + Math.random() * 0.07; // 180-290ms
      const ampScale = idx === 0 ? scale : scale * 0.68;

      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(ctx, 0.4, true);

      // Two gentle vocal-tract formant filters (300Hz - 1100Hz)
      const formantLow = ctx.createBiquadFilter();
      formantLow.type = 'bandpass';
      formantLow.frequency.setValueAtTime(340 + Math.random() * 140, start);
      formantLow.Q.value = 3.0;

      const formantMid = ctx.createBiquadFilter();
      formantMid.type = 'bandpass';
      formantMid.frequency.setValueAtTime(820 + Math.random() * 240, start);
      formantMid.Q.value = 2.2;

      // Soft damped vocal body pulse
      const throatOsc = ctx.createOscillator();
      throatOsc.type = 'triangle';
      const f0 = 145 + Math.random() * 35;
      throatOsc.frequency.setValueAtTime(f0, start);
      throatOsc.frequency.exponentialRampToValueAtTime(Math.max(85, f0 * 0.76), start + duration);

      const throatFilter = ctx.createBiquadFilter();
      throatFilter.type = 'bandpass';
      throatFilter.frequency.setValueAtTime(380, start);
      throatFilter.Q.value = 1.8;

      const throatGain = ctx.createGain();
      throatGain.gain.value = 0.16;

      const env = ctx.createGain();
      const peak = 0.068 * ampScale;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.linearRampToValueAtTime(peak, start + 0.028);
      env.gain.linearRampToValueAtTime(peak * 0.55, start + duration * 0.45);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.65;

      noise.connect(formantLow);
      noise.connect(formantMid);
      formantLow.connect(env);
      formantMid.connect(env);

      throatOsc.connect(throatFilter);
      throatFilter.connect(throatGain);
      throatGain.connect(env);

      env.connect(dryGain);
      dryGain.connect(dest);
      env.connect(convolver);

      noise.start(start);
      throatOsc.start(start);
      noise.stop(start + duration + 0.03);
      throatOsc.stop(start + duration + 0.03);
    });
  }

  // --- Discrete Synthesis: Veranda Birds Chirp (80-220ms, 2200Hz-4600Hz FM/pitch-glide) ---
  private triggerBirdChirp(ctx: AudioContext, dest: AudioNode, convolver: ConvolverNode) {
    const scale = computeOrganicGainScale(this.currentMix.naturalRandomness);
    const now = ctx.currentTime;
    const duration = 0.085 + Math.random() * 0.13; // 85ms - 215ms
    const startFreq = 2300 + Math.random() * 1900; // 2300Hz - 4200Hz
    const glideUp = Math.random() > 0.35;
    const endFreq = Math.min(4600, Math.max(2200, glideUp ? startFreq * (1.14 + Math.random() * 0.16) : startFreq * 0.84));

    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(startFreq, now);
    carrier.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.72);
    carrier.frequency.exponentialRampToValueAtTime(
      Math.max(2200, endFreq * (glideUp ? 0.94 : 1.06)),
      now + duration
    );

    // Gentle FM trill
    const mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(28 + Math.random() * 26, now);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(45 + Math.random() * 90, now);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    const softFilter = ctx.createBiquadFilter();
    softFilter.type = 'bandpass';
    softFilter.frequency.setValueAtTime(3200, now);
    softFilter.Q.value = 0.75;

    const env = ctx.createGain();
    const peak = 0.042 * scale;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + duration * 0.18);
    env.gain.linearRampToValueAtTime(peak * 0.78, now + duration * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.72;

    carrier.connect(softFilter);
    softFilter.connect(env);

    env.connect(dryGain);
    dryGain.connect(dest);
    env.connect(convolver);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + duration + 0.03);
    mod.stop(now + duration + 0.03);
  }

  private startChannel(kind: SoundGroupKey, initialVolume: number) {
    const ctx = this.ensureContext();
    if (!ctx || this.channels[kind]) return;

    if (this.stopCleanupTimers[kind]) {
      window.clearTimeout(this.stopCleanupTimers[kind]);
      delete this.stopCleanupTimers[kind];
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, initialVolume * 0.36),
      ctx.currentTime + 0.55
    );
    masterGain.connect(ctx.destination);

    const timeouts = new Set<number>();

    if (kind === 'rainWind') {
      // 1) Rain layer
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = this.createNoiseBuffer(ctx, 4, true);
      rainSrc.loop = true;

      const rainBand = ctx.createBiquadFilter();
      rainBand.type = 'bandpass';
      rainBand.frequency.value = 1380;
      rainBand.Q.value = 0.55;

      const rainLowpass = ctx.createBiquadFilter();
      rainLowpass.type = 'lowpass';
      rainLowpass.frequency.value = 3350;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.76;

      rainSrc.connect(rainBand);
      rainBand.connect(rainLowpass);
      rainLowpass.connect(rainGain);
      rainGain.connect(masterGain);

      // 2) Bamboo wind layer
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = this.createNoiseBuffer(ctx, 4, true);
      windSrc.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 510;
      windFilter.Q.value = 1.75;

      const windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.14;

      const windLfoGain = ctx.createGain();
      windLfoGain.gain.value = 230;

      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.value = 0.62;

      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);

      rainSrc.start();
      windSrc.start();
      windLfo.start();

      const channel: ChannelNodes = {
        gain: masterGain,
        timeouts,
        disposed: false,
        cleanup: () => {
          channel.disposed = true;
          this.clearChannelTimeouts(channel);
          try {
            rainSrc.stop();
            windSrc.stop();
            windLfo.stop();
            rainSrc.disconnect();
            windSrc.disconnect();
            masterGain.disconnect();
          } catch {
            // ignore already-stopped nodes
          }
        },
      };

      // 3) Soft window creak loop (every 12-28s)
      const scheduleCreak = (firstRun = false) => {
        const delay = firstRun
          ? computeDiscreteDelayMs(4500, 9500, this.currentMix.naturalRandomness)
          : computeDiscreteDelayMs(12000, 28000, this.currentMix.naturalRandomness);
        this.scheduleManagedTimeout(channel, delay, () => {
          if (!shouldSkipPresenceEvent(0.22, this.currentMix.naturalRandomness)) {
            this.triggerWindowCreak(ctx, masterGain);
          }
          scheduleCreak(false);
        });
      };
      scheduleCreak(true);

      this.channels.rainWind = channel;
      return;
    }

    if (kind === 'hearth') {
      // 1) Warm charcoal & simmering kettle bed + room convolver
      const hearthConvolver = this.createChannelConvolver(ctx);
      const hearthWet = ctx.createGain();
      hearthWet.gain.value = 0.38;
      hearthConvolver.connect(hearthWet);
      hearthWet.connect(masterGain);

      const kettleBed = ctx.createBufferSource();
      kettleBed.buffer = this.createNoiseBuffer(ctx, 3.5, true);
      kettleBed.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 540;

      const shimmerSrc = ctx.createBufferSource();
      shimmerSrc.buffer = this.createNoiseBuffer(ctx, 3, false);
      shimmerSrc.loop = true;

      const shimmerBand = ctx.createBiquadFilter();
      shimmerBand.type = 'bandpass';
      shimmerBand.frequency.value = 2550;
      shimmerBand.Q.value = 2.4;

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.072;

      kettleBed.connect(lowpass);
      lowpass.connect(masterGain);
      shimmerSrc.connect(shimmerBand);
      shimmerBand.connect(shimmerGain);
      shimmerGain.connect(masterGain);

      kettleBed.start();
      shimmerSrc.start();

      const channel: ChannelNodes = {
        gain: masterGain,
        timeouts,
        disposed: false,
        cleanup: () => {
          channel.disposed = true;
          this.clearChannelTimeouts(channel);
          try {
            kettleBed.stop();
            shimmerSrc.stop();
            kettleBed.disconnect();
            shimmerSrc.disconnect();
            hearthConvolver.disconnect();
            hearthWet.disconnect();
            masterGain.disconnect();
          } catch {
            // ignore
          }
        },
      };

      // 2) Wood & charcoal crackle clusters (1-3 pops every 1.5-5s)
      const scheduleCrackleCluster = (firstRun = false) => {
        const delay = firstRun
          ? computeDiscreteDelayMs(800, 1800, this.currentMix.naturalRandomness)
          : computeDiscreteDelayMs(1500, 5000, this.currentMix.naturalRandomness);
        this.scheduleManagedTimeout(channel, delay, () => {
          const count = 1 + Math.floor(Math.random() * 3); // 1-3 crackles
          for (let i = 0; i < count; i++) {
            const offsetMs = i === 0 ? 0 : 40 + Math.random() * 140;
            if (offsetMs === 0) {
              this.triggerCharcoalCrackle(ctx, masterGain);
            } else {
              this.scheduleManagedTimeout(channel, offsetMs, () => {
                this.triggerCharcoalCrackle(ctx, masterGain);
              });
            }
          }
          scheduleCrackleCluster(false);
        });
      };
      scheduleCrackleCluster(true);

      // 3) Subtle discreet soft cough / throat clear (very sparse: every 35-75s, skip prob 35%)
      const scheduleCough = (firstRun = false) => {
        const delay = firstRun
          ? computeDiscreteDelayMs(14000, 28000, this.currentMix.naturalRandomness)
          : computeDiscreteDelayMs(35000, 75000, this.currentMix.naturalRandomness);
        this.scheduleManagedTimeout(channel, delay, () => {
          if (!shouldSkipPresenceEvent(0.35, this.currentMix.naturalRandomness)) {
            this.triggerSubtleCough(ctx, masterGain, hearthConvolver);
          }
          scheduleCough(false);
        });
      };
      scheduleCough(true);

      this.channels.hearth = channel;
      return;
    }

    // Group 3: 'birds' — Veranda birds + ultra-soft garden air
    const birdsConvolver = this.createChannelConvolver(ctx);
    const birdsWet = ctx.createGain();
    birdsWet.gain.value = 0.34;
    birdsConvolver.connect(birdsWet);
    birdsWet.connect(masterGain);

    const airSrc = ctx.createBufferSource();
    airSrc.buffer = this.createNoiseBuffer(ctx, 4, true);
    airSrc.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 1800;
    airFilter.Q.value = 0.7;

    const airGain = ctx.createGain();
    airGain.gain.value = 0.08;

    airSrc.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(masterGain);
    airSrc.start();

    const channel: ChannelNodes = {
      gain: masterGain,
      timeouts,
      disposed: false,
      cleanup: () => {
        channel.disposed = true;
        this.clearChannelTimeouts(channel);
        try {
          airSrc.stop();
          airSrc.disconnect();
          birdsConvolver.disconnect();
          birdsWet.disconnect();
          masterGain.disconnect();
        } catch {
          // ignore
        }
      },
    };

    const scheduleBirdPhrase = (firstRun = false) => {
      const delay = firstRun
        ? computeDiscreteDelayMs(600, 1400, this.currentMix.naturalRandomness)
        : computeDiscreteDelayMs(3000, 9000, this.currentMix.naturalRandomness);
      this.scheduleManagedTimeout(channel, delay, () => {
        if (!shouldSkipPresenceEvent(0.18, this.currentMix.naturalRandomness)) {
          const phraseCount = 1 + Math.floor(Math.random() * 3); // 1-3 chirps
          for (let i = 0; i < phraseCount; i++) {
            const offsetMs = i === 0 ? 0 : 120 + i * (110 + Math.random() * 140);
            if (offsetMs === 0) {
              this.triggerBirdChirp(ctx, masterGain, birdsConvolver);
            } else {
              this.scheduleManagedTimeout(channel, offsetMs, () => {
                this.triggerBirdChirp(ctx, masterGain, birdsConvolver);
              });
            }
          }
        }
        scheduleBirdPhrase(false);
      });
    };
    scheduleBirdPhrase(true);

    this.channels.birds = channel;
  }

  private stopChannel(kind: SoundGroupKey) {
    const channel = this.channels[kind];
    if (!channel) return;

    channel.disposed = true;
    this.clearChannelTimeouts(channel);
    delete this.channels[kind];

    if (this.ctx) {
      const now = this.ctx.currentTime;
      try {
        channel.gain.gain.cancelScheduledValues(now);
        channel.gain.gain.setTargetAtTime(0.0001, now, 0.12);
      } catch {
        // ignore
      }
    }

    if (this.stopCleanupTimers[kind]) {
      window.clearTimeout(this.stopCleanupTimers[kind]);
    }
    this.stopCleanupTimers[kind] = window.setTimeout(() => {
      channel.cleanup();
      delete this.stopCleanupTimers[kind];
    }, 320);
  }

  public applyMix(mix: SoundMix) {
    this.currentMix = mix;
    SOUND_GROUP_KEYS.forEach((key) => {
      const cfg = mix[key];
      const existing = this.channels[key];
      if (cfg.enabled) {
        if (!existing) {
          this.startChannel(key, cfg.volume);
        } else if (this.ctx) {
          existing.gain.gain.setTargetAtTime(
            Math.max(0.001, cfg.volume * 0.36),
            this.ctx.currentTime,
            0.12
          );
        }
      } else if (existing) {
        this.stopChannel(key);
      }
    });
  }

  public stopAll() {
    SOUND_GROUP_KEYS.forEach((key) => {
      if (this.channels[key]) {
        this.stopChannel(key);
      }
    });
  }

  public playPorcelainChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [1568, 2637, 3520];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const peak = idx === 0 ? 0.08 : idx === 1 ? 0.045 : 0.025;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85 - idx * 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  public playTeaPour() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(ctx, 1.4, true);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(1450, now + 1.1);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + 1.3);
  }

  public playHourglassComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bellBus = ctx.createGain();
    bellBus.gain.setValueAtTime(0.85, now);

    const convolver = this.createChannelConvolver(ctx);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.26, now);

    bellBus.connect(ctx.destination);
    bellBus.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);

    // Subtle soft wooden mallet tap transient
    const tap = ctx.createBufferSource();
    tap.buffer = this.createNoiseBuffer(ctx, 0.08, true);
    const tapFilter = ctx.createBiquadFilter();
    tapFilter.type = 'lowpass';
    tapFilter.frequency.setValueAtTime(640, now);
    const tapGain = ctx.createGain();
    tapGain.gain.setValueAtTime(0.0001, now);
    tapGain.gain.linearRampToValueAtTime(0.048, now + 0.005);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    tap.connect(tapFilter);
    tapFilter.connect(tapGain);
    tapGain.connect(bellBus);
    tap.start(now);
    tap.stop(now + 0.06);

    // Resonant bronze bell partials with gentle beating shimmer and long decay
    const partials: { freq: number; peak: number; decaySec: number }[] = [
      { freq: 293.66, peak: 0.11, decaySec: 4.8 },
      { freq: 295.15, peak: 0.045, decaySec: 4.4 },
      { freq: 587.33, peak: 0.052, decaySec: 3.4 },
      { freq: 880.0, peak: 0.026, decaySec: 2.5 },
      { freq: 1412.0, peak: 0.012, decaySec: 1.4 },
    ];

    partials.forEach(({ freq, peak, decaySec }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

      osc.connect(gain);
      gain.connect(bellBus);
      osc.start(now);
      osc.stop(now + decaySec + 0.05);
    });

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        try {
          bellBus.disconnect();
          convolver.disconnect();
          wetGain.disconnect();
        } catch {
          // ignore
        }
      }, 5100);
    }
  }
}

export const soundscapeEngine = new TeaSoundscapeEngine();


