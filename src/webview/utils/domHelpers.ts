/**
 * DOM操作のヘルパー関数
 */

/**
 * 指定されたIDの要素を取得（型安全）
 */
export function getElementById<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

/**
 * 指定されたセレクタの要素を取得（型安全）
 */
export function querySelector<T extends HTMLElement>(selector: string): T | null {
    return document.querySelector(selector) as T | null;
}

/**
 * 指定されたセレクタの全要素を取得
 */
export function querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll(selector) as NodeListOf<T>;
}

/**
 * 要素の表示/非表示を切り替え
 */
export function toggleDisplay(element: HTMLElement, show: boolean): void {
    element.style.display = show ? 'block' : 'none';
}

/**
 * 要素のクラスを切り替え
 */
export function toggleClass(element: HTMLElement, className: string, add: boolean): void {
    if (add) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}
