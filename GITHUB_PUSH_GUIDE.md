# GitHubにプッシュする手順（認証付き）

## 認証が必要です

GitHubにプッシュするには、認証が必要です。以下の2つの方法があります。

## 方法1: Personal Access Tokenを使用（推奨）

### ステップ1: Personal Access Tokenを作成

1. GitHubにログイン
2. 右上のプロフィール画像をクリック → 「Settings」
3. 左メニューの一番下「Developer settings」
4. 「Personal access tokens」→「Tokens (classic)」
5. 「Generate new token」→「Generate new token (classic)」
6. Note（メモ）: 「TCC Project」など適当な名前を入力
7. Expiration（有効期限）: 適切な期間を選択（例: 90 days）
8. スコープ（権限）: 以下のチェックを入れる
   - ✅ `repo` (全てのリポジトリへのアクセス)
9. 「Generate token」をクリック
10. **重要**: 表示されたトークンをコピーしてください（後で見れません！）

### ステップ2: トークンを使ってプッシュ

以下のコマンドを実行してください（`YOUR_TOKEN`を実際のトークンに置き換えてください）：

```bash
cd /Users/michaelpruneda/job-posting-generator
git push -u origin main
```

ユーザー名を聞かれたら: `anthony1232123-create`
パスワードを聞かれたら: **Personal Access Tokenを貼り付け**

## 方法2: GitHub CLIを使用

```bash
# GitHub CLIをインストール（まだの場合）
brew install gh

# 認証
gh auth login

# プッシュ
git push -u origin main
```

## 方法3: SSH鍵を使用（上級者向け）

SSH鍵を設定している場合は、リモートURLをSSH形式に変更：

```bash
git remote set-url origin git@github.com:anthony1232123-create/TCC.git
git push -u origin main
```

## プッシュが成功したら

GitHubのリポジトリページ（https://github.com/anthony1232123-create/TCC）を確認すると、ファイルが表示されているはずです！

## 次のステップ: Vercelでデプロイ

プッシュが成功したら、Vercelでデプロイできます：

1. https://vercel.com にアクセス
2. GitHubアカウントでログイン
3. 「Add New...」→「Project」
4. 「TCC」リポジトリを選択
5. 「Import」
6. 環境変数 `OPENAI_API_KEY` を設定
7. 「Deploy」をクリック

