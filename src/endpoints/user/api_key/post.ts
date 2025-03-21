import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { comparePassword, generateApiKey } from "../../../utils";

export class GenerateApiKey extends OpenAPIRoute {
    schema = {
        tags: ["User/API_Key"],
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
            // 解析 JSON 请求体
            const requestBody = await c.req.json();
            if (!requestBody || !requestBody.email || !requestBody.password) {
                return c.json({ error: "Invalid request body" }, 400);
            }

            // 校验数据格式
            const validatedData = this.schema.request.body.content["application/json"].schema.parse(requestBody);
            const { email, password } = validatedData;

            // 查询用户信息，仅获取第一个用户
            const user = await c.env.DB.prepare(
                "SELECT id, password, api_key FROM users WHERE email = ? LIMIT 1"
            ).bind(email).first();

            if (!user) {
                return c.json({ error: "Invalid email or password" }, 401);
            }

            // 验证密码
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return c.json({ error: "Invalid email or password" }, 401);
            }

            // 如果 API Key 已存在，直接返回
            if (user.api_key) {
                return c.json({ message: "API key already exists", api_key: user.api_key }, 200);
            }

            // 生成新的 API Key
            const apiKey = generateApiKey();

            // 更新数据库
            await c.env.DB.prepare(
                "UPDATE users SET api_key = ? WHERE id = ?"
            ).bind(apiKey, user.id).run();

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
