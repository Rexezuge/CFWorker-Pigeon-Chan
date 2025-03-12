import bcrypt from 'bcryptjs';

/**
 * 生成一个唯一的 API Key
 * @returns {string} API Key
 */
export function generateApiKey(): string {
    return crypto.randomUUID().replace(/-/g, "");
}

export async function hashPassword(
    password: string
): Promise<string> {
    const saltRounds = 10; // 推荐 10-12，数值越高，计算时间越长
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}
