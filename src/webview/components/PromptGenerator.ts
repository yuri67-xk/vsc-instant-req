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
        const promptOutput = document.getElementById('prompt-output');

        if (outputSection && promptOutput) {
            promptOutput.textContent = prompt;
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
                const prompt = getCurrentPrompt();
                if (prompt) {
                    this.copyToClipboard(prompt);
                }
            });
        }
    }
}
