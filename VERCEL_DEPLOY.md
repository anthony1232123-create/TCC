# Vercelでデプロイする手順

## ✅ GitHubへのプッシュ完了！

コードは既にGitHubにプッシュされています。
https://github.com/anthony1232123-create/TCC で確認できます。

## Vercelでデプロイする手順

### ステップ1: Vercelにアクセス

1. [https://vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」または「Log In」をクリック
3. **「Continue with GitHub」**をクリックしてGitHubアカウントでログイン

### ステップ2: プロジェクトをインポート

1. ダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションで「TCC」リポジトリを探す
3. 「TCC」の横の「Import」ボタンをクリック

### ステップ3: プロジェクト設定

1. **Project Name**: そのまま「TCC」でOK（変更可能）
2. **Framework Preset**: Next.js（自動検出されるはず）
3. **Root Directory**: `./`（そのまま）
4. **Build and Output Settings**: そのまま（デフォルトでOK）

### ステップ4: 環境変数を設定（重要！）

1. 「Environment Variables」セクションを開く
2. 「Add」ボタンをクリック
3. 以下を入力：
   - **Key**: `OPENAI_API_KEY`
   - **Value**: あなたのOpenAI APIキー（`sk-proj-...`で始まるもの）
   - **Environment**: すべての環境（Production, Preview, Development）にチェック
4. 「Add」をクリック

### ステップ5: デプロイ実行

1. 「Deploy」ボタンをクリック
2. 数分待つとデプロイが完了します
3. 完了すると、URLが表示されます（例: `https://tcc-xxxxx.vercel.app`）

### ステップ6: 動作確認

1. 表示されたURLをクリック
2. アプリケーションが表示されることを確認
3. Excelファイルをアップロードして動作確認

## デプロイ後のURL

デプロイが完了すると、以下のようなURLが発行されます：
- `https://tcc-xxxxx.vercel.app`

このURLをお客様に共有すれば、すぐに使ってもらえます！

## カスタムドメインの設定（オプション）

独自ドメインを使いたい場合：

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Domains」
3. ドメイン名を入力（例: `job-posting.tcc.co.jp`）
4. DNS設定を案内に従って設定

## トラブルシューティング

### デプロイが失敗する場合

- 環境変数 `OPENAI_API_KEY` が正しく設定されているか確認
- ビルドログを確認してエラーを確認

### PDFファイルが見つからないエラー

- `媒体ポリシーまとめ 202408.pdf` がプロジェクトルートにあることを確認
- または、Vercelの環境変数でPDFファイルのパスを設定

## 次のステップ

デプロイが完了したら：
1. ✅ URLをお客様に共有
2. ✅ 動作確認
3. ✅ 使い方を説明

