import { OpenAPIRoute } from "chanfana";
import { comparePassword } from "../../../utils";
import { z } from "zod";

export class DeleteApiKey extends OpenAPIRoute {
    schema = {
        tags: ["User/API_Key"],
        summary: "Delete the user's API Key",
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
            "200": { description: "API key deleted successfully" },
            "400": { description: "Invalid request body" },
            "401": { description: "Invalid email or password" },
            "404": { description: "API key not found" },
            "500": { description: "Failed to delete API key" },
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

            // 查询用户信息，包括 API Key
            const { results: userResults } = await c.env.DB.prepare(
                "SELECT id, password, api_key FROM users WHERE email = ?"
            ).bind(email).all();

            const isMatch = await comparePassword(password, userResults[0].password);
            if (userResults.length === 0 || !isMatch) {
                return c.json({ error: "Invalid email or password" }, 401);
            }

            const user_id = userResults[0].id;
            const apiKey = userResults[0].api_key;

            // 如果 API Key 不存在，返回错误
            if (!apiKey) {
                return c.json({ error: "API key not found" }, 404);
            }

            // 更新数据库，删除 API Key
            await c.env.DB.prepare(
                "UPDATE users SET api_key = NULL WHERE id = ?"
            ).bind(user_id).run();

            return c.json({ message: "API key deleted successfully" }, 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: "Invalid input data", details: error.errors }, 400);
            }
            console.error("Error deleting API key:", error);
            return c.json({ error: "Failed to delete API key" }, 500);
        }
    }
}
