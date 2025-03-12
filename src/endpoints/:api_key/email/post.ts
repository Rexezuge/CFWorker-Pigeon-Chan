import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { apiKeyParam } from "../param";
import { getAccessToken, sendEmail } from "./util";

export class SendEmail extends OpenAPIRoute {
    schema = {
        tags: ["Email"],
        summary: "Send an email using user's OAuth credentials",
        parameters: [apiKeyParam],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            to: z.string().email(),
                            subject: z.string().min(1, "Subject is required"),
                            text: z.string().min(1, "Email body cannot be empty"),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": { description: "Email sent successfully" },
            "400": { description: "Invalid request body or missing API key" },
            "401": { description: "Invalid API key or missing OAuth credentials" },
            "500": { description: "Failed to send email" },
        },
    };

    async handle(c) {
        try {
            // 1️⃣ 获取 API Key
            const api_key = c.req.param("api_key");
            if (!api_key) {
                return c.json({ error: "API key is required" }, 400);
            }

            // 2️⃣ 解析并验证请求体
            const requestBody = await c.req.json();
            const { to, subject, text } = this.schema.request.body.content["application/json"].schema.parse(requestBody);

            // 3️⃣ 通过 API Key 获取用户信息
            const user = await c.env.DB.prepare(
                "SELECT id, email FROM users WHERE api_key = ?"
            ).bind(api_key).first();

            if (!user) {
                return c.json({ error: "Invalid API key" }, 401);
            }

            // 4️⃣ 获取 OAuth 认证信息
            const oauth = await c.env.DB.prepare(
                "SELECT provider, client_id, client_secret, refresh_token FROM oauth WHERE user_id = ?"
            ).bind(user.id).first();

            if (!oauth) {
                return c.json({ error: "OAuth credentials not found" }, 401);
            }

            // 5️⃣ 获取 Access Token
            const accessToken = await getAccessToken(oauth.provider, oauth.client_id, oauth.client_secret, oauth.refresh_token);

            // 6️⃣ 发送邮件
            await sendEmail(user.email, to, subject, text, accessToken, oauth.provider);

            return c.json({ message: "Email sent successfully" }, 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: "Invalid request body", details: error.errors }, 400);
            }
            console.error("Error sending email:", error);
            return c.json({ error: "Failed to send email" }, 500);
        }
    }
}
