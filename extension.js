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
    // Read the HTML file
    const htmlPath = vscode.Uri.file(path.join(context.extensionPath, 'index.html'));
    const cssPath = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'styles.css')));

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
            max-width: 900px;
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
            border-radius: 4px;
        }

        .requirement-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .btn-remove {
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .btn-add, .btn-primary, .btn-copy {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
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

        .select-group label {
            font-size: 13px;
            font-weight: 600;
        }

        .agent-select {
            padding: 8px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
        }

        .action-section {
            text-align: center;
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

        .prompt-display {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 16px;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
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
                        <select id="spec-agent" class="agent-select">
                            <option value="">選択してください</option>
                        </select>
                    </div>
                    <div class="select-group">
                        <label for="impl-agent">実装担当エージェント</label>
                        <select id="impl-agent" class="agent-select">
                            <option value="">選択してください</option>
                        </select>
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

            settings.agents.specWriters.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name + ' - ' + agent.description;
                specAgentSelect.appendChild(option);
            });

            settings.agents.implementers.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name + ' - ' + agent.description;
                implAgentSelect.appendChild(option);
            });
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
            const specAgentId = document.getElementById('spec-agent').value;
            const implAgentId = document.getElementById('impl-agent').value;

            if (requirements.length === 0 || !specAgentId || !implAgentId) {
                return;
            }

            const specAgent = settings.agents.specWriters.find(a => a.id === specAgentId);
            const implAgent = settings.agents.implementers.find(a => a.id === implAgentId);

            const template = settings.promptTemplate;
            let prompt = \`1. \${template.header}\\n\`;
            requirements.forEach(req => {
                prompt += \`   - \${req}\\n\`;
            });
            prompt += \`\\n2. \${template.planningStep}\\n\\n\`;
            prompt += \`3. \${template.specCreationStep.replace('{agent-a}', specAgent.id)}\\n\\n\`;
            prompt += \`4. \${template.implementationStep.replace('{agent-b}', implAgent.id)}\\n\\n\`;
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
