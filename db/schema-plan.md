# 目标表（P2/P3 计划）

最后更新：2026-05-06

状态：accepted

职责边界：本文只写数据库模型方向和表职责；接口合同写入 `../api/*.md`，待实现需求写入 `../api/requests.md`，真实迁移以 `epbkend/expatth-backend/database/migrations` 为准。现网以 `expatth-backend/database/schema/mysql-schema.sql` 为参照。

数据库边界（2026-05-06）：当前 Laravel 默认连接和 Dcat Plus 后台保持 MySQL。PostgreSQL/PostGIS/pgvector/pg_trgm 是 AI、距离搜索和推荐能力的目标方向，但不得直接替换当前 `DB_CONNECTION=mysql`，除非先完成后台替换或 Dcat 数据迁移方案。

当前实现粒度（2026-05-05）：P2/P3 已落地的是最小可联调切片，主要通过 `yipai_orders` 冻结/平台费/结算字段、`yipai_reviews` 广场发布字段、`yipai_fulfillment_events` 履约事件表和既有商户信用事件链路承载。第 10 节独立表是目标模型方向，未迁移前不得在 registry 或验收里宣称这些目标表已全部存在。

当前后台存储边界（2026-05-06）：Dcat Plus 使用 `admin.database.connection`，未单独配置时回落到 Laravel default connection。当前 default connection 为 MySQL，因此 `admin_users`、`admin_roles`、`admin_permissions`、`admin_menu`、`admin_settings`、`admin_extensions` 等后台表属于 MySQL 当前承载范围。

## 1. `standard_services`（StandardService）

- **职责**：平台**标准**服务定义；**主键**与 **`standard_service_code`（唯一）**；多语言名/图/运营开关；**关联**到 **requirement_templates** 的**当前**或**多**版本。  
- **不存**：单商家价、单商家可约（属 **MerchantCapability**）。

## 2. `requirement_templates`（RequirementTemplate）

- **职责**：可版本化的字段/步骤/校验/与计价**元**数据；**外键**或逻辑关联 **standard_service_id**；**template_version**、**status**（draft/published 等，**待实现**定）。  
- **与现网**：承接 `yipai_service_process_templates` 的 **form_schema** 等**拆分/迁移**目标。
- **P2/P3 扩展**：可关联 **WorkflowDefinition** 与策略 code；行业差异通过配置表达，不在控制器硬编码。

## 3. `quote_previews`（QuotePreview）

- **职责**：一次 **POST …/quote-preview** 的**落库**体；**requirement_payload** 快照、**template_version** 引用、**金额/区间/分项** JSON、**expires_at**、**standard_service_id** 外键。  
- **不存**：商家**终局**价（在 **merchant_quote_confirmations**）。

## 4. `merchant_capabilities`（MerchantCapability）

- **职责**：一商户对某 **StandardService**（及地区/标签等子维度，**P1 定**）的**可承接**声明与规则；**外键** `yipai_merchants.id`、`standard_services.id` 等。  
- **与旧**：`yipai_services` 为**历史承载**，迁移期可**二存**或**映射**到本表（**见 migration-map**）。
- **P2/P3 扩展**：承载 `ready_status`、`service_area`、`base_pricing_rule`、`extra_distance_rule`、`capacity_rule`、`availability_rule`、`workflow_policy_code` 等可推荐、可审计字段。

## 5. `merchant_candidates`（MerchantCandidate）

- **职责**：匹配**实例**；**外键**订单、`quote_previews`（**可选**取决于创建时机）、**merchant**、**status**（`state-machine` 候选表）；**过期**、**选中等**元数据。  
- **不替代**：订单**主**状态机（在 **orders** 上）。
- **P2/P3 扩展**：保存 `match_score`、`match_factors`、`distance_km`、`estimated_response_minutes`、`pricing_rank`、`availability_snapshot`，用于解释推荐和复盘。

## 6. `merchant_quote_confirmations`（MerchantQuoteConfirmation）

- **职责**：商家**终局**价、**确认服务时间**、备注、**status**、**对 candidate** 外键；**用户**接受/拒绝的**时间戳**可放本行或**关联**子表（**P1 定**）。

## 7. `yipai_orders`（**现**表，**增列/外键** 方向）

- **不新建**订单主表；在现 **`yipai_orders`** 上**增加**（**语义**名，DDL 在 P1+）：  
  - **`standard_service_id`**（可空，**兼容**期）  
  - **`quote_preview_id`**（可空）  
  - **`selected_candidate_id`**（可空）  
  - **`merchant_quote_confirmation_id`**（可空，**多**确认单时**可能**以「当前有效」一条+历史表或**最新**外键 二选一，**见 migration-map** 待决策）  
- 目标 **`workflowStatus`** 若与现 **`workflow_status`** 列**长期**两存，**不**在 P0.5 定 DDL，**以** `state-machine` **与 R-20260428-010** 落地。

## 8. `yipai_order_details`（**现**表）

- **职责**（保持）：**快照**、**大字段**；`process_payload` 与 **RequirementPayload** 对齐演进；`pricing_snapshot` 与 **QuotePreview/MQC** 的**可审计**关系。

## 9. 售后与信用

| 表名 | 职责 |
|------|------|
| `after_sales_cases` | 售后工单/阶段/与 **订单** 外键；**类型**、证据、**状态**。 |
| `merchant_credit_events` | **计分/事件** 流水（**订单/评价/纠纷** 等可溯源 ID）。 |
| `merchant_credit_profiles` | 商户**当前**信用摘要、**可**与 events **汇总** 校验。 |

## 10. P2/P3 新目标表方向

以下为目标模型，不等同于当前所有迁移均已落地；当前已落地粒度见本文开头“当前实现粒度”。

| 表名 | 职责 |
|------|------|
| `workflow_definitions` | 按 `standard_service_code` 定义行业流程、步骤、策略 code 与版本。首批样板为空调清洗、保洁。 |
| `fulfillment_events` | 订单履约事件流水：开始、商家完工、客户完工、迟到、未履约、争议、结算释放等。 |
| `payment_holds` | 用户平台代管或预授权记录；关联订单、支付渠道、代管金额、平台服务费、释放/退款/结算状态。 |
| `settlement_records` | 商家结算记录；关联订单、商家、结算金额、平台收益、状态与时间。 |
| `customer_credit_events` | 用户侧信用事件；用于恶意取消、争议判责、正常完成等长期评分。 |
| `square_distribution_jobs` | 评价同步广场的脱敏发布任务；记录来源评价、发布状态、匿名策略和失败原因。 |

## 11. 策略字段方向

- **PricingPolicy**：读取 `RequirementPayload`、距离、服务地区、能力规则，输出粗报或终局价建议；金额最终以后端落库为准。
- **MatchingPolicy**：读取商家能力、星级、服务质量、响应速度、距离、价格、档期和就绪状态，输出候选与推荐快照。
- **PenaltyPolicy**：读取履约事件、售后判责和评价，输出信用事件、扣罚和推荐权重调整。

## 12. 不删表

- **`yipai_services`**、**`yipai_service_process_templates`**、**`yipai_order_details`**：见 **migration-map**；**不**因新表**删除**。
