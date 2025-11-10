import type { Stage } from '../../types/webview';

/**
 * ステージUIの構築を担当するクラス
 */
export class StageUIBuilder {
    /**
     * ステージカードを作成
     */
    public createStageCard(
        stage: Stage,
        index: number,
        onRemove: (index: number) => void,
        onContentChange: (index: number, content: string) => void,
        onAddSubstage: (index: number) => void
    ): HTMLElement {
        const card = document.createElement('div');
        card.className = 'stage-card';
        card.draggable = true;

        // ヘッダー
        const header = this.createStageHeader(index, onRemove);
        card.appendChild(header);

        // コンテンツ
        const content = this.createStageContent(stage, index, onContentChange, onAddSubstage);
        card.appendChild(content);

        return card;
    }

    /**
     * ステージヘッダーを作成
     */
    private createStageHeader(index: number, onRemove: (index: number) => void): HTMLElement {
        const header = document.createElement('div');
        header.className = 'stage-card-header';

        const number = document.createElement('div');
        number.className = 'stage-number';
        number.textContent = `ステージ ${index + 1}`;
        header.appendChild(number);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-stage';
        removeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
        removeBtn.addEventListener('click', () => onRemove(index));
        header.appendChild(removeBtn);

        return header;
    }

    /**
     * ステージコンテンツを作成
     */
    private createStageContent(
        stage: Stage,
        index: number,
        onContentChange: (index: number, content: string) => void,
        onAddSubstage: (index: number) => void
    ): HTMLElement {
        const content = document.createElement('div');
        content.className = 'stage-content';

        // メインテキストエリア
        const textarea = document.createElement('textarea');
        textarea.className = 'stage-main-textarea';
        textarea.value = stage.content;
        textarea.addEventListener('input', (e) => {
            onContentChange(index, (e.target as HTMLTextAreaElement).value);
        });
        content.appendChild(textarea);

        // サブステージ
        if (stage.substages && stage.substages.length > 0) {
            const substagesContainer = this.createSubstagesContainer(stage);
            content.appendChild(substagesContainer);
        }

        // サブステージ追加ボタン
        const addSubstageBtn = document.createElement('button');
        addSubstageBtn.className = 'btn-add-substage';
        addSubstageBtn.innerHTML = '<i class="codicon codicon-add"></i> サブステージを追加';
        addSubstageBtn.addEventListener('click', () => onAddSubstage(index));
        content.appendChild(addSubstageBtn);

        return content;
    }

    /**
     * サブステージコンテナを作成
     */
    private createSubstagesContainer(stage: Stage): HTMLElement {
        const container = document.createElement('div');
        container.className = 'substages-container';

        stage.substages?.forEach((_, substageIndex) => {
            const row = this.createSubstageRow(stage, substageIndex);
            container.appendChild(row);
        });

        return container;
    }

    /**
     * サブステージ行を作成
     */
    private createSubstageRow(stage: Stage, substageIndex: number): HTMLElement {
        const row = document.createElement('div');
        row.className = 'substage-row';

        const textarea = document.createElement('textarea');
        textarea.className = 'substage-textarea';
        textarea.value = stage.substages?.[substageIndex]?.content || '';
        textarea.addEventListener('input', (e) => {
            if (stage.substages) {
                stage.substages[substageIndex].content = (e.target as HTMLTextAreaElement).value;
            }
        });
        row.appendChild(textarea);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-substage';
        removeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
        row.appendChild(removeBtn);

        return row;
    }
}
