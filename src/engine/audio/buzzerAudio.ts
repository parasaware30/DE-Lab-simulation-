/**
 * Web Audio API Electronic Buzzer Sound Generator
 * Generates an authentic lab-grade piezoceramic digital buzzer tone.
 */

class BuzzerSoundManager {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.15; // Safe default volume

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public start() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isPlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.osc = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();

      // Authentic buzzer: 920Hz pulse / square tone
      this.osc.type = 'square';
      this.osc.frequency.setValueAtTime(920, now);

      // Smooth attack to avoid audio click
      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.exponentialRampToValueAtTime(this.volume, now + 0.02);

      this.osc.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc.start(now);
      this.isPlaying = true;
    } catch {
      // AudioContext policy catch
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.osc || !this.gainNode) {
      this.isPlaying = false;
      return;
    }

    try {
      const now = this.ctx.currentTime;
      // Smooth decay
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      const oldOsc = this.osc;
      const oldGain = this.gainNode;
      setTimeout(() => {
        try {
          oldOsc.stop();
          oldOsc.disconnect();
          oldGain.disconnect();
        } catch {}
      }, 40);
    } catch {}

    this.osc = null;
    this.gainNode = null;
    this.isPlaying = false;
  }
}

export const buzzerSound = new BuzzerSoundManager();
