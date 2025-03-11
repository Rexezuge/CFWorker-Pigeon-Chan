import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { generateApiKey } from "../utils";

export class GenerateApiKey extends OpenAPIRoute {
    schema = {
        tags: ["Authentication"],
        summary: "Generate a unique API Key for the user",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: z.string().email(),
                            password: z.string().min(6), // 确保密码最少6位
                        }),
                    },
                },
            },
        },
        responses: {
            "200": { description: "API key generated successfully" },
            "400": { description: "Invalid request body" },
            "401": { description: "Invalid email or password" },
            "500": { description: "Failed to generate API key" },
        },
    };

    async handle(c) {
        try {
            // 手动解析 JSON 请求体
            const requestBody = await c.req.json();
            if (!requestBody || !requestBody.email || !requestBody.password) {
                return c.json({ error: "Invalid request body" }, 400);
            }

            // 校验数据格式
            const validatedData = this.schema.request.body.content["application/json"].schema.parse(requestBody);
            const { email, password } = validatedData;

            // 验证用户身份
            const { results: userResults } = await c.env.DB_USERS.prepare(
                "SELECT id, password FROM users WHERE email = ?"
            ).bind(email).all();

            if (userResults.length === 0 || userResults[0].password !== password) {
                return c.json({ error: "Invalid email or password" }, 401);
            }

            const user_id = userResults[0].id;

            // 生成 API Key
            const apiKey = generateApiKey();

            // 更新数据库
            await c.env.DB_USERS.prepare(
                "UPDATE users SET api_key = ? WHERE id = ?"
            ).bind(apiKey, user_id).run();

            return c.json({ message: "API key generated successfully", api_key: apiKey }, 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: "Invalid input data", details: error.errors }, 400);
            }
            console.error("Error generating API key:", error);
            return c.json({ error: "Failed to generate API key" }, 500);
        }
    }
}
