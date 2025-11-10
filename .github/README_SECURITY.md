# GitHub Ruleset セキュリティ設定

このリポジトリではGitHub Rulesetを導入し、セキュリティと品質を確保しています。

## 設定されているRuleset

### 1. Branch Protection Ruleset (`branch-protection-ruleset.yml`)
**対象**: mainブランチ

| ルール | 目的 | 設定値 |
|--------|------|----------|
| Pull Requestレビュー | コード品質確保 | 2人以上の承認必須 |
| コードオーナーレビュー | 専門性確保 | 必須 |
| ステータスチェック | CI/CDパス確認 | Build and Test, Security Checks必須 |
| 会話解決 | 未解決コメント回避 | 最新状態でのマージ必須 |
| コミット署名 | 改ざん防止 | 必須 |

### 2. Pull Request Ruleset (`pr-ruleset.yml`)
**対象**: mainブランチへのPR

| ルール | 目的 | 設定値 |
|--------|------|----------|
| PR説明文 | 変更内容の明確化 | 10文字以上必須 |
| PRサイズ | 大規模変更の制御 | 50ファイル以内 |
| 担当者指定 | 責任の明確化 | 必須 |
| ラベル付け | 分類と優先度管理 | 必須、許可リスト限定 |
| コンフリクトチェック | マージ失敗回避 | ブロック |

### 3. Tag Protection Ruleset (`tag-ruleset.yml`)
**対象**: バージョンタグ (v*)

| ルール | 目的 | 設定値 |
|--------|------|----------|
| コミット署名 | 公開版の信頼性 | 必須 |
| 承認 | リリース品質確認 | 1人以上の承認必須 |
| Force Push防止 | 不正な改変防止 | ブロック |

## セキュリティ効果

### 高度な保護
- **2要素認証必須**: 管理者権限を保護
- **プルリクエストレビュー**: 悪意のあるコード混入防止
- **自動化チェック**: 脆弱性と品質問題の自動検知
- **署名検証**: コードの完全性保証

### 運用効果
- **品質維持**: コードレビューによる品質確保
- **変更追跡**: 全ての変更がレビュー経由
- **責任明確化**: 担当者とレビュワーの指定
- **リリース管理**: タグ保護による公式版の信頼性

## 緊急時対応

### Hotfix対応
```bash
# 緊急時は一時的にRulesetを緩和
gh api repos/yuri67-xk/vsc-instant-req/rulesets \
  --method PATCH \
  --field id=12345 \
  --field bypass_mode=enabled \
  --field bypass_actor=admin
```

### 不審なアクションの検知
- GitHubのAudit Logで定期的な確認
- 不審なプルリクエストやマージの即時対応
- セキュリティチームへの速報

## 定期メンテナンス

### 月次確認項目
- Ruleset設定の妥当性レビュー
- 許可リストの更新
- セキュリティポリシーの見直し
- レビュワー権限の確認

### 四半期レビュー
- セキュリティ脅威の評価
- Ruleset効果の測定
- 改善点の特定と実装

## 設定方法

### CLIによる適用
```bash
# ブランチ保護Ruleset
gh api repos/yuri67-xk/vsc-instant-req/rulesets \
  --method POST \
  --field @branch-protection-ruleset.yml

# PRルールセット
gh api repos/yuri67-xk/vsc-instant-req/rulesets \
  --method POST \
  --field @pr-ruleset.yml

# タグ保護Ruleset
gh api repos/yuri67-xk/vsc-instant-req/rulesets \
  --method POST \
  --field @tag-ruleset.yml
```

### Webによる設定
```
Settings → Branches → Branch protection rules
→ Add branch protection rule
```

## 注意事項

- **管理者権限でもRulesetをバイパス不可**（緊急時を除く）
- **コミット署名の設定が必須**（GPGキーの設定が必要）
- **PRテンプレートの準備を推奨**
- **定期的な監査と更新が必要**

これらの設定により、コード改変のリスクを最小限に抑えつつ、開発プロセスの効率を維持します。
