# Vercelでエラーをデバッグする方法

## 問題: "Unexpected end of JSON input" エラー

ローカルでは動作するが、Vercelでは動作しない場合の原因と対処法：

## 1. 環境変数の確認

**Vercelのダッシュボードで確認：**
1. プロジェクトの「Settings」→「Environment Variables」を開く
2. `OPENAI_API_KEY`が設定されているか確認
3. すべての環境（Production, Preview, Development）に設定されているか確認

## 2. Vercelのログを確認

**方法1: Functions タブ**
1. Vercelのダッシュボードでプロジェクトを開く
2. 「Functions」タブをクリック
3. `/api/generate`をクリック
4. 最新の実行ログを確認
5. エラーメッセージを確認

**方法2: Deployments タブ**
1. 「Deployments」タブをクリック
2. 最新のデプロイを開く
3. 「Functions」セクションを確認
4. `/api/generate`のログを確認

## 3. ブラウザの開発者ツールで確認

1. ブラウザでF12を押して開発者ツールを開く
2. 「Network」タブを開く
3. Excelファイルをアップロード
4. `/api/generate`のリクエストをクリック
5. 「Response」タブでレスポンスの内容を確認
6. 「Preview」タブでJSONが正しく返されているか確認

## 4. よくある原因

### 原因1: 環境変数が設定されていない
- **症状**: APIキーエラーがログに表示される
- **対処**: Vercelの環境変数を設定

### 原因2: タイムアウト
- **症状**: リクエストが途中で止まる
- **対処**: Vercelの関数タイムアウト設定を確認（デフォルト10秒、Proプランで60秒）

### 原因3: ファイルサイズ制限
- **症状**: 大きなExcelファイルでエラー
- **対処**: ファイルサイズを小さくする

### 原因4: レート制限
- **症状**: OpenAI APIのレート制限エラー
- **対処**: しばらく待つか、OpenAIアカウントに支払い方法を追加

## 5. デバッグ用のコード追加

エラーメッセージをより詳細に表示するために、クライアント側のエラーハンドリングを改善：

```typescript
// app/page.tsx の catch ブロックで
catch (err: any) {
  console.error('詳細なエラー情報:', {
    message: err.message,
    stack: err.stack,
    response: err.response,
  });
  setError(err.message || 'エラーが発生しました');
}
```

## 6. 次のステップ

1. Vercelのログを確認して、具体的なエラーメッセージを特定
2. エラーメッセージを共有してもらえれば、より具体的な対処法を提案できます

