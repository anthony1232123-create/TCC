# Vercelで手動デプロイをトリガーする方法

## 方法1: Vercelダッシュボードから

1. Vercelのダッシュボードにアクセス
2. プロジェクトを開く
3. 「Deployments」タブをクリック
4. 右上の「Redeploy」ボタンをクリック
5. 「Use existing Build Cache」のチェックを**外す**
6. 「Redeploy」をクリック

## 方法2: GitHubから空のコミットをプッシュ

ターミナルで以下を実行：

```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

## 方法3: Vercel CLIを使用（オプション）

```bash
vercel --prod
```

## 自動デプロイが有効になっているか確認

1. Vercelのプロジェクト設定を開く
2. 「Settings」→「Git」を確認
3. 「Production Branch」が`main`になっているか確認
4. 「Automatic deployments」が有効になっているか確認

## トラブルシューティング

- **自動デプロイが動かない場合**: GitHubのWebhook設定を確認
- **デプロイが失敗する場合**: ビルドログを確認してエラーを特定
- **環境変数が反映されない場合**: デプロイ後に環境変数を再設定

