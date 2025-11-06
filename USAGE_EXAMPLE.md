# 使用例

このドキュメントでは、Claude Code Prompt Generator VSCode Extensionの具体的な使用例を紹介します。

## 基本的なワークフロー

1. VSCodeのアクティビティバーから「Claude Prompt Generator」を開く
2. 機能要件を入力
3. エージェントを選択
4. プロンプト生成 → コピー → Claude Codeに貼り付け

---

## シナリオ1: ユーザー認証機能の追加

### 手順

1. **サイドパネルを開く**
   - アクティビティバーの「Claude Prompt Generator」アイコンをクリック

2. **機能要件を入力**
   ```
   要件1: ユーザー登録・ログイン機能の実装
   要件2: JWT認証の導入
   要件3: パスワードのハッシュ化（bcrypt使用）
   ```

3. **エージェントを選択**
   - 仕様設計書作成: `System Architect` を選択
   - 実装担当: `Backend Developer` を選択

4. **プロンプト作成をクリック**

### 生成されるプロンプト

```
1. 以下の要件に基づいて機能改修したい。
   - ユーザー登録・ログイン機能の実装
   - JWT認証の導入
   - パスワードのハッシュ化（bcrypt使用）

2. 上記の要件をPlanningすること。

3. ユーザーがPlanningを承認したら、@architectにdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）

4. ドキュメント保存後、その仕様設計書に基づいて、@backend-devに実装を行わせる。

5. 実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。
```

---

## シナリオ2: フロントエンドのUI改善

### 手順

1. **機能要件を入力**
   ```
   要件1: レスポンシブデザインの改善
   要件2: ダークモードの追加
   要件3: アニメーション効果の追加
   ```

2. **エージェントを選択**
   - 仕様設計書作成: `Documentation Specialist` を選択
   - 実装担当: `Frontend Developer` を選択

### 生成されるプロンプト

```
1. 以下の要件に基づいて機能改修したい。
   - レスポンシブデザインの改善
   - ダークモードの追加
   - アニメーション効果の追加

2. 上記の要件をPlanningすること。

3. ユーザーがPlanningを承認したら、@doc-specialistにdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）

4. ドキュメント保存後、その仕様設計書に基づいて、@frontend-devに実装を行わせる。

5. 実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。
```

---

## シナリオ3: カスタムエージェントの使用

### 手順

1. **機能要件を入力**
   ```
   要件1: WebSocket通信の実装
   要件2: リアルタイムチャット機能
   要件3: オンラインステータス表示
   ```

2. **カスタムエージェントを手動入力**
   - 仕様設計書作成: 手動入力フィールドに `realtime-architect` と入力（@なし）
   - 実装担当: `Fullstack Developer` を選択

### 生成されるプロンプト

```
1. 以下の要件に基づいて機能改修したい。
   - WebSocket通信の実装
   - リアルタイムチャット機能
   - オンラインステータス表示

2. 上記の要件をPlanningすること。

3. ユーザーがPlanningを承認したら、@realtime-architectにdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）

4. ドキュメント保存後、その仕様設計書に基づいて、@fullstack-devに実装を行わせる。

5. 実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。
```

---

## シナリオ4: VSCode設定でカスタムエージェントを追加

### 設定方法

1. VSCodeの設定を開く（Ctrl/Cmd+,）
2. 「Claude Code Prompt Generator」で検索
3. `settings.json`を編集：

```json
{
  "claudeCodePromptGenerator.agents.specWriters": [
    {
      "id": "@api-designer",
      "name": "API Designer"
    },
    {
      "id": "@database-architect",
      "name": "Database Architect"
    },
    {
      "id": "@security-specialist",
      "name": "Security Specialist"
    }
  ],
  "claudeCodePromptGenerator.agents.implementers": [
    {
      "id": "@devops-engineer",
      "name": "DevOps Engineer"
    },
    {
      "id": "@test-automation",
      "name": "Test Automation Engineer"
    },
    {
      "id": "@performance-optimizer",
      "name": "Performance Optimizer"
    }
  ]
}
```

### 使用例

設定後、サイドパネルのドロップダウンに新しいエージェントが表示されます：

```
仕様設計書作成エージェント:
✓ API Designer
✓ Database Architect
✓ Security Specialist

実装担当エージェント:
✓ DevOps Engineer
✓ Test Automation Engineer
✓ Performance Optimizer
```

---

## シナリオ5: 複数の要件を段階的に追加

### 手順

1. **最初の要件を入力**
   ```
   要件1: 検索機能の実装
   ```

2. **「+ 要件を追加」をクリックして追加**
   ```
   要件2: フィルタリング機能
   要件3: ソート機能
   要件4: ページネーション
   ```

3. **不要な要件を削除**
   - 各要件の横にある「×」ボタンをクリックして削除可能

4. **エージェントを選択して生成**

---

## ワークフローのベストプラクティス

### 1. 要件は具体的に書く

❌ 悪い例：
```
- 機能を追加する
- 改善する
```

✅ 良い例：
```
- ユーザー検索機能の追加（名前、メールでの検索）
- レスポンス速度を50%改善（キャッシング導入）
```

### 2. エージェントの役割を理解する

- **仕様設計書作成**: アーキテクチャ、設計方針を決定
- **実装担当**: 実際のコーディングを担当

適切なエージェントを選択することで、より質の高いプロンプトが生成されます。

### 3. カスタムエージェントの命名規則

```
推奨:
- @api-designer
- @database-architect
- @frontend-specialist

非推奨:
- @agent1
- @test
- @temp
```

### 4. 生成後の確認

プロンプトを生成したら、以下を確認：

1. ✅ すべての要件が含まれているか
2. ✅ エージェントIDが正しく挿入されているか
3. ✅ @プレフィックスが付いているか

---

## トラブルシューティング

### Q: エージェントが選択できない

A: VSCode設定でエージェントが正しく設定されているか確認してください。

```bash
# 設定を確認
Ctrl/Cmd+, → "Claude Code Prompt Generator"で検索
```

### Q: プロンプトが生成されない

A: 以下を確認：
- 最低1つの要件が入力されているか
- 両方のエージェントが選択または入力されているか

### Q: コピーが動作しない

A: VSCodeを再起動してみてください。それでも解決しない場合は、手動でプロンプトをコピーしてください。

---

## 次のステップ

1. 生成されたプロンプトをClaude Codeにコピー
2. Claude CodeのPlan Modeで実行
3. Planningを確認・承認
4. 自動的に仕様書作成 → 実装が進行
5. 実装完了後、テストを実施

これにより、構造化されたワークフローでClaude Codeを最大限活用できます！
