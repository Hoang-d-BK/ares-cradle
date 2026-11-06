/**
 * Ares Cradle - Web Audio Sound Synthesizer
 * Procedural tactile sound engine using native Web Audio API (Zero dependencies).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.humGain && this.ctx) {
      this.humGain.gain.setValueAtTime(muted ? 0 : 0.05, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Mechanical tactile switch click for buttons, toggles and sliders.
   */
  public playClick(frequency = 950) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  /**
   * Continuous sub-bass ambient hum for Mars base generator.
   */
  public startPowerHum() {
    if (this.humOsc || typeof window === 'undefined') return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note 55 Hz sub-bass

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.humGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.ctx.currentTime);

      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
    } catch (_) {}
  }

  public stopPowerHum() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch (_) {}
      this.humOsc = null;
      this.humGain = null;
    }
  }

  /**
   * Telemetry success chime (Major triad: D5 -> A5 -> D6).
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const startTime = this.ctx!.currentTime + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch (_) {}
  }

  /**
   * Emergency hazard warning siren (Warbling alert).
   */
  public playAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(700, now + 0.3);
      osc.frequency.linearRampToValueAtTime(880, now + 0.45);
      osc.frequency.linearRampToValueAtTime(700, now + 0.6);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (_) {}
  }

  /**
   * Failure drone tone for colony life support breach.
   */
  public playFailureTone() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 1.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch (_) {}
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
