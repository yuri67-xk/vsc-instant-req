import type { Stage } from '../types/webview';
import { vscode } from '../utils/vscodeApi';
import { getElementById, toggleClass } from '../utils/domHelpers';
import { replacePlaceholders } from '../utils/placeholderReplacer';

/**
 * プロンプト生成を担当するクラス（最適化版）
 */
export class PromptGenerator {
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

        stages.forEach((stage, stageIndex) => {
            // ステージコンテンツのプレースホルダーを置換
            const stageContent = replacePlaceholders(stage.content, dynamicAgents);
            prompt += `${stageIndex + 1}. ${stageContent}\n`;

            // 最初のステージに要件/課題をネスト
            if (stageIndex === 0) {
                items.forEach(item => {
                    if (item.trim()) {
                        prompt += `  - ${item.trim()}\n`;
                    }
                });
            }

            // サブステージを追加
            if (stage.substages && stage.substages.length > 0) {
                stage.substages.forEach(substage => {
                    const substageContent = replacePlaceholders(substage.content, dynamicAgents);
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
        const outputSection = getElementById<HTMLElement>('output-section');
        const promptOutput = getElementById<HTMLTextAreaElement>('prompt-output');

        if (outputSection && promptOutput) {
            promptOutput.value = prompt;
            outputSection.style.display = 'block';
        }
    }

    /**
     * プロンプトを非表示
     */
    public hide(): void {
        const outputSection = getElementById<HTMLElement>('output-section');
        if (outputSection) {
            outputSection.style.display = 'none';
        }
        this.setEditMode(false);
    }

    /**
     * 編集モードの切り替え
     */
    public toggleEditMode(): void {
        const promptOutput = getElementById<HTMLTextAreaElement>('prompt-output');
        const editButton = getElementById<HTMLElement>('btn-edit');

        if (!promptOutput || !editButton) return;

        const isReadonly = promptOutput.hasAttribute('readonly');
        this.setEditMode(!isReadonly);
    }

    /**
     * 編集モードを設定
     */
    private setEditMode(isEditing: boolean): void {
        const promptOutput = getElementById<HTMLTextAreaElement>('prompt-output');
        const editButton = getElementById<HTMLElement>('btn-edit');

        if (!promptOutput || !editButton) return;

        if (isEditing) {
            promptOutput.removeAttribute('readonly');
            promptOutput.focus();
            editButton.textContent = '完了';
            toggleClass(editButton, 'editing', true);
        } else {
            promptOutput.setAttribute('readonly', '');
            editButton.textContent = '編集';
            toggleClass(editButton, 'editing', false);
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
     * @deprecated EventManagerに移動しました
     */
    public setupCopyButton(getCurrentPrompt: () => string): void {
        const copyButton = document.querySelector('.btn-copy');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const promptOutput = getElementById<HTMLTextAreaElement>('prompt-output');
                const prompt = promptOutput?.value || getCurrentPrompt();
                if (prompt) {
                    this.copyToClipboard(prompt);
                }
            });
        }
    }
}
