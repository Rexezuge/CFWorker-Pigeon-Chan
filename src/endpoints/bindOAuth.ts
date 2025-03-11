import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class BindOAuth extends OpenAPIRoute {
    schema = {
        tags: ["OAuth"],
        summary: "Bind OAuth credentials for sending emails",
        parameters: [
            {
                name: "api_key",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User's API Key",
            },
        ],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            provider: z.enum(["gmail", "outlook"]),
                            client_id: z.string(),
                            client_secret: z.string(),
                            refresh_token: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": { description: "OAuth credentials bound successfully" },
            "400": { description: "Invalid request body" },
            "401": { description: "Invalid API key" },
            "500": { description: "Failed to bind OAuth credentials" },
        },
    };

    async handle(c) {
        try {
            // 从路径参数获取 API Key
            const api_key = c.req.param("api_key");
            if (!api_key) {
                return c.json({ error: "API key is required" }, 400);
            }

            // 解析 JSON 请求体
            const requestBody = await c.req.json();
            if (!requestBody || Object.keys(requestBody).length === 0) {
                return c.json({ error: "Invalid request body" }, 400);
            }

            // 校验数据格式
            const validatedData = this.schema.request.body.content["application/json"].schema.parse(requestBody);
            const { provider, client_id, client_secret, refresh_token } = validatedData;

            // 获取用户 ID
            const { results: userResults } = await c.env.DB_USERS.prepare(
                "SELECT id FROM users WHERE api_key = ?"
            ).bind(api_key).all();

            if (userResults.length === 0) {
                return c.json({ error: "Invalid API key" }, 401);
            }

            const user_id = userResults[0].id;

            // 绑定 OAuth
            await c.env.DB_USERS.prepare(
                "INSERT INTO oauth (user_id, provider, client_id, client_secret, refresh_token) VALUES (?, ?, ?, ?, ?)"
            ).bind(user_id, provider, client_id, client_secret, refresh_token).run();

            return c.json({ message: "OAuth credentials bound successfully" }, 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: "Invalid input data", details: error.errors }, 400);
            }
            console.error("Error binding OAuth:", error);
            return c.json({ error: "Failed to bind OAuth credentials" }, 500);
        }
    }
}
