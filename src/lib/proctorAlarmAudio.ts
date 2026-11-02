// src/lib/proctorAlarmAudio.ts

type AlarmListener = (active: boolean, muted: boolean) => void;

class ProctorAlarmSystem {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private listeners: Set<AlarmListener> = new Set();

  public subscribe(fn: AlarmListener): () => void {
    this.listeners.add(fn);
    fn(this.isActive, this.isMuted);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isActive, this.isMuted));
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      isMuted: this.isMuted
    };
  }

  public triggerAlarm(reason?: string) {
    this.isActive = true;
    this.isMuted = false;
    this.startAudioSiren();
    this.notify();
    console.warn(`[PROCTOR ALARM ACTIVATED]: ${reason || 'Aggressive Activity / SOS Detected'}`);
  }

  public silenceAlarm() {
    this.isMuted = true;
    this.stopAudioSiren();
    this.notify();
  }

  public dismissAlarm() {
    this.isActive = false;
    this.isMuted = false;
    this.stopAudioSiren();
    this.notify();
  }

  private startAudioSiren() {
    if (typeof window === 'undefined' || this.isMuted) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stopAudioSiren();

      const now = this.audioCtx.currentTime;
      this.osc1 = this.audioCtx.createOscillator();
      this.osc2 = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      // Dual tone: European / Campus security high-low warble siren
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sine';

      this.osc1.frequency.setValueAtTime(880, now);
      this.osc2.frequency.setValueAtTime(960, now);

      this.gainNode.gain.setValueAtTime(0.25, now);

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.osc1.start(now);
      this.osc2.start(now);

      // Modulate frequency between 960Hz and 770Hz every 400ms for high-urgency siren
      let toggle = false;
      this.intervalId = setInterval(() => {
        if (!this.audioCtx || !this.osc1 || !this.osc2) return;
        const t = this.audioCtx.currentTime;
        toggle = !toggle;
        const freq1 = toggle ? 960 : 770;
        const freq2 = toggle ? 1174 : 880;
        this.osc1.frequency.setTargetAtTime(freq1, t, 0.05);
        this.osc2.frequency.setTargetAtTime(freq2, t, 0.05);
      }, 350);
    } catch (e) {
      console.warn('[Proctor Alarm Audio]: Audio playback prevented by policy or hardware.', e);
    }
  }

  private stopAudioSiren() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.gainNode && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
      } catch {
        /* ignore */
      }
    }

    setTimeout(() => {
      if (this.osc1) {
        try {
          this.osc1.stop();
          this.osc1.disconnect();
        } catch {
          /* ignore */
        }
        this.osc1 = null;
      }
      if (this.osc2) {
        try {
          this.osc2.stop();
          this.osc2.disconnect();
        } catch {
          /* ignore */
        }
        this.osc2 = null;
      }
      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
        } catch {
          /* ignore */
        }
        this.gainNode = null;
      }
    }, 120);
  }
}

export const globalProctorAlarm = new ProctorAlarmSystem();
