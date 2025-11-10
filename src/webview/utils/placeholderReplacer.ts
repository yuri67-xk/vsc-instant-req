/**
 * プレースホルダー置換ユーティリティ
 */

/**
 * コンテンツ内のプレースホルダーを動的エージェント値で置換
 * @param content 置換対象のコンテンツ
 * @param dynamicAgents プレースホルダーと値のマップ
 * @returns 置換後のコンテンツ
 */
export function replacePlaceholders(
    content: string,
    dynamicAgents: Map<string, string>
): string {
    let result = content;

    dynamicAgents.forEach((agentValue, placeholder) => {
        // placeholderは{agent-xxx}形式ではなく、agent-xxx形式で渡されるため
        // {を追加してマッチさせる
        const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&');
        const regex = new RegExp(`\\{${escapedPlaceholder}\\}`, 'g');
        result = result.replace(regex, agentValue);
    });

    return result;
}

/**
 * コンテンツから動的エージェントプレースホルダーを抽出
 * @param content 検索対象のコンテンツ
 * @returns プレースホルダーの配列
 */
export function extractPlaceholders(content: string): string[] {
    const pattern = /\{(agent-[^}]+)\}/g;
    const matches: string[] = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
        if (!matches.includes(match[1])) {
            matches.push(match[1]);
        }
    }

    return matches;
}
