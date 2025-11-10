import type { Settings } from './types/webview';
import { TabManager } from './components/TabManager';
import { AgentSelector } from './components/AgentSelector';
import { StageEditor } from './components/StageEditor';
import { PromptGenerator } from './components/PromptGenerator';
import { RequirementsManager } from './components/RequirementsManager';
import { IssuesManager } from './components/IssuesManager';
import { EventManager } from './app/EventManager';
import { MessageHandler } from './app/MessageHandler';
import { vscode } from './utils/vscodeApi';

// グローバル設定（HTMLから注入される）
declare global {
    interface Window {
        INSTANT_REQ_SETTINGS: Settings;
    }
}

/**
 * アプリケーションクラス（リファクタリング版）
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

    // 管理クラス
    private eventManager: EventManager;
    private messageHandler: MessageHandler;

    // 設定と状態
    private settings: Settings;
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

        // 管理クラスの初期化
        this.eventManager = new EventManager();
        this.messageHandler = new MessageHandler(
            this.requirementsAgentSelector,
            this.issuesAgentSelector,
            this.stageEditor
        );
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

        // メッセージリスナーの設定
        this.messageHandler.setupMessageListener();

        console.log('Instant Req initialized');
    }

    /**
     * イベントリスナーの設定
     */
    private setupEventListeners(): void {
        this.eventManager.setupGeneratePromptButtons(() => this.generatePrompt());
        this.eventManager.setupEditButton(() => this.promptGenerator.toggleEditMode());
        this.eventManager.setupClearButtons(() => this.clearAll());
        this.eventManager.setupStageSettingsButtons(
            () => this.tabManager.getCurrentTab(),
            (tabType) => this.stageEditor.open(tabType)
        );
        this.eventManager.setupStagesSavedListener((tabType, stages) => {
            this.updateAgentSelectors(tabType);
        });
        this.eventManager.setupCopyButton(
            () => this.currentPrompt,
            (prompt) => this.promptGenerator.copyToClipboard(prompt)
        );
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

            this.saveSelectedAgentsToHistory(dynamicAgents);
            this.currentPrompt = this.promptGenerator.generate(requirements, stages, dynamicAgents);
        } else {
            const issues = this.issuesManager.getIssues();
            const stages = this.stageEditor.getIssuesStages();
            const dynamicAgents = this.issuesAgentSelector.getAllAgentValues();

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
