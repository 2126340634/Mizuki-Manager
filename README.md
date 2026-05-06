# Mizuki Manager

## 开源声明

博客开源项目 **Mizuki**，作者 [@matsuzaka-yuki](https://github.com/matsuzaka-yuki)。

- Mizuki 项目：https://github.com/LyraVoid/Mizuki
- Mizuki 协议：MIT / Apache-2.0（以原仓库为准）

一个用于管理 Mizuki 静态博客项目的后台管理服务仓库。该项目包含：

- `server/`：Express 后端管理服务
- `frontend/`：管理控制台前端页面
- `start.js`：开发模式和生产模式启动脚本
- `.env.example`：后端服务运行的环境变量示例

## 项目简介

`Mizuki-manager` 是一个用于 Mizuki 博客后台管理的服务系统。它提供：

- 登录认证与 JWT 令牌保护
- 用户操作权限校验
- 文件上传与资源目录管理
- 多种内容管理路由（文章、相册、动画、友链、日记、项目、技能、配置等）
- 生产环境静态前端构建与服务

## 目录结构

```text
.
├── frontend/          # 管理控制台前端
├── server/            # Express 后端服务
│   ├── app.js
│   ├── config.js
│   ├── middlewares/
│   ├── routes/
│   ├── managers/
│   └── utils/
├── .env.example       # 环境变量示例
├── package.json       # 根目录脚本与依赖
└── start.js           # 统一启动脚本
```

## 测试环境
- **Node.js**：版本v25.5.0
- **包管理器**：pnpm (推荐) 、 npm 或 yarn 

## 推荐使用方式

**将 Mizuki Manager 与 Mizuki 博客项目部署在同一台服务器上**，Manager 直接读写服务器上的博客文件，实现零延迟、实时生效的管理体验。

```
+-------------+     +---------------------------------------+
|  用户浏览器  |---->|              服务器                   |
|             |     |  +----------+      +-------------+   |
| 访问管理系统 |     |  | Manager  |----->| Mizuki 博客 |   |
|  http://    |     |  |  :3001   |      |   项目目录   |   |
+-------------+     +----------+----------+-------------+   |
                    +---------------------------------------+
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 创建 `.env` 文件

复制根目录下的 `.env.example` 为 `.env`，并填写必需的配置。

### 3. 启动开发环境

```bash
pnpm dev
```

开发模式会同时启动：

- `frontend` 前端开发服务
- `server` 后端开发服务（使用 `nodemon` 监听变更）

### 4. 生产环境启动

```bash
pnpm start
```

生产模式下脚本会先执行构建前端，然后使用 `pm2` 启动后端服务。

### 5. 停止服务

```bash
pnpm stop
```

## 根目录脚本说明

- `pnpm dev`：开发环境启动，包含前端和后端。
- `pnpm start`：生产环境启动，先构建前端并启动 pm2 后端服务。
- `pnpm stop`：停止 `pm2` 中的 `mizuki-manager` 进程。

## 后端服务说明

后端服务入口：`server/app.js`

- 所有管理接口挂载到 `/mizuki` 前缀。
- 登录路由：`/mizuki/auth`
- 其余路由由 JWT 鉴权中间件 `server/middlewares/auth.js` 保护。
- 生产环境额外提供 `frontend/dist` 静态文件服务。

### 认证机制

后端采用 JWT 登录保护，登录接口实现于 `server/routes/auth.js`。

登录流程：

1. 用户请求接口提交账号、密码和验证码。
2. 登录成功后返回 JWT Token。
3. 其他接口必须在请求头中携带：

```http
Authorization: Bearer <token>
```

### 验证码策略

- 登录失败 2 次后需要输入验证码。
- 使用 auth 模块获取新的验证码。
- 验证码有效期为 24 小时。

## 主要 API 路由

后端管理路由均挂载在 `/mizuki` 下，这些路由都由 `server/routes/index.js` 统一导出，并在对应的 `server/managers/*` 中提供业务逻辑的实现。

## 配置说明

`server/config.js` 会读取根目录 `.env` 并导出核心配置。

## 重要特性

- 路径安全校验：`server/app.js` 会检查 `/mizuki` 路径访问是否越出 `BASE_PATH` (项目根路径)。
- JWT 认证保护：所有登录后接口均受 `verifyToken` 中间件保护。
- 文件上传与清理：`server/managers/BaseManager.js` 支持上传校验、旧文件清理、文件写入与配置文件读写。
- 统一静态资源访问：支持 `public`、`src/assets`、前端构建产物等静态资源。

## 开发建议

- 先确保 `.env` 配置完整且路径正确。
- 开发时可直接使用 `pnpm dev` 调试前后端。
- 生产部署前请先单独执行前端构建，确保 `frontend/dist` 目录存在。

## 常见问题

### 启动脚本报错 `.env 文件不存在`

请检查根目录是否存在 `.env` 文件，并正确填写环境变量。

### 登录后请求返回 401

请确认请求头中是否携带正确格式的 Authorization：

```http
Authorization: Bearer <token>
```

### 上传失败或格式错误

请检查文件大小是否超过 20MB，且是否为后端可识别的图片/音频/文档格式。

## 贡献与维护

如果你要扩展服务，请从 `server/routes` 和 `server/managers` 开始：

- `routes` 负责接口定义
- `managers` 负责业务实现
- `middlewares` 负责鉴权与通用处理

欢迎按照项目实际需求继续完善 API 文档与前端交互规范。
