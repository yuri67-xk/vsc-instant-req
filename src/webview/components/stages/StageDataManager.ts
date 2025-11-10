import type { Stage, Substage, TabType } from '../../types/webview';

/**
 * ステージデータの管理とCRUD操作を担当するクラス
 */
export class StageDataManager {
    private requirementsStages: Stage[] = [];
    private issuesStages: Stage[] = [];
    private currentTabType: TabType = 'requirements';

    /**
     * 現在のタブタイプを設定
     */
    public setCurrentTabType(tabType: TabType): void {
        this.currentTabType = tabType;
    }

    /**
     * ステージデータを設定
     */
    public setStages(requirementsStages: Stage[], issuesStages: Stage[]): void {
        this.requirementsStages = requirementsStages;
        this.issuesStages = issuesStages;
    }

    /**
     * 現在のタブのステージを取得
     */
    public getCurrentStages(): Stage[] {
        return this.currentTabType === 'requirements'
            ? this.requirementsStages
            : this.issuesStages;
    }

    /**
     * 要件定義ステージを取得
     */
    public getRequirementsStages(): Stage[] {
        return this.requirementsStages;
    }

    /**
     * 課題探索ステージを取得
     */
    public getIssuesStages(): Stage[] {
        return this.issuesStages;
    }

    /**
     * ステージを追加
     */
    public addStage(): void {
        const stages = this.getCurrentStages();
        const newStage: Stage = {
            id: Date.now(),
            content: '',
            substages: []
        };
        stages.push(newStage);
    }

    /**
     * ステージを削除
     */
    public removeStage(index: number): void {
        const stages = this.getCurrentStages();
        stages.splice(index, 1);
    }

    /**
     * サブステージを追加
     */
    public addSubstage(stageIndex: number): void {
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
    }

    /**
     * サブステージを削除
     */
    public removeSubstage(stageIndex: number, substageIndex: number): void {
        const stages = this.getCurrentStages();
        const stage = stages[stageIndex];

        if (stage.substages) {
            stage.substages.splice(substageIndex, 1);
        }
    }
}
