import type { Stage } from '../types/webview';
import { vscode } from '../utils/vscodeApi';

/**
 * プロンプト生成を担当するクラス
 */
export class PromptGenerator {
    /**
     * プレースホルダーを置換する共通関数
     */
    private replacePlaceholders(
        content: string,
        dynamicAgents: Map<string, string>
    ): string {
        let result = content;

        dynamicAgents.forEach((agentValue, placeholder) => {
            // placeholderは{agent-xxx}形式ではなく、agent-xxx形式で渡されるため
            // {を追加してマッチさせる
            const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&');
            const regex = new RegExp(`\\{${escapedPlaceholder}\\}`, 'g');
            result = result.replace(regex, agentValue);
        });

        return result;
    }

    /**
     * プロンプトを生成
     */
    public generate(
        items: string[],
        stages: Stage[],
        dynamicAgents: Map<string, string>
    ): string {
        if (items.length === 0) {
            return '';
        }

        let prompt = '';

        // Stagesを番号付きリストで追加
        stages.forEach((stage, stageIndex) => {
            // 動的エージェントのプレースホルダーを置換
            const stageContent = this.replacePlaceholders(stage.content, dynamicAgents);

            // ステージ番号を付与（1から開始）
            prompt += `${stageIndex + 1}. ${stageContent}\n`;

            // 最初のステージ（トップステージ）の場合は、その下に要件/課題をネスト
            if (stageIndex === 0) {
                items.forEach(item => {
                    if (item.trim()) {
                        prompt += `  - ${item.trim()}\n`;
                    }
                });
            }

            // SubStagesを追加
            if (stage.substages && stage.substages.length > 0) {
                stage.substages.forEach(substage => {
                    // 動的エージェントのプレースホルダーを置換
                    const substageContent = this.replacePlaceholders(substage.content, dynamicAgents);
                    prompt += `  - ${substageContent}\n`;
                });
            }
        });

        return prompt;
    }

    /**
     * プロンプトを表示
     */
    public display(prompt: string): void {
        const outputSection = document.getElementById('output-section');
        const promptOutput = document.getElementById('prompt-output') as HTMLTextAreaElement;

        if (outputSection && promptOutput) {
            promptOutput.value = prompt;
            outputSection.style.display = 'block';
        }
    }

    /**
     * プロンプトを非表示
     */
    public hide(): void {
        const outputSection = document.getElementById('output-section');
        if (outputSection) {
            outputSection.style.display = 'none';
        }
        // 編集モードをリセット
        this.setEditMode(false);
    }

    /**
     * 編集モードの切り替え
     */
    public toggleEditMode(): void {
        const promptOutput = document.getElementById('prompt-output') as HTMLTextAreaElement;
        const editButton = document.getElementById('btn-edit');

        if (!promptOutput || !editButton) return;

        const isReadonly = promptOutput.hasAttribute('readonly');

        if (isReadonly) {
            // 編集モードに切り替え
            promptOutput.removeAttribute('readonly');
            promptOutput.focus();
            editButton.textContent = '完了';
            editButton.classList.add('editing');
        } else {
            // 表示モードに切り替え
            promptOutput.setAttribute('readonly', '');
            editButton.textContent = '編集';
            editButton.classList.remove('editing');
        }
    }

    /**
     * 編集モードを設定
     */
    private setEditMode(isEditing: boolean): void {
        const promptOutput = document.getElementById('prompt-output') as HTMLTextAreaElement;
        const editButton = document.getElementById('btn-edit');

        if (!promptOutput || !editButton) return;

        if (isEditing) {
            promptOutput.removeAttribute('readonly');
            editButton.textContent = '完了';
            editButton.classList.add('editing');
        } else {
            promptOutput.setAttribute('readonly', '');
            editButton.textContent = '編集';
            editButton.classList.remove('editing');
        }
    }

    /**
     * プロンプトをクリップボードにコピー
     */
    public copyToClipboard(prompt: string): void {
        vscode.copyToClipboard(prompt);
    }

    /**
     * コピーボタンのイベントリスナーを設定
     */
    public setupCopyButton(getCurrentPrompt: () => string): void {
        const copyButton = document.querySelector('.btn-copy');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                // textareaから直接値を取得（編集されている可能性があるため）
                const promptOutput = document.getElementById('prompt-output') as HTMLTextAreaElement;
                const prompt = promptOutput?.value || getCurrentPrompt();
                if (prompt) {
                    this.copyToClipboard(prompt);
                }
            });
        }
    }
}
