# Mizuki Manager

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-0170FE?logo=antdesign&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Recast](https://img.shields.io/badge/Recast-FF6B6B?logo=javascript&logoColor=white)

---

## 项目简介

`Mizuki-Manager` 是一个用于 Mizuki 博客后台管理的服务系统。提供：

- JWT登录令牌保护与单点互踢 
- 博客静态资源、配置文件可视化编辑
- 生产环境远程一键构建部署服务

## 测试环境
- Node.js v25.5.0
- pnpm

## 推荐使用方式

将 Mizuki Manager 与 Mizuki 博客项目部署在同一台服务器上，系统直接读写服务器上的博客文件。

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

1. 安装依赖

```bash
pnpm install
```

2. 创建 `.env` 文件

复制根目录下的 `.env.example` 为 `.env`，并填写必需的配置。

3. 开发环境启动

```bash
pnpm dev
```

dev模式会同时启动前端和服务端。

4. 生产环境启动

```bash
pnpm start
```

prod模式会先构建前端，再启动服务端。

5. 停止服务

```bash
pnpm stop
```

## 常见问题

### 启动脚本报错 `.env 文件不存在`

请检查根目录是否存在 `.env` 文件，并正确填写环境变量。

---

[Mizuki](https://github.com/LyraVoid/Mizuki) - [@matsuzaka-yuki](https://github.com/matsuzaka-yuki)
