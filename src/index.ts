import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { SendEmail } from "./endpoints/sendEmail"; // 引入 SendEmail

// 启动 Hono 应用
const app = new Hono();

// 配置 OpenAPI
const openapi = fromHono(app, { docs_url: "/" });

// 注册 API 端点
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);
openapi.post("/api/send-email", SendEmail); // 注册 SendEmail 端点

// 导出 Hono 应用
export default app;
