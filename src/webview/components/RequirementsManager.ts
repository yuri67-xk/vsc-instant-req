/**
 * 要件定義UI管理を担当するクラス
 */
export class RequirementsManager {
    private container: HTMLElement | null;
    private addButton: HTMLButtonElement | null;

    constructor() {
        this.container = document.getElementById('requirements-container');
        this.addButton = document.querySelector('#requirements-tab .btn-add') as HTMLButtonElement;
    }

    /**
     * 初期化: イベントリスナーを設定
     */
    public initialize(): void {
        if (this.addButton) {
            this.addButton.addEventListener('click', () => this.addRequirement());
        }
    }

    /**
     * 要件を追加
     */
    public addRequirement(): void {
        if (!this.container) return;

        const row = document.createElement('div');
        row.className = 'requirement-row';

        const textarea = document.createElement('textarea');
        textarea.className = 'requirement-input';
        textarea.placeholder = '機能要件を入力';
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
     * 全ての要件を取得
     */
    public getRequirements(): string[] {
        if (!this.container) return [];

        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.requirement-input');
        return Array.from(textareas)
            .map(textarea => textarea.value.trim())
            .filter(value => value !== '');
    }

    /**
     * 全ての要件をクリア（追加した入力欄も削除し、初期状態に戻す）
     */
    public clearAll(): void {
        if (!this.container) return;

        const rows = this.container.querySelectorAll<HTMLElement>('.requirement-row');

        // 最初の1つを除いて全ての行を削除
        rows.forEach((row, index) => {
            if (index > 0) {
                row.remove();
            }
        });

        // 残った最初の入力欄の値をクリア
        const firstTextarea = this.container.querySelector<HTMLTextAreaElement>('.requirement-input');
        if (firstTextarea) {
            firstTextarea.value = '';
        }
    }
}
