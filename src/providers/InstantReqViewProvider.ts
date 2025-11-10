import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Settings, WebviewMessage, StagesLoadedMessage, Stage } from '../types/settings';

export class InstantReqViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'instantReq.sidePanel';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
            switch (message.command) {
                case 'copyToClipboard':
                    if (message.text) {
                        vscode.env.clipboard.writeText(message.text).then(() => {
                            vscode.window.showInformationMessage('プロンプトをクリップボードにコピーしました！');
                        });
                    }
                    return;
                case 'saveRecentAgent':
                    if (message.agentId) {
                        this._saveRecentAgent(message.agentId);
                    }
                    return;
                case 'saveStages':
                    if (message.stages && message.tabType) {
                        const key = message.tabType === 'requirements' ? 'instantReq.requirementsStages' : 'instantReq.issuesStages';
                        this._context.globalState.update(key, message.stages);
                    }
                    return;
                case 'resetStages':
                    // globalStateをクリアしてデフォルトに戻す
                    if (message.tabType) {
                        const key = message.tabType === 'requirements' ? 'instantReq.requirementsStages' : 'instantReq.issuesStages';
                        this._context.globalState.update(key, undefined);
                    }
                    // loadStagesと同じ処理を実行
                    // (フォールスルーでloadStagesの処理を実行)
                case 'loadStages':
                    // defaultStages.jsonから読み込み
                    const defaultStagesPath = path.join(this._extensionUri.fsPath, 'src', 'config', 'defaultStages.json');
                    let defaultStages: { requirements: Stage[], issues: Stage[] } = { requirements: [], issues: [] };

                    if (fs.existsSync(defaultStagesPath)) {
                        const defaultStagesJson = fs.readFileSync(defaultStagesPath, 'utf8');
                        defaultStages = JSON.parse(defaultStagesJson);
                    }

                    // globalStateから保存されたStagesを読み込み（なければdefaultを使用）
                    let savedRequirementsStages = this._context.globalState.get<Stage[] | null>('instantReq.requirementsStages', null);
                    let savedIssuesStages = this._context.globalState.get<Stage[] | null>('instantReq.issuesStages', null);

                    // データ検証: substagesプロパティが存在しない古いデータを検出
                    const hasSubstagesProperty = (stages: Stage[] | null): boolean => {
                        if (!stages || stages.length === 0) return false;
                        // 少なくとも1つのStageにsubstagesプロパティが定義されているか確認
                        return stages.some(stage => 'substages' in stage);
                    };

                    // 古いデータ形式の場合はdefaultStagesを使用
                    if (savedRequirementsStages && !hasSubstagesProperty(savedRequirementsStages)) {
                        console.log('[InstantReq] 古いrequirementsStagesデータを検出。デフォルトに戻します。');
                        savedRequirementsStages = null; // デフォルトを使用
                        this._context.globalState.update('instantReq.requirementsStages', undefined); // クリア
                    }
                    if (savedIssuesStages && !hasSubstagesProperty(savedIssuesStages)) {
                        console.log('[InstantReq] 古いissuesStagesデータを検出。デフォルトに戻します。');
                        savedIssuesStages = null; // デフォルトを使用
                        this._context.globalState.update('instantReq.issuesStages', undefined); // クリア
                    }

                    // 最近使用したエージェントを読み込み
                    const recentAgents = this._context.globalState.get<string[]>('instantReq.recentAgents', []);

                    const response: StagesLoadedMessage = {
                        command: 'stagesLoaded',
                        requirementsStages: savedRequirementsStages || defaultStages.requirements,
                        issuesStages: savedIssuesStages || defaultStages.issues,
                        recentAgents: recentAgents
                    };
                    webviewView.webview.postMessage(response);
                    return;
            }
        });
    }

    /**
     * 最近使用したエージェントを保存
     */
    private _saveRecentAgent(agentId: string): void {
        const recentAgents = this._context.globalState.get<string[]>('instantReq.recentAgents', []);

        // 既存のものを削除して先頭に追加（重複排除）
        const updated = [agentId, ...recentAgents.filter(a => a !== agentId)].slice(0, 10);

        this._context.globalState.update('instantReq.recentAgents', updated);

        // webviewに更新を通知
        if (this._view) {
            const response: StagesLoadedMessage = {
                command: 'stagesLoaded',
                recentAgents: updated
            };
            this._view.webview.postMessage(response);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get settings from VSCode configuration
        const config = vscode.workspace.getConfiguration('instantReq');

        // Default agent: Claude Code standard general-purpose agent
        const defaultAgents = [
            { id: "@general-purpose", name: "General Purpose Agent" }
        ];

        const settings: Settings = {
            agents: {
                specWriters: config.get('agents.specWriters') || defaultAgents,
                implementers: config.get('agents.implementers') || defaultAgents,
                issueExplorers: config.get('agents.issueExplorers') || defaultAgents,
                systemArchitects: config.get('agents.systemArchitects') || defaultAgents,
                seniorEngineers: config.get('agents.seniorEngineers') || defaultAgents,
                codeReviewers: config.get('agents.codeReviewers') || defaultAgents
            },
            promptTemplate: {
                header: config.get('promptTemplate.header') || "以下の要件に基づいて機能を開発すること。",
                planningStep: config.get('promptTemplate.planningStep') || "上記の要件を詳細にPlanningして、開発計画を提示すること。",
                specStep: config.get('promptTemplate.specStep') || "Planning結果をユーザーが承認したら、{agent-a}に仕様設計書を作成させること。",
                implementationStep: config.get('promptTemplate.implementationStep') || "仕様設計書の作成が完了したら、{agent-b}にその仕様設計書に基づいて実装を行うこと。",
                codeReviewStep: config.get('promptTemplate.codeReviewStep') || "実装が完了したら、{agent-c}を起動して、コードレビューを実施すること。",
                deliveryStep: config.get('promptTemplate.deliveryStep') || "コードレビューが完了したら、ユーザーに最終成果物を提出すること。",
                restrictions: config.get('promptTemplate.restrictions') || "各エージェントの出力は必ず次のエージェントへのインプットとして使用されるため、正確かつ詳細に記述すること。"
            },
            issueTemplate: {
                header: config.get('issueTemplate.header') || "以下の課題を探索し、改善策を提示してください。",
                explorationStep: config.get('issueTemplate.explorationStep') || "上記の課題を{agent-explore}エージェントで探索すること。",
                planningStep: config.get('issueTemplate.planningStep') || "explore エージェントの出力結果に基づいて、改善策をPlanningすること。",
                specStep: config.get('issueTemplate.specStep') || "Planning結果をユーザーが承認したら、{agent-system-architect}エージェントで仕様設計書を作成すること。",
                implementationStep: config.get('issueTemplate.implementationStep') || "仕様設計書の作成が完了したら、{agent-senior-engineer}エージェントを起動して、実装を行うこと。",
                codeReviewStep: config.get('issueTemplate.codeReviewStep') || "実装が完了したら、{agent-code-review-pro}エージェントを起動して、コードレビューを実施すること。",
                deliveryStep: config.get('issueTemplate.deliveryStep') || "コードレビューが完了したら、ユーザーに最終成果物を提出すること。",
                restrictions: config.get('issueTemplate.restrictions') || "各エージェントの出力は必ず次のエージェントへのインプットとして使用されるため、正確かつ詳細に記述すること。"
            }
        };

        // Get URIs for resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'styles.css'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'));
        const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.ttf'));

        // Generate nonce for CSP
        const nonce = getNonce();

        // Read HTML template
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'index.html');
        const fs = require('fs');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Replace placeholders
        html = html
            .replace(/\{\{nonce\}\}/g, nonce)
            .replace(/\{\{cspSource\}\}/g, webview.cspSource)
            .replace(/\{\{scriptUri\}\}/g, scriptUri.toString())
            .replace(/\{\{stylesUri\}\}/g, stylesUri.toString())
            .replace(/\{\{codiconsUri\}\}/g, codiconsUri.toString());

        // Inject settings and codicons font
        const settingsScript = `<script nonce="${nonce}">window.INSTANT_REQ_SETTINGS = ${JSON.stringify(settings)};</script>`;
        const codiconsFontStyle = `<style nonce="${nonce}">
            @font-face {
                font-family: "codicon";
                font-display: block;
                src: url("${codiconsFontUri}") format("truetype");
            }
        </style>`;
        html = html.replace('</head>', `${codiconsFontStyle}${settingsScript}</head>`);

        return html;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
