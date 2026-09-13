/**
 * iOS 18-grade Web Audio API Sound Effects Synthesizer
 * Provides authentic Apple audio feedback:
 * 1. Swoosh (Sent Message)
 * 2. Tri-Tone / Note (Incoming Message & Notifications)
 * 3. Tapback Reaction Pop
 * 4. Fireworks Crackle & Explosion
 * 5. Authentic iPhone "Marimba / Opening" Ringtone (Incoming Call)
 * 6. Outgoing Calling Ringback Tone (Caller screen)
 * 7. Uplifting Morning Sunrise Chime
 * 8. Serene Bedtime Starry Night Lullaby Chime
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private ringInterval: any = null;
  private ringTimeoutIds: any[] = [];
  private callingToneInterval: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Helper to synthesize an authentic Marimba / Wooden Bell note
   */
  private playMarimbaNote(freq: number, startTime: number, duration: number = 0.22) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Fundamental tone (Sine) + woody harmonic (Triangle)
      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 2.02, startTime); // overtone

      // Marimba fast percussive attack & wooden decay envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + duration);
      osc2.start(startTime);
      osc2.stop(startTime + duration);
    } catch (_) {}
  }

  /**
   * 1. iOS iMessage "Swoosh" Sent Sound
   */
  public playSent() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (_) {}
  }

  /**
   * 2. iOS Authentic Tri-Tone Notification Chime (G#5 -> B5 -> E6)
   */
  public playReceived() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: G#5
      this.playBellNote(830.61, now, 0.14);
      // Note 2: B5
      this.playBellNote(987.77, now + 0.09, 0.14);
      // Note 3: E6 (High resolved chime)
      this.playBellNote(1318.51, now + 0.18, 0.38);
    } catch (_) {}
  }

  /**
   * Alias for Notification chime
   */
  public playNotification() {
    this.playReceived();
  }

  private playBellNote(freq: number, startTime: number, duration: number) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (_) {}
  }

  /**
   * 3. iOS Tapback Reaction Pop
   */
  public playTapback() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  /**
   * 4. Fireworks Explosion Crackle Sound
   */
  public playFireworksCrackle() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch (_) {}
  }

  /**
   * 5. Authentic iPhone Caller Ringtone (Marimba / Opening Melody Loop)
   */
  public startRingtone() {
    if (this.ringInterval) return;

    const playIPhoneMelody = () => {
      try {
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // The iconic iPhone Marimba arpeggio notes
        const melody = [
          { f: 1046.5, t: 0.00 }, // C6
          { f: 880.00, t: 0.12 }, // A5
          { f: 698.46, t: 0.24 }, // F5
          { f: 880.00, t: 0.36 }, // A5
          { f: 1046.5, t: 0.48 }, // C6
          { f: 880.00, t: 0.60 }, // A5
          { f: 783.99, t: 0.72 }, // G5
          { f: 659.25, t: 0.84 }, // E5
          { f: 1046.5, t: 0.96 }, // C6
          { f: 880.00, t: 1.08 }, // A5
          { f: 698.46, t: 1.20 }, // F5
          { f: 880.00, t: 1.32 }, // A5
          { f: 1174.6, t: 1.44 }, // D6
          { f: 1046.5, t: 1.56 }, // C6
          { f: 880.00, t: 1.68 }, // A5
          { f: 698.46, t: 1.80 }, // F5
        ];

        melody.forEach(({ f, t }) => {
          this.playMarimbaNote(f, now + t, 0.18);
        });
      } catch (_) {}
    };

    playIPhoneMelody();
    this.ringInterval = setInterval(playIPhoneMelody, 2800);
  }

  public stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    this.ringTimeoutIds.forEach((id) => clearTimeout(id));
    this.ringTimeoutIds = [];
    this.stopCallingTone();
  }

  /**
   * 6. Outgoing Calling Tone (Played to the CALLER while waiting for recipient to answer)
   * Authentic dual-frequency ringback pulse (440Hz + 480Hz) with smooth fade envelope
   */
  public startCallingTone() {
    if (this.callingToneInterval) return;

    const playCallingPulse = () => {
      try {
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 1.6; // 1.6s ringback tone

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Classic international ringback frequencies
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        // Smooth fade-in and fade-out envelope to ensure pleasant acoustics
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
        gain.gain.setValueAtTime(0.12, now + duration - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
      } catch (_) {}
    };

    playCallingPulse();
    this.callingToneInterval = setInterval(playCallingPulse, 4000); // 1.6s ring + 2.4s pause = 4s cycle
  }

  public stopCallingTone() {
    if (this.callingToneInterval) {
      clearInterval(this.callingToneInterval);
      this.callingToneInterval = null;
    }
  }

  public stopAllTones() {
    this.stopRingtone();
    this.stopCallingTone();
  }

  /**
   * 7. Uplifting Morning Sunrise Chime (C5 -> E5 -> G5 -> B5 -> E6)
   */
  public playMorningChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0.00, d: 0.35 }, // C5
        { f: 659.25, t: 0.12, d: 0.35 }, // E5
        { f: 783.99, t: 0.24, d: 0.40 }, // G5
        { f: 987.77, t: 0.36, d: 0.45 }, // B5
        { f: 1318.51, t: 0.48, d: 0.95 }, // E6 golden resonant chime
      ];
      notes.forEach(({ f, t, d }) => {
        this.playBellNote(f, now + t, d);
      });
    } catch (_) {}
  }

  /**
   * 8. Serene Bedtime Starry Night Lullaby Chime (E6 -> C#6 -> B5 -> G#5 -> E5)
   */
  public playNightChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [
        { f: 1318.51, t: 0.00, d: 0.45 }, // E6
        { f: 1108.73, t: 0.18, d: 0.45 }, // C#6
        { f: 987.77, t: 0.36, d: 0.50 },  // B5
        { f: 830.61, t: 0.54, d: 0.55 },  // G#5
        { f: 659.25, t: 0.72, d: 1.20 },  // E5 warm deep peace
      ];
      notes.forEach(({ f, t, d }) => {
        this.playBellNote(f, now + t, d);
      });
    } catch (_) {}
  }
}

export const soundEngine = new SoundEngine();
