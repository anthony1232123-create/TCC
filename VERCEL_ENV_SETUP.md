# Vercelで環境変数を設定する方法

## 方法1: Vercelダッシュボードで直接設定（推奨）

### 手順

1. Vercelのプロジェクト設定画面を開く
2. 「Settings」タブをクリック
3. 「Environment Variables」セクションを開く
4. 「Add」ボタンをクリック
5. 以下を入力：
   - **Key**: `OPENAI_API_KEY`
   - **Value**: あなたのOpenAI APIキー（`sk-proj-...`で始まるもの）
   - **Environment**: すべてにチェック（Production, Preview, Development）
6. 「Add」をクリック

## 方法2: .env.localファイルをコピーして作成

Vercelで「Upload」機能がある場合：

1. `.env.local`ファイルの内容をコピー：
   ```
   OPENAI_API_KEY=あなたのAPIキーをここに貼り付け
   ```

2. Vercelの環境変数設定画面で、この内容を貼り付け

## Finderで.env.localファイルを見る方法

### 方法1: ターミナルから開く

```bash
cd /Users/michaelpruneda/job-posting-generator
open -R .env.local
```

これでFinderが開き、`.env.local`ファイルが選択された状態で表示されます。

### 方法2: Finderで隠しファイルを表示

1. Finderを開く
2. `Command + Shift + .`（ピリオド）を押す
3. 隠しファイルが表示されます
4. `/Users/michaelpruneda/job-posting-generator` フォルダに移動
5. `.env.local` ファイルが見えます

### 方法3: テキストエディタで直接開く

```bash
cd /Users/michaelpruneda/job-posting-generator
open -a TextEdit .env.local
```

または、VS Codeを使っている場合：

```bash
code .env.local
```

## 注意事項

⚠️ **セキュリティ**: 
- `.env.local`ファイルはGitHubにコミットされていません（`.gitignore`で除外）
- Vercelに設定する際は、環境変数として設定することを推奨します
- ファイルを直接アップロードする場合は、必ず削除してください

