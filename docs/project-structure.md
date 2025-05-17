# GameAgent项目结构

以下是GameAgent项目的推荐目录结构和关键文件说明，基于Next.js框架和TypeScript。

## 目录结构

```
gameAgent/
├── public/                      # 静态资源
│   ├── assets/                  # 图像、字体等资源
│   │   ├── icons/               # 图标
│   │   └── images/              # 图片
│   └── templates/               # 游戏模板
│       ├── quiz/                # 问答游戏模板
│       ├── matching/            # 匹配游戏模板
│       └── ...                  # 其他游戏类型模板
├── src/                         # 源代码
│   ├── components/              # React组件
│   │   ├── layout/              # 布局组件
│   │   │   ├── MainLayout.tsx   # 主布局组件
│   │   │   └── Header.tsx       # 头部组件
│   │   ├── input/               # 输入相关组件
│   │   │   ├── NaturalLanguageInput.tsx  # 自然语言输入组件
│   │   │   └── QuickCommandButtons.tsx   # 快捷指令按钮
│   │   ├── workspace/           # 工作区组件
│   │   │   ├── AgentWorkspacePanel.tsx   # Agent工作展示面板
│   │   │   ├── ThinkingProcessPanel.tsx  # 思考过程面板
│   │   │   ├── ActionExecutionPanel.tsx  # 执行操作面板
│   │   │   └── FileChangesPanel.tsx      # 文件变更面板
│   │   ├── preview/             # 预览相关组件
│   │   │   ├── GamePreviewPanel.tsx      # 游戏预览面板
│   │   │   └── PreviewControls.tsx       # 预览控制组件
│   │   ├── explorer/            # 资源浏览组件
│   │   │   ├── ProjectExplorerPanel.tsx  # 项目资源面板
│   │   │   ├── FileTree.tsx              # 文件树组件
│   │   │   └── FileViewer.tsx            # 文件查看器
│   │   └── control/             # 控制相关组件
│   │       ├── StatusControlBar.tsx      # 状态控制栏
│   │       ├── ProgressIndicator.tsx     # 进度指示器
│   │       └── ControlButtons.tsx        # 控制按钮
│   ├── pages/                   # Next.js页面
│   │   ├── api/                 # API路由
│   │   │   ├── projects/        # 项目相关API
│   │   │   │   ├── index.ts     # 项目列表API
│   │   │   │   └── [id].ts      # 特定项目API
│   │   │   ├── files/           # 文件相关API
│   │   │   │   └── [id].ts      # 文件操作API
│   │   │   ├── agent/           # Agent相关API
│   │   │   │   ├── status.ts    # 状态API
│   │   │   │   └── control.ts   # 控制API
│   │   │   └── preview/         # 预览相关API
│   │   │       └── [id].ts      # 预览生成API
│   │   ├── _app.tsx             # 应用入口
│   │   ├── _document.tsx        # 文档设置
│   │   ├── index.tsx            # 首页
│   │   └── projects/            # 项目页面
│   │       ├── index.tsx        # 项目列表页
│   │       └── [id].tsx         # 项目详情页
│   ├── services/                # 服务
│   │   ├── ai.service.ts        # AI服务（已有）
│   │   ├── agent.service.ts     # Agent控制服务
│   │   ├── file.service.ts      # 文件操作服务
│   │   ├── project.service.ts   # 项目管理服务
│   │   ├── websocket.service.ts # WebSocket服务
│   │   └── preview.service.ts   # 预览服务
│   ├── utils/                   # 工具函数
│   │   ├── api.ts               # API工具
│   │   ├── format.ts            # 格式化工具
│   │   └── validation.ts        # 验证工具
│   ├── types/                   # TypeScript类型定义
│   │   ├── project.ts           # 项目相关类型
│   │   ├── file.ts              # 文件相关类型
│   │   ├── agent.ts             # Agent相关类型
│   │   └── game.ts              # 游戏相关类型
│   ├── hooks/                   # React钩子
│   │   ├── useWebSocket.ts      # WebSocket钩子
│   │   ├── useAgent.ts          # Agent控制钩子
│   │   └── useProject.ts        # 项目管理钩子
│   ├── contexts/                # React上下文
│   │   ├── AgentContext.tsx     # Agent状态上下文
│   │   └── ProjectContext.tsx   # 项目状态上下文
│   ├── styles/                  # 样式文件
│   │   ├── globals.css          # 全局样式
│   │   └── components/          # 组件样式
│   └── lib/                     # 库和配置
│       ├── agent/               # Agent相关库
│       │   ├── controller.ts    # Agent控制器
│       │   ├── thinking.ts      # 思考引擎
│       │   └── execution.ts     # 执行引擎
│       ├── game/                # 游戏生成相关库
│       │   ├── generator.ts     # 游戏生成器
│       │   └── templates.ts     # 模板管理
│       └── websocket/           # WebSocket相关库
│           └── server.ts        # WebSocket服务器
├── tests/                       # 测试
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # 端到端测试
├── docs/                        # 文档
│   ├── requirements.md          # 需求文档
│   └── design.md                # 设计文档
├── .env                         # 环境变量
├── .env.local                   # 本地环境变量（不提交到版本控制）
├── next.config.js               # Next.js配置
├── tsconfig.json                # TypeScript配置
├── tailwind.config.js           # TailwindCSS配置
├── jest.config.js               # Jest测试配置
├── .eslintrc.js                 # ESLint配置
├── .prettierrc                  # Prettier配置
└── package.json                 # 项目依赖和脚本
```

## 关键文件说明

### 核心服务文件

1. **ai.service.ts**
   - 已有文件，负责与Gemini API交互
   - 提供文本生成功能

2. **agent.service.ts**
   - Agent控制服务
   - 管理Agent生命周期和状态
   - 协调AI服务调用和执行引擎

3. **websocket.service.ts**
   - WebSocket服务
   - 提供实时状态更新
   - 管理客户端连接

4. **file.service.ts**
   - 文件操作服务
   - 管理项目文件的创建、读取、更新和删除
   - 处理文件变更通知

5. **preview.service.ts**
   - 预览服务
   - 构建和提供游戏预览
   - 管理预览URL和刷新

### 核心组件文件

1. **MainLayout.tsx**
   - 主布局组件
   - 管理整体页面结构
   - 协调各面板的布局和大小

2. **NaturalLanguageInput.tsx**
   - 自然语言输入组件
   - 处理用户输入和历史记录
   - 提供快捷指令功能

3. **AgentWorkspacePanel.tsx**
   - Agent工作展示面板
   - 包含思考过程、执行操作和文件变更三个子面板
   - 管理面板切换和展示

4. **GamePreviewPanel.tsx**
   - 游戏预览面板
   - 提供iframe容器展示游戏
   - 包含预览控制功能

5. **ProjectExplorerPanel.tsx**
   - 项目资源面板
   - 展示文件树和文件内容
   - 提供文件浏览和查看功能

6. **StatusControlBar.tsx**
   - 状态控制栏
   - 显示进度和状态
   - 提供工作流控制按钮

### 核心页面文件

1. **pages/index.tsx**
   - 首页
   - 提供项目创建和选择功能
   - 展示系统介绍和使用指南

2. **pages/projects/[id].tsx**
   - 项目详情页
   - 包含完整的工作区界面
   - 集成所有核心组件

3. **pages/api/agent/control.ts**
   - Agent控制API
   - 处理Agent启动、暂停、继续和停止请求
   - 返回控制操作结果

## 依赖列表

以下是项目所需的主要依赖：

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    "tailwindcss": "^3.3.3",
    "swr": "^2.2.4",
    "monaco-editor": "^0.44.0",
    "react-split-pane": "^0.1.92",
    "react-icons": "^4.11.0",
    "uuid": "^9.0.1",
    "axios": "^1.5.1",
    "date-fns": "^2.30.0",
    "react-markdown": "^9.0.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.21",
    "@types/node": "^20.8.2",
    "@types/uuid": "^9.0.4",
    "eslint": "^8.51.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.3",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "jest-environment-jsdom": "^29.7.0", // Or the version you installed
    "cypress": "^14.3.3",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

## 初始化步骤

1. 创建Next.js项目
   ```bash
   npx create-next-app@latest gameAgent --typescript
   ```

2. 安装额外依赖
   ```bash
   cd gameAgent
   npm install socket.io socket.io-client swr monaco-editor react-split-pane react-icons uuid axios date-fns react-markdown highlight.js
   npm install -D @types/uuid jest @testing-library/react cypress
   ```

3. 配置TailwindCSS
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. 复制已有的ai.service.ts到src/services目录

5. 创建基本目录结构
   ```bash
   mkdir -p public/{assets/{icons,images},templates/{quiz,matching}}
   mkdir -p src/{components/{layout,input,workspace,preview,explorer,control},pages/{api/{projects,files,agent,preview}},services,utils,types,hooks,contexts,styles/components,lib/{agent,game,websocket}}
   mkdir -p tests/{unit,integration,e2e}
   mkdir -p docs
   ```

6. 复制需求文档和设计文档到docs目录
   ```bash
   cp requirements.md design.md docs/
   ```

7. 创建基本配置文件
   ```bash
   touch next.config.js tsconfig.json tailwind.config.js jest.config.js .eslintrc.js .prettierrc .env
