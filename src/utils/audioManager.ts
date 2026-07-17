class AudioManager {
  private muted: boolean = false;
  
  constructor() {
    const stored = localStorage.getItem('gaming_hub_muted');
    this.muted = stored === 'true';
  }
  
  public isMuted() {
    return this.muted;
  }
  
  public toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('gaming_hub_muted', String(this.muted));
    return this.muted;
  }

  // Synthesize sound effects using Web Audio API
  public play(type: 'click' | 'win' | 'lose' | 'score' | 'levelUp' | 'jump' | 'laser' | 'hit') {
    if (this.muted) return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      switch (type) {
        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'score':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        case 'win':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
          osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
          osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.6);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        case 'lose':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.4);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'levelUp':
          osc.type = 'square';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'jump':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'laser':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'hit':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
      }
    } catch (e) {
      console.warn("Audio Context failure: ", e);
    }
  }
}

export const audioManager = new AudioManager();
