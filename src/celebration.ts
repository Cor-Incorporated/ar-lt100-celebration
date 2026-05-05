/**
 * 100週連続LT登壇セレブレーション演出
 *
 * MindARでターゲット検出時に、SVG降下/紙吹雪/ファンファーレ/メッセージ/共有ボタンを
 * 段階的に発火する。一度発火したらセッション中は再発火しない(hasPlayedThisSession)。
 */
import confetti from 'canvas-confetti';

class CelebrationController {
  private fanfare: HTMLAudioElement;
  private celebrationImage: Element | null;
  private messageOverlay: HTMLElement | null;
  private shareButton: HTMLElement | null;
  private statusElement: HTMLElement | null;
  private infoElement: HTMLElement | null;
  private hasPlayedThisSession = false;

  constructor() {
    this.fanfare = new Audio('/assets/sounds/fanfare.mp3');
    this.fanfare.volume = 0.7;
    this.fanfare.preload = 'auto';

    this.celebrationImage = document.querySelector('#celebration-image');
    this.messageOverlay = document.querySelector<HTMLElement>('#celebration-message');
    this.shareButton = document.querySelector<HTMLElement>('#share-button');
    this.statusElement = document.querySelector<HTMLElement>('#status');
    this.infoElement = document.querySelector<HTMLElement>('#info');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Celebration] a-scene element not found');
      return;
    }

    scene.addEventListener('loaded', () => {
      this.updateStatus('✨ 準備完了!');

      const marker = document.querySelector('#marker');
      if (!marker) {
        console.error('[Celebration] marker element not found');
        return;
      }

      marker.addEventListener('targetFound', () => {
        console.log('[MindAR] Target Found');
        this.updateStatus('✅ 認識成功!');
        this.hideInfo();
        this.start();
      });

      marker.addEventListener('targetLost', () => {
        console.log('[MindAR] Target Lost');
      });
    });

    if (this.shareButton) {
      this.shareButton.addEventListener('click', () => this.shareOnTwitter());
    }
  }

  start(): void {
    if (this.hasPlayedThisSession) {
      console.log('[Celebration] Already played this session, skipping');
      return;
    }
    this.hasPlayedThisSession = true;

    console.log('[Celebration] 🎉 Starting LT100 celebration!');

    this.playFanfare();
    this.showCelebrationImage();
    this.fireConfetti();

    setTimeout(() => this.showMessage(), 5000);
    setTimeout(() => this.showShareButton(), 10000);
  }

  private playFanfare(): void {
    this.fanfare.currentTime = 0;
    this.fanfare.play().catch((err) => {
      console.warn('[Celebration] Audio playback blocked:', err);
    });
  }

  private showCelebrationImage(): void {
    if (!this.celebrationImage) return;

    this.celebrationImage.setAttribute('visible', 'true');
    this.celebrationImage.setAttribute(
      'animation__position',
      'property: position; from: 0 2 0; to: 0 0.5 0; dur: 1500; easing: easeOutBounce'
    );
    this.celebrationImage.setAttribute(
      'animation__opacity',
      'property: opacity; from: 0; to: 1; dur: 1000; easing: easeOutQuad'
    );
  }

  private fireConfetti(): void {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FFA500']
    });

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  private showMessage(): void {
    if (!this.messageOverlay) return;
    this.messageOverlay.classList.add('show');
  }

  private showShareButton(): void {
    if (!this.shareButton) return;
    this.shareButton.classList.add('show');
  }

  private shareOnTwitter(): void {
    const text = encodeURIComponent(
      '@CorInc CEO 寺田さんの100週連続LT登壇を、ARで体験中! 🎺🎉 #LT100週 #CorInc #WebAR'
    );
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  private updateStatus(text: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = text;
    }
  }

  private hideInfo(): void {
    if (this.infoElement) {
      this.infoElement.classList.add('hidden');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CelebrationController();
});
