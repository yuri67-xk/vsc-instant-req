import type { VscodeApi, WebviewMessage } from '../types/webview';

declare global {
    interface Window {
        acquireVsCodeApi: () => VscodeApi;
    }
}

class VSCodeAPIWrapper {
    private readonly vscodeApi: VscodeApi;

    constructor() {
        this.vscodeApi = window.acquireVsCodeApi();
    }

    /**
     * Post a message to the extension
     */
    public postMessage(message: WebviewMessage): void {
        this.vscodeApi.postMessage(message);
    }

    /**
     * Get the current state
     */
    public getState<T = any>(): T | undefined {
        return this.vscodeApi.getState();
    }

    /**
     * Set the current state
     */
    public setState<T = any>(state: T): void {
        this.vscodeApi.setState(state);
    }

    /**
     * Copy text to clipboard
     */
    public copyToClipboard(text: string): void {
        this.postMessage({
            command: 'copyToClipboard',
            text
        });
    }

    /**
     * Load stages from extension
     */
    public loadStages(): void {
        this.postMessage({
            command: 'loadStages'
        });
    }

    /**
     * Save stages to extension
     */
    public saveStages(stages: any[], tabType: 'requirements' | 'issues'): void {
        this.postMessage({
            command: 'saveStages',
            stages,
            tabType
        });
    }

    /**
     * Reset stages to default
     */
    public resetStages(tabType: 'requirements' | 'issues'): void {
        this.postMessage({
            command: 'resetStages',
            tabType
        });
    }

    /**
     * Save recent agent to history
     */
    public saveRecentAgent(agentId: string): void {
        this.postMessage({
            command: 'saveRecentAgent',
            agentId
        });
    }
}

// Singleton instance
export const vscode = new VSCodeAPIWrapper();
