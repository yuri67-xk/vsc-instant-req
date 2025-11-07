const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Instant Req is now active!');

    // Register the webview view provider for the side panel
    const provider = new InstantReqViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            InstantReqViewProvider.viewType,
            provider
        )
    );
}

class InstantReqViewProvider {
    static viewType = 'instantReq.sidePanel';

    constructor(extensionUri, context) {
        this._extensionUri = extensionUri;
        this._context = context;
    }

    /**
     * @param {vscode.WebviewView} webviewView
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'copyToClipboard':
                    vscode.env.clipboard.writeText(message.text).then(() => {
                        vscode.window.showInformationMessage('プロンプトをクリップボードにコピーしました！');
                    });
                    return;
                case 'saveStages':
                    this._context.globalState.update('instantReq.stages', message.stages);
                    return;
                case 'loadStages':
                    const savedStages = this._context.globalState.get('instantReq.stages', null);
                    webviewView.webview.postMessage({
                        command: 'stagesLoaded',
                        stages: savedStages
                    });
                    return;
            }
        });
    }

    _getHtmlForWebview(webview) {
        // Get settings from VSCode configuration
        const config = vscode.workspace.getConfiguration('instantReq');
        
        // Default agent: Claude Code standard general-purpose agent
        const defaultAgents = [
            { id: "@general-purpose", name: "General Purpose Agent" }
        ];
        
        const settings = {
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
                specStep: config.get('promptTemplate.specStep') || "Planning結果をユーザーが承認したら、{agent-a}に仕様設計書を作成させること。仕様設計書の作成にあたり、docs/specs/フォルダ配下にあるサブフォルダへ仕様設計書を保存すること。最適なサブフォルダが存在しない場合は、新規にサブフォルダを作成すること。仕様設計書は後段処理で参照されるため、正確かつ詳細に記述すること。仕様設計書には、実装方針、API設計、データ構造、テストケースも含めること。",
                implementationStep: config.get('promptTemplate.implementationStep') || "仕様設計書の作成が完了したら、{agent-b}にその仕様設計書に基づいて実装を行うこと。",
                codeReviewStep: config.get('promptTemplate.codeReviewStep') || "実装が完了したら、{agent-c}を起動して、コードレビューを実施すること。",
                deliveryStep: config.get('promptTemplate.deliveryStep') || "コードレビューが完了したら、ユーザーに最終成果物を提出すること。簡便な成果報告を添えること。簡便なテストケース概要を添えること。Git Commit Messageの提案を添えること。",
                restrictions: config.get('promptTemplate.restrictions') || "各エージェントの出力は必ず次のエージェントへのインプットとして使用されるため、正確かつ詳細に記述すること。成果物提出後は、ユーザーがテストを行うため、Git Commitを実行しないこと。"
            },
            issueTemplate: {
                header: config.get('issueTemplate.header') || "以下の課題を探索し、改善策を提示してください。",
                explorationStep: config.get('issueTemplate.explorationStep') || "上記の課題を{agent-explore}エージェントで探索すること。",
                planningStep: config.get('issueTemplate.planningStep') || "explore エージェントの出力結果に基づいて、改善策をPlanningすること。",
                specStep: config.get('issueTemplate.specStep') || "Planning結果をユーザーが承認したら、{agent-system-architect}エージェントで仕様設計書を作成すること。仕様設計書の作成にあたり、docs/specs/フォルダ配下にあるサブフォルダへ仕様設計書を保存すること。最適なサブフォルダが存在しない場合は、新規にサブフォルダを作成すること。仕様設計書は後段処理で参照されるため、正確かつ詳細に記述すること。仕様設計書には、テストケースも含めること。",
                implementationStep: config.get('issueTemplate.implementationStep') || "仕様設計書の作成が完了したら、{agent-senior-engineer}エージェントを起動して、仕様設計書に基づいて実装を行うこと。",
                codeReviewStep: config.get('issueTemplate.codeReviewStep') || "実装が完了したら、{agent-code-review-pro}エージェントを起動して、コードレビューを実施すること。",
                deliveryStep: config.get('issueTemplate.deliveryStep') || "コードレビューが完了したら、ユーザーに最終成果物を提出すること。簡便な成果報告を添えること。簡便なテストケース概要を添えること。Git Commit Messageの提案を添えること。",
                restrictions: config.get('issueTemplate.restrictions') || "各エージェントの出力は必ず次のエージェントへのインプットとして使用されるため、正確かつ詳細に記述すること。成果物提出後は、ユーザーがテストを行うため、Git Commitを実行しないこと。"
            }
        };

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instant Req</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            padding: 16px;
            height: auto;
            overflow-y: auto;
        }

        .tabs {
            display: flex;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .tab {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-tab-inactiveForeground);
            border-bottom: 2px solid transparent;
            background: none;
            border: none;
            outline: none;
        }

        .tab:hover {
            color: var(--vscode-tab-activeForeground);
            background: var(--vscode-tab-inactiveBackground);
        }

        .tab.active {
            color: var(--vscode-tab-activeForeground);
            border-bottom: 2px solid var(--vscode-focusBorder);
            background: var(--vscode-tab-activeBackground);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-foreground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .section-title-with-settings {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .btn-settings {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-settings:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        /* モーダルスタイル */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .modal-title {
            font-size: 14px;
            font-weight: 600;
            margin: 0;
        }

        .btn-close-modal {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
        }

        .btn-close-modal:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .modal-body {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .stage-card {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 12px;
            cursor: move;
        }

        .stage-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .stage-number {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
        }

        .btn-remove-stage {
            background: none;
            border: none;
            color: var(--vscode-errorForeground);
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
        }

        .stage-content textarea {
            width: 100%;
            min-height: 80px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            padding: 6px 8px;
            font-size: 12px;
            font-family: var(--vscode-font-family);
            resize: vertical;
        }

        .btn-add-stage {
            width: 100%;
            padding: 8px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .btn-add-stage:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        #requirements-container, #issues-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }

        .requirement-row, .issue-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .requirement-input, .issue-input {
            flex: 1;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-size: 12px;
            font-family: var(--vscode-font-family);
            resize: vertical;
            min-height: 60px;
            width: 100%;
        }

        .requirement-input:focus, .issue-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .btn-remove {
            width: 24px;
            height: 24px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .btn-remove:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .btn-add {
            width: 100%;
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .btn-add:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .select-group {
            margin-bottom: 16px;
        }

        .select-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            display: block;
            color: var(--vscode-foreground);
        }

        .agent-select {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 2px;
            font-size: 12px;
            font-family: var(--vscode-font-family);
        }

        .manual-input-wrapper {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .manual-label {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
            display: block;
        }

        .agent-manual-input {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
        }

        .agent-manual-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .button-group {
            display: flex;
            gap: 8px;
        }

        .btn-primary {
            flex: 1;
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            flex: 0 0 auto;
            padding: 8px 16px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .output-section {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .output-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .output-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-copy {
            padding: 4px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
        }

        .btn-copy:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .prompt-display {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 2px;
            padding: 12px;
            font-size: 11px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            overflow: visible;
            height: auto;
            min-height: 50px;
        }
    </style>
</head>
<body>
    <div class="tabs">
        <button class="tab active" onclick="switchTab('requirements')">要件定義</button>
        <button class="tab" onclick="switchTab('issues')">課題探索</button>
    </div>

    <!-- 要件定義タブ -->
    <div id="requirements-tab" class="tab-content active">
        <div class="section">
            <div class="section-title-with-settings">
                <div class="section-title">機能要件リスト</div>
                <button class="btn-settings" onclick="openStageSettings()" title="Stage設定">⚙️</button>
            </div>
            <div id="requirements-container">
                <div class="requirement-row">
                    <textarea class="requirement-input" placeholder="機能要件を入力"></textarea>
                    <button class="btn-remove" onclick="removeRequirement(this)">×</button>
                </div>
            </div>
            <button class="btn-add" onclick="addRequirement()">+ 要件を追加</button>
        </div>

        <div class="section">
            <div class="section-title">エージェント選択</div>

            <div class="select-group">
                <label class="select-label">仕様設計担当</label>
                <select id="spec-agent" class="agent-select" onchange="handleAgentSelect('spec')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="spec-agent-manual" class="agent-manual-input" placeholder="custom-agent">
                </div>
            </div>

            <div class="select-group">
                <label class="select-label">実装担当</label>
                <select id="impl-agent" class="agent-select" onchange="handleAgentSelect('impl')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="impl-agent-manual" class="agent-manual-input" placeholder="custom-implementer">
                </div>
            </div>

            <div class="select-group">
                <label class="select-label">コードレビュー担当</label>
                <select id="review-req-agent" class="agent-select" onchange="handleAgentSelect('review-req')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="review-req-agent-manual" class="agent-manual-input" placeholder="custom-reviewer">
                </div>
            </div>

            <!-- 動的エージェント選択 -->
            <div id="dynamic-agents-container"></div>
        </div>

        <div class="section">
            <div class="button-group">
                <button class="btn-primary" onclick="generateRequirementPrompt()">プロンプト発行</button>
                <button class="btn-secondary" onclick="clearRequirements()">CLEAR</button>
            </div>
        </div>
    </div>

    <!-- 課題探索タブ -->
    <div id="issues-tab" class="tab-content">
        <div class="section">
            <div class="section-title">課題リスト</div>
            <div id="issues-container">
                <div class="issue-row">
                    <textarea class="issue-input" placeholder="課題を入力"></textarea>
                    <button class="btn-remove" onclick="removeIssue(this)">×</button>
                </div>
            </div>
            <button class="btn-add" onclick="addIssue()">+ 課題を追加</button>
        </div>

        <div class="section">
            <div class="section-title">エージェント選択</div>

            <div class="select-group">
                <label class="select-label">課題探索担当</label>
                <select id="explore-agent" class="agent-select" onchange="handleAgentSelect('explore')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="explore-agent-manual" class="agent-manual-input" placeholder="agent-explore">
                </div>
            </div>

            <div class="select-group">
                <label class="select-label">仕様設計担当</label>
                <select id="architect-agent" class="agent-select" onchange="handleAgentSelect('architect')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="architect-agent-manual" class="agent-manual-input" placeholder="agent-system-architect">
                </div>
            </div>

            <div class="select-group">
                <label class="select-label">実装担当</label>
                <select id="senior-agent" class="agent-select" onchange="handleAgentSelect('senior')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="senior-agent-manual" class="agent-manual-input" placeholder="agent-senior-engineer">
                </div>
            </div>

            <div class="select-group">
                <label class="select-label">コードレビュー担当</label>
                <select id="review-agent" class="agent-select" onchange="handleAgentSelect('review')">
                    <option value="">選択してください</option>
                </select>
                <div class="manual-input-wrapper">
                    <label class="manual-label">または手動入力（@なし）</label>
                    <input type="text" id="review-agent-manual" class="agent-manual-input" placeholder="agent-code-review-pro">
                </div>
            </div>
        </div>

        <div class="section">
            <div class="button-group">
                <button class="btn-primary" onclick="generateIssuePrompt()">プロンプト発行</button>
                <button class="btn-secondary" onclick="clearIssues()">CLEAR</button>
            </div>
        </div>
    </div>

    <div class="output-section" id="output-section" style="display: none;">
        <div class="output-header">
            <div class="output-title">プロンプト本文</div>
            <button class="btn-copy" onclick="copyToClipboard()">COPY</button>
        </div>
        <pre id="prompt-output" class="prompt-display"></pre>
    </div>

    <!-- Stage設定モーダル -->
    <div id="stage-settings-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Stage設定</h3>
                <button class="btn-close-modal" onclick="closeStageSettings()">×</button>
            </div>
            <div class="modal-body">
                <div id="stages-container"></div>
                <button class="btn-add-stage" onclick="addStage()">+ Stageを追加</button>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeStageSettings()">キャンセル</button>
                <button class="btn-primary" onclick="saveStageSettings()">保存</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const settings = ${JSON.stringify(settings)};

        // Initialize immediately
        populateAgentDropdowns();
        loadStagesFromStorage();

        function populateAgentDropdowns() {
            // 要件定義タブ
            const specAgentSelect = document.getElementById('spec-agent');
            const implAgentSelect = document.getElementById('impl-agent');
            const reviewReqAgentSelect = document.getElementById('review-req-agent');

            settings.agents.specWriters.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                specAgentSelect.appendChild(option);
            });

            settings.agents.implementers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                implAgentSelect.appendChild(option);
            });

            settings.agents.codeReviewers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                reviewReqAgentSelect.appendChild(option);
            });

            // 課題探索タブ
            const exploreAgentSelect = document.getElementById('explore-agent');
            const architectAgentSelect = document.getElementById('architect-agent');
            const seniorAgentSelect = document.getElementById('senior-agent');
            const reviewAgentSelect = document.getElementById('review-agent');

            settings.agents.issueExplorers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                exploreAgentSelect.appendChild(option);
            });

            settings.agents.systemArchitects.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                architectAgentSelect.appendChild(option);
            });

            settings.agents.seniorEngineers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                seniorAgentSelect.appendChild(option);
            });

            settings.agents.codeReviewers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.id;
                reviewAgentSelect.appendChild(option);
            });
        }

        function switchTab(tabName) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to selected tab and content
            if (tabName === 'requirements') {
                document.querySelector('.tab:first-child').classList.add('active');
                document.getElementById('requirements-tab').classList.add('active');
            } else if (tabName === 'issues') {
                document.querySelector('.tab:last-child').classList.add('active');
                document.getElementById('issues-tab').classList.add('active');
            }
        }

        function handleAgentSelect(type) {
            let manualInputId, selectId;
            
            switch(type) {
                case 'spec':
                    manualInputId = 'spec-agent-manual';
                    selectId = 'spec-agent';
                    break;
                case 'impl':
                    manualInputId = 'impl-agent-manual';
                    selectId = 'impl-agent';
                    break;
                case 'explore':
                    manualInputId = 'explore-agent-manual';
                    selectId = 'explore-agent';
                    break;
                case 'architect':
                    manualInputId = 'architect-agent-manual';
                    selectId = 'architect-agent';
                    break;
                case 'senior':
                    manualInputId = 'senior-agent-manual';
                    selectId = 'senior-agent';
                    break;
                case 'review':
                    manualInputId = 'review-agent-manual';
                    selectId = 'review-agent';
                    break;
                case 'review-req':
                    manualInputId = 'review-req-agent-manual';
                    selectId = 'review-req-agent';
                    break;
            }

            const selectValue = document.getElementById(selectId).value;
            if (selectValue) {
                document.getElementById(manualInputId).value = '';
            }
        }

        function getAgentValue(type) {
            let selectId, manualInputId;
            
            switch(type) {
                case 'spec':
                    selectId = 'spec-agent';
                    manualInputId = 'spec-agent-manual';
                    break;
                case 'impl':
                    selectId = 'impl-agent';
                    manualInputId = 'impl-agent-manual';
                    break;
                case 'explore':
                    selectId = 'explore-agent';
                    manualInputId = 'explore-agent-manual';
                    break;
                case 'architect':
                    selectId = 'architect-agent';
                    manualInputId = 'architect-agent-manual';
                    break;
                case 'senior':
                    selectId = 'senior-agent';
                    manualInputId = 'senior-agent-manual';
                    break;
                case 'review':
                    selectId = 'review-agent';
                    manualInputId = 'review-agent-manual';
                    break;
                case 'review-req':
                    selectId = 'review-req-agent';
                    manualInputId = 'review-req-agent-manual';
                    break;
            }

            const selectValue = document.getElementById(selectId).value;
            const manualValue = document.getElementById(manualInputId).value.trim();

            if (selectValue) {
                return selectValue;
            } else if (manualValue) {
                return manualValue.startsWith('@') ? manualValue : '@' + manualValue;
            }

            return null;
        }

        // 要件定義タブの関数
        function addRequirement() {
            const container = document.getElementById('requirements-container');
            const row = document.createElement('div');
            row.className = 'requirement-row';
            row.innerHTML = '<textarea class="requirement-input" placeholder="機能要件を入力"></textarea>' +
                           '<button class="btn-remove" onclick="removeRequirement(this)">×</button>';
            container.appendChild(row);
        }

        function removeRequirement(button) {
            const container = document.getElementById('requirements-container');
            const rows = container.getElementsByClassName('requirement-row');
            if (rows.length <= 1) return;
            button.parentElement.remove();
        }

        function getRequirements() {
            const inputs = document.querySelectorAll('.requirement-input');
            const requirements = [];
            inputs.forEach(input => {
                const value = input.value.trim();
                if (value) requirements.push(value);
            });
            return requirements;
        }

        function clearRequirements() {
            // Clear all requirement inputs
            const inputs = document.querySelectorAll('.requirement-input');
            inputs.forEach(input => input.value = '');
            
            // Reset agent selects to default
            document.getElementById('spec-agent').selectedIndex = 0;
            document.getElementById('impl-agent').selectedIndex = 0;
            document.getElementById('review-req-agent').selectedIndex = 0;
            
            // Clear custom agent inputs
            document.getElementById('spec-agent-manual').value = '';
            document.getElementById('impl-agent-manual').value = '';
            document.getElementById('review-req-agent-manual').value = '';
            
            // Keep only one requirement row
            const container = document.getElementById('requirements-container');
            const rows = container.querySelectorAll('.requirement-row');
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
        }

        function generateRequirementPrompt() {
            // Stageが設定されている場合はStageベースのプロンプト生成
            if (stages.length > 0) {
                generatePromptFromStages();
                return;
            }

            // レガシー: settings.jsonベースのプロンプト生成
            const requirements = getRequirements();
            const specAgentId = getAgentValue('spec');
            const implAgentId = getAgentValue('impl');
            const reviewReqAgentId = getAgentValue('review-req');

            if (requirements.length === 0) {
                alert('機能要件を入力してください');
                return;
            }
            if (!specAgentId) {
                alert('仕様設計担当エージェントを選択してください');
                return;
            }
            if (!implAgentId) {
                alert('実装担当エージェントを選択してください');
                return;
            }
            if (!reviewReqAgentId) {
                alert('コードレビュー担当エージェントを選択してください');
                return;
            }

            const template = settings.promptTemplate;
            let prompt = '1. ' + template.header + '\\n';
            requirements.forEach(req => {
                prompt += '   - ' + req + '\\n';
            });
            prompt += '\\n2. ' + template.planningStep + '\\n\\n';
            prompt += '3. ' + template.specStep.replace('{agent-a}', ' ' + specAgentId + ' ') + '\\n\\n';
            prompt += '4. ' + template.implementationStep.replace('{agent-b}', ' ' + implAgentId + ' ') + '\\n\\n';
            prompt += '5. ' + template.codeReviewStep.replace('{agent-c}', ' ' + reviewReqAgentId + ' ') + '\\n\\n';
            prompt += '6. ' + template.deliveryStep + '\\n\\n';
            prompt += '7. ' + template.restrictions;

            const outputElement = document.getElementById('prompt-output');
            outputElement.textContent = prompt;
            document.getElementById('output-section').style.display = 'block';
            adjustPromptDisplayHeight();
        }

        // 課題探索タブの関数
        function addIssue() {
            const container = document.getElementById('issues-container');
            const row = document.createElement('div');
            row.className = 'issue-row';
            row.innerHTML = '<textarea class="issue-input" placeholder="課題を入力"></textarea>' +
                           '<button class="btn-remove" onclick="removeIssue(this)">×</button>';
            container.appendChild(row);
        }

        function removeIssue(button) {
            const container = document.getElementById('issues-container');
            const rows = container.getElementsByClassName('issue-row');
            if (rows.length <= 1) return;
            button.parentElement.remove();
        }

        function getIssues() {
            const inputs = document.querySelectorAll('.issue-input');
            const issues = [];
            inputs.forEach(input => {
                const value = input.value.trim();
                if (value) issues.push(value);
            });
            return issues;
        }

        function clearIssues() {
            // Clear all issue inputs
            const inputs = document.querySelectorAll('.issue-input');
            inputs.forEach(input => input.value = '');
            
            // Reset agent selects to default
            document.getElementById('explore-agent').selectedIndex = 0;
            document.getElementById('architect-agent').selectedIndex = 0;
            document.getElementById('senior-agent').selectedIndex = 0;
            document.getElementById('review-agent').selectedIndex = 0;
            
            // Clear custom agent inputs
            document.getElementById('explore-agent-manual').value = '';
            document.getElementById('architect-agent-manual').value = '';
            document.getElementById('senior-agent-manual').value = '';
            document.getElementById('review-agent-manual').value = '';
            
            // Keep only one issue row
            const container = document.getElementById('issues-container');
            const rows = container.querySelectorAll('.issue-row');
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
        }

        function generateIssuePrompt() {
            const issues = getIssues();
            const exploreAgentId = getAgentValue('explore');
            const architectAgentId = getAgentValue('architect');
            const seniorAgentId = getAgentValue('senior');
            const reviewAgentId = getAgentValue('review');

            if (issues.length === 0) {
                alert('課題を入力してください');
                return;
            }
            if (!exploreAgentId) {
                alert('課題探索担当エージェントを選択してください');
                return;
            }
            if (!architectAgentId) {
                alert('仕様設計担当エージェントを選択してください');
                return;
            }
            if (!seniorAgentId) {
                alert('実装担当エージェントを選択してください');
                return;
            }
            if (!reviewAgentId) {
                alert('コードレビュー担当エージェントを選択してください');
                return;
            }

            const template = settings.issueTemplate;
            let prompt = '1. ' + template.header + '\\n';
            issues.forEach(issue => {
                prompt += '    - ' + issue + '\\n';
            });
            prompt += '\\n2. ' + template.explorationStep.replace('{agent-explore}', ' ' + exploreAgentId + ' ') + '\\n\\n';
            prompt += '3. ' + template.planningStep + '\\n\\n';
            prompt += '4. ' + template.specStep.replace('{agent-system-architect}', ' ' + architectAgentId + ' ') + '\\n\\n';
            prompt += '5. ' + template.implementationStep.replace('{agent-senior-engineer}', ' ' + seniorAgentId + ' ') + '\\n\\n';
            prompt += '6. ' + template.codeReviewStep.replace('{agent-code-review-pro}', ' ' + reviewAgentId + ' ') + '\\n\\n';
            prompt += '7. ' + template.deliveryStep + '\\n\\n';
            prompt += '8. ' + template.restrictions;

            const outputElement = document.getElementById('prompt-output');
            outputElement.textContent = prompt;
            document.getElementById('output-section').style.display = 'block';
            adjustPromptDisplayHeight();
        }

        // 共通関数
        function adjustPromptDisplayHeight() {
            const outputElement = document.getElementById('prompt-output');
            if (outputElement) {
                outputElement.style.height = 'auto';
                const scrollHeight = outputElement.scrollHeight;
                outputElement.style.height = scrollHeight + 'px';
            }
        }

        function copyToClipboard() {
            const text = document.getElementById('prompt-output').textContent;
            vscode.postMessage({
                command: 'copyToClipboard',
                text: text
            });
        }

        // Stage設定モーダル関連
        let stages = [];
        let dynamicAgents = [];

        // 起動時にStageを読み込み
        function loadStagesFromStorage() {
            vscode.postMessage({ command: 'loadStages' });
        }

        // メッセージ受信ハンドラー
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'stagesLoaded' && message.stages) {
                stages = message.stages;
                extractDynamicAgents();
                renderDynamicAgentSelectors();
            }
        });

        // Stage設定から{agent-*}プレースホルダーを抽出
        function extractDynamicAgents() {
            dynamicAgents = [];
            const agentPattern = /\\{(agent-[^}]+)\\}/g;

            stages.forEach(stage => {
                let match;
                while ((match = agentPattern.exec(stage.content)) !== null) {
                    const agentKey = match[1];
                    if (!dynamicAgents.includes(agentKey)) {
                        dynamicAgents.push(agentKey);
                    }
                }
            });
        }

        // 動的エージェント選択UIを生成
        function renderDynamicAgentSelectors() {
            const container = document.getElementById('dynamic-agents-container');
            container.innerHTML = '';

            dynamicAgents.forEach(agentKey => {
                const selectGroup = document.createElement('div');
                selectGroup.className = 'select-group';

                const label = document.createElement('label');
                label.className = 'select-label';
                label.textContent = agentKey.replace('agent-', '').replace(/-/g, ' ').toUpperCase();

                const select = document.createElement('select');
                select.id = 'dynamic-' + agentKey;
                select.className = 'agent-select';
                select.onchange = () => handleDynamicAgentSelect(agentKey);

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '選択してください';
                select.appendChild(defaultOption);

                // すべてのエージェントオプションを追加
                const allAgents = [
                    ...settings.agents.specWriters,
                    ...settings.agents.implementers,
                    ...settings.agents.codeReviewers,
                    ...settings.agents.issueExplorers,
                    ...settings.agents.systemArchitects,
                    ...settings.agents.seniorEngineers
                ];

                // 重複を削除
                const uniqueAgents = Array.from(new Set(allAgents.map(a => a.id)))
                    .map(id => allAgents.find(a => a.id === id));

                uniqueAgents.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent.id;
                    option.textContent = agent.id;
                    select.appendChild(option);
                });

                const manualWrapper = document.createElement('div');
                manualWrapper.className = 'manual-input-wrapper';

                const manualLabel = document.createElement('label');
                manualLabel.className = 'manual-label';
                manualLabel.textContent = 'または手動入力（@なし）';

                const manualInput = document.createElement('input');
                manualInput.type = 'text';
                manualInput.id = 'dynamic-' + agentKey + '-manual';
                manualInput.className = 'agent-manual-input';
                manualInput.placeholder = agentKey;

                manualWrapper.appendChild(manualLabel);
                manualWrapper.appendChild(manualInput);

                selectGroup.appendChild(label);
                selectGroup.appendChild(select);
                selectGroup.appendChild(manualWrapper);

                container.appendChild(selectGroup);
            });
        }

        function handleDynamicAgentSelect(agentKey) {
            const selectValue = document.getElementById('dynamic-' + agentKey).value;
            if (selectValue) {
                document.getElementById('dynamic-' + agentKey + '-manual').value = '';
            }
        }

        function getDynamicAgentValue(agentKey) {
            const selectValue = document.getElementById('dynamic-' + agentKey).value;
            const manualValue = document.getElementById('dynamic-' + agentKey + '-manual').value.trim();

            if (selectValue) {
                return selectValue;
            } else if (manualValue) {
                return manualValue.startsWith('@') ? manualValue : '@' + manualValue;
            }
            return null;
        }

        function openStageSettings() {
            // 現在のsettings.promptTemplateから初期Stageを生成
            if (stages.length === 0) {
                stages = [
                    { id: 1, content: settings.promptTemplate.header },
                    { id: 2, content: settings.promptTemplate.planningStep },
                    { id: 3, content: settings.promptTemplate.specStep },
                    { id: 4, content: settings.promptTemplate.implementationStep },
                    { id: 5, content: settings.promptTemplate.codeReviewStep },
                    { id: 6, content: settings.promptTemplate.deliveryStep },
                    { id: 7, content: settings.promptTemplate.restrictions }
                ];
            }
            renderStages();
            document.getElementById('stage-settings-modal').style.display = 'flex';
        }

        function closeStageSettings() {
            document.getElementById('stage-settings-modal').style.display = 'none';
        }

        function renderStages() {
            const container = document.getElementById('stages-container');
            container.innerHTML = '';

            stages.forEach((stage, index) => {
                const card = document.createElement('div');
                card.className = 'stage-card';
                card.draggable = true;
                card.dataset.index = index;

                card.innerHTML = \`
                    <div class="stage-card-header">
                        <span class="stage-number">Stage \${index + 1}</span>
                        <button class="btn-remove-stage" onclick="removeStage(\${index})">×</button>
                    </div>
                    <div class="stage-content">
                        <textarea data-stage-id="\${stage.id}">\${stage.content}</textarea>
                    </div>
                \`;

                // ドラッグイベント
                card.addEventListener('dragstart', handleDragStart);
                card.addEventListener('dragover', handleDragOver);
                card.addEventListener('drop', handleDrop);
                card.addEventListener('dragend', handleDragEnd);

                container.appendChild(card);
            });
        }

        let draggedElement = null;

        function handleDragStart(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragOver(e) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDrop(e) {
            if (e.stopPropagation) e.stopPropagation();

            if (draggedElement !== this) {
                const draggedIndex = parseInt(draggedElement.dataset.index);
                const targetIndex = parseInt(this.dataset.index);

                // stagesの順序を入れ替え
                const temp = stages[draggedIndex];
                stages.splice(draggedIndex, 1);
                stages.splice(targetIndex, 0, temp);

                renderStages();
            }
            return false;
        }

        function handleDragEnd(e) {
            this.style.opacity = '1';
        }

        function addStage() {
            const newId = Math.max(...stages.map(s => s.id), 0) + 1;
            stages.push({ id: newId, content: '' });
            renderStages();
        }

        function removeStage(index) {
            if (stages.length <= 1) {
                alert('最低1つのStageが必要です');
                return;
            }
            stages.splice(index, 1);
            renderStages();
        }

        function saveStageSettings() {
            // textareaの内容を取得
            const textareas = document.querySelectorAll('#stages-container textarea');
            textareas.forEach((textarea, index) => {
                stages[index].content = textarea.value;
            });

            // globalStateに保存
            vscode.postMessage({
                command: 'saveStages',
                stages: stages
            });

            // エージェントプレースホルダーを再抽出
            extractDynamicAgents();
            renderDynamicAgentSelectors();

            closeStageSettings();
            alert('Stage設定を保存しました');
        }

        // Stageベースのプロンプト生成
        function generatePromptFromStages() {
            const requirements = getRequirements();

            if (requirements.length === 0) {
                alert('機能要件を入力してください');
                return;
            }

            // 動的エージェントのバリデーション
            for (const agentKey of dynamicAgents) {
                const value = getDynamicAgentValue(agentKey);
                if (!value) {
                    const label = agentKey.replace('agent-', '').replace(/-/g, ' ').toUpperCase();
                    alert(label + 'エージェントを選択してください');
                    return;
                }
            }

            let prompt = '';
            stages.forEach((stage, index) => {
                let stageContent = stage.content;

                // 動的エージェントを置換
                dynamicAgents.forEach(agentKey => {
                    const agentValue = getDynamicAgentValue(agentKey);
                    if (agentValue) {
                        const placeholder = '{' + agentKey + '}';
                        stageContent = stageContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\\\$&'), 'g'), ' ' + agentValue + ' ');
                    }
                });

                prompt += (index + 1) + '. ' + stageContent + '\\n';

                // 最初のStageの後に要件リストを挿入
                if (index === 0) {
                    requirements.forEach(req => {
                        prompt += '   - ' + req + '\\n';
                    });
                }

                prompt += '\\n';
            });

            const outputElement = document.getElementById('prompt-output');
            outputElement.textContent = prompt;
            document.getElementById('output-section').style.display = 'block';
            adjustPromptDisplayHeight();
        }
    </script>
</body>
</html>`;
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
