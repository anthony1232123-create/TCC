# GitHubへのプッシュ手順

## ステップ1: 初回コミット

以下のコマンドを実行してください：

```bash
cd /Users/michaelpruneda/job-posting-generator
git add .
git commit -m "Initial commit: TCC専用 ヒアリングシート to 求人原稿 v1.0"
```

## ステップ2: GitHubリポジトリに接続

GitHubで作成したリポジトリのURLを確認してください。
例: `https://github.com/your-username/your-repo-name.git`

以下のコマンドでリモートリポジトリを追加：

```bash
git remote add origin https://github.com/your-username/your-repo-name.git
```

## ステップ3: GitHubにプッシュ

```bash
git branch -M main
git push -u origin main
```

## ステップ4: Vercelでデプロイ

1. [https://vercel.com](https://vercel.com) にアクセス
2. 「New Project」をクリック
3. GitHubアカウントを連携（まだの場合）
4. 作成したリポジトリを選択
5. 「Import」をクリック
6. 環境変数を設定：
   - Key: `OPENAI_API_KEY`
   - Value: あなたのOpenAI APIキー
7. 「Deploy」をクリック

## トラブルシューティング

### 認証エラーが発生する場合

GitHubの認証方法を確認してください：
- Personal Access Tokenを使用する場合
- SSH鍵を使用する場合

### プッシュが拒否される場合

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

