# Claude Code Prompt Generator

Claude CodeのPlan ModeとSubagents機能を最大限活用するプロンプトを自動生成するWebアプリケーション（VSCode Extension対応）

## 概要

このツールは、Claude Codeの強力な機能である**Plan Mode**と**Subagents**を活用したプロンプトを簡単に生成できるツールです。要件を入力し、適切なエージェントを選択するだけで、構造化されたプロンプトを自動生成します。

## 主な機能

- **動的な要件入力**: 複数の機能要件を追加・削除可能
- **エージェント選択**: 仕様書作成と実装担当のエージェントを個別に選択
- **プロンプト自動生成**: 固定テンプレートに基づいて最適なプロンプトを生成
- **ワンクリックコピー**: 生成されたプロンプトをクリップボードに簡単コピー
- **カスタマイズ可能**: settings.jsonで独自のエージェント設定を追加可能

## 使い方

### Webアプリとして使用

1. プロジェクトをクローンまたはダウンロード
2. `index.html`をブラウザで開く
3. 機能要件を入力
4. エージェントを選択
5. 「プロンプト作成」をクリック
6. 生成されたプロンプトを「COPY」ボタンでコピー

### VSCode Extensionとして使用

1. プロジェクトをクローン
2. 以下のコマンドを実行:

```bash
npm install
```

3. VSCodeで開発用にテスト:

```bash
# VSCodeでF5キーを押して拡張機能をデバッグモードで起動
```

4. コマンドパレット（Ctrl/Cmd+Shift+P）から「Claude Code: Open Prompt Generator」を実行

### VSCode Extensionのインストール

```bash
# パッケージをビルド
npx vsce package

# .vsixファイルをインストール
code --install-extension claude-code-prompt-generator-1.0.0.vsix
```

## 設定のカスタマイズ

### settings.jsonの編集（Webアプリ版）

`settings.json`ファイルを編集して、独自のエージェントを追加できます:

```json
{
  "agents": {
    "specWriters": [
      {
        "id": "custom-agent",
        "name": "カスタムエージェント",
        "description": "独自の仕様書作成エージェント"
      }
    ],
    "implementers": [
      {
        "id": "custom-impl",
        "name": "カスタム実装エージェント",
        "description": "独自の実装エージェント"
      }
    ]
  }
}
```

### VSCode設定（Extension版）

VSCodeの設定から`Claude Code Prompt Generator`セクションを編集:

1. 設定を開く（Ctrl/Cmd+,）
2. 「Claude Code Prompt Generator」を検索
3. `agents.specWriters`または`agents.implementers`を編集

## 生成されるプロンプトの形式

```
1. 以下の要件に基づいて機能改修したい。
   - 要件1
   - 要件2

2. 上記の要件をPlanningすること。

3. ユーザーがPlanningを承認したら、[選択したエージェント]にdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）

4. ドキュメント保存後、その仕様設計書に基づいて、[選択したエージェント]に実装を行わせる。

5. 実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。
```

## プロジェクト構造

```
cc-planed-prompt-generate/
├── index.html          # メインUI
├── styles.css          # スタイリング
├── app.js              # ロジック（Webアプリ版）
├── extension.js        # VSCode Extension エントリポイント
├── package.json        # VSCode Extension設定
├── settings.json       # エージェント設定
├── .vscodeignore       # VSIXに含めないファイル
└── README.md           # このファイル
```

## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **VSCode Extension API**: Node.js
- **設定管理**: JSON

## 開発

### 必要な環境

- Node.js 20.x以上
- VSCode 1.80.0以上（Extension開発の場合）

### 開発コマンド

```bash
# リント
npm run lint

# テスト
npm test
```

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！バグ報告や機能要望はIssuesでお願いします。

## 作者

Yuri QA67

## バージョン履歴

- **1.0.0** (2025-11-06)
  - 初回リリース
  - Webアプリ版とVSCode Extension版の両対応
  - 動的要件入力機能
  - カスタマイズ可能なエージェント設定
