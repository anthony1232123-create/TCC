# Vercelでプロジェクト名を変更する方法

## 方法1: Vercelダッシュボードで変更

1. Vercelのダッシュボードにアクセス
2. プロジェクト「tcc-5v8d」を開く
3. 「Settings」タブをクリック
4. 「General」セクションを開く
5. 「Project Name」の横にある「Edit」をクリック
6. 新しい名前を入力（例: `tcc-job-posting` や `tcc-hiring-sheet`）
7. 「Save」をクリック

## 方法2: 新しいプロジェクト名でインポート

既存のプロジェクトを削除して、新しい名前でインポート：

1. Vercelダッシュボードで「tcc-5v8d」プロジェクトを開く
2. 「Settings」→「General」→ 一番下の「Delete Project」で削除
3. 再度「Add New...」→「Project」をクリック
4. 「TCC」リポジトリを選択
5. 「Import」をクリック
6. **Project Name**を新しい名前に変更（例: `tcc-job-posting-generator`）
7. 環境変数を設定
8. 「Deploy」をクリック

## 推奨プロジェクト名

- `tcc-job-posting-generator`
- `tcc-hiring-sheet-app`
- `tcc-job-draft-generator`
- `tcc-versus-job-posting`

## 注意事項

- プロジェクト名はURLに反映されます（例: `https://your-project-name.vercel.app`）
- プロジェクト名は後から変更可能です
- 既存のプロジェクトを削除する場合は、URLも変更されます

