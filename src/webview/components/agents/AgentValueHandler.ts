import { getElementById, toggleDisplay } from '../../utils/domHelpers';

/**
 * エージェント選択値の取得と操作を担当するクラス
 */
export class AgentValueHandler {
    /**
     * エージェント選択変更時の処理
     */
    public handleSelectChange(placeholder: string): void {
        const selectElement = getElementById<HTMLSelectElement>(`dynamic-${placeholder}`);
        const manualWrapper = getElementById<HTMLElement>(`manual-wrapper-${placeholder}`);
        const manualInput = getElementById<HTMLInputElement>(`dynamic-${placeholder}-manual`);

        if (!selectElement || !manualWrapper || !manualInput) return;

        const selectValue = selectElement.value;

        if (selectValue === '__custom__') {
            toggleDisplay(manualWrapper, true);
            manualInput.focus();
        } else {
            toggleDisplay(manualWrapper, false);
            manualInput.value = '';
        }
    }

    /**
     * 選択されたエージェント値を取得
     */
    public getAgentValue(placeholder: string): string | null {
        const selectElement = getElementById<HTMLSelectElement>(`dynamic-${placeholder}`);
        const manualInput = getElementById<HTMLInputElement>(`dynamic-${placeholder}-manual`);

        if (!selectElement) return null;

        const selectValue = selectElement.value;

        if (selectValue === '__custom__') {
            const manualValue = manualInput?.value.trim();
            if (manualValue) {
                return manualValue.startsWith('@') ? manualValue : '@' + manualValue;
            }
            return null;
        } else if (selectValue) {
            return selectValue;
        }

        return null;
    }

    /**
     * 既存のエージェント値を設定
     */
    public setExistingValue(placeholder: string): void {
        const selectElement = getElementById<HTMLSelectElement>(`dynamic-${placeholder}`);
        const manualInput = getElementById<HTMLInputElement>(`dynamic-${placeholder}-manual`);
        const manualWrapper = getElementById<HTMLElement>(`manual-wrapper-${placeholder}`);

        if (!selectElement || !manualInput || !manualWrapper) return;

        // 既存のセレクト要素から値を復元
        const existingSelect = document.getElementById(`dynamic-${placeholder}`) as HTMLSelectElement;
        const existingManual = document.getElementById(`dynamic-${placeholder}-manual`) as HTMLInputElement;

        if (existingSelect) {
            selectElement.value = existingSelect.value;
            
            if (existingSelect.value === '__custom__' && existingManual) {
                manualInput.value = existingManual.value;
                manualWrapper.style.display = 'block';
            }
        }
    }

    /**
     * 指定されたエージェント値を設定
     */
    public setAgentValue(placeholder: string, value: string): void {
        const selectElement = getElementById<HTMLSelectElement>(`dynamic-${placeholder}`);
        const manualInput = getElementById<HTMLInputElement>(`dynamic-${placeholder}-manual`);
        const manualWrapper = getElementById<HTMLElement>(`manual-wrapper-${placeholder}`);

        if (!selectElement || !manualInput || !manualWrapper) return;

        if (value.startsWith('@')) {
            // カスタムエージェントの場合
            selectElement.value = '__custom__';
            manualInput.value = value;
            manualWrapper.style.display = 'block';
        } else {
            // プリセットエージェントの場合
            selectElement.value = value;
            manualInput.value = '';
            manualWrapper.style.display = 'none';
        }
    }

    /**
     * 全てのエージェント値を取得
     */
    public getAllAgentValues(placeholders: Iterable<string>): Map<string, string> {
        const values = new Map<string, string>();

        for (const placeholder of placeholders) {
            const value = this.getAgentValue(placeholder);
            if (value) {
                values.set(placeholder, value);
            }
        }

        return values;
    }

    /**
     * 全ての選択をクリア
     */
    public clearAll(placeholders: Iterable<string>): void {
        for (const placeholder of placeholders) {
            const select = getElementById<HTMLSelectElement>(`dynamic-${placeholder}`);
            const manual = getElementById<HTMLInputElement>(`dynamic-${placeholder}-manual`);
            const manualWrapper = getElementById<HTMLElement>(`manual-wrapper-${placeholder}`);

            if (select) select.selectedIndex = 0;
            if (manual) manual.value = '';
            if (manualWrapper) toggleDisplay(manualWrapper, false);
        }
    }
}
