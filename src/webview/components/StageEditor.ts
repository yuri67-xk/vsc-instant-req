import type { Stage, Substage, TabType } from '../types/webview';
import { vscode } from '../utils/vscodeApi';

/**
 * ステージ設定エディタを管理するクラス
 */
export class StageEditor {
    private currentTabType: TabType = 'requirements';
    private requirementsStages: Stage[] = [];
    private issuesStages: Stage[] = [];
    private modal: HTMLElement | null = null;
    private stagesContainer: HTMLElement | null = null;

    constructor() {
        this.modal = document.getElementById('stage-settings-modal');
        this.stagesContainer = document.getElementById('stages-container');
    }

    /**
     * 初期化: イベントリスナーを設定
     */
    public initialize(): void {
        // モーダルボタンのイベントリスナー
        document.querySelector('.btn-close-modal')?.addEventListener('click', () => this.close());
        document.querySelector('.btn-modal-close')?.addEventListener('click', () => this.close());
        document.querySelector('.btn-modal-reset')?.addEventListener('click', () => this.resetToDefault());
        document.querySelector('.btn-modal-save')?.addEventListener('click', () => this.save());
        document.querySelector('.btn-add-stage')?.addEventListener('click', () => this.addStage());

        // Stageデータをロード
        vscode.loadStages();
    }

    /**
     * Stageデータを設定
     */
    public setStages(requirementsStages: Stage[], issuesStages: Stage[]): void {
        this.requirementsStages = requirementsStages;
        this.issuesStages = issuesStages;
    }

    /**
     * モーダルを開く
     */
    public open(tabType: TabType): void {
        this.currentTabType = tabType;
        this.render();
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    /**
     * モーダルを閉じる
     */
    public close(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * Stageを描画
     */
    private render(): void {
        if (!this.stagesContainer) return;

        this.stagesContainer.innerHTML = '';
        const stages = this.getCurrentStages();

        stages.forEach((stage, index) => {
            const stageCard = this.createStageCard(stage, index);
            this.stagesContainer.appendChild(stageCard);
        });
    }

    /**
     * Stageカードを作成
     */
    private createStageCard(stage: Stage, index: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'stage-card';
        card.draggable = true;

        // ヘッダー
        const header = document.createElement('div');
        header.className = 'stage-card-header';

        const number = document.createElement('div');
        number.className = 'stage-number';
        number.textContent = `ステージ ${index + 1}`;
        header.appendChild(number);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-stage';
        removeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
        removeBtn.addEventListener('click', () => this.removeStage(index));
        header.appendChild(removeBtn);

        card.appendChild(header);

        // メインコンテンツ
        const content = document.createElement('div');
        content.className = 'stage-content';

        const textarea = document.createElement('textarea');
        textarea.className = 'stage-main-textarea';
        textarea.value = stage.content;
        textarea.addEventListener('input', (e) => {
            stage.content = (e.target as HTMLTextAreaElement).value;
        });
        content.appendChild(textarea);

        // SubStages
        if (stage.substages && stage.substages.length > 0) {
            const substagesContainer = this.createSubstagesContainer(stage, index);
            content.appendChild(substagesContainer);
        }

        // SubStage追加ボタン
        const addSubstageBtn = document.createElement('button');
        addSubstageBtn.className = 'btn-add-substage';
        addSubstageBtn.innerHTML = '<i class="codicon codicon-add"></i> サブステージを追加';
        addSubstageBtn.addEventListener('click', () => this.addSubstage(index));
        content.appendChild(addSubstageBtn);

        card.appendChild(content);

        return card;
    }

    /**
     * SubStagesコンテナを作成
     */
    private createSubstagesContainer(stage: Stage, stageIndex: number): HTMLElement {
        const container = document.createElement('div');
        container.className = 'substages-container';

        stage.substages?.forEach((substage, substageIndex) => {
            const row = this.createSubstageRow(stage, stageIndex, substageIndex);
            container.appendChild(row);
        });

        return container;
    }

    /**
     * SubStage行を作成
     */
    private createSubstageRow(stage: Stage, stageIndex: number, substageIndex: number): HTMLElement {
        const row = document.createElement('div');
        row.className = 'substage-row';

        const textarea = document.createElement('textarea');
        textarea.className = 'substage-textarea';
        textarea.value = stage.substages?.[substageIndex]?.content || '';
        textarea.addEventListener('input', (e) => {
            if (stage.substages) {
                stage.substages[substageIndex].content = (e.target as HTMLTextAreaElement).value;
            }
        });
        row.appendChild(textarea);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-substage';
        removeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
        removeBtn.addEventListener('click', () => this.removeSubstage(stageIndex, substageIndex));
        row.appendChild(removeBtn);

        return row;
    }

    /**
     * Stageを追加
     */
    private addStage(): void {
        const stages = this.getCurrentStages();
        const newStage: Stage = {
            id: Date.now(),
            content: '',
            substages: []
        };
        stages.push(newStage);
        this.render();
    }

    /**
     * Stageを削除
     */
    private removeStage(index: number): void {
        const stages = this.getCurrentStages();
        stages.splice(index, 1);
        this.render();
    }

    /**
     * SubStageを追加
     */
    private addSubstage(stageIndex: number): void {
        const stages = this.getCurrentStages();
        const stage = stages[stageIndex];

        if (!stage.substages) {
            stage.substages = [];
        }

        const newSubstage: Substage = {
            id: Date.now(),
            content: ''
        };
        stage.substages.push(newSubstage);
        this.render();
    }

    /**
     * SubStageを削除
     */
    private removeSubstage(stageIndex: number, substageIndex: number): void {
        const stages = this.getCurrentStages();
        const stage = stages[stageIndex];

        if (stage.substages) {
            stage.substages.splice(substageIndex, 1);
            this.render();
        }
    }

    /**
     * 現在のタブのStagesを取得
     */
    private getCurrentStages(): Stage[] {
        return this.currentTabType === 'requirements'
            ? this.requirementsStages
            : this.issuesStages;
    }

    /**
     * 保存
     */
    private save(): void {
        const stages = this.getCurrentStages();
        vscode.saveStages(stages, this.currentTabType);
        this.close();

        // 保存後に再レンダリングを通知
        window.dispatchEvent(new CustomEvent('stagesSaved', {
            detail: { tabType: this.currentTabType, stages }
        }));
    }

    /**
     * デフォルトに戻す
     */
    private resetToDefault(): void {
        vscode.resetStages(this.currentTabType);
        this.close();
    }

    /**
     * 要件定義Stagesを取得
     */
    public getRequirementsStages(): Stage[] {
        return this.requirementsStages;
    }

    /**
     * 課題探索Stagesを取得
     */
    public getIssuesStages(): Stage[] {
        return this.issuesStages;
    }
}
