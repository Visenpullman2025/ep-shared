# 命名规则（平台业务层）

最后更新：2026-04-28

## 1. 英文标识

- **平台标准服务**：`standardServiceCode`（**Stable** 字符串，运营可配置）；**数据库**中对应 `standard_services.standard_service_code` 或等效列，以 migration 为准。
- **七概念**：`StandardService`、`RequirementTemplate`、`RequirementPayload`、`QuotePreview`、`MerchantCapability`、`MerchantCandidate`、`MerchantQuoteConfirmation`；类名/表名/JSON 子键**一一**对应 **glossary**，**不**用同义多拼（如同一条记录既叫 `Candidate` 又在别处写 `option` 指同一业务事）。

## 2. 请求体与 API JSON

- **camelCase** 为主（与现 `OrderFlowService` 返回、`routes` 上已有风格对齐）；**若**合同规定 snake_case 兼容，在 **registry/requests** 写明。
- 避免 **id** 歧义：同响应中同时有 `orderNo` 与数字 `id` 时，文档**必须**说清**对外主键**是 `orderNo` 还是自增 `id`。

## 3. 与「旧 service」的命名

- 说「**旧**、**商家** 服务配置」时优先写 **`yipai_services`** 或 `merchant service project`，**不**在一句里单独写 `service` 当**用户标准品**。
- 说「**标准**服务」**必须**带 `Standard` 或 `standardServiceCode`，**避免**和商家 `serviceId` 同屏混称。

## 4. 禁止的对外业务词

见 [deprecated-terms.md](deprecated-terms.md)。技术词（`GET`、`locale`、`line item` 在发票语境）**除外**情况在 deprecated 中说明。
