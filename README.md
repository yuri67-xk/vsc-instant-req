# Claude Code Prompt Generator

Claude CodeのPlan ModeとSubagents機能を最大限活用するプロンプトを自動生成するVSCode Extension

## 概要

このVSCode拡張機能は、Claude Codeの強力な**Plan Mode**と**Subagents**を活用したプロンプトを簡単に生成できるツールです。サイドパネルから直接アクセスでき、要件を入力し適切なエージェントを選択するだけで、構造化されたプロンプトを自動生成します。

## 主な機能

- **サイドパネル統合**: VSCodeのサイドバーから常時アクセス可能
- **動的な要件入力**: 複数の機能要件を追加・削除可能
- **エージェント選択**:
  - プリセットからの選択
  - カスタムエージェントの手動入力（@プレフィックス自動付与）
- **プロンプト自動生成**: 固定テンプレートに基づいて最適なプロンプトを生成
- **ワンクリックコピー**: 生成されたプロンプトをクリップボードに簡単コピー
- **カスタマイズ可能**: VSCode設定で独自のエージェントを追加可能

## インストール

### VSCode Marketplaceから（公開後）

1. VSCodeを開く
2. 拡張機能ビュー（Ctrl/Cmd+Shift+X）を開く
3. "Claude Code Prompt Generator"を検索
4. インストールをクリック

### 手動インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/claude-code-prompt-generator.git
cd claude-code-prompt-generator

# 依存関係をインストール
npm install

# VSIXファイルをビルド
npx vsce package

# インストール
code --install-extension claude-code-prompt-generator-1.0.0.vsix
```

## 使い方

### 基本的な使い方

1. **サイドパネルを開く**
   - VSCodeのアクティビティバー（左端）にある「Claude Prompt Generator」アイコンをクリック

2. **機能要件を入力**
   - テキストフィールドに要件を入力
   - 「+ 要件を追加」ボタンで複数の要件を追加可能

3. **エージェントを選択**
   - **仕様設計書作成エージェント**: ドロップダウンから選択、または手動入力
   - **実装担当エージェント**: ドロップダウンから選択、または手動入力
   - 手動入力時は`@`なしで入力（自動的に付与されます）

4. **プロンプトを生成**
   - 「プロンプト作成」ボタンをクリック

5. **コピー**
   - 「COPY」ボタンでクリップボードにコピー
   - Claude Codeに貼り付けて実行

### エージェントの選択方法

#### プリセットから選択
```
ドロップダウンメニューから選択:
- General Purpose Agent
- Documentation Specialist
- System Architect
- Frontend Developer
- Backend Developer
- Fullstack Developer
```

#### カスタムエージェントを手動入力
```
手動入力フィールドに以下のように入力:
入力: custom-agent
↓
自動的に変換: @custom-agent
```

## カスタマイズ

### エージェントの追加

VSCodeの設定（`settings.json`）で独自のエージェントを追加できます：

1. 設定を開く（Ctrl/Cmd+,）
2. 「Claude Code Prompt Generator」を検索
3. `settings.json`で編集：

```json
{
  "claudeCodePromptGenerator.agents.specWriters": [
    {
      "id": "@custom-architect",
      "name": "Custom Architect"
    },
    {
      "id": "@api-designer",
      "name": "API Designer"
    }
  ],
  "claudeCodePromptGenerator.agents.implementers": [
    {
      "id": "@custom-dev",
      "name": "Custom Developer"
    },
    {
      "id": "@devops-engineer",
      "name": "DevOps Engineer"
    }
  ]
}
```

### 設定項目

- `claudeCodePromptGenerator.agents.specWriters`: 仕様書作成用エージェントのリスト
- `claudeCodePromptGenerator.agents.implementers`: 実装用エージェントのリスト

各エージェントは以下の形式：
```json
{
  "id": "@agent-id",  // @プレフィックス必須
  "name": "Agent Name"
}
```

## 生成されるプロンプトの形式

```
1. 以下の要件に基づいて機能改修したい。
   - 要件1
   - 要件2
   - 要件3

2. 上記の要件をPlanningすること。

3. ユーザーがPlanningを承認したら、@architectにdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）

4. ドキュメント保存後、その仕様設計書に基づいて、@backend-devに実装を行わせる。

5. 実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。
```

## 開発

### 必要な環境

- Node.js 20.x以上
- VSCode 1.80.0以上

### 開発セットアップ

```bash
# 依存関係をインストール
npm install

# VSCodeでデバッグモードで起動
# F5キーを押す、または「実行とデバッグ」から起動
```

### ビルド

```bash
# パッケージング
npx vsce package

# 出力: claude-code-prompt-generator-1.0.0.vsix
```

### リント

```bash
npm run lint
```

## プロジェクト構造

```
cc-planed-prompt-generate/
├── extension.js        # メインのExtensionコード（WebviewViewProvider）
├── package.json        # Extension設定とメタデータ
├── settings.json       # デフォルトのエージェント設定（参考用）
├── .vscodeignore       # VSIXに含めないファイル
├── .gitignore          # Git除外設定
├── README.md           # このファイル
├── USAGE_EXAMPLE.md    # 使用例
└── LICENSE             # MITライセンス
```

## 技術スタック

- **VSCode Extension API**: WebviewViewProvider
- **Node.js**: Extension実装
- **HTML/CSS/JavaScript**: Webview UI

## トラブルシューティング

### サイドパネルが表示されない

1. VSCodeをリロード（Ctrl/Cmd+R）
2. 拡張機能が有効になっているか確認
3. アクティビティバーに「Claude Prompt Generator」アイコンが表示されているか確認

### エージェントが表示されない

1. VSCode設定を確認
2. `settings.json`の形式が正しいか確認（JSON構文エラーがないか）
3. VSCodeをリロード

### プロンプトがコピーできない

1. 要件とエージェントがすべて入力されているか確認
2. ブラウザのクリップボード権限を確認

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 貢献

プルリクエストを歓迎します！バグ報告や機能要望はIssuesでお願いします。

## 作者

Yuri QA67

## リンク

- [GitHub Repository](https://github.com/yourusername/claude-code-prompt-generator)
- [Issues](https://github.com/yourusername/claude-code-prompt-generator/issues)
- [VSCode Marketplace](#) (公開後)

## バージョン履歴

### 1.0.0 (2025-11-06)
- VSCode Extension専用版としてリリース
- サイドパネル統合
- 動的要件入力機能
- カスタムエージェント手動入力対応
- @プレフィックス自動付与
- カスタマイズ可能なエージェント設定
