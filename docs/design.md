# GameAgent - 教学互动游戏生成工具设计文档

## 1. 系统架构

### 1.1 总体架构

系统采用前后端分离的架构，前端使用Next.js框架，后端通过API与AI服务进行交互（当前为阿里云通义千问）。

```mermaid
graph TD
    A[用户自然语言输入] --> B[Agent控制器]
    B --> C[思考引擎]
    C --> D[AI服务]
    D --> E[AI API (通义千问)]
    C --> F[工作计划生成器]
    F --> G[执行引擎]
    G --> H[文件系统]
    G --> I[代码生成器]
    I --> J[游戏模板库]
    G --> K[测试引擎]
    G --> L[预览生成器]
    M[WebSocket服务] --> N[实时状态更新]
    B --> M
    G --> M
```

### 1.2 组件架构

系统由以下主要组件构成：

1. **前端UI组件**：负责用户界面展示和交互
2. **Agent控制器**：协调各组件工作，管理工作流程
3. **AI服务**：与AI API（当前为阿里云通义千问）交互，处理自然语言理解和生成
4. **执行引擎**：执行代码生成、文件操作等任务
5. **WebSocket服务**：提供实时状态更新和通信
6. **游戏预览服务**：构建和展示生成的游戏

### 1.3 技术栈详情

- **前端**：
  - Next.js 14+
  - React 18+
  - TypeScript 5+
  - TailwindCSS（样式）
  - SWR（数据获取）
  - Socket.io-client（WebSocket客户端）

- **后端**：
  - Next.js API Routes
  - Node.js
  - TypeScript
  - Socket.io（WebSocket服务器）
  - ai.service.ts（AI API集成，当前为阿里云通义千问）

- **开发工具**：
  - ESLint（代码质量）
  - Prettier（代码格式化）
  - Jest（测试）
  - Cypress（E2E测试）

## 2. 数据流设计

### 2.1 用户交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant NLI as 自然语言界面
    participant Agent as Agent控制器
    participant AI as AI服务
    participant Files as 文件系统
    participant Preview as 游戏预览
    
    User->>NLI: 输入游戏需求（自然语言）
    NLI->>Agent: 传递用户指令
    Agent->>AI: 分析用户需求
    AI-->>Agent: 返回理解结果
    Agent->>NLI: 显示思考过程
    
    Agent->>AI: 生成工作计划
    AI-->>Agent: 返回计划步骤
    Agent->>NLI: 显示计划和决策理由
    
    loop 每个开发阶段
        Agent->>AI: 请求生成内容
        AI-->>Agent: 返回生成内容
        Agent->>Files: 创建/修改文件
        Agent->>NLI: 显示执行操作和文件变更
        Agent->>Preview: 更新游戏预览
        Agent->>NLI: 更新进度和状态
    end
    
    Agent->>NLI: 完成通知
    User->>NLI: 查看结果或提供反馈
    opt 用户提供反馈
        NLI->>Agent: 传递反馈
        Agent->>AI: 分析反馈
        loop 修改循环
            Agent->>Files: 调整文件
            Agent->>Preview: 更新预览
        end
    end
```

### 2.2 数据模型

#### 2.2.1 项目数据模型

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  gameType: GameType;
  createdAt: Date;
  updatedAt: Date;
  status: ProjectStatus;
  files: File[];
  currentStage: DevelopmentStage;
  progress: number; // 0-100
}

enum GameType {
  QUIZ = 'quiz',
  MATCHING = 'matching',
  SORTING = 'sorting',
  DRAG_DROP = 'drag_drop',
  MEMORY = 'memory',
  PUZZLE = 'puzzle',
  SIMULATION = 'simulation',
  ROLE_PLAY = 'role_play'
}

enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

enum DevelopmentStage {
  REQUIREMENT_ANALYSIS = 'requirement_analysis',
  DESIGN = 'design',
  CODING = 'coding',
  TESTING = 'testing',
  OPTIMIZATION = 'optimization'
}
```

#### 2.2.2 文件数据模型

```typescript
interface File {
  id: string;
  name: string;
  path: string;
  type: FileType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
}

enum FileType {
  DOCUMENT = 'document', // .md, .txt
  SOURCE_CODE = 'source_code', // .js, .ts, .jsx, .tsx
  STYLE = 'style', // .css, .scss
  ASSET = 'asset', // images, audio
  CONFIG = 'config', // .json, .yaml
  TEST = 'test' // .test.js, .spec.ts
}
```

#### 2.2.3 Agent状态数据模型

```typescript
interface AgentState {
  id: string;
  projectId: string;
  currentTask: string;
  thinking: string; // 当前思考内容 (通常是最新的思考步骤描述)
  action: AgentAction; // 当前执行的操作
  stage: DevelopmentStage;
  progress: number; // 0-100
  status: AgentStatus;
  logs: AgentLog[];
  estimatedTimeRemaining: number; // 秒
  thoughtProcess?: ThoughtStep[]; // 结构化的思考步骤历史
  error?: { message: string; details?: string; }; // 错误信息
}

// (ThoughtStep 和 ThoughtStage 的定义可以不在此处重复，它们是 AgentState 的一部分)
// export enum ThoughtStage { ... }
// export interface ThoughtStep { ... }


enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  CODING = 'coding',
  TESTING = 'testing',
  PAUSED = 'paused'
}

interface AgentAction {
  type: ActionType;
  description: string;
  target?: string; // 文件路径或其他目标
  timestamp: Date;
}

enum ActionType {
  CREATE_FILE = 'create_file',
  MODIFY_FILE = 'modify_file',
  DELETE_FILE = 'delete_file',
  RUN_TEST = 'run_test',
  BUILD = 'build',
  ANALYZE = 'analyze'
}

interface AgentLog {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
  context?: any;
}

enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}
```

### 2.3 API设计

#### 2.3.1 RESTful API

| 端点                      | 方法   | 描述          | 请求体                             | 响应                   |
| ------------------------- | ------ | ------------- | ---------------------------------- | ---------------------- |
| `/api/projects`           | GET    | 获取所有项目  | -                                  | `Project[]`            |
| `/api/projects`           | POST   | 创建新项目    | `{ name, description, gameType }`  | `Project`              |
| `/api/projects/:id`       | GET    | 获取特定项目  | -                                  | `Project`              |
| `/api/projects/:id`       | PUT    | 更新项目      | `{ name?, description?, status? }` | `Project`              |
| `/api/projects/:id`       | DELETE | 删除项目      | -                                  | `{ success: boolean }` |
| `/api/projects/:id/files` | GET    | 获取项目文件  | -                                  | `File[]`               |
| `/api/files/:id`          | GET    | 获取文件内容  | -                                  | `File`                 |
| `/api/files/:id`          | PUT    | 更新文件内容  | `{ content }`                      | `File`                 |
| `/api/agent/status`       | GET    | 获取Agent状态 | -                                  | `AgentState`           |
| `/api/agent/control`      | POST   | 控制Agent     | `{ action: 'start'                 | 'pause'                | 'resume' | 'stop' }` | `{ success: boolean }` |

#### 2.3.2 WebSocket事件

| 事件名称                     | 方向          | 描述                      | 数据                                                                                                                            |
| ---------------------------- | ------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent:thinking`             | 服务器→客户端 | Agent思考过程更新         | `{ projectId, thinking }`                                                                                                       |
| `agent:action`               | 服务器→客户端 | Agent执行操作             | `{ projectId, action }`                                                                                                         |
| `agent:progress`             | 服务器→客户端 | 进度更新                  | `{ projectId, stage, progress, timeRemaining }`                                                                                 |
| `agent:log`                  | 服务器→客户端 | 日志消息                  | `{ projectId, log }`                                                                                                            |
| `file:created`               | 服务器→客户端 | 文件创建通知              | `{ projectId, file: File }`                                                                                                     |
| `file:updated`               | 服务器→客户端 | 文件更新通知              | `{ projectId, fileId: string, changes: any, file?: Partial<File> }` (FileChange like: `{id, operation, file, diff, timestamp}`) |
| `file:deleted`               | 服务器→客户端 | 文件删除通知              | `{ projectId, fileId: string }` (FileChange like: `{id, operation, file, timestamp}`)                                           |
| `preview:updated`            | 服务器→客户端 | 预览更新通知              | `{ projectId, url }`                                                                                                            |
| `agent:thoughtProcessUpdate` | 服务器→客户端 | (可选) 结构化思考步骤更新 | `{ projectId, thoughtProcess: ThoughtStep[] }`                                                                                  |

## 3. 详细组件设计

### 3.1 前端组件

#### 3.1.1 页面组件

- **MainLayout**: 主布局组件，包含所有工作区组件
  - 负责整体布局和响应式调整
  - 管理各面板的大小和位置

- **NaturalLanguageInput**: 自然语言输入组件
  - 多行文本输入框
  - 历史消息展示
  - 快捷指令按钮
  - 发送按钮

- **AgentWorkspacePanel**: Agent工作展示面板
  - 包含思考过程、执行操作和文件变更三个子面板
  - 支持面板切换和调整大小

- **GamePreviewPanel**: 游戏预览面板
  - iframe容器
  - 刷新按钮
  - 调整大小控件

- **ProjectExplorerPanel**: 项目资源面板
  - 文件树组件
  - 文件查看器
  - 折叠/展开控制

- **TemplateExplorerPanel**: 游戏模板浏览与体验面板 (新任务 3.4)
  - **位置**: 可能作为项目资源面板的一个标签页，或者一个独立的面板，也可能集成在用户创建新项目或选择游戏类型时的流程中。
  - **功能**:
      - 展示所有可用的基础游戏模板（如问答、匹配、排序等）。
      - 每个模板以卡片形式展示，包含模板名称、简要描述、预览图（如果提供）。
      - 提供“体验”或“预览”按钮，点击后在 `GamePreviewPanel` 中加载并运行该模板的示例游戏。
  - **数据来源**:
      - 扫描 `gagent/public/templates/` 目录。
      - 每个模板子目录（如 `quiz`, `matching`, `sorting`）下应包含一个 `manifest.json` 文件，定义模板的元数据。
  - **交互**:
      - 点击模板卡片或“体验”按钮，触发 `GamePreviewPanel` 加载模板的 `entryPoint` 文件。

- **StatusControlBar**: 状态控制栏
  - 进度条组件
  - 状态指示器
  - 控制按钮
  - 时间估计显示

#### 3.1.2 UI组件层次结构

```mermaid
graph TD
    MainLayout --> Header;
    Header --> ProjectSelector;
    MainLayout --> NaturalLanguageInput;
    NaturalLanguageInput --> InputArea;
    NaturalLanguageInput --> MessageHistory;
    NaturalLanguageInput --> QuickCommandButtons;
    MainLayout --> MainContent;
    MainContent --> AgentWorkspacePanel;
    AgentWorkspacePanel --> ThinkingProcessPanel;
    AgentWorkspacePanel --> ActionExecutionPanel;
    AgentWorkspacePanel --> FileChangesPanel;
    MainContent --> GamePreviewPanel;
    GamePreviewPanel --> IframeContainer;
    GamePreviewPanel --> PreviewControls;
    MainContent --> ProjectExplorerPanel;
    ProjectExplorerPanel --> FileTree;
    ProjectExplorerPanel --> FileViewer;
    ProjectExplorerPanel --> TemplateExplorerPanel; // 新增：模板浏览器可以放在这里
    MainLayout --> StatusControlBar;
    StatusControlBar --> ProgressIndicator;
    StatusControlBar --> StageIndicator;
    StatusControlBar --> TimeEstimator;
    StatusControlBar --> ControlButtons;
```

### 3.2 Agent组件

#### 3.2.1 Agent控制器

Agent控制器是系统的核心组件，负责协调各个子系统的工作。主要功能包括：

- 接收和解析用户指令
- 管理Agent生命周期和状态
- 协调AI服务调用
- 监督执行引擎工作
- 管理WebSocket通信

```typescript
class AgentController {
  constructor(projectId: string) {
    // 初始化
  }
  
  // 启动Agent工作流程
  async start(instruction: string): Promise<void> {
    // 实现
  }
  
  // 暂停Agent工作
  pause(): void {
    // 实现
  }
  
  // 继续Agent工作
  resume(): void {
    // 实现
  }
  
  // 停止Agent工作
  stop(): void {
    // 实现
  }
  
  // 处理用户反馈
  async handleFeedback(feedback: string): Promise<void> {
    // 实现
  }
  
  // 获取当前状态
  getState(): AgentState {
    // 实现
  }
}
```

#### 3.2.2 思考引擎

思考引擎负责生成和管理Agent的思考过程，使其对用户可见。主要功能包括：

- 生成结构化思考步骤
- 解释决策理由
- 预测潜在问题
- 规划解决方案

```typescript
class ThinkingEngine {
  constructor(aiService: AIService) {
    // 初始化
  }
  
  // 分析用户需求
  async analyzeRequirement(instruction: string): Promise<RequirementAnalysis> {
    // 实现
  }
  
  // 生成工作计划
  async generateWorkPlan(analysis: RequirementAnalysis): Promise<WorkPlan> {
    // 实现
  }
  
  // 解决问题
  async solveProblem(problem: Problem): Promise<Solution> {
    // 实现
  }
  
  // 评估代码
  async evaluateCode(code: string): Promise<CodeEvaluation> {
    // 实现
  }
}
```

#### 3.2.3 执行引擎

执行引擎负责执行具体的操作，如文件创建、代码生成等。主要功能包括：

- 文件系统操作
- 代码生成和修改
- 测试执行
- 构建和预览

```typescript
class ExecutionEngine {
  constructor(fileSystem: FileSystem, codeGenerator: CodeGenerator, testRunner: TestRunner) {
    // 初始化
  }
  
  // 执行工作计划
  async executeWorkPlan(plan: WorkPlan): Promise<void> {
    // 实现
  }
  
  // 创建文件
  async createFile(path: string, content: string): Promise<File> {
    // 实现
  }
  
  // 修改文件
  async modifyFile(fileId: string, changes: FileChanges): Promise<File> {
    // 实现
  }
  
  // 删除文件
  async deleteFile(fileId: string): Promise<boolean> {
    // 实现
  }
  
  // 运行测试
  async runTests(filePatterns: string[]): Promise<TestResult> {
    // 实现
  }
  
  // 构建项目
  async buildProject(): Promise<BuildResult> {
    // 实现
  }
}
```

### 3.3 游戏生成引擎

游戏生成引擎负责基于模板生成各类教学游戏。主要功能包括：

- 模板选择和适配
- 游戏逻辑生成
- UI组件生成
- 资源生成和集成

```typescript
class GameGenerator {
  constructor(templateLibrary: TemplateLibrary) {
    // 初始化
  }
  
  // 选择合适的模板
  selectTemplate(gameType: GameType, requirements: GameRequirements): Template {
    // 实现
  }
  
  // 生成游戏代码
  async generateGameCode(template: Template, customizations: Customizations): Promise<GameCode> {
    // 实现
  }
  
  // 生成游戏资源
  async generateGameAssets(requirements: GameRequirements): Promise<GameAssets> {
    // 实现
  }
  
  // 集成游戏组件
  async integrateGameComponents(code: GameCode, assets: GameAssets): Promise<Game> {
    // 实现
  }
}
```

## 4. 用户界面设计

### 4.0 数据模型补充 (与模板浏览相关)

#### 4.0.1 `TemplateManifest` 接口
```typescript
// src/types/template.ts (或者一个更合适的位置)
export interface TemplateManifest {
  id: string; // 模板唯一ID，例如 "quiz-template"
  name: string; // 模板显示名称，例如 "问答游戏模板"
  description: string; // 模板的简短描述
  version: string; // 模板版本
  previewImageUrl?: string; // 模板预览图的相对路径 (相对于模板根目录)
  entryPoint: string; // 模板示例的入口HTML文件名，例如 "index.html"
  tags?: string[]; // 模板标签，用于分类和搜索
  author?: string; // 模板作者
  createdAt?: string; // 创建日期
}
```

#### 4.0.2 游戏模板目录结构约定

每个游戏模板将存放在 `gagent/public/templates/{templateId}/` 目录下 (例如 `gagent/public/templates/quiz-template/`)，至少包含：
- `manifest.json` (必需): 描述模板元数据，用于模板浏览器。内容遵循 `TemplateManifest` 接口。
    - 示例 `gagent/public/templates/quiz-template/manifest.json`:
      ```json
      {
        "id": "quiz-template",
        "name": "问答游戏模板",
        "description": "一个基础的问答游戏，支持选择题和判断题。",
        "version": "1.0.0",
        "previewImageUrl": "quiz-preview.png",
        "entryPoint": "index.html",
        "tags": ["教育", "知识测验"],
        "author": "GameAgent Team"
      }
      ```
- 由 `manifest.json` 中 `entryPoint` 指定的文件 (例如 `index.html`): 游戏主入口文件。
- `style.css` (或类似样式文件): 游戏样式。
- `script.js` (或类似脚本文件): 游戏逻辑。
- `config.json` (或类似配置文件, 可选): 定义游戏具体内容，如问题、匹配项、排序元素等。这个文件由AI根据用户需求生成或修改，或者由模板示例自带。
- 由 `manifest.json` 中 `previewImageUrl` 指定的文件 (例如 `quiz-preview.png`, 可选): 模板的预览图。

### 4.1 布局设计

系统界面采用分区布局，确保各功能区域清晰可见且易于交互。
- **桌面端 (中等屏幕及以上)**: 采用可拖拽调整的三栏布局（项目资源区、Agent工作展示区、游戏预览区），使用 `allotment` 库实现。
- **移动端 (小屏幕)**: 采用垂直堆叠布局，`Agent工作展示区` 占据主要空间，`项目资源区` 和 `游戏预览区` 可通过按钮切换显示/隐藏。

```
桌面端示例:
+-------------------------------------------+
|                 顶部导航栏                 |
+-------------------------------------------+
|          自然语言交互区                    |
+----------+-------------------+------------+
| 项目资源 |   Agent工作展示区  |   游戏预览 |
| (可拖拽) |   (可拖拽)        |   (可拖拽) |
+----------+-------------------+------------+
|        状态栏 & 控制按钮                   |
+-------------------------------------------+

移动端示例 (切换显示 项目资源区):
+-------------------------------------------+
|                 顶部导航栏                 |
+-------------------------------------------+
|          自然语言交互区                    |
+-------------------------------------------+
|          [显示预览按钮] [显示文件按钮]       |
+-------------------------------------------+
|                项目资源区                  |
+-------------------------------------------+
|              Agent工作展示区               |
+-------------------------------------------+
|        状态栏 & 控制按钮                   |
+-------------------------------------------+
```

### 4.2 界面元素设计

#### 4.2.1 自然语言交互区

- **输入框**：
  - 高度自适应的多行文本框（小屏幕上默认行数减少以优化空间）。
  - 占据顶部区域的大部分宽度。
  - 支持Markdown格式输入。
  - 自动补全和提示功能。

- **历史消息**：
  - 可滚动的消息历史记录。
  - 用户消息和Agent响应区分显示。
  - 支持消息折叠/展开。
  - 代码块语法高亮。

- **快捷指令按钮**：
  - 常用指令的快捷按钮。
  - 悬停显示详细说明。
  - 可自定义和扩展。
  - 在小屏幕上可能默认隐藏或整合。

#### 4.2.2 Agent工作展示区

- **思考过程面板**：
  - 结构化展示思考步骤
  - 使用缩进和图标表示层次
  - 关键决策高亮显示
  - 支持展开/折叠详细内容

- **执行操作面板**：
  - 命令行风格界面
  - 操作类型图标标记
  - 时间戳显示
  - 状态指示（成功/失败/进行中）

- **文件变更面板**：
  - 差异对比视图
  - 文件树结构导航
  - 变更类型颜色编码
  - 代码语法高亮

#### 4.2.3 游戏预览区

- **iframe容器**：
  - 自适应大小
  - 边框和阴影效果
  - 加载状态指示器

- **预览控制**：
  - 刷新按钮
  - 全屏切换
  - 设备模拟选择（响应式测试）

#### 4.2.4 项目资源区

- **文件树**：
  - 层次结构展示
  - 文件类型图标
  - 上下文菜单
  - 搜索过滤功能

- **文件查看器**：
  - 代码语法高亮
  - 行号显示
  - 只读模式指示
  - 切换到编辑模式按钮（非默认）

#### 4.2.5 状态控制栏

- **进度条 (`ProgressIndicator`)**：
  - 多阶段进度显示，使用图标和颜色区分不同阶段（需求分析、设计、编码、测试、优化、完成）。
  - 当前阶段高亮，并有动画提示。
  - 鼠标悬停在阶段图标上时，通过 `title` 属性显示阶段全名。
  - 整体进度条显示当前阶段的完成百分比。

- **状态指示器 (`StageIndicator`)**：
  - 图标和文字组合，显示 Agent 的当前具体状态 (IDLE, THINKING, CODING, etc.)。
  - 根据不同状态使用不同颜色和动画（如 THINKING, CODING 时有脉冲动画）。

- **控制按钮 (`ControlButtons`)**：
  - 包含暂停、继续、停止、新任务/重置等按钮，并配有相应图标。
  - 按钮的显隐和文本根据 Agent 当前状态动态调整，逻辑更清晰。
    - 例如，IDLE 状态下显示“新任务”按钮。

- **时间估计 (`TimeEstimator`)**：
  - 预计完成时间显示。
  - 倒计时格式。
- **响应式行为**:
  - 在小屏幕上，状态栏的三个主要区域（状态/时间、进度条、控制按钮）会垂直堆叠以优化空间。中等及以上屏幕恢复水平排列。

### 4.3 交互设计

#### 4.3.1 自然语言交互

- **输入提交**：
  - 按Enter键（无Shift）提交。
  - 点击发送按钮提交。
  - 提交后自动清空输入框。
- **输入框响应式**:
  - 在小屏幕上，输入框默认行数减少，以节省垂直空间。

- **历史浏览**：
  - 上下箭头键浏览历史输入。
  - 点击历史消息可复制到输入框。

- **快捷指令**：
  - 点击快捷指令按钮自动填充输入框。
  - 支持自定义快捷指令。
  - 在小屏幕上，快捷指令区域可能默认隐藏或通过特定交互显示。

#### 4.3.2 面板交互

- **面板调整 (桌面端)**：
  - 使用 `allotment` 库实现，用户可以通过拖动分隔线自由调整项目资源区、Agent工作区和游戏预览区之间的相对宽度。
  - 支持设置最小面板尺寸。
- **面板显隐切换 (移动端)**：
  - 在小屏幕上，项目资源区和游戏预览区默认可能不完全显示（或只显示一部分，如Agent工作区为主）。
  - 提供明确的切换按钮（例如，“显示文件”、“显示预览”）来展开或隐藏这两个侧边面板，以便用户可以聚焦于特定内容。Agent工作区会动态调整以利用可用空间。

- **标签页切换**：
  - 在Agent工作展示区中切换不同面板（思考过程、执行操作、文件变更）。
  - 支持键盘快捷键切换。

- **滚动行为**：
  - 面板内容超出时自动出现滚动条。
  - 思考过程、执行操作等面板自动滚动以跟随最新内容。
  - 手动滚动时暂停自动滚动。
  - 可能提供返回底部按钮快速回到最新内容。

#### 4.3.3 文件交互

- **文件浏览**：
  - 点击文件夹展开/折叠
  - 点击文件在查看器中打开
  - 右键菜单提供额外操作

- **文件查看**：
  - 语法高亮显示
  - 代码折叠
  - 搜索功能
  - 切换到编辑模式（需确认）

#### 4.3.4 控制交互

- **工作流控制**：
  - 暂停/继续按钮控制Agent工作
  - 重启按钮重新开始当前任务
  - 编辑模式切换需确认

- **预览控制**：
  - 刷新按钮手动更新预览
  - 调整大小控件改变预览区域大小
  - 设备模拟下拉菜单选择不同设备尺寸

## 5. 技术实现细节

### 5.1 Agent思考过程可视化

Agent的思考过程将通过以下方式显性化：

#### 5.1.1 思考阶段标记

Agent的思考过程将被分解为以下标准化阶段：

1. **问题定义**：
   - 明确当前需要解决的问题
   - 提取用户指令中的关键需求
   - 确定约束条件和优先级

2. **信息收集**：
   - 列出已知信息
   - 识别需要获取的信息
   - 确定信息来源

3. **方案构思**：
   - 提出可能的解决方案
   - 列举各方案的实现步骤
   - 考虑技术可行性

4. **方案评估**：
   - 分析各方案的优缺点
   - 考虑时间和资源约束
   - 评估潜在风险

5. **决策**：
   - 选择最佳方案
   - 解释选择理由
   - 制定实施计划

每个阶段将使用特定的图标、颜色和格式在界面中展示，使用户能够清晰地跟踪Agent的思考过程。

#### 5.1.2 代码生成过程展示

代码生成过程将通过以下步骤展示：

1. **结构规划**：
   - 展示文件和目录结构
   - 定义组件和模块关系
   - 规划数据流

2. **函数/组件设计**：
   - 定义函数签名和组件接口
   - 说明参数和返回值
   - 描述组件职责和生命周期

3. **算法选择**：
   - 解释算法选择理由
   - 分析时间和空间复杂度
   - 考虑替代算法

4. **代码实现**：
   - 展示代码生成的中间步骤
   - 解释关键代码段
   - 添加注释说明

5. **优化和重构**：
   - 识别优化机会
   - 解释重构决策
   - 展示优化前后对比

### 5.2 WebSocket实时更新

WebSocket将用于以下实时更新：

#### 5.2.1 连接管理

```typescript
// 客户端连接管理
class WebSocketManager {
  private socket: Socket;
  
  constructor(projectId: string) {
    this.socket = io('/agent', {
      query: { projectId }
    });
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.socket.on('agent:thinking', this.handleThinkingUpdate);
    this.socket.on('agent:action', this.handleActionUpdate);
    this.socket.on('agent:progress', this.handleProgressUpdate);
    this.socket.on('agent:log', this.handleLogUpdate);
    this.socket.on('file:created', this.handleFileCreated);
    this.socket.on('file:updated', this.handleFileUpdated);
    this.socket.on('file:deleted', this.handleFileDeleted);
    this.socket.on('preview:updated', this.handlePreviewUpdated);
  }
  
  // 事件处理方法...
}
```

#### 5.2.2 事件类型

1. **Agent状态更新**：
   - `agent:thinking`: Agent思考过程更新
   - `agent:action`: Agent执行操作
   - `agent:progress`: 进度更新
   - `agent:log`: 日志消息

2. **文件变更通知**：
   - `file:created`: 文件创建事件
   - `file:updated`: 文件修改事件
   - `file:deleted`: 文件删除事件

3. **预览更新**：
   - `preview:updated`: 游戏预览更新

#### 5.2.3 实现方式

服务器端使用Socket.io实现WebSocket服务，客户端使用Socket.io-client连接。每个项目创建一个独立的房间，确保消息只发送给相关客户端。

```typescript
// 服务器端WebSocket实现
import { Server } from 'socket.io';

export function setupWebSocketServer(server) {
  const io = new Server(server);
  
  // Agent命名空间
  const agentNamespace = io.of('/agent');
  
  agentNamespace.on('connection', (socket) => {
    const { projectId } = socket.handshake.query;
    
    if (projectId) {
      socket.join(`project:${projectId}`);
      console.log(`Client connected to project ${projectId}`);
    }
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  
  return {
    emitThinkingUpdate: (projectId, data) => {
      agentNamespace.to(`project:${projectId}`).emit('agent:thinking', data);
    },
    emitActionUpdate: (projectId, data) => {
      agentNamespace.to(`project:${projectId}`).emit('agent:action', data);
    },
    // 其他emit方法...
  };
}
```

### 5.3 游戏预览实现

游戏预览将通过以下方式实现：

#### 5.3.1 动态构建

1. **文件监听**：
   - 监听项目文件变更
   - 触发自动构建流程
   - 通知预览组件刷新

2. **构建流程**：
   - 使用Next.js构建API
   - 生成静态HTML、CSS和JavaScript
   - 处理资源文件

3. **预览服务**：
   - 提供静态文件服务
   - 支持热重载
   - 处理API请求模拟

#### 5.3.2 iframe集成

```typescript
// 预览组件实现
const GamePreview: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // 设置WebSocket监听预览更新
    socket.on('preview:updated', (data) => {
      if (data.projectId === projectId) {
        setPreviewUrl(data.url);
        setIsLoading(true);
      }
    });
    
    // 初始加载预览URL
    fetchPreviewUrl(projectId).then(url => {
      setPreviewUrl(url);
    });
    
    return () => {
      socket.off('preview:updated');
    };
  }, [projectId]);
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl + '?t=' + new Date().getTime();
    }
  };
  
  return (
    <div className="game-preview-panel">
      {isLoading && <div className="loading-indicator">加载中...</div>}
      <div className="preview-controls">
        <button onClick={handleRefresh}>刷新</button>
        <select onChange={(e) => setDeviceSize(e.target.value)}>
          <option value="desktop">桌面</option>
          <option value="tablet">平板</option>
          <option value="mobile">手机</option>
        </select>
      </div>
      <iframe
        ref={iframeRef}
        src={previewUrl}
        onLoad={handleIframeLoad}
        className={`preview-iframe ${isLoading ? 'loading' : ''}`}
        title="游戏预览"
      />
    </div>
  );
};
```

## 6. 部署与扩展

### 6.1 部署架构

系统将采用以下部署架构：

```mermaid
graph TD
    A[用户浏览器] --> B[Next.js应用]
    B --> C[API Routes]
    C --> D[AI服务]
    D --> E[AI API (通义千问)]
    C --> F[WebSocket服务]
    C --> G[文件系统]
    C --> H[预览服务]
```

### 6.2 扩展性设计

系统设计考虑了以下扩展点：

1. **游戏模板系统**：
   - 支持添加新的游戏类型模板
   - 模板可通过插件机制扩展
   - 自定义模板存储和管理

2. **AI服务扩展**：
   - 支持切换不同的AI提供商
   - 可扩展的提示工程系统
   - 自定义思考过程结构

3. **UI主题和定制**：
   - 可切换的UI主题
   - 自定义面板布局
   - 可配置的快捷指令

4. **插件系统**：
   - 支持第三方插件
   - 标准化的插件API
   - 插件管理界面

### 6.3 性能优化

系统将采用以下性能优化策略：

1. **代码分割**：
   - 按路由分割代码
   - 组件懒加载
   - 动态导入

2. **缓存策略**：
   - API响应缓存
   - 模板缓存
   - 生成代码缓存

3. **资源优化**：
   - 图像优化
   - CSS和JS压缩
   - 字体优化

4. **服务器优化**：
   - 服务器端渲染
   - 静态生成
   - API路由优化

## 7. 安全考虑

### 7.1 API安全

1. **密钥管理**：
   - 使用环境变量存储API密钥
   - 密钥轮换机制
   - 访问控制和审计

2. **请求验证**：
   - 输入验证
   - CSRF保护
   - 速率限制

### 7.2 数据安全

1. **数据存储**：
   - 敏感数据加密
   - 安全的文件存储
   - 数据备份策略

2. **用户数据**：
   - 最小化收集
   - 明确的数据使用政策
   - 数据删除机制

### 7.3 代码安全

1. **生成代码安全**：
   - 代码注入防护
   - 安全的代码执行环境
   - 代码审计机制

2. **依赖管理**：
   - 定期更新依赖
   - 漏洞扫描
   - 最小化依赖

## 8. 测试策略

### 8.1 单元测试

#### 8.1.1 服务层测试

- **文件服务测试** (`gagent/tests/unit/services/file.service.test.ts`)
  - 路径安全性验证
  - 文件读取、写入、删除操作测试
  - 目录创建和列举功能测试
  - 文件存在性检查测试

- **项目服务测试** (`gagent/tests/unit/services/project.service.test.ts`)
  - 项目创建、获取、更新、删除的CRUD操作测试
  - 项目筛选和查询功能测试
  - 内存存储模拟和清理机制测试

- **WebSocket服务测试** (`gagent/tests/unit/services/websocket.service.test.ts`)
  - 各类消息发送功能测试
  - Agent状态更新测试
  - 文件变更通知测试
  - 预览更新广播测试

- **AI服务测试** (`gagent/tests/unit/services/ai.service.test.ts`)
  - API可用性检查测试
  - 文本生成功能测试
  - 错误处理和恢复测试
  - 环境配置测试

- **预览服务测试** (`gagent/tests/unit/services/preview.service.test.ts`)
  - 预览URL生成测试
  - 模板和游戏实例的URL构建测试

#### 8.1.2 核心引擎测试

- **执行引擎测试** (`gagent/tests/unit/lib/agent/execution.test.ts`)
  - 工作计划执行流程测试
  - 文件创建、修改、删除操作测试
  - 代码生成功能测试
  - 错误处理和状态更新测试

- **思考引擎测试** (`gagent/tests/unit/lib/agent/thinking.test.ts`)
  - 需求分析功能测试
  - 工作计划生成测试
  - 解决方案建议功能测试
  - 思考过程记录与通知测试

- **代理控制器测试** (`gagent/tests/unit/lib/agent/controller.test.ts`)
  - 控制流程测试（启动、停止等）
  - 状态管理和转换测试
  - 错误处理和恢复测试
  - 日志记录功能测试

- **游戏生成器测试** (`gagent/tests/unit/lib/game/generator.test.ts`)
  - 模板选择逻辑测试
  - 代码生成功能测试
  - AI提示创建和解析测试
  - 文件集成测试

- **游戏测试器测试** (`gagent/tests/unit/lib/game/tester.test.ts`)
  - 游戏验证功能测试
  - 不同类型游戏的特定测试
  - 错误检测和报告功能测试
  - 游戏运行模拟测试

#### 8.1.3 组件测试

- **状态控制栏测试** (`gagent/tests/unit/components/control/StatusControlBar.test.tsx`)
  - 渲染和样式测试
  - 状态变化响应测试
  - 用户交互测试

### 8.2 集成测试

- API集成测试
- WebSocket测试
- 文件系统测试

### 8.3 端到端测试

- 用户流程测试
- 游戏生成测试
- 性能测试

### 8.4 用户体验测试

- 可用性测试
- A/B测试
- 用户反馈收集
