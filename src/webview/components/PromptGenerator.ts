import type { Stage } from '../types/webview';
import { vscode } from '../utils/vscodeApi';

/**
 * プロンプト生成を担当するクラス
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

        // アイテム（要件または課題）を追加
        items.forEach((item, index) => {
            if (item.trim()) {
                prompt += `${index + 1}. ${item.trim()}\n`;
            }
        });

        prompt += '\n';

        // Stagesを追加
        stages.forEach(stage => {
            let stageContent = stage.content;

            // 動的エージェントのプレースホルダーを置換
            dynamicAgents.forEach((agentValue, placeholder) => {
                const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                stageContent = stageContent.replace(regex, agentValue);
            });

            prompt += `${stageContent}\n`;

            // SubStagesを追加
            if (stage.substages && stage.substages.length > 0) {
                stage.substages.forEach(substage => {
                    let substageContent = substage.content;

                    // 動的エージェントのプレースホルダーを置換
                    dynamicAgents.forEach((agentValue, placeholder) => {
                        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                        substageContent = substageContent.replace(regex, agentValue);
                    });

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
