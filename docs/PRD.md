# 自我管理 App 产品需求说明（PRD）

**文档版本**：1.4  
**依据**：当前仓库实现反推并与代码对齐；**第 2.4 节**中 **【已交付】** 与 **【规划】** 分别对应实现与路线图。  
**路径**：`docs/PRD.md`

---

## 1. 文档说明

| 项目 | 说明 |
|------|------|
| 读者 | 产品评审、后续开发与维护人员 |
| 范围 | 功能行为、数据规则、界面与存储边界；产品愿景与 AI 能力路线图（与实现区分标注） |
| 术语 | Tab 名称与界面文案与 `App.js` 及各 Screen 保持一致 |

---

## 2. 产品概述

### 2.1 产品名称与定位

- **包名**：`self-management-app`（自我管理）。
- **定位（当前交付）**：在单一应用内提供**首页概览**、**AI 助手（对话 + 工具调用）**、**账号与设置**、时间管理、任务追踪、健康概览、财务流水与习惯打卡等能力，面向个人日常使用；数据优先保存在本地（原生端）。
- **定位（战略）**：打造 **「AI 智能体驱动的自我管理应用」**——不仅记录与展示数据，还通过 **可思考、可分析、可执行** 的闭环，帮助用户把目标拆解为可落地行动，并在执行中持续纠偏（详见 **2.4**）。

### 2.2 技术形态

- **框架**：Expo SDK 50、React Native 0.73、React 18。
- **端**：iOS / Android / Web（Web 依赖 `react-native-web`）。
- **导航**：根 Stack（登录态 / 未登录）+ 登录后 **底部 Tab** + **「账户与设置」** 独立 Stack 页；`@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`。
- **本地数据**：非 Web 使用 `expo-sqlite`；Web 使用内存存储（见第 4 节）。
- **认证**：本地账号（邮箱 + 密码哈希），会话与用户信息见 `AuthContext` / `users` 表（见第 4 节）。

### 2.3 核心价值（一句话）

用户在一个 App 内完成专注计时、待办与优先级、健康指标展示、收支记录与习惯追踪；**长期目标**是在同一数据与操作之上叠加 AI 智能体，实现「想清楚 → 看明白 → 做得到」。

### 2.4 产品愿景：AI 智能体自我管理

**愿景**：用户面对的不是静态工具面板，而是一个 **可思考、可分析、可执行** 的 AI 智能体——理解目标与约束，基于个人数据给出洞察，并把结论转化为可跟踪的下一步行动。

| 能力维度 | 含义 | 与现有模块的关系 | 目标体验 |
|----------|------|------------------|----------|
| **可思考** | 理解目标、偏好与约束，做推理与规划 | 任务、习惯、时间等模块提供「待规划对象」 | **【已交付】** 通义千问（DashScope，用户自备 API Key）；**【规划】** 更深度的目标澄清、周/日计划模板、可解释性增强 |
| **可分析** | 连接时间与习惯、健康、财务等数据，发现规律与异常 | 各模块持久化数据构成「分析数据源」 | **【已交付】** 通过工具 `get_dashboard_summary`、`get_health_snapshot` 等拉取本地数据供模型回答；**【规划】** 趋势图表、异常检测、固定报告 |
| **可执行** | 把结论变成动作并跟踪结果 | 各模块提供「写入与提醒」能力（任务、打卡、记账、专注记录等） | **【已交付】** Function Calling：`add_task`、`set_task_completed`、`add_habit`、`add_expense` 等；**【规划】** 系统通知/日历提醒编排、更多写操作（如专注记录） |

**实现边界说明（当前 vs 规划）**：

- **【已交付】**：底部 Tab **「AI 助手」**（`AiAssistantScreen`）；**阿里云 DashScope** OpenAI 兼容 Chat Completions + 工具定义见 `aiToolDefinitions.js`、执行器 `aiToolExecutor.js`；默认模型 `qwen-plus`；API Key 本机存储（`aiApiKey.js`）；可选 `EXPO_PUBLIC_DASHSCOPE_API_KEY`（见附录 C）预填。
- **【规划】未交付**：本地/端侧大模型、推送与智能提醒编排、Web 端跨域代理（当前 Web 可能受限，见 5.6）。

**Slogan 方向（对外可选）**：「会思考的自我管理」「不只记录，更会帮你做完」「想清楚、看明白、做得到」。

---

## 3. 全局交互与视觉

### 3.1 信息架构

- **未登录**：根 Stack 提供「登录」「注册」。
- **已登录**：根 Stack 包含 **MainTabs（底部 Tab）** 与 **「账户与设置」**（`Account`）页面；从首页可进入账户管理（头像、改密、退出等）。
- 采用**底部 Tab**，共 **7** 个一级页面，顺序固定：

| Tab 名称 | 用途概要 |
|----------|----------|
| 首页 | 今日概览、快捷入口、用户信息入口；无顶栏（`headerShown: false`） |
| AI助手 | 智能对话、OpenAI 工具调用（任务/习惯/概览/健康快照/支出等）；顶栏可清空对话 |
| 时间管理 | 番茄钟、时间相关展示区块 |
| 任务追踪 | 待办与优先级、项目管理展示区 |
| 健康管理 | 健康指标、活动/饮食/睡眠展示 |
| 财务规划 | 预算、收支录入与列表、支出分类展示 |
| 习惯养成 | 习惯增删改、统计与习惯日历 |

### 3.2 视觉与导航样式

- **主色**：`#4CAF50`（Tab 激活色、顶栏背景、主要按钮等）。
- **Tab 栏**：浅灰背景、顶部分割线；图标使用 Ionicons（与路由名绑定）。
- **顶栏**：绿色背景、白色标题与返回/前景色，标题加粗。

---

## 4. 数据与存储策略

### 4.1 平台分支

| 平台 | 存储方式 | 行为说明 |
|------|----------|----------|
| Web（`Platform.OS === 'web'`） | 进程内内存对象 | 刷新页面后数据丢失 |
| iOS / Android | SQLite：`self_management.db` | 持久化在设备本地 |

### 4.2 领域表结构（与实现一致）

以下表在 `initDatabase` 中通过 `CREATE TABLE IF NOT EXISTS` 定义（仅非 Web 路径执行建表语句）：

| 表名 | 字段（逻辑含义） |
|------|------------------|
| `tasks` | `id`，`title`，`completed`（0/1），`priority`，`createdAt` |
| `habits` | `id`，`name`，`completed`（0/1），`streak`，`color`，`createdAt` |
| `transactions` | `id`，`title`，`amount`，`type`，`date`，`createdAt`，`category`（支出分类，默认「其他」；由迁移 `ALTER TABLE` 添加） |
| `health_data` | `id`，`type`，`value`，`date`，`createdAt` |
| `time_records` | `id`，`activity`，`duration`（秒），`date`，`createdAt` |
| `habit_check_ins` | `habit_id`，`date`（主键联合），用于习惯打卡日历 |
| `settings` | `key`，`value`（如 `budget_total` 月度预算） |
| `users` | `id`，`email`，`password_hash`，`nickname`，`createdAt`，`avatar_uri`（头像 URI，由迁移 `ALTER TABLE` 添加） |

### 4.3 数据库初始化说明（实现对齐）

- **`initDatabase`**（`src/utils/database.js`）在 **`AuthProvider` 启动流程**（`bootstrap`）中于冷启动调用一次（原生端执行建表与迁移；Web 端无 SQL，仍使用内存结构）。
- 新增表与迁移（如 `transactions.category`）随 `initDatabase` 在原生端执行；老用户数据库通过 `ALTER TABLE ... ADD COLUMN` 尽力升级（失败时由 SQLite 错误回调吞掉重复列错误）。

---

## 5. 功能需求（按 Tab）

以下每条均标注 **数据真实性**：**真实数据**表示与 `database.js` 或明确业务计算一致；**静态展示**/**随机演示**/**未接线**表示界面或逻辑与持久化无关或未完整打通。

### 5.0 首页、账户与认证（概要）

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 登录 / 注册 | 邮箱 + 密码；密码哈希存储；会话恢复 | **真实数据**（`users` / 会话存储） |
| 首页 | 今日概览（待办未完成、今日专注分钟、习惯数、本月支出）；快捷入口跳转对应 Tab（含 AI 助手）；下拉刷新概览 | **真实数据**（聚合查询） |
| 账户与设置 | 头像（相册/清除）、修改密码、退出账号 | **真实数据**（`updateUserAvatar` / `updateUserPassword` / `signOut`） |

### 5.1 时间管理

**实现文件**：`src/screens/TimeManagementScreen.js`

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 番茄钟 | 默认时长 25 分钟（1500 秒）倒计时；支持开始、暂停/继续、重置 | 交互为真实逻辑 |
| 记录写入 | 用户点击「重置」且已消耗时间（`timeLeft < 25*60`）时，向存储写入一条 `time_records`：`activity` 固定为「番茄钟」，`duration` 为已消耗秒数，`date` 为当天（ISO 日期字符串） | **真实数据**（`addTimeRecord` / `getTimeRecords`） |
| 今日时长汇总 | 进入页面时按当天日期查询 `time_records`，对 `duration` 求和 | **真实数据** |
| 时间统计卡片 | 「今日专注」为当日总秒数格式化；「近7日专注」为最近 7 天（含今日）`time_records` 时长之和；「番茄完成率」为当日「番茄钟」记录条数 / 目标 8 次，封顶 100% | **真实数据**（`getTimeRecords` / `getTimeRecordsBetween`） |
| 日历区块 | 可切换月份；有专注记录（任意活动）的日期显示高亮与打点；数据来自 `getDailyFocusSecondsForMonth` | **真实数据** |

### 5.2 任务追踪

**实现文件**：`src/screens/TaskTrackingScreen.js`

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 新增任务 | 输入标题；优先级三档：`high` / `medium` / `low`；提交后入库并刷新列表 | **真实数据** |
| 任务列表 | 展示标题、完成态、优先级色条；点击行切换完成/未完成 | **真实数据** |
| 删除任务 | 删除指定 `id` | **真实数据** |
| 项目管理 | 多张项目卡片与进度条 | **静态展示**，与 `tasks` 表无关联 |

**说明**：任务领域无 `streak` 字段；Web 端 `updateTask` 内存实现中若传入多余字段为历史残留，以表结构为准。

### 5.3 健康管理

**实现文件**：`src/screens/HealthManagementScreen.js`

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 健康概览 | 展示步数、卡路里、睡眠时长、饮水量；无当日记录时显示 0；点击卡片录入/修改当日值 | 使用 **`upsertHealthData`** 覆盖同日同类型 | **真实数据** |
| 加载逻辑 | 进入页面时按当天日期分别查询四类的 `getHealthData(type, date)` | **真实查询** |
| 活动记录列表 | 列表展示运动名称、时段、时长、卡路里 | **静态展示**（数组写死） |
| 饮食记录 | 多餐次与食物列表 | **静态展示** |
| 睡眠记录 | 入睡、起床、质量文案 | **静态展示** |
| 每日 / 每周 / 每月 Tab | 「每日」展示活动列表；「每周」「每月」为占位说明文案 | **混合** |

### 5.4 财务规划

**实现文件**：`src/screens/FinancePlanningScreen.js`

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 预算总览 | 总预算默认 5000，存于 `settings.budget_total`；可点击修改并持久化；「已使用」= 所有 `expense` 金额之和；「剩余」= 总预算 − 已使用 | **真实数据**（`getSetting` / `setSetting`） |
| 进度条 | 宽度 = `spent / total * 100%`（`total>0`）；当 `spent/total > 0.8` 时条颜色偏红，否则偏橙 | **真实计算** |
| 添加交易 | 支出/收入 Tab；支出可选分类（住房/餐饮/交通/购物/其他）；`date` 为当天；`category` 写入 `transactions` | **真实数据** |
| 交易列表 | 按日期展示历史；支出行展示分类 | **真实数据** |
| 支出分类 | 按当前记账汇总各分类支出金额 | **真实汇总** |

### 5.5 习惯养成

**实现文件**：`src/screens/HabitFormationScreen.js`

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 新增习惯 | 名称 + 预设颜色；初始未完成、`streak` 为 0 | **真实数据** |
| 列表 | 展示名称、颜色边框/填充、连续天数、勾选完成、删除 | **真实数据** |
| 勾选逻辑 | 切换完成态时写回 `habits`；并完成/撤销当日 **`recordHabitCheckIn`**（`habit_check_ins` 表或 Web 内存） | **真实数据** |
| 统计 | 总习惯数、当前完成数、最长连续天数 | **真实数据**（连续天数逻辑仍以当前 `streak` 字段更新规则为准） |
| 习惯日历 | 可切换月份；有打点表示该日至少一条习惯打卡（`getHabitCalendarDatesInMonth`） | **真实数据** |

### 5.6 AI 助手（智能体）

**实现文件**：`src/screens/AiAssistantScreen.js`；服务：`src/services/aiAgent.js`、`aiToolDefinitions.js`、`aiToolExecutor.js`；密钥：`src/auth/aiApiKey.js`。

| 功能 | 需求描述 | 数据真实性 |
|------|----------|------------|
| 对话 | 用户输入自然语言；请求 **阿里云 DashScope** OpenAI 兼容接口（`compatible-mode/v1/chat/completions`），默认模型 **`qwen-plus`**（可改）；维护多轮 `messages`（含工具调用链） | **真实网络请求**；依赖用户自备 DashScope API Key 与额度 |
| 工具调用 | 模型可调用：`list_tasks`、`add_task`、`set_task_completed`、`list_habits`、`add_habit`、`get_dashboard_summary`、`get_health_snapshot`、`add_expense`；执行逻辑见 `aiToolExecutor.js` | **真实数据**（读写 `database.js`） |
| API Key | 阿里云 DashScope API Key；保存至 SecureStore（原生）或 `localStorage`（Web）；可选从 `EXPO_PUBLIC_DASHSCOPE_API_KEY`（或旧名 `EXPO_PUBLIC_OPENAI_API_KEY`）预填（开发）；曾存 OpenAI Key 的用户自动兼容读取 | **本机存储** |
| Web 限制 | 浏览器可能因跨域无法直连云端 API；界面已提示优先使用原生应用或代理 | **环境限制**，非业务逻辑缺陷 |

---

## 6. 非功能需求（当前实现可观测部分）

| 类别 | 说明 |
|------|------|
| 错误提示 | 各模块异步读写失败时，使用系统 `Alert` 提示中文错误信息 |
| 依赖边界 | `package.json` 中存在多项 `expo-*` 能力包；**账户与设置**使用图片选择；**AI 助手**使用 `fetch` 调用阿里云 DashScope（通义千问）。密钥与第三方计费由用户自行承担 |
| 安全 | DashScope API Key 勿提交仓库；使用 `.env` 时仅放 `EXPO_PUBLIC_*` 开发值并依赖 `.gitignore` |

---

## 7. 附录 A：存储 API 与实体对应关系

| 领域 | 导出方法 | 说明 |
|------|----------|------|
| 任务 | `addTask`、`getTasks`、`updateTask`、`deleteTask` | 任务 CRUD |
| 习惯 | `addHabit`、`getHabits`、`updateHabit`、`deleteHabit` | 习惯 CRUD |
| 交易 | `addTransaction`、`getTransactions` | 交易新增与列表（无界面删除） |
| 健康 | `addHealthData`、`getHealthData(type, date)`、`upsertHealthData` | 查询；覆盖写入同日同类型 |
| 时间 | `addTimeRecord`、`getTimeRecords(date)`、`getTimeRecordsBetween`、`getDailyFocusSecondsForMonth` | 按日、区间与月汇总 |
| 习惯打卡 | `recordHabitCheckIn`、`getHabitCalendarDatesInMonth` | 日历打点 |
| 设置 | `getSetting`、`setSetting` | 如月度预算 |
| 初始化 | `initDatabase` | 建表；在 `AuthProvider` 启动时调用（见 4.3） |
| 用户 | `registerUser`、`loginUser`、`getUserById`、`updateUserAvatar`、`updateUserPassword` | 本地账号；头像与改密 |
| AI | `sendChatMessage`（`aiAgent.js`）+ `executeAiTool`（`aiToolExecutor.js`） | 对话与工具；非 SQL 表 |

---

## 8. 附录 B：Web 部署（参考）

- 静态导出命令与发布目录见仓库根目录 `netlify.toml`（如 `npx expo export --platform web`，发布目录 `dist`）。
- 本节仅供部署查阅，**不作为核心业务需求**。

---

## 9. 附录 C：开发环境变量（参考）

- 仓库提供 **`.env.example`**：复制为项目根目录 **`.env`**，填写 `EXPO_PUBLIC_DASHSCOPE_API_KEY`（或兼容旧名 `EXPO_PUBLIC_OPENAI_API_KEY`）后重启 `npx expo start`，可在 **AI 助手** 页自动预填密钥输入框（仍建议点击「保存密钥」写入本机存储）。
- 详见 Expo 文档：[Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/)。

---

## 10. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-03 | 首版，依据当前代码整理 |
| 1.1 | 2026-04-03 | 对齐功能增强：启动建表、时间/习惯/健康/财务真实数据与设置 |
| 1.2 | 2026-04-03 | 产品定位：AI 智能体自我管理愿景（可思考/可分析/可执行）；信息架构修正为 6 Tab + 账户页；`users` 与 `initDatabase` 调用方式对齐实现；附录补充用户 API |
| 1.3 | 2026-04-03 | **AI 助手** 已交付：更新 2.4 边界、7 Tab、§5.6、附录 A/C；非功能与安全说明；开发用 `EXPO_PUBLIC_OPENAI_API_KEY` 与 `.env.example` |
| 1.4 | 2026-04-03 | AI 接口切换为 **阿里云 DashScope**（通义千问 `qwen-plus`）；密钥存储与 `.env` 变量名更新；兼容旧 OpenAI Key 读取 |
