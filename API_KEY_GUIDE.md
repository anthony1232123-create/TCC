# OpenAI APIキーの確認方法

## 方法1: ターミナルで確認

プロジェクトフォルダで以下のコマンドを実行：

```bash
cd /Users/michaelpruneda/job-posting-generator
cat .env.local
```

## 方法2: テキストエディタで確認

1. Finderで `/Users/michaelpruneda/job-posting-generator` フォルダを開く
2. `.env.local` ファイルを開く（テキストエディタで）
3. `OPENAI_API_KEY=` の後に続く文字列がAPIキーです

## 方法3: OpenAI Platformで確認

もしAPIキーを忘れてしまった場合：

1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. ログイン
3. 「API keys」セクションで確認
4. 新しいAPIキーを作成することも可能

## Vercelで設定する際の注意

Vercelの環境変数に設定する際は：
- Key: `OPENAI_API_KEY`
- Value: `sk-proj-...` で始まる文字列全体をコピー

## セキュリティ注意事項

⚠️ **重要**: 
- APIキーは絶対に他人に共有しないでください
- GitHubにコミットしないでください（`.gitignore`に含まれています）
- 漏洩した場合は、すぐにOpenAI Platformで無効化してください

