// Global state
let settings = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    populateAgentDropdowns();
});

// Load settings from settings.json
async function loadSettings() {
    try {
        const response = await fetch('settings.json');
        settings = await response.json();
        console.log('Settings loaded:', settings);
    } catch (error) {
        console.error('Failed to load settings:', error);
        alert('設定ファイル(settings.json)の読み込みに失敗しました。');
    }
}

// Populate agent dropdowns with options from settings
function populateAgentDropdowns() {
    if (!settings) return;

    const specAgentSelect = document.getElementById('spec-agent');
    const implAgentSelect = document.getElementById('impl-agent');

    // Clear existing options (except the first placeholder)
    specAgentSelect.innerHTML = '<option value="">選択してください</option>';
    implAgentSelect.innerHTML = '<option value="">選択してください</option>';

    // Populate spec writers
    settings.agents.specWriters.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} - ${agent.description}`;
        specAgentSelect.appendChild(option);
    });

    // Populate implementers
    settings.agents.implementers.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} - ${agent.description}`;
        implAgentSelect.appendChild(option);
    });
}

// Add new requirement input field
function addRequirement() {
    const container = document.getElementById('requirements-container');
    const row = document.createElement('div');
    row.className = 'requirement-row';
    row.innerHTML = `
        <input type="text" class="requirement-input" placeholder="機能要件を入力してください">
        <button class="btn-remove" onclick="removeRequirement(this)" title="削除">×</button>
    `;
    container.appendChild(row);
}

// Remove requirement input field
function removeRequirement(button) {
    const container = document.getElementById('requirements-container');
    const rows = container.getElementsByClassName('requirement-row');

    // Keep at least one input field
    if (rows.length <= 1) {
        alert('最低1つの要件フィールドが必要です。');
        return;
    }

    button.parentElement.remove();
}

// Get all requirement values
function getRequirements() {
    const inputs = document.querySelectorAll('.requirement-input');
    const requirements = [];

    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            requirements.push(value);
        }
    });

    return requirements;
}

// Generate prompt based on user input
function generatePrompt() {
    const requirements = getRequirements();
    const specAgentId = document.getElementById('spec-agent').value;
    const implAgentId = document.getElementById('impl-agent').value;

    // Validation
    if (requirements.length === 0) {
        alert('機能要件を最低1つ入力してください。');
        return;
    }

    if (!specAgentId) {
        alert('仕様設計書作成エージェントを選択してください。');
        return;
    }

    if (!implAgentId) {
        alert('実装担当エージェントを選択してください。');
        return;
    }

    // Find agent names
    const specAgent = settings.agents.specWriters.find(a => a.id === specAgentId);
    const implAgent = settings.agents.implementers.find(a => a.id === implAgentId);

    // Generate prompt
    const prompt = buildPrompt(requirements, specAgent, implAgent);

    // Display prompt
    displayPrompt(prompt);
}

// Build prompt string from template
function buildPrompt(requirements, specAgent, implAgent) {
    const template = settings.promptTemplate;

    let prompt = `1. ${template.header}\n`;

    // Add requirements as bullet points
    requirements.forEach((req, index) => {
        prompt += `   - ${req}\n`;
    });

    prompt += `\n2. ${template.planningStep}\n\n`;

    // Replace agent placeholders
    const specStep = template.specCreationStep.replace('{agent-a}', specAgent.id);
    prompt += `3. ${specStep}\n\n`;

    const implStep = template.implementationStep.replace('{agent-b}', implAgent.id);
    prompt += `4. ${implStep}\n\n`;

    prompt += `5. ${template.finalNote}`;

    return prompt;
}

// Display generated prompt
function displayPrompt(prompt) {
    const outputSection = document.getElementById('output-section');
    const promptOutput = document.getElementById('prompt-output');

    promptOutput.textContent = prompt;
    outputSection.style.display = 'block';

    // Smooth scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy prompt to clipboard
async function copyToClipboard() {
    const promptOutput = document.getElementById('prompt-output');
    const copyStatus = document.getElementById('copy-status');
    const text = promptOutput.textContent;

    try {
        await navigator.clipboard.writeText(text);

        // Show success message
        copyStatus.textContent = '✓ クリップボードにコピーしました！';
        copyStatus.classList.add('show');

        // Hide message after 2 seconds
        setTimeout(() => {
            copyStatus.classList.remove('show');
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);

        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        const copyStatus = document.getElementById('copy-status');
        copyStatus.textContent = '✓ クリップボードにコピーしました！';
        copyStatus.classList.add('show');

        setTimeout(() => {
            copyStatus.classList.remove('show');
        }, 2000);
    } catch (error) {
        alert('コピーに失敗しました。手動でコピーしてください。');
    }

    document.body.removeChild(textarea);
}
