# GameAgent - 教学互动游戏生成工具需求文档

## 1. 项目概述

**项目名称**：GameAgent - 教学互动游戏生成工具

**项目目标**：开发一个基于AI的工具，能够通过自然语言指令自动生成各种教学互动小游戏，并实时、透明地展示生成过程，提供类似VSCode和Cline结合的自动编程体验。

**核心理念**：用户通过自然语言控制Agent，观察Agent工作过程，Agent自主完成从需求分析到代码实现的全过程，并显性展示每一步的思考和执行过程。

**核心技术栈**：
- Next.js（核心框架）
- TypeScript
- 阿里云通义千问 API（通过现有的ai.service.ts集成，模型 qwen-plus-2025-04-28）
- WebSocket（用于实时状态更新）
- React（Next.js的一部分）

## 2. 功能需求

### 2.1 用户界面

#### 2.1.1 集成工作区界面
- **顶部 - 自然语言交互区**
  - 大型输入框，支持多行文本输入
  - 发送按钮
  - 历史对话记录，可滚动查看
  - 快捷指令按钮（如"创建新游戏"、"修改当前游戏"、"解释这段代码"等）

- **中央 - Agent工作展示区**
  - **思考过程面板**：显示Agent当前的思考过程、决策理由和计划
  - **执行操作面板**：实时展示Agent正在执行的操作（如创建文件、编写代码、调试等）
  - **文件变更面板**：展示文件的创建、修改和删除情况
  - 所有面板均自动滚动，跟随Agent的最新活动

- **右侧 - 游戏预览区**
  - iframe实时展示游戏原型
  - 自动刷新，反映最新变更
  - 可展开/收起，调整预览大小

- **左侧 - 项目资源区（可折叠）**
  - 文件浏览器，展示目录树结构
  - 只读模式为默认状态，强调"观察"而非"编辑"
  - 点击文件可在中央区域查看内容，但不直接进入编辑模式

#### 2.1.2 进度与状态展示
- **底部状态栏**
  - 多阶段进度条，显示当前所处阶段：
    1. 需求理解
    2. 设计规划
    3. 代码编写
    4. 测试与调试
    5. 完成与优化
  - 整体任务进度百分比
  - Agent当前状态指示器（思考中、编码中、测试中等）
  - 预计完成时间

#### 2.1.3 工作流控制
- **控制按钮（小而不突出）**
  - 暂停/继续：临时暂停Agent工作
  - 重启：放弃当前进度，重新开始
  - 编辑模式切换：仅在需要时切换到编辑模式（非默认状态）

### 2.2 Agent功能

#### 2.2.1 自然语言理解
- 解析用户的自然语言指令
- 提取关键需求和约束条件
- 在不明确时主动提问澄清

#### 2.2.2 透明思考过程
- 显性展示每一步的思考逻辑
- 解释决策原因和考虑的替代方案
- 预测可能的问题和解决方案

#### 2.2.3 自主工作流程
- **需求分析**：生成详细的需求文档
- **设计规划**：创建游戏架构和组件设计
- **代码实现**：生成完整的游戏代码
- **测试调试**：自动测试和修复问题
- **优化完善**：改进性能和用户体验

#### 2.2.4 实时反馈
- 持续更新工作状态和进度
- 展示代码生成过程
- 实时预览游戏效果

### 2.3 游戏类型支持

系统应支持生成以下类型的教学互动游戏：

- **问答游戏**：多选题、填空题、判断题等
- **匹配游戏**：配对概念、术语与定义匹配等
- **排序游戏**：按顺序排列事件、步骤或概念
- **拖放游戏**：将元素拖放到正确位置
- **记忆游戏**：记忆并匹配卡片或信息
- **解谜游戏**：解决与教学内容相关的谜题
- **模拟游戏**：模拟实验或场景的简单版本
- **角色扮演游戏**：通过对话或选择进行角色扮演学习

### 2.4 游戏特性支持

系统应支持在游戏中集成以下特性：

- **计时功能**：限时完成任务或记录完成时间
- **积分系统**：根据表现给予分数和奖励
- **难度递增**：随着玩家进步逐渐增加难度
- **即时反馈**：对玩家操作提供即时反馈
- **进度保存**：保存玩家进度，支持继续游戏
- **数据统计**：记录和展示玩家表现数据
- **多媒体支持**：集成图像、音频和视频内容
- **响应式设计**：适应不同屏幕尺寸和设备

## 3. 非功能需求

### 3.1 性能需求
- Agent响应时间不超过3秒
- 实时更新延迟不超过1秒
- 游戏预览加载时间不超过5秒
- 支持同时处理多个游戏项目

### 3.2 安全需求
- 保护API密钥和敏感信息
- 实现用户会话管理
- 防止XSS和CSRF攻击
- 安全处理用户输入

### 3.3 可用性需求
- 简洁直观的自然语言交互界面
- 清晰可见的Agent工作过程
- 最小化用户操作步骤
- 提供清晰的错误消息和帮助信息

### 3.4 可扩展性需求
- 支持多种教学游戏类型
- 可扩展的游戏模板系统
- 插件架构，便于添加新功能
- 支持自定义主题和样式

## 4. 用户场景

### 场景1：创建新游戏
教师想要为历史课创建一个时间线排序游戏。他通过自然语言描述需求："我需要一个关于中国古代朝代顺序的排序游戏，适合初中学生，包含从秦朝到清朝的10个主要朝代，每个朝代显示名称、年代和一个代表性事件。游戏应该有计时功能和三次尝试机会。"

Agent接收指令后，开始显示思考过程，生成需求文档，设计游戏架构，编写代码，并实时展示每一步操作。教师可以观察整个过程，并在右侧预览区看到游戏的实时效果。

### 场景2：修改现有游戏
教师已经创建了一个数学问答游戏，但想要增加难度级别选择功能。他输入："在现有的数学问答游戏中添加难度选择功能，包括简单、中等和困难三个级别，每个级别的问题数量和复杂度不同。"

Agent理解指令，分析现有代码，展示修改计划，并开始实施更改。教师可以观察Agent如何修改代码，以及这些更改如何影响游戏功能。

### 场景3：调试问题
教师发现生成的游戏在计分功能上有问题。他输入："游戏中的计分系统似乎有问题，当回答正确时分数没有增加。"

Agent分析问题，检查相关代码，识别bug，展示修复方案，并实施修复。整个调试过程对教师可见，帮助他理解问题和解决方案。

### 场景4：自动化游戏创建流程
教育工作者想要创建一个新的教学游戏，但不确定具体的技术实现细节。她点击界面上的"创建新游戏"快捷按钮，然后在输入框中描述："我需要一个针对高中生物学的细胞结构学习游戏，学生需要将细胞各部分组件拖放到正确位置，并回答关于每个组件功能的问题。"

输入完成后，她点击发送按钮，系统立即开始工作：

1. **复杂度评估阶段**：Agent首先在思考过程面板中显示它正在分析任务复杂度。它识别出这是一个结合了拖放游戏和问答游戏的混合类型，复杂度中等偏高。状态栏显示"需求理解"阶段，进度为15%。

2. **资源分配阶段**：基于复杂度评估，Agent自动决定调用AI服务的策略：
   - 对于游戏结构设计：调用高质量但较慢的AI模型
   - 对于内容生成：使用更快速的AI模型
   - 对于代码实现：分批次调用AI，优先处理核心功能
   
   这一决策过程在思考过程面板中清晰可见，教育工作者可以了解系统如何根据任务特性优化资源使用。

3. **并行工作流程**：随着Agent进入"设计规划"阶段（状态栏进度更新到30%），执行操作面板显示Agent同时启动了多个并行任务：
   - 一个任务负责设计游戏的拖放机制
   - 另一个任务负责设计问答系统
   - 第三个任务负责准备细胞结构的数据模型
   
   文件变更面板实时显示相关文件的创建和修改，教育工作者可以看到项目结构如何逐步形成。

4. **自适应调整**：当Agent进入"代码编写"阶段（状态栏进度更新到55%）时，它遇到了拖放功能实现的挑战。系统自动调整策略：
   - 增加了对这部分功能的AI资源分配
   - 在思考过程面板中展示了几种可能的实现方案及其权衡
   - 选择了最适合教学目的的实现方式
   
   整个决策和调整过程对教育工作者完全透明，她可以理解系统为什么做出这些选择。

5. **实时预览与反馈**：在"测试与调试"阶段（状态栏进度更新到75%），游戏预览区显示了一个可交互的原型。教育工作者可以尝试拖放细胞组件，系统会根据她的交互自动识别潜在问题并进行修复，这些修复过程在执行操作面板中实时显示。

6. **最终优化**：进入"完成与优化"阶段（状态栏进度更新到90%），Agent专注于提升游戏体验：
   - 优化拖放的响应速度
   - 改进视觉反馈
   - 增强问题的教学价值
   - 添加成绩统计功能
   
   这些优化在文件变更面板中可见，教育工作者可以观察到代码如何演变以提供更好的用户体验。

整个过程中，教育工作者只需提供初始需求描述，然后观察Agent如何自主完成从需求分析到最终实现的全过程。系统根据任务复杂度自动调整AI调用策略，优化资源使用，并在各个阶段提供透明的工作过程展示。最终，一个完全符合需求的教学游戏在大约15分钟内完成，而教育工作者全程了解每一步的决策和实现细节。

## 5. 约束条件

### 5.1 技术约束
- 必须使用Next.js作为核心框架
- 必须集成现有的ai.service.ts来调用AI API（当前为阿里云通义千问）
- 游戏必须能在现代浏览器中运行，无需额外插件
- 代码必须符合TypeScript最佳实践

### 5.2 业务约束
- 系统必须支持至少8种不同类型的教学游戏
- 游戏内容必须可定制，以适应不同教学主题
- 系统应优先考虑用户体验和易用性

## 6. 验收标准

### 6.1 功能验收
- 用户能够通过自然语言指令成功创建各类教学游戏
- Agent能够显性展示工作过程的每一步
- 生成的游戏能够正常运行并满足指定需求
- 用户能够通过自然语言指令修改和调试游戏

### 6.2 性能验收
- Agent响应时间符合性能需求
- 实时更新延迟符合性能需求
- 游戏预览加载时间符合性能需求

### 6.3 用户体验验收
- 用户界面简洁直观，符合设计规范
- Agent工作过程清晰可见，易于理解
- 游戏预览效果良好，交互流畅
