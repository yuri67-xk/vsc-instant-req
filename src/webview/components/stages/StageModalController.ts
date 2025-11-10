import type { TabType } from '../../types/webview';
import { getElementById, toggleDisplay } from '../../utils/domHelpers';

/**
 * ステージ設定モーダルの制御を担当するクラス
 */
export class StageModalController {
    private modal: HTMLElement | null = null;

    constructor() {
        this.modal = getElementById<HTMLElement>('stage-settings-modal');
    }

    /**
     * モーダルを開く
     */
    public open(): void {
        if (this.modal) {
            toggleDisplay(this.modal, true);
            this.modal.style.display = 'flex';
        }
    }

    /**
     * モーダルを閉じる
     */
    public close(): void {
        if (this.modal) {
            toggleDisplay(this.modal, false);
        }
    }

    /**
     * モーダルイベントリスナーを設定
     */
    public setupEventListeners(
        onClose: () => void,
        onReset: () => void,
        onSave: () => void,
        onAddStage: () => void
    ): void {
        document.querySelector('.btn-close-modal')?.addEventListener('click', onClose);
        document.querySelector('.btn-modal-close')?.addEventListener('click', onClose);
        document.querySelector('.btn-modal-reset')?.addEventListener('click', onReset);
        document.querySelector('.btn-modal-save')?.addEventListener('click', onSave);
        document.querySelector('.btn-add-stage')?.addEventListener('click', onAddStage);
    }

    /**
     * 保存完了イベントを発火
     */
    public dispatchSaveEvent(tabType: TabType, stages: any[]): void {
        window.dispatchEvent(new CustomEvent('stagesSaved', {
            detail: { tabType, stages }
        }));
    }
}
