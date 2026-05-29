<div align="center">
<img alt="logo" src="./public/logo.svg" width="80"/>
<h2>Dream Site</h2>
<p>一个以极简设计呈现的现代化个人导航站，帮助你高效访问常用网站与优质资源。</p>
</div>

<div align="center">
  <a href="https://nextjs.org/" target="_blank">
    <img alt="Next" src="https://img.shields.io/badge/Next-16.0-black?style=flat&logo=Next.js">
  </a>
  <a href="https://www.sqlite.org/" target="_blank">
    <img alt="SQLite" src="https://img.shields.io/badge/SQLite-black?style=flat&logo=sqlite">
  </a>
  <a href="https://tailwindcss.com/" target="_blank">
    <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-black?style=flat&logo=tailwindcss">
  </a>
  <a href="./LICENSE" target="_blank">
    <img alt="LICENSE" src="https://img.shields.io/badge/license-MIT-blue">
  </a>
</div>

## ☘️ 项目简介

`Dream Site` 是一个单用户、纯本地的个人站点导航系统。支持书签导入导出、多级分类、隐私模式、系统设置等完整的后台管理功能。

## 🌿 在线体验

➡️ [点击打开](https://dream.baiwumm.com/)

## 🪴 技术栈

- **前端框架**: [Next 16.0](https://nextjs.org/) (基于 React 19.x)
- **UI组件**: [Hero UI](https://www.heroui.com/)
- **样式方案**: [Tailwind CSS](https://www.tailwindcss.cn/)
- **图标库**: Gravity UI Icons / Font Awesome
- **数据库**: [SQLite](https://www.sqlite.org/) (better-sqlite3)
- **认证**: JWT (jose + bcryptjs)
- **动画**: Motion (Framer Motion)
- **部署平台**: 支持 `Vercel` 等多种部署方式

## ✨ 特性

- 🚀 **高性能**: 基于最新前端技术栈，极速响应
- 🌓 **主题切换**: 完善的亮色/暗黑模式支持
- 🔍 **SEO友好**: 支持SSR渲染，优化搜索引擎收录
- 📱 **响应式设计**: 适配各种设备屏幕
- 🔒 **安全认证**: JWT + httpOnly Cookie 单用户系统
- 🧩 **模块化架构**: 清晰的目录结构，便于二次开发
- 💾 **零外部依赖**: SQLite 本地数据库，无需云服务
- 👤 **单用户模式**: 部署时首次创建设置管理员，无需注册
- 🔖 **书签导入导出**: 支持 Chrome/Edge/Firefox 书签 HTML 格式
- 🎨 **内联编辑**: 表格内直接切换开关、点击图标切换隐私状态
- 🏷️ **多级分类**: 支持无限层级父子分类，前端树形目录导航
- 👁️ **隐私模式**: 分类可设为隐私，登录后可选择显示/隐藏
- ⚙️ **系统设置**: 网站名称/描述/Logo/版权/Footer/Header 按钮等全局配置

## 🪴 项目截图

| 亮色模式 | 暗色模式 |
|----------|----------|
| ![亮色模式](./public/light.png) | ![暗色模式](./public/dark.png) |

| 网站分类 | 网站列表 |
|----------|----------|
| ![分类列表](./public/categorys.png) | ![站点列表](./public/websites.png) |

## 🚀 快速开始

### 🌳 环境要求
- Node.js ≥ 18.17 (推荐最新 LTS 版本)
- npm (推荐)

### ⚙️ 环境变量

在项目根目录创建 `.env`，示例（可参考 `.env.example`）：

```bash
# 数据库文件路径
DATABASE_PATH=./data/dream-site.db

# JWT 密钥 (请替换为随机字符串, 至少 32 字符)
JWT_SECRET=your-random-secret-string

# 以下为可选项 (可在后台系统设置中修改)
NEXT_PUBLIC_APP_NAME = 'Dream Site'
NEXT_PUBLIC_APP_DESC = '一个以极简设计呈现的现代化个人导航站'
NEXT_PUBLIC_APP_URL = 'http://localhost:5173'
NEXT_PUBLIC_COPYRIGHT = '白雾茫茫丶'
```

### 🧑‍💻 本地开发
```bash
# 克隆项目
git clone https://github.com/baiwumm/dream-site.git

# 进入项目目录
cd dream-site

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问任意后台页面会自动跳转到 `/setup` 首次设置页，创建管理员账号后即可使用。

### 📥 导入浏览器书签
1. 在 Chrome/Edge 中打开 `chrome://bookmarks/` 或 `edge://favorites/`
2. 导出为 HTML 文件
3. 进入后台 → 网站列表 → 点击「导入书签」→ 选择导出的文件
4. 自动识别多级分类、获取网站图标和描述

## ⚙️ Vercel 一键部署
1. `Fork` 本项目，在 `Vercel` 官网点击 `New Project`
2. 点击 `Import Git Repository` 并选择你 fork 的此项目并点击 `import`
3. `PROJECT NAME` 自己填，`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可

> **注意**: Vercel 是无状态 Serverless 环境，SQLite 数据库写入 `/tmp` 后可能被回收。仅建议体验使用，正式使用请参考下方生产部署方案。

<a href="https://vercel.com/dashboard" target="_blank">
<img alt="vercel 部署" src="./public/vercel.svg" />
</a>

## 🚢 生产部署

由于项目使用 SQLite 本地数据库，推荐部署在**持久化存储**的环境中。

### 方式一：VPS / 云服务器（推荐）

适用于阿里云、腾讯云、AWS EC2、DigitalOcean 等任意 Linux 服务器。

```bash
# 1. 安装 Node.js ≥ 18
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 2. 克隆项目
git clone https://github.com/baiwumm/dream-site.git
cd dream-site

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，修改 JWT_SECRET 为随机字符串

# 4. 安装依赖并构建
npm install
npm run build

# 5. 使用 PM2 守护进程
npm install -g pm2
pm2 start npm --name "dream-site" -- start
pm2 save
pm2 startup
```

之后通过 Nginx 反向代理到 `localhost:5173` 即可对外提供服务。

### 方式二：Docker 部署

```dockerfile
# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
ENV DATABASE_PATH=/data/dream-site.db
VOLUME /data
CMD ["npm", "start"]
```

```bash
# 构建并运行
docker build -t dream-site .
docker run -d -p 5173:5173 -v /opt/dream-site/data:/data dream-site
```

### 方式三：Vercel + Turso（云数据库方案）

如需在 Vercel 上正式部署，可将 SQLite 替换为 [Turso](https://turso.tech/)（基于 libSQL 的云数据库），支持 Vercel Edge 并持久化存储。

> 更换数据库为 Turso 需要修改 `src/lib/db/connection.ts` 中的数据库驱动，具体可参考 Turso 官方文档。

## 📜 许可证
本项目采用 [MIT](LICENSE) 许可证。

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=baiwumm/dream-site&type=Date)](https://star-history.com/#baiwumm/dream-site&Date)
