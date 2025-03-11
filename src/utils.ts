/**
 * 生成一个唯一的 API Key
 * @returns {string} API Key
 */
export function generateApiKey(): string {
    return crypto.randomUUID().replace(/-/g, "");
}
