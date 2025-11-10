import type { Settings, Stage } from '../types/webview';
import { AgentDataManager } from './agents/AgentDataManager';
import { AgentUIBuilder } from './agents/AgentUIBuilder';
import { AgentValueHandler } from './agents/AgentValueHandler';

/**
 * 動的エージェント選択UIを管理するファサードクラス
 * 内部的には3つのクラスに責務を分離
 */
export class AgentSelector {
    private dataManager: AgentDataManager;
    private uiBuilder: AgentUIBuilder;
    private valueHandler: AgentValueHandler;

    constructor(settings: Settings) {
        this.dataManager = new AgentDataManager(settings);
        this.uiBuilder = new AgentUIBuilder();
        this.valueHandler = new AgentValueHandler();
    }

    /**
     * 最近使用したエージェントを設定
     */
    public setRecentAgents(recentAgents: string[]): void {
        this.uiBuilder.setRecentAgents(recentAgents);
    }

    /**
     * 動的エージェント情報を検出して保存
     */
    public detectDynamicAgents(stages: Stage[]): void {
        this.dataManager.detectDynamicAgents(stages);
    }

    /**
     * 動的エージェント選択UIを描画
     */
    public render(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 既存の値を保存
        const existingValues = this.valueHandler.getAllAgentValues(
            this.dataManager.getAllDynamicAgents().keys()
        );

        container.innerHTML = '';

        const dynamicAgents = this.dataManager.getAllDynamicAgents();
        dynamicAgents.forEach((agentInfo, placeholder) => {
            const group = this.uiBuilder.createAgentSelectGroup(
                placeholder,
                agentInfo,
                (ph) => this.valueHandler.handleSelectChange(ph)
            );
            container.appendChild(group);
        });

        // 既存の値を復元
        existingValues.forEach((value, placeholder) => {
            this.valueHandler.setAgentValue(placeholder, value);
        });
    }

    /**
     * 選択されたエージェント値を取得
     */
    public getAgentValue(placeholder: string): string | null {
        return this.valueHandler.getAgentValue(placeholder);
    }

    /**
     * 全てのエージェント値を取得
     */
    public getAllAgentValues(): Map<string, string> {
        const placeholders = this.dataManager.getAllDynamicAgents().keys();
        return this.valueHandler.getAllAgentValues(placeholders);
    }

    /**
     * 全ての選択をクリア
     */
    public clearAll(): void {
        const placeholders = this.dataManager.getAllDynamicAgents().keys();
        this.valueHandler.clearAll(placeholders);
    }

    /**
     * 検出された動的エージェントの数を取得
     */
    public getAgentCount(): number {
        return this.dataManager.getAgentCount();
    }
}
