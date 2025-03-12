import { fromHono } from "chanfana";
import { Hono } from "hono";
import { SendEmail } from "./endpoints/:api_key/email/post";
import { RegisterUser } from "./endpoints/user/post";
import { BindOAuth } from "./endpoints/:api_key/oauth/post";
import { GenerateApiKey } from "./endpoints/user/api_key/post";
import { DeleteBoundOAuth } from "endpoints/:api_key/oauth/delete";
import { RebindOAuth } from "endpoints/:api_key/oauth/put";
import { DeleteApiKey } from "endpoints/user/api_key/delete";

// 启动 Hono 应用
const app = new Hono();

// 配置 OpenAPI
const openapi = fromHono(app, { docs_url: "/" });

// 注册 API 端点
openapi.post("/api/user", RegisterUser);       // 用户注册
openapi.post("/api/user/api_key", GenerateApiKey); // 生成 API Key
openapi.delete("/api/user/api_key", DeleteApiKey); // 生成 API Key

openapi.post("/api/:api_key/oauth", BindOAuth);// 绑定 OAuth
openapi.put("/api/:api_key/oauth", RebindOAuth);// 重新绑定 OAuth
openapi.delete("/api/:api_key/oauth", DeleteBoundOAuth);// 绑定 OAuth
openapi.post("/api/:api_key/email", SendEmail);

// 导出 Hono 应用
export default app;
