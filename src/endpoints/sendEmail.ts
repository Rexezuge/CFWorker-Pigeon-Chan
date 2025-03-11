import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import axios from "axios";

// 定义 Email API 规范
export class SendEmail extends OpenAPIRoute {
    schema = {
        tags: ["Email"],
        summary: "Send an email",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            to: z.string().email(),
                            subject: z.string(),
                            text: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Email sent successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string(),
                        }),
                    },
                },
            },
            "500": {
                description: "Failed to send email",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            error: z.string(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c) {
        // 获取并验证请求数据
        const data = await this.getValidatedData<typeof this.schema>();
        const { to, subject, text } = data.body;

        try {
            await sendEmail(to, subject, text);
            return { success: true, message: "Email sent successfully" };
        } catch (error) {
            console.error("Error sending email:", error.response?.data || error.message);
            return c.json({ success: false, error: "Failed to send email" }, 500);
        }
    }
}

// 发邮件逻辑
const GMAIL_USER = "your-email@gmail.com";

function createEmail(sender, recipient, subject, body) {
    const email = [
        `From: ${sender}`,
        `To: ${recipient}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
    ].join("\r\n");

    // 兼容 Cloudflare Workers 和浏览器环境
    const encodedEmail = new TextEncoder().encode(email);
    const base64Email = btoa(String.fromCharCode(...encodedEmail))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return base64Email;
}


async function sendEmail(recipient, subject, body) {
    try {
        const accessToken = await getAccessToken();
        const emailContent = createEmail(GMAIL_USER, recipient, subject, body);

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

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error.response?.data || error.message);
        throw error;
    }
}

// 获取 Gmail API 访问令牌（示例：实际项目中请替换为正确的 OAuth 机制）
async function getAccessToken() {
    return "your-access-token"; // TODO: 替换为动态获取 Token 逻辑
}
