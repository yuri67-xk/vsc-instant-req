import type { DynamicAgentInfo } from './AgentDataManager';

/**
 * エージェント選択UIを構築するクラス
 */
export class AgentUIBuilder {
    private recentAgents: string[] = [];

    /**
     * 最近使用したエージェントを設定
     */
    public setRecentAgents(recentAgents: string[]): void {
        this.recentAgents = recentAgents;
    }

    /**
     * エージェント選択グループを作成
     */
    public createAgentSelectGroup(
        placeholder: string,
        agentInfo: DynamicAgentInfo,
        onSelectChange: (placeholder: string) => void
    ): HTMLElement {
        const group = document.createElement('div');
        group.className = 'select-group';

        // ラベル
        const label = document.createElement('label');
        label.className = 'select-label';
        label.textContent = agentInfo.label;
        group.appendChild(label);

        // セレクトボックス
        const select = this.createSelectElement(placeholder, agentInfo);
        select.addEventListener('change', () => onSelectChange(placeholder));
        group.appendChild(select);

        // 手動入力フォーム
        const manualWrapper = this.createManualInputWrapper(placeholder);
        group.appendChild(manualWrapper);

        return group;
    }

    /**
     * セレクトボックスを作成
     */
    private createSelectElement(placeholder: string, agentInfo: DynamicAgentInfo): HTMLSelectElement {
        const select = document.createElement('select');
        select.className = 'agent-select';
        select.id = `dynamic-${placeholder}`;

        // デフォルトオプション
        this.appendOption(select, '', '選択してください');

        // 最近使用したエージェント
        if (this.recentAgents.length > 0) {
            this.appendRecentAgentsOptions(select);
        }

        // プリセットエージェント
        if (agentInfo.agentList.length > 0) {
            this.appendPresetAgentsOptions(select, agentInfo);
            // デフォルトで最初のエージェントを選択
            select.value = agentInfo.agentList[0].id;
        }

        // カスタムオプション
        this.appendOption(select, '__custom__', 'カスタム');

        return select;
    }

    /**
     * 最近使用したエージェントオプションを追加
     */
    private appendRecentAgentsOptions(select: HTMLSelectElement): void {
        this.appendOption(select, '', '最近使用', true);

        this.recentAgents.forEach(agentId => {
            this.appendOption(select, agentId, `  ${agentId}`);
        });

        this.appendOption(select, '', '────────────', true);
    }

    /**
     * プリセットエージェントオプションを追加
     */
    private appendPresetAgentsOptions(select: HTMLSelectElement, agentInfo: DynamicAgentInfo): void {
        this.appendOption(select, '', 'プリセット', true);

        agentInfo.agentList.forEach(agent => {
            this.appendOption(select, agent.id, `  ${agent.name}`);
        });
    }

    /**
     * オプションを追加するヘルパー
     */
    private appendOption(
        select: HTMLSelectElement,
        value: string,
        text: string,
        disabled: boolean = false
    ): void {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        if (disabled) {
            option.disabled = true;
        }
        select.appendChild(option);
    }

    /**
     * 手動入力ラッパーを作成
     */
    private createManualInputWrapper(placeholder: string): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'manual-input-wrapper';
        wrapper.id = `manual-wrapper-${placeholder}`;
        wrapper.style.display = 'none';

        // ラベル
        const label = document.createElement('label');
        label.className = 'manual-label';
        label.textContent = 'カスタムエージェント名 (@で始まる名前):';
        wrapper.appendChild(label);

        // 入力フィールド
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'agent-manual-input';
        input.id = `dynamic-${placeholder}-manual`;
        input.placeholder = '@agent-custom-name';
        wrapper.appendChild(input);

        return wrapper;
    }
}
