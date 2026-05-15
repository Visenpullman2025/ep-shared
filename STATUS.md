# ExpatTH 项目现状总览

> 最后更新：2026-05-15（含全屏审计结果 + legal v1 + UGC 合规 + dashboard 改造）
> 维护人：项目负责人（Visen）+ AI 协作（按 CHARTER §2 §3 边界）
> 用途：随时掌握项目进度的一张地图

---

## 项目是什么

泰国外籍人士本地服务撮合平台。用户选标准服务→填需求→系统粗报价→匹配商家→商家确认价格和时间→用户锁单→支付→履约→评价结算。

四个仓库（含一个文档总线）：

- `ep`：用户端（Next.js + next-intl）— 30001
- `epmerchant`：商家端（Next.js + next-intl）— 30002
- `epbkend/expatth-backend`：后端（Laravel + MySQL，54 张表）— 30003
- `ep-shared`：合同 / 术语 / 状态机 / 规则总线（本目录，不含运行时代码）
- `dashboard`：本地开发控制面（Node + SQLite）— 30004

---

## 现在能跑通的完整流程

### ✅ 用户侧
| 功能 | 状态 |
|------|------|
| 注册 / 登录（含 Supabase OAuth + 本地双通道） | 完成 |
| 实名认证（提交，独立于资料） | 完成 |
| 地址管理 + GPS 默认位置 | 完成 |
| 浏览标准服务列表（13 服务，7 类目） | 完成 |
| 标准服务详情 + 内联报价 | 完成 |
| 填需求 → 拿粗报价 | 完成 |
| 创建订单（新主链：standardServiceCode + quotePreviewId） | 完成 |
| 查看商家候选 | 完成 |
| 确认商家报价（MQC） | 完成 |
| 订单列表 / 订单详情 | 完成 |
| 发起售后 | 完成 |
| 对商家评价（含发广场） | 完成 |
| 钱包余额 / 流水 / 充值 / 提现（人工确认） | 完成 |
| 广场浏览 / 发帖 / 评论 / 关注 | 完成 |
| **UGC 合规：举报 + 屏蔽（24h SLA）** | 完成（2026-05-15）|
| **法律协议 v1（中文）：服务 / 隐私 / 社区 / 商家 / 举报 5 篇** | 完成（占位符待填）|

### ✅ 商家侧
| 功能 | 状态 |
|------|------|
| 注册 / 登录 | 完成 |
| 资料填写（含位置 + 一键 GPS） | 完成 |
| 实名提交（独立于资料保存） | 完成 |
| 能力配置（标准服务 + 定价规则 + 容量/时段） | 完成 |
| 全局可用性设置（readyStatus + 黑名日） | 完成 |
| 看到候选订单请求 | 完成 |
| 提交 MQC（终局价 + 服务时间） | 完成 |
| 订单列表 / 订单详情 | 完成 |
| 开始服务 / 完成服务（履约事件） | 完成 |
| 履约异常动作（迟到、未履约、改约、争议） | 完成 |
| 对用户评价 | 完成 |
| 信用档案（只读） | 完成 |
| 钱包 / 结算记录 | 完成 |
| 广场发帖 + UGC 合规 | 完成 |
| Dashboard 看板 + CS 派单台（Dcat 后台） | 完成 |

### ✅ 后端 / 数据库
| 内容 | 状态 |
|------|------|
| MySQL RDS，54 张表 | 完成 |
| 主链迁移（P1/P2/P3）全部跑完 | 完成 |
| 所有 P1 路由已注册且有实现 | 完成 |
| Dcat 后台（管理员查看 + CS 派单） | 完成 |
| 人工审核充值入口 | 完成 |
| Supabase Auth 中间件（HS256 双通道） | 完成 |

---

## 还没做的

### ❌ 支付系统（整体未开始）
- 第三方支付接入（外部申请中）
- 支付意图创建（PaymentController 已有框架，未接真实网关）
- 预授权 / 冻结 / 释放
- 自动结算给商家
- 提现真实处理（当前只有记录，无真实出款）

### ❌ 智能匹配（v1.8 计划）
- 基于距离 + 能力的动态候选推荐算法
- 商家可用性 + 时间槽自动匹配
- 当前候选是简单规则生成（MerchantMatchingService 已上线最小版）

### ❌ PostgreSQL 能力库（明确暂停）
- AI 语义搜索 / 距离搜索 / 向量化能力匹配
- MySQL 支撑所有现有流程

### ❌ 自动化结算
- 平台 1% 服务费 + 7% 税费自动扣除（依赖支付）
- 结算到商家钱包自动触发（依赖支付）

### ❌ 完整取消 / 退款
- 取消罚款目前前端硬编码 20%（**V-20260510-002 accepted-temporary**，等支付网关）
- 退款真实处理未实现

### 🔴 测试覆盖（v1.5 阻塞项 — 详见审计 V-20260515-004）
- 三仓有效测试 ~3 个用例：epbkend OrderPricingTest 2 case + epmerchant legal.test.ts；其余示例/空壳
- 商家端 Playwright 2/3 e2e 因版本冲突不可跑
- 用户端 src/ 单测 0 个

---

## 已知问题（代码层面，2026-05-15 全屏审计复审）

| 问题 | 位置 | 严重度 | 状态 | V- 编号 |
|------|------|--------|------|---|
| MerchantPortalController 320 行 33 方法 | 后端 | 🔴 高 | ✅ 已拆为 4 个 Controller | — |
| 前端硬编码订单状态判断 | ep/orders-permissions.ts | 🔴 高 | ✅ 已改为后端 nextAction | V-20260510-001 fixed |
| API 响应格式不统一 | ep/epmerchant | 🟡 中 | ✅ 统一为 {list, listCount} | — |
| locale 默认值 'zh' 硬编码 | 后端 12 处 Controller | 🟢 低 | ✅ middleware 统一 | — |
| 前端硬编码取消罚款 20% | epmerchant/.../order-controller-utils.ts:62 | 🟡 中 | 🔵 accepted-temporary | V-20260510-002 |
| services/ 与 capabilities/ 并存 | epmerchant | 🟡 中 | 🔵 过渡期保留，v1.8 前确定边界 | — |
| **§7 行数门禁恶化：90 文件超限** | ep 35 + epmerchant 21 + epbkend 34 | 🔴 高 | 🔵 accepted-temporary | V-20260513-002（2026-05-15 复审更新）|
| OrderFlowService eager load 优化 | epbkend StandardServiceController | 🟡 中 | ✅ 已加 with('requirementTemplates') | — |
| **OrderFlowService.php 仍 684 行** | epbkend Services/Client/ | 🔴 高 | ⚠️ 待拆（v1.5 应该完成） | V-20260513-002 |
| **ServiceProcessTemplateController.php Admin 719 行** | epbkend Admin/Controllers/ | 🔴 高 | ⚠️ 待拆 | V-20260513-002 |
| **PostDetailClient.tsx 双仓 619/622 行 + 8 处 any** | ep + epmerchant | 🟠 中-高 | ⚠️ 待拆 | V-20260513-002 |
| **NAMING §3 自违（status 行带备注）** | ep-shared/api/registry.md, requests.md | 🟡 中 | ✅ 2026-05-15 批量修复 | V-20260515-001 fixed |
| **epbkend 4 个 migration 含演示数据** | database/migrations/*seed*.php | 🟡 中 | 🔵 open | V-20260515-002 |
| **Supabase 集成 4 项落代码先于 shared** | epbkend + ep | 🟡 中 | 🔵 已反向补 R-20260510-001~004 + R-20260513-001 | V-20260513-001 |
| **三仓有效测试覆盖近零** | 全项目 | 🔴 高 | 🔵 open（v1.5 阻塞） | V-20260515-004 |

---

## 版本路线

### v1.0 — 主交易链路跑通 ✅ 完成
用户下单 → 商家 MQC → 用户确认 → 订单进入待支付。链路有真实后端支撑，前后端已联调。

### v1.1 — 代码质量 & 边界修复 ✅ 完成（部分声明与现状有出入，已校正）
- MerchantPortalController 拆分为 4 个 Controller ✅
- 前端状态判断改为后端下发 nextAction ✅
- API 响应格式统一为 {list, listCount} ✅
- locale 硬编码清除 ✅
- dashboard 版本路线 + API Ref 模块 ✅
- 废弃 quote/ 目录已删 ✅
- ep/profile page 380→153 行 ✅
- epmerchant/services/[serviceId] page 435→160 行 ✅
- wallet.ts 移除越界字段引用 ✅
- StandardServiceController 加 eager load 消除 N+1 ✅
- ⚠️ services/ 与 capabilities/ 并存：v1.8 前再决策

### v1.2 — Legal v1 + UGC 合规 + dashboard 升级 ✅ 完成（2026-05-15）
- 平台法律协议 v1 中文版（服务/隐私/社区/商家/举报）— 占位符 4 项（公司名/地址/客服 LINE）由 R-20260515-001 跟踪
- App Review 1.2 UGC 合规：ReportSheet 双端集成、`/api/reports`、`/api/users/{id}/block`，后端实现待补（BFF 容错 queued_pending_backend）
- 商户端补 `/api/posts` 修死调用
- Dashboard 改造（30004 端口固定 + 服务启动器 + 审计快照面板 — 计划本周）

### v1.5 — 支付网关 + 结算自动化 + 测试覆盖（等外部申请）
**🔴 阻塞项（按 2026-05-15 审计 Top 3）**：
1. 删除 epmerchant 硬编码罚款 20%（V-20260510-002）— 罚款规则后端下发
2. 补 5+ 关键 e2e 测试（订单/MQC/支付/罚款/售后）— 当前 V-20260515-004 零覆盖
3. 修 epmerchant Playwright 版本冲突

并行做：
- 第三方支付接入（外部申请）
- 预授权 / 冻结 / 释放
- 平台 1% 服务费 + 7% 税费自动结算
- 完整取消 / 退款流程
- 拆 OrderFlowService.php (684 行) + MeCenterController.php (389 行) + 11 个超 §7 Controller

### v1.8 — 界面 & 功能全面可上线
- 智能候选匹配（距离 + 能力）
- 测试覆盖达到基本门槛（前/后端 e2e + 关键 unit）
- 所有 §7 行数门禁违规清零（V-20260513-002 close 条件）
- services/ 与 capabilities/ 边界确定
- 4 个 migration 演示数据拆离（V-20260515-002）

### v2.0 — PostgreSQL + AI 能力库（明确暂停）
- AI 语义搜索 / 距离搜索 / 向量化能力匹配
- 广场内容精细化分发
- 信用体系自动改分

---

## 全屏审计评分（2026-05-15）

| 仓库 | 综合分 | 关键摘要 |
|---|---:|---|
| ep-shared | **8.0/10** | 治理结构典范；NAMING §3 自违已修 |
| ep | **7.3/10** | BFF 纯透传 + 设计系统好；测试缺失 + 35 文件超 §7 |
| epmerchant | **5.5/10** | 硬编码罚款未删 + 21 文件超 §7 + 测试 1 个 |
| epbkend | **5.0/10** | Controller 业务膨胀 + 34 文件超 §7 + 演示数据混入 migration |
| **项目总分** | **6.2/10** | — |

**六维度（项目级）**：架构边界 7.0 / 代码质量 4.7 / 合同一致性 7.5 / 前端设计 8.0 / **测试 2.3** / 文档治理 7.75

详见 `docs/audit/2026-05-15-project-audit.md`。

---

## 下一步要做什么（按优先级）

### 🔴 v1.5 lockdown 前必须
1. 删除 epmerchant 硬编码罚款 20%（V-20260510-002）
2. 补 5+ 关键 e2e（V-20260515-004）
3. 修 epmerchant Playwright 版本冲突

### 🟠 v1.5 期内做
4. 拆 OrderFlowService.php (684 行) → 子流程 ≤300 行（V-20260513-002）
5. 拆 11 个超 120 行 Controller（V-20260513-002）
6. 拆 PostDetailClient.tsx 双仓 619/622 行（V-20260513-002）

### 🟡 不阻塞 v1.5
7. 拆 4 个含演示数据的 migration（V-20260515-002）
8. 补完法律协议 4 个占位符（R-20260515-001）
9. dashboard 三面板（审计快照 / 版本路线 / 门禁计数）— 本周

### ⚪ 等外部
- 第三方支付申请
- v2.0 PostgreSQL（明确暂停）

---

## shared 目录里各文件是干什么的

| 文件 | 用途 | 还有用吗 |
|------|------|---------|
| `CHARTER.md` | 最高法，文件主权 + 不可妥协原则 | ✅ 核心，只读（人类专属维护） |
| `CONSTITUTION.md` | 项目规则总纲 | ✅ 核心 |
| `MANIFEST.md` | 入口索引 + 触发阅读表 | ✅ 核心 |
| `NAMING.md` | 文件 / ID / 状态值命名规范 | ✅ 核心 |
| `STATUS.md`（本文件） | 项目整体现状 | ✅ 随时更新 |
| `api/requests.md` | 所有需求条目（R-xxx），唯一需求池 | ✅ 核心 |
| `api/registry.md` | 已实现的 API 目录 | ✅ 核心 |
| `api/user-api.md` | 用户端 HTTP 合同细节 | ✅ 联调参考 |
| `api/merchant-api.md` | 商家端 HTTP 合同细节 | ✅ 联调参考 |
| `api/internal-api.md` | 内部接口 | ✅ 参考 |
| `api/error-codes.md` | 错误码语义定义 | ✅ 联调参考 |
| `data/violations.json` | 越界审计 V- 条目，唯一源 | ✅ 核心 |
| `docs/state-machine.md` | 订单状态机完整定义 | ✅ 核心 |
| `docs/boundaries.md` | 各端职责边界 | ✅ 核心 |
| `docs/glossary.md` | 7 个核心业务词定义 | ✅ 核心 |
| `docs/fulfillment-flow.md` | 交易全流程叙述 | ✅ 参考 |
| `docs/product-brief.md` | 产品方向 | ✅ 参考 |
| `docs/design-log.md` | 设计/交互变更编年史 | ✅ 核心，每轮更新 |
| `db/schema-plan.md` | 数据库表职责说明 | ✅ 参考 |
| `db/migration-map.md` | 旧表→新表映射 | 🟡 迁移基本完成 |
| `db/postgres-clean-rewrite.md` | PostgreSQL 计划 | ⏸ 暂停 |
| `workflow/ai-protocol.md` | AI 协作协议 | ✅ 核心 |
| `workflow/slash-commands.md` | 斜杠命令清单 | ✅ 参考 |
| `legal/*/zh.md` | 法律协议 v1 中文版（5 篇） | ✅ 已上线，占位符待填 |
| `archive/2026-04-28-P0.5/` | P0.5 时期 roles/ + reports/ 历史快照 | 🟡 仅供查阅 |
| `rules/growth-hook.mjs` | 规则候选追加脚本 | ✅ 工具 |
