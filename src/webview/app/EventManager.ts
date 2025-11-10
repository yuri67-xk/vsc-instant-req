import type { TabType } from '../types/webview';
import { querySelectorAll } from '../utils/domHelpers';

/**
 * イベント管理を担当するクラス
 */
export class EventManager {
    /**
     * プロンプト発行ボタンのイベントリスナーを設定
     */
    public setupGeneratePromptButtons(onGenerate: () => void): void {
        const primaryButtons = querySelectorAll<HTMLButtonElement>('.btn-primary');
        primaryButtons.forEach(button => {
            button.addEventListener('click', onGenerate);
        });
    }

    /**
     * 編集ボタンのイベントリスナーを設定
     */
    public setupEditButton(onToggleEdit: () => void): void {
        const editButton = document.getElementById('btn-edit');
        if (editButton) {
            editButton.addEventListener('click', onToggleEdit);
        }
    }

    /**
     * CLEARボタンのイベントリスナーを設定
     */
    public setupClearButtons(onClear: () => void): void {
        const secondaryButtons = querySelectorAll<HTMLButtonElement>('.btn-secondary');
        secondaryButtons.forEach(button => {
            if (button.textContent?.includes('CLEAR')) {
                button.addEventListener('click', onClear);
            }
        });
    }

    /**
     * ステージ設定ボタンのイベントリスナーを設定
     */
    public setupStageSettingsButtons(onOpenSettings: (tabType: TabType) => void): void {
        querySelectorAll<HTMLButtonElement>('.btn-settings').forEach(btn => {
            btn.addEventListener('click', () => {
                // ここで現在のタブを取得する必要がある（外部から渡される）
                onOpenSettings('requirements'); // デフォルト値
            });
        });
    }

    /**
     * ステージ保存イベントのリスナーを設定
     */
    public setupStagesSavedListener(onStagesSaved: (tabType: TabType, stages: any[]) => void): void {
        window.addEventListener('stagesSaved', ((event: CustomEvent) => {
            const { tabType, stages } = event.detail;
            onStagesSaved(tabType, stages);
        }) as EventListener);
    }

    /**
     * コピーボタンのイベントリスナーを設定
     */
    public setupCopyButton(getCurrentPrompt: () => string, onCopy: (prompt: string) => void): void {
        const copyButton = document.querySelector('.btn-copy');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const promptOutput = document.getElementById('prompt-output') as HTMLTextAreaElement;
                const prompt = promptOutput?.value || getCurrentPrompt();
                if (prompt) {
                    onCopy(prompt);
                }
            });
        }
    }
}
