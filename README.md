# TCC専用 ヒアリングシート to 求人原稿

TCC（ティー・シー・シー）専用の求人原稿自動生成アプリケーションです。
派遣会社のヒアリングシート（Excel）をアップロードすると、AIが内容を読み取り、求人サイトの掲載フォーマットに合わせて原稿を自動生成します。

## 技術スタック

- **Next.js** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **OpenAI API** - AIによる原稿生成
- **xlsx** - Excelファイル読み込み

## 機能

- 📤 Excelファイルのドラッグ＆ドロップアップロード
- 📊 Excelデータの自動読み込みと解析
- 🤖 AIによる求人原稿の自動生成
- 📋 生成された原稿のコピー機能

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`を参考に、`.env.local`ファイルを作成し、OpenAI APIキーを設定してください：

```bash
cp .env.local.example .env.local
```

`.env.local`ファイルを編集：

```
OPENAI_API_KEY=your_openai_api_key_here
```

OpenAI APIキーは [OpenAI Platform](https://platform.openai.com/api-keys) から取得できます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 使い方

1. ブラウザでアプリケーションを開く
2. Excelファイル（.xlsx または .xls）をドラッグ＆ドロップ、またはクリックして選択
3. AIがExcelデータを読み取り、求人原稿を自動生成
4. 生成された原稿を確認し、「コピー」ボタンでクリップボードにコピー

## プロジェクト構造

```
job-posting-generator/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # OpenAI API連携とExcel処理
│   ├── components/
│   │   ├── FileUpload.tsx    # ファイルアップロードコンポーネント
│   │   └── ResultDisplay.tsx # 結果表示コンポーネント
│   ├── layout.tsx
│   ├── page.tsx              # メインページ
│   └── globals.css
├── .env.local.example         # 環境変数のサンプル
└── package.json
```

## デプロイメント

### 方法1: Vercel（推奨）

VercelはNext.jsの開発元が提供するプラットフォームで、最も簡単にデプロイできます。

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubにリポジトリをプッシュ
3. Vercelでプロジェクトをインポート
4. 環境変数`OPENAI_API_KEY`を設定
5. デプロイ完了

**メリット:**
- 無料プランあり
- 自動デプロイ（GitHub連携）
- HTTPS対応
- カスタムドメイン設定可能

### 方法2: 自社サーバー

1. サーバーにNode.js（v18以上）をインストール
2. プロジェクトをクローン
3. `npm install`で依存関係をインストール
4. `.env.local`に`OPENAI_API_KEY`を設定
5. `npm run build`でビルド
6. `npm start`で起動

### 方法3: Docker

`Dockerfile`を作成してコンテナ化することも可能です。

## お客様への提供方法

### クラウドデプロイ（推奨）

1. **Vercelにデプロイ**
   - 無料でHTTPS対応のURLが発行されます
   - 例: `https://your-app-name.vercel.app`
   - このURLをお客様に共有

2. **カスタムドメイン設定**
   - Vercelで独自ドメインを設定可能
   - 例: `https://job-posting.tcc.co.jp`

### オンプレミス（自社サーバー）

1. 自社サーバーにデプロイ
2. 社内ネットワークまたはVPN経由でアクセス
3. セキュリティ設定を適切に実施

## セキュリティに関する注意事項

- **APIキーの管理**: `.env.local`は絶対にGitにコミットしないでください
- **環境変数**: 本番環境では必ず環境変数でAPIキーを管理してください
- **アクセス制限**: 必要に応じて認証機能を追加することを推奨します

## 注意事項

- OpenAI APIの使用には料金が発生します
- Excelファイルのサイズが大きい場合、処理に時間がかかる場合があります
- 生成される原稿の品質は、入力されるExcelデータの内容に依存します
- **ヒアリングシートのフォーマットが変わった場合は正常に動作しないことがあります**

## ライセンス

MIT
