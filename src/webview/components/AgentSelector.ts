import type { Settings, Stage, Agent, TabType } from '../types/webview';

interface DynamicAgentInfo {
    key: string;
    label: string;
    agentList: Agent[];
}

/**
 * 動的エージェント選択UIを管理するクラス
 */
export class AgentSelector {
    private settings: Settings;
    private dynamicAgents: Map<string, DynamicAgentInfo> = new Map();
    private recentAgents: string[] = [];

    constructor(settings: Settings) {
        this.settings = settings;
    }

    /**
     * 最近使用したエージェントを設定
     */
    public setRecentAgents(recentAgents: string[]): void {
        this.recentAgents = recentAgents;
    }

    /**
     * 動的エージェント情報を検出して保存
     */
    public detectDynamicAgents(stages: Stage[]): void {
        this.dynamicAgents.clear();
        const agentPlaceholderPattern = /\{(agent-[^}]+)\}/g;

        stages.forEach(stage => {
            // メインステージ
            const mainMatches = stage.content.matchAll(agentPlaceholderPattern);
            for (const match of mainMatches) {
                this.addDynamicAgent(match[1]);
            }

            // サブステージ
            if (stage.substages) {
                stage.substages.forEach(substage => {
                    const subMatches = substage.content.matchAll(agentPlaceholderPattern);
                    for (const match of subMatches) {
                        this.addDynamicAgent(match[1]);
                    }
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
        const mapping: Record<string, { key: string; label: string; getList: (s: Settings) => Agent[] }> = {
            'agent-仕様設計担当': { key: 'specWriters', label: '仕様設計担当', getList: s => s.agents.specWriters },
            'agent-実装担当': { key: 'implementers', label: '実装担当', getList: s => s.agents.implementers },
            'agent-探索担当': { key: 'issueExplorers', label: '探索担当', getList: s => s.agents.issueExplorers },
            'agent-コードレビュー担当': { key: 'codeReviewers', label: 'コードレビュー担当', getList: s => s.agents.codeReviewers }
        };

        const info = mapping[placeholder];
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
     * 動的エージェント選択UIを描画
     */
    public render(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        this.dynamicAgents.forEach((agentInfo, placeholder) => {
            const group = this.createAgentSelectGroup(placeholder, agentInfo);
            container.appendChild(group);
        });
    }

    /**
     * エージェント選択グループを作成
     */
    private createAgentSelectGroup(placeholder: string, agentInfo: DynamicAgentInfo): HTMLElement {
        const group = document.createElement('div');
        group.className = 'select-group';

        const label = document.createElement('label');
        label.className = 'select-label';
        label.textContent = agentInfo.label;
        group.appendChild(label);

        const select = document.createElement('select');
        select.className = 'agent-select';
        select.id = `dynamic-${placeholder}`;

        // デフォルトオプション
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '選択してください';
        select.appendChild(defaultOption);

        // 最近使用したエージェント（存在する場合）
        if (this.recentAgents.length > 0) {
            const recentHeader = document.createElement('option');
            recentHeader.disabled = true;
            recentHeader.textContent = '最近使用';
            select.appendChild(recentHeader);

            this.recentAgents.forEach(agentId => {
                const option = document.createElement('option');
                option.value = agentId;
                option.textContent = `  ${agentId}`;
                select.appendChild(option);
            });

            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '────────────';
            select.appendChild(separator);
        }

        // エージェントオプション
        if (agentInfo.agentList.length > 0) {
            const presetHeader = document.createElement('option');
            presetHeader.disabled = true;
            presetHeader.textContent = 'プリセット';
            select.appendChild(presetHeader);

            agentInfo.agentList.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = `  ${agent.name}`;
                select.appendChild(option);
            });
        }

        // カスタムオプション
        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = 'カスタム';
        select.appendChild(customOption);

        // デフォルトで最初のエージェントを選択（リストが存在する場合）
        if (agentInfo.agentList.length > 0) {
            select.value = agentInfo.agentList[0].id;
        }

        select.addEventListener('change', () => {
            this.handleAgentSelect(placeholder);
        });

        group.appendChild(select);

        // 手動入力フォーム
        const manualWrapper = document.createElement('div');
        manualWrapper.className = 'manual-input-wrapper';
        manualWrapper.id = `manual-wrapper-${placeholder}`;
        manualWrapper.style.display = 'none';

        const manualLabel = document.createElement('label');
        manualLabel.className = 'manual-label';
        manualLabel.textContent = 'カスタムエージェント名 (@で始まる名前):';
        manualWrapper.appendChild(manualLabel);

        const manualInput = document.createElement('input');
        manualInput.type = 'text';
        manualInput.className = 'agent-manual-input';
        manualInput.id = `dynamic-${placeholder}-manual`;
        manualInput.placeholder = '@agent-custom-name';
        manualWrapper.appendChild(manualInput);

        group.appendChild(manualWrapper);

        return group;
    }

    /**
     * エージェント選択変更時の処理
     */
    private handleAgentSelect(placeholder: string): void {
        const selectElement = document.getElementById(`dynamic-${placeholder}`) as HTMLSelectElement;
        const manualWrapper = document.getElementById(`manual-wrapper-${placeholder}`) as HTMLElement;
        const manualInput = document.getElementById(`dynamic-${placeholder}-manual`) as HTMLInputElement;

        if (!selectElement || !manualWrapper || !manualInput) return;

        const selectValue = selectElement.value;

        if (selectValue === '__custom__') {
            manualWrapper.style.display = 'block';
            manualInput.focus();
        } else {
            manualWrapper.style.display = 'none';
            manualInput.value = '';
        }
    }

    /**
     * 選択されたエージェント値を取得
     */
    public getAgentValue(placeholder: string): string | null {
        const selectElement = document.getElementById(`dynamic-${placeholder}`) as HTMLSelectElement;
        const manualInput = document.getElementById(`dynamic-${placeholder}-manual`) as HTMLInputElement;

        if (!selectElement) return null;

        const selectValue = selectElement.value;

        if (selectValue === '__custom__') {
            const manualValue = manualInput?.value.trim();
            if (manualValue) {
                return manualValue.startsWith('@') ? manualValue : '@' + manualValue;
            }
            return null;
        } else if (selectValue) {
            return selectValue;
        }

        return null;
    }

    /**
     * 全てのエージェント値を取得
     */
    public getAllAgentValues(): Map<string, string> {
        const values = new Map<string, string>();

        this.dynamicAgents.forEach((_, placeholder) => {
            const value = this.getAgentValue(placeholder);
            if (value) {
                values.set(placeholder, value);
            }
        });

        return values;
    }

    /**
     * 全ての選択をクリア
     */
    public clearAll(): void {
        this.dynamicAgents.forEach((_, placeholder) => {
            const select = document.getElementById(`dynamic-${placeholder}`) as HTMLSelectElement;
            const manual = document.getElementById(`dynamic-${placeholder}-manual`) as HTMLInputElement;
            const manualWrapper = document.getElementById(`manual-wrapper-${placeholder}`) as HTMLElement;

            if (select) select.selectedIndex = 0;
            if (manual) manual.value = '';
            if (manualWrapper) manualWrapper.style.display = 'none';
        });
    }

    /**
     * 検出された動的エージェントの数を取得
     */
    public getAgentCount(): number {
        return this.dynamicAgents.size;
    }
}
