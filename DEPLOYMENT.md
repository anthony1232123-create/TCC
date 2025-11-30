# デプロイメントガイド

## お客様に使ってもらう方法

### 🚀 方法1: Vercelにデプロイ（最も簡単・推奨）

VercelはNext.jsの開発元が提供するプラットフォームで、無料でデプロイできます。

#### 手順

1. **GitHubにリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/job-posting-generator.git
   git push -u origin main
   ```

2. **Vercelにアカウント作成**
   - [https://vercel.com](https://vercel.com) にアクセス
   - GitHubアカウントでサインアップ

3. **プロジェクトをインポート**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック

4. **環境変数を設定**
   - 「Environment Variables」セクションで以下を追加：
     - `OPENAI_API_KEY`: あなたのOpenAI APIキー
   - 「Add」をクリック

5. **デプロイ**
   - 「Deploy」をクリック
   - 数分でデプロイ完了
   - URLが発行されます（例: `https://your-app-name.vercel.app`）

6. **お客様にURLを共有**
   - 発行されたURLをお客様に共有
   - カスタムドメインも設定可能（例: `https://job-posting.tcc.co.jp`）

#### メリット
- ✅ 無料プランあり
- ✅ HTTPS自動対応
- ✅ 自動デプロイ（GitHubにプッシュするだけで更新）
- ✅ カスタムドメイン設定可能
- ✅ サーバー管理不要

---

### 🖥️ 方法2: 自社サーバーにデプロイ

#### 必要なもの
- Node.js 18以上がインストールされたサーバー
- ドメイン（オプション）

#### 手順

1. **サーバーにプロジェクトをアップロード**
   ```bash
   # SCPやFTPでファイルをアップロード
   scp -r . user@your-server.com:/path/to/app
   ```

2. **サーバーでセットアップ**
   ```bash
   ssh user@your-server.com
   cd /path/to/app
   npm install
   ```

3. **環境変数を設定**
   ```bash
   # .env.localファイルを作成
   echo "OPENAI_API_KEY=your_api_key_here" > .env.local
   ```

4. **ビルドと起動**
   ```bash
   npm run build
   npm start
   ```

5. **プロセス管理（PM2推奨）**
   ```bash
   npm install -g pm2
   pm2 start npm --name "job-posting-generator" -- start
   pm2 save
   pm2 startup
   ```

6. **Nginxでリバースプロキシ設定（オプション）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

### 🐳 方法3: Dockerでデプロイ

#### Dockerfileの作成

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### デプロイ手順

```bash
# ビルド
docker build -t job-posting-generator .

# 実行
docker run -p 3000:3000 -e OPENAI_API_KEY=your_api_key_here job-posting-generator
```

---

## セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] `.env.local`がGitにコミットされていない
- [ ] 本番環境で環境変数が正しく設定されている
- [ ] APIキーが漏洩していない
- [ ] HTTPSが有効になっている（Vercelは自動）
- [ ] 必要に応じてアクセス制限を設定

---

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 環境変数が読み込まれない場合

- Vercel: ダッシュボードで環境変数が正しく設定されているか確認
- 自社サーバー: `.env.local`ファイルがプロジェクトルートにあるか確認

### PDFファイルが見つからないエラー

- `媒体ポリシーまとめ 202408.pdf`が`public`フォルダまたはプロジェクトルートにあるか確認
- または、PDFファイルをサーバーにアップロード

---

## お客様への提供時の注意事項

1. **URLの共有**: デプロイされたURLをお客様に共有
2. **使い方の説明**: READMEの「使い方」セクションを参考に説明
3. **サポート**: 問題が発生した場合の連絡先を明確に
4. **APIキーの管理**: お客様が自分でAPIキーを設定する場合は、設定方法を説明

---

## 次のステップ

- [ ] デプロイ先を決定
- [ ] 環境変数を設定
- [ ] デプロイ実行
- [ ] 動作確認
- [ ] お客様にURLを共有

