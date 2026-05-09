# ExpatTH 项目现状总览

> 最后更新：2026-05-10
> 维护人：项目负责人（Visen）
> 用途：这是给你自己看的一张地图。不是给 AI 看的规则，是你随时掌握项目进度用的。

---

## 项目是什么

泰国外籍人士服务撮合平台。用户选标准服务→填需求→系统粗报价→匹配商家→商家确认价格和时间→用户锁单→支付→履约→评价结算。

三个代码仓库：
- `ep`：用户端（Next.js）
- `epmerchant`：商家端（Next.js）
- `epbkend`：后端（Laravel + MySQL）
- `ep-shared`：这个目录，合同和文档

---

## 现在能跑通的完整流程

### ✅ 用户侧
| 功能 | 状态 |
|------|------|
| 注册 / 登录 | 完成 |
| 实名认证（提交） | 完成 |
| 地址管理 | 完成 |
| 浏览标准服务列表 | 完成 |
| 标准服务详情 + 内联报价 | 完成 |
| 填需求 → 拿粗报价 | 完成 |
| 创建订单（新主链：standardServiceCode） | 完成 |
| 查看商家候选 | 完成 |
| 确认商家报价（MQC） | 完成 |
| 订单列表 / 订单详情 | 完成 |
| 发起售后 | 完成 |
| 对商家评价 | 完成 |
| 钱包余额 / 流水 | 完成 |
| 充值（人工确认方式） | 完成 |
| 广场浏览 | 完成 |

### ✅ 商家侧
| 功能 | 状态 |
|------|------|
| 注册 / 登录 | 完成 |
| 资料填写（含位置） | 完成 |
| 实名提交（独立于资料保存） | 完成 |
| 能力配置（选标准服务 + 定价规则） | 完成 |
| 全局可用性设置 | 完成 |
| 看到候选订单请求 | 完成 |
| 提交 MQC（终局价 + 服务时间） | 完成 |
| 订单列表 / 订单详情 | 完成 |
| 开始服务 / 完成服务 | 完成 |
| 履约异常动作（迟到、未履约、改约、争议） | 完成 |
| 对用户评价 | 完成 |
| 信用档案（只读） | 完成 |
| 钱包 / 结算记录 | 完成 |
| 广场发帖 | 完成 |

### ✅ 后端 / 数据库
| 内容 | 状态 |
|------|------|
| MySQL RDS，54 张表 | 完成 |
| 主链迁移（P1/P2/P3）全部跑完 | 完成 |
| 所有 P1 路由已注册且有实现 | 完成 |
| Dcat 后台（管理员查看） | 完成 |
| 人工审核充值入口 | 完成 |

---

## 还没做的

### ❌ 支付系统（整体未开始）
- 第三方支付接入（还在申请流程中）
- 支付意图创建（PaymentController 已有框架，未接真实网关）
- 预授权 / 冻结 / 释放
- 自动结算给商家
- 提现真实处理（当前只有记录，无真实出款）

### ❌ 智能匹配（暂缓）
- 基于距离 + 能力的动态候选推荐算法
- 商家可用性 + 时间槽自动匹配
- 目前候选是人工或简单规则生成

### ❌ PostgreSQL 能力库（明确暂停）
- AI 语义搜索
- 距离搜索
- 向量化能力匹配
- 当前 MySQL 支撑所有现有流程，PostgreSQL 不进入当前开发

### ❌ 自动化结算
- 平台 1% 服务费 + 7% 税费自动扣除
- 结算到商家钱包自动触发
- 当前结算流程靠人工

### ❌ 取消 / 退款完整流程
- 取消罚款目前前端硬编码 20%（临时方案）
- 退款真实处理未实现（依赖支付网关）

### ❌ 测试覆盖
- 后端有效测试：1 个文件（OrderPricingTest，2 个 case）
- 用户端测试：0
- 商家端测试：0

---

## 已知问题（代码层面，审计发现）

这些是代码里实际存在的问题，不是文档问题：

| 问题 | 位置 | 严重度 | 状态 |
|------|------|--------|------|
| MerchantPortalController 320 行 33 方法 | 后端 | 🔴 高 | ✅ 已拆分为 4 个 Controller |
| 前端硬编码订单状态判断 | ep/orders-permissions.ts | 🔴 高 | ✅ 改为后端下发 nextAction |
| API 响应格式不统一 | ep/epmerchant | 🟡 中 | ✅ 统一为 {list, listCount} |
| locale 默认值 'zh' 硬编码 | 后端 12 处 Controller | 🟢 低 | ✅ 已清除（middleware 统一处理） |
| 废弃 quote/ 目录仍存在 | ep | 🟢 低 | ✅ 目录已不存在 |
| 前端硬编码取消罚款 20% | epmerchant | 🟡 中 | 🔵 accepted-temporary（等支付网关） |
| services/ 与 capabilities/ 并存 | epmerchant | 🟡 中 | 🔵 过渡期保留，v1.8 前确定边界 |
| 多个页面超行数限制 | ep profile 380行; epmerchant services 435行 | 🟡 中 | ✅ 拆出 useProfileActions / useServiceEditor hook，页面降至 153/160 行 |
| workflowStatus 出现在钱包字段 | ep/src/lib/wallet.ts:111 | 🟡 中 | ✅ 移除，钱包记录只读 status / reviewStatus |
| StandardServiceController 未 eager load | epbkend StandardServiceController | 🟡 中 | ✅ findByCode 加 with('requirementTemplates')，模型走内存过滤 |

---

## 版本路线

### v1.0 — 主交易链路跑通 ✅ 完成
用户下单 → 商家 MQC → 用户确认 → 订单进入待支付。链路有真实后端支撑，前后端已联调。

### v1.1 — 代码质量 & 边界修复 ✅ 完成
- MerchantPortalController 拆分为 4 个 Controller ✅
- 前端状态判断改为后端下发 nextAction ✅
- API 响应格式统一为 {list, listCount} ✅
- locale 硬编码清除（middleware 统一处理）✅
- dashboard 版本路线 + API Ref 模块 + JS bug 修复 ✅
- 废弃 quote/ 目录已不存在 ✅
- ep/profile page.tsx 380→153 行（useProfileActions hook） ✅
- epmerchant/services/[serviceId] page.tsx 435→160 行（useServiceEditor hook） ✅
- wallet.ts 移除钱包记录 workflowStatus 字段越界引用 ✅
- StandardServiceController findByCode 加 eager load，消除 N+1 ✅
- services/ 与 capabilities/ 并存 → 过渡期保留，v1.8 前确定边界 🔵

### v1.5 — 支付网关 + 结算自动化（等外部申请）
- 第三方支付接入（申请中）
- 预授权 / 冻结 / 释放
- 平台 1% 服务费 + 7% 税费自动结算
- 完整取消 / 退款流程

### v1.8 — 界面 & 功能全面可上线
- 智能候选匹配（距离 + 能力）
- 测试覆盖达到基本门槛
- 所有已知代码问题清零

### v2.0 — PostgreSQL + AI 能力库（明确暂停）
- AI 语义搜索
- 距离搜索 + 向量化能力匹配
- 广场内容精细化分发
- 信用体系自动改分

---

## shared 目录里各文件是干什么的

很多文件你可能已经不记得了，这里说清楚：

| 文件 | 用途 | 还有用吗 |
|------|------|---------|
| `PROJECT_RULES.md` | 所有开发规则总纲，AI 开发必读 | ✅ 核心，一直有用 |
| `api/requests.md` | 所有需求条目（R-xxx），唯一需求池 | ✅ 核心，一直有用 |
| `api/registry.md` | 已实现的 API 目录 | ✅ 核心，每次加 API 都要更新 |
| `api/user-api.md` | 用户端 HTTP 合同细节 | ✅ 联调参考 |
| `api/merchant-api.md` | 商家端 HTTP 合同细节 | ✅ 联调参考 |
| `api/error-codes.md` | 错误码语义定义 | ✅ 联调参考 |
| `docs/state-machine.md` | 订单状态机完整定义 | ✅ 核心 |
| `docs/boundaries.md` | 各端职责边界 | ✅ 核心 |
| `docs/glossary.md` | 7 个核心业务词定义 | ✅ 核心 |
| `docs/fulfillment-flow.md` | 交易全流程叙述 | ✅ 参考 |
| `docs/migration-plan.md` | 旧流程迁移风险说明 | 🟡 参考，基本完成 |
| `db/schema-plan.md` | 数据库表职责说明 | ✅ 参考 |
| `db/migration-map.md` | 旧表→新表映射 | 🟡 参考，迁移基本完成 |
| `db/postgres-clean-rewrite.md` | PostgreSQL 计划 | ⏸ 暂停，不用看 |
| `reports/backend-api.md` | 后端阶段报告 | 🟡 历史参考 |
| `reports/user-frontend.md` | 用户端阶段报告 | 🟡 历史参考 |
| `reports/merchant-frontend.md` | 商家端阶段报告 | 🟡 历史参考 |
| `roles/` 目录 | 各端开发边界说明（给 AI 读的） | ✅ AI 开发时参考 |
| `docs/api-*.md`（旧） | 旧版 API 文档，已废弃 | ❌ 不用看 |
| `docs/plan-scratch.md` | 草稿，已废弃 | ❌ 不用看 |
| `STATUS.md`（本文件） | 项目整体现状，给你自己看 | ✅ 随时更新 |

---

## 下一步要做什么（按优先级）

**等外部条件（支付申请）：**
- 支付网关接入 → 然后才能做真实支付、自动结算、退款

**可以现在做的：**
1. 拆分 `MerchantPortalController`（后端代码质量，不影响功能但影响可维护性）
2. 把前端状态判断逻辑改为后端下发 `nextAction`（解决硬编码状态问题）
3. 删除废弃的 `ep/standard-services/[code]/quote/` 目录
4. 明确 `services/` 和 `capabilities/` 的过渡方案

**新功能方向（需要你决策优先级）：**
- 智能匹配候选（P2）
- 完整取消/退款流程（依赖支付）
- 自动化结算（依赖支付）
