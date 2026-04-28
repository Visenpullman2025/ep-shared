# 目标表（P0.5 计划，无 migration）

最后更新：2026-04-28

> 仅**数据模型方向**；**不**在本阶段写 migration。现网以 `expatth-backend/database/schema/mysql-schema.sql` 为准。  
> **必须覆盖**的表与**职责**如下；列级以 P1+ DDL 定稿。

## 1. `standard_services`（StandardService）

- **职责**：平台**标准**服务定义；**主键**与 **`standard_service_code`（唯一）**；多语言名/图/运营开关；**关联**到 **requirement_templates** 的**当前**或**多**版本。  
- **不存**：单商家价、单商家可约（属 **MerchantCapability**）。

## 2. `requirement_templates`（RequirementTemplate）

- **职责**：可版本化的字段/步骤/校验/与计价**元**数据；**外键**或逻辑关联 **standard_service_id**；**template_version**、**status**（draft/published 等，**待实现**定）。  
- **与现网**：承接 `yipai_service_process_templates` 的 **form_schema** 等**拆分/迁移**目标。

## 3. `quote_previews`（QuotePreview）

- **职责**：一次 **POST …/quote-preview** 的**落库**体；**requirement_payload** 快照、**template_version** 引用、**金额/区间/分项** JSON、**expires_at**、**standard_service_id** 外键。  
- **不存**：商家**终局**价（在 **merchant_quote_confirmations**）。

## 4. `merchant_capabilities`（MerchantCapability）

- **职责**：一商户对某 **StandardService**（及地区/标签等子维度，**P1 定**）的**可承接**声明与规则；**外键** `yipai_merchants.id`、`standard_services.id` 等。  
- **与旧**：`yipai_services` 为**历史承载**，迁移期可**二存**或**映射**到本表（**见 migration-map**）。

## 5. `merchant_candidates`（MerchantCandidate）

- **职责**：匹配**实例**；**外键**订单、`quote_previews`（**可选**取决于创建时机）、**merchant**、**status**（`state-machine` 候选表）；**过期**、**选中等**元数据。  
- **不替代**：订单**主**状态机（在 **orders** 上）。

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

## 10. 不删表

- **`yipai_services`**、**`yipai_service_process_templates`**、**`yipai_order_details`**：见 **migration-map**；**不**因新表**删除**。
