import type { TabType, NestedTabType } from '../types/webview';

/**
 * タブ管理を担当するクラス
 * メインタブとネストタブの切り替えを管理
 */
export class TabManager {
    private currentTab: TabType = 'requirements';
    private nestedTabs: Map<TabType, NestedTabType> = new Map([
        ['requirements', 'input'],
        ['issues', 'input']
    ]);

    /**
     * 初期化: イベントリスナーを設定
     */
    public initialize(): void {
        this.setupMainTabListeners();
        this.setupNestedTabListeners();
    }

    /**
     * メインタブのイベントリスナー設定
     */
    private setupMainTabListeners(): void {
        const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                const tabType: TabType = index === 0 ? 'requirements' : 'issues';
                this.switchMainTab(tabType);
            });
        });
    }

    /**
     * ネストタブのイベントリスナー設定
     */
    private setupNestedTabListeners(): void {
        document.querySelectorAll('.nested-tabs').forEach(nestedTabsContainer => {
            const parentTab = nestedTabsContainer.getAttribute('data-parent') as TabType;
            nestedTabsContainer.querySelectorAll('.nested-tab').forEach(nestedTab => {
                nestedTab.addEventListener('click', () => {
                    const nestedTabName = nestedTab.getAttribute('data-nested') as NestedTabType;
                    this.switchNestedTab(parentTab, nestedTabName);
                });
            });
        });
    }

    /**
     * メインタブを切り替え
     */
    public switchMainTab(tabType: TabType): void {
        // タブボタンのactive状態を更新
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((tab, index) => {
            if ((index === 0 && tabType === 'requirements') ||
                (index === 1 && tabType === 'issues')) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // タブコンテンツの表示/非表示を切り替え
        const contents = document.querySelectorAll<HTMLElement>('.tab-content');
        contents.forEach((content, index) => {
            if ((index === 0 && tabType === 'requirements') ||
                (index === 1 && tabType === 'issues')) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        this.currentTab = tabType;
    }

    /**
     * ネストタブを切り替え
     */
    public switchNestedTab(parentTab: TabType, nestedTabType: NestedTabType): void {
        // ネストタブボタンのactive状態を更新
        const nestedTabsContainer = document.querySelector(`[data-parent="${parentTab}"]`);
        if (!nestedTabsContainer) return;

        nestedTabsContainer.querySelectorAll('.nested-tab').forEach(tab => {
            if (tab.getAttribute('data-nested') === nestedTabType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // ネストタブコンテンツの表示/非表示を切り替え
        const inputContent = document.getElementById(`${parentTab}-input-tab`);
        const agentsContent = document.getElementById(`${parentTab}-agents-tab`);

        if (inputContent && agentsContent) {
            if (nestedTabType === 'input') {
                inputContent.classList.add('active');
                agentsContent.classList.remove('active');
            } else {
                inputContent.classList.remove('active');
                agentsContent.classList.add('active');
            }
        }

        this.nestedTabs.set(parentTab, nestedTabType);
    }

    /**
     * 現在のメインタブを取得
     */
    public getCurrentTab(): TabType {
        return this.currentTab;
    }

    /**
     * 指定されたメインタブの現在のネストタブを取得
     */
    public getCurrentNestedTab(parentTab: TabType): NestedTabType {
        return this.nestedTabs.get(parentTab) || 'input';
    }
}
