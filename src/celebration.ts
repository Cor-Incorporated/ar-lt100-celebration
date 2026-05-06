/**
 * 100週連続LT登壇セレブレーション演出
 *
 * MindARでターゲット検出時に、画像降下/紙吹雪/ファンファーレ/メッセージ/共有ボタンを
 * 段階的に発火する。各エフェクトを try/catch で隔離して、1つ失敗しても他は動く。
 */
import confetti from 'canvas-confetti';

class CelebrationController {
  private fanfare: HTMLAudioElement;
  private celebrationImage: HTMLElement | null;
  private messageOverlay: HTMLElement | null;
  private shareButton: HTMLElement | null;
  private statusElement: HTMLElement | null;
  private infoElement: HTMLElement | null;
  private hasPlayedThisSession = false;

  constructor() {
    console.log('[Celebration] Constructor running...');

    this.fanfare = new Audio('/assets/sounds/fanfare.mp3');
    this.fanfare.volume = 0.7;
    this.fanfare.preload = 'auto';

    this.celebrationImage = document.querySelector<HTMLElement>('#celebration-image');
    this.messageOverlay = document.querySelector<HTMLElement>('#celebration-message');
    this.shareButton = document.querySelector<HTMLElement>('#share-button');
    this.statusElement = document.querySelector<HTMLElement>('#status');
    this.infoElement = document.querySelector<HTMLElement>('#info');

    console.log('[Celebration] DOM refs:', {
      image: !!this.celebrationImage,
      message: !!this.messageOverlay,
      share: !!this.shareButton,
      status: !!this.statusElement,
      info: !!this.infoElement,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Celebration] a-scene element not found');
      return;
    }

    scene.addEventListener('loaded', () => {
      console.log('[Celebration] a-scene loaded');
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
      console.log('[Celebration] Already played, skipping');
      return;
    }
    this.hasPlayedThisSession = true;

    console.log('[Celebration] 🎉 Starting LT100 celebration!');

    // 各エフェクトを独立した try/catch で実行(1つ失敗しても他は動く)
    try {
      this.playFanfare();
    } catch (e) {
      console.error('[Celebration] playFanfare failed:', e);
    }

    try {
      this.showCelebrationImage();
    } catch (e) {
      console.error('[Celebration] showCelebrationImage failed:', e);
    }

    try {
      this.fireConfetti();
    } catch (e) {
      console.error('[Celebration] fireConfetti failed:', e);
    }

    setTimeout(() => {
      try {
        this.showMessage();
      } catch (e) {
        console.error('[Celebration] showMessage failed:', e);
      }
    }, 3000);

    setTimeout(() => {
      try {
        this.showShareButton();
      } catch (e) {
        console.error('[Celebration] showShareButton failed:', e);
      }
    }, 6000);
  }

  private playFanfare(): void {
    this.fanfare.currentTime = 0;
    this.fanfare.play().catch((err) => {
      console.warn('[Celebration] Audio playback blocked:', err);
    });
    console.log('[Celebration] fanfare started');
  }

  /** HTML overlay <img> に show class を付ける(CSS animation で降下) */
  private showCelebrationImage(): void {
    if (!this.celebrationImage) {
      console.warn('[Celebration] image element not found in DOM');
      return;
    }
    this.celebrationImage.classList.add('show');
    console.log('[Celebration] image .show class added');
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
    console.log('[Celebration] confetti fired');
  }

  private showMessage(): void {
    if (!this.messageOverlay) return;
    this.messageOverlay.classList.add('show');
    console.log('[Celebration] message shown');
  }

  private showShareButton(): void {
    if (!this.shareButton) return;
    this.shareButton.classList.add('show');
    console.log('[Celebration] share button shown');
  }

  private shareOnTwitter(): void {
    const text = encodeURIComponent(
      'Cor.Inc. CEO 寺田さん (@CorInc) の100週連続LT登壇を、ARで体験中! 🎺🎉 #LT100週 #CorInc #WebAR'
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
  console.log('[Celebration] DOMContentLoaded - initializing controller');
  const controller = new CelebrationController();

  // ?test=1 でセレブレーション演出を強制発火 (ステッカー無しで動作確認用)
  const params = new URLSearchParams(window.location.search);
  if (params.get('test') === '1') {
    console.log('[Celebration] TEST MODE: triggering start() in 2 seconds');
    setTimeout(() => {
      console.log('[Celebration] TEST MODE: triggering now');
      controller.start();
    }, 2000);
  }

  // window グローバルにも公開 (devtools console から手動発火可能)
  (window as any).__celebration = controller;
});
