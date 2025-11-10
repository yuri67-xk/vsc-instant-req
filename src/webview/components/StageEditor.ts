import type { Stage, TabType } from '../types/webview';
import { vscode } from '../utils/vscodeApi';
import { StageDataManager } from './stages/StageDataManager';
import { StageUIBuilder } from './stages/StageUIBuilder';
import { StageModalController } from './stages/StageModalController';
import { getElementById } from '../utils/domHelpers';

/**
 * ステージ設定エディタを管理するファサードクラス
 * 内部的には3つのクラスに責務を分離
 */
export class StageEditor {
    private dataManager: StageDataManager;
    private uiBuilder: StageUIBuilder;
    private modalController: StageModalController;
    private stagesContainer: HTMLElement | null = null;

    constructor() {
        this.dataManager = new StageDataManager();
        this.uiBuilder = new StageUIBuilder();
        this.modalController = new StageModalController();
        this.stagesContainer = getElementById<HTMLElement>('stages-container');
    }

    /**
     * 初期化: イベントリスナーを設定
     */
    public initialize(): void {
        this.modalController.setupEventListeners(
            () => this.close(),
            () => this.resetToDefault(),
            () => this.save(),
            () => this.addStage()
        );

        // ステージデータをロード
        vscode.loadStages();
    }

    /**
     * ステージデータを設定
     */
    public setStages(requirementsStages: Stage[], issuesStages: Stage[]): void {
        this.dataManager.setStages(requirementsStages, issuesStages);
    }

    /**
     * モーダルを開く
     */
    public open(tabType: TabType): void {
        this.dataManager.setCurrentTabType(tabType);
        this.render();
        this.modalController.open();
    }

    /**
     * モーダルを閉じる
     */
    public close(): void {
        this.modalController.close();
    }

    /**
     * ステージを描画
     */
    private render(): void {
        if (!this.stagesContainer) return;

        this.stagesContainer.innerHTML = '';
        const stages = this.dataManager.getCurrentStages();

        stages.forEach((stage, index) => {
            const stageCard = this.uiBuilder.createStageCard(
                stage,
                index,
                (idx) => this.removeStage(idx),
                (idx, content) => this.updateStageContent(idx, content),
                (idx) => this.addSubstage(idx)
            );
            this.stagesContainer!.appendChild(stageCard);
        });
    }

    /**
     * ステージコンテンツを更新
     */
    private updateStageContent(index: number, content: string): void {
        const stages = this.dataManager.getCurrentStages();
        stages[index].content = content;
    }

    /**
     * ステージを追加
     */
    private addStage(): void {
        this.dataManager.addStage();
        this.render();
    }

    /**
     * ステージを削除
     */
    private removeStage(index: number): void {
        this.dataManager.removeStage(index);
        this.render();
    }

    /**
     * サブステージを追加
     */
    private addSubstage(stageIndex: number): void {
        this.dataManager.addSubstage(stageIndex);
        this.render();
    }

    /**
     * 保存
     */
    private save(): void {
        const stages = this.dataManager.getCurrentStages();
        const currentTabType = this.dataManager['currentTabType'];

        vscode.saveStages(stages, currentTabType);
        this.close();

        // 保存後に再レンダリングを通知
        this.modalController.dispatchSaveEvent(currentTabType, stages);
    }

    /**
     * デフォルトに戻す
     */
    private resetToDefault(): void {
        const currentTabType = this.dataManager['currentTabType'];
        vscode.resetStages(currentTabType);
        this.close();
    }

    /**
     * 要件定義ステージを取得
     */
    public getRequirementsStages(): Stage[] {
        return this.dataManager.getRequirementsStages();
    }

    /**
     * 課題探索ステージを取得
     */
    public getIssuesStages(): Stage[] {
        return this.dataManager.getIssuesStages();
    }
}
