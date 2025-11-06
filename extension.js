const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Instant Req is now active!');

    // Register the webview view provider for the side panel
    const provider = new InstantReqViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            InstantReqViewProvider.viewType,
            provider
        )
    );
}

class InstantReqViewProvider {
    static viewType = 'instantReq.sidePanel';

    constructor(extensionUri) {
        this._extensionUri = extensionUri;
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
                implementers: config.get('agents.implementers') || defaultAgents
            },
            promptTemplate: {
                header: config.get('promptTemplate.header') || "以下の要件に基づいて機能を開発したい。",
                planningStep: config.get('promptTemplate.planningStep') || "上記の要件を詳細にPlanningして、開発計画を提示すること。",
                specLocationStep: config.get('promptTemplate.specLocationStep') || "ユーザーがPlanningを承認したら、docs/specs/配下の適切なフォルダを選定し（既存フォルダの確認・新規作成判断を含む）、仕様設計書の保存先を決定すること。",
                specCreationStep: config.get('promptTemplate.specCreationStep') || "保存先決定後、{agent-a}に詳細な仕様設計書を作成させること。仕様書には実装方針、API設計、データ構造、テストケース詳細を含めること。",
                implementationStep: config.get('promptTemplate.implementationStep') || "仕様設計書が作成されたら、{agent-b}にその仕様書に基づいて実装を行わせること。",
                testingStep: config.get('promptTemplate.testingStep') || "実装完了後、ユーザーがテストを行うための簡潔なテストケース概要を提示すること。詳細なテストケースは仕様設計書に記載済みのため、ここでは要点のみ。",
                restrictions: config.get('promptTemplate.restrictions') || "【重要】Git Commitは絶対に自動実行しないこと。ユーザーが動作確認後に手動でCommitを行う。"
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

        #requirements-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }

        .requirement-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .requirement-input {
            flex: 1;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-size: 12px;
            font-family: var(--vscode-font-family);
        }

        .requirement-input:focus {
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
    <div class="section">
        <div class="section-title">機能要件</div>
        <div id="requirements-container">
            <div class="requirement-row">
                <input type="text" class="requirement-input" placeholder="機能要件を入力">
                <button class="btn-remove" onclick="removeRequirement(this)">×</button>
            </div>
        </div>
        <button class="btn-add" onclick="addRequirement()">+ 要件を追加</button>
    </div>

    <div class="section">
        <div class="section-title">エージェント選択</div>

        <div class="select-group">
            <label class="select-label">仕様設計書作成</label>
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
    </div>

    <div class="section">
        <div class="button-group">
            <button class="btn-primary" onclick="generatePrompt()">プロンプト発行</button>
            <button class="btn-secondary" onclick="clearAll()">CLEAR</button>
        </div>
    </div>

    <div class="output-section" id="output-section" style="display: none;">
        <div class="output-header">
            <div class="output-title">プロンプト本文</div>
            <button class="btn-copy" onclick="copyToClipboard()">COPY</button>
        </div>
        <pre id="prompt-output" class="prompt-display"></pre>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const settings = ${JSON.stringify(settings)};

        // Initialize immediately
        populateAgentDropdowns();

        function populateAgentDropdowns() {
            const specAgentSelect = document.getElementById('spec-agent');
            const implAgentSelect = document.getElementById('impl-agent');

            settings.agents.specWriters.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name;
                specAgentSelect.appendChild(option);
            });

            settings.agents.implementers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name;
                implAgentSelect.appendChild(option);
            });
        }

        function handleAgentSelect(type) {
            const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';
            const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
            const selectValue = document.getElementById(selectId).value;

            if (selectValue) {
                document.getElementById(manualInputId).value = '';
            }
        }

        function getAgentValue(type) {
            const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
            const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';

            const selectValue = document.getElementById(selectId).value;
            const manualValue = document.getElementById(manualInputId).value.trim();

            if (selectValue) {
                return selectValue;
            } else if (manualValue) {
                return manualValue.startsWith('@') ? manualValue : '@' + manualValue;
            }

            return null;
        }

        function addRequirement() {
            const container = document.getElementById('requirements-container');
            const row = document.createElement('div');
            row.className = 'requirement-row';
            row.innerHTML = '<input type="text" class="requirement-input" placeholder="機能要件を入力">' +
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

        function generatePrompt() {
            const requirements = getRequirements();
            const specAgentId = getAgentValue('spec');
            const implAgentId = getAgentValue('impl');

            if (requirements.length === 0 || !specAgentId || !implAgentId) {
                return;
            }

            const template = settings.promptTemplate;
            let prompt = '1. ' + template.header + '\\n';
            requirements.forEach(req => {
                prompt += '   - ' + req + '\\n';
            });
            prompt += '\\n2. ' + template.planningStep + '\\n\\n';
            prompt += '3. ' + template.specLocationStep + '\\n\\n';
            prompt += '4. ' + template.specCreationStep.replace('{agent-a}', specAgentId) + '\\n\\n';
            prompt += '5. ' + template.implementationStep.replace('{agent-b}', implAgentId) + '\\n\\n';
            prompt += '6. ' + template.testingStep + '\\n\\n';
            prompt += '7. ' + template.restrictions;

            const outputElement = document.getElementById('prompt-output');
            outputElement.textContent = prompt;
            document.getElementById('output-section').style.display = 'block';
            
            // 高さを動的に調整（全文表示）
            adjustPromptDisplayHeight();
        }

        function adjustPromptDisplayHeight() {
            const outputElement = document.getElementById('prompt-output');
            if (outputElement) {
                // 一時的にheightをautoにして自然な高さを取得
                outputElement.style.height = 'auto';
                const scrollHeight = outputElement.scrollHeight;
                outputElement.style.height = scrollHeight + 'px';
            }
        }

        function clearAll() {
            // Clear all requirement inputs
            const inputs = document.querySelectorAll('.requirement-input');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Reset agent selects to default
            document.getElementById('spec-agent').selectedIndex = 0;
            document.getElementById('impl-agent').selectedIndex = 0;
            
            // Clear custom agent inputs
            document.getElementById('spec-agent-manual').value = '';
            document.getElementById('impl-agent-manual').value = '';
            
            // Hide output section
            document.getElementById('output-section').style.display = 'none';
            
            // Keep only one requirement row
            const container = document.getElementById('requirements-container');
            const rows = container.querySelectorAll('.requirement-row');
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
        }

        function copyToClipboard() {
            const text = document.getElementById('prompt-output').textContent;
            vscode.postMessage({
                command: 'copyToClipboard',
                text: text
            });
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
