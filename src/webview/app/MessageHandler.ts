import type { StagesLoadedMessage } from '../types/webview';
import { AgentSelector } from '../components/AgentSelector';
import { StageEditor } from '../components/StageEditor';

/**
 * Webviewメッセージハンドリングを担当するクラス
 */
export class MessageHandler {
    constructor(
        private requirementsAgentSelector: AgentSelector,
        private issuesAgentSelector: AgentSelector,
        private stageEditor: StageEditor
    ) {}

    /**
     * メッセージリスナーを設定
     */
    public setupMessageListener(): void {
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
}
