// Re-export types from settings
export type {
    Agent,
    Substage,
    Stage,
    PromptTemplate,
    IssueTemplate,
    AgentSettings,
    Settings,
    WebviewMessage,
    StagesLoadedMessage
} from '../../types/settings';

// VSCode API types
export interface VscodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Tab types
export type TabType = 'requirements' | 'issues';
export type NestedTabType = 'input' | 'agents';

// Agent selector types
export type AgentKey = 'specWriters' | 'implementers' | 'issueExplorers' |
                       'systemArchitects' | 'seniorEngineers' | 'codeReviewers';

// Dynamic agent information
export interface DynamicAgentInfo {
    key: AgentKey;
    label: string;
    agentList: any[];
}

// Stage editor types
export interface StageEditorState {
    currentTabType: TabType;
    requirementsStages: import('../../types/settings').Stage[];
    issuesStages: import('../../types/settings').Stage[];
}

// Prompt generator types
export interface PromptContext {
    requirements: string[];
    stages: import('../../types/settings').Stage[];
    dynamicAgents: Map<string, string>;
    settings: import('../../types/settings').Settings;
}
