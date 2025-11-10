import type { Settings, StagesLoadedMessage } from './types/webview';
import { TabManager } from './components/TabManager';
import { AgentSelector } from './components/AgentSelector';
import { StageEditor } from './components/StageEditor';
import { PromptGenerator } from './components/PromptGenerator';
import { RequirementsManager } from './components/RequirementsManager';
import { IssuesManager } from './components/IssuesManager';
import { vscode } from './utils/vscodeApi';

// グローバル設定（HTMLから注入される）
declare global {
    interface Window {
        INSTANT_REQ_SETTINGS: Settings;
    }
}

/**
 * アプリケーションクラス
 */
class InstantReqApp {
    // コンポーネント
    private tabManager: TabManager;
    private requirementsAgentSelector: AgentSelector;
    private issuesAgentSelector: AgentSelector;
    private stageEditor: StageEditor;
    private promptGenerator: PromptGenerator;
    private requirementsManager: RequirementsManager;
    private issuesManager: IssuesManager;

    // 設定
    private settings: Settings;

    // 現在のプロンプト
    private currentPrompt: string = '';

    constructor() {
        this.settings = window.INSTANT_REQ_SETTINGS;

        // コンポーネントの初期化
        this.tabManager = new TabManager();
        this.requirementsAgentSelector = new AgentSelector(this.settings);
        this.issuesAgentSelector = new AgentSelector(this.settings);
        this.stageEditor = new StageEditor();
        this.promptGenerator = new PromptGenerator();
        this.requirementsManager = new RequirementsManager();
        this.issuesManager = new IssuesManager();
    }

    /**
     * アプリケーション初期化
     */
    public initialize(): void {
        // コンポーネントの初期化
        this.tabManager.initialize();
        this.requirementsManager.initialize();
        this.issuesManager.initialize();
        this.stageEditor.initialize();

        // イベントリスナーの設定
        this.setupEventListeners();
        this.setupMessageListener();

        console.log('Instant Req initialized');
    }

    /**
     * イベントリスナーの設定
     */
    private setupEventListeners(): void {
        // プロンプト発行ボタン
        const primaryButtons = document.querySelectorAll('.btn-primary');
        primaryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.generatePrompt();
            });
        });

        // 編集ボタン
        const editButton = document.getElementById('btn-edit');
        if (editButton) {
            editButton.addEventListener('click', () => {
                this.promptGenerator.toggleEditMode();
            });
        }

        // CLEARボタン
        const secondaryButtons = document.querySelectorAll('.btn-secondary');
        secondaryButtons.forEach(button => {
            const buttonElement = button as HTMLButtonElement;
            if (buttonElement.textContent?.includes('CLEAR')) {
                buttonElement.addEventListener('click', () => {
                    this.clearAll();
                });
            }
        });

        // ステージ設定ボタン
        document.querySelectorAll('.btn-settings').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentTab = this.tabManager.getCurrentTab();
                this.stageEditor.open(currentTab);
            });
        });

        // ステージ保存時のイベント
        window.addEventListener('stagesSaved', ((event: CustomEvent) => {
            const { tabType, stages } = event.detail;
            this.updateAgentSelectors(tabType);
        }) as EventListener);

        // コピーボタン
        this.promptGenerator.setupCopyButton(() => this.currentPrompt);
    }

    /**
     * メッセージリスナーの設定
     */
    private setupMessageListener(): void {
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'stagesLoaded':
                    this.handleStagesLoaded(message as StagesLoadedMessage);
                    break;
            }
        });
    }

    /**
     * Stagesロード時の処理
     */
    private handleStagesLoaded(message: StagesLoadedMessage): void {
        // 最近使用したエージェントを設定
        if (message.recentAgents) {
            this.requirementsAgentSelector.setRecentAgents(message.recentAgents);
            this.issuesAgentSelector.setRecentAgents(message.recentAgents);
        }

        if (message.requirementsStages && message.issuesStages) {
            this.stageEditor.setStages(message.requirementsStages, message.issuesStages);

            // エージェントセレクターを更新
            this.requirementsAgentSelector.detectDynamicAgents(message.requirementsStages);
            this.requirementsAgentSelector.render('dynamic-agents-container');

            this.issuesAgentSelector.detectDynamicAgents(message.issuesStages);
            this.issuesAgentSelector.render('issues-dynamic-agents-container');
        }
    }

    /**
     * エージェントセレクターを更新
     */
    private updateAgentSelectors(tabType: 'requirements' | 'issues'): void {
        if (tabType === 'requirements') {
            const stages = this.stageEditor.getRequirementsStages();
            this.requirementsAgentSelector.detectDynamicAgents(stages);
            this.requirementsAgentSelector.render('dynamic-agents-container');
        } else {
            const stages = this.stageEditor.getIssuesStages();
            this.issuesAgentSelector.detectDynamicAgents(stages);
            this.issuesAgentSelector.render('issues-dynamic-agents-container');
        }
    }

    /**
     * プロンプトを生成
     */
    private generatePrompt(): void {
        const currentTab = this.tabManager.getCurrentTab();

        if (currentTab === 'requirements') {
            const requirements = this.requirementsManager.getRequirements();
            const stages = this.stageEditor.getRequirementsStages();
            const dynamicAgents = this.requirementsAgentSelector.getAllAgentValues();

            // 選択されたカスタムエージェントを履歴に保存
            this.saveSelectedAgentsToHistory(dynamicAgents);

            this.currentPrompt = this.promptGenerator.generate(requirements, stages, dynamicAgents);
        } else {
            const issues = this.issuesManager.getIssues();
            const stages = this.stageEditor.getIssuesStages();
            const dynamicAgents = this.issuesAgentSelector.getAllAgentValues();

            // 選択されたカスタムエージェントを履歴に保存
            this.saveSelectedAgentsToHistory(dynamicAgents);

            this.currentPrompt = this.promptGenerator.generate(issues, stages, dynamicAgents);
        }

        if (this.currentPrompt) {
            this.promptGenerator.display(this.currentPrompt);
        }
    }

    /**
     * 選択されたエージェントを履歴に保存
     */
    private saveSelectedAgentsToHistory(dynamicAgents: Map<string, string>): void {
        dynamicAgents.forEach(agentId => {
            // カスタムエージェント（@で始まる）のみ履歴に保存
            if (agentId.startsWith('@')) {
                vscode.saveRecentAgent(agentId);
            }
        });
    }

    /**
     * 全てをクリア
     */
    private clearAll(): void {
        const currentTab = this.tabManager.getCurrentTab();

        if (currentTab === 'requirements') {
            this.requirementsManager.clearAll();
            this.requirementsAgentSelector.clearAll();
        } else {
            this.issuesManager.clearAll();
            this.issuesAgentSelector.clearAll();
        }

        this.promptGenerator.hide();
        this.currentPrompt = '';
    }
}

// アプリケーション起動
window.addEventListener('DOMContentLoaded', () => {
    const app = new InstantReqApp();
    app.initialize();
});
