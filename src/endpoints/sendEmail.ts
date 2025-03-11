import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import axios from "axios";

export class SendEmail extends OpenAPIRoute {
    schema = {
        tags: ["Email"],
        summary: "Send an email using user's OAuth credentials",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            api_key: z.string(),
                            to: z.string().email(),
                            subject: z.string(),
                            text: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": { description: "Email sent successfully" },
            "401": { description: "Invalid API key or missing OAuth credentials" },
            "500": { description: "Failed to send email" },
        },
    };

    async handle(c) {
        const { api_key, to, subject, text } = await this.getValidatedData<typeof this.schema>().body;

        // 1️⃣ 通过 API Key 获取用户信息
        const { results: userResults } = await c.env.DB_USERS.prepare(
            "SELECT id, email FROM users WHERE api_key = ?"
        ).bind(api_key).all();

        if (userResults.length === 0) {
            return c.json({ error: "Invalid API key" }, 401);
        }

        const user_id = userResults[0].id;
        const senderEmail = userResults[0].email;

        // 2️⃣ 获取 OAuth 认证信息
        const { results: oauthResults } = await c.env.DB_OAUTH.prepare(
            "SELECT provider, client_id, client_secret FROM oauth WHERE user_id = ?"
        ).bind(user_id).all();

        if (oauthResults.length === 0) {
            return c.json({ error: "OAuth credentials not found" }, 401);
        }

        const { provider, client_id, client_secret } = oauthResults[0];

        try {
            // 3️⃣ 获取 Access Token
            const accessToken = await getAccessToken(provider, client_id, client_secret);

            // 4️⃣ 发送邮件
            await sendEmail(senderEmail, to, subject, text, accessToken, provider);

            return c.json({ message: "Email sent successfully" }, 200);
        } catch (error) {
            console.error("Error sending email:", error);
            return c.json({ error: "Failed to send email" }, 500);
        }
    }
}

// 获取 OAuth Access Token
async function getAccessToken(provider: string, client_id: string, client_secret: string): Promise<string> {
    try {
        let tokenUrl;
        let requestData;

        if (provider === "gmail") {
            tokenUrl = "https://oauth2.googleapis.com/token";
            requestData = {
                client_id,
                client_secret,
                grant_type: "refresh_token",
                refresh_token: "your-refresh-token", // 这里需要从数据库存储的 refresh_token 获取
            };
        } else if (provider === "outlook") {
            tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
            requestData = new URLSearchParams({
                client_id,
                client_secret,
                grant_type: "refresh_token",
                refresh_token: "your-refresh-token",
                scope: "https://graph.microsoft.com/.default",
            });
        } else {
            throw new Error("Unsupported email provider");
        }

        const response = await axios.post(tokenUrl, requestData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        return response.data.access_token;
    } catch (error) {
        console.error("Failed to get OAuth access token:", error.response?.data || error.message);
        throw new Error("OAuth token request failed");
    }
}

// 发送邮件
async function sendEmail(from: string, to: string, subject: string, body: string, accessToken: string, provider: string): Promise<void> {
    try {
        if (provider === "gmail") {
            const emailContent = createEmail(from, to, subject, body);

            await axios.post(
                "https://www.googleapis.com/gmail/v1/users/me/messages/send",
                { raw: emailContent },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } else if (provider === "outlook") {
            await axios.post(
                "https://graph.microsoft.com/v1.0/me/sendMail",
                {
                    message: {
                        subject,
                        body: { contentType: "Text", content: body },
                        toRecipients: [{ emailAddress: { address: to } }],
                    },
                    saveToSentItems: true,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } else {
            throw new Error("Unsupported email provider");
        }

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error.response?.data || error.message);
        throw new Error("Failed to send email");
    }
}

// 构造 Gmail 邮件格式
function createEmail(sender: string, recipient: string, subject: string, body: string): string {
    const email = [
        `From: ${sender}`,
        `To: ${recipient}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
    ].join("\r\n");

    return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}
