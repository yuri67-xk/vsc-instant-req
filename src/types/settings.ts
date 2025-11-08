export interface Agent {
    id: string;
    name: string;
}

export interface Substage {
    id: number;
    content: string;
}

export interface Stage {
    id: number;
    content: string;
    substages?: Substage[];
}

export interface PromptTemplate {
    header: string;
    planningStep: string;
    specStep: string;
    implementationStep: string;
    codeReviewStep: string;
    deliveryStep: string;
    restrictions: string;
}

export interface IssueTemplate {
    header: string;
    explorationStep: string;
    planningStep: string;
    specStep: string;
    implementationStep: string;
    codeReviewStep: string;
    deliveryStep: string;
    restrictions: string;
}

export interface AgentSettings {
    specWriters: Agent[];
    implementers: Agent[];
    issueExplorers: Agent[];
    systemArchitects: Agent[];
    seniorEngineers: Agent[];
    codeReviewers: Agent[];
}

export interface Settings {
    agents: AgentSettings;
    promptTemplate: PromptTemplate;
    issueTemplate: IssueTemplate;
}

export interface WebviewMessage {
    command: 'copyToClipboard' | 'saveStages' | 'loadStages' | 'resetStages';
    text?: string;
    stages?: Stage[];
    tabType?: 'requirements' | 'issues';
}

export interface StagesLoadedMessage {
    command: 'stagesLoaded';
    requirementsStages?: Stage[];
    issuesStages?: Stage[];
}
