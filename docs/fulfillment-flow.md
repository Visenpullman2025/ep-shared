# 履约与交易主流程（目标叙述）

最后更新：2026-04-28（P0.5 与**合同**路径一致）

> 与现网实现可能分阶段对齐；**状态名**以 [state-machine.md](state-machine.md) 的**目标**为准，与当前 `workflow_status` 字面值对照见同文件说明。

## 1. 顺序（用户视角）

1. 选择 **StandardService**（`standardServiceCode`）。
2. 按 **RequirementTemplate** 填写，提交 **RequirementPayload**。
3. 系统计算并展示 **QuotePreview**（粗报价；用于预期与展示）。
4. 系统依 **MerchantCapability** 等生成 **MerchantCandidate** 列表或匹配策略结果。
5. 邀请或指定路径下，商家经 **`GET/POST …/merchant/order-requests*`** 与 **`…/quote-confirmation`** 形成 **MerchantQuoteConfirmation**（**终局**价、服务时间、条件，见 `merchant-api` **§4–5**）。  
6. 用户经 **`POST /api/v1/orders/{orderNo}/confirm-merchant-quote`** 确认**接受**该 **MQC**（`user-api` **§5**）；`nextAction` **仅**引导，见 `state-machine` **§6**。  
7. **支付**或**预授权**：**`POST /api/v1/payments/intent`**（`user-api` **§6**；门禁与 **`EX_PAYMENT_NOT_READY`** 见 `error-codes`）。
8. **履约**（上门/远程等，与订单执行状态一致）。
9. **售后**、**评价**、**信用**（`after_sales_cases`、`merchant_credit_*` 等，见 `db/schema-plan.md`）。

## 2. 与旧流程的差异（文档层）

- **旧**：用户从 `GET /api/v1/services` / `GET /api/v1/services/{id}` 选**商家**上架行 → 询价同一条 `serviceId` 下单。  
- **新**：用户先选**平台标准**；**商家行**在匹配与确认阶段进入，**粗报价**与**商家终局价**分属 **QuotePreview** 与 **MerchantQuoteConfirmation**。

## 3. 钱与时间

- **粗报价**可允许区间或多项；**终局**以 **MerchantQuoteConfirmation** 及用户接受为准。  
- 预授权/担保/结算节奏与现 `PaymentSettlementService` 等实现**在 P0 不强制改码**；若与目标冲突，在 **`api/requests.md`** 写清差异与验收。
