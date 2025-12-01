export class SoundManager {
    audioContext: AudioContext;
    backgroundMusic: HTMLAudioElement | null = null;
    currentMusicType: 'menu' | 'gameplay' | null = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    /**
     * Play background music based on the type
     * @param type - 'menu' or 'gameplay'
     */
    playBackgroundMusic(type: 'menu' | 'gameplay') {
        // Don't restart if already playing the same music
        if (this.currentMusicType === type && this.backgroundMusic && !this.backgroundMusic.paused) {
            return;
        }

        // Stop current music if any
        this.stopBackgroundMusic();

        // Determine which file to load
        // Use relative path that works in both dev and production
        const musicFile = type === 'menu' ? './menu.wav' : './XORG.wav';

        try {
            // Create new audio element
            this.backgroundMusic = new Audio(musicFile);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.8; // Increased volume

            // Fade in the music
            this.backgroundMusic.volume = 0;
            this.backgroundMusic.play().catch(err => {
                console.warn('Failed to play background music (non-critical):', err);
                // Don't block game execution if music fails to load
            });

            // Gradual fade in
            this.fadeIn(this.backgroundMusic, 0.5, 1000);

            this.currentMusicType = type;
        } catch (err) {
            console.warn('Failed to load background music (non-critical):', err);
            // Continue without music if it fails
        }
    }

    /**
     * Stop the background music with fade out
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.fadeOut(this.backgroundMusic, 500, () => {
                if (this.backgroundMusic) {
                    this.backgroundMusic.pause();
                    this.backgroundMusic.currentTime = 0;
                    this.backgroundMusic = null;
                }
            });
            this.currentMusicType = null;
        }
    }

    /**
     * Fade in audio
     */
    private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number) {
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeIncrement = targetVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (currentStep >= steps || !audio) {
                clearInterval(fadeInterval);
                if (audio) audio.volume = targetVolume;
                return;
            }
            audio.volume = Math.min(targetVolume, audio.volume + volumeIncrement);
            currentStep++;
        }, stepDuration);
    }

    /**
     * Fade out audio
     */
    private fadeOut(audio: HTMLAudioElement, duration: number, callback?: () => void) {
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeDecrement = audio.volume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (currentStep >= steps || !audio) {
                clearInterval(fadeInterval);
                if (callback) callback();
                return;
            }
            audio.volume = Math.max(0, audio.volume - volumeDecrement);
            currentStep++;
        }, stepDuration);
    }

    playShoot() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playHit() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    playWin() {
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.connect(gain);
                gain.connect(this.audioContext.destination);

                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.4);
            }, i * 150);
        });
    }

    playOverheat() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.05);
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0, this.audioContext.currentTime + 0.15);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }
}
