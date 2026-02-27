# MOK Vue Admin
MOK Vue Admin 是一个基于 Vue 3 + TypeScript + Vite 构建的中后台前端解决方案。它提供了完整的权限控制（动态路由、菜单、按钮）、丰富的业务模块（用户、角色、权限、文件、订单、商品、优惠券等）以及开箱即用的代码结构。项目采用 Pinia 进行状态管理，使用 Element Plus 作为 UI 组件库，并集成了 Axios 请求封装、路由守卫、国际化（中文）等基础能力。

## **技术栈**
**核心框架**：Vue 3 + TypeScript

**构建工具**：Vite

**UI 组件库**：Element Plus

**状态管理**：Pinia

**路由管理**：Vue Router 4

**HTTP 请求**：Axios

代码规范：ESLint + TypeScript

**其他**：@element-plus/icons-vue、lodash-es 等

## 功能特性
✅ 用户登录：集成验证码、Token 刷新、自动登录

✅ 权限控制：基于动态路由的菜单权限 + 基于按钮/接口的权限指令（hasPermission）

✅ 仪表盘：系统状态监控（健康检查、内存使用、运行时间）

✅ 用户管理：用户增删改查、头像上传、密码重置

✅ 角色管理：角色增删改查、权限分配

✅ 权限管理：权限（目录/菜单/按钮）的树形管理

✅ 文件管理：文件上传（拖拽/点击）、预览、下载、批量删除

✅ 操作日志：记录用户操作，支持按条件查询、定时清理

✅ 订单管理：订单列表、支付、取消（模拟接口）

✅ 商品管理：商品增删改查、秒杀设置、优惠券配置

✅ 秒杀管理：测试接口（下单、获取验证码、初始化库存）

✅ 个人中心：查看/修改个人信息、修改密码

## 项目结构

```text
mok-vue-admin/
├── public/                     # 静态资源（favicon.ico）
├── src/
│   ├── api/                    # API 接口模块（按业务拆分）
│   │   └── index.ts            # 所有 API 统一导出
│   ├── components/             # 通用组件
│   │   └── MenuItem.vue        # 递归菜单组件
│   ├── layout/                 # 布局组件
│   │   └── Layout.vue          # 主布局（顶部 + 侧边菜单 + 内容区）
│   ├── router/                 # 路由配置
│   │   └── index.ts            # 路由守卫、动态路由生成
│   ├── stores/                 # Pinia 状态存储
│   │   ├── counter.ts          # 示例计数器
│   │   └── user.ts             # 用户信息、菜单、权限
│   ├── types/                  # TypeScript 类型定义
│   │   ├── element-plus.d.ts   # Element Plus 语言包类型
│   │   └── index.ts            # 全局类型（响应、用户、权限等）
│   ├── utils/                  # 工具函数
│   │   ├── formatter.ts        # 日期、JSON 格式化
│   │   ├── icons.ts            # 图标映射
│   │   └── request.ts          # Axios 请求封装（拦截器、Token 刷新）
│   ├── views/                   # 页面视图
│   │   ├── base/                # 基础页面
│   │   │   ├── dashboard/       # 仪表盘
│   │   │   ├── profile/         # 个人中心
│   │   │   └── welcome/         # 欢迎页
│   │   ├── error/               # 错误页（404）
│   │   ├── order/               # 订单模块
│   │   │   ├── coupon/          # 优惠券管理
│   │   │   ├── delivery/        # 发货管理
│   │   │   ├── order/           # 订单管理
│   │   │   ├── product/         # 商品管理
│   │   │   └── seckill/         # 秒杀管理
│   │   ├── system/              # 系统管理
│   │   │   ├── files/           # 文件管理
│   │   │   ├── operation-log/   # 操作日志
│   │   │   ├── permission/      # 权限管理
│   │   │   ├── role/            # 角色管理
│   │   │   └── user/            # 用户管理
│   │   └── Login.vue            # 登录页
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 应用入口
├── .env                         # 环境变量示例（请自行创建）
├── .eslintrc.js                 # ESLint 配置
├── index.html                   # 入口 HTML
├── package.json                 # 依赖管理
├── tsconfig.json                # TypeScript 配置（含引用）
├── vite.config.ts               # Vite 配置
└── README.md                    # 本文档
```

## 快速开始
### 环境要求
Node.js 16.x 或更高版本

包管理器npm

#### 安装
##### 克隆项目

```bash
git clone https://github.com/your-repo/mok-vue-admin.git
cd mok-vue-admin
```


##### 安装依赖
```bash 
npm install
```
##### 配置环境变量
复制` .env.example` 文件为 `.env`（如果没有示例文件，请参考以下内容手动创建）：


```env
VITE_API_BASE_URL=/api     # 后端 API 基础路径，代理或实际地址
```

##### 开发运行

```bash
npm run dev
```

> 应用将启动在 http://localhost:5173（默认端口可能被占用，请查看控制台输出）。

##### 构建打包

```bash
npm run build
```

> 构建产物将输出到 dist 目录，可直接部署到静态服务器。

### 开发指南

#### 权限控制说明
##### 菜单权限
登录后，前端调用 `/permission/my-menus` 获取用户的菜单树。

路由守卫根据菜单树动态生成路由（`addDynamicRoutes`），实现不同用户可见菜单不同。

菜单组件 `MenuItem.vue` 递归渲染侧边栏。

##### 按钮/接口权限
用户登录后获取 API 权限列表（`permissionApi.getUserApiPermissions`），存储在 `userStore.apiPermissions` 中。

**权限编码格式**：如 `system:user:add`，可通过 `userStore.hasPermission('system:user:add') `判断。

在模板中使用 `v-if="userStore.hasPermission('xxx')"` 控制元素显隐。

#### API 请求
所有 API 请求均封装在 `src/api/index.ts` 中，按业务模块导出。请求统一使用 request 实例`（src/utils/request.ts）`，该实例已配置：

- **自动携带 Token**

- **响应拦截统一处理错误码**

- **Token 过期自动刷新（基于 refreshToken）**

- **支持 Blob 响应类型（文件下载）**

**示例：**


```typescript
import { userApi } from '@/api'

// 获取用户列表
const res = await userApi.getUsers({ pageNum: 1, pageSize: 10 })
```
