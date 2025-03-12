import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class DeleteBoundOAuth extends OpenAPIRoute {
    schema = {
        tags: ["OAuth"],
        summary: "Delete all bound OAuth credentials for a user",
        parameters: [
            {
                name: "api_key",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User's API Key",
            },
        ],
        responses: {
            "200": { description: "All OAuth credentials deleted successfully" },
            "400": { description: "Invalid request parameters" },
            "401": { description: "Invalid API key" },
            "404": { description: "No OAuth credentials found" },
            "500": { description: "Failed to delete OAuth credentials" },
        },
    };

    async handle(c) {
        try {
            // 获取 API Key
            const api_key = c.req.param("api_key");

            if (!api_key) {
                return c.json({ error: "API key is required" }, 400);
            }

            // 获取用户 ID
            const { results: userResults } = await c.env.DB_USERS.prepare(
                "SELECT id FROM users WHERE api_key = ?"
            ).bind(api_key).all();

            if (userResults.length === 0) {
                return c.json({ error: "Invalid API key" }, 401);
            }

            const user_id = userResults[0].id;

            // 检查是否存在 OAuth 记录
            const { results: oauthResults } = await c.env.DB_USERS.prepare(
                "SELECT id FROM oauth WHERE user_id = ?"
            ).bind(user_id).all();

            if (oauthResults.length === 0) {
                return c.json({ error: "No OAuth credentials found" }, 404);
            }

            // 删除所有 OAuth 记录
            await c.env.DB_USERS.prepare(
                "DELETE FROM oauth WHERE user_id = ?"
            ).bind(user_id).run();

            return c.json({ message: "All OAuth credentials deleted successfully" }, 200);
        } catch (error) {
            console.error("Error deleting OAuth credentials:", error);
            return c.json({ error: "Failed to delete OAuth credentials" }, 500);
        }
    }
}
