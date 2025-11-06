const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Claude Code Prompt Generator is now active!');

    let disposable = vscode.commands.registerCommand('claudeCodePromptGenerator.open', function () {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel(
            'claudeCodePromptGenerator',
            'Claude Code Prompt Generator',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))]
            }
        );

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

        // Load HTML content
        panel.webview.html = getWebviewContent(panel.webview, context, settings);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'copyToClipboard':
                        vscode.env.clipboard.writeText(message.text).then(() => {
                            vscode.window.showInformationMessage('プロンプトをクリップボードにコピーしました！');
                        });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(webview, context, settings) {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }

        header h1 {
            font-size: 24px;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
            font-weight: 600;
        }

        .subtitle {
            font-size: 14px;
            opacity: 0.8;
        }

        section {
            margin-bottom: 30px;
        }

        h2 {
            font-size: 16px;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        #requirements-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }

        .requirement-row {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .requirement-input {
            flex: 1;
            padding: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }

        .requirement-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .btn-remove {
            width: 32px;
            height: 32px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 18px;
        }

        .btn-add, .btn-primary, .btn-copy {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-weight: 500;
        }

        .btn-add:hover, .btn-primary:hover, .btn-copy:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .agent-selects {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .select-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .select-group > label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .agent-select {
            padding: 8px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 2px;
        }

        .manual-input-wrapper {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .manual-label {
            font-size: 12px;
            opacity: 0.7;
            font-weight: 400;
        }

        .agent-manual-input {
            padding: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }

        .agent-manual-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .action-section {
            text-align: center;
            padding: 20px 0;
        }

        .btn-primary {
            padding: 12px 32px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .output-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px solid var(--vscode-panel-border);
        }

        .output-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .btn-copy {
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .prompt-display {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 2px;
            padding: 16px;
            font-size: 13px;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 500px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
        }

        @media (max-width: 768px) {
            .agent-selects {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Claude Code Prompt Generator</h1>
            <p class="subtitle">Plan Mode & Subagents機能を活用したプロンプト自動生成</p>
        </header>

        <main>
            <section class="input-section">
                <h2>機能要件</h2>
                <div id="requirements-container">
                    <div class="requirement-row">
                        <input type="text" class="requirement-input" placeholder="機能要件を入力してください">
                        <button class="btn-remove" onclick="removeRequirement(this)">×</button>
                    </div>
                </div>
                <button class="btn-add" onclick="addRequirement()">+ 要件を追加</button>
            </section>

            <section class="agent-section">
                <h2>エージェント選択</h2>
                <div class="agent-selects">
                    <div class="select-group">
                        <label for="spec-agent">仕様設計書作成エージェント</label>
                        <select id="spec-agent" class="agent-select" onchange="handleAgentSelect('spec')">
                            <option value="">選択してください</option>
                        </select>
                        <div class="manual-input-wrapper">
                            <label for="spec-agent-manual" class="manual-label">または手動入力（@なしで入力）</label>
                            <input type="text" id="spec-agent-manual" class="agent-manual-input" placeholder="例: custom-agent">
                        </div>
                    </div>
                    <div class="select-group">
                        <label for="impl-agent">実装担当エージェント</label>
                        <select id="impl-agent" class="agent-select" onchange="handleAgentSelect('impl')">
                            <option value="">選択してください</option>
                        </select>
                        <div class="manual-input-wrapper">
                            <label for="impl-agent-manual" class="manual-label">または手動入力（@なしで入力）</label>
                            <input type="text" id="impl-agent-manual" class="agent-manual-input" placeholder="例: custom-implementer">
                        </div>
                    </div>
                </div>
            </section>

            <section class="action-section">
                <button class="btn-primary" onclick="generatePrompt()">プロンプト作成</button>
            </section>

            <section class="output-section" id="output-section" style="display: none;">
                <div class="output-header">
                    <h2>生成されたプロンプト</h2>
                    <button class="btn-copy" onclick="copyToClipboard()">📋 COPY</button>
                </div>
                <pre id="prompt-output" class="prompt-display"></pre>
            </section>
        </main>
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

            // Populate spec writers (name only, no description)
            settings.agents.specWriters.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name;
                specAgentSelect.appendChild(option);
            });

            // Populate implementers (name only, no description)
            settings.agents.implementers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name;
                implAgentSelect.appendChild(option);
            });
        }

        function handleAgentSelect(type) {
            const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';
            const manualInput = document.getElementById(manualInputId);
            const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
            const selectValue = document.getElementById(selectId).value;

            if (selectValue) {
                manualInput.value = '';
            }
        }

        function getAgentValue(type) {
            const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
            const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';

            const selectValue = document.getElementById(selectId).value;
            const manualValue = document.getElementById(manualInputId).value.trim();

            if (selectValue) {
                return selectValue; // Already has @ prefix
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
                <input type="text" class="requirement-input" placeholder="機能要件を入力してください">
                <button class="btn-remove" onclick="removeRequirement(this)">×</button>
            \`;
            container.appendChild(row);
        }

        function removeRequirement(button) {
            const container = document.getElementById('requirements-container');
            const rows = container.getElementsByClassName('requirement-row');
            if (rows.length <= 1) {
                return;
            }
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

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
