/**
 * 課題探索UI管理を担当するクラス
 */
export class IssuesManager {
    private container: HTMLElement | null;
    private addButton: HTMLButtonElement | null;

    constructor() {
        this.container = document.getElementById('issues-container');
        this.addButton = document.querySelector('#issues-tab .btn-add') as HTMLButtonElement;
    }

    /**
     * 初期化: イベントリスナーを設定
     */
    public initialize(): void {
        if (this.addButton) {
            this.addButton.addEventListener('click', () => this.addIssue());
        }
    }

    /**
     * 課題を追加
     */
    public addIssue(): void {
        if (!this.container) return;

        const row = document.createElement('div');
        row.className = 'issue-row';

        const textarea = document.createElement('textarea');
        textarea.className = 'issue-input';
        textarea.placeholder = '課題を入力';
        row.appendChild(textarea);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
        removeBtn.addEventListener('click', () => {
            row.remove();
        });
        row.appendChild(removeBtn);

        this.container.appendChild(row);
    }

    /**
     * 全ての課題を取得
     */
    public getIssues(): string[] {
        if (!this.container) return [];

        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.issue-input');
        return Array.from(textareas)
            .map(textarea => textarea.value.trim())
            .filter(value => value !== '');
    }

    /**
     * 全ての課題をクリア
     */
    public clearAll(): void {
        if (!this.container) return;

        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.issue-input');
        textareas.forEach(textarea => {
            textarea.value = '';
        });
    }
}
