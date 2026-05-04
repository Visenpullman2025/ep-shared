# 状态机（目标主态、子实体、与现网映射）

最后更新：2026-05-05（P1b 本地联调闭环）

> 对外稳定字段名建议统一为 **`workflowStatus`**（camelCase，与现网 JSON 习惯一致）；库内列名 **`workflow_status`** 为实现细节。  
> **目标**主态集合为**唯一**产品叙事；现网字值为**事实参照**，通过 **§4 映射** 收敛，**禁止**三处各写一套。

## 1. 订单主状态（目标 `workflowStatus`）

以下名称为**全平台**应使用的**主**流程态（字符串**精确**使用下表 snake_case，与 API 响应一致）。

| 目标 `workflowStatus` | 说明 |
|------------------------|------|
| `draft_requirement` | 已建单或草稿，**RequirementPayload** 未齐或不可生成 **QuotePreview**。 |
| `quote_previewed` | 已存在有效 **QuotePreview**（粗报已出）。 |
| `matching_merchants` | 正生成或更新 **MerchantCandidate**（含轮空、重试）。 |
| `waiting_merchant_confirmation` | 等商家在 **MerchantQuoteConfirmation** 上提交**终局**价与时间。 |
| `waiting_user_confirmation` | 商家已提交 MQC，等**用户**接受/拒绝。 |
| `waiting_payment_or_authorization` | 等用户**支付**或**预授权**（与 `payment_status` 配合）。 |
| `paid_or_authorized` | 已付或已预授权，待开始履约。 |
| `in_service` | 履约中。 |
| `merchant_completed` | 商家侧标记完工。 |
| `customer_completed` | 用户确认完成。 |
| `after_sales` | 售后进行或待结（与 `after_sales_cases` 配合）。 |
| `cancelled` | 已取消。 |
| `refunded` | 已退款（与支付子态、售后协同）。 |

**注**：`refunded` 与 `payment_status=refunded` 常同时出现；若业务上「先售后判责再退」，以 **`api/requests.md`** 与 `after_sales` 子流为准。

## 2. MerchantCandidate 状态（`candidateStatus` 建议字段名）

| 值 | 说明 |
|----|------|
| `pending` | 已生成，未触达/未开始处理。 |
| `invited` | 已触达或已进商家**待办**队列。 |
| `quoted` | 商家已**报价**（**不一定**已生成最终 **MerchantQuoteConfirmation**；若始终合并为一步，可在实现中不暴露 `quoted`）。 |
| `rejected` | 商家拒单/拒绝。 |
| `expired` | 超时。 |
| `selected` | 被用户/系统**选中**为服务方。 |
| `skipped` | 未中选的终局跳过。 |

## 3. MerchantQuoteConfirmation 状态（`mqcStatus` 建议字段名）

| 值 | 说明 |
|----|------|
| `pending` | 已**创建**壳，商家未**提交**终局数据。 |
| `submitted` | 商家已**提交**终局（**等待用户**）。 |
| `accepted_by_user` | **用户**接受。 |
| `rejected_by_user` | **用户**拒绝。 |
| `expired` | 超时。 |
| `cancelled` | 取消。 |

**与 R-20260428-009 的关系**：仅当 MQC 为 **`submitted` 或（实现约定）`accepted_by_user` 后进入支付**时，**`POST /orders/.../confirm-merchant-quote`** 将 MQC 置为 **`accepted_by_user`** 并将订单**推进**至 **`waiting_payment_or_authorization`**（具体以 **`user-api` + requests** 为准，此处为**方向**）。

## 4. 旧 `workflow_status` 与目标 `workflowStatus` 的映射策略（P1 实现；文档先锁）

> 现网默认迁移图（`OrderWorkflowService`）与库 enum 中常见值：`pending_payment`、`pending_merchant_confirm`、`merchant_confirmed`、`in_service`、`merchant_completed`、`customer_completed`、`cancelled`、`refunded` 等（**不**同字即不同集合）。**不在** P0.5 要求后端改 enum。

**策略（合同）**：

1. **对外** API（用户/商家/BFF）在 **P1+** 以 **§1 目标** `workflowStatus` 为**主**展示字段。  
2. **迁移期** 可选在响应中附带 **`legacyWorkflowStatus`**（即当前 DB 原值）**供调试**；**不**对普通用户作主要展示（**待决策**，默认**不**暴露给生产客户端）。  
3. **P1b 本地实现**：`POST /api/v1/orders` 已支持 `standardServiceCode + quotePreviewId` 创建订单；数据库仍写旧 `workflow_status`，API 对外返回目标 `workflowStatus`，并临时返回 `legacyWorkflowStatus` 供联调。
4. **老单**通过后台任务或读时**映射**（**不得**在控制器中散落 if-else 而不读配置表/映射表）。

| 现网/历史上常见 `workflow_status` 片段（示例，非穷举） | 目标 `workflowStatus` 方向（示例映射） |
|--------------------------------------------------------|----------------------------------------|
| `pending_merchant_confirm`（等商家确认时间/单）         | 若**新**链=等**MQC**：`waiting_merchant_confirmation`；**旧**链=等**商家 confirm 动作** 仍可能用该字面值，**P1 洗数** 合并 |
| `merchant_confirmed`                                   | 接近 `paid_or_authorized` 前一步或**已进入排期**；**须**在映射表**按产品**定 |
| `pending_payment`                                     | 目标 **`waiting_payment_or_authorization`** |
| `in_service`                                          | 目标 **`in_service`**（一致） |
| `merchant_completed`                                  | 目标 **`merchant_completed`**（一致） |
| `customer_completed`                                  | 目标 **`customer_completed`**（一致） |
| `cancelled` / `refunded`                              | 目标 **`cancelled` / `refunded`**（一致或补 `after_sales`） |

**本表**为**方向**；当前代码单源在 `OrderWorkflowStatusPresenter`，洗数或长期双写策略仍归 **R-20260428-010**。

## 5. 支付子状态

`yipai_orders.payment_status` 现网常见：`pending` / `paid` / `refunded`。**预授权**若引入，在 **`payment_status` 或扩展字段** 中说明（`api/requests.md` R-003），**不**与 `workflowStatus` 混为同一套字符串。

## 6. `nextAction` 字段

- **含义**：在 **`GET` 订单列表/详情** 等接口中，为**客户端 UI** 提供的**建议下一步**（如 `pay`、`confirm_merchant_quote`、`wait`），**可**为枚举 + 可选参数结构。  
- **不是**：**独立**状态机状态；**不得**用 `nextAction` 代替 **`workflowStatus`** 做**资金与权限**判断。  
- **权威**仍以 **`workflowStatus` + 业务子状态**（`payment_status`、`mqc`/`candidate`）**组合**在服务端**校验**。

## 7. 与现网 `processTemplate.workflow_schema` 的关系

- 若订单仍绑定 **process template**，**模板内**的 `transitions` **可**继续驱动**子**步骤；**平台级**主叙事仍以 **§1** 为准，**不得**在文档中再发明第三套**主**状态名。  
- **合并原则**：**对外**以 **§1** 为纲；**对内**老模板机与 **R-010** 的映射在实现层消化。
