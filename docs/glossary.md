# 术语表（Glossary）

最后更新：2026-04-28

## 核心七词（唯一英文命名，正文与需求编号优先使用）

| 术语 | 含义 | 与代码/表（方向） |
|------|------|------------------|
| **StandardService** | 平台级标准服务定义；用户从首页/类目进入的**标准入口**。 | 目标表 `standard_services`；入口字段 **`standardServiceCode`**。 |
| **RequirementTemplate** | 某标准服务下，平台配置的「要用户填什么」的模板。 | 与现 `yipai_service_process_templates` 的 **form_schema 等**可迁移衔接；P0 不迁库。 |
| **RequirementPayload** | 用户提交的 JSON 需求体；随订单/预览关联。 | 可对应现 `yipai_order_details.process_payload` 的**语义子集/超集**演进。 |
| **QuotePreview** | 系统据模板与算价规则给出的**粗报价**（展示/比作用）。 | 目标表 `quote_previews`；**不等于** `MerchantQuoteConfirmation` 的最终价。 |
| **MerchantCapability** | 某商家在标准服务/类目/地区等维度上的**承接能力**。 | 目标表 `merchant_capabilities`；`yipai_services` 为**旧承载**，语义降级。 |
| **MerchantCandidate** | 匹配结果中的一条候选。 | 目标表 `merchant_candidates`；有独立状态机。 |
| **MerchantQuoteConfirmation** | 商家对订单或候选任务的**终局报价与时间等**的确认记录。 | 目标表 `merchant_quote_confirmations`。 |

## 用户入口字段

- **`standardServiceCode`**：字符串，稳定、可运营配置；**禁止**再把它文档化成「选某个 `serviceId` 商品」作为唯一主叙事。

## 与「旧 service」的并存说法

- **服务配置（旧）** / `yipai_services`：**商家**在后台维护的配置行；对话里可称「**商家服务配置**」，避免说「买商品」。
- **标准服务（新）**：**平台**维度的 `StandardService`，不属单商家；用户先选**标准**，再进入需求与匹配。

## 业务禁用词（叙述层）

在描述本平台的「用户买什么、下什么单」时，**不要用**：`product`、`goods`、`item`（作货品）、`listing`、`shop_service`、`service product`。

技术栈固定词可保留，例如 HTTP **GET/POST**、数据类型 **item**（数组项）、`locale` 等。

## 新词准入

若需新增**面向产品的**业务概念，必须先在本文件**增加一条**，并同步 `api/requests.md` 的关联合同条目；**禁止**在代码或仅在某角色文档中静默发明新主概念（见 `roles/backend-api.md` 禁止项）。
