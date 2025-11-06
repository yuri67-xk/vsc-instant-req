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

// Handle agent selection - clear manual input when dropdown is used
function handleAgentSelect(type) {
    const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';
    const manualInput = document.getElementById(manualInputId);

    // Clear manual input when dropdown is selected
    const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
    const selectValue = document.getElementById(selectId).value;

    if (selectValue) {
        manualInput.value = '';
    }
}

// Get agent ID from dropdown or manual input, with @ prefix
function getAgentValue(type) {
    const selectId = type === 'spec' ? 'spec-agent' : 'impl-agent';
    const manualInputId = type === 'spec' ? 'spec-agent-manual' : 'impl-agent-manual';

    const selectValue = document.getElementById(selectId).value;
    const manualValue = document.getElementById(manualInputId).value.trim();

    // Priority: dropdown first, then manual input
    if (selectValue) {
        return selectValue; // Already has @ prefix from settings.json
    } else if (manualValue) {
        // Add @ prefix if not already present
        return manualValue.startsWith('@') ? manualValue : `@${manualValue}`;
    }

    return null;
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
    const specAgentId = getAgentValue('spec');
    const implAgentId = getAgentValue('impl');

    // Validation
    if (requirements.length === 0) {
        alert('機能要件を最低1つ入力してください。');
        return;
    }

    if (!specAgentId) {
        alert('仕様設計書作成エージェントを選択または入力してください。');
        return;
    }

    if (!implAgentId) {
        alert('実装担当エージェントを選択または入力してください。');
        return;
    }

    // Generate prompt
    const prompt = buildPrompt(requirements, specAgentId, implAgentId);

    // Display prompt
    displayPrompt(prompt);
}

// Build prompt string from template
function buildPrompt(requirements, specAgentId, implAgentId) {
    const template = settings.promptTemplate;

    let prompt = `1. ${template.header}\n`;

    // Add requirements as bullet points
    requirements.forEach((req, index) => {
        prompt += `   - ${req}\n`;
    });

    prompt += `\n2. ${template.planningStep}\n\n`;

    // Replace agent placeholders with @ prefixed IDs
    const specStep = template.specCreationStep.replace('{agent-a}', specAgentId);
    prompt += `3. ${specStep}\n\n`;

    const implStep = template.implementationStep.replace('{agent-b}', implAgentId);
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
