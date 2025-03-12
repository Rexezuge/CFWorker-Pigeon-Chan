import { OpenAPIRoute } from "chanfana";
import { hashPassword } from "utils";
import { z } from "zod";

export class RegisterUser extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Register a new user",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: z.string().email(),
                            password: z.string().min(6),
                        }),
                    },
                },
            },
        },
        responses: {
            "201": { description: "User registered successfully" },
            "400": { description: "User already exists" },
            "500": { description: "Internal Server Error" },
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
            const passwordHash = await hashPassword(password);

            // 尝试插入用户数据
            await c.env.DB.prepare(
                "INSERT INTO users (email, password) VALUES (?, ?)"
            ).bind(email, passwordHash).run();

            return c.json({ message: "User registered successfully" }, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: "Invalid input data", details: error.errors }, 400);
            }
            if (error.message.includes("UNIQUE constraint failed")) {
                return c.json({ error: "User already exists" }, 400);
            }
            return c.json({ error: "Internal Server Error", details: error.message }, 500);
        }
    }
}
