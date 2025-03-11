import { fromHono } from "chanfana";
import { Hono } from "hono";
import { SendEmail } from "./endpoints/sendEmail";
import { RegisterUser } from "./endpoints/registerUser";
import { BindOAuth } from "./endpoints/bindOAuth";
import { GenerateApiKey } from "./endpoints/generateApiKey";

// 启动 Hono 应用
const app = new Hono();

// 配置 OpenAPI
const openapi = fromHono(app, { docs_url: "/" });

// 注册 API 端点
openapi.post("/api/register", RegisterUser);       // 用户注册
openapi.post("/api/:api_key/bind-oauth", BindOAuth);// 绑定 OAuth
openapi.post("/api/generate-api-key", GenerateApiKey); // 生成 API Key
openapi.post("/api/send-email", SendEmail);        // 发送邮件（需要 API Key）

// 导出 Hono 应用
export default app;
