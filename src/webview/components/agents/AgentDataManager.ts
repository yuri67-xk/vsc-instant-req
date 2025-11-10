import type { Settings, Stage, Agent } from '../../types/webview';
import { extractPlaceholders } from '../../utils/placeholderReplacer';

export interface DynamicAgentInfo {
    key: string;
    label: string;
    agentList: Agent[];
}

/**
 * 動的エージェントデータを管理するクラス
 */
export class AgentDataManager {
    private settings: Settings;
    private dynamicAgents: Map<string, DynamicAgentInfo> = new Map();
    private agentMapping: Record<string, { key: string; label: string; getList: (s: Settings) => Agent[] }>;

    constructor(settings: Settings) {
        this.settings = settings;
        this.agentMapping = {
            'agent-仕様設計担当': {
                key: 'specWriters',
                label: '仕様設計担当',
                getList: s => s.agents.specWriters
            },
            'agent-実装担当': {
                key: 'implementers',
                label: '実装担当',
                getList: s => s.agents.implementers
            },
            'agent-探索担当': {
                key: 'issueExplorers',
                label: '探索担当',
                getList: s => s.agents.issueExplorers
            },
            'agent-コードレビュー担当': {
                key: 'codeReviewers',
                label: 'コードレビュー担当',
                getList: s => s.agents.codeReviewers
            }
        };
    }

    /**
     * ステージから動的エージェント情報を検出
     */
    public detectDynamicAgents(stages: Stage[]): void {
        this.dynamicAgents.clear();

        stages.forEach(stage => {
            // メインステージから抽出
            const mainPlaceholders = extractPlaceholders(stage.content);
            mainPlaceholders.forEach(placeholder => this.addDynamicAgent(placeholder));

            // サブステージから抽出
            if (stage.substages) {
                stage.substages.forEach(substage => {
                    const subPlaceholders = extractPlaceholders(substage.content);
                    subPlaceholders.forEach(placeholder => this.addDynamicAgent(placeholder));
                });
            }
        });
    }

    /**
     * 動的エージェント情報を追加
     */
    private addDynamicAgent(placeholder: string): void {
        if (this.dynamicAgents.has(placeholder)) {
            return;
        }

        const agentInfo = this.getAgentInfoFromPlaceholder(placeholder);
        if (agentInfo) {
            this.dynamicAgents.set(placeholder, agentInfo);
        }
    }

    /**
     * プレースホルダーからエージェント情報を取得
     */
    private getAgentInfoFromPlaceholder(placeholder: string): DynamicAgentInfo | null {
        const info = this.agentMapping[placeholder];
        if (info) {
            return {
                key: info.key,
                label: info.label,
                agentList: info.getList(this.settings)
            };
        }
        return null;
    }

    /**
     * 全ての動的エージェント情報を取得
     */
    public getAllDynamicAgents(): Map<string, DynamicAgentInfo> {
        return this.dynamicAgents;
    }

    /**
     * 検出された動的エージェントの数を取得
     */
    public getAgentCount(): number {
        return this.dynamicAgents.size;
    }
}
