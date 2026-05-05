# 🎺 AR LT100週連続登壇セレブレーション

> 寺田康佑(Cor.Inc CEO)の100週連続LT登壇達成を記念した、ステッカー型WebAR体験

## 概要

ステッカーにスマートフォンをかざすと、お祝い演出(100週ロゴ降下・紙吹雪・ファンファーレ・祝福メッセージ)が展開されます。

## 技術スタック

- **MindAR 1.2.5** (画像トラッキング、MITライセンス)
- **A-Frame 1.7.0** (WebVR/AR フレームワーク、MITライセンス)
- **canvas-confetti** (パーティクル演出、ISCライセンス)
- **Vite** (ビルドツール)
- **TypeScript**
- **Cloudflare Pages** (ホスティング、HTTPS自動・帯域無制限)

## 使い方(エンドユーザー向け)

1. iOS Safari 18+ または Android Chrome 120+ で本サイトを開く
2. カメラアクセスを許可する
3. ステッカーにカメラを向ける
4. お祝い演出をお楽しみください 🎉

## 開発・ビルド

```bash
# 依存関係インストール
npm install

# 開発サーバー起動(http://localhost:5173)
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# Cloudflare Pages にデプロイ
npm run deploy
```

**注意**: WebARはHTTPS必須です。ローカル開発時はngrok等を使用してください。

```bash
ngrok http 5173
```

## 素材ライセンス

- ファンファーレ: Pixabayからのフリー素材(`benkirb-fanfare-1-276819.mp3`)
- 100週ロゴSVG: Cor.Inc オリジナル

## 著者

寺田康佑 / Cor.Inc

- Engineer Cafe Community Manager
- Cor.Inc CEO

## ライセンス

ISC
