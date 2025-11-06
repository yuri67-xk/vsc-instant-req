const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Claude Code Prompt Generator is now active!');

    // Register the webview view provider for the side panel
    const provider = new PromptGeneratorViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            PromptGeneratorViewProvider.viewType,
            provider
        )
    );
}

class PromptGeneratorViewProvider {
    static viewType = 'claudeCodePromptGenerator.sidePanel';

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
        const config = vscode.workspace.getConfiguration('claudeCodePromptGenerator');
        const settings = {
            agents: {
                specWriters: config.get('agents.specWriters') || [],
                implementers: config.get('agents.implementers') || []
            },
            promptTemplate: {
                header: "以下の要件に基づいて機能改修したい。",
                planningStep: "上記の要件をPlanningすること。",
                specCreationStep: "ユーザーがPlanningを承認したら、{agent-a}にdocs/specs/配下に仕様書を作成させる（specs/配下に分類可能な既存フォルダがあるかを確認し、ない場合は新規作成・ある場合はフォルダへ保存）",
                implementationStep: "ドキュメント保存後、その仕様設計書に基づいて、{agent-b}に実装を行わせる。",
                finalNote: "実装完了後はユーザーがテストするので、Git Commitを自動で行わないこと。"
            }
        };

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Prompt Generator</title>
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

        .btn-primary {
            width: 100%;
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
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
        }

        .prompt-display::-webkit-scrollbar {
            width: 8px;
        }

        .prompt-display::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }

        .prompt-display::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-activeBackground);
            border-radius: 4px;
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
        <button class="btn-primary" onclick="generatePrompt()">プロンプト作成</button>
    </div>

    <div class="output-section" id="output-section" style="display: none;">
        <div class="output-header">
            <div class="output-title">生成プロンプト</div>
            <button class="btn-copy" onclick="copyToClipboard()">COPY</button>
        </div>
        <pre id="prompt-output" class="prompt-display"></pre>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const settings = ${JSON.stringify(settings)};

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            populateAgentDropdowns();
        });

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
            row.innerHTML = \`
                <input type="text" class="requirement-input" placeholder="機能要件を入力">
                <button class="btn-remove" onclick="removeRequirement(this)">×</button>
            \`;
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
            let prompt = \`1. \${template.header}\\n\`;
            requirements.forEach(req => {
                prompt += \`   - \${req}\\n\`;
            });
            prompt += \`\\n2. \${template.planningStep}\\n\\n\`;
            prompt += \`3. \${template.specCreationStep.replace('{agent-a}', specAgentId)}\\n\\n\`;
            prompt += \`4. \${template.implementationStep.replace('{agent-b}', implAgentId)}\\n\\n\`;
            prompt += \`5. \${template.finalNote}\`;

            document.getElementById('prompt-output').textContent = prompt;
            document.getElementById('output-section').style.display = 'block';
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
