# Mail Meow 开发指南 🛠️🐾

欢迎来到 **Mail Meow** 的开发指南！在这里，你将了解到如何开发和部署这个可爱的邮件推送平台。让我们一起开始吧！(๑•̀ㅂ•́)و✧

## 项目结构 📂

```
.
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── database
│   └── schema.sql
├── docs
│   └── DEVELOPMENT.md
├── src
│   ├── endpoints
│   │   ├── :api_key
│   │   │   ├── email
│   │   │   │   ├── post.ts
│   │   │   │   └── util.ts
│   │   │   ├── oauth
│   │   │   │   ├── delete.ts
│   │   │   │   ├── post.ts
│   │   │   │   └── put.ts
│   │   │   └── param.ts
│   │   └── user
│   │       ├── api_key
│   │       │   ├── delete.ts
│   │       │   └── post.ts
│   │       ├── delete.ts
│   │       └── post.ts
│   ├── index.ts
│   └── utils.ts
├── tsconfig.json
├── worker-configuration.d.ts
└── wrangler.jsonc
```

## 开发环境 🖥️

### 依赖安装

首先，确保你已经安装了 Node.js 和 npm。然后，在项目根目录下运行以下命令来安装依赖：

```bash
npm install
```

### 登录 Cloudflare

使用 `wrangler` 登录 Cloudflare ：

```bash
npx wrangler login
```

### 数据库设置

Mail Meow 使用 Cloudflare D1 作为数据库。你需要先创建数据库并导入初始表结构：

1. 在 Cloudflare Workers 控制台中创建一个新的 D1 数据库。
2. 使用 `wrangler` CLI 工具导入 SQL 文件：

```bash
npx wrangler d1 execute <DATABASE_NAME> --file ./database/schema.sql --remote
```

> **注意**：`<DATABASE_NAME>` 是你在 Cloudflare Workers 中创建的 D1 数据库名称。

### 本地开发

使用 `wrangler` 启动本地开发服务器：

```bash
npm run dev
```

## 部署 🚀

### 配置 `wrangler.jsonc`

在部署之前，确保你已经正确配置了 `wrangler.jsonc` 文件，包括数据库绑定和环境变量。

### 部署到 Cloudflare Workers

使用 `wrangler` 部署你的 Worker：

```bash
npm run deploy
```

## API 文档 📄

项目的 API 文档基于 OpenAPI 3.1.0 规范。你可以在 `openapi.json` 文件中查看详细的 API 定义。

## 测试 🧪

我们使用 Jest 进行单元测试。运行以下命令来执行测试：

```bash
npm test
```

## 贡献指南 🤝

我们欢迎任何形式的贡献！如果你有任何建议或发现 bug，请随时提交 issue 或 pull request。让我们一起让 Mail Meow 变得更棒吧！(๑•̀ㅂ•́)و✧

## 许可证 📜

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

**Mail Meow**，让你的邮件推送变得像小猫一样可爱！🐾💖
