# AR LT100週連続登壇セレブレーション 実装指示書

- **プロジェクト名**: ar-lt100-celebration
- **目的**: 100週連続LT登壇記念ステッカー専用のWebAR体験
- **デプロイ先**: Cloudflare Pages
- **作成日**: 2026-05-05
- **PdM**: 寺田康佑(Cor.Inc CEO)
- **バージョン**: 2.0(Cloudflare Pages版)

---

## 0. このドキュメントの読み方

このドキュメントは Claude Code 等のAIアシスタントが最初から最後まで自律的に実装できるように書かれています。手順は順番通り実行してください。不明点があれば実装着手前にPdMに確認してください。

ベースとなる既存リポジトリ(`~/Developer/ar-avatar-chat`)は参考用のみ。新規ディレクトリで一から構築します。Vercel関連、Express server、Gemini API連携、VRMアバター関連は今回不要なので、必要な部分だけ選択的にコピーします。

---

## 1. プロジェクトコンセプト

### 体験フロー(約10秒)

```
0-1秒  : ステッカー認識成功(MindARによる画像トラッキング)
1-3秒  : 「100週連続登壇」SVGが空からドンと降下(イージング付き)
3-5秒  : 紙吹雪 + 花火パーティクル + ファンファーレSE
5-8秒  : 祝福メッセージのHTMLオーバーレイ表示
8-10秒 : SNS共有ボタン出現
```

### 重要な設計判断

- **VRMアバター不使用**: ステッカーのイラスト本体が主役。クラウディアアバターは別キャラなので採用しない
- **バックエンド不使用**: チャット・データ保存・分析なし。純粋な静的サイト
- **新規モーション制作なし**: SVG/MP3/HTML+CSSのみで完結
- **シンプル演出**: 派手すぎず、ステッカーを引き立てる構成
- **Cloudflare Pages**: 帯域無制限のため、ステッカー配布によるバズに耐える

---

## 2. 参照情報

### 既存リポジトリ(参考用、コピー元)

`~/Developer/ar-avatar-chat`

このリポジトリから以下のディレクトリ/ファイルのみ選択的にコピーする(後述):
- `src/styles/` の一部(ベースCSS)
- 開発の知見(MindAR置換ポイント等)

それ以外(`server/`, `api/`, `dist/`, `node_modules/`, VRM関連アセット, ChatController, BottomSheet等)はコピーしない。

### ユーザー配置済み素材

`~/Desktop/`に以下が配置されている:

| ファイル名 | 用途 | サイズ |
|---|---|---|
| `100週連続登壇.svg` | お祝い演出のメインビジュアル | 約4.6MB |
| `benkirb-fanfare-1-276819.mp3` | ファンファーレSE | 約165KB |

### PdMから別途取得が必要な素材

- `profile-sticker.mind`: MindAR Image Targets Compilerで生成したマーカーファイル。ダウンロード済みなのでPdMに配置場所を確認すること

---

## 3. プロジェクト構造(完成形)

```
~/Developer/ar-lt100-celebration/
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   └── lt100-celebration.svg
│   │   ├── sounds/
│   │   │   └── fanfare.mp3
│   │   └── markers/
│   │       └── profile-sticker.mind
│   ├── index.html
│   ├── _headers              # Cloudflare Pages: HTTPセキュリティヘッダ
│   └── _redirects            # Cloudflare Pages: ルーティング(必要時のみ)
├── src/
│   ├── celebration.ts        # セレブレーション演出ロジック
│   ├── styles/
│   │   └── celebration.css
│   └── types/
│       └── canvas-confetti.d.ts  # 型定義(必要時)
├── package.json
├── tsconfig.json
├── vite.config.ts            # Viteを採用(軽量・高速)
├── wrangler.toml             # Cloudflareデプロイ設定
├── .gitignore
├── README.md
└── docs/
    └── AR_LT100_Implementation_Guide.md  # このドキュメント
```

### 選定理由

- **Vite採用**: ビルド高速、TS対応、設定不要、出力先がそのままCloudflare Pagesにデプロイ可能
- **純粋な静的サイト構造**: フレームワーク不要(React/Next/Astro等は今回オーバースペック)
- **TypeScriptは最小限**: `celebration.ts`のみ。HTMLは普通のHTML

---

## 4. 環境構築(Step 1: ディレクトリ作成と初期化)

### 4.1 新規ディレクトリ作成

```bash
cd ~/Developer
mkdir ar-lt100-celebration
cd ar-lt100-celebration
```

### 4.2 Git初期化

```bash
git init
echo "node_modules/
dist/
.DS_Store
.env
.env.local
*.log" > .gitignore
```

### 4.3 npm 初期化とパッケージインストール

```bash
npm init -y
# 依存パッケージ
npm install canvas-confetti
# 開発依存パッケージ
npm install --save-dev typescript vite @types/canvas-confetti
```

### 4.4 package.json 編集

```json
{
  "name": "ar-lt100-celebration",
  "version": "1.0.0",
  "description": "WebAR celebration for 100 weeks consecutive LT presentation milestone",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler pages deploy dist"
  },
  "keywords": ["ar", "webar", "mindar", "lt", "celebration", "cor-inc"],
  "author": "Terada Kosuke / Cor.Inc",
  "license": "ISC",
  "dependencies": {
    "canvas-confetti": "^1.9.3"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.6.4",
    "typescript": "^5.9.3",
    "vite": "^5.4.0"
  }
}
```

### 4.5 tsconfig.json 作成

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"]
}
```

### 4.6 vite.config.ts 作成

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'public/index.html'
    },
    assetsInlineLimit: 0  // SVGなどをinline化しない
  },
  server: {
    host: true,  // ngrok等で外部公開しやすくする
    port: 5173
  }
});
```

---

## 5. 素材配置(Step 2)

### 5.1 ディレクトリ作成

```bash
mkdir -p public/assets/images
mkdir -p public/assets/sounds
mkdir -p public/assets/markers
mkdir -p src/styles
mkdir -p docs
```

### 5.2 素材コピー

```bash
cp ~/Desktop/100週連続登壇.svg public/assets/images/lt100-celebration.svg
cp ~/Desktop/benkirb-fanfare-1-276819.mp3 public/assets/sounds/fanfare.mp3
```

### 5.3 マーカーファイル配置

`profile-sticker.mind`の場所をPdMに確認した上で:

```bash
cp <path-to-mind-file>/profile-sticker.mind public/assets/markers/profile-sticker.mind
```

### 5.4 (任意) SVG軽量化

現在のSVG(4.6MB)は中にPNGがbase64で埋め込まれており、初回ロードが重い。気になる場合のみ実施:

```bash
# ImageMagick使用例(brew install imagemagickでインストール可能)
convert public/assets/images/lt100-celebration.svg -resize 1500x1500 -quality 85 public/assets/images/lt100-celebration.png
```

PNG変換を選んだ場合は、後述のHTMLで`.svg`→`.png`に置き換える。判断はPdMに確認すること。

---

## 6. public/index.html 作成(Step 3)

(本ファイル参照: `public/index.html`)

### ポイント

- A-FrameとMindARをCDNから読む(npm経由ではなく、シンプルさ優先)
- TypeScriptは`/src/celebration.ts`に集約
- HTMLは1ファイルで完結、ルーティング不要

---

## 7. src/celebration.ts 作成(Step 4)

(本ファイル参照: `src/celebration.ts`)

---

## 8. src/styles/celebration.css 作成(Step 5)

(本ファイル参照: `src/styles/celebration.css`)

---

## 9. Cloudflare Pages 設定ファイル(Step 6)

### 9.1 public/_headers 作成

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self), microphone=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### 9.2 wrangler.toml 作成

```toml
name = "ar-lt100-celebration"
compatibility_date = "2026-05-05"
pages_build_output_dir = "dist"
```

### 9.3 Wrangler CLI インストール(初回のみ)

```bash
npm install -g wrangler
wrangler login
```

`wrangler login`でブラウザが開き、Cloudflareアカウントでの認証を求められる。寺田のCloudflareアカウントが必要。

---

## 10. README.md 作成(Step 7)

(本ファイル参照: `README.md`)

---

## 11. ローカルテスト手順(Step 8)

### 11.1 ビルド確認

```bash
npm run build
```

エラーが出ないことを確認。`dist/`ディレクトリが生成される。

### 11.2 ローカル起動

```bash
npm run dev
```

`http://localhost:5173`にアクセス。

### 11.3 HTTPS環境でモバイル確認

```bash
# 別ターミナルでngrok起動
ngrok http 5173
```

表示された`https://xxxxx.ngrok.io`をスマホで開いて確認。

### 11.4 動作確認チェックリスト

- [ ] ページが表示される
- [ ] カメラアクセス許可ダイアログが出る
- [ ] カメラ映像が表示される
- [ ] ステッカーにかざすと認識される
- [ ] 「100週」SVGがフェードイン降下する
- [ ] 紙吹雪・花火が表示される
- [ ] ファンファーレが鳴る(モバイルではタップ後)
- [ ] 5秒後に祝福メッセージが表示される
- [ ] 10秒後にSNS共有ボタンが表示される
- [ ] SNS共有ボタンでTwitter投稿画面が開く

---

## 12. Cloudflare Pages デプロイ(Step 9)

### 12.1 初回デプロイ

```bash
npm run build
wrangler pages deploy dist --project-name=ar-lt100-celebration
```

初回はプロジェクトを新規作成するか聞かれる。Yesを選択。プロダクションブランチ名は`main`を指定。

### 12.2 カスタムドメイン設定(任意)

Cloudflare Dashboardで以下の手順:
1. Pages > プロジェクト選択 > Custom domains
2. ドメイン追加(例: `lt100.cor-jp.com`)
3. DNS設定: CNAMEレコードを`<project>.pages.dev`に向ける

### 12.3 GitHub連携(継続デプロイ、任意)

```bash
# GitHub に新規リポジトリ作成して接続
gh repo create ar-lt100-celebration --public --source=. --push
```

その後、Cloudflare Pages Dashboardで:
1. Pages > プロジェクト > Settings > Builds & deployments
2. GitHub連携を有効化
3. ビルドコマンド: `npm run build`
4. ビルド出力ディレクトリ: `dist`

これで`main`ブランチへのpushで自動デプロイされる。

---

## 13. 完了基準

実装完了として認める条件:

- ✅ `~/Developer/ar-lt100-celebration/` ディレクトリが構築されている
- ✅ `npm run build` がエラーなく成功する
- ✅ ローカルでステッカー認識+演出再生が動作する
- ✅ Cloudflare Pages にデプロイされ、HTTPS環境でアクセス可能
- ✅ 実機(iPhone/Android)で動作確認済み
- ✅ READMEに使用方法・ライセンス・素材出所が記載されている

---

## 14. 実装前にPdMに確認すべき事項

### PdM回答済み(2026-05-05)

1. **profile-sticker.mindの配置場所**: `/Users/teradakousuke/Desktop/targets (1).mind`
2. **SVG軽量化**: PNG変換OK
3. **Cloudflareアカウント**: Cor.Inc(`company@cor-jp.com`)、`wrangler login`済み
4. **カスタムドメイン**: 不要(`pages.dev`サブドメインで運用)
5. **GitHub連携**: 自動デプロイ採用
6. **公開タイミング**: 明日
7. **ファンファーレ素材**: Pixabay

---

## 15. トラブルシューティング

### ステッカーが認識されない

- マーカーファイル(`.mind`)の配置確認: `public/assets/markers/profile-sticker.mind`
- HTTPS環境であることを確認(HTTPでは動作しない)
- 照明条件: 明るい環境でテスト
- カメラとステッカーの距離: 20cm〜1m程度

### ファンファーレが鳴らない

- iOS Safari: 初回はユーザー操作(タップ)が必要
- 音量設定確認
- `console.warn`で`Audio playback blocked`が出ていないか確認

### Cloudflare Pagesデプロイで失敗

- `wrangler login`でログイン状態確認
- `wrangler whoami`でアカウント確認
- ビルド出力ディレクトリが`dist`であることを確認

### TypeScript型エラー

- `tsconfig.json`の`include`に`src/**/*`が含まれているか確認
- `@types/canvas-confetti`がインストールされているか確認

---

## 16. 将来拡張のヒント(任意・Phase 2以降)

実装完了後、以下の拡張が考えられる:

- **本人VRMアバター追加**: 寺田のVRMモデルが用意できたら、`ar-avatar-chat`の`vrm-loader.js`を移植して登場させる
- **過去LTタイムライン**: 100週分のLT履歴をARで表示
- **コミュニティ寄せ書き**: Cloudflare D1 + Workersでメッセージ投稿機能(これでもVercelより安く運用可能)
- **多言語対応**: 英語版を追加してグローバル発信
- **ガチャ要素**: 認識のたびにランダムなお祝いメッセージを表示

---

**作成者**: Claude (Anthropic)
**最終更新**: 2026-05-05
**バージョン**: 2.0(Cloudflare Pages版)
